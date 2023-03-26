
import Logger from '../logger/logger';
import GuildHandler from '../guild_handler/guild_handler';

export enum GuildMasterFunctions {
    getGuild,
	newGuild,
	rmGuild,
}

/**
 * @name GuildMaster
 * Handles adding, getting, and removing guild handlers
 */
export default class GuildMaster {
	private _log: Logger;
	private _guildList: { [key: string]: GuildHandler };

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
	getGuild(id: string): GuildHandler | undefined { return this._guildList[id]; }

	/**
	 * @name newGuild()
	 * Checks if guild already has a handler
	 * if not, creates a handler
	 * @param id - discord guild id string
	 */
	newGuild(id: string): void {
		if (!this.getGuild(id)) {
			const newGuild = new GuildHandler(id, this._log);
			this._guildList[id] = newGuild;
		}
	}

	/**
	 * @name removeGuild()
	 * Removes guild handler with matching id
	 * @param id - discord guild id string
	 */
	rmGuild(id: string): void {
		this._guildList[id].rmGuild();
		this._guildList[id] = undefined;
	}
}