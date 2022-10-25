import HomepageJson from './interfaces/homepageJson';
import * as cheerio from 'cheerio';
import axios from 'axios';
import * as fs from 'fs/promises';
import { Event } from './interfaces/event';
import { Command } from 'commander';
import { logger } from '.';

// Locale to pull from
export const locale = 'en_US';

// Homepage url
const homepageUrl = 'https://lolstatic-a.akamaihd.net/lc-home-config/v1/live/lc_home_en_US.json';

// Returns the homepage data
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

export const scraper = async (json = false, name = 'events.json') => {
    const dists: Event[] = [];
    const homePage = await getHomepage();
    const links = homePage.default.navigation
        .filter((obj) => 'url' in obj && obj.url.includes('event'))
        .map((obj) => obj.url);
    const replacedLinks = links.map((link) => replacePlaceholder(link));
    for (const link of replacedLinks) {
        const eventName = link.split('/').slice(-1)[0];
        logger.info(`Found event: ${eventName}`);
        const webPage = await axios.get(link);
        const webData = cheerio.load(webPage.data);
        webData('script').each((_, link) => {
            if (typeof link.attribs.src !== 'undefined' && link.attribs.src.includes('dist.js')) {
                dists.push({ event: eventName, url: link.attribs.src.split('?')[0] });
            }
        });
    }
    if (json) {
        const distJson = JSON.stringify(dists);
        await fs.writeFile(name, distJson);
    }
    return dists;
};

if (require.main === module) {
    // creates the CLI
    const program = new Command();
    program.option('-o, --output <file>', 'JSON output', 'events.json').action((options) => {
        scraper(true, options.output);
    });

    program.parse(process.argv);
}
