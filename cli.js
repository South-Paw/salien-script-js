const meow = require('meow');
const SalienScript = require('./src/index.js');

/** @type {meow.Options} */
const cliOptions = {
  flags: {
    token: {
      type: 'string',
      alias: 't'
    },
  },
};

const cli = meow(`
    Usage
      $ salien-script-js [options]

    Options
      --token, -t     Your game token.
`, cliOptions);

if (cli.flags.token) {
  const salien = new SalienScript({ token: cli.flags.token });

  salien.run();
} else {
  console.log(`
    You haven't specified a token...
    Please read the README: https://github.com/South-Paw/salien-script-js
  `);
}