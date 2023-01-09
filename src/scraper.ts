import HomepageJson from './interfaces/homepageJson';
import Event from './interfaces/event';
import { knownMainFiles } from './stormrazor';

import { Command } from 'commander';
import * as cheerio from 'cheerio';
import * as fs from 'fs/promises';
import axios from 'axios';
import Tracer from 'tracer';

const logger = Tracer.colorConsole();

// Locale to pull from.
export const locale = 'en_US';

// Homepage url.
const homepageUrl = 'https://lolstatic-a.akamaihd.net/lc-home-config/v1/live/lc_home_en_US.json';

/**
 * Returns the homepage data.
 *
 * @async
 */
export async function getHomepage(): Promise<HomepageJson> {
    const data = await axios.get<HomepageJson>(homepageUrl);
    return data.data;
}

/**
 * Replaces the placeholder inside a url.
 *
 * @param str {string}
 */
export function replacePlaceholder(str: string) {
    return str.replaceAll('{current_country_locale}', locale);
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
    const homePage = await getHomepage();

    const events = homePage.npe.navigation.filter((obj) => 
        'url' in obj && obj.id.includes('202'),
    );

    for (const event of events) {
        event.url ? replacePlaceholder(event.url) : event.url;

        logger.info(`Found event: ${event.id}`);

        if (typeof event.url !== 'undefined') {
            const webPage = await axios.get(event.url);
            const webData = cheerio.load(webPage.data);

            webData('script').each((_, link) => {
                if (typeof link.attribs.src !== 'undefined' && knownMainFiles.some(file => link.attribs.src.includes(file))) {
                    if(!link.attribs.src.includes("http")) {
                        const url = new URL(event.url ?? "");
                        link.attribs.src = `${url.protocol}//${url.hostname}${link.attribs.src}`;
                        logger.info(link.attribs.src);
                    }
                    dists.push({ event: event.id, url: link.attribs.src.split('?')[0] });
                }
            });
        }
    }

    if (json) {
        const distJson = JSON.stringify(dists);
        logger.info('Writing to json file: ' + name);
        await fs.writeFile(name, distJson);
    }

    return dists;
};

if (require.main === module) {
    const program = new Command();

    program.option('-o, --output <file>', 'JSON output', 'events.json').action((options) => {
        scraper(true, options.output).catch(logger.error);
    });

    program.parse(process.argv);
}
