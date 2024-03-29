import download from 'download';
import axios from 'axios';
import tracer from 'tracer';
import path from 'path';
import { flattenObject } from '../../util/object';
import { addmd5HashtoFile } from '../../util/crypto';

const logger = tracer.colorConsole();

const processManifest = async (url: string, dir: string) => {
    const data: any = await axios.get(url);
    const manifest = data.data;
    const flattenedManifest = flattenObject(manifest);

    for (const value of Object.keys(flattenedManifest)) {
        if (typeof flattenedManifest[value] === 'string') {
            if (flattenedManifest[value] == '') continue;

            const file = flattenedManifest[value];
            const urlm = url.split('/');

            urlm.pop();

            const urlNew = urlm.join('/');
            const dlurl = path.posix.join(urlNew, file).replace('https:/', 'https://');

            if (!dlurl.match(/\.[0-9a-z]+$/i)) continue;

            logger.warn(`Attempting to download ${dlurl}`);

            const fileName = dlurl.substring(dlurl.lastIndexOf('/') + 1);

            try {
                if (dlurl.includes('tft')) {
                    // Tft
                    logger.warn('Attempting to download tft riot-client');
                    await download(dlurl, `${dir}/riot-client/tft/`);
                    addmd5HashtoFile(`${dir}/riot-client/tft/${fileName}`);
                } else if (dlurl.includes('arcane')) {
                    // Arcane
                    logger.warn('Attempting to download arcane riot-client');
                    await download(dlurl, `${dir}/riot-client/arcane/`);
                    addmd5HashtoFile(`${dir}/riot-client/arcane/${fileName}`);
                } else if (dlurl.includes('wildrift')) {
                    // Wildrift
                    logger.warn('Attempting to download wildrift riot-client');
                    await download(dlurl, `${dir}/riot-client/wr/`);
                    addmd5HashtoFile(`${dir}/riot-client/wr/${fileName}`);
                } else if (dlurl.includes('valorant')) {
                    // Valorant
                    logger.warn('Attempting to download val riot-client');
                    await download(dlurl, `${dir}/riot-client/val/`);
                    addmd5HashtoFile(`${dir}/riot-client/val/${fileName}`);
                } else if (dlurl.includes('bacon')) {
                    // Legends of runterra
                    logger.warn('Attempting to download lor riot-client');
                    await download(dlurl, `${dir}/riot-client/lor/`);
                    addmd5HashtoFile(`${dir}/riot-client/lor/${fileName}`);
                } else if (dlurl.startsWith('https://lol.secure.dyn.riotcdn.net/channels/public/rccontent')) {
                    // League of legends
                    logger.warn('Attempting to download lol riot-client');
                    await download(dlurl, `${dir}/riot-client/lol/`);
                    addmd5HashtoFile(`${dir}/riot-client/lol/${fileName}`);
                } else if (
                    dlurl.startsWith('https://riot-client.secure.dyn.riotcdn.net/channels/public/rccontent/theme')
                ) {
                    // Riot client
                    logger.warn('Attempting to download riot-client riot-client');
                    await download(dlurl, `${dir}/riot-client/riot-client/`);
                    addmd5HashtoFile(`${dir}/riot-client/riot-client/${fileName}`);
                } else {
                    // Unknown
                    logger.warn('Attempting to download unknown riot-client');
                    await download(dlurl, `${dir}/riot-client/unknown/`);
                    addmd5HashtoFile(`${dir}/riot-client/unknown/${fileName}`);
                }
            } catch (e) {
                logger.error(`Failed to download: ${dlurl}`);
                logger.error(e);
            }
        }
    }
};

export default processManifest;
