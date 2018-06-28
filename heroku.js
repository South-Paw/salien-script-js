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
        "token": "da79c2b97f4068ee3b87d5f8691df2a4",
        "clan": "103582791462557324",
        "name": "first_acc",
    }
    {
        "token": "a5636843a7056a12205a26d4b98d121f",
        "clan": "103582791462557324",
        "name": "second_acc",
    });

  });
}

configs.forEach(config => {
  new SalienScript(config).init();
});
