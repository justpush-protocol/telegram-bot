import TelegramBot from 'node-telegram-bot-api';
import { config } from 'dotenv';
import cors from 'cors';
import express, { Express } from 'express';
import { getUser, resetMode, setAddress, UserMode } from './model';
import { observeNotifcationsOfRegisteredUsers } from './observe';
import { getTronGridURL } from './tronweb';
import axios from 'axios';

config();

const main = async () => {
  const token = process.env.TOKEN;
  const host = process.env.HOST;
  const port = process.env.PORT;
  const network = process.env.NETWORK;
  const tronProAPIKey = process.env.TRON_PRO_API;
  const dbURL = process.env.DATABASE_URL;

  if (!token) {
    throw new Error('TOKEN is not defined');
  }

  if (!host) {
    throw new Error('HOST is not defined');
  }

  if (!port) {
    throw new Error('PORT is not defined');
  }

  if (!network) {
    throw new Error('NETWORK is not defined');
  }

  if (!tronProAPIKey) {
    throw new Error('TRON_PRO_API is not defined');
  }

  if (!dbURL) {
    throw new Error('DATABASE_URL is not defined');
  }

  const webhookPath = `/bot/${token}`;
  const bot = new TelegramBot(token as string, { webHook: true });
  console.log('Setting webhook host: ' + host);
  await bot.setWebHook(`${process.env.HOST}${webhookPath}`);

  const app: Express = express();
  app.use(cors());
  app.use(express.json());

  app.post(`${webhookPath}`, (req, res) => {
    bot.processUpdate(req.body);
    res.sendStatus(200);
  });

  // Start Express Server
  app.listen(port, () => {
    console.log(`Telegram server is listening on ${host}`);
  });

  bot.onText(/\/start/, async (msg) => {
    await bot.sendMessage(
      msg.chat.id,
      `Hello, Welcome to JustPush telegram bot.\n\nYou can use this bot to recieve push notifications from the groups you have subscribed.\n`
    );

    const user = await getUser(msg.chat.id.toString());
    if (user && !user.wallet) {
      bot.sendMessage(
        msg.chat.id,
        `You monitoring wallet address is not configured yet, please reply with your tron wallet address.`
      );
    }
  });

  bot.onText(/\/change/, async (msg) => {
    const user = await getUser(msg.chat.id.toString());
    await resetMode(user.id);
    bot.sendMessage(
      msg.chat.id,
      `You are reseting your monitoring address. Please reply with your tron wallet address.`
    );
  });

  bot.onText(/.*/, async (msg) => {
    if (msg.text) {
      switch (msg.text) {
        case '/start':
        case '/done':
        case '/change':
          break;
        default:
          const user = await getUser(msg.chat.id.toString());
          if (user.mode == UserMode.Registered) {
            await bot.sendMessage(
              msg.chat.id,
              `You have already registered an account.\nConfigured wallet address is: ${user.wallet}\n\nYou will be getting your subscribed notifications on this chat.\n\nIf you want to change address reply with /change`,
              {
                reply_markup: {
                  keyboard: [
                    [
                      {
                        text: '/done'
                      }
                    ],
                    [
                      {
                        text: '/change'
                      }
                    ]
                  ]
                }
              }
            );
            return;
          }

          if (user.mode == UserMode.RegistrationMode) {
            // check if the input is a valid tron address
            const words = msg.text.split(/(\s+)/);
            if (words.length === 0) {
              await bot.sendMessage(msg.chat.id, `Invalid input.`);
              return;
            }

            const address = words[0];

            let validTronAddress = false;
            let host = getTronGridURL(network);
            const result = await axios.post<{ result: boolean }>(
              host + '/wallet/validateaddress',
              {
                address
              }
            );
            validTronAddress = result.data.result;

            if (validTronAddress) {
              await setAddress(user.id, address);
              await bot.sendMessage(
                msg.chat.id,
                `You have configured your wallet address (${address}). You are all set.\n\nWhen there is any notification on your subscribed groups, you will get them here.`
              );
            } else {
              await bot.sendMessage(msg.chat.id, `Invalid input.`);
            }
          }
          return;
      }
    }
  });

  observeNotifcationsOfRegisteredUsers(bot);
};

main();
