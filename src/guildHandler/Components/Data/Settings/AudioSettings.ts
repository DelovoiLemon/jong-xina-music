import EventEmitter from 'events';
import TypedEmitter from 'typed-emitter';

import { AudioConfig, EQConfig, AUDIO_PRESETS, EQ_PRESETS } from './config/audioConfig';

type EventTypes = {
	newSettings: (a: AudioSettings) => void,
	restartProcessor: () => void
}

/**
 * @name AudioSettings
 * Contains bot's audio settings for playback
 * Emits 'newSettings' and 'restartProcessor' event when settings are changed
 */
export default class AudioSettings {
	events: TypedEmitter<EventTypes>;
	private _audioSettings: AudioConfig;
	private _eqSettings: EQConfig;

	/**
	 * @param settings - object containing audio settings
	 */
	constructor(settings?: { audio: AudioConfig, eq: EQConfig }) {
		this.events = new EventEmitter() as TypedEmitter<EventTypes>;
		// set defaults first
		this._audioSettings = Object.assign({}, AUDIO_PRESETS.default);
		this._eqSettings = Object.assign({}, EQ_PRESETS.default);

		// apply settings
		if (!settings) {
			this.events.emit('newSettings', this);
			this.events.emit('restartProcessor');
			return;
		}
		Object.assign(this._audioSettings, settings.audio);
		Object.assign(this._eqSettings, settings.eq);
	}

	/**
	 * @name newSettings()
	 * Replaces settings with given settings and emits 'newSettings' and 'restartProcessor' event
	 */
	newSettings(settings: AudioConfig): void {
		// should validate audio settings <<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<
		Object.assign(this._audioSettings, settings);
		this.events.emit('newSettings', this);
		this.events.emit('restartProcessor');
	}

	/**
	 * @name newEQ()
	 * Replaces settings with given settings and emits 'newSettings' and 'restartProcessor' event
	 */
	newEQ(eq: EQConfig): void {
		// should validate eq settings <<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<
		Object.assign(this._eqSettings, eq);
		this.events.emit('newSettings', this);
		this.events.emit('restartProcessor');
	}

	/**
	 * @name export()
	 * Exports the settings in the format to be saved in database
	 */
	export(): { audio: AudioConfig, eq: EQConfig } {
		return { audio: this._audioSettings, eq: this._eqSettings };
	}

	// getters
	get name() { return this._audioSettings.name; }
	get volume() { return this._audioSettings.volume; }
	get normalize() { return this._audioSettings.normalize; }
	get nightcore() { return this._audioSettings.nightcore; }
	get eqName() { return this._eqSettings.name; }
	get eq() { return this._eqSettings.eq; }
}