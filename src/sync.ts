import SambaClient from 'samba-client';
import Tracer from 'tracer';
import dotenv from 'dotenv';
import sftp from 'ssh2-sftp-client';

import { PathLike } from 'fs';
import * as fs from 'fs/promises';

const logger = Tracer.colorConsole();

const currentYear = new Date().getFullYear();
const currentMonth = ('0' + (new Date().getMonth() + 1)).slice(-2);

/**
 * Check that the important environment variables aren't empty/null.
 *
 * @param [die=false] {boolean}
 */
export const checkEnvironment = (die = false) => {
    const environment = [process.env.FTP_URL, process.env.FTP_USERNAME, process.env.FTP_PASSWORD].map((env) => {
        return typeof env !== 'undefined' && env !== null && env !== '';
    });

    if (environment.includes(false)) {
        if (die) {
            logger.fatal(`One or more environment variables are not defined please check the ".env" file.`);
            process.exit(1);
        } else {
            logger.info('One or more FTP environmental variables are not defined. Disabling FTP.');
            return false;
        }
    }

    logger.info('FTP syncing enabled.');
    return true;
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
            if (item.name.toLowerCase().includes('.ds_store')) {
                continue;
            }

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

    const client = new sftp('infinityedge');

    await client.connect({
        username: process.env.FTP_USERNAME,
        password: process.env.FTP_PASSWORD,
        port: 22,
        host: process.env.FTP_URL,
    });

    if (!(await client.exists('/data'))) {
        logger.error('Could not find the data directory.');
        process.exit(1);
    }

    if (!(await client.exists(`/data/${currentYear}`))) {
        await client.mkdir(`/data/${currentYear}`);
    }

    const folders = await getDirectories('events');

    existsCache.push('events');

    existsCache.push(`events/${currentYear}`);

    for (const event of folders) {
        if (!(await client.exists(`data/${currentYear}/${event}`))) {
            const files = await getFileList(`events/${event}`);

            for (const file of files) {
                if (file.startsWith('riot-client')) {
                    if (
                        await client.exists(
                            `data/riot-client/${currentYear}/${currentMonth}/${
                                file.match(/\//g)?.length == 1 ? file : file.replace('riot-client/', '')
                            }`,
                        )
                    ) {
                        logger.info('file exists skipping');
                        continue;
                    }

                    await client.put(
                        `events/${file}`,
                        `data/riot-client/${currentYear}/${currentMonth}/${
                            file.match(/\//g)?.length == 1 ? file : file.replace('riot-client/', '')
                        }`,
                    );
                } else {
                    if (await client.exists(`data/${currentYear}/${file.replace('lol/', '').replace('tft/', '')}`)) {
                        logger.info('file exists skipping');
                        continue;
                    }

                    logger.info(
                        'Transferring file ' + `data/${currentYear}/${file.replace('lol/', '').replace('tft/', '')}`,
                    );

                    await client.put(
                        `events/${file}`,
                        `data/${currentYear}/${file.replace('lol/', '').replace('tft/', '')}`,
                    );
                }
            }
        }
    }
    await client.end();
};

if (require.main === module) {
    dotenv.config();
    sync().catch(logger.error);
}
