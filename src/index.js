/**
 * MIT License
 *
 * Copyright (C) 2018 Alex Gabites
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */

const delay = require('delay');
const fetch = require('fetch-retry');

const baseUrl = 'https://community.steam-api.com/';

const getUrl = (method, params = '') => `${baseUrl}/${method}${params ? '/?' : ''}${params}`;

const getOptions = (options = {}) => {
  return {
    retries: 3,
    retryDelay: 1000,
    headers: {
      'Accept': '*/*',
      'Origin': 'https://steamcommunity.com',
      'Referer': 'https://steamcommunity.com/saliengame/play/',
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/67.0.3396.87 Safari/537.36',
    },
    ...options,
  };
};

const getScoreForZone = (zone) => {
  let score = 0;

  switch (zone.difficulty) {
    case 1: score = 5; break;
    case 2: score = 10; break;
    case 3: score = 20; break;
  }

  return score * 120;
};

async function getFirstAvailablePlanetId() {
  this.logger('Attempting to get first open planet...');

  const request = await fetch(getUrl('ITerritoryControlMinigameService/GetPlanets/v0001', 'active_only=1'), getOptions());
  const response = await request.json();

  if (!response || !response.response.planets) {
    this.logger('Didn\'t find any planets.');

    return null;
  }

  const firstOpen = response.response.planets.filter(planet => !planet.state.captured)[0];

  this.logger('First open planet id:', firstOpen.id);

  return firstOpen.id;
};

async function getPlayerInfo(token) {
  this.logger('Getting player info...');

  const request = await fetch(getUrl('ITerritoryControlMinigameService/GetPlayerInfo/v0001', `access_token=${token}`), getOptions({ method: 'POST' }));
  const response = await request.json();

  if (!response || !response.response) {
    this.logger('Didn\'t get any player info.');

    return null;
  }

  this.logger('Got player info!');

  return response.response;
};

async function leaveCurrentGame(token, leaveCurrentPlanet) {
  let playerInfo = null;

  while (!playerInfo) {
    playerInfo = await getPlayerInfo.call(this, token);
  }

  // Please do not change our clanid if you are going to use this script
  // If you want to cheat for your own group, come up with up with your own approach, thank you
  if (!playerInfo['clan_info'] || !playerInfo['clan_info']['accountid'] || playerInfo['clan_info']['accountid'] != 4777282) {
    await fetch(getUrl('ITerritoryControlMinigameService/RepresentClan/v0001', `clanid=4777282&access_token=${token}`), getOptions({ method: 'POST' }));
  }

  while (!playerInfo) {
    playerInfo = await getPlayerInfo.call(this, token);
  }

  if (!playerInfo['clan_info'] || !playerInfo['clan_info']['accountid'] || playerInfo['clan_info']['accountid'] != 4777282) {
    this.logger('\nYou need to join the SteamDB group to use this script!\n');
    this.logger('https://steamcommunity.com/groups/SteamDB\n');
    process.exit(1);
  }

  if (playerInfo['active_zone_game']) {
    this.logger('Leaving `active_zone_game`...');

    await fetch(getUrl('IMiniGameService/LeaveGame/v0001', `access_token=${token}&gameid=${playerInfo['active_zone_game']}`), getOptions({ method: 'POST' }));

    this.logger('Success!');
  }

  if (!playerInfo['active_planet']) {
    return 0;
  }

  if (leaveCurrentPlanet) {
    this.logger('Leaving `active_planet`...');

    await fetch(getUrl('IMiniGameService/LeaveGame/v0001', `access_token=${token}&gameid=${playerInfo['active_planet']}`), getOptions({ method: 'POST' }));

    this.logger('Success!');
  }

  return playerInfo['active_planet'];
}

async function joinPlanet(token, planetId) {
  this.logger('Attempting to join planet id:', planetId);

  await fetch(getUrl('ITerritoryControlMinigameService/JoinPlanet/v0001', `id=${planetId}&access_token=${token}`), getOptions({ method: 'POST' }));

  this.logger('Joined!');

  return;
}

async function getFirstAvailableZone(planetId) {
  this.logger(`Requesting zones for planet ${planetId}...`);

  const request = await fetch(getUrl('ITerritoryControlMinigameService/GetPlanet/v0001', `id=${planetId}`), getOptions());
  const response = await request.json();

  if (!response.response.planets[0].zones) {
    return null;
  }

  let zones = response.response.planets[0].zones;
  let cleanZones = [];
  let bossZone = null;

  zones.some(zone => {
    if (zone.captured) {
      return;
    }

    if (zone.type === 4) {
      bossZone = zone;
    } else if (zone.type != 3) {
      this.logger('Unknown zone type:', zone.type);
    }

    if (zone['capture_progress'] < 0.95) {
      cleanZones.push(zone);
    }
  })

  if (bossZone) {
    return bossZone;
  }

  if (cleanZones.length < 0) {
    return null;
  }

  cleanZones.sort((a, b) => {
    if (a.difficulty === b.difficulty) {
      return b['zone_position'] - a['zone_position'];
    }

    return b.difficulty - a.difficulty;
  });

  return cleanZones[0];
}

async function joinZone(token, position) {
  this.logger('Attempting to join zone position:', position);

  const request = await fetch(getUrl('ITerritoryControlMinigameService/JoinZone/v0001', `zone_position=${position}&access_token=${token}`), getOptions({ method: 'POST' }));
  const response = await request.json();

  if (!response || !response.response['zone_info']) {
    this.logger('Failed to join a zone.');

    return null;
  }

  this.logger('Got player info!');

  return response.response;
}

async function reportScore(token, score) {
  this.logger('Attempting to send score...');

  const request = await fetch(getUrl('ITerritoryControlMinigameService/ReportScore/v0001', `access_token=${token}&score=${score}&language=english`), getOptions({ method: 'POST' }));
  const response = await request.json();

  if (response.response['new_score']) {
    const data = response.response;

    this.logger(`Score: ${data['old_score']} => ${data['new_score']} (next level: ${data['next_level_score']}) - Current level: ${data['new_level']}`);
  }

  return;
}

const createLogger = (name) => {
  if (name) {
    return console.log.bind(console, `${name}:`);
  }
  return console.log;
}

class SalienScript {
  constructor({ token, name }) {
    this.token = token;
    this.currentPlanetId = null;
    this.logger = createLogger(name);
  }

  async run() {
    this.logger('This script will not work until you have joined our group:');
    this.logger('https://steamcommunity.com/groups/SteamDB');

    while (!this.currentPlanetId) {
      this.currentPlanetId = await getFirstAvailablePlanetId.call(this);

      if (!this.currentPlanetId) {
        this.logger('Trying to get another PlanetId in 5 seconds...');

        await delay(5000);
      }
    }

    await leaveCurrentGame.call(this, this.token, true);

    await joinPlanet.call(this, this.token, this.currentPlanetId);

    this.currentPlanetId = await leaveCurrentGame.call(this, this.token, false);

    while (true) {
      let zone = null;
      let joinedZone = null;

      while (!zone) {
        zone = await getFirstAvailableZone.call(this, this.currentPlanetId);

        if (!zone) {
          this.logger('Trying to get another ZoneId in 5 seconds...');

          await delay(5000);
        }
      }

      while (!joinedZone) {
        this.logger('Attempting to join zone:', zone['zone_position']);

        joinedZone = await joinZone.call(this, this.token, zone['zone_position']);

        if (!joinedZone) {
          this.logger('Trying to get another Zone Position in 15 seconds...');

          await delay(15000);
        }
      }

      this.logger(`Joined zone ${zone['zone_position']} - Captured: ${(zone['capture_progress'] * 100).toFixed(2)}% - Difficulty ${zone.difficulty}`);

      this.logger('Waiting 120 seconds for game to end...');

      await delay(120000);

      this.logger('Game complete!');

      await reportScore.call(this, this.token, getScoreForZone(zone));
    }
  };
}

module.exports = SalienScript;
