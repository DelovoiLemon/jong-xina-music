import Discord, { Events } from 'discord.js';
import { guild_config } from '../constants/constants';
import IPCInterface from "../ipc_template/ipc_interface";
import Logger from "../logger/logger";

import UI from './Components/UI';
import GuildConfig from './Components/Data/GuildData';
import CommandPermissions from './Components/PermissionChecker';
import VCPlayer from './Components/VCPlayer/VCPlayer';
import Queue from './Components/Queue';
import Search from './Components/Search';
import { InteractionInfo, MessageInfo } from './gh_child/gh_child';

export enum GuildHandlerFunctions {
    rmGuild,
}

export default class GuildHandler {
    private log_: Logger;
    
    private _ready: boolean;				// bot ready or not
	bot: Discord.Client;					// bot client
	guild: Discord.Guild;					// bot guild

    ui: UI;									// ui component
	data: GuildConfig;						// guildData component
	vcPlayer: VCPlayer;						// vcPlayer component
	queue: Queue;							// queue component
	permissions: CommandPermissions;		// permissions component
	search: Search;							// search component

    constructor(id: string, logger: Logger) {
        this.log_ = logger;
		this.log_.info(`Creating guild handler for guild id: ${id}`);

        // Create discord client
		this.bot = new Discord.Client({							// set intent flags for bot
			intents: [
				Discord.GatewayIntentBits.Guilds,			    // for accessing guild roles
				Discord.GatewayIntentBits.GuildVoiceStates,		// for checking who is in vc and connecting to vc
                Discord.GatewayIntentBits.GuildMessages,			// for creating and deleting messages
				Discord.GatewayIntentBits.GuildMessageTyping,
                Discord.GatewayIntentBits.GuildMessageReactions,	// for adding and removing message reactions
			],
		});

        this._ready = false;
        this.bot.once(Events.ClientReady, () => {
			// get the guild object
			this.guild = this.bot.guilds.cache.get(this.data.guildId);

			// set up guild components
			this.ui = new UI(this);
			this.vcPlayer = new VCPlayer(this);
			this.queue = new Queue(this);
			this.permissions = new CommandPermissions(this);
			this.search = new Search(this);

			// bot is now ready
			this._ready = true;
			this.log_.info('Logged into discord, guild handler is ready!');

			// if not configured, log for helping debugging
			if (!this.data.guildSettings.configured) {
				this.log_.info(`This guild has not been configured, waiting "${this.data.guildSettings.prefix}set-channel" command`);

				// Get first text channel and send setup message
				const defaultChannel = this.guild.channels.cache.filter(channel => channel.type === Discord.ChannelType.GuildText).first();
				this.log_.debug(`Found default channel with {id:${defaultChannel.id}} to send setup message to`);
				this.ui.sendNotification(`Thanks for inviting me! Type "${this.data.guildSettings.prefix}set-channel" to choose the channel I'll reside in.`);
			}
			else {
				// Send UI otherwise
				this.log_.debug(`Bot has been configured, sending UI to {channel:${this.data.guildSettings.channelId}}`);
				this.ui.sendUI(true);
			}
		});

        // get guild data, once data is ready, log into discord
		this.log_.debug('Fetching guild data from database.');
		this.data = new GuildConfig(this, id, () => {
			this.log_.info('Guild data ready, logging in to discord.');
			this.bot.login(guild_config.discord_token);
		});
    }

    /**
	 * messageHandler()
	 *
	 * Handles all messages the bot recieves
	 * @param message - object with message info object
	 * @returms Promise resolves to true if handled message, false if not
	 */
	async messageHandler(message: MessageInfo): Promise<boolean> {
		// ignore if bot isn't ready yet
		if (!this._ready) {
			this.log_.debug('Recieved {messageId: ${message.id}} with {content: ${message.content}} and {prefix: ${prefix}} from {userId: ${message.authorId}} in {channelId: ${message.channelId}} before bot was ready, ignoring');
			return false;
		}
		// ignore if not in right channel
		if (message.channelId !== this.data.guildSettings.channelId && message.content.toLowerCase().indexOf('set-channel') === -1) return false;

		// split message into command and argument
		message.content = message.content.toLowerCase();
		let prefix = false;
		if (message.content.startsWith(this.data.guildSettings.prefix)) {
			prefix = true;
			message.content = message.content.slice(this.data.guildSettings.prefix.length, message.content.length);
		}
		const msg = message.content;
		const command = msg.slice(0, msg.indexOf(' '));
		const argument = msg.slice(msg.indexOf(' '));
		this.log_.debug(`Recieved {messageId: ${message.id}} with {content: ${message.content}} and {prefix: ${prefix}} from {userId: ${message.authorId}} in {channelId: ${message.channelId}}. Parsed {command: ${command}}, {argument: ${argument}}`);

		// check permissions for command then handle each command
		if (await this.permissions.checkMessage(command, message)) {
			switch (command) {
				case ('set-channel'): {
					this.log_.info('Recieved "set-channel" command');
					// Set channel id to channel id of incoming message
					if (message.channelId === this.data.guildSettings.channelId) {
						// if channel id matches the current channel id
						this.log_.debug('New channel id matches current channel id, sending notification');
						this.ui.sendNotification(`<@${message.authorId}> Miku already lives here!`);
					}
					else if (prefix) {
						// set the channel, send ui, then notify user if this is the first time
						this.log_.info(`Guild handler channel id set to "${message.channelId}"`);
						this.data.guildSettings.channelId = message.channelId;
                        console.log(this.data.guildSettings.channelId);
						this.ui.sendUI(true);

						if (!this.data.guildSettings.configured) {
							this.log_.debug('First time guild has been configured, sending introduction message');
							this.ui.sendNotification(`<@${message.authorId}> This is where miku will live. You no longer need to use the prefix as all messages sent to this channel will be interpreted as commands and will be deleted after the command is executed.`);
							this.data.guildSettings.configured = true;
						}
					}
					break;
				}
				case ('join'): {
					this.log_.info('Recieved "join" command, joining voice channel');
					// join the vc
					this.vcPlayer.join(message.authorId);
					break;
				}
				case ('play'): {
					this.log_.info('Recieved "play" command');
					// if not connected to vc, connect
					if (!this.vcPlayer.connected) {
						this.log_.info('Not in voice channel, joining');
						const joined = await this.vcPlayer.join(message.authorId);
						if (!joined) {
							this.log_.warn('Did not successfully join voice channel, will not try to play song');
							break;
						}
					}

					// if there is an argument, means to play/add song to queue
					if (argument) {
						// search for song
						this.log_.info('Argument detected, searching for song');
						this.search.search(argument);
						break;
					}

					// if no arguments, check if already playing a song
					// if so, should resume
					if (this.vcPlayer.playing) {
						this.log_.info('No Arguments detected and currently playing song, resuming playback');
						this.vcPlayer.resume();
						break;
					}

					// should start playing from autoplay
					this.log_.info('Nothing playing right now and no arguments detected, playing what\'s next in the queue');
					this.queue.nextSong();
					break;
				}
				case ('pause'): {
					this.log_.info('Recieved "pause" command');
					// Pause the player if currently playing
					if (this.vcPlayer.playing) {
						this.log_.info('Currently playing song, pausing');
						this.vcPlayer.pause();
					}
					else {
						this.log_.info('Not currently playing, nothing to pause, sending notification');
						this.ui.sendNotification('Nothing to pause!');
					}
					break;
				}
				case ('resume'): {
					this.log_.info('Recieved "resume" command');

					if (this.vcPlayer.playing) {
						this.log_.info('Currently playing song, resuming');
						this.vcPlayer.resume();
					}
					else {
						this.log_.info('Not currently playing, nothing to pause, sending notification');
						this.ui.sendNotification('Nothing to resume!');
					}
					break;
				}
				case ('stop'): case ('leave'): {
					this.log_.info('Recieved "stop" command, leaving voice channel');
					this.vcPlayer.leave();
					break;
				}
				case ('skip'): case ('next'): {
					this.log_.info('Recieved "skip" command, ending current song early');
					this.vcPlayer.finishedSong();
					break;
				}
				case ('repeat-song'): case ('repeat'): case ('rs'): {
					this.log_.info('Recieved "repeat-song" command');

					let count;
					const parsed = parseInt(argument);
					if (!isNaN(parsed)) {
						this.log_.debug(`Successfully parsed {integer:${parsed}} from argument`);
						count = parsed;
					}
					else {
						if (argument.indexOf('infinite') !== -1 || argument.indexOf('infinity') !== -1) {
							this.log_.debug('Argument contained "infinite" or "infinity", setting repeat count to -1');
							count = -1;
						}
						else {
							this.log_.debug('Failed to parse integer from command nor did it contain "infinite" or "infinity", sending notification');
							this.ui.sendNotification(`<@${message.authorId}> "${argument}" is not a number!`);
							break;
						}
					}

					this.log_.info(`Setting repeat song count to {count:${count}}`);
					this.queue.setRepeatSong(count);
					break;
				}
				case ('repeat-queue'): case ('rq'): {
					this.log_.info('Recieved "repeat-queue" command');

					let count;
					const parsed = parseInt(argument);
					if (!isNaN(parsed)) {
						this.log_.debug(`Successfully parsed {integer:${parsed}} from argument`);
						count = parsed;
					}
					else {
						if (argument.indexOf('infinite') !== -1 || argument.indexOf('infinity') !== -1) {
							this.log_.debug('Argument contained "infinite" or "infinity", setting repeat count to -1');
							count = -1;
						}
						else {
							this.log_.debug('Failed to parse integer from command nor did it contain "infinite" or "infinity", sending notification');
							this.ui.sendNotification(`<@${message.authorId}> "${argument}" is not a number!`);
							break;
						}
					}

					this.log_.info(`Setting repeat queue count to {count:${count}}`);
					this.queue.setRepeatQueue(count);
					break;
				}
				case ('shuffle'): case ('toggle-shuffle'): {
					this.log_.info('Recieved "toggle-shuffle" command');

					let state = undefined;
					if (argument.indexOf('on') !== -1 || argument.indexOf('true') !== -1) {
						this.log_.debug('Argument contained "on" or "true", setting state to true');
						state = true;
					}
					else if (argument.indexOf('off') !== -1 || argument.indexOf('false') !== -1) {
						this.log_.debug('Argument contained "off" or "false", setting state to false');
						state = false;
					}

					this.log_.info(`Setting shuffle to {state:${state}}`);
					this.queue.toggleShuffle(state);
					break;
				}
				case ('show-queue'): case ('sq'): {
					this.log_.info('Recieved "show-queue" command');

					let page = 1;
					const parsed = parseInt(argument);
					if (!isNaN(parsed)) {
						this.log_.debug(`Successfully parsed {integer:${parsed}} from argument`);
						page = parsed;
					}
					else { this.log_.debug('Failed to parse integer from argument, seting page to 1'); }

					this.log_.info(`Showing page: ${page} of queue`);
					this.queue.showPage(page);
					break;
				}
				case ('clear-queue'): case ('cq'): {
					this.log_.info('Recieved "clear-queue" command, clearing queue');
					this.queue.clearQueue();
					break;
				}
				case ('remove'): {
					this.log_.info('Recieved "remove" command');

					let index;
					const parsed = parseInt(argument);
					if (!isNaN(parsed)) {
						this.log_.debug(`Successfully parsed {integer:${parsed}} from argument`);
						index = parsed;
					}
					else {
						this.log_.debug('Failed to parse integer from argument, will not remove a song, sending notification');
						this.ui.sendNotification(`<@${message.authorId}> "${argument}" is not a number!`);
						break;
					}

					this.log_.info(`Removing song with index: ${index}`);
					this.queue.removeSong(index);
					break;
				}
				case ('advance'): {
					this.log_.info('Recieved "advance" command');

					let index;
					const parsed = parseInt(argument);
					if (!isNaN(parsed)) {
						this.log_.debug(`Successfully parsed {integer:${parsed}} from argument`);
						index = parsed;
					}
					else {
						this.log_.debug('Failed to parse integer from argument, will not remove a song, sending notification');
						this.ui.sendNotification(`<@${message.authorId}> "${argument}" is not a number!`);
						break;
					}

					this.log_.info(`Advancing song with index: ${index}`);
					this.queue.advance(index);
					break;
				}
				case ('clear-channel'): case ('cc'): {
					this.log_.info('Recieved "clear-channel" command');

					let count = 10;
					const parsed = parseInt(argument);
					if (!isNaN(parsed)) {
						this.log_.debug(`Successfully parsed {integer:${parsed}} from argument`);
						count = parsed;
					}
					else { this.log_.debug(`Failed to parse integer from argument, using default value of ${count}`); }

					// grab text channel
					this.log_.debug(`Fetching channel with {channelId:${message.channelId}}`);
					const channel = await this.bot.channels.fetch(message.channelId);
					this.log_.debug(`Found channel {channelId:${message.channelId}}`);

					if (channel instanceof Discord.TextChannel) {
						try {
							this.log_.debug(`Attempting to delete ${count} messages from channel with channelId: ${message.channelId}`);
							await channel.bulkDelete(count);
							this.log_.debug(`Successfully deleted ${count} messages from channel with channelId: ${message.channelId}, resending UI and sending notification`);

							this.ui.sendUI(true);
							setTimeout(() => { this.ui.sendNotification(`Deleted ${count} messages`); }, 1000);
						}
						catch (error) {
							this.log_.warn(`{error:${error.message}} while bulk deleting messages. Sending notification`);
							this.ui.sendNotification(`Failed to delete ${count} messages, maybe they are too old?`);
						}
					}
					break;
				}
				case ('toggle-autoplay'): case ('autoplay'): {
					this.log_.info('Recieved "toggle-shuffle" command');

					let state = !this.data.guildSettings.autoplay;
					if (argument.indexOf('on') !== -1 || argument.indexOf('true') !== -1) {
						this.log_.debug('Argument contained "on" or "true", setting state to true');
						state = true;
					}
					else if (argument.indexOf('off') !== -1 || argument.indexOf('false') !== -1) {
						this.log_.debug('Argument contained "off" or "false", setting state to false');
						state = false;
					}

					this.log_.info(`Setting autoplay to ${state}`);
					this.data.guildSettings.autoplay = state;
					break;
				}
				default: {
					this.log_.warn(`Message {id:${message.id}} with {command:${command}} and {argument:${argument}} was not handled in switch case`);
					break;
				}
			}
		}
		this.log_.debug('Updating UI after handling message');
		await this.ui.updateUI();
		return true;
	}
	/**
	 * interactionHandler()
	 * 
	 * Handles all interactions the bot recieves
	 * @param interaction - object with all interaction information
	 * @return Promise resovles to true if the interaction was handled, false if not
	 */
	async interactionHandler(interaction: InteractionInfo): Promise<boolean> {
		this.log_.debug(`Recieved interaction from {user.id:${interaction.authorId}} with {messageid:${interaction.parentMessageId}}`);
		if (!this._ready) {
			this.log_.debug('Recieved interaction before bot was ready, ignoring');
			return false;
		}
		return await this.ui.buttonPressed(interaction);
	}
    /**
	 * removeGuild();
	 * 
	 * Call to stop the guild handler and clean up
	 */
	async rmGuild(purge?: boolean): Promise<void> {
		this.log_.info('Cleaning up and removing guild');

		this.vcPlayer.leave();
		this.ui.deleteAllMsg();
		if (purge) {
			this.log_.info('Purging guild data from database');
			await this.data.deleteGuild();
		}
	}

}