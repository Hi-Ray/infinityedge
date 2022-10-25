# infinityedge
An automation layer over stormrazor

## Why?
We had to manually update [Universe](https://universe.communitydragon.org/) on [CommunityDragon](https://www.communitydragon.org/), and sometimes we weren't available,
so we would lose out on assets hence infinityedge was born.
Its main purpose its to watch over the frontend of the league of legends pages and download and
upload the assets to universe.

## How to install?
First check `src/index.ts` and verify you have the correct locale.

### Without Docker
#### If using samba
First rename the file `.env.example` to `.env` fill in the details for the samba share
otherwise an error will be thrown about missing environment variables.

Then run:
```shell
yarn
```

then:
```shell
yarn build
```

finally: 
```shell
yarn start
```

#### If not using samba
Run
```shell
yarn
```
then:
```shell
yarn build
```
finally:
```shell
yarn start
```

### With Docker
#### If using samba
Fill out the environment variables in the `docker-compose.yml`
```shell
docker-compose up -d
```

#### If not using samba
Run:
```shell
yarn
```
then: 
```shell
yarn build
```
finally:
```shell
yarn start
```

## FAQ
    Q: Why samba?
A: It's what we were given on [CommunityDragon](https://www.communitydragon.org/) hosting.

    Q: Can i use this without a samba share?
A: Yes, you can!

Run:
```shell
yarn build
```
then:
```shell
yarn start:scraper
```

## Contribute
In order to contribute you must fulfill these requirements
    
- Make sure linting is done and no errors are present.
- Make sure types are set.
- Make sure tests are passing.
- Make sure to write comments documenting code.
- Make sure to add yourself to the contributors list below.

## Contributors
- [BangingHeads](https://github.com/bangingheads)

## Support
[![ko-fi](https://ko-fi.com/img/githubbutton_sm.svg)](https://ko-fi.com/M4M31ZRUH)
