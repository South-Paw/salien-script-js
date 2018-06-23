const meow = require('meow');
const SalienScript = require('./src/index.js');

/** @type {meow.Options} */
const cliOptions = {
  flags: {
    token: {
      type: 'string',
      alias: 't'
    },
    groupid: {
      type: 'string',
      alias: 'g'
    },
  },
};

const cli = meow(`
    Usage
      $ salient-script-js [options]

    Options
      --token, -t     Your game token.
      --groupid, -g   The ID of a group you'd like to represent. (optional)
`, cliOptions);

if (cli.flags.token) {
  const salien = new SalienScript({ token: cli.flags.token });

  salien.init();
} else {
  console.log(`
    You haven't specified a token...
    Please read the README: https://github.com/South-Paw/salien-script-js
  `);
}
