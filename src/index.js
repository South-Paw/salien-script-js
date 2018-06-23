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

// eslint-disable-next-line no-console
const logger = (...messages) => console.log(chalk.white(dateFormat(new Date(), '[HH:MM:ss]')), ...messages);

// eslint-disable-next-line no-console
const debug = message => console.log(`${JSON.stringify(message, 0, 2)}`);

class SalienScriptException {
  constructor(message) {
    this.name = 'SalienScriptException';
    this.message = message;
  }
}

/*
class SalienScriptRestart {
  constructor(message) {
    this.name = 'SalienScriptRestart';
    this.message = message;
  }
}
*/

class SalienScript {
  constructor({ token, clan }) {
    this.token = token;
    this.clan = clan;

    this.maxRetries = 2;
    this.defaultDelayMs = 5000;
    this.defaultDelaySec = this.defaultDelayMs / 1000;

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
        logger(chalk.blue(`Sending ${method}...`));
        request = await fetch(url, options);
        response = await request.json();
      } catch (e) {
        logger(chalk.bgRed(`${e.name}:`), chalk.red(`For ${method}`));
        debug(e);

        retries += 1;

        if (retries < maxRetries) {
          logger(chalk.yellow(`Retrying ${method} in ${this.defaultDelaySec} seconds...`));
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
        `Leaving planet ${chalk.yellow(activePlanet)}, because we want to be on ${chalk.yellow(leaveCurrentPlanet)}`,
      );

      await this.ApiLeaveGame(activePlanet);
    }

    return activePlanet;
  }

  async setupGame() {
    const planets = await this.ApiGetPlanets();

    if (!planets) {
      throw new SalienScriptException("Didn't find any planets.");
    }

    try {
      // Patch the apiGetPlanets response with zones from apiGetPlanet
      const mappedPlanets = await Promise.all(
        planets.map(async planet => {
          const object = Object.assign({}, planet);

          const currentPlanet = await this.ApiGetPlanet(planet.id);
          object.zones = currentPlanet.zones;
          return object;
        }),
      );

      mappedPlanets.forEach(planet => {
        let hardZones = 0;
        let mediumZones = 0;
        let easyZones = 0;
        let unknownZones = 0;

        let hasBossZone = false;

        // Filter out captured zones
        planet.zones.forEach(zone => {
          if ((zone.capture_progress && zone.capture_progress > 0.97) || zone.captured) {
            return;
          }

          if (zone.type === 4) {
            hasBossZone = true;
          } else if (zone.type !== 3) {
            logger(chalk.red(`!! Unknown zone type: ${zone.type}`));
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

        this.knownPlanets[planet.id] = {
          hardZones,
          mediumZones,
          easyZones,
          unknownZones,
          hasBossZone,
          ...planet,
        };

        this.knownPlanetIds.push(planet.id);

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

        logger(logMsg);

        if (unknownZones) {
          logger(`>> Unknown zones found: ${chalk.yellow(unknownZones)}`);
        }

        if (hasBossZone) {
          // eslint-disable-next-line no-param-reassign
          logger(chalk.green('>> This planet has a boss zone, selecting this planet'));
          this.currentPlanetId = planet.id;
        }
      });
    } catch (e) {
      throw new SalienScriptException(e.message);
    }

    if (!this.currentPlanetId) {
      // TODO allow people to select what zone to focus
      //  * either by hardest or eaiest
      //  * by what steam appIds are on each planet

      const sortedPlanets = this.knownPlanetIds.sort((a, b) => {
        const planetA = this.knownPlanets[a];
        const planetB = this.knownPlanets[b];

        if (planetB.hardZones === planetA.hardZones) {
          if (planetB.mediumZones === planetA.mediumZones) {
            // If the hard and medium zones are equal, sort by most capture progress
            return planetB.state.capture_progress - planetA.state.capture_progress;
          }

          // If the hard zones are equal, sort by most medium zones
          return planetB.mediumZones - planetA.mediumZones;
        }

        // Sort planets by least amount of hard zones
        return planetA.hard_zones - planetB.hard_zones;
      });

      // FIXME this logic might be able to be cleaned up
      const priorities = ['hardZones', 'mediumZones'];

      // Loop twice - first loop tries to find planet with hard zones, second loop - medium zones
      for (let i = 0; i < priorities.length; i += 1) {
        // eslint-disable-next-line no-loop-func
        sortedPlanets.forEach(planetId => {
          const planet = this.knownPlanets[planetId];

          if (this.skippedPlanets.includes(planetId) || !planet[priorities[i]]) {
            return;
          }

          if (!planet.state.captured && !this.currentPlanetId) {
            const planetName = planet.state.name
              .replace('#TerritoryControl_', '')
              .split('_')
              .join(' ');

            logger(`>> Selected planet ${chalk.green(planetId)} (${chalk.green(planetName)})`);

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
    console.log('currentPlanetId', this.currentPlanetId);

    throw new SalienScriptException(`gameLoop() not yet implemented`);
  }

  async init() {
    // Reset all variables to default values every time init() is called
    this.currentPlanetId = null;
    this.knownPlanetIds = [];
    this.knownPlanets = {};
    this.skippedPlanets = [];

    try {
      logger(chalk.bgGreen(` Started SalienScript | Version: ${pkgVersion} `));

      await this.setupGame();

      // eslint-disable-next-line no-constant-condition
      while (true) {
        await this.gameLoop();
      }
    } catch (e) {
      logger(chalk.bgRed(`${e.name}:`), chalk.red(e.message));
      debug(e);

      logger(chalk.bgMagenta(`Script will restart in ${this.defaultDelaySec} seconds...\n\n`));

      await delay(this.defaultDelayMs);

      this.init();
    }
  }
}

module.exports = SalienScript;
