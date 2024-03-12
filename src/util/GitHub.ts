/**
 * Credits: https://github.com/TfTHacker/obsidian42-brat
 */

import { request } from "obsidian";

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
    author: {},
    assets: Asset[];
};

export type Asset = {
    id: number;
    name: string;
    url: string;
    browser_download_url: string;
}

export type File = {
    name: string;
    data: string;
}

/**
 * Fetch all community plugin entrys.
 * @returns A list of community plugins
 */
export async function fetchCommmunityPluginList(): Promise<CommunityPlugin[]> {
    const pluginListUrl = `https://raw.githubusercontent.com/obsidianmd/obsidian-releases/HEAD/community-plugins.json`;
    try {
        const response = await request({ url: pluginListUrl });
        return response === '404: Not Found' ? [] : (
            ((await JSON.parse(response)) as CommunityPlugin[])
        );
    } catch (e) {
        (e as Error).message = 'Failed to fetch community plugin list! ' + (e as Error).message;
        console.error(e);
        return [];
    }
};

/**
 * Fetch all releases for a plugin
 * @param repository The <user>/<repo> of the plugin
 * @returns A list of all releases
 */
export async function fetchReleases(repository: string): Promise<Partial<Release>[]> {
    try {
        const URL = `https://api.github.com/repos/${repository}/releases`;
        const response = await request({
            url: URL
        });
        const data = await JSON.parse(response);
        let releases = data.map((value: Release) => {
            return {
                tag_name: value.tag_name,
                prerelease: value.prerelease
            };
        })
        return releases;
    }
    catch (e) {
        (e as Error).message = 'Failed to fetch releases for plugin! ' + (e as Error).message;
        console.error(e);
        return [];
    }
}

/**
 * Downloads the assets from a release from GitHub
 * @param repository The <user>/<repo> of the plugin
 * @param tag_name The name of the tag belongs the the release
 * @returns The Assets attached to the release as string
 * @todo Checksum 
 */
export async function downloadReleaseAssets(repository: string, tag_name: string): Promise<File[] | undefined> {
    try {
        const URL = `https://api.github.com/repos/${repository}/releases/tags/${tag_name}`;
        const response = await request({
            url: URL
        });
        const data = await JSON.parse(response);
        let assets: Asset[] = data.assets;

        let assetData: File[] = [];

        assets.forEach(async (asset) => {
            const URL = asset.browser_download_url;
            const response = await request({
                url: URL
            });
            assetData.push({ name: asset.name, data: response });
        });

        return assetData;

    } catch (e) {
        (e as Error).message = 'Failed to fetch the release for plugin! ' + (e as Error).message;
        console.error(e);
    }
}