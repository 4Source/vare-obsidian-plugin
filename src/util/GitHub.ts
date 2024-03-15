/**
 * Credits: https://github.com/TfTHacker/obsidian42-brat
 */

import { PluginManifest, request } from 'obsidian';

export const repositoryRegEx = /^[a-z\d](?:[a-z\d]|-(?=[a-z\d])){0,38}\/[A-Za-z0-9_.-]+$/gi;

export interface CommunityPlugin {
	id: string;
	name: string;
	author: string;
	description: string;
	repo: string;
}

export type Release = {
	url: string;
	html_url: string;
	assets_url: string;
	upload_url: string;
	tarball_url: string;
	zipball_url: string;
	id: number;
	node_id: string,
	tag_name: string,
	target_commitish: string,
	name: string,
	body: string,
	draft: boolean,
	prerelease: boolean,
	created_at: string,
	published_at: string,
	author: unknown,
	assets: Asset[];
};

export type Asset = {
	id: number;
	name: string;
	url: string;
	browser_download_url: string;
};

export type File = {
	name: string;
	data: string;
};

/**
 * Fetch all community plugin entrys.
 * @returns A list of community plugins
 */
export async function fetchCommmunityPluginList (): Promise<CommunityPlugin[] | undefined> {
	const URL = 'https://raw.githubusercontent.com/obsidianmd/obsidian-releases/HEAD/community-plugins.json';
	try {
		// Do a request to the url
		const response = await request({ url: URL });

		// Process the response
		return (await JSON.parse(response)) as CommunityPlugin[];
	}
	catch (e) {
		(e as Error).message = 'Failed to fetch community plugin list! ' + (e as Error).message;
		console.error(e);
	}
}

/**
 * Fetch all releases for a plugin
 * @param repository The <user>/<repo> of the plugin
 * @returns A list of all releases
 */
export async function fetchReleases (repository: string): Promise<Partial<Release>[] | undefined> {
	const URL = `https://api.github.com/repos/${repository}/releases`;
	try {
		if (!repositoryRegEx.test(repository)) {
			throw Error('Repository string do not match the pattern!');
		}
		// Do a request to the url
		const response = await request({ url: URL });
		// Process the response
		const data = await JSON.parse(response);
		const releases = data.map((value: Release) => {
			return {
				tag_name: value.tag_name,
				prerelease: value.prerelease,
			};
		});
		return releases;
	}
	catch (e) {
		(e as Error).message = 'Failed to fetch releases for plugin! ' + (e as Error).message;
		console.error(e);
	}
}

/**
 * Fetch the manifest for a plugin
 * @param repository The <user>/<repo> of the plugin
 * @param tag_name The name of the tag associated with a release. Required if a specific manifest version is needed.
 * @returns The plugin manifest object
 */
export async function fetchManifest (repository: string, tag_name?: string): Promise<PluginManifest | undefined> {
	const URL = `https://raw.githubusercontent.com/${repository}/${tag_name ? tag_name : 'HEAD'}/manifest.json`;
	try {
		if (!repositoryRegEx.test(repository)) {
			throw Error('Repository string do not match the pattern!');
		}
		// Do a request to the url
		const response = await request({ url: URL });

		// Process the response
		return (await JSON.parse(response)) as PluginManifest;
	}
	catch (e) {
		(e as Error).message = 'Failed to fetch the manifest for plugin! ' + (e as Error).message;
		console.error(e);
	}
}

/**
 * Downloads the assets from a release from GitHub
 * @param repository The <user>/<repo> of the plugin
 * @param tag_name The name of the tag associated with a release.
 * @returns The Assets attached to the release as string
 * @todo Checksum
 */
export async function downloadReleaseAssets (repository: string, tag_name: string): Promise<File[] | undefined> {
	const URL = `https://api.github.com/repos/${repository}/releases/tags/${tag_name}`;
	try {
		if (!repositoryRegEx.test(repository)) {
			throw Error('Repository string do not match the pattern!');
		}
		const response = await request({ url: URL });
		const data = await JSON.parse(response);
		const assets: Asset[] = data.assets;

		const assetData: File[] = [];

		assets.forEach(async (asset) => {
			const URL = asset.browser_download_url;
			const response = await request({
				url: URL,
			});
			assetData.push({ name: asset.name, data: response });
		});

		return assetData;
	}
	catch (e) {
		(e as Error).message = 'Failed to fetch the release for plugin! ' + (e as Error).message;
		console.error(e);
	}
}