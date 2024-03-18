import { App, PluginManifest, PluginSettingTab, Setting } from 'obsidian';
import { ICON_ADD, ICON_FETCH, ICON_FIX, ICON_GITHUB, ICON_INSTALL, ICON_RELOAD, ICON_RESET } from 'src/constants';
import VarePlugin from 'src/main';
import { PluginData, PluginInfo } from './SettingsInterface';
import { PluginDataModal } from 'src/modals/PluginDataModal';
import { fetchCommmunityPluginList, fetchManifest, fetchReleases } from 'src/util/GitHub';
import { TroubleshootingModal } from 'src/modals/TroubleshootingModal';

export class VareSettingTab extends PluginSettingTab {
	plugin: VarePlugin;
	pluginsList: PluginInfo[];

	constructor(app: App, plugin: VarePlugin) {
		super(app, plugin);
		this.plugin = plugin;

		const manifests = Object.entries(structuredClone(this.plugin.app.plugins.manifests));
		const pluginData = Object.entries(this.plugin.settings.plugins);
		this.pluginsList = manifests.map(manifest => {
			const info: PluginInfo = { ...(manifest[1] as PluginManifest), repo: '', releases: [] };
			const data = pluginData.filter(data => data[0] === manifest[0])[0];
			if (!data) {
				return info;
			}
			return Object.assign(info, data[1]);
		});
	}

	async display(): Promise<void> {
		const { containerEl } = this;

		containerEl.empty();

		// Get the releases for plugins
		const communityList = await fetchCommmunityPluginList();
		Promise.all(this.pluginsList.map(async value => {
			const now = new Date();

			/**
			 * Fetch releases when one of the codition is true to reduce loading time and network trafic
			 * - Has never been fetched
			 * - The last fetch was more than a day ago
			 */
			if (!value.lastFetch || now.getTime() - (1000 * 60 * 60 * 12) >= new Date(value.lastFetch).getTime()) {
				// Get repo from community plugin list if there is an entry
				if (value.repo === '') {
					const community = communityList?.find(community => community.id === value.id);
					if (!community) {
						return;
					}
					value.repo = community.repo;
				}
				// Fetch releases from github
				const releases = await fetchReleases(value.repo);
				if (!releases) {
					return;
				}
				value.lastFetch = now;
				value.releases = releases;
			}

			// Update and save Settings
			const data: PluginData = {
				id: value.id,
				repo: value.repo,
				targetVersion: value.targetVersion,
				releases: value.releases,
				lastFetch: value.lastFetch,
			};
			this.plugin.settings.plugins[value.id] = data;
		}))
			.then(async () => {
				await this.plugin.saveSettings();
			})
			.then(() => {
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
							}).open();
						}))
					.addExtraButton(button => button
						.setIcon(ICON_RELOAD)
						.setTooltip('Reload plugins')
						.onClick(() => {
							// Reload plugins
							this.display();
						}));

				this.pluginsList.forEach(plugin => {
					// Build dropdown options with releasees
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

					// Missing information
					let trouble = false;

					// Plugin Info
					const settings = new Setting(containerEl.createEl('div', { cls: 'plugins-container' }))
						.setName(plugin.name)
						.setDesc(createFragment((fragment) => {
							fragment.append(`Installed version: ${plugin.version}`, fragment.createEl('br'), `Author: ${plugin.author}`);
						}));

					// GitHub link button and release fetch
					if (plugin.repo) {
						settings.addExtraButton(button => button
							.setIcon(ICON_GITHUB)
							.setTooltip('Open at GitHub')
							.onClick(async () => {
								self.open(`https://github.com/${plugin.repo}`);
							}))
							.addExtraButton(button => button
								.setIcon(ICON_FETCH)
								.setTooltip('Fetch releases')
								.onClick(async () => {
									// Fetch releases from github
									const releases = await fetchReleases(plugin.repo);
									if (!releases) {
										return;
									}
									plugin.lastFetch = new Date();
									plugin.releases = releases;
									this.display();
								}));
					}
					else {
						trouble = true;
					}

					// Reset version
					settings.addExtraButton(button => button
						.setIcon(ICON_RESET)
						.setTooltip('Reset version')
						.onClick(async () => {
							delete plugin.targetVersion;
							this.display();
						}));

					// Version dropdown
					if (plugin.releases.length > 0) {
						settings.addDropdown(dropdown => dropdown
							.addOptions(versions)
							.setValue(plugin.targetVersion || '')
							.onChange(value => {
								plugin.targetVersion = value;
								this.display();
							}));
					}
					else {
						trouble = true;
					}

					// Trouble shooting plugin
					if (trouble) {
						settings.addButton(button => button
							.setIcon(ICON_FIX)
							.setTooltip('Troubleshoot plugin.')
							.setWarning()
							.onClick(() => {
								new TroubleshootingModal(this.plugin, plugin, result => {
									this.pluginsList.every((value, index, array) => {
										if (value.id === result.id) {
											array[index] = result;
											return false;
										}
										return true;
									});
									this.display();
								}).open();
							}));
					}

					if (plugin.targetVersion && plugin.version !== plugin.targetVersion) {
						settings.addExtraButton(button => button
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
									// @ts-expect-error PluginManifest contains error
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
										releases: plugin.releases,
										lastFetch: plugin.lastFetch,
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
			});
	}
}
