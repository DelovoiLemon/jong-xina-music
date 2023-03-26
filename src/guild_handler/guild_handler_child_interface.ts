import fs from 'fs';
import Discord, { GatewayIntentBits } from 'discord.js';
import * as mongodb from 'mongodb';
import { drive_v3 } from '@googleapis/drive';
import { AuthPlus } from 'googleapis-common';
import path from 'path';

import Logger from '../logger/logger';
import GuildHandler from './guild_handler';
import { DeleteRes, InteractionRes, MessageRes, ParentCommand } from './discord_types';
import { gh_config, ipc_config, web_config } from '../constants/constants';

const logger = new Logger(ipc_config.gh_ipc_id);


let guildHandler: GuildHandler;
process.on('message', async (message: ParentCommand) => {
	switch (message.type) {
		case ('start'): {
			const id = message.content;

			// Create discord client
			const discordClient = new Discord.Client({			// set intent flags for bot
				intents: [
					GatewayIntentBits.Guilds,					// for accessing guild roles
					GatewayIntentBits.GuildVoiceStates,			// for checking who is in vc and connecting to vc
				],
			});
			discordClient.login(gh_config.discord_token);

			// Authenticate with mongodb
			let mongoClient: mongodb.MongoClient;
			try {
				logger.profile('(2.0) Authenticate Mongodb');
				logger.info('Connecting to mongodb database');

				// connect to mongodb database
				mongoClient = new mongodb.MongoClient(gh_config.mongodb_uri);
				await mongoClient.connect();
				logger.profile('(2.0) Authenticate Mongodb');
			}
			catch (e) {
				logger.profile('(2.0) Authenticate Mongodb');
				logger.error(`{error:${e.message}} while authenticating with mongodb`, e);
				process.exit();
			}



			// Authenticate with google drive api
			let drive: drive_v3.Drive;
			try {
				logger.profile('(2.1) Authenticate Google Drive');
				logger.info('Authenticating with Google Drive API');

				const authPlus = new AuthPlus();
				const auth = new authPlus.OAuth2(web_config.google_client_id, web_config.google_client_secret, web_config.google_redirect_uri);
				const token = fs.readFileSync(web_config.google_token_loc).toString();
				auth.setCredentials(JSON.parse(token));
				drive = new drive_v3.Drive({ auth });

				logger.profile('(2.1) Authenticate Google Drive');
				logger.info('Successfully authenticated with Google Drive API');
			}
			catch (e) {
				logger.profile('(2.1) Authenticate Google Drive');
				logger.error(`{error:${e.message}} while authenticating with google drive`, e);
				process.exit();
			}

			guildHandler = new GuildHandler(
				id,
				logger,
				discordClient,
				mongoClient,
				drive
			);
			guildHandler.initHandler();
			break;
		}
		case ('message'): {
			const success = await guildHandler.messageHandler(message.content);
			const response: MessageRes = {
				responseId: message.responseId,
				content: { success }
			};
			process.send(response);
			break;
		}
		case ('interaction'): {
			const success = await guildHandler.interactionHandler(message.content);
			const response: InteractionRes = {
				responseId: message.responseId,
				content: { success }
			};
			process.send(response);
			break;
		}
		case ('removeGuild'): {
			const done = await guildHandler.removeGuild(message.content.purge);
			const response: DeleteRes = {
				responseId: message.responseId,
				content: { done }
			};
			process.send(response);
			break;
		}
	}
});

process
	.on('unhandledRejection', (reason, p) => {
		process.send(`${reason} Unhandled Rejection at Promise ${p}`);
		process.exit();
	})
	.on('uncaughtException', err => {
		console.error(err, 'Uncaught Exception thrown');
		process.exit();
	});