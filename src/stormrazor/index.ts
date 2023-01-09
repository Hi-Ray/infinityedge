import { findFiles, findSvgs } from './finder';
import { md5HashEncode } from '../util/crypto';

import download from 'download';
import Tracer from 'tracer';
import fs from 'fs-extra';
import path from 'path';

const logger = Tracer.colorConsole();

// Known main files for frontpages.
const knownMainFiles = ['dist.js', 'app.js'];

/**
 * Checks for known main files.
 *
 * @param fileName {string} The file name.
 */
const checkForMainFile = (fileName: string) => {
    let foundMainFile = false;

    knownMainFiles.forEach((file) => {
        if (fileName === file) {
            foundMainFile = true;
        }
    });

    if (!foundMainFile) {
        logger.error('Please provide the dist file of the frontpage');
        process.exit(1);
    }
};

/**
 * Downloads the files provided in the array.
 *
 * @async
 * @param foundFiles {string[]}
 * @param tmpDir {string} dist/event
 * @param basePath {string}
 */
const downloadFiles = async (foundFiles: string[], tmpDir: string, basePath: string) => {
    // Download each found file.
    for (const foundFile of foundFiles) {
        // Create the export directory.
        // Need to replace "_/lib-embed" because it makes two directories instead of the one.
        const exportDir = path.join(tmpDir, path.dirname(foundFile.replace('_/lib-embed', '')));

        try {
            await fs.mkdir(exportDir, { recursive: true });
        } catch (e) {
            // Folder already exists.
        }

        // Formats the download path.
        let downloadPath = path.join(basePath, foundFile).replace(':/', '://').replace(':\\', '://');

        downloadPath = downloadPath.replaceAll('\\', '/');

        try {
            logger.warn(`DOWNLOADING: ${downloadPath} TO: ${exportDir}`);
            // Downloads the file.
            await download(downloadPath, exportDir);
            logger.info(`Downloaded ${foundFile}`);
        } catch {
            logger.warn(`Failed to download ${foundFile}`);
        }
    }
};

/**
 * Saves the inline HTML SVGs.
 *
 * @async
 * @param foundSvgs {string[]} An array of found inline HTML SVGs.
 * @param tmpDir The directory to save the files.
 */
const saveSvgs = async (foundSvgs: string[], tmpDir: string) => {
    const exportDir = path.join(tmpDir, 'svg');
    // Create the export directory.
    await fs.mkdir(exportDir, { recursive: true });

    // Download each found file.
    for (const svg of foundSvgs) {
        // For some reason this gets exported so ignoring this.
        if (svg.includes('<svg>"+r+"</svg>')) continue;

        // Since we don't have a name due to the SVGs being inline html,
        // We MD5 hash the contents to come up with a name
        const hash = md5HashEncode(svg);
        const fileName = hash + '.svg';

        // Formats the save path.
        const savePath = path.join(exportDir, fileName).replace(':/', '://').replace(':\\', '://');

        try {
            // Saves the svg.
            logger.info(`Found SVG ${hash}`);
            logger.info(`Saving under: ${fileName}`);
            await fs.writeFile(savePath, svg);
        } catch {
            // Realistically should never happen.
            logger.error(`Failed to save SVG: hash: (${hash}) filename: (${fileName}) path: (${savePath})`);
            logger.error('Please make an issue on the github repo and provide the logs above');
        }
    }
};

/**
 * Main function for stormrazor.
 *
 * @async
 * @param distURL {string} The dist file URL.
 * @param tmpDir {string} The temporary directory to use.
 */
export const handle = async (distURL: string, tmpDir: string) => {
    // Regex for finding paths.
    const pathRegex = /"([^"]*)"/g;

    // The base path without the file.
    const basePath = path.dirname(distURL).replace(':/', '://');

    // The filename of the dist URL.
    const fileName = path.basename(distURL).split('?')[0];

    // check if file is a dist file.
    checkForMainFile(fileName);

    // Create temporary directory.
    await fs.mkdir(tmpDir, { recursive: true });

    // Download the dist file.
    await download(distURL, tmpDir);

    // Content of the main file.
    const content = await fs.readFile(path.join(tmpDir, fileName), { encoding: 'utf8' });

    // Find potential files.
    const potentialFiles: string[] = (content.match(pathRegex) ?? []).map((x) =>
        x.slice(x.startsWith('"') ? 1 : 0, x.length - 1),
    );

    // Log count of potential files.
    logger.info(`Found ${potentialFiles.length} potential files.`);

    // Finds the files from the potential files.
    const foundFiles = await findFiles(tmpDir, potentialFiles, fileName.includes('dist.js'));

    // Finds the inline HTML SVGs from the file files.
    const foundSvgs = await findSvgs(tmpDir, content);

    // Downloads the found files.
    await downloadFiles(foundFiles, tmpDir, basePath);

    // Saves the found SVGs.
    await saveSvgs(foundSvgs, tmpDir);
};
