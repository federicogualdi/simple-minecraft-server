import TelegramBot from 'node-telegram-bot-api';
import { AwsUtils } from './aws';
import { ECSServiceException, } from '@aws-sdk/client-ecs';
import { config } from './utils';

// Create a bot that uses 'polling' to fetch new updates
const bot = new TelegramBot(config.env.telegram_bot_token!, { polling: true });

// Matches "/echo [whatever]"
bot.onText(/\/echo (.+)/, (msg, match) => {
    // 'msg' is the received Message from Telegram
    // 'match' is the result of executing the regexp above on the text content
    // of the message

    const chatId = msg.chat.id;
    const resp = match![1]; // the captured "whatever"

    console.log(resp)

    // send back the matched "whatever" to the chat
    bot.sendMessage(chatId, resp);
});

bot.on('message', async (msg) => {
    const chatId = msg.chat.id;

    let response = "Default Msg";

    switch (msg?.text) {
        case "/startMC":
            response = await startMC();
            break;
        case "/statusMC":
            response = await statusMC();
            break;
        case "federico":
            response = "/startMC\n/statusMC";
            break;
    }

    // send a message to the chat acknowledging receipt of their message
    bot.sendMessage(chatId, response);
});

async function startMC() {

    let response = "";

    try {
        response = await AwsUtils.getEcsClusters();
    } catch (e) {

        if (e instanceof ECSServiceException) {
            response = "ECSServiceException: " + e.message;
        } else {
            console.error(e)
        }
    }

    return response;
}

async function statusMC() {

    let response = "";

    try {
        response = await AwsUtils.statusEcsClusters();
    } catch (e) {

        if (e instanceof ECSServiceException) {
            response = "ECSServiceException: " + e.message;
        } else {
            console.error(e)
        }
    }

    return response;
}