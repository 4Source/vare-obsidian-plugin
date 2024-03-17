import { Plugin } from 'obsidian';
import { VareSettingTab } from './settings/SettingsTab';
import { DEFAULT_SETTINGS, Settings } from './settings/SettingsInterface';

export default class VarePlugin extends Plugin {
	settings: Settings;

	async onload () {
		await this.loadSettings();

		// This adds a settings tab so the user can configure various aspects of the plugin
		this.addSettingTab(new VareSettingTab(this.app, this));
	}

	onunload () {
		
	}

	async loadSettings () {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings () {
		await this.saveData(this.settings);
	}
}
