import { Release } from 'src/util/GitHub';

export interface Settings {
	plugins: Record<PluginData['id'], PluginData>
}

export const DEFAULT_SETTINGS: Settings = {
	plugins: {},
};

export interface PluginData {
	id: string;
	targetVersion?: string;
	repo: string;
	releases: Partial<Release>[];
	lastFetch?: Date;
}

export interface PluginInfo extends PluginData {
	name: string;
	author: string;
	version: string;
}