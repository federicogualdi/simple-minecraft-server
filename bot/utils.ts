require('dotenv').config()

export const config = {
    env: {
      //account: process.env.CDK_DEFAULT_ACCOUNT,
      region: process.env.CDK_DEFAULT_REGION,
      telegram_bot_token: process.env.TELEGRAM_BOT_TOKEN
    },
    minecraft: {
      service_name: process.env.SERVICE_NAME || 'minecraft',
    },
    ecs: {
      cluster_name: process.env.SERVICE_NAME,
      service_name: process.env.ECS_SERVICE_NAME,
      task_definition: process.env.ECS_TASK_DEFINITION,
      subnets: process.env.ECS_SUBNETS,
    }
  }