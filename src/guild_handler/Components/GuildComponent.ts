import Logger from '../../logger/logger';
import GuildHandler from '../guild_handler';

/**
 * Guild Component
 *
 * Makes functions for guild compontents easier to use
 */
export default class GuildComponent {
	guildHandler: GuildHandler;	// guild handler
	logger: 	  Logger;		// logger functions
	

	/**
	 * @param guildHandler
	 */
	constructor(guildHandler: GuildHandler) {
		this.guildHandler = guildHandler;
		this.logger = new Logger("Xina-Music-Guild-Component");
	}

	
	debug = (msg: string) => this.logger.debug(msg);
	info  = (msg: string) => this.logger.info(msg);
	warn  = (msg: string) => this.logger.warn(msg);
	error = (msg: string) => this.logger.error(msg);

	// bot components
	get bot() { return this.guildHandler.bot; }
	get guild() { return this.guildHandler.guild; }
	get data() { return this.guildHandler.data; }
	get ui() { return this.guildHandler.ui; }
	get queue() { return this.guildHandler.queue; }
	get vcPlayer() { return this.guildHandler.vcPlayer; }
}
