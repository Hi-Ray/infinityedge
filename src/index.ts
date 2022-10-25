import Chalk from 'chalk';
import Tracer from 'tracer';
import dotenv from 'dotenv';

import { sync } from './sync';

import { scraper } from './scraper';
import { handle } from './stormrazor';
import { checkEnvironment } from './sync';

// Main logger
export const logger = Tracer.colorConsole();

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
// Start
logger.warn('< < < START > > >');

logger.info('Loading environment variables...');

// Load environment variables
dotenv.config();

logger.info('Checking environment variables');

// Check Samba Environmental Variables
checkEnvironment();

const main = async () => {
    // Get Current Events
    const dists = await scraper();
    logger.info(`Found ${dists.length} current events.`);

    // Use stormrazor to download all events
    for (const dist of dists) {
        logger.info('Downloading event: ' + dist.event);
        await handle(dist.url, `events/${dist.event}`);
    }

    // Sync to Samba Share
    await sync();
};

main();
