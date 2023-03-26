import Discord, { ButtonBuilder } from 'discord.js';

import GuildComponent from './GuildComponent';
import type GuildHandler from '../guild_handler';
import { InteractionInfo } from '../gh_child/gh_child';

const SHOW_NUM_ITEMS = parseInt(process.env.SHOW_NUM_ITEMS);
const NOTIFICATION_LIFE = parseInt(process.env.NOTIFICATION_LIFE);
const UI_REFRESH_RATE = parseInt(process.env.UI_REFRESH_RATE);
const BOT_DOMAIN = process.env.BOT_DOMAIN;
const MAX_SONG_INFO_LENGTH = parseInt(process.env.MAX_SONG_INFO_LENGTH);
const PROGRESS_BAR_LENGTH = parseInt(process.env.PROGRESS_BAR_LENGTH);

export const GREY = '#5a676b';
export const TEAL = '#86cecb';
export const PINK = '#e12885';

/**
 * UI
 *
 * Handles creating and refreshing the user interface of the bot in discord
 */
export default class UI extends GuildComponent {
	private _uiChannelId: string;
	private _uiMessageId: string;
	private _lastMessageJSON: string;
	private _interactionListeners: {
		[key: string]: {
			timeout?: NodeJS.Timeout,
			life?: number,
			interactionHandler: (interaction: InteractionInfo) => Promise<boolean>
		}
	};
	private _nextRefreshTimeout: NodeJS.Timeout;

	/**
	 * @param guildHandler - guildHandler of the guild this ui object is to be responsible for
	 */
	constructor(guildHandler: GuildHandler) {
		super(guildHandler);
		this._interactionListeners = {};
	}

	/**
	 * escapeString()
	 * 
	 * Escapes a string to be displayed as is in discord
	 * @param string - string to escape
	 * @returns escaped string
	 */
	escapeString(string: string) {
		let escaped = '';
		const toEscape = ['*', '_', '~', '`', '>', '|'];
		for (let i = 0; i < string.length; i++) {
			if (toEscape.indexOf(string[i]) === -1) { escaped += string[i]; }
			else { escaped += `\\${string[i]}`; }
		}
		return escaped;
	}

	/**
	 * createUI()
	 *
	 * Creates discord EmbedBuilder for UI
	 * @return Discord message embed
	 */
	private _createUI(): Discord.MessageCreateOptions {
		try {
			// Get info about the queue
			const queueInfo = this.queue.getUIInfo();

			// Create embed
			const userInterface = new Discord.EmbedBuilder().setColor(TEAL);

			if (!queueInfo.nowPlaying) {
				// If not playing right now, show idle UI
				userInterface
					.setTitle('Idle - Listening for Commands')
					.setDescription('Click the "help" button below if you need help')
					.setThumbnail(`${BOT_DOMAIN}/thumbnails/defaultThumbnail.jpg`);
			}
			else {
				// Check song status, (paused over buffering over playing)
				let status = '';
				if (this.vcPlayer.paused) { status = 'Paused'; }
				else if (this.vcPlayer.currentSource.buffering) { status = 'Buffering'; }
				else { status = 'Playing'; }
				userInterface.setAuthor({ name: status });

				// Song title
				let title = queueInfo.nowPlayingSong.title;
				if (queueInfo.nowPlayingSong.title.length > MAX_SONG_INFO_LENGTH) {
					title = queueInfo.nowPlayingSong.title.substring(0, MAX_SONG_INFO_LENGTH - 3) + '...';
				}
				userInterface.setTitle(this.ui.escapeString(title));

				// Set thumbnail
				userInterface.setThumbnail(queueInfo.nowPlayingSong.thumbnailURL);

				// Create progress bar
				let progressBar = '';
				// Convert duration in sec to string and add to progress bar
				let progress = this.vcPlayer.currentSource.getPlayedDuration();
				let hours: number | string = Math.floor(progress / 3600);
				if (hours < 10) { hours = '0' + hours.toString(); }
				progress %= 3600;
				let min: number | string = Math.floor(progress / 60);
				if (min < 10) { min = '0' + min.toString(); }
				progress %= 60;
				let sec: number | string = progress;
				if (sec < 10) { sec = '0' + sec.toString(); }
				progressBar += `-${hours.toString()}:${min.toString()}:${sec.toString()} [`;

				// Figure out where to put the indicator
				progress = this.vcPlayer.currentSource.getPlayedDuration();
				const lineLength = PROGRESS_BAR_LENGTH - progressBar.length - this.vcPlayer.currentSource.song.durationString.length - 2;
				const indicatorLoc = Math.round(progress / this.vcPlayer.currentSource.song.duration * lineLength);
				// Create bar
				for (let i = 0; i < lineLength; i++) {
					if (i === indicatorLoc) { progressBar += '|'; }
					else { progressBar += '-'; }
				}
				// Add overall duration to the end
				progressBar += (this.vcPlayer.currentSource.song.live) ? '] Live' : `] ${queueInfo.nowPlayingSong.durationString}`;
				userInterface.setDescription(progressBar);

				// Song information
				let sourceName = '';
				switch (queueInfo.nowPlayingSong.type) {
					case ('yt'): { sourceName = 'Youtube'; break; }
					case ('gd'): { sourceName = 'Google Drive'; break; }
				}
				userInterface.addFields([
					{
						name: 'Requested By',
						value: (queueInfo.nowPlayingSong.reqBy === '') ? 'Autoplay' : `<@${queueInfo.nowPlayingSong.reqBy}>`,
						inline: true
					},
					{
						name: (queueInfo.nowPlayingSong.type === 'yt') ? 'Channel' : 'Artist',
						value: (queueInfo.nowPlayingSong.artist) ? this.escapeString(queueInfo.nowPlayingSong.artist) : 'unknown',
						inline: true
					},
					{
						name: 'LINK',
						value: `[${this.escapeString(sourceName)}](${queueInfo.nowPlayingSong.url})`,
						inline: true
					}
				]);

				// Last played information
				if (queueInfo.lastPlayed) {
					let lastPlayedText = '';
					if (queueInfo.lastPlayed.title.length > MAX_SONG_INFO_LENGTH) {
						lastPlayedText += queueInfo.lastPlayed.title.substring(0, MAX_SONG_INFO_LENGTH - 3) + '...';
					}
					else { lastPlayedText += queueInfo.lastPlayed.title; }
					userInterface.addFields({
						name: 'Last Played',
						value: `${this.escapeString(lastPlayedText)} - [${(queueInfo.lastPlayed.reqBy) ? `<@${queueInfo.lastPlayed.reqBy}>` : 'Autoplay'}]`,
						inline: false
					});
				}

				// Queue information
				let queueTxt = '';
				for (let i = 0; i < SHOW_NUM_ITEMS; i++) {
					if (i === queueInfo.nextInQueue.length) {
						if (queueInfo.repeatQueue === 0) { queueTxt += '**>> End Of Queue <<**'; break; }
						else { queueTxt += '**>> Repeat Queue <<**'; break; }
					}

					// Index number for item
					let itemText = `${(queueInfo.nextInQueue[i].index + 1).toString()}. `;
					// Add title of song cut off to be the right length
					if (queueInfo.nextInQueue[i].song.title.length > MAX_SONG_INFO_LENGTH) {
						itemText += this.escapeString(queueInfo.nextInQueue[i].song.title.substring(0, MAX_SONG_INFO_LENGTH - 3 - itemText.length) + '...');
					}
					else { itemText += queueInfo.nextInQueue[i].song.title; }
					queueTxt += `${itemText} - [${(queueInfo.nextInQueue[i].song.reqBy) ? `<@${queueInfo.nextInQueue[i].song.reqBy}>` : 'Autoplay'}]\n`;
				}
				userInterface.addFields({
					name: 'Queue',
					value: queueTxt,
					inline: false
				});

				// Autoplay information
				let autoplayTxt = '';
				if (queueInfo.autoplay) {
					for (let i = 0; i < SHOW_NUM_ITEMS; i++) {
						if (i === queueInfo.nextInAutoplay.length) { autoplayTxt += '**>> End Of Autoplay Queue <<**'; break; }
						// Index number for item
						let itemText = `${(queueInfo.nextInAutoplay[i].index + 1).toString()}. `;
						// Add title of song cut off to be the right length
						if (queueInfo.nextInAutoplay[i].song.title.length > MAX_SONG_INFO_LENGTH) {
							itemText += this.escapeString(queueInfo.nextInAutoplay[i].song.title.substring(0, MAX_SONG_INFO_LENGTH - 3 - itemText.length) + '...');
						}
						else { itemText += queueInfo.nextInAutoplay[i].song.title; }
						autoplayTxt += `${itemText}\n`;
					}
				}
				else { autoplayTxt += 'Autoplay is off'; }
				userInterface.addFields({
					name: 'Autoplay',
					value: autoplayTxt,
					inline: false
				});
			}

			userInterface
				.addFields([
					{
						name: 'Autoplay',
						value: queueInfo.autoplay ? 'on' : 'off',
						inline: true
					},
					{
						name: 'Repeat Queue',
						value: `${queueInfo.repeatQueue === -1 ? 'infinite' : queueInfo.repeatQueue} time${(queueInfo.repeatQueue !== 1) ? 's' : ''}`,
						inline: true
					}
				]);

			// Buttons
			const audioControls = new Discord.ActionRowBuilder<ButtonBuilder>()
				.addComponents(
					// Play pause button
					new Discord.ButtonBuilder()
						.setLabel('Play/Pause')
						.setCustomId(JSON.stringify({ type: 'play/pause', special: 0 }))
						.setStyle(Discord.ButtonStyle.Primary)
				)
				.addComponents(
					// Stop button
					new Discord.ButtonBuilder()
						.setLabel('Stop')
						.setCustomId(JSON.stringify({ type: 'stop', special: 1 }))
						.setStyle(Discord.ButtonStyle.Danger)
						.setDisabled(!this.vcPlayer.connected)
				)
				.addComponents(
					// Skip button
					new Discord.ButtonBuilder()
						.setLabel('Skip')
						.setCustomId(JSON.stringify({ type: 'skip', special: 2 }))
						.setStyle(Discord.ButtonStyle.Success)
						.setDisabled(!this.vcPlayer.playing)
				)
				.addComponents(
					// Shuffle button
					new Discord.ButtonBuilder()
						.setLabel(`Shuffle: ${(queueInfo.shuffle) ? 'on' : 'off'}`)
						.setCustomId(JSON.stringify({ type: 'shuffle', special: 3 }))
						.setStyle(Discord.ButtonStyle.Secondary)
						.setDisabled(!this.vcPlayer.playing)
				)
				.addComponents(
					// Repeat button
					new Discord.ButtonBuilder()
						.setLabel(`Repeat Song: ${queueInfo.repeatSong === -1 ? 'infinite' : queueInfo.repeatSong} time${(queueInfo.repeatSong !== 1) ? 's' : ''}`)
						.setCustomId(JSON.stringify({ type: 'repeat', repeat: queueInfo.repeatSong, special: 4 }))
						.setStyle(Discord.ButtonStyle.Secondary)
						.setDisabled(!this.vcPlayer.playing)
				);

			// Links
			const links = new Discord.ActionRowBuilder<ButtonBuilder>()
				.addComponents(
					// Web panel link
					new Discord.ButtonBuilder()
						.setLabel('Web Panel')
						.setURL(`${BOT_DOMAIN}/${this.data.guildId}`)
						.setStyle(Discord.ButtonStyle.Link)
				)
				.addComponents(
					// Report issue link
					new Discord.ButtonBuilder()
						.setLabel('Report Issue')
						.setURL(`${BOT_DOMAIN}/${this.data.guildId}/report`)
						.setStyle(Discord.ButtonStyle.Link)
				)
				.addComponents(
					// Help link
					new Discord.ButtonBuilder()
						.setLabel('Help')
						.setURL(`${BOT_DOMAIN}/${this.data.guildId}/help`)
						.setStyle(Discord.ButtonStyle.Link)
				);

			return { embeds: [userInterface], components: [audioControls, links] };
		}
		catch {
			return { embeds: [new Discord.EmbedBuilder()] };
		}
	}

	/**
	 * updateUI()
	 * 
	 * Updates the UI of the bot
	 */
	async updateUI(): Promise<void> {
		clearInterval(this._nextRefreshTimeout);
		const ui = this._createUI();
		if (this._lastMessageJSON !== JSON.stringify(ui)) {
			this.debug('UI is now different, needs to be updated');
			const success = await this.updateMsg(this.data.guildSettings.channelId, this._uiMessageId, ui);
			if (success) { this._lastMessageJSON = JSON.stringify(ui); }
			else { this.error(`UI was not updated successfully. {stack:${new Error().stack}}`); }
		}
		this._nextRefreshTimeout = setTimeout(() => { this.updateUI(); }, UI_REFRESH_RATE);
	}

	/**
	 * sendUI()
	 *
	 * Sends UI to channel
	 * @param sendNew - resend the ui or not
	 * @returns promise that resolves even if it sending fails
	 */
	async sendUI(sendNew?: boolean): Promise<void> {
		// Delete ui if it already exists
		if (this._uiMessageId) {
			this.debug(`UI already exists with {messageId:${this._uiMessageId}}, deleting it`);
			await this.deleteMsg(this._uiChannelId, this._uiMessageId);
		}

		// Handles interactions for ui
		const interactionHandler = async (interaction: InteractionInfo): Promise<boolean> => {
			try {
				this.debug(`Handling interaction on UI message with {customId:${interaction.customId}}`);
				const customId = JSON.parse(interaction.customId);

				switch (customId.type) {
					case ('play/pause'): {
						this.info('Recieved "play/pause" interaction');
						// if not connected to vc, connect
						if (!this.vcPlayer.connected) {
							this.info('Not in voice channel, joining');
							const joined = await this.vcPlayer.join(interaction.authorId);
							if (!joined) {
								this.warn('Did not successfully join voice channel, will not try to play song');
								break;
							}
						}

						// if not playing anything, start playing fron queue
						if (!this.vcPlayer.playing) {
							this.info('Nothing playing right now, playing what\'s next in the queue');
							this.queue.nextSong();
							break;
						}

						// toggle pause/play
						if (this.vcPlayer.paused) {
							this.info('Currently paused, resuming');
							this.vcPlayer.resume();
						}
						else {
							this.info('Currently playing, pausing');
							this.vcPlayer.pause();
						}
						break;
					}
					case ('stop'): {
						this.info('Recieved "stop" interaction, leaving voice channel');
						this.vcPlayer.leave();
						break;
					}
					case ('skip'): {
						this.info('Recieved "skip" interaction, ending current song early');
						this.vcPlayer.finishedSong();
						break;
					}
					case ('repeat'): {
						this.info(`Recieved "repeat" interaction, setting repeat song to: ${customId.repeat + 1}`);
						this.queue.setRepeatSong(customId.repeat + 1);
						break;
					}
					case ('shuffle'): {
						this.info('Recieved "shuffle" interaction, toggling shuffle');
						this.queue.toggleShuffle();
						break;
					}
					default: {
						this.warn(`Interaction with {customId:${interaction.customId}} was not handled in switch case`);
						return false;
					}
				}

				this.debug('Updating UI after handling interaction');
				await this.updateUI();
				return true;
			}
			catch (error) {
				this.warn(`{error: ${error}} while handling {interaction: ${JSON.stringify(interaction)}} for UI message`);
				return false;
			}
		};

		// Create and send message
		const ui = this._createUI();
		this._uiChannelId = this.data.guildSettings.channelId;
		if (sendNew) {
			this.debug(`{sendNew:${sendNew}} was true, sending new UI message`);
			const id = await this.sendEmbed(ui, -1, interactionHandler);
			if (id) {
				this.debug(`UI was sent successfully with {messageId:${id}}`);
				this._uiMessageId = id;
				this._lastMessageJSON = JSON.stringify(ui);
			}
			else { this.error(`UI was not sent successfully. {stack:${new Error().stack}}`); }
		}

		// Update message once done
		await this.updateUI();
	}

	/**
	 * sendEmbed()
	 *
	 * Sends an already made embed
	 * @param messageOptions - messageOptions for you want to send
	 * @param life - time in miliseconds you want this to be, -1 if infinite
	 * @param interactionHandler - function called to handle when mesage recieves an interaction
	 * @returns promise resolves to messageId string if successfully sent, undefined if not
	 */
	async sendEmbed(messageOptions: Discord.MessageCreateOptions, life?: number, interactionHandler?: (interaction: InteractionInfo) => Promise<boolean>): Promise<string | undefined> {
		if (!life) {
			this.debug('Message life was not given assumming infinite, setting life to -1');
			life = -1;
		}
		if (!interactionHandler) {
			this.debug('No interaction handler given, using default interaction handler');
			interactionHandler = async () => { return false; };
		}

		try {
			// grab text channel
			const channel = await this.bot.channels.fetch(this.data.guildSettings.channelId);
			if (channel instanceof Discord.TextChannel) {
				// send embed if it is a text channel
				const msg = await channel.send(messageOptions);
				this.debug(`Embed with {embeds: ${messageOptions}} sent, {messageId: ${msg.id}}`);

				this._interactionListeners[msg.id] = { interactionHandler };

				// set timeout if given
				if (life !== -1) {
					this._interactionListeners[msg.id].timeout = setTimeout(() => {
						this.debug(`Life for message with {messageId:${msg.id}} has expired, deleting message`);
						this.deleteMsg(channel.id, msg.id);
					}, life);
					this._interactionListeners[msg.id].life = life;
				}
				return msg.id;
			}
			this.warn(`Channel with {channelId: ${this.data.guildSettings.channelId}} was not a text channel, embed with {emveds: ${messageOptions.embeds[0]}} was not sent`);
		}
		catch (error) { this.error(`{error: ${error.message}} while creating/sending embed with {embeds: ${messageOptions.embeds[0]}}. {stack:${error.stack}}`); }
		return undefined;
	}

	/**
	 * updateMsg()
	 * 
	 * Updates a message
	 * @param channelId - id of channel message is in
	 * @param messageId - id of message to edit
	 * @param messageOptions - data to update message with
	 * @returns promise resolves to true if successfully updated, false if not
	 */
	async updateMsg(channelId: string, messageId: string, messageOptions: Discord.MessageCreateOptions): Promise<boolean> {
		try {
			this.debug(`Updating message in {channelId:${channelId}} with {messageId:${messageId}}`);

			const channel = await this.bot.channels.fetch(channelId) as Discord.TextChannel;
			const message = await channel.messages.fetch(messageId);

			if (this._interactionListeners[messageId].life) {
				this.debug(`Message with {messageId:${messageId}} has a finite life, resetting timeout`);

				clearInterval(this._interactionListeners[messageId].timeout);
				this._interactionListeners[messageId].timeout = setTimeout(() => {
					this.debug(`Life for message with {messageId:${messageId}} has expired, deleting message`);
					this.deleteMsg(channelId, messageId);
				}, this._interactionListeners[messageId].life);
			}
			await message.edit(messageOptions.content);
			this.debug(`Successfully updated message in {channelId:${channelId}} with {messageId:${messageId}}`);
			return true;
		}
		catch (error) {
			this.error(`{error: ${error.message}} while updating message with {messageId: ${messageId}} in {channelId: ${channelId}}. {stack:${error.stack}}`);
			return false;
		}
	}

	/**
	 * deleteMsg()
	 * 
	 * Deletes a message
	 * @param channelId - channel id of message to delete
	 * @param messageId - message id of message to delete
	 */
	async deleteMsg(channelId: string, messageId: string): Promise<boolean> {
		try {
			this.debug(`Attempting to delete message in {channelId:${channelId}} with {messageId:${messageId}}`);
			const channel = await this.bot.channels.fetch(channelId) as Discord.TextChannel;
			const message = await channel.messages.fetch(messageId);

			await message.delete();
			clearTimeout(this._interactionListeners[messageId].timeout);
			delete this._interactionListeners[messageId];
			return true;
		}
		catch (error) {
			this.warn(`{error: ${error}} while deleting message with {messageId: ${messageId}} in {channelId: ${channelId}}`);
			return false;
		}
	}

	/**
	 * deleteAllMsg()
	 * 
	 * Deletes all messages that have been sent
	 */
	async deleteAllMsg(): Promise<void> {
		this.info('Deleting all bot messages');
		let count = 0;
		let success = 0;
		for (const key in this._interactionListeners) {
			if (await this.deleteMsg(this.data.guildSettings.channelId, key)) { success++; }
			count++;
		}
		this.info(`Successfully deleted ${success} out of ${count} messages`);
	}

	/**
	 * sendNotification()
	 *
	 * Sends a notification
	 * @param message - message you want to send
	 * @param channelId - discord channel id for text channel for message to be sent
	 */
	async sendNotification(message: string, channelId: string | void): Promise<void> {
		if (!channelId) {
			channelId = this.data.guildSettings.channelId;
			this.debug(`No channel id give, using guild default {channelId:${channelId}}`);
		}

		try {
			this.debug(`Sending notification with {message: ${message}} to {channelId: ${channelId}}`);
			// create notification embed
			const notification = new Discord.EmbedBuilder()
				.setTitle('Notification')
				.setColor(GREY)
				.setDescription(message);

			const row = new Discord.ActionRowBuilder<ButtonBuilder>()
				.addComponents(
					// close button
					new Discord.ButtonBuilder()
						.setLabel('Close')
						.setCustomId(JSON.stringify({ type: 'close', special: 0 }))
						.setStyle(Discord.ButtonStyle.Danger)
				);

			const interactionHandler = async (interaction: InteractionInfo): Promise<boolean> => {
				try {
					this.debug(`Handling interaction on notification message with {messageId:${interaction.parentMessageId}} with {customId:${interaction.customId}}`);
					const customId = JSON.parse(interaction.customId);

					switch (customId.type) {
						case ('close'): {
							this.info('Received "close" interaction, deleting message');
							this.deleteMsg(interaction.parentChannelId, interaction.parentMessageId);
							break;
						}
						default: {
							this.warn(`Interaction with {customId:${interaction.customId}} was not handled in switch case`);
							return false;
						}
					}
					return true;
				}
				catch (error) {
					this.warn(`{error: ${error}} while handling {interaction: ${JSON.stringify(interaction)}} for notification`);
					return false;
				}
			};

			this.sendEmbed({ embeds: [notification], components: [row] }, NOTIFICATION_LIFE, interactionHandler);
		}
		catch (error) { this.warn(`{error: ${error}} while creating/sending notification message with {message: ${message}}`); }
	}

	/**
	 * sendError()
	 *
	 * Sends an error notification
	 * @param message - message you want to send
	 * @param saveErrorId - create an error id or not
	 * @param channelId - discord channel id for text channel for message to be sent
	 * @return randomized error id
	 */
	sendError(message: string, saveErrorId: boolean | void, channelId: string | void): number {
		if (!channelId) {
			channelId = this.data.guildSettings.channelId;
			this.debug(`No channel id give, using guild default {channelId:${channelId}}`);
		}

		// Unix Timestamp + random number between 100000000000000-999999999999999
		const errorId = Date.now() + Math.floor(Math.random() * (999999999999999 - 100000000000000) + 100000000000000);
		(async () => {
			try {
				this.debug(`Sending error message with {message: ${message}} to {channelId: ${channelId}}`);

				const error = new Discord.EmbedBuilder()
					.setTitle('Error')
					.setColor(PINK)
					.setDescription(message);

				if (saveErrorId) {
					this.debug(`Error id should be displayed, adding {errorId:${errorId}} to footer`);
					error.setFooter({ text: `Error id ${errorId}` });
				}

				const row = new Discord.ActionRowBuilder<ButtonBuilder>()
					.addComponents(
						// close button
						new Discord.ButtonBuilder()
							.setLabel('Close')
							.setCustomId(JSON.stringify({ type: 'close', special: 0 }))
							.setStyle(Discord.ButtonStyle.Danger)
					);

				const interactionHandler = async (interaction: InteractionInfo): Promise<boolean> => {
					try {
						this.debug(`Handling interaction on error message with {messageId:${interaction.parentMessageId}} with {customId:${interaction.customId}}`);
						const customId = JSON.parse(interaction.customId);

						switch (customId.type) {
							case ('close'): {
								this.info('Received "close" interaction, deleting message');
								this.deleteMsg(interaction.parentChannelId, interaction.parentMessageId);
								break;
							}
							default: {
								this.warn(`Interaction with {customId:${interaction.customId}} was not handled in switch case`);
								return false;
							}
						}
						return true;
					}
					catch (error) {
						this.warn(`{error: ${error}} while handling {interaction: ${JSON.stringify(interaction)}} for error message`);
						return false;
					}
				};

				this.sendEmbed({ embeds: [error], components: [row] }, -1, interactionHandler);
			}
			catch (error) { this.warn(`{error: ${error}} while creating/sending error message with {message: ${message}}.`); }
		})();
		return errorId;
	}

	/**
	 * buttonPressed()
	 * 
	 * Handles what happens when a button on a message is pressed
	 * @param interaction - interaction object of button that was pressed
	 */
	async buttonPressed(interaction: InteractionInfo): Promise<boolean> {
		// grabs the right interaction handler and calls it
		try {
			this.debug(`Recieved interaction with {customId:${interaction.customId}}`);
			return await this._interactionListeners[interaction.parentMessageId].interactionHandler(interaction);
		}
		catch (error) {
			this.warn(`{error:${error}} while calling interaction on {parentMessageId:${interaction.parentMessageId}}`);
			return false;
		}
	}
}