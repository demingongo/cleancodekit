const config: import('lint-staged').Configuration = {
    '<src>**/*.<extensions>': (files) => `dotenvx run -f .env.format -- prettier --write ${files.join(' ')}`,
};

export default config;
