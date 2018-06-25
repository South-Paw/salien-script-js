/**
 * MIT License
 *
 * Copyright (c) 2018 Alex Gabites
 *
 * https://github.com/South-Paw/salien-script-js
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
const delay = require('delay');

const {
  getPlayerInfo,
  getPlanets,
  getPlanet,
  representClan,
  leaveGame,
  joinPlanet,
  joinZone,
  reportScore,
} = require('./api/index');
const { SalienScriptException, SalienScriptRestart } = require('./exceptions');
const { debug, logger, getPercentage, updateCheck } = require('./util');
const pkg = require('../package.json');

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

const formatPlanetName = name =>
  name
    .replace('#TerritoryControl_Planet', '')
    .split('_')
    .join(' ');

// TODO: next step is to break all the game logic out from this file and into reusable functions. Things like selecting
// the first planet, sending a score ... etc can all be abstracted out.

class SalienScript {
  constructor({ token, clan, name = null }) {
    this.token = token;
    this.clan = clan;
    this.name = name;

    this.defaultDelayMs = 5000;
    this.defaultDelaySec = this.defaultDelayMs / 1000;

    this.startTime = null;
    this.waitTime = 110;
    this.hasJoinedClan = false;

    this.currentPlanetId = null;
    this.steamPlanetId = null;
    this.knownPlanets = new Map();
    this.knownPlanetIds = [];
    this.skippedPlanets = [];
  }

  // TODO: it'd be nice to remove all of these class async funcs but might be messy with that little logger function...

  async ApiGetPlayerInfo() {
    return getPlayerInfo(this.token, msg => logger(this.name, msg));
  }

  async ApiGetPlanets() {
    return getPlanets(msg => logger(this.name, msg));
  }

  async ApiGetPlanet(planetId) {
    return getPlanet(planetId, msg => logger(this.name, msg));
  }

  async ApiRepresentClan(clanId) {
    return representClan(this.token, clanId, msg => logger(this.name, msg));
  }

  async ApiLeaveGame(gameId) {
    return leaveGame(this.token, gameId, msg => logger(this.name, msg));
  }

  async ApiJoinPlanet(planetId) {
    return joinPlanet(this.token, planetId, msg => logger(this.name, msg));
  }

  async ApiJoinZone(zoneId) {
    return joinZone(this.token, zoneId, msg => logger(this.name, msg));
  }

  async ApiReportScore(score) {
    return reportScore(this.token, score, msg => logger(this.name, msg));
  }

  async leaveCurrentGame(leaveCurrentPlanet = 0) {
    let playerInfo;

    while (!playerInfo) {
      playerInfo = await this.ApiGetPlayerInfo();
    }

    if (playerInfo.active_zone_game) {
      await this.ApiLeaveGame(playerInfo.active_zone_game);
    }

    if (this.clan && !this.hasJoinedClan && playerInfo.clan_info && playerInfo.clan_info.accountid !== this.clan) {
      logger(this.name, { message: `Attempting to join groupId: ${chalk.yellow(this.clan)}` });

      await this.ApiRepresentClan(this.clan);

      let clanCheckInfo = null;

      while (!clanCheckInfo) {
        clanCheckInfo = await this.ApiGetPlayerInfo();
      }

      if (clanCheckInfo.clan_info) {
        logger(this.name, { message: `${chalk.bgCyan(` Joined group: ${clanCheckInfo.clan_info.name} `)}` });
        const unexpected = "If the name above isn't expected, check if you're actually a member of that group";
        logger(this.name, { message: `${chalk.yellow(unexpected)}` });
      }

      this.hasJoinedClan = true;
    }

    if (!playerInfo.active_planet) {
      return 0;
    }

    const activePlanet = playerInfo.active_planet;

    if (leaveCurrentPlanet > 0 && leaveCurrentPlanet !== activePlanet) {
      let leaving = `>> Leaving planet ${chalk.yellow(activePlanet)}, because`;
      leaving += `we want to be on ${chalk.yellow(leaveCurrentPlanet)}`;

      logger(this.name, { message: leaving });

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
        logger(this.name, { message: chalk.red(`!! Unknown zone type: ${zone.type}`) });
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
    logger(this.name, { message: 'Checking for any new planets...' });

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

    logger(this.name, { message: 'Getting first available planet...' });

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

        // Filter out captured zones + determine zone types
        planet.zones.forEach(zone => {
          if ((zone.capture_progress && zone.capture_progress > 0.97) || zone.captured) {
            return;
          }

          if (zone.type === 4) {
            hasBossZone = true;
          } else if (zone.type !== 3) {
            logger(this.name, { message: chalk.red(`!! Unknown zone type: ${zone.type}`) });
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

        this.knownPlanetIds.push(planet.id);

        this.knownPlanets.set(planet.id, {
          hardZones,
          mediumZones,
          easyZones,
          unknownZones,
          hasBossZone,
          ...planet,
        });

        const capturedPercent = getPercentage(planet.state.capture_progress).toString();

        const planetName = formatPlanetName(planet.state.name);

        let logMsg = `>> Planet: ${chalk.green(planet.id)}`;
        logMsg += ` - Hard: ${chalk.yellow(hardZones)} - Medium: ${chalk.yellow(mediumZones)}`;
        logMsg += ` - Easy: ${chalk.yellow(easyZones)} - Captured: ${chalk.yellow(capturedPercent)}%`;
        logMsg += ` - Players: ${chalk.yellow(planet.state.current_players.toLocaleString())}`;
        logMsg += ` (${chalk.green(planetName)})`;

        logger(this.name, { message: logMsg });

        if (unknownZones) {
          logger(this.name, { message: `>> Unknown zones found: ${chalk.yellow(unknownZones)}` });
        }
      });

      this.knownPlanetIds.forEach(id => {
        const planet = this.knownPlanets.get(id);

        if (planet.hasBossZone) {
          this.currentPlanetId = planet.id;
          throw new SalienScriptException('Boss zone found!');
        }
      });
    } catch (e) {
      if (e.name === 'SalienScriptException' && e.message === 'Boss zone found!') {
        let bossZoneMsg = chalk.green(`>> Planet ${chalk.yellow(this.currentPlanetId)}`);
        bossZoneMsg += ` has a boss zone, selecting this planet`;

        logger(this.name, { message: bossZoneMsg });
      } else {
        debug(e);
        throw new SalienScriptException(e.message);
      }
    }

    // FIXME this logic might be able to be cleaned up
    const priority = ['hardZones', 'mediumZones', 'easyZones'];

    if (!this.currentPlanetId) {
      const sortedPlanetIds = this.knownPlanetIds.sort((a, b) => {
        const planetA = this.knownPlanets.get(a);
        const planetB = this.knownPlanets.get(b);

        for (let i = 0; i < priority.length; i += 1) {
          const key = priority[i];

          if (planetA[key] !== planetB[key]) {
            return planetA[key] - planetB[key];
          }
        }

        return Number(planetA.id) - Number(planetB.id);
      });

      for (let i = 0; i < priority.length; i += 1) {
        sortedPlanetIds.forEach(planetId => {
          const planet = this.knownPlanets.get(planetId);

          if (this.skippedPlanets.includes(planetId) || !planet[priority[i]]) {
            return;
          }

          if (!planet.state.captured && !this.currentPlanetId) {
            const planetName = formatPlanetName(planet.state.name);

            logger(this.name, { message: `>> Selected planet ${chalk.green(planetId)} (${chalk.green(planetName)})` });

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

    await updateCheck(this.name);

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

    const { hardZones, mediumZones, easyZones, planetCaptured, planetPlayers } = zone;

    if (!hardZones) {
      if (!mediumZones && new Date().getTime() - this.startTime > this.waitTime * 1000) {
        throw new SalienScriptRestart('!! No hard or medium zones on this planet');
      }

      const hasNewPlanet = await this.isThereAnyNewPlanets(this.knownPlanetIds);

      if (hasNewPlanet) {
        throw new SalienScriptRestart('!! Detected a new planet');
      }
    }

    const planetName = formatPlanetName(zone.planetName);

    const position = zone.zone_position;

    zone = null;

    while (!zone) {
      zone = await this.ApiJoinZone(position);
    }

    if (!zone.zone_info) {
      throw new SalienScriptRestart('!! Failed to join a zone');
    }

    const zoneInfo = zone.zone_info;

    const capturedPercent = getPercentage(planetCaptured).toString();

    let planetLogMsg = `>> Planet ${chalk.green(this.currentPlanetId)} - Captured: ${chalk.yellow(capturedPercent)}%`;
    planetLogMsg += ` - Hard: ${chalk.yellow(hardZones)} - Medium: ${chalk.yellow(mediumZones)}`;
    planetLogMsg += ` - Easy: ${chalk.yellow(easyZones)}`;
    planetLogMsg += ` - Players: ${chalk.yellow(planetPlayers.toLocaleString())} (${chalk.green(planetName)})`;

    logger(this.name, { message: planetLogMsg });

    const capturedProgress = !zoneInfo.capture_progress ? 0 : getPercentage(zoneInfo.capture_progress).toString();

    let zoneLogMsg = `>> Zone ${chalk.green(zoneInfo.zone_position)} - Captured: ${chalk.yellow(capturedProgress)}%`;
    zoneLogMsg += ` - Difficulty: ${chalk.yellow(getDifficultyName(zoneInfo))}`;

    logger(this.name, { message: zoneLogMsg });

    if (zoneInfo.top_clans) {
      logger(this.name, { message: `-- Top Clans:${zoneInfo.top_clans.map(({ name }) => ` ${name}`)}` });
    }

    logger(this.name, { message: `${chalk.bgMagenta(` Waiting ${this.waitTime} seconds for round to finish... `)}` });

    await delay(this.waitTime * 1000);

    const report = await this.ApiReportScore(getScoreForZone(zoneInfo));

    if (report.new_score) {
      const earnedXp = report.new_score - report.old_score;
      const nextLevelPercent = getPercentage(report.new_score / report.next_level_score);

      let currentLevelMsg = `>> XP Earned: ${chalk.green(earnedXp.toLocaleString())}`;
      currentLevelMsg += ` (${chalk.yellow(report.old_score.toLocaleString())} XP`;
      currentLevelMsg += ` => ${chalk.green(report.new_score.toLocaleString())} XP)`;
      currentLevelMsg += ` - Current Level: ${chalk.green(report.new_level)} (${nextLevelPercent}% to next)`;

      logger(this.name, { message: currentLevelMsg });

      const remainingXp = report.next_level_score - report.new_score;

      const timeRemaining =
        ((report.next_level_score - report.new_score) / getScoreForZone(zoneInfo)) * (this.waitTime / 60);
      const hoursRemaining = Math.floor(timeRemaining / 60);
      const minutesRemaining = Math.round(timeRemaining % 60);
      const levelEta = `${hoursRemaining}h ${minutesRemaining}m`;

      let nextLevelMsg = `>> Next Level: ${chalk.yellow(report.next_level_score.toLocaleString())} XP`;
      nextLevelMsg += ` - Remaining: ${chalk.yellow(remainingXp.toLocaleString())} XP - ETA: ${chalk.green(levelEta)}`;

      logger(this.name, { message: nextLevelMsg });
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
    this.knownPlanets = new Map();
    this.skippedPlanets = [];

    try {
      logger(this.name, { message: `${chalk.bgGreen(` Started SalienScript | Version: ${pkg.version} `)}` });

      const starme = ` If you appreciate the script, please remember to leave a ⭐ star ⭐ on the project! `;

      logger(this.name, { message: `${chalk.bgCyan(starme)}` });

      await this.setupGame();

      // eslint-disable-next-line no-constant-condition
      while (true) {
        await this.gameLoop();
      }
    } catch (e) {
      logger(this.name, { message: `${chalk.bgRed(`${e.name}:`)} ${chalk.red(e.message)}` });

      if (e.name !== 'SalienScriptRestart') {
        debug(e);
      }

      const restartMsg = `${chalk.bgMagenta(` Script will restart in ${this.defaultDelaySec} seconds... `)}\n\n`;

      logger(this.name, { message: restartMsg });

      await delay(this.defaultDelayMs);

      this.init();
    }
  }
}

module.exports = SalienScript;
