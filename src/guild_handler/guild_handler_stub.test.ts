import sinon from 'sinon';
import path from 'path';

import Logger from '../logger/logger';
import winston from 'winston';
import Discord from 'discord.js';
import * as mongodb from 'mongodb';
import { drive_v3 } from '@googleapis/drive';

import GuildHandler from './guild_handler';
import { ipc_config } from '../constants/constants';

export const guildTestSettings: {
	guildId?: string,
	guildConfig?: {
		configured?: boolean,
		channelId?: string,
		prefix?: string,
		autoplay?: boolean,
		shuffle?: boolean
		autoplayList?: Array<{
			id: number,
			playlist: number
		}>,
		songIdCount?: number,
		playlistIdCount?: number
	},
	audioConfig?: {
		audio?: {
			name?: string,
			volume?: number,
			normalize?: boolean,
			nightcore?: boolean
		},
		eq?: {
			name?: string,
			eq?: Array<unknown>
		}
	},
	permissionConfig?: {
		[key: string]: string[]
	},
	sourceDataConfig?: {
		gdPlaylists?: Array<{
			id?: number,
			title?: string,
			url?: string,
			songs?: Array<{
				id?: number,
				title?: string,
				type?: string,
				url?: string
				duration?: number,
				thumbnailURL?: number,
				artist?: string,
				live?: boolean,
				reqBy?: string
			}>
		}>,
		ytPlaylists?: Array<{
			id?: number,
			title?: string,
			url?: string,
			songs?: Array<{
				id?: number,
				title?: string,
				type?: string,
				url?: string
				duration?: number,
				thumbnailURL?: number,
				artist?: string,
				live?: boolean,
				reqBy?: string
			}>
		}>,
	}
} = Object.freeze({					// some default data
	guildId: 'testGuild',
	guildConfig: {
		configured: true,
		channelId: 'testChannel',
		prefix: '!testPrefix',
		autoplay: false,
		shuffle: false,
		autoplayList: [],
		songIdCount: 1000,
		playlistIdCount: 1000
	},
	audioConfig: {
		audio: {
			name: 'testAudio',
			volume: 1,
			normalize: false,
			nightcore: false
		},
		eq: {
			name: 'testEQ',
			eq: []
		}
	},
	permissionConfig: {
		'testCommand': ['testRole']
	},
	sourceDataConfig: {
		gdPlaylists: [
			{
				id: 0,
				type: 'gd',
				title: 'testPlaylist1',
				songs: [
					{ id: 0, title: 'testSong1' }
				]
			}
		],
		ytPlaylists: [
			{
				id: 1,
				type: 'yt',
				title: 'testPlaylist2',
				songs: [
					{ id: 1, title: 'testSong2' }
				]
			}
		]
	}
});

export function newStub(settings?: typeof guildTestSettings, noData?: boolean, stubs?: {
	mongodb?: sinon.SinonStubbedInstance<mongodb.MongoClient>,
	discord?: sinon.SinonStubbedInstance<Discord.Client>,
	googleDrive?: sinon.SinonStubbedInstance<drive_v3.Drive>
}) {
	// merge defaults with given arugments
	if (!settings) { settings = {}; }
	let dbData = Object.assign({}, guildTestSettings);
	dbData = Object.assign(dbData, settings);
	if (noData) { dbData = undefined; }

	winston.addColors({
		debug: 'blue',
		info: 'green',
		warn: 'yellow',
		error: 'red',

	});
	const logger = new Logger(ipc_config.gh_ipc_id);

	let DiscordStub = sinon.stub(new Discord.Client({ intents: [] }));
	DiscordStub.login.returns(new Promise((resolve) => resolve('')));

	let MongodbStub = sinon.stub(new mongodb.MongoClient('mongodb+srv://user:pwd@localhost'));
	MongodbStub.connect.callsFake((): Promise<mongodb.MongoClient> => {
		return new Promise((resolve) => resolve(MongodbStub));
	});
	MongodbStub.db.returns({
		collection: () => {
			return {
				findOne: () => {
					return new Promise((resolve) => resolve(dbData));
				},
				insertOne: () => { return; },
				replaceOne: () => { return; }
			};
		}
	} as unknown as mongodb.Db);

	const DriveFilesStub = sinon.stub(new drive_v3.Drive({}).files);
	DriveFilesStub.get.callsFake(
		// @ts-expect-error - Google api typescript definitions are funky
		(a, b, cb) => {
			if (b.responseType === 'stream') {
				cb();
			}
		}
	);
	let DriveStub = {
		files: DriveFilesStub
	} as unknown as sinon.SinonStubbedInstance<drive_v3.Drive>;

	if (stubs) {
		if (stubs.discord) { DiscordStub = stubs.discord; }
		if (stubs.googleDrive) { DriveStub = stubs.googleDrive; }
		if (stubs.mongodb) { MongodbStub = stubs.mongodb; }
	}

	const stub = new GuildHandler(
		dbData.guildId,
		logger,
		DiscordStub as unknown as Discord.Client,
		MongodbStub as unknown as mongodb.MongoClient,
		DriveStub as unknown as drive_v3.Drive
	);

	return stub;
}