import path from 'path';
import dotenv from 'dotenv';
dotenv.config({ path: path.join(__dirname, '..', '..', '.env') });

// load environment variables
const LOG_FILE           = process.env.LOG_FILE === 'true';
const LOG_CONSOLE        = process.env.LOG_CONSOLE === 'true';
const LOG_FILE_DIRECTORY = process.env.LOG_FILE_DIRECTORY;
const LOG_FILE_NAME      = process.env.LOG_FILE_NAME;
const LOG_DATE_PATTERN   = process.env.LOG_DATE_PATTERN;
const ZIP_LOGS           = process.env.ZIP_LOGS === 'true';
const LOG_MAX_SIZE       = process.env.LOG_MAX_SIZE;
const LOG_MAX_FILES      = process.env.LOG_MAX_FILES;

const SONG_DB_LOCATION   = process.env.SONG_DB_LOCATION;

const CACHE_DIRECTORY    = process.env.CACHE_DIRECTORY;
const MAX_CACHESIZE_MiB  = parseInt(process.env.MAX_CACHESIZE_MiB);

const XINA_DOMAIN        = process.env.XINA_DOMAIN;
const WEB_PANEL_PORT     = parseInt(process.env.WEB_PANEL_PORT);
const GOOGLE_TOKEN_LOC   = process.env.GOOGLE_TOKEN_LOC;
const GOOGLE_SCOPE       = process.env.GOOGLE_SCOPE;
const GOOGLE_CLIENT_ID   = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SEC  = process.env.GOOGLE_CLIENT_SECRET;
const GOOGLE_REDIRECT_URI = process.env.GOOGLE_REDIRECT_URI;

const MAX_RESPONSE_WAIT  = parseInt(process.env.MAX_RESPONSE_WAIT); 
const DISCORD_TOKEN      = process.env.DISCORD_TOKEN;
const MONGODB_URI        = process.env.MONGODB_URI;
const MAX_SONG_INFO_LENGTH = parseInt(process.env.MAX_SONG_INFO_LENGTH);
const PROGRESS_BAR_LENGTH  = parseInt(process.env.PROGRESS_BAR_LENGTH);
const MAX_YT_RESULTS     = parseInt(process.env.MAX_YT_RESULTS);
const SHOW_NUM_ITEMS     = parseInt(process.env.SHOW_NUM_ITEMS);

export type IPCConfig = {
  retry:     number;
  silent:    boolean;
  rawBuffer: boolean;

  app_namespace:    string;
  logger_ipc_id:    string;
  music_ipc_id:     string;
  song_db_ipc_id:   string;
  web_panel_ipc_id: string;
  gh_ipc_id:        string;
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
  gh_ipc_id:        'Jong-Xina-Guild-Handler',
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
  google_token_loc:      string;
  google_scope:          string;
  google_client_secret:  string;
  google_client_id:      string;
  google_redirect_uri:   string;
};
export const web_config: WebConfig = Object.freeze({
  port:                  WEB_PANEL_PORT,
  domain:                XINA_DOMAIN,
  default_thumbnail_url: `${XINA_DOMAIN}/thumbnails/default`,
  google_token_loc:      GOOGLE_TOKEN_LOC,
  google_scope:          GOOGLE_SCOPE,
  google_client_id:      GOOGLE_CLIENT_ID,
  google_client_secret:  GOOGLE_CLIENT_SEC,
  google_redirect_uri:   GOOGLE_REDIRECT_URI,
});

export type BotMasterConfig = {

}
export const bot_master_config: BotMasterConfig = Object.freeze({

});

export type GuildHandlerConfig = {
  ui_refresh_rate:      number;
  notification_life:    number;
  show_queue_items:     number;
  max_yt_results:       number;
  show_num_items:       number;
  max_response_wait:    number;
  mongodb_uri:          string;
  discord_token:        string;
};
export const gh_config: GuildHandlerConfig = Object.freeze({
  ui_refresh_rate:      35,
  notification_life:    10,
  show_queue_items:     5,
  max_yt_results:       MAX_YT_RESULTS,
  show_num_items:       SHOW_NUM_ITEMS,
  max_response_wait:    MAX_RESPONSE_WAIT,
  mongodb_uri:          MONGODB_URI,
  discord_token:        DISCORD_TOKEN,
});

export type UIConfig = {
  progress_bar_lenght:  number;
  max_song_info_lenght: number;
};
export const ui_config: UIConfig = Object.freeze({
  progress_bar_lenght:  PROGRESS_BAR_LENGTH,
  max_song_info_lenght: MAX_SONG_INFO_LENGTH,
})

export type AudioConfig = {
  NIGHTCORE_AUDIO_FREQUENCY: number;
  REFRESH_PLAYLIST_INTERVAL: number;
  MAX_READ_RETRY:   number;
  LARGE_CHUNK_SIZE: number;
  SMALL_CHUNK_SIZE: number;
  SEC_PCM_SIZE:     number;
  PCM_FORMAT:       string;
  AUDIO_CHANNELS:   number;
  AUDIO_FREQUENCY:  number;
}
export const audio_config: AudioConfig = Object.freeze({
  NIGHTCORE_AUDIO_FREQUENCY: 22000,
  REFRESH_PLAYLIST_INTERVAL: 500,
  MAX_READ_RETRY:   4,
  LARGE_CHUNK_SIZE: 2048,
  SMALL_CHUNK_SIZE: 256,
  SEC_PCM_SIZE:     4,
  PCM_FORMAT:       "none",
  AUDIO_CHANNELS:   2,
  AUDIO_FREQUENCY:  44100,
})

export type SearchConfig = {
  ITEMS_PER_PAGE:   number;
  SEARCH_DISTANCE:  number;
  SEARCH_THRESHOLD: number;
}
export const search_config: SearchConfig = Object.freeze({
  ITEMS_PER_PAGE:   5,
  SEARCH_DISTANCE:  5,
  SEARCH_THRESHOLD: 5
})

export type DBConfig = {
	DATABASE_ACCESS_WAIT:      number;
	MAX_UPDATES_BEFORE_SAVE:   number;
	GUILDDATA_COLLECTION_NAME: string;
	MONGODB_DBNAME:            string;
	MAX_DATABASE_RETRY_WAIT:   number;

}
export const db_config: DBConfig = Object.freeze({
  DATABASE_ACCESS_WAIT:      100,
	MAX_UPDATES_BEFORE_SAVE:   2,
	GUILDDATA_COLLECTION_NAME: 'bebra',
	MONGODB_DBNAME:            'bebraBase',
	MAX_DATABASE_RETRY_WAIT:   5
})