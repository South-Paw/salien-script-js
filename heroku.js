const SalienScript = require('./src/index.js');

let configs;

if (process.env.SALIEN_CONFIG_V2) {
    configs = JSON.parse(process.env.SALIEN_CONFIG_V2);
} else if (process.env.SALIEN_CONFIG) {
    configs = [];
    for (let config of process.env.SALIEN_CONFIG.split(';')) {
        let token, clan, name;
        [token, clan, name] = config.split(':');
        configs.push({
            token: token,
            clan: clan,
            name: name,
        });
    }
}

for (let config of configs) {
    new SalienScript(config).init();
}