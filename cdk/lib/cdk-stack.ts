import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as ecs from 'aws-cdk-lib/aws-ecs';
import * as autoscaling from 'aws-cdk-lib/aws-autoscaling';
import { Construct } from 'constructs';

import * as fs from 'fs';

require('dotenv').config()

const config = {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION
  },
  minecraft: {
    service_name: process.env.SERVICE_NAME || 'minecraft',
    port: Number(process.env.MINECRAFT_PORT || 25565),
    acceptEula: process.env.ACCEPT_EULA || "FALSE",
    imageVersion: process.env.MINECRAFT_IMAGE_VERSION || 'latest'
  }
}


export class CdkStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, { ...props, env: config.env });

    // create VPC
    const defaultVpc = ec2.Vpc.fromLookup(this, 'VPC', { isDefault: true });

    // create IAM Role
    const role = new iam.Role(
      this,
      config.minecraft.service_name + '-role', // this is a unique id that will represent this resource in a Cloudformation template
      { assumedBy: new iam.ServicePrincipal('ec2.amazonaws.com') }
    );
    role.addManagedPolicy(iam.ManagedPolicy.fromAwsManagedPolicyName('logs:CreateLogGroup'));
    role.addManagedPolicy(iam.ManagedPolicy.fromAwsManagedPolicyName('logs:CreateLogStream'));
    role.addManagedPolicy(iam.ManagedPolicy.fromAwsManagedPolicyName('logs:PutLogEvents'));

    //create SG
    const securityGroup = new ec2.SecurityGroup(
      this,
      config.minecraft.service_name + '-sg',
      {
        vpc: defaultVpc,
        allowAllOutbound: true,
        securityGroupName: config.minecraft.service_name + '-sg',
      }
    );

    securityGroup.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(config.minecraft.port),
      'Allows MINECRAFT access from Internet'
    );

    const autoScalingGroup = new autoscaling.AutoScalingGroup(this, config.minecraft.service_name + '-asg', {
      vpc: defaultVpc,
      role: role,
      securityGroup: securityGroup,
      autoScalingGroupName: config.minecraft.service_name,
      maxCapacity: 1,
      instanceType: ec2.InstanceType.of(
        ec2.InstanceClass.T4G,
        ec2.InstanceSize.MICRO
      ),
      machineImage: ec2.MachineImage.latestAmazonLinux2({
        cpuType: ec2.AmazonLinuxCpuType.ARM_64
      }),
    });

    autoScalingGroup.addUserData(
      fs.readFileSync('lib/init.sh', 'utf8')
    );

    const taskDefinition = new ecs.Ec2TaskDefinition(this, 'TaskDef');

    taskDefinition.addContainer(config.minecraft.service_name, {
      image: ecs.ContainerImage.fromRegistry("docker.io/itzg/minecraft-server:latest"),
      memoryLimitMiB: 1024,
      environment: {
        "EULA": config.minecraft.acceptEula
      },
      portMappings: [
        {
          containerPort: 25565,
          hostPort: config.minecraft.port,
        },
      ],
      entryPoint: [],
      logging: ecs.LogDrivers.awsLogs({ streamPrefix: config.minecraft.service_name + '-group', logRetention: 1 }),
    });

    const ecsCluster = new ecs.Cluster(this, config.minecraft.service_name + '-ecs-cluster', {
      clusterName: config.minecraft.service_name,
      vpc: defaultVpc,
    });

    const capacityProvider = new ecs.AsgCapacityProvider(this, 'AsgCapacityProvider', {
      autoScalingGroup: autoScalingGroup,
    });
    ecsCluster.addAsgCapacityProvider(capacityProvider);

    const ecsService = new ecs.Ec2Service(this, config.minecraft.service_name + '-ecs-service', {
      cluster: ecsCluster,
      taskDefinition: taskDefinition,
    });

    // print your minecraft server IP
    new cdk.CfnOutput(this, config.minecraft.service_name + 'output', {
      value: ""
    });
  }
}