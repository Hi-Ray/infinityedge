import SambaClient from 'samba-client';
import Tracer from 'tracer';

import { PathLike } from 'fs';
import * as fs from 'fs/promises';

const logger = Tracer.colorConsole();

const currentYear = new Date().getFullYear();

/**
 * Check that the important environment variables aren't empty/null.
 *
 * @param [die=false] {boolean}
 */
export const checkEnvironment = (die = false) => {
    const environment = [process.env.SAMBA_URL, process.env.SAMBA_USERNAME, process.env.SAMBA_PASSWORD].map((env) => {
        return typeof env !== 'undefined' && env !== null && env !== '';
    });

    if (environment.includes(false)) {
        if (die) {
            logger.fatal(`One or more environment variables are not defined please check the ".env" file.`);
            process.exit(1);
        } else {
            logger.info('One or more Samba environmental variables are not defined. Disabling Samba.');
            return false;
        }
    }

    logger.info('Samba syncing enabled.');
    return true;
};

/**
 * Create a samba client.
 *
 * @returns {SambaClient}
 */
export const createSamba = (): SambaClient => {
    return new SambaClient({
        address: process.env.SAMBA_URL || '',
        username: process.env.SAMBA_USERNAME,
        password: process.env.SAMBA_PASSWORD,
        domain: 'WORKGROUP',
        maxProtocol: 'SMB3',
        maskCmd: true,
    });
};

/**
 * Gets all the samba directories.
 *
 * @async
 * @param source {PathLike} the source directory.
 */
const getDirectories = async (source: PathLike): Promise<string[]> =>
    (await fs.readdir(source, { withFileTypes: true }))
        .filter((dirent) => dirent.isDirectory())
        .map((dirent) => dirent.name);

/**
 * Get the samba file list.
 *
 * @async
 * @param dirName {string}
 */
const getFileList = async (dirName: string): Promise<string[]> => {
    let files: string[] = [];
    const items = await fs.readdir(dirName, { withFileTypes: true });

    for (const item of items) {
        if (item.isDirectory()) {
            files = [...files, ...(await getFileList(`${dirName}/${item.name}`))];
        } else {
            files.push(`${dirName}/${item.name}`.replace('events/', ''));
        }
    }
    return files;
};

/**
 * Directory exists cache.
 */
const existsCache: string[] = [];

/**
 * Verify that the samba directory exists.
 *
 * @async
 * @param client {SambaClient}
 * @param file {string}
 */
const verifyDirectoryExists = async (client: SambaClient, file: string): Promise<void> => {
    const pieces = file.split('/');
    const range = [...Array(pieces.length).keys()];

    for (const i of range) {
        const name = pieces.slice(0, i).join('/');

        if (!name.includes('.') && !existsCache.includes(name) && !(await client.fileExists(name))) {
            logger.info('Making directory: ' + name);
            await client.mkdir(name);
            existsCache.push(name);
        }
    }
};

/**
 * Sync the data with the samba share.
 *
 * @async
 */
export const sync = async () => {
    checkEnvironment(true);

    const client = createSamba();
    const folders = await getDirectories('events');

    if (!(await client.fileExists(`events`))) {
        await client.mkdir(`events`);
    }

    existsCache.push('events');

    if (!(await client.fileExists(`events/${currentYear}`))) {
        await client.mkdir(`events/${currentYear}`);
    }

    existsCache.push(`events/${currentYear}`);

    for (const event of folders) {
        if (!(await client.fileExists(`events/${currentYear}/${event}`))) {
            const files = await getFileList(`events/${event}`);

            for (const file of files) {
                logger.info('Transferring file' + file);
                await verifyDirectoryExists(client, `events/${currentYear}/${file}`);
                await client.sendFile(`events/${file}`, `events/${currentYear}/${file}`);
            }
        }
    }
};

if (require.main === module) {
    sync().catch(logger.error);
}
