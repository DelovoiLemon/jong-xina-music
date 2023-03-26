import winston from 'winston';

import GHInterface from '../guild_handler/guild_handler_interface';
import { bot_master_config } from '../constants/constants';
import Logger from '../logger/logger';

/**
 * @name BotMaster
 * Handles adding, getting, and removing guild handlers
 */
export default class BotMaster {
	private _log: Logger;
	private _guildList: { [key: string]: GHInterface };

	/**
	 * @param logger - logger object
	 */
	constructor(logger: Logger) {
		this._log = logger;
		this._guildList = {};
	}

	/**
	 * @name getGuild()
	 * Returns GuildHandler Interface for guild with matching id
	 * @param id - discord guild id
	 * @return GHInterface or undefined if not found
	 */
	getGuild(id: string): GHInterface | undefined { return this._guildList[id]; }

	/**
	 * @name newGuild()
	 * Checks if guild already has a handler
	 * if not, creates a handler
	 * @param id - discord guild id string
	 */
	newGuild(id: string): void {
		if (!this.getGuild(id)) {
			const newGuild = new GHInterface(id, this._log);
			this._guildList[id] = newGuild;
		}
	}

	/**
	 * @name removeGuild()
	 * Removes guild handler with matching id
	 * @param id - discord guild id string
	 */
	removeGuild(id: string): void {
		this._guildList[id].removeGuild();
		this._guildList[id] = undefined;
	}
}