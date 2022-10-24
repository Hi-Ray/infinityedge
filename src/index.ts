import Chalk from 'chalk';
import Tracer from 'tracer';
import axios from 'axios';
import dotenv from 'dotenv';

import SambaClient from 'samba-client';

import HomepageJson from './interfaces/homepageJson';

// Locale to pull from
export const locale = 'en_US';

// Homepage url
const homepageUrl = 'https://lolstatic-a.akamaihd.net/lc-home-config/v1/live/lc_home_en_US.json';

// Events to ignore
const eventsIgnore = ['overview', 'merch', 'latest_patch_notes', 'rcp-fe-lol-npe-rewards'];

// Main logger
const logger = Tracer.colorConsole();

// Date for the license notice
export const currentYear = new Date().getFullYear();

// License notice
console.log(
    Chalk.greenBright(
        `InfinityEdge Copyright (C) ${currentYear} HiRay & Contributors \nThis program comes with ABSOLUTELY NO WARRANTY;\nThis is free software, and you are welcome to redistribute it under certain conditions;\nPlease see LICENSE.md `,
    ),
);

/**
 * Converts hours to milliseconds
 *
 * @param hours {number}
 */
export function toHours(hours: number) {
    return hours * 60 * 60 * 1000;
}

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

// Start
logger.warn('< < < START > > >');

logger.info('Loading environment variables...');

// Load environment variables
dotenv.config();

logger.info('Checking environment variables');

// Check that the important environment variables aren't empty/null
[process.env.SAMBA_URL, process.env.SAMBA_USERNAME, process.env.SAMBA_PASSWORD].forEach((env) => {
    if (env == null || env == '') {
        logger.fatal(`One or more environment variables are not defined please check the ".env" file.`);
        process.exit(1);
    }
});

// Samba client
const client = new SambaClient({
    address: process.env.SAMBA_URL || '',
    username: process.env.SAMBA_USERNAME,
    password: process.env.SAMBA_PASSWORD,
    domain: 'WORKGROUP',
    maxProtocol: 'SMB3',
    maskCmd: true,
});
