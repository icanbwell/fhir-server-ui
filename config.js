const commonConfig = require('./src/config/common.config');
const envSpecificConfig = require(`./src/config/${process.env.NODE_ENV ? process.env.NODE_ENV : 'local'}.config`);

const fs = require('fs');
const env = [...Object.entries(commonConfig), ...Object.entries(envSpecificConfig)]
    .map(entry => `${entry[0]}="${entry[1]}"`).join('\n');

fs.rm('.env', () => {
    fs.writeFile('.env', env, () => {
        console.log('.env updated');
    });
});
