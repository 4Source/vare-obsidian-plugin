import { } from 'obsidian';

declare module 'obsidian' {
	interface Plugins {
		manifests: Record<string, PluginManifest>;
	}

	interface App {
		plugins: Plugins;
	}
}