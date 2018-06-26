# salien-script-js

👽 Scripting the Steam Salien Sale minigame, the proper way.

> A Node.js implementation of https://github.com/SteamDatabase/SalienCheat by [xPaw](https://github.com/xPaw) with additional features!

[![npm](https://img.shields.io/npm/v/salien-script-js.svg)](https://www.npmjs.com/package/salien-script-js)
[![CI Status](https://img.shields.io/travis/South-Paw/salien-script-js.svg)](https://travis-ci.org/South-Paw/salien-script-js)
[![Dependencies](https://david-dm.org/South-Paw/salien-script-js.svg)](https://david-dm.org/South-Paw/salien-script-js)
[![Dev Dependencies](https://david-dm.org/South-Paw/salien-script-js/dev-status.svg)](https://david-dm.org/South-Paw/salien-script-js?type=dev)

---

## 🌈 Features

* Easy to install, run and update 🎉
* Update checker and log notifications ✉️
* Same logic as the [PHP version](https://github.com/SteamDatabase/SalienCheat) (we almost have parity) 👽
* Pick your own steam group 👌
* Works well with multiple tokens/scripts 👥
* Name your running scripts 👀

> Note: We'll try our best to keep this version up to date with the PHP and other versions! Suggestions welcome.

---

## 🕹️ How to use this

1. Install [Node.js](https://nodejs.org/en/). (Version 10 and above)
2. Log into [Steam](http://store.steampowered.com/) in your browser.
3. Open the following URL: <https://steamcommunity.com/saliengame/gettoken>. You should be able to find the bit that looks like `"token":"xxxxxxxx"`. Copy whatever is inside the second quotes, (e.g. `xxxxxxxx`).
4. Open PowerShell on Windows. (Tip: Start > Run > type `powershell.exe` > Enter)
5. Run `npm install -g salien-script-js` to install this project.
6. Run the script by typing `salien-script-js --token xxxxxxxx` where `xxxxxxxx` is your token from step 3.

> ### If you appreciate the script, please leave a star ⭐ on the project!

## 😍 How to update the script

1. Close/cancel any running script windows
2. Open PowerShell on Windows.
3. Run `npm update -g salien-script-js`
4. Re-run your scripts using the same command

Easy right?

---

### 👌 Represent your Steam Group (Optional)

If you'd like to represent a specific steam group, simply pass the `--group` option with the ID of the group.

```sh-session
salien-script-js --token xxxxxxxx --group 123456789
```

You can get your group id by going to https://steamcommunity.com/groups/YOUR_GROUP_NAME_HERE/memberslistxml/?xml=1 and replacing `YOUR_GROUP_NAME_HERE` with the group name shown at the end of your groups url.

**You must be a member of a group to represent that group!**

If you'd like to team up with an established larger group please consider using either:

* [100Pals](https://steamcommunity.com/groups/100pals) id: `103582791454524084`
* [SteamDB](https://steamcommunity.com/groups/steamdb) id: `103582791434298690`
* [/r/saliens](https://steamcommunity.com/groups/summersaliens) id: `103582791462557324`
* [Steam Universe](https://steamcommunity.com/groups/steamuniverse) id: `103582791434672565`

### 👥 Multiple tokens/scripts

Simply open another PowerShell window and run `salien-script-js --token yyyyyyyy --name "name of this script"` where `yyyyyyyy` is your other accounts token and `name of this script` if what you'd like to see in the log outputs.

## Advanced: Usage as an npm package

```js
const SalienScript = require('salien-script-js');

const config = {
  token: '', // Your token from https://steamcommunity.com/saliengame/gettoken
  clan: '', // (optional) Clan id from https://steamcommunity.com/groups/YOUR_GROUP_NAME_HERE/memberslistxml/?xml=1
  name: '', // (optional) Name of this instance for logging
};

const salien = new SalienScript(config);

salien.init();
```

## Development

Want to help out? Awesome! 👍

Pull the repo and you can run the script with `node cli.js -t TOKEN`.

PRs, suggestions, fixes and improvements all welcome.
