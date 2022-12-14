import { sync } from './sync';
import { scraper } from './scraper';
import { handle } from './stormrazor';
import { checkEnvironment } from './sync';
import { version } from '../package.json';
import { greenBright, yellowBright } from 'colorette';
import Tracer from 'tracer';
import dotenv from 'dotenv';

// Main logger
const logger = Tracer.colorConsole();

// Date for the license notice
export const currentYear = new Date().getFullYear();

// License notice
console.log(
    greenBright(
        `InfinityEdge Copyright (C) ${currentYear} HiRay & Contributors \nThis program comes with ABSOLUTELY NO WARRANTY;\nThis is free software, and you are welcome to redistribute it under certain conditions;\nPlease see LICENSE.md `,
    ),
);

console.log(yellowBright(`InfinityEdge Version: ${version}`));

// Start
logger.warn('< < < START > > >');

logger.info('Loading environment variables...');

// Load environment variables
dotenv.config();

logger.info('Checking environment variables');

// Check Samba Environmental Variables
const samba = checkEnvironment();

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
    if (samba) {
        await sync();
    }
};

if (require.main === module) {
    main().catch(logger.error);
}
