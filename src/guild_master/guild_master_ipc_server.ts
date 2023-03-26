import ipc from 'node-ipc';
import { guild_config, ipc_config } from '../constants/constants';
import Logger from '../logger/logger';
import StartIPCServer from '../ipc_template/ipc_server';
import GuildMaster, { GuildMasterFunctions } from './guild_master';
import Discord, { Events } from 'discord.js';



export function StartGuildMasterComponent(): typeof ipc {
  const logger = new Logger(ipc_config.g_master_ipc_id);
  const guild_master = new GuildMaster(logger);
  
  const bot = new Discord.Client({				// set intent flags for bot
    intents: [
      Discord.GatewayIntentBits.Guilds,					// for guildCreate and guildDelete events
      Discord.GatewayIntentBits.GuildMessages,			// for creating and deleting messages
      Discord.GatewayIntentBits.GuildMessageReactions,	// for adding and removing message reactions
    ],
  });
  
  // when bot joins a server
  bot.on(Events.GuildCreate, (guild) => {
    logger.info(`Joined a new guild: ${guild.name}`);
    guild_master.newGuild(guild.id);
  });
  
  // when bot leaves a server
  bot.on(Events.GuildDelete, (guild) => {
    logger.info(`Left a guild: ${guild.name}`);
    guild_master.rmGuild(guild.id);
  });
  
  // when bot receives a message
  bot.on(Events.MessageCreate, async (message) => {
    if (message.author.id === bot.user.id) return; 	// ignore if message author is the bot
    if (!message.guildId) return;						        // ignore if is a dm
  
    const guild = guild_master.getGuild(message.guildId);

    if (guild) {
      const success = await guild.messageHandler({
        id: message.id,
        content: message.content,
        channelId: message.channel.id,
        authorId: message.author.id
      });
      if (success) { try { await message.delete(); } catch { /* */ } }
    }
  });
  
  // when bot receives an interaction
  bot.on(Events.InteractionCreate, async (interaction) => {
    if (!interaction.isButton()) return;				// ignore if not a button press
    if (!interaction.guildId) return;
  
    // Send to correct guild handler and update to respond to discord to indicate that reaction has been recieved
    const guild = guild_master.getGuild(interaction.guildId);
    if (guild) {
      const success = await guild.interactionHandler({
        authorId: interaction.user.id, 
        customId: interaction.customId, 
        parentChannelId: interaction.channel.id, 
        parentMessageId: interaction.message.id
      });

      if (success) { setTimeout(async () => { try { await interaction.update({}); } catch { /* */ } }, 500); }
    }
  });
  
  // when bot recieves a reaction
  bot.on(Events.MessageReactionAdd, async (reaction) => {
    // delete it
    try { await reaction.remove(); } catch { /* */ }
  });
  
  // once ready, start handlers for all existing guilds
  bot.once(Events.ClientReady, () => {
    logger.info(`Logged in to discord as ${bot.user.tag}`);
  
    // create handlers for existing guilds
    setTimeout(async () => {
      const guildList = bot.guilds.cache.map((guild) => guild.id);
      for (let i = 0; i < guildList.length; i++) {
        guild_master.newGuild(guildList[i]);
        await new Promise(resolve => setTimeout(resolve, guild_config.guild_create_rate));
      }
    }, guild_config.guild_create_rate);
  });
  
  bot.login(guild_config.discord_token);
  
  return StartIPCServer<GuildMasterFunctions>(ipc_config.g_master_ipc_id, logger, Promise.resolve(), async (function_name, args) => {
    switch (function_name) {
      case GuildMasterFunctions.getGuild: {
        guild_master.getGuild(args[0]);
        break;
      }
      case GuildMasterFunctions.rmGuild: {
        guild_master.rmGuild(args[0]);
        break;
      }
      case GuildMasterFunctions.newGuild: {
        guild_master.newGuild(args[0]);
        break;
      }
    }
    return 0;
  });
}



StartGuildMasterComponent();