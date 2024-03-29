import { describe, expect, it } from 'vitest';
import { getHomepages, locale, replacePlaceholder } from '../src/scraper';
import HomepageJson from '../src/interfaces/homepageJson';

describe('Get homepage', () => {
    it('should be a valid array', async () => {
        const homepageData = await getHomepages();
        expect(homepageData).to.be.an('array');
    });

    it('should contain a default key', async () => {
        const homepageData = <HomepageJson>(await getHomepages()).filter(homepage => homepage.game === "lol")[0].data;
        expect(homepageData.default).to.be.an('object');
    });

    it('should contain a navigation array inside the default key', async () => {
        const homepageData = <HomepageJson>(await getHomepages()).filter(homepage => homepage.game === "lol")[0].data;
        expect(homepageData.default.navigation).to.be.an('array');
    });

    it('should have an object inside the navigation array', async () => {
        const homepageData = <HomepageJson>(await getHomepages()).filter(homepage => homepage.game === "lol")[0].data;

        expect(homepageData.default.navigation[0]).to.be.an('object');
    });

    it('should have all the keys inside the navigation array object', async () => {
        const homepageData = <HomepageJson>(await getHomepages()).filter(homepage => homepage.game === "lol")[0].data;

        expect(homepageData.default.navigation[0].displayName).toBeDefined();
        expect(homepageData.default.navigation[0].enabled).toBeDefined();
        expect(homepageData.default.navigation[0].id).toBeDefined();
        expect(homepageData.default.navigation[0].isPlugin).toBeDefined();
        expect(homepageData.default.navigation[0].url).toBeDefined();
        expect(homepageData.default.navigation[0].priority).toBeDefined();
    });
});

describe('Url changer', () => {
    it('should replace the placeholder text with the currently selected locale', function () {
        expect(
            replacePlaceholder(
                'https://frontpage.na.leagueoflegends.com/{current_country_locale}/channel/lol/home/event/worlds-hub-2022',
            ),
        ).to.contain(locale);
    });
});
