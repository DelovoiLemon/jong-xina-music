import Logger from "../../logger/logger";
import GuildHandler from "../guild_handler";

export enum GHChildFunctions {
    Start,
    Message,
    Interaction,
    RemoveGuild
}

export type MessageInfo = {			// Represents a discord message
	id: string,						// message id
	content: string,				// message content
	channelId: string				// discord channel id for where message is from
	authorId: string				// discord user id for author of message
}

export type InteractionInfo = {		// Represents a discord interaction
	customId: string,				// custom id of interaction
	authorId: string,				// id of user who click the interaction
	parentMessageId: string,		// message id of parent message
	parentChannelId: string,		// channel if of parent message
}

export default class GHChild {
    private log_: Logger;
    private guild_handler: GuildHandler;
    /**
     * @param logger - logger
     */
    constructor(logger: Logger, id: string) {
        this.log_ = logger;
        this.guild_handler = new GuildHandler(id, logger);
    }

    async message(content: MessageInfo) {
        await this.guild_handler.messageHandler(content);
    }
    
    async interaction(content: InteractionInfo) {
        await this.guild_handler.interactionHandler(content);
    }
    async removeGuild(purge: boolean) {
        await this.guild_handler.rmGuild(purge);
    }
}