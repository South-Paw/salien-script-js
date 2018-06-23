# salien-script-js

👽 Scripting the Steam Salien Sale minigame, the proper way.

> A Node.js implementation of https://github.com/SteamDatabase/SalienCheat by [xPaw](https://github.com/xPaw) with additional features!

[![salien-script-js on npm](https://nodei.co/npm/salien-script-js.png)](https://nodei.co/npm/salien-script-js/)

[![CI Status](https://img.shields.io/travis/South-Paw/salien-script-js/rework.svg)](https://travis-ci.org/South-Paw/salien-script-js)
[![Dependencies](https://david-dm.org/South-Paw/salien-script-js/rework.svg)](https://david-dm.org/South-Paw/salien-script-js/rework)
[![Dev Dependencies](https://david-dm.org/South-Paw/salien-script-js/rework/dev-status.svg)](https://david-dm.org/South-Paw/salien-script-js/rework?type=dev)

---

## Installation

### Prerequisites

To run this script, you will need to install the following tools:

- [Node.js](https://nodejs.org/en/) (Version 10 and above)

### Getting your token

Log into [Steam](http://store.steampowered.com/) in your browser. Once you're logged in, we can now get the token required for this script to work.

Open the following URL: https://steamcommunity.com/saliengame/gettoken 

You should be able to find the bit that looks like `"token":"xxxxxxxx"`. Copy whatever is inside the second quotes, (e.g. `xxxxxxxx`).

1. Install the latest version [Node.js](https://nodejs.org/en/)
2. Download this repository and extract somewhere
3. Log into [Steam](http://store.steampowered.com/) in your browser
4. Open https://steamcommunity.com/saliengame/gettoken and find the bit that looks like `"token":"xxxxxxxx"`
5. Open command line in the extracted repository folder
    * Tip: ['Shift + Right Click' in explorer -> 'Open Command Line/Powershell here'](http://i.imgur.com/6FJcydX.png)
6. Type `npm i` to get required dependencies
7. Run the script by typing `node run.js xxxxxxxx` where `xxxxxxxx` is your token from step 4.

### Using the command line

Open PowerShell on Windows.

> Tip: On Windows, Start > Run > type `powershell.exe` > Enter

Use `npm` to install this project as a command-line tool.

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
      --group, -g      The ID of a steam group you'd like to represent. (optional)

$ salien-script-js --token xxxxxxxx
...
```

### Represent your Steam Group

If you'd like to represent a specific steam group, simply pass the `--group` option with the ID of the group.

```sh-session
$ salien-script-js --token xxxxxxxx --group 123456789
```

You can get your group id by going to https://steamcommunity.com/groups/YOUR_GROUP_NAME_HERE/memberslistxml/?xml=1 and replacing `YOUR_GROUP_NAME_HERE` with the group name shown at the end of your groups url.

**You must be a member of a group to represent that group!**

If you'd like to team up with an established larger group please consider using either [SteamDB](https://steamcommunity.com/groups/steamdb) `103582791434298690` or [100Pals](https://steamcommunity.com/groups/100pals) `103582791454524084`

## Advanced: Usage as an npm package

```js
const SalienScript = require('salien-script-js');

const config = {
  token: '', // Your token from https://steamcommunity.com/saliengame/gettoken
};

const salien = new SalienScript(config);

salien.init();
```
