# salien-script-js

👽 Scripting the Steam Salien Sale minigame, the proper way.

> A Node.js implementation of https://github.com/SteamDatabase/SalienCheat by [xPaw](https://github.com/xPaw)

---

## How to use this (download repo)

1. Log into Steam in your browser
2. Join https://steamcommunity.com/groups/SteamDB (needed to represent captures)
3. Open https://steamcommunity.com/saliengame/gettoken and find the bit that looks like `"token":"xxxxxxxx"`
4. Create a new file next to `run.js`, call it `token.txt` and paste only the `xxxxxxxx` part of your token in
5. Install the latest version [Node.js](https://nodejs.org/en/)
6. Open command line in the folder
    * Tip: ['Shift + Right Click' in explorer -> 'Open Command Line/Powershell here'](http://i.imgur.com/6FJcydX.png)
7. Type `npm i` to get dependencies
8. Run the script by typing `node run.js`

## Basic: As a command-line

The `cli.js` contains a command-line helper for this script. You can install this as follows:

```bash
npm install -g salien-script-js
```

To use this command-line, pass the `--token` option with the same token that you received from https://steamcommunity.com/saliengame/gettoken.

```sh-session
$ salien-script-js --help

  Scripting the Steam Salien Sale minigame, the proper way.

  Usage
    $ salient-script-js [options]

  Options
    --token, -t     Your game token.

$ node cli.js --token <token>
...
```

## Advanced: Usage as an npm package

```js
const SalienScript = require('salien-script-js');

const config = {
  token: '', // Your token from https://steamcommunity.com/saliengame/gettoken
};

const salien = new SalienScript(config);

salien.run();
```

## Other scripts Salien and languages

* [PHP version by xPaw](https://github.com/SteamDatabase/SalienCheat) (original)
* [Python version](https://github.com/SteamDatabase/SalienCheat)
