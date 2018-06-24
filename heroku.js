const SalienScript = require('./src/index.js');

const SALIEN_CONFIG = process.env.SALIEN_CONFIG;

for (let config_str of SALIEN_CONFIG.split(';')) {
    [token, clan, name] = config_str.split(':');
    const config = {
        token: token,
        clan: clan,
        name: name,
    };

    const salien = new SalienScript(config);
    salien.init();
}