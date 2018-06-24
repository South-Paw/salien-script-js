/**
 * MIT License
 *
 * Copyright (c) 2018 Alex Gabites
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

const chalk = require('chalk');
const dateFormat = require('dateformat');
const delay = require('delay');
const fetch = require('fetch-retry');

const { version: pkgVersion } = require('../package.json');

const logger = (name, ...messages) => {
  let message = chalk.white(dateFormat(new Date(), '[HH:MM:ss]'));

  if (name) {
    message += ` (${name})`;
  }

  // eslint-disable-next-line no-console
  console.log(message, ...messages);
};

// eslint-disable-next-line no-console
const debug = message => console.log(`${JSON.stringify(message, 0, 2)}`);

const asyncForEach = async (_this, array, callback) => {
  for (let index = 0; index < array.length; index += 1) {
    await callback(array[index], index, array, _this);
  }
};

const getDifficultyName = zone => {
  const boss = zone.type === 4 ? 'BOSS - ' : '';

  switch (zone.difficulty) {
    case 3:
      return `${boss}Hard`;
    case 2:
      return `${boss}Medium`;
    case 1:
      return `${boss}Low`;
    default:
      return `${boss}${zone.difficulty}`;
  }
};

const getScoreForZone = zone => {
  let score;

  switch (zone.difficulty) {
    case 1:
      score = 5;
      break;
    case 2:
      score = 10;
      break;
    case 3:
      score = 20;
      break;
    default:
      score = 5;
      break;
  }

  return score * 120;
};

class SalienScriptException {
  constructor(message) {
    this.name = 'SalienScriptException';
    this.message = message;
  }
}

class SalienScriptRestart {
  constructor(message) {
    this.name = 'SalienScriptRestart';
    this.message = message;
  }
}

class SalienScript {
  constructor({ token, clan, name = null }) {
    this.token = token;
    this.clan = clan;
    this.name = name;

    this.maxRetries = 2;
    this.defaultDelayMs = 5000;
    this.defaultDelaySec = this.defaultDelayMs / 1000;

    this.startTime = null;
    this.waitTime = 110;

    this.currentPlanetId = null;
    this.steamPlanetId = null;
    this.knownPlanetIds = [];
    this.knownPlanets = {};
    this.skippedPlanets = [];
  }

  async RequestAPI(method, params, maxRetries, additionalOptions = {}) {
    let url = `https://community.steam-api.com/${method}/v0001`;

    if (params) {
      url += '/?';

      params.forEach(param => {
        url += `${param}&`;
      });

      url = url.substring(0, url.length - 1);
    }

    const options = {
      retries: 3,
      retryDelay: 1000,
      headers: {
        Accept: '*/*',
        Origin: 'https://steamcommunity.com',
        Referer: 'https://steamcommunity.com/saliengame/play/',
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/67.0.3396.87 Safari/537.36',
      },
      ...additionalOptions,
    };

    let request;
    let response;
    let retries = 0;

    while (!response && retries < maxRetries) {
      try {
        logger(this.name, chalk.blue(`   Sending ${method}...`));
        request = await fetch(url, options);
        response = await request.json();
      } catch (e) {
        // TODO there is some error handling/messaging we could implement here
        // see: https://github.com/SteamDatabase/SalienCheat/blob/ac3a28aeb0446ff80cf6a6e1370fd5ef42e75aa2/cheat.php#L533

        logger(this.name, `   ${chalk.bgRed(`${e.name}:`)} ${chalk.red(`For ${method}`)}`);
        debug(e);

        retries += 1;

        if (retries < maxRetries) {
          logger(this.name, chalk.yellow(`   Retrying ${method} in ${this.defaultDelaySec} seconds...`));
        } else {
          throw new SalienScriptException(`Failed ${method} after ${retries} retries`);
        }

        await delay(this.defaultDelayMs);
      }
    }

    return response.response;
  }

  async ApiGetPlanets() {
    const response = await this.RequestAPI(
      'ITerritoryControlMinigameService/GetPlanets',
      ['active_only=1'],
      this.maxRetries,
    );
    return response.planets;
  }

  async ApiGetPlanet(planetId) {
    const response = await this.RequestAPI(
      'ITerritoryControlMinigameService/GetPlanet',
      [`id=${planetId}`, 'language=english'],
      this.maxRetries,
    );
    return response.planets[0];
  }

  async ApiGetPlayerInfo() {
    const response = await this.RequestAPI(
      'ITerritoryControlMinigameService/GetPlayerInfo',
      [`access_token=${this.token}`],
      this.maxRetries,
      { method: 'POST' },
    );
    return response;
  }

  async ApiRepresentClan(clanId) {
    const response = await this.RequestAPI(
      'ITerritoryControlMinigameService/RepresentClan',
      [`access_token=${this.token}`, `clanid=${clanId}`],
      this.maxRetries,
      { method: 'POST' },
    );
    return response;
  }

  async ApiLeaveGame(gameId) {
    const response = await this.RequestAPI(
      'IMiniGameService/LeaveGame',
      [`access_token=${this.token}`, `gameid=${gameId}`],
      this.maxRetries,
      { method: 'POST' },
    );
    return response;
  }

  async ApiJoinPlanet(planetId) {
    const response = await this.RequestAPI(
      'ITerritoryControlMinigameService/JoinPlanet',
      [`access_token=${this.token}`, `id=${planetId}`],
      this.maxRetries,
      { method: 'POST' },
    );
    return response;
  }

  async ApiJoinZone(zoneId) {
    const response = await this.RequestAPI(
      'ITerritoryControlMinigameService/JoinZone',
      [`access_token=${this.token}`, `zone_position=${zoneId}`],
      this.maxRetries,
      { method: 'POST' },
    );
    return response;
  }

  async ApiReportScore(score) {
    const response = await this.RequestAPI(
      'ITerritoryControlMinigameService/ReportScore',
      [`access_token=${this.token}`, `score=${score}`, `language=english`],
      this.maxRetries,
      { method: 'POST' },
    );
    return response;
  }

  async leaveCurrentGame(leaveCurrentPlanet = 0) {
    let playerInfo;

    while (!playerInfo) {
      playerInfo = await this.ApiGetPlayerInfo();
    }

    if (playerInfo.active_zone_game) {
      await this.ApiLeaveGame(playerInfo.active_zone_game);
    }

    playerInfo = null;

    while (!playerInfo) {
      playerInfo = await this.ApiGetPlayerInfo();
    }

    if (!playerInfo.active_planet) {
      return 0;
    }

    const activePlanet = playerInfo.active_planet;

    if (leaveCurrentPlanet > 0 && leaveCurrentPlanet !== activePlanet) {
      logger(
        this.name,
        `Leaving planet ${chalk.yellow(activePlanet)}, because we want to be on ${chalk.yellow(leaveCurrentPlanet)}`,
      );

      await this.ApiLeaveGame(activePlanet);
    }

    return activePlanet;
  }

  async getFirstAvailableZone(planetId) {
    let planet;

    while (!planet) {
      planet = await this.ApiGetPlanet(planetId);
    }

    if (!planet.zones) {
      return null;
    }

    const planetName = planet.state.name;
    const planetCaptured = planet.state.capture_progress;
    const planetPlayers = planet.state.current_players;
    const { zones } = planet;

    const cleanZones = [];

    let hardZones = 0;
    let mediumZones = 0;
    let easyZones = 0;
    let unknownZones = 0;

    let toReturn = null;

    zones.forEach(zone => {
      if (zone.captured) {
        return;
      }

      if (zone.type !== 3) {
        logger(this.name, chalk.red(`!! Unknown zone type: ${zone.type}`));
      }

      // If a zone is close to completion, skip it because Valve does not reward points and replies with 42 NoMatch
      if (zone.capture_progress && zone.capture_progress > 0.97) {
        return;
      }

      switch (zone.difficulty) {
        case 3:
          hardZones += 1;
          break;
        case 2:
          mediumZones += 1;
          break;
        case 1:
          easyZones += 1;
          break;
        default:
          unknownZones += 1;
          break;
      }

      // Always join boss zone
      if (zone.type === 4) {
        toReturn = {
          hardZones,
          mediumZones,
          easyZones,
          unknownZones,
          planetPlayers,
          planetCaptured,
          planetName,
          ...zone,
        };
        return;
      }

      cleanZones.push(zone);
    });

    if (toReturn) {
      return toReturn;
    }

    if (cleanZones.length < 0) {
      return false;
    }

    cleanZones.sort((a, b) => {
      if (b.difficulty === a.difficulty) {
        return b.zone_position - a.zone_position;
      }

      return b.difficulty - a.difficulty;
    });

    return {
      hardZones,
      mediumZones,
      easyZones,
      unknownZones,
      planetPlayers,
      planetCaptured,
      planetName,
      ...cleanZones[0],
    };
  }

  async isThereAnyNewPlanets(knownPlanetIds) {
    logger(this.name, '   Checking for any new planets...');

    let planets;

    while (!planets) {
      planets = await this.ApiGetPlanets();
    }

    if (!planets) {
      return false;
    }

    let hasNewPlanet = false;

    await planets.forEach(planet => {
      if (!knownPlanetIds.includes(planet.id)) {
        hasNewPlanet = true;
      }
    });

    return hasNewPlanet;
  }

  async setupGame() {
    const planets = await this.ApiGetPlanets();

    if (!planets) {
      throw new SalienScriptException("Didn't find any planets.");
    }

    try {
      await asyncForEach(this, planets, async (planet, index, array, _this) => {
        let zones;

        let hardZones = 0;
        let mediumZones = 0;
        let easyZones = 0;
        let unknownZones = 0;

        let hasBossZone = false;

        while (!zones) {
          zones = await _this.ApiGetPlanet(planet.id);
        }

        zones.zones.forEach(zone => {
          if ((zone.capture_progress && zone.capture_progress > 0.97) || zone.captured) {
            return;
          }

          if (zone.type === 4) {
            hasBossZone = true;
          } else if (zone.type !== 3) {
            logger(this.name, chalk.red(`!! Unknown zone type: ${zone.type}`));
          }

          switch (zone.difficulty) {
            case 3:
              hardZones += 1;
              break;
            case 2:
              mediumZones += 1;
              break;
            case 1:
              easyZones += 1;
              break;
            default:
              unknownZones += 1;
              break;
          }
        });

        _this.knownPlanetIds.push(planet.id);

        // eslint-disable-next-line no-param-reassign
        _this.knownPlanets[planet.id] = {
          hardZones,
          mediumZones,
          easyZones,
          unknownZones,
          hasBossZone,
          ...planet,
        };

        const capturedPercent = Number(planet.state.capture_progress * 100)
          .toFixed(2)
          .toString();

        const planetName = planet.state.name
          .replace('#TerritoryControl_', '')
          .split('_')
          .join(' ');

        let logMsg = `>> Planet: ${chalk.green(planet.id)}`;
        logMsg += ` - Hard: ${chalk.yellow(hardZones)} - Medium: ${chalk.yellow(mediumZones)}`;
        logMsg += ` - Easy: ${chalk.yellow(easyZones)} - Captured: ${chalk.yellow(capturedPercent)}%`;
        logMsg += ` - Players: ${chalk.yellow(planet.state.current_players.toLocaleString())}`;
        logMsg += ` (${chalk.green(planetName)})`;

        logger(this.name, logMsg);

        if (unknownZones) {
          logger(this.name, `>> Unknown zones found: ${chalk.yellow(unknownZones)}`);
        }

        if (hasBossZone) {
          // eslint-disable-next-line no-param-reassign
          _this.currentPlanetId = planet.id;

          throw new SalienScriptException('Boss zone found!');
        }
      });
    } catch (e) {
      if (e.name === 'SalienScriptException' && e.message === 'Boss zone found!') {
        logger(this.name, chalk.green('>> This planet has a boss zone, selecting this planet'));
      } else {
        debug(e);
        throw new SalienScriptException(e.message);
      }
    }

    // FIXME this logic might be able to be cleaned up
    const priority = ['hardZones', 'mediumZones', 'easyZones'];

    if (!this.currentPlanetId) {
      this.knownPlanetIds.sort((a, b) => {
        const planetA = this.knownPlanets[a];
        const planetB = this.knownPlanets[b];

        for (let i = 0; i < priority.length; i += 1) {
          const key = priority[i];

          if (planetA[key] !== planetB[key]) {
            return planetA[key] - planetB[key];
          }
        }

        return Number(planetA.id) - Number(planetB.id);
      });

      for (let i = 0; i < priority.length; i += 1) {
        this.knownPlanetIds.forEach(planetId => {
          const planet = this.knownPlanets[planetId];

          if (this.skippedPlanets.includes(planetId) || !planet[priority[i]]) {
            return;
          }

          if (!planet.state.captured && !this.currentPlanetId) {
            const planetName = planet.state.name
              .replace('#TerritoryControl_', '')
              .split('_')
              .join(' ');

            logger(this.name, `>> Selected planet ${chalk.green(planetId)} (${chalk.green(planetName)})`);

            this.currentPlanetId = planetId;
          }
        });
      }

      if (!this.currentPlanetId) {
        // If there are no planets with hard or medium zones, just return first one
        this.currentPlanetId = planets[0].id;
      }
    }

    while (this.currentPlanetId !== this.steamPlanetId) {
      // Leave current game before trying to switch planets (it will report InvalidState otherwise)
      this.steamPlanetId = await this.leaveCurrentGame(this.currentPlanetId);

      if (this.currentPlanetId !== this.steamPlanetId) {
        await this.ApiJoinPlanet(this.currentPlanetId);

        this.steamPlanetId = await this.leaveCurrentGame();
      }
    }
  }

  async gameLoop() {
    console.log(''); // eslint-disable-line no-console

    // Scan planets every 10 minutes
    if (new Date().getTime() - this.startTime > 600000) {
      throw new SalienScriptRestart('!! Re-scanning for new planets');
    }

    let zone;

    while (!zone) {
      zone = await this.getFirstAvailableZone(this.currentPlanetId);
    }

    if (zone === false) {
      this.skippedPlanets.push(this.currentPlanetId);

      throw new SalienScriptRestart('!! There are no zones to join in this planet');
    }

    const { hardZones, mediumZones, planetCaptured, planetPlayers } = zone;

    if (!hardZones) {
      if (!mediumZones && new Date().getTime() - this.startTime > this.waitTime * 1000) {
        throw new SalienScriptRestart('!! No hard or medium zones on this planet');
      }

      const hasNewPlanet = await this.isThereAnyNewPlanets(this.knownPlanetIds);

      if (hasNewPlanet) {
        throw new SalienScriptRestart('!! Detected a new planet');
      }
    }

    const planetName = zone.planetName
      .replace('#TerritoryControl_', '')
      .split('_')
      .join(' ');

    const position = zone.zone_position;

    zone = null;

    while (!zone) {
      zone = await this.ApiJoinZone(position);
    }

    if (!zone.zone_info) {
      throw new SalienScriptRestart('!! Failed to join a zone');
    }

    const zoneInfo = zone.zone_info;

    const capturedPercent = Number(planetCaptured * 100)
      .toFixed(2)
      .toString();

    let planetLogMsg = `>> Planet ${chalk.green(this.currentPlanetId)} - Captured: ${chalk.yellow(capturedPercent)}%`;
    planetLogMsg += ` - Hard: ${chalk.yellow(hardZones)} - Medium: ${chalk.yellow(mediumZones)}`;
    planetLogMsg += ` - Players: ${chalk.yellow(planetPlayers.toLocaleString())} (${chalk.green(planetName)})`;

    logger(this.name, planetLogMsg);

    const capturedProgress = !zoneInfo.capture_progress
      ? 0
      : Number(zoneInfo.capture_progress * 100)
          .toFixed(2)
          .toString();

    let zoneLogMsg = `>> Zone ${chalk.green(zoneInfo.zone_position)} - Captured: ${chalk.yellow(capturedProgress)}%`;
    zoneLogMsg += ` - Difficulty: ${chalk.yellow(getDifficultyName(zoneInfo))}`;

    logger(this.name, zoneLogMsg);

    if (zoneInfo.top_clans) {
      logger(this.name, `-- Top Clans:${zoneInfo.top_clans.map(({ name }) => ` ${name}`)}`);
    }

    logger(this.name, `   ${chalk.bgMagenta(`Waiting ${this.waitTime} seconds for round to finish...`)}`);

    await delay(this.waitTime * 1000);

    const report = await this.ApiReportScore(getScoreForZone(zone));

    if (report.new_score) {
      const earnedXp = report.new_score - report.old_score;
      const nextLevelPercent = ((report.new_score / report.next_level_score) * 100).toFixed(2);

      let currentLevelMsg = `>> XP Earned: ${chalk.green(earnedXp.toLocaleString())}`;
      currentLevelMsg += ` (${chalk.yellow(report.old_score.toLocaleString())} XP`;
      currentLevelMsg += `=> ${chalk.green(report.new_score.toLocaleString())} XP)`;
      currentLevelMsg += ` - Current Level: ${chalk.green(report.new_level)} (${nextLevelPercent}% to next)`;

      logger(this.name, currentLevelMsg);

      const remainingXp = report.next_level_score - report.new_score;

      const timeRemaining =
        ((report.next_level_score - report.new_score) / getScoreForZone(zone)) * (this.waitTime / 60);
      const hoursRemaining = Math.floor(timeRemaining / 60);
      const minutesRemaining = timeRemaining % 60;
      const levelEta = `${hoursRemaining}h ${minutesRemaining}m`;

      let nextLevelMsg = `>> Next Level: ${chalk.yellow(report.next_level_score.toLocaleString())} XP`;
      nextLevelMsg += `- Remaining: ${chalk.yellow(remainingXp.toLocaleString())} XP - ETA: ${chalk.green(levelEta)}`;

      logger(this.name, nextLevelMsg);
    }

    // Some users get stuck in games after calling ReportScore, so we manually leave to fix this
    let leftGame;

    while (!leftGame) {
      leftGame = await this.leaveCurrentGame(this.currentPlanetId);
    }

    if (leftGame !== this.currentPlanetId) {
      throw new SalienScriptRestart('!! Wrong current planet');
    }
  }

  async init() {
    this.startTime = new Date().getTime();

    // Reset all variables to default values every time init() is called
    this.currentPlanetId = null;
    this.knownPlanetIds = [];
    this.knownPlanets = {};
    this.skippedPlanets = [];

    try {
      logger(this.name, `   ${chalk.bgGreen(` Started SalienScript | Version: ${pkgVersion} `)}`);

      await this.setupGame();

      // eslint-disable-next-line no-constant-condition
      while (true) {
        await this.gameLoop();
      }
    } catch (e) {
      logger(this.name, `   ${chalk.bgRed(`${e.name}:`)} ${chalk.red(e.message)}`);

      if (e.name !== 'SalienScriptRestart') {
        debug(e);
      }

      logger(this.name, `   ${chalk.bgMagenta(`Script will restart in ${this.defaultDelaySec} seconds...\n\n`)}`);

      await delay(this.defaultDelayMs);

      this.init();
    }
  }
}

module.exports = SalienScript;
