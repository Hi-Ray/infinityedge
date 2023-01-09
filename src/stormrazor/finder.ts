import { md5HashEncode } from '../util/crypto';

import fs from 'fs-extra';
import Tracer from 'tracer';
import path from 'path';

const logger = Tracer.colorConsole();

/**
 * Filters the files for legitimate files from the potential files.
 *
 * @async
 * @param exportDir {string} Directory to export to.
 * @param potentialFiles {string[]} Potential files found.
 * @param dist {boolean} Backwards compatibility for dist.js files.
 * @returns {Promise<string[]>} The found files.
 */
export const findFiles = async (exportDir: string, potentialFiles: string[], dist = false): Promise<string[]> => {
    // Iterate over each potential file,
    let foundFiles = potentialFiles.filter((file) => file.startsWith('_/lib-embed/') || file.includes('./'));

    // Check if it's a dist file,
    if (dist) {
        foundFiles = potentialFiles
            .filter((file) => /(\.[a-z].*)/.test(file))
            .filter((file) => !file.startsWith('http://') && !file.startsWith('https://'));
    }

    foundFiles = foundFiles.map((file) => file.split('?')[0]);

    await fs.writeFile(path.join(exportDir, 'files.txt'), foundFiles.join('\n'), { flag: 'a+' });

    foundFiles = foundFiles.filter(
        (file) => file.includes('?') || (file.startsWith('./') && file !== './') || file.startsWith('_/'),
    );

    // Log amount of found files
    logger.info(`Found ${foundFiles.length} potential assets files.`);

    return foundFiles;
};

/**
 * Finds SVGs constructed using javascript.
 *
 * @async
 * @experimental Most likely will be changed in the future expect breaking changes.
 * @param exportDir {string} Directory to export file names (will be saved under "files.txt").
 * @param fileData {string} File data.
 * @returns {Promise<string[]>} Found files.
 */
const findJsSvgs = async (exportDir: string, fileData: string): Promise<string[]> => {
    const jsSvgRegex = /\[.\("svg",\{.*\}\}\)\]\)\]\)\]/gimsu;

    const matches = fileData.match(jsSvgRegex);

    logger.info(`${matches?.length ?? 0} Potential JSSvg's found.`);

    const filteredMatches = matches?.filter((value, index, array) => {
        if (value.includes('}})])')) {
            if (value.indexOf('}})])')) {
            }
        }
    });

    return [];
};

/**
 * Finds SVGs from data provided.
 *
 * @async
 * @param exportDir Directory to export file names to (will be saved under "files.txt").
 * @param fileData {string} File data.
 * @returns {Promise<string[]>} Found files.
 */
export const findSvgs = async (exportDir: string, fileData: string): Promise<string[]> => {
    const svgRegex = /<svg\b[^>]*?(?:viewBox="(\b[^"]*)")?>([\s\S]*?)<\/svg>/gimu;

    const matches = fileData.match(svgRegex) ?? [];

    const fileNames = matches.map((file) => `${md5HashEncode(file)}.svg`);

    logger.info(`Found ${matches.length} SVGs.`);

    if (matches.length !== 0)
        await fs.writeFile(path.join(exportDir, 'files.txt'), fileNames.join('\n'), { flag: 'a+' });

    return matches ?? [];
};
