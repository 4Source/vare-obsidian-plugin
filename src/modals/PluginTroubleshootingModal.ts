import { Modal, PluginManifest, Setting, debounce } from 'obsidian';
import { ICON_ACCEPT, ICON_DENY } from 'src/constants';
import VarePlugin from 'src/main';
import { PluginInfo } from 'src/settings/SettingsInterface';
import { fetchManifest, fetchReleases, repositoryRegEx } from 'src/util/GitHub';

export class PluginTroubleshootingModal extends Modal {
	plugin: VarePlugin;
	pluginInfo: PluginInfo;
	onSubmit: (result: PluginInfo) => void;

	constructor(plugin: VarePlugin, pluginInfo: PluginInfo, onSubmit: (result: PluginInfo) => void) {
		super(plugin.app);

		this.plugin = plugin;
		this.pluginInfo = structuredClone(pluginInfo);
		this.onSubmit = onSubmit;
	}

	async onOpen(): Promise<void> {
		const { contentEl } = this;
		let username = this.pluginInfo.repo.split('/').at(0) || '';
		let repository = this.pluginInfo.repo.split('/').at(1) || '';
		let manifest: PluginManifest | undefined;
		let hasManifest = false;
		let hasReleases = false;

		// Debonce text input
		const updateRepo = debounce(() => {
			this.pluginInfo.repo = `${username}/${repository}`;
			this.update();
		}, 1500, true);

		// Heading for Edit profile
		this.setTitle(`Troubleshoot plugin ${this.pluginInfo.name}`);

		new Setting(contentEl)
			.setName('Github username')
			.setDesc('The name of the owner of the plugin')
			.addText(text => text
				.setPlaceholder('Username')
				.setValue(username)
				.onChange(value => {
					if (value.contains('/')) {
						const repoSections = value.split('/');
						username = repoSections[0];
						repository = repoSections[1];
					}
					else {
						username = value;
					}
					updateRepo();
				}));

		new Setting(contentEl)
			.setName('Github repository')
			.setDesc('The name of the repository of the plugin')
			.addText(text => text
				.setPlaceholder('Repository')
				.setValue(repository)
				.onChange(value => {
					if (value.contains('/')) {
						const repoSections = value.split('/');
						username = repoSections[0];
						repository = repoSections[1];
					}
					else {
						repository = value;
					}
					updateRepo();
				}));

		new Setting(contentEl)
			.setName('Test pattern')
			.setDesc(repositoryRegEx.test(this.pluginInfo.repo) ? '' : 'Username or repository contains invalid input.')
			.addExtraButton(button => button
				.setIcon(repositoryRegEx.test(this.pluginInfo.repo) ? ICON_ACCEPT : ICON_DENY)
				.setTooltip(repositoryRegEx.test(this.pluginInfo.repo) ? '' : 'Try again?')
				.setDisabled(repositoryRegEx.test(this.pluginInfo.repo))
				.onClick(() => {
					this.update();
				}));
		
		let releases = undefined;
		if (repositoryRegEx.test(this.pluginInfo.repo)) {
			releases = await fetchReleases(this.pluginInfo.repo);
			hasReleases = releases !== undefined && (releases.length > 0);
			new Setting(contentEl)
				.setName('Test releases')
				.setDesc(hasReleases ? '' : 'Could not find releases on GitHub. May this plugin did not have any.')
				.addExtraButton(button => button
					.setIcon(hasReleases ? ICON_ACCEPT : ICON_DENY)
					.setTooltip(hasReleases ? '' : 'Try again?')
					.setDisabled(hasReleases)
					.onClick(() => {
						this.update();
					}));
		}

		if (repositoryRegEx.test(this.pluginInfo.repo) && hasReleases) {
			const last_release = releases ? releases[0] : undefined;
			manifest =
				await fetchManifest(undefined, undefined, last_release) ||
				await fetchManifest(this.pluginInfo.repo);
			hasManifest = manifest !== undefined;
			new Setting(contentEl)
				.setName('Test manifest')
				.setDesc(hasManifest ? '' : 'Manifest could not be found on GitHub. Is everything including the repo typed correctly?')
				.addExtraButton(button => button
					.setIcon(hasManifest ? ICON_ACCEPT : ICON_DENY)
					.setTooltip(hasManifest ? '' : 'Try again?')
					.setDisabled(hasManifest)
					.onClick(() => {
						this.update();
					}));
		}

		new Setting(contentEl)
			.addButton(button => button
				.setButtonText('Save')
				.setDisabled(!repositoryRegEx.test(this.pluginInfo.repo) || !hasManifest)
				.onClick(async () => {
					if (hasReleases && releases) {
						this.pluginInfo.releases = releases;
						this.pluginInfo.lastFetch = new Date();
					}
					this.onSubmit(this.pluginInfo);
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

	update(): void {
		this.onClose();
		this.onOpen();
	}
}