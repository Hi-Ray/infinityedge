import SambaClient from 'samba-client';

import { currentYear, logger } from '.';
import * as fs from 'fs/promises';
import { PathLike } from 'fs';

// Check that the important environment variables aren't empty/null
export const checkEnvironment = () => {
    [process.env.SAMBA_URL, process.env.SAMBA_USERNAME, process.env.SAMBA_PASSWORD].forEach((env) => {
        if (env == null || env == '') {
            logger.fatal(`One or more environment variables are not defined please check the ".env" file.`);
            process.exit(1);
        }
    });
};

export const createSamba = () => {
    const client = new SambaClient({
        address: process.env.SAMBA_URL || '',
        username: process.env.SAMBA_USERNAME,
        password: process.env.SAMBA_PASSWORD,
        domain: 'WORKGROUP',
        maxProtocol: 'SMB3',
        maskCmd: true,
    });
    return client;
};

const getDirectories = async (source: PathLike) =>
    (await fs.readdir(source, { withFileTypes: true }))
        .filter((dirent) => dirent.isDirectory())
        .map((dirent) => dirent.name);

const getFileList = async (dirName: string) => {
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

const existsCache: string[] = [];

const verifyDirectoryExists = async (client: SambaClient, file: string) => {
    const pieces = file.split('/');
    const range = [...Array(pieces.length).keys()];
    for (const i of range) {
        const name = file
            .split('/')
            .reverse()
            .splice(pieces.length - i)
            .reverse()
            .join('/');
        if (!name.includes('.') && !existsCache.includes(name) && (await client.fileExists(name)) === false) {
            logger.info('Making directory: ' + name);
            await client.mkdir(name);
            existsCache.push(name);
        }
    }
};

export const sync = async () => {
    checkEnvironment();
    const client = createSamba();
    const folders = await getDirectories('events');
    if ((await client.fileExists(`events`)) === false) {
        await client.mkdir(`events`);
    }
    existsCache.push('events');
    if ((await client.fileExists(`events/${currentYear}`)) === false) {
        await client.mkdir(`events/${currentYear}`);
    }
    existsCache.push(`events/${currentYear}`);
    for (const event of folders) {
        if ((await client.fileExists(`events/${currentYear}/${event}`)) === false) {
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
    sync();
}
