const meow = require('meow');

const SalienScript = require('./src/index.js');

/** @type {meow.Options} */
const cliOptions = {
  flags: {
    token: {
      type: 'string',
      alias: 't',
    },
    group: {
      type: 'string',
      alias: 'g',
    },
    name: {
      type: 'string',
      alias: 'n',
    },
  },
};

const cli = meow(
  `
    Usage
      $ salient-script-js [options]

    Options
      --token, -t     Your game token.
      --group, -g     The ID of a steam group you'd like to represent. (optional)
      --name, -n      Name this instance of the script. (optional)
`,
  cliOptions,
);

if (cli.flags.token) {
  const salien = new SalienScript({ token: cli.flags.token, clan: cli.flags.group, name: cli.flags.name });

  salien.init();
}
