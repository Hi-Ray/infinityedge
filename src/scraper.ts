import HomepageJson from './interfaces/homepageJson';
import Event from './interfaces/event';
import { knownMainFiles } from './stormrazor/lol';

import { Command } from 'commander';
import * as cheerio from 'cheerio';
import * as fs from 'fs/promises';
import axios, { AxiosResponse } from 'axios';
import Tracer from 'tracer';
import TftHomepageJson from './interfaces/tfthomepageJson';
import processManifest from './stormrazor/riot-client';

const logger = Tracer.colorConsole();

// Locale to pull from.
export const locale = 'en_US';

// Homepage url.
const homepageUrls = {
    lol: 'https://lolstatic-a.akamaihd.net/lc-home-config/v1/live/lc_home_en_AU.json',
    tft: 'https://clientconfig.rpg.riotgames.com/api/v1/config/public?namespace=lol.client_settings.tft',
};

const riotClientManifests = [
    'https://lol.secure.dyn.riotcdn.net/channels/public/rccontent/tft/theme/manifest.json',
    'https://riot-client.secure.dyn.riotcdn.net/channels/public/rccontent/arcane/theme/manifest.json',
    'https://wildrift.secure.dyn.riotcdn.net/channels/public/rccontent/theme/manifest.json',
    'https://valorant.secure.dyn.riotcdn.net/channels/public/rccontent/theme/03/manifest.json',
    'https://bacon.secure.dyn.riotcdn.net/channels/public/rccontent/theme/manifest.json',
    'https://lol.secure.dyn.riotcdn.net/channels/public/rccontent/theme/manifest_default.json',
    'https://riot-client.secure.dyn.riotcdn.net/channels/public/rccontent/theme/manifest_live.json',
];

/**
 * Returns the homepage data.
 *
 * @async
 */
export async function getHomepages(): Promise<{ game: string; data: TftHomepageJson | HomepageJson }[]> {
    const res = [];

    for (const game in homepageUrls) {
        let data: AxiosResponse<TftHomepageJson | HomepageJson>;
        switch (game) {
            case 'lol':
                data = await axios.get<HomepageJson>(homepageUrls[game]);
                break;
            case 'tft':
                data = await axios.get<TftHomepageJson>(homepageUrls[game]);
                break;
            default:
                logger.error(`Invalid game scraped: ${game}`);
                continue;
        }
        res.push({ game: game, data: data.data });
    }

    return res;
}

async function getMainFile(events: Event[]) {
    const dists: Event[] = [];

    for (const event of events) {
        event.url ? replacePlaceholder(event.url) : event.url;

        if (typeof event.url !== 'undefined') {
            const webPage = await axios.get(event.url);
            const webData = cheerio.load(webPage.data);

            webData('script').each((_, link) => {
                if (
                    typeof link.attribs.src !== 'undefined' &&
                    knownMainFiles.some((file) => link.attribs.src.includes(file))
                ) {
                    if (!link.attribs.src.includes('http')) {
                        const url = new URL(event.url ?? '');
                        link.attribs.src = `${url.protocol}//${url.hostname}${link.attribs.src}`;
                    }
                    dists.push({
                        event: event.event,
                        url: link.attribs.src.split('?')[0],
                        game: event.game,
                    });
                }
            });
        }
    }

    return dists;
}

/**
 * Replaces the placeholder inside a url.
 *
 * @param str {string}
 */
export function replacePlaceholder(str: string) {
    return str.replaceAll('{current_country_locale}', locale).replaceAll('{locale}', locale);
}

export function parseTftEventName(str: string) {
    return str.split('/')[3];
}

/**
 * Main logic for the scraper
 *
 * @async
 * @param [json=true] {boolean}
 * @param [name="events.json"] {string}
 */
export const scraper = async (json = false, name = 'events.json') => {
    const dists: Event[] = [];
    const homePages = await getHomepages();

    logger.info('Fetching riot-client assets');

    for (const riotClientManifest of riotClientManifests) {
        await processManifest(riotClientManifest, 'events');
    }

    for (const homePage of homePages) {
        if (homePage.game === 'lol') {
            const page = <HomepageJson>homePage.data;
            page.npe.navigation.forEach((value) => {
                if (!value.isPlugin && value.url?.includes('prod.embed.rgpub.io')) {
                    logger.info(`Found LOL event: ${value.id}`);
                    dists.push({ event: value.id, url: replacePlaceholder(value.url), game: homePage.game });
                }
            });
        } else if (homePage.game === 'tft') {
            const page = <TftHomepageJson>homePage.data;
            page['lol.client_settings.tft.tft_events'].events.forEach((event) => {
                logger.info(`Found TFT event: ${parseTftEventName(event.url)}`);
                dists.push({
                    event: parseTftEventName(event.url),
                    url: replacePlaceholder(event.url),
                    game: homePage.game,
                });
            });
        }
    }

    if (json) {
        const distJson = JSON.stringify(dists);
        logger.info('Writing to json file: ' + name);
        await fs.writeFile(name, distJson);
    }

    return getMainFile(dists);
};

if (require.main === module) {
    const program = new Command();

    program.option('-o, --output <file>', 'JSON output', 'events.json').action((options) => {
        scraper(true, options.output).catch(logger.error);
    });

    program.parse(process.argv);
}
