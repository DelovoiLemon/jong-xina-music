import winston from 'winston';

import GHInterface from './GHParentInterface';
import getEnv from './config';
/**
 * BotMaster
 *
 * Handles adding, getting, and removing guild handlers
 */
export default class BotMaster {
	private _log: winston.Logger;
	private config: ReturnType<typeof getEnv>;
	private _guildList: { [key: string]: GHInterface };		// stores all guilds

	constructor(logger: winston.Logger, config: ReturnType<typeof getEnv>) {
		this._log = logger;
		this.config = config;
		this._guildList = {};
	}

	/**
	 * getGuild()
	 *
	 * Returns GuildHandler for guild with matching id
	 * @param id - discord guild id string
	 * @return guildHandler or undefined if not found
	 */
	getGuild(id: string): GHInterface | undefined { return this._guildList[id]; }

	/**
	 * newGuild()
	 *
	 * checks if guild already has a handler
	 * if not, creates a handler
	 * @param id - discord guild id string
	 */
	newGuild(id: string) {
		if (!this.getGuild(id)) {
			const newGuild = new GHInterface(id, this._log, this.config);
			this._guildList[id] = newGuild;
		}
	}

	/**
	 * removeGuild()
	 *
	 * Removes guild handler with matching id
	 * @param id - discord guild id string
	 */
	removeGuild(id: string): void {
		this._guildList[id].removeGuild();
		this._guildList[id] = undefined;
	}
}