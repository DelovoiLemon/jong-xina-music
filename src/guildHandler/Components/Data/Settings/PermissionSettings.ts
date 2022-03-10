import { Guild } from 'discord.js';
import { EventEmitter } from 'events';

import { PermissionsConfig, PERMISSIONS_DEFAULT } from './config/permissionConfig';

/**
 * PermissionSettings
 * 
 * Contains bot's guild settings
 * Emits 'newSettings' event when settings are changed
 */
export default class PermissionSettings extends EventEmitter {
	private _permissionSettings: PermissionsConfig;

	/**
	 * @param settings - object containing audio settings
	 */
	constructor(settings?: PermissionsConfig) {
		super();

		// apply settings
		if (!settings) return;
		this._permissionSettings = settings;
	}

	/**
	 * initPermissions()
	 * 
	 * Inititallizes permissions if no permissions have been set yet
	 * @param guild - Discord guild to get role ids from
	 */
	initPermissions(guild: Guild) {
		// set defaults if no permissions set up yet
		if (!this._permissionSettings) {
			this._permissionSettings = {};
			// find @everyone role id
			const everyone = guild.roles.cache.filter((role: { name: string }) => role.name === '@everyone').first();

			// give the default @everyone permissions to each command
			for (let i = 0; i < PERMISSIONS_DEFAULT.everyone.length; i++) {
				this._permissionSettings[PERMISSIONS_DEFAULT.everyone[i]] = [];
				this.addPermission(PERMISSIONS_DEFAULT.everyone[i], everyone.id);
			}

			// create default permissions for admins
			for (let i = 0; i < PERMISSIONS_DEFAULT.admin.length; i++) {
				this._permissionSettings[PERMISSIONS_DEFAULT.admin[i]] = [];
			}
			setImmediate(() => { this.emit('newSettings'); });
		}
	}

	/**
	 * addPermission()
	 *
	 * @param command - command to change permissions for
	 * @param roleId - discord role id for permissions you would like to add
	 */
	addPermission(command: string, roleId: string) {
		// remove the permission in case it already existed
		this.removePermission(command, roleId);
		this._permissionSettings[command].push(roleId);
		this.emit('newSettings');
	}

	/**
	 * removePermission()
	 *
	 * @param command - command to change permissions for
	 * @param roleId - discord role id for permissions you would like to add
	 */
	removePermission(command: string, roleId: string) {
		// find location of the roleId in the permissions list
		const location = this._permissionSettings[command].indexOf(roleId);

		if (location !== -1) {
			// if found, remove it and save to database
			this._permissionSettings[command].splice(location, 1);
			this.emit('newSettings');
		}
	}

	/**
	 * getFor()
	 * 
	 * Get the list of allowed roles for a particular permission
	 * @param command - name of command to get permissions for
	 * @returns list of role ids for allowed roles
	 */
	getFor(command: string) { return this._permissionSettings[command]; }

	/**
	 * export()
	 * 
	 * Exports the settings in the format to be saved in database
	 * @returns object to be saved in database
	 */
	export() { return this._permissionSettings; }
}