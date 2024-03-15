import { App, PluginSettingTab, Setting } from 'obsidian';
import { ICON_ADD, ICON_GITHUB, ICON_INSTALL, ICON_RELOAD, ICON_REMOVE } from 'src/constants';
import VarePlugin from 'src/main';
import { PluginInfo } from './SettingsInterface';
import { PluginDataModal } from 'src/modals/plugindatamodal';

export class VareSettingTab extends PluginSettingTab {
	plugin: VarePlugin;
	pluginsList: PluginInfo[];

	constructor(app: App, plugin: VarePlugin) {
		super(app, plugin);
		this.plugin = plugin;

		this.pluginsList = [];
		this.pluginsList.push({
			author: 'Test',
			id: 'test',
			name: 'Test',
			releases: [
				{
					tag_name: '0.0.1',
				},
				{
					tag_name: '0.0.0',
				},
			],
			repo: '',
			version: '0.0.0',
		});
	}

	display (): void {
		const { containerEl } = this;

		containerEl.empty();

		// Heading for Profiles
		new Setting(containerEl)
			.setHeading()
			.setName('Plugins')
			.addExtraButton(button => button
				.setIcon(ICON_ADD)
				.setTooltip('Add unlisted plugin')
				.onClick(() => {
					// Open plugin modal
					new PluginDataModal(this.plugin, result => {
						this.pluginsList.push(result);
						this.display();
					})
					.open();
				}))
			.addExtraButton(button => button
				.setIcon(ICON_RELOAD)
				.setTooltip('Reload plugins')
				.onClick(() => {
					// Reload plugins
					this.display();
				}));

		this.pluginsList.forEach(plugin => {
			let versions = {};
			if (plugin.releases.length > 0) {
				plugin.releases.forEach(element => {
					if (element.tag_name) {
						const key = element.tag_name;
						const value = element.tag_name;
						versions = Object.assign(versions, { [key]: value });
					}
				});
			}

			const settings = new Setting(containerEl.createEl('div', { cls: 'plugins-container' }))
				.setName(plugin.name)
				.setDesc(createFragment((fragment) => {
					fragment.append(`Installed version: ${plugin.version}`, fragment.createEl('br'), `Author: ${plugin.author}`);
				}))
				.addExtraButton(button => button
					.setIcon(ICON_GITHUB)
					.setTooltip('Open at GitHub')
					.onClick(async () => {
						// Remove plugin
					}))
				.addExtraButton(button => button
					.setIcon(ICON_REMOVE)
					.setTooltip('Remove')
					.onClick(async () => {
						// Remove plugin
					}))
				.addDropdown(dropdown => dropdown
					.addOptions(versions)
					.setValue(plugin.targetVersion || plugin.version)
					.onChange(value => {
						if (value === 'latest') {
							plugin.targetVersion = undefined;
						}
						else {
							plugin.targetVersion = value;
						}
						this.display();
					}));

			if (plugin.targetVersion && plugin.version !== plugin.targetVersion) {
				settings
					.addExtraButton(button => button
						.setIcon(ICON_INSTALL)
						.setTooltip('Install version')
						.onClick(() => {
							// download plugin version
						}));
			}
		});
	}
}
