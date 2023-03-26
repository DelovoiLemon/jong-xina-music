import path from 'path';
import dotenv from 'dotenv';
dotenv.config({ path: path.join(__dirname, '..', '..', '.env') });

// load environment variables
// LOGGING
const LOG_FILE           = process.env.LOG_FILE === 'true';
const LOG_CONSOLE        = process.env.LOG_CONSOLE === 'true';
const LOG_FILE_DIRECTORY = process.env.LOG_FILE_DIRECTORY;
const LOG_FILE_NAME      = process.env.LOG_FILE_NAME;
const LOG_DATE_PATTERN   = process.env.LOG_DATE_PATTERN;
const ZIP_LOGS           = process.env.ZIP_LOGS === 'true';
const LOG_MAX_SIZE       = process.env.LOG_MAX_SIZE;
const LOG_MAX_FILES      = process.env.LOG_MAX_FILES;

// Songs DB
const SONG_DB_LOCATION   = process.env.SONG_DB_LOCATION;

// Music Cache
const CACHE_DIRECTORY    = process.env.CACHE_DIRECTORY;
const MAX_CACHESIZE_MiB  = parseInt(process.env.MAX_CACHESIZE_MiB);

// Web Panel
const XINA_DOMAIN        = process.env.XINA_DOMAIN;
const WEB_PANEL_PORT     = parseInt(process.env.WEB_PANEL_PORT);

// Guild 
const DISCORD_TOKEN      = process.env.DISCORD_TOKEN;
const GUILD_CREATE_RATE  = parseInt(process.env.GUILD_CREATE_RATE);
const MAX_RESPONSE_WAIT  = parseInt(process.env.MAX_RESPONSE_WAIT);

export type IPCConfig = {
  retry:     number;
  silent:    boolean;
  rawBuffer: boolean;

  app_namespace:    string;
  logger_ipc_id:    string;
  music_ipc_id:     string;
  song_db_ipc_id:   string;
  web_panel_ipc_id: string;
  gh_child_ipc_id: string;
  g_master_ipc_id:  string;
};
export const ipc_config: IPCConfig = Object.freeze({
  retry:      100,
  silent:     true,
  rawBuffer:  false,

  app_namespace:    'Jong-Xina-Music-Bot',
  logger_ipc_id:    'Jong-Xina-Logger',
  music_ipc_id:     'Jong-Xina-Music-Cache',
  song_db_ipc_id:   'Jong-Xina-Song-DB',
  web_panel_ipc_id: 'Jong-Xina-Web-Panel',
  gh_child_ipc_id:  'Jong-Xina-Guild-Handler-Child',
  g_master_ipc_id:  'Jong-Xina-Guild-Master',
});

export type LoggerConfig = {
  log_file:       boolean;
  log_console:    boolean;
  file_directory: string;
  file_name:      string;
  date_pattern:   string;
  zip_logs:       boolean;
  max_size:       string;
  max_files:      string;
};
export const logger_config: LoggerConfig = Object.freeze({
  log_file:       LOG_FILE,
  log_console:    LOG_CONSOLE,
  file_directory: LOG_FILE_DIRECTORY,
  file_name:      LOG_FILE_NAME,
  date_pattern:   LOG_DATE_PATTERN,
  zip_logs:       ZIP_LOGS,
  max_size:       LOG_MAX_SIZE,
  max_files:      LOG_MAX_FILES,
});

export type SongDBConfig = {
  db_location: string;
};
export const songdb_config: SongDBConfig = Object.freeze({
  db_location: SONG_DB_LOCATION,
});

export type MusicCacheConfig = {
  nightcore_chunk_timing: number;
  chunk_timing:     number;
  cache_dir:        string;
  cache_size_bytes: number;
};
export const music_cache_config: MusicCacheConfig = Object.freeze({
  nightcore_chunk_timing: 80,
  chunk_timing:     100,
  cache_dir:        CACHE_DIRECTORY,
  cache_size_bytes: MAX_CACHESIZE_MiB * (1 << 20),
});

export type WebConfig = {
  port:                  number;
  domain:                string;
  default_thumbnail_url: string;
};
export const web_config: WebConfig = Object.freeze({
  port:                  WEB_PANEL_PORT,
  domain:                XINA_DOMAIN,
  default_thumbnail_url: `${XINA_DOMAIN}/thumbnails/default`,
});

export type BotMasterConfig = {

}
export const bot_master_config: BotMasterConfig = Object.freeze({

});

export type GuildHandlerConfig = {
  discord_token:     string;
  guild_create_rate: number;
  max_response_wait: number;
};
export const guild_config: GuildHandlerConfig = Object.freeze({
  discord_token:     DISCORD_TOKEN,
  guild_create_rate: GUILD_CREATE_RATE,
  max_response_wait: MAX_RESPONSE_WAIT
});