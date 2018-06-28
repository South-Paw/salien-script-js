# salien-script-js

👽 A easy to install, run and update Node.js script for the Steam salien mini-game.

> A Node.js implementation of https://github.com/SteamDatabase/SalienCheat by [xPaw](https://github.com/xPaw) with additional features!

[![npm](https://img.shields.io/npm/v/salien-script-js.svg)](https://www.npmjs.com/package/salien-script-js)
[![CI Status](https://img.shields.io/travis/South-Paw/salien-script-js.svg)](https://travis-ci.org/South-Paw/salien-script-js)
[![Coveralls Status](https://img.shields.io/coveralls/github/South-Paw/salien-script-js.svg)](https://coveralls.io/github/South-Paw/salien-script-js)
[![Dependencies](https://david-dm.org/South-Paw/salien-script-js.svg)](https://david-dm.org/South-Paw/salien-script-js)
[![Dev Dependencies](https://david-dm.org/South-Paw/salien-script-js/dev-status.svg)](https://david-dm.org/South-Paw/salien-script-js?type=dev)

---

## 🌈 Features

* 🎉 [Easy to install, run and update](#️-how-to-use-this)

* ✉️ [Update checker and log notifications](#-how-to-update-the-script)

* 👽 Same logic as the [PHP version](https://github.com/SteamDatabase/SalienCheat) (we almost have parity)

* 👌 [Pick your own steam group](#-represent-your-steam-group-optional)

* 👥 [Works well with multiple tokens/scripts](#-multiple-tokensscripts)

* 👀 [Name your running scripts](#-multiple-tokensscripts)

* ☁️ [Heroku support](#advanced-️-deploying-to-heroku)

* 🐳 [Docker support](#advanced--running-as-a-docker-container)

* 📦 [npm package export](#advanced--usage-as-an-npm-package)

> Note: We'll try our best to keep this version up to date with the PHP and other versions! Suggestions welcome.

---

## 🕹️ How to use this

1. Install [Node.js](https://nodejs.org/en/). (Version 10 and above)
2. Log into [Steam](http://store.steampowered.com/) in your browser.
3. Open the following URL: <https://steamcommunity.com/saliengame/gettoken>. You should be able to find the bit that looks like `"token":"xxxxxxxx"`. Copy whatever is inside the second quotes, (e.g. `xxxxxxxx`).
4. Open PowerShell on Windows. (Tip: Start > Run > type `powershell.exe` > Enter)
5. Run `npm install -g salien-script-js` to install this project.
6. Run the script by typing `salien-script-js --token xxxxxxxx` where `xxxxxxxx` is your token from step 3.

> ### Remeber to drop us a ⭐ star on the project if you appreciate this script!

## 😍 How to update the script

1. Close/cancel any running script windows
2. Open PowerShell on Windows.
3. Run `npm i -g salien-script-js`
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

* [/r/saliens](https://steamcommunity.com/groups/summersaliens) id: `103582791462557324`
* [SteamDB](https://steamcommunity.com/groups/steamdb) id: `103582791434298690`
* [100Pals](https://steamcommunity.com/groups/100pals) id: `103582791454524084`

### 👥 Multiple tokens/scripts

Simply open another PowerShell window and run `salien-script-js --token yyyyyyyy --name "name of this script"` where `yyyyyyyy` is your other accounts token and `name of this script` if what you'd like to see in the log outputs.

---

### Advanced: CLI Arguments

```
  Usage:
    salien-script-js [options]

  Options:
    --token, -t           Your Saliens game token.
    --group, -g           (Optional) The ID of a steam group you'd like to represent.
    --name, -n            (Optional) The name to display on this instance of the script.
    --logRequests, -l     (Optional) Set to true if you'd like to show Steam API requests in the logs.
```

## Advanced: 📦 Usage as an npm package

```js
const { SalienScript } = require('salien-script-js');

const config = {
  token: '', // Your token from https://steamcommunity.com/saliengame/gettoken
  clan: '', // (optional) Clan id from https://steamcommunity.com/groups/YOUR_GROUP_NAME_HERE/memberslistxml/?xml=1
  name: '', // (optional) Name of this instance for logging
};

const salien = new SalienScript(config);

salien.init();
```

## Advanced: 🐳 Running as a Docker container

The provided Dockerfile allows you to build this repository as a Docker container. To do that, clone the following repo and run the following commands.

```bash
# builds an image of the repo
$ docker build -t salien-script-js .

# sets up a container based on said image in "detached" mode
$ docker run -d --name salien-script-js salien-script-js [options]
```

You can also set up continuous deployment through Docker Hub. [Read the following comment](https://github.com/South-Paw/salien-script-js/pull/11#issuecomment-399747215) for a guide.

## Advanced: ☁️ Deploying to heroku

### Deploying with web-console

[![Deploy](https://www.herokucdn.com/deploy/button.svg)](https://heroku.com/deploy?template=https://github.com/South-Paw/salien-script-js)

1. Click the button above.
2. Set SALIEN_CONFIG_V2 ([see note below](#heroku-configuration)).
3. That's all!

To check if it works, visit logs at https://dashboard.heroku.com/apps/[YOUR_APP_NAME]/logs

If you see "Application Error" when going to the webpage of your app, it's okay - the script will still run anyway.

### Deploying with Heroku CLI

```bash
$ git clone https://github.com/South-Paw/salien-script-js -o upstream
$ cd salien-script-js
$ heroku create [APP_NAME]
$ heroku config:set "SALIEN_CONFIG_V2=[APP_CONFIG]"
$ git push heroku master
$ heroku ps:scale web=0 salien=1
```

And to check if it works:
```bash
$ heroku logs --tail
```

### Heroku configuration

`SALIEN_CONFIG_V2` is just an array of config that will be passed to `SalienScript` constructor.

If you only have one account, then your config will look like this:

```JSON
[
    {
        "token": "12345"
    }
]
```

The only mandatory key for each account is `token` and you can add extra keys to this config such as `clan`, `name` or `selectedPlanetId`:

```JSON
[
    {
        "token": "12345",
        "clan": "67890",
        "name": "first_acc",
        "selectedPlanetId": "28"
    }
]
```

If you had two accounts for example;

* one named `first_acc` with a token of `123` and a group of `98712`
* one named `second_acc` with a token of `456` and a group of `67890`

then you would make your config look like this:

```JSON
[
    {
        "token": "123",
        "clan": "98712",
        "name": "first_acc"
    },
    {
        "token": "456",
        "clan": "67890",
        "name": "second_acc"
    }
]
```

### Updating

#### Easy

The easiest way to update script on heroku is to just delete your old app and create new.

You can also link your Heroku app to your Dropbox account. To do that, [download this repository](https://github.com/South-Paw/salien-script-js/archive/master.zip) as a zip archive, and unpack it to the folder created on your Dropbox.

For more info on this, visit: https://devcenter.heroku.com/articles/dropbox-sync

#### Medium

1. Fork this repo on github.
2. In your heroku app control panel, at Deploy tab, connect your app to a forked repository and enable automatic deploys.
3. When update comes, merge changes into your repo on github:
    1. Create new pull request.
    2. Select your repo's master branch as base fork, and South-Paw/salien-script-js master branch as head fork.
    3. Click on a big green button "Merge pull request".

For more info on connecting github account, visit: https://devcenter.heroku.com/articles/github-integration

For more info on syncing fork using web interface, check this tutorial: https://www.sitepoint.com/quick-tip-sync-your-fork-with-the-original-without-the-cli/

#### Hard

If you created your app using web-console, you need to clone heroku repo first

```bash
$ git clone https://git.heroku.com/[APP_NAME].git -o heroku
$ cd [APP_NAME]
$ git remote add upstream https://github.com/South-Paw/salien-script-js.git
```

And then, fetch, merge and push

```bash
$ git fetch upstream
$ git merge remotes/upstream/master
$ git push heroku master
```

---

## 👨‍💻 Contributing and Development

Want to help out? Awesome! 👍

Pull the repo and you can run the script with `node cli.js -t TOKEN`.

PRs, suggestions, fixes and improvements all welcome.

---

## License

This project is licensed under [MIT](https://github.com/South-Paw/salien-script-js/blob/master/LICENSE)

```
MIT License

Copyright (c) 2018 Alex Gabites

https://github.com/South-Paw/salien-script-js

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```
