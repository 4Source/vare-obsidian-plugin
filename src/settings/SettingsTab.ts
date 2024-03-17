import { App, PluginSettingTab, Setting } from 'obsidian';
import { ICON_ADD, ICON_GITHUB, ICON_INSTALL, ICON_RELOAD, ICON_REMOVE } from 'src/constants';
import VarePlugin from 'src/main';
import { PluginData, PluginInfo } from './SettingsInterface';
import { PluginDataModal } from 'src/modals/PluginDataModal';
import { fetchManifest } from 'src/util/GitHub';

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

	display(): void {
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
						plugin.targetVersion = value;
						this.display();
					}));

			if (plugin.targetVersion && plugin.version !== plugin.targetVersion) {
				settings
					.addExtraButton(button => button
						.setIcon(ICON_INSTALL)
						.setTooltip('Install version')
						.onClick(async () => {
							try {
								// Fetch the manifest from GitHub
								const manifest = await fetchManifest(plugin.repo, plugin.targetVersion);
								if (!manifest) {
									throw Error('No manifest found for this plugin!');
								}
								// Ensure contains dir
								if (!manifest.dir) {
									manifest.dir = plugin.id;
								}
								// Get the version that should be installed
								const version = plugin.targetVersion || manifest.version;
								if (!version) {
									throw Error('Manifest do not contain a version!');
								}
								// Install plugin
								await this.plugin.app.plugins.installPlugin(plugin.repo, version, manifest);
								// Update manifest
								const installed = this.plugin.app.plugins.manifests[plugin.id];
								if (!installed) {
									throw Error('Installation failed!');
								}
								plugin.version = installed.version;

								// Update and save Settings
								const data: PluginData = {
									id: plugin.id,
									repo: plugin.repo,
									targetVersion: plugin.targetVersion,
								};
								this.plugin.settings.plugins[plugin.id] = data;
								await this.plugin.saveSettings();

								this.display();
							}
							catch (e) {
								(e as Error).message = 'Failed to install plugin! ' + (e as Error).message;
								console.error(e);
							}
						}));
			}
		});
	}
}
