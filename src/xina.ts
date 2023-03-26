import StartComponents from './start_components/start_components';
import SongDBInterface from './song_db/song_db_ipc_interface';
import Logger from './logger/logger';
import WebPanelInterface from './web_panel/web_panel_ipc_interface';
import { GuildMasterInterface } from './guild_master/guild_master_ipc_interface';

StartComponents().then(() => {
  const logger     = new Logger('XINA');
  //const song_db    = new SongDBInterface(logger);
  //const web_panel  = new WebPanelInterface(logger);
  const bot_master = new GuildMasterInterface(logger);

});
