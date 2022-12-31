import fs from 'fs-extra';
import Tracer from 'tracer';
import path from 'path';

const logger = Tracer.colorConsole();

/**
 * filters the correct files from the potential files
 *
 * @param exportDir
 * @param potentialFiles
 * @param dist Backwards compatibility for dist.js files
 * @returns the found files
 */
export const findFiles = (exportDir: string, potentialFiles: string[], dist = false): string[] => {
    // iterate over each potential file

    let foundFiles = potentialFiles.filter((file) => file.startsWith('_/lib-embed/'));
    if (dist) {
        foundFiles = potentialFiles
            .filter((file) => /(\.[a-z].*)/.test(file))
            .filter((file) => !file.startsWith('http://') && !file.startsWith('https://'));
    }

    fs.writeFile(path.join(exportDir, 'files.txt'), foundFiles.join('\n'));
    foundFiles = foundFiles.filter((file) => file.includes('?'));

    // log amount of found files

    logger.info(`Found ${foundFiles.length} potential assets files.`);
    return foundFiles.filter((file) => file.includes('?'));
};

export const findSvgs = (content: string): string[] => {
    return content.match(/<svg.*?<\/svg>/gm) ?? [];
};
