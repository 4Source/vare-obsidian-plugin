import { Release } from 'src/util/GitHub';

export interface Settings {
	plugins: PluginData[];
}

export const DEFAULT_SETTINGS: Settings = {
	plugins: [],
};

export interface PluginData {
	id: string;
	targetVersion?: string;
	repo: string;
}

export interface PluginInfo extends PluginData {
	name: string;
	author: string;
	version: string;
	releases: Partial<Release>[]
}