import crypto from 'node:crypto';

/**
 * Encodes the text given into a md5 string using the built-in node implementation.
 *
 * @param data {string} The text to encode.
 * @returns {string} The md5 hashed string.
 */
export const md5HashEncode = (data: string): string => {
    return crypto.createHash('md5').update(data.trim()).digest('hex');
};
