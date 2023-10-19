import crypto from 'node:crypto';
import fs from 'fs-extra';
import path from 'path';

/**
 * Encodes the text given into a md5 string using the built-in node implementation.
 *
 * @param data {string} The text to encode.
 * @returns {string} The md5 hashed string.
 */
export const md5HashEncode = (data: string): string => {
    return crypto.createHash('md5').update(data.trim()).digest('hex');
};

/**
 * Adds a truncated(to 7 characters) md5 hash(using the contents of the file) to the filename.
 * @param filepath {string} The file to add a hash to.
 */
export const addmd5HashtoFile = (filePath: string): void => {
    const contents = fs.readFileSync(filePath, { encoding: 'utf-8' });

    const hash = crypto.createHash('md5').update(contents.trim()).digest('hex');

    const truncatedHash = hash.substring(0, 7);

    const existingFileName = filePath.substring(filePath.lastIndexOf(path.sep) + 1);

    const fileNameArr = existingFileName.split('.');

    fileNameArr.splice(1, 0, truncatedHash);

    const newFileName = fileNameArr.join('.');

    const existingFilePath = filePath.substring(0, filePath.lastIndexOf(path.sep) - 1);

    fs.renameSync(filePath, path.join(existingFilePath, newFileName));
};
