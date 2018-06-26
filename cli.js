#!/usr/bin/env node

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
    logs: {
      type: 'number',
      alias: 'l',
    },
  },
};

const cli = meow(
  `
    Usage
      salien-script-js [options]

    Options
      --token, -t     Your game token.
      --group, -g     The ID of a steam group you'd like to represent. (optional)
      --name, -n      Name this instance of the script. (optional)
      --logs, -l      The amount of logs you want, 0 for minimal, 1 for limited and 2 for all. (optional)
`,
  cliOptions,
);

if (cli.flags.token) {
  const salien = new SalienScript({ token: cli.flags.token, clan: cli.flags.group, name: cli.flags.name, logs: cli.flags.logs });

  salien.init();
}
