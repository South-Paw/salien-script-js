const SalienScript = require('./src/index.js');

let configs;

if (process.env.SALIEN_CONFIG_V2) {
  configs = JSON.parse(process.env.SALIEN_CONFIG_V2);
} else if (process.env.SALIEN_CONFIG) {
  const parsedConfig = process.env.SALIEN_CONFIG.split(';');
  configs = [];

  parsedConfig.forEach(config => {
    const [token, clan, name] = config.split(':');

    configs.push({
      token,
      clan,
      name,
    });
  });
}

configs.forEach(config => {
  new SalienScript(config).init();
});
