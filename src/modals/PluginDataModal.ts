import { Modal, Notice, Setting } from 'obsidian';
import VarePlugin from 'src/main';
import { PluginInfo } from 'src/settings/SettingsInterface';
import { fetchManifest, fetchReleases, repositoryRegEx } from 'src/util/GitHub';

export class PluginDataModal extends Modal {
	plugin: VarePlugin;
	onSubmit: (result: PluginInfo) => void;

	constructor(plugin: VarePlugin, onSubmit: (result: PluginInfo) => void) {
		super(plugin.app);

		this.plugin = plugin;
		this.onSubmit = onSubmit;
	}

	onOpen(): void {
		const { contentEl } = this;
		let username: string;
		let repository: string;

		// Heading for Edit profile
		this.setTitle('Profile options');

		new Setting(contentEl)
			.setName('Github username')
			.setDesc('The name of the owner of the plugin')
			.addText(text => text
				.setPlaceholder('Username')
				.onChange(value => {
					// Assign value of this Setting 
					username = value;
				}));

		new Setting(contentEl)
			.setName('Github repository')
			.setDesc('The name of the repository of the plugin')
			.addText(text => text
				.setPlaceholder('Repository')
				.onChange(value => {
					// Assign value of this Setting 
					repository = value;
				}));

		new Setting(contentEl)
			.addButton(button => button
				.setButtonText('Save')
				.onClick(async () => {
					// Check username exist and is not empty
					if (!username || username === '') {
						new Notice('Github username cannot be empty!');
						return;
					}
					// Check repository exist and is not empty
					if (!repository || repository === '') {
						new Notice('Github repository cannot be empty!');
						return;
					}
					// Check the repo matches the pattern
					const repo = `${username}/${repository}`;
					if (!repositoryRegEx.test(repo)) {
						new Notice('Github <username>/<repository> do not match the pattern!');
						return;
					}
					// Check a manifest could be fetched
					const manifest = await fetchManifest(repo);
					if (!manifest) {
						new Notice('Github repository could not be found!');
						return;
					}
					// check there are releases for the repo
					const releases = await fetchReleases(repo);
					if (!releases || releases.length <= 0) {
						new Notice('No releases found for this plugin. May it do not have any.');
						return;
					}
					// Combine data
					const pluginInfo = Object.assign({}, manifest, { repo, releases }) as PluginInfo;
					pluginInfo.targetVersion = pluginInfo.version;
					pluginInfo.version = '';
					this.onSubmit(pluginInfo);
					this.close();
				}))
			.addButton(button => button
				.setButtonText('Cancel')
				.setWarning()
				.onClick(() => {
					this.close();
				}));
	}

	onClose(): void {
		const { contentEl } = this;
		contentEl.empty();
	}
}
