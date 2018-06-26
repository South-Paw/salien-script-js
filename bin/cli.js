#!/usr/bin/env node

const meow = require('meow');
const { SalienScript } = require('../src/index.js');

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
    planet: {
      type: 'string',
      alias: 'p',
    },
    name: {
      type: 'string',
      alias: 'n',
    },
  },
};

const cli = meow(
  `
    Usage:
      salien-script-js [options]

    Options:
      --token, -t     Your Saliens game token.

      --group, -g     (Optional) The ID of a steam group you'd like to represent.

      --name, -n      (Optional) The name to display on this instance of the script.
`,
  cliOptions,
);

if (cli.flags.token) {
  const salien = new SalienScript({
    token: cli.flags.token,
    clan: cli.flags.group,
    name: cli.flags.name,
  });

  salien.init();
}
