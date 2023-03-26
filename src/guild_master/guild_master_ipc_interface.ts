import IPCInterface from '../ipc_template/ipc_interface';
import Logger from '../logger/logger';
import GuildHandler from '../guild_handler/guild_handler';
import { ipc_config } from '../constants/constants';
import { GuildMasterFunctions } from './guild_master';

export class GuildMasterInterface extends IPCInterface<GuildMasterFunctions>{
	private _guildList: { [key: string]: GuildHandler };

    constructor(logger: Logger) {
		super(ipc_config.g_master_ipc_id, logger);
        this._guildList = {};
	}
	/**
	 * @name getGuild()
	 * Returns GuildHandler Interface for guild with matching id
	 * @param id - discord guild id
	 * @return GHInterface or undefined if not found
	 */
	async getGuild(id: string): Promise<GuildHandler | undefined> { 
		return this.RequestFunction(GuildMasterFunctions.getGuild, [id]); 
	}

	/**
	 * @name newGuild()
	 * Checks if guild already has a handler
	 * if not, creates a handler
	 * @param id - discord guild id string
	 */
	
	async newGuild(id: string): Promise<void> {
		return this.RequestFunction(GuildMasterFunctions.getGuild, [id]);
	}

	/**
	 * @name removeGuild()
	 * Removes guild handler with matching id
	 * @param id - discord guild id string
	 */
	rmGuild(id: string): Promise<void> {
		return this.RequestFunction(GuildMasterFunctions.rmGuild, [id]);	
	}
};