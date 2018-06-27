const chalk = require('chalk');
const dateFormat = require('dateformat');
const checkForUpdate = require('update-check');

const pkg = require('../package.json');

const debug = message => console.log(`${JSON.stringify(message, 0, 2)}`); // eslint-disable-line no-console

const utilLogger = (name, msg) => {
  const { message, error } = msg;

  let prefix = chalk.white(dateFormat(new Date(), '[HH:MM:ss]'));

  if (name) {
    prefix += ` (${name})`;
  }

  // TODO: maybe do some fancy indentation logic here...? check first char for '>' or '-' and indent if not found?
  // be aware that chalk is adding colors tho and they show up if you debug the `message` object

  console.log(prefix, message); // eslint-disable-line no-console

  if (error) {
    debug(error);
  }
};

const getPercentage = number =>
  Number(number * 100)
    .toFixed(2)
    .toString();

const updateCheck = async name => {
  let hasUpdate = null;

  try {
    hasUpdate = await checkForUpdate(pkg, { interval: 120000 });
  } catch (err) {
    const updateMsg = `${chalk.bgRed(' UpdateCheck ')} ${chalk.red(`Error while checking for updates: ${err}`)}`;

    utilLogger(name, { message: updateMsg, error: err });
  }

  if (await hasUpdate) {
    let hasUpdateMsg = `${chalk.bgMagenta(' UpdateCheck ')} `;
    hasUpdateMsg += `The latest version is ${chalk.bgCyan(hasUpdate.latest)}. Please update!`;

    utilLogger(name, { message: hasUpdateMsg });

    let howToUpdate = `${chalk.bgMagenta(' UpdateCheck ')} `;
    howToUpdate += `To update, stop this script and run: ${chalk.bgCyan('npm i -g salien-script-js')}`;

    utilLogger(name, { message: howToUpdate });

    console.log(''); // eslint-disable-line no-console
  }
};

module.exports = {
  debug,
  utilLogger,
  getPercentage,
  updateCheck,
};
