import * as Discord from 'discord.js';

import GuildComponent from './GuildComponent';
import type GuildHandler from '../GuildHandler';

/* eslint-disable */
const BOT_DOMAIN = process.env.BOT_DOMAIN;
const SUPPORT_EMAIL = process.env.SUPPORT_EMAIL;

const GREY = '#5a676b';			// colors to be used
const TEAL = '#86cecb';
const PINK = '#e12885';
const YT_RED = '#FF0000';
const SC_ORANGE = '#FE5000';
const GD_BLUE = '#4688F4';
/* eslint-enable */


/**
 * UI
 *
 * Handles creating and refreshing the user interface of the bot in discord
 */
export default class UI extends GuildComponent {
	/**
	 * @param guildHandler - guildHandler of the guild this ui object is to be responsible for
	 */
	constructor(guildHandler: GuildHandler) {
		super(guildHandler);
	}

	/**
	 * sendUI()
	 *
	 * Sends ui to channel
	 */
	sendUI() {
		// this needs to be improved to not use .get();
		const channel = this.bot.channels.cache.get(this.data.guildSettings.channelId);
		if (channel instanceof Discord.TextChannel) {
			channel.send({ embeds: [this._createUI()] });
		}
	}

	/**
	 * createUI()
	 *
	 * Creates discord messageEmbed for UI
	 * @return Discord message embed
	 */
	private _createUI(): Discord.MessageEmbed {
		const userInterface = new Discord.MessageEmbed()
			.setDescription('hi');

		return userInterface;
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
		}

		try {
			this.debug(`Sending notification with {message: ${message}} to {channelId: ${channelId}}`);
			const notification = new Discord.MessageEmbed()
				.setColor(GREY)
				.setDescription(message);


			const row = new Discord.MessageActionRow()
				.addComponents(
					new Discord.MessageButton()					// close button
						.setCustomId('primary')
						.setStyle('PRIMARY')
						.setEmoji('❌'),
				);

			const channel = await this.bot.channels.fetch(channelId);
			if (channel instanceof Discord.TextChannel) {
				const msg = await channel.send({ embeds: [notification], components: [row] });
				this.debug(`Notification message with {message: ${message} sent, {messageId: ${msg.id}}`);
			}
			else {
				this.debug(`Channel with {channelId: ${channelId}} was not a text channel, notification with {message: ${message}} was not sent`);
			}
		} catch (error) {
			this.error(`{error: ${error}} while creating/sending notification message with {message: ${message}}`);
		}
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
		if (!channelId) { channelId = this.data.guildSettings.channelId; }

		// Unix Timestamp + random number between 100000000000000-999999999999999
		const errorId = (Date.now() * 1000) + Math.floor(Math.random() * (999999999999999 - 100000000000000) + 100000000000000);
		(async () => {
			try {
				this.debug(`Sending error message with {message: ${message}} to {channelId: ${channelId}}`);

				const error = new Discord.MessageEmbed()
					.setColor(PINK)
					.setDescription(message);

				if (saveErrorId) {
					error.setFooter({ text: `Error id ${errorId}` });
				}

				const channel = await this.bot.channels.fetch(channelId);
				if (channel instanceof Discord.TextChannel) {
					const msg = await channel.send({ embeds: [error] });
					this.debug(`Error message with {message: ${message}} sent, {messageId: ${msg.id}}`);
				}
				else {
					this.debug(`Channel with {channelId: ${channelId}} was not a text channel, error with {message: ${message}} was not sent`);
				}
			}
			catch (error) {
				this.error(`{error: ${error}} while creating/sending error message with {message: ${message}}.`);
			}
		})();
		return errorId;
	}

	/**
	 * sendEmbed()
	 *
	 * Sends an already made embed
	 * @param embed - embed you want to send
	 */
	async sendEmbed(embed: Discord.MessageEmbed) {
		try {
			const channel = await this.bot.channels.fetch(this.data.guildSettings.channelId);
			if (channel instanceof Discord.TextChannel) {
				const msg = await channel.send({ embeds: [embed] });
				this.debug(`Embed with {title: ${embed.title}} sent, {messageId: ${msg.id}}`);
			}
			else {
				this.debug(`Channel with {channelId: ${this.data.guildSettings.channelId}} was not a text channel, embed with {title: ${embed.title}} was not sent`);
			}
		}
		catch (error) {
			this.error(`{error: ${error}} while creating/sending embed with {title: ${embed.title}}.`);
		}
	}
}