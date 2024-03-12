import { Plugin } from 'obsidian';
import { DEFAULT_SETTINGS, Settings } from './settings/SettingsInterface';
import { VarixSettingTab } from './settings/SettingsTab';

export default class VarixPlugin extends Plugin {
	settings: Settings;

	async onload () {
		await this.loadSettings();

		// This adds a settings tab so the user can configure various aspects of the plugin
		this.addSettingTab(new VarixSettingTab(this.app, this));
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
