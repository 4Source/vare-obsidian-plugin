import { } from 'obsidian';

declare module 'obsidian' {
	interface Plugins {
		manifests: Record<string, PluginManifest>;
		installPlugin(repo: string, version: string, manifest: PluginManifest): Promise<void>;
	}

	interface App {
		plugins: Plugins;
	}
}