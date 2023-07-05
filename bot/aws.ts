import { ECSClient, ListTasksCommand, ListServicesCommand, RunTaskCommand, StartTaskCommand, ListClustersCommand, DescribeClustersCommand, UpdateClusterCommand, PutClusterCapacityProvidersCommand } from "@aws-sdk/client-ecs";
import { config } from "./utils";

export const AwsUtils = { getEcsClusters, statusEcsClusters }


async function getEcsClusters() {
    const client = new ECSClient({ region: config.env.region });

    const clusters = await client.send(new DescribeClustersCommand({
        clusters: [config.ecs.cluster_name!]
    }))

    const cluster = clusters.clusters?.find(x => x.clusterName === config.ecs.cluster_name);

    console.log(cluster)
    cluster?.defaultCapacityProviderStrategy?.push();

    const res = await client.send(new PutClusterCapacityProvidersCommand({
        cluster: cluster?.clusterName!,
        defaultCapacityProviderStrategy: [{ capacityProvider: "FARGATE", base: 0, weight: 1 }],
        capacityProviders: ["FARGATE"]
    }));

    console.log(res);
    
    
    // find task
    const findTask = await client.send(new ListTasksCommand({
        cluster: config.ecs.cluster_name,
        serviceName: config.ecs.service_name
    }));

    if (findTask?.taskArns?.indexOf(config.ecs.task_definition!)! > -1) {
        return "Minecraft Server already started";
    };

    // start task
    const runTaskCommand = await client.send(new RunTaskCommand({
        taskDefinition: config.ecs.task_definition,
        cluster: config.ecs.cluster_name,
        networkConfiguration: {
            awsvpcConfiguration: {
                subnets: config.ecs.subnets?.split(",")
            }
        },
        capacityProviderStrategy: [{ capacityProvider: "FARGATE", base: 0, weight: 1 }]
    }));

    console.log(runTaskCommand);

    //const serviceList = await client.send(new ListServicesCommand({ cluster: config.ecs.cluster_name }));

    return "Minecraft Server has been started. Wait 1-2 minute(s)"
}

function statusEcsClusters(){

    return "ciao";

}