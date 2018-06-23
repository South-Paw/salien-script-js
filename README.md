# salien-script-js

👽 Scripting the Steam Salien Sale minigame, the proper way.

> A Node.js implementation of https://github.com/SteamDatabase/SalienCheat by [xPaw](https://github.com/xPaw) with additional features!

[![salien-script-js on npm](https://nodei.co/npm/salien-script-js.png)](https://nodei.co/npm/salien-script-js/)

[![CI Status](https://img.shields.io/travis/South-Paw/salien-script-js/rework.svg)](https://travis-ci.org/South-Paw/salien-script-js)
[![Dependencies](https://david-dm.org/South-Paw/salien-script-js/rework.svg)](https://david-dm.org/South-Paw/salien-script-js/rework)
[![Dev Dependencies](https://david-dm.org/South-Paw/salien-script-js/rework/dev-status.svg)](https://david-dm.org/South-Paw/salien-script-js/rework?type=dev)

---

## Easy setup

1. Install the latest version [Node.js](https://nodejs.org/en/)
2. Download this repository and extract somewhere
3. Log into [Steam](http://store.steampowered.com/) in your browser
4. Open https://steamcommunity.com/saliengame/gettoken and find the bit that looks like `"token":"xxxxxxxx"`
5. Open command line in the extracted repository folder
    * Tip: ['Shift + Right Click' in explorer -> 'Open Command Line/Powershell here'](http://i.imgur.com/6FJcydX.png)
6. Type `npm i` to get required dependencies
7. Run the script by typing `node run.js xxxxxxxx` where `xxxxxxxx` is your token from step 4.

### Multiple tokens/scripts

Simply open another command line in the repository folder and type `node run.js yyyyyyyy` where `yyyyyyyy` is your other accounts token.

### Represent your Steam Group

If you'd like to represent a specific steam group, simply add the group id after your token, eg: `node run.js xxxxxxxx 123456789`

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

salien.run();
```
