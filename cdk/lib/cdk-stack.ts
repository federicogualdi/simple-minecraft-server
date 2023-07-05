import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as ecs from 'aws-cdk-lib/aws-ecs';
import { Construct } from 'constructs';


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
    imageVersion: process.env.MINECRAFT_IMAGE_VERSION || 'latest',
    autoStop: {
      isEnabled: process.env.ENABLE_AUTOSTOP || "FALSE",
      timeoutInit: process.env.AUTOSTOP_TIMEOUT_INIT || "",
      timeoutEst: process.env.AUTOSTOP_TIMEOUT_EST || ""
    }
  }
}

export class CdkStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, { ...props, env: config.env });

    // create VPC
    const vpc = ec2.Vpc.fromLookup(this, 'VPC', { isDefault: true });

    const ecsCluster = new ecs.Cluster(this, config.minecraft.service_name + '-ecs-cluster', {
      clusterName: config.minecraft.service_name,
      vpc: vpc,
      containerInsights: true,
    });

    const taskDefinition = new ecs.FargateTaskDefinition(this, config.minecraft.service_name + '-task', {
      cpu: 1024,
      memoryLimitMiB: 2048
    });

    taskDefinition.addContainer(config.minecraft.service_name, {
      containerName: config.minecraft.service_name,
      image: ecs.ContainerImage.fromRegistry("docker.io/itzg/minecraft-server:latest"),
      environment: {
        EULA: config.minecraft.acceptEula,
        ENABLE_AUTOSTOP: config.minecraft.autoStop.isEnabled,
        AUTOSTOP_TIMEOUT_INIT: config.minecraft.autoStop.timeoutInit,
        AUTOSTOP_TIMEOUT_EST: config.minecraft.autoStop.timeoutEst,
      },
      portMappings: [
        {
          name: config.minecraft.service_name,
          containerPort: config.minecraft.port,
          hostPort: config.minecraft.port,
        },
      ],
      logging: ecs.LogDrivers.awsLogs({ streamPrefix: config.minecraft.service_name + '-group', logRetention: 1 }),
    });

    // Crea un nuovo security group
    const securityGroup = new ec2.SecurityGroup(this, 'MinecraftSecurityGroup', {
      vpc: vpc,
      allowAllOutbound: true, // Consente tutte le connessioni in uscita
    });
    securityGroup.addIngressRule(ec2.Peer.anyIpv4(), ec2.Port.tcp(config.minecraft.port), 'Allow inbound Minecraft traffic');

    // Create a load-balanced Fargate service and make it public
    const fargate = new ecs.FargateService(this, config.minecraft.service_name + "-fargate", {
      cluster: ecsCluster,
      desiredCount: 0,
      securityGroups: [securityGroup],
      taskDefinition: taskDefinition,
      assignPublicIp: true,
    });

    // Add a CloudFormation output to display the public IP address
    new cdk.CfnOutput(this, 'PublicIP', {
      value: ""
    });
  }
}