# salien-script-js

👽 Scripting the Steam Salien Sale minigame, the proper way.

> A Node.js implementation of https://github.com/SteamDatabase/SalienCheat by [xPaw](https://github.com/xPaw) with additional features!

[![salien-script-js on npm](https://nodei.co/npm/salien-script-js.png)](https://nodei.co/npm/salien-script-js/)

[![CI Status](https://img.shields.io/travis/South-Paw/salien-script-js/rework.svg)](https://travis-ci.org/South-Paw/salien-script-js)
[![Dependencies](https://david-dm.org/South-Paw/salien-script-js/rework.svg)](https://david-dm.org/South-Paw/salien-script-js/rework)
[![Dev Dependencies](https://david-dm.org/South-Paw/salien-script-js/rework/dev-status.svg)](https://david-dm.org/South-Paw/salien-script-js/rework?type=dev)

---

## How to use this (download repo)

1. Install [Node.js](https://nodejs.org/en/). (Version 10 and above)
2. Log into [Steam](http://store.steampowered.com/) in your browser.
3. Open the following URL: <https://steamcommunity.com/saliengame/gettoken>. You should be able to find the bit that looks like `"token":"xxxxxxxx"`. Copy whatever is inside the second quotes, (e.g. `xxxxxxxx`).
4. Open PowerShell on Windows. (Tip: Start > Run > type `powershell.exe` > Enter)
5. Run `npm install -g salien-script-js` to install this project as a command-line.
7. Run the script by typing `salien-script-js --token xxxxxxxx` where `xxxxxxxx` is your token from step 3.

### Multiple tokens/scripts	### Using the command line

Simply open another PowerShell window and run `salien-script-js --token yyyyyyyy` where `yyyyyyyy` is your other accounts token.

### Represent your Steam Group (Optional)

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
