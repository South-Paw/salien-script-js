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
const { getZoneDifficultyName, getScoreForZone, getAllPlanetStates, getBestPlanetAndZone } = require('./game/index');
const { SalienScriptRestart } = require('./exceptions');
const { getPercentage, updateCheck, utilLogger } = require('./util');
const pkg = require('../package.json');

class SalienScript {
  constructor({ token, clan, name = null, logRequests = false }) {
    // user defined variables
    this.token = token;
    this.clanId = clan;
    this.name = name;
    this.isSilentRequest = !logRequests;

    // script variables
    this.startTime = null;
    this.knownPlanets = new Map();
    this.currentPlanetAndZone = null;
    this.steamThinksPlanet = null;
    this.skippedPlanets = [];

    // script variables that don't get reset
    this.clanCheckDone = false;

    // script defaults
    this.gameWaitTimeSec = 110;
    this.defaultDelayMs = 5000;
    this.defaultDelaySec = this.defaultDelayMs / 1000;
    this.cutoff = 0.99;
  }

  resetScript() {
    this.startTime = null;
    this.knownPlanets = new Map();
    this.currentPlanetAndZone = null;
    this.steamThinksPlanet = null;
    this.skippedPlanets = [];
  }

  logger(message, error) {
    utilLogger(this.name, { message, error });
  }

  async apiGetPlayerInfo() {
    return getPlayerInfo(this.token, (m, e) => this.logger(m, e), this.isSilentRequest);
  }

  async apiGetPlanets() {
    return getPlanets((m, e) => this.logger(m, e), this.isSilentRequest);
  }

  async apiGetPlanet(planetId) {
    return getPlanet(planetId, (m, e) => this.logger(m, e), this.isSilentRequest);
  }

  async apiRepresentClan(clanId) {
    return representClan(this.token, clanId, (m, e) => this.logger(m, e), this.isSilentRequest);
  }

  async apiLeaveGame(gameId) {
    return leaveGame(this.token, gameId, (m, e) => this.logger(m, e), this.isSilentRequest);
  }

  async apiJoinPlanet(planetId) {
    return joinPlanet(this.token, planetId, (m, e) => this.logger(m, e), this.isSilentRequest);
  }

  async apiJoinZone(zoneId) {
    return joinZone(this.token, zoneId, (m, e) => this.logger(m, e), this.isSilentRequest);
  }

  async apiReportScore(score) {
    return reportScore(this.token, score, (m, e) => this.logger(m, e), this.isSilentRequest);
  }

  async leaveCurrentGame(requestedPlanetId = 0) {
    const playerInfo = await this.apiGetPlayerInfo();

    if (playerInfo.active_zone_game) {
      await this.apiLeaveGame(playerInfo.active_zone_game);
    }

    if (!playerInfo.active_planet) {
      return 0;
    }

    const activePlanet = playerInfo.active_planet;

    if (requestedPlanetId > 0 && requestedPlanetId !== activePlanet) {
      let message = `>> Leaving planet ${chalk.yellow(activePlanet)}, because`;
      message += ` we want to be on ${chalk.yellow(requestedPlanetId)}`;

      this.logger(message);

      await this.apiLeaveGame(activePlanet);
    }

    return activePlanet;
  }

  async doClanSetup() {
    let playerInfo = await this.apiGetPlayerInfo();

    if (this.clanId && !this.clanCheckDone && playerInfo.clan_info) {
      this.logger(`Attempting to join group id: ${chalk.yellow(this.clanId)}`);

      await this.apiRepresentClan(this.clanId);

      playerInfo = await this.apiGetPlayerInfo();

      if (playerInfo.clan_info) {
        this.logger(chalk.bgCyan(` Joined group: ${playerInfo.clan_info.name} `));
        this.logger(chalk.yellow("If the name above isn't expected, check if you're actually a member of that group"));

        this.clanCheckDone = true;
      }

      console.log(''); // eslint-disable-line no-console
    }
  }

  async doGameSetup() {
    const planets = await this.apiGetPlanets();

    this.knownPlanets = await getAllPlanetStates(
      planets,
      this.cutoff,
      (m, e) => this.logger(m, e),
      this.isSilentRequest,
    );

    this.currentPlanetAndZone = await getBestPlanetAndZone(this.knownPlanets, (m, e) => this.logger(m, e));

    const zoneCapturePercent = getPercentage(this.currentPlanetAndZone.bestZone.capture_progress);

    let zoneMsg = `>> Selected Next Zone ${chalk.green(this.currentPlanetAndZone.bestZone.zone_position)}`;
    zoneMsg += ` on Planet ${chalk.green(this.currentPlanetAndZone.id)}`;
    zoneMsg += ` (Captured: ${chalk.yellow(`${zoneCapturePercent}%`.padStart(6))}`;
    zoneMsg += ` - Difficulty: ${chalk.yellow(getZoneDifficultyName(this.currentPlanetAndZone.bestZone))})`;

    this.logger(zoneMsg);

    console.log(''); // eslint-disable-line no-console
  }

  async doGameLoop() {
    while (this.currentPlanetAndZone.id !== this.steamThinksPlanet) {
      this.steamThinksPlanet = await this.leaveCurrentGame(this.currentPlanetAndZone.id);

      if (this.currentPlanetAndZone.id !== this.steamThinksPlanet) {
        await this.apiJoinPlanet(this.currentPlanetAndZone.id);

        this.steamThinksPlanet = await this.leaveCurrentGame();
      }
    }

    const zone = await this.apiJoinZone(this.currentPlanetAndZone.bestZone.zone_position);

    // rescan if we failed to join
    if (!zone.zone_info) {
      throw new SalienScriptRestart('!! Failed to join a zone', zone);
    }

    const zoneInfo = zone.zone_info;

    const zoneCapturePercent = getPercentage(zoneInfo.capture_progress);

    let joinMsg = `>> Joined Zone ${chalk.green(zoneInfo.zone_position)}`;
    joinMsg += ` on Planet ${chalk.green(this.currentPlanetAndZone.id)}`;
    joinMsg += ` (Captured: ${chalk.yellow(`${zoneCapturePercent}%`.padStart(6))}`;
    joinMsg += ` - Difficulty: ${chalk.yellow(getZoneDifficultyName(this.currentPlanetAndZone.bestZone))})`;

    this.logger(joinMsg);

    if (zoneInfo.top_clans) {
      this.logger(`-- Top Clans:${zoneInfo.top_clans.map(({ name }) => ` ${name}`)}`);
    }

    console.log(''); // eslint-disable-line no-console
    this.logger(`${chalk.bgMagenta(` Waiting ${this.gameWaitTimeSec} seconds for round to finish... `)}`);

    // 10 seconds before the score is reported, get the next planet and zone we should focus on.
    setTimeout(async () => {
      await this.doGameSetup();
    }, (this.gameWaitTimeSec - 10) * 1000);

    await delay(this.gameWaitTimeSec * 1000);

    const score = await this.apiReportScore(getScoreForZone(zoneInfo));

    // cause the game's api returns some numbers as strings and others as numbers
    const oldScore = Number(score.old_score);
    const newScore = Number(score.new_score);
    const nextLevelScore = Number(score.next_level_score);
    const newLevel = Number(score.new_level);

    if (newScore) {
      const earnedXp = newScore - oldScore;
      const nextLevelPercent = getPercentage(newScore / nextLevelScore);

      console.log(''); // eslint-disable-line no-console

      let currentLevelMsg = `>> Score: ${chalk.cyan(Number(newScore).toLocaleString())}`;
      currentLevelMsg += ` (${chalk.green(`+${earnedXp.toLocaleString()}`)})`;
      currentLevelMsg += ` - Current Level: ${chalk.green(newLevel)} (${nextLevelPercent}%)`;

      this.logger(currentLevelMsg);

      const remainingXp = nextLevelScore - newScore;

      const timeRemaining = ((nextLevelScore - newScore) / getScoreForZone(zoneInfo)) * (this.gameWaitTimeSec / 60);
      const hoursRemaining = Math.floor(timeRemaining / 60);
      const minutesRemaining = Math.round(timeRemaining % 60);
      const levelEta = `${hoursRemaining}h ${hoursRemaining === 0 && minutesRemaining === 0 ? 2 : minutesRemaining}m`;

      let nextLevelMsg = `>> Next Level: ${chalk.yellow(nextLevelScore.toLocaleString())} XP`;
      nextLevelMsg += ` - Remaining: ${chalk.yellow(remainingXp.toLocaleString())} XP`;
      nextLevelMsg += ` - ETA: ${chalk.green(levelEta)}\n`;

      this.logger(nextLevelMsg);
    }

    const leavingGame = await this.leaveCurrentGame(this.currentPlanetAndZone.id);

    if (leavingGame !== this.currentPlanetAndZone.id) {
      throw new SalienScriptRestart(`!! Wrong current Planet ${chalk.yellow(leavingGame)}`);
    }
  }

  async init() {
    this.startTime = new Date().getTime();

    console.log(''); // eslint-disable-line no-console
    this.logger(chalk.bgGreen(` Started SalienScript | Version: ${pkg.version} `));
    this.logger(chalk.bgCyan(' Thanks for choosing https://github.com/South-Paw/salien-script-js '));
    this.logger(chalk.bgCyan(' Remeber to drop us a ⭐ star on the project if you appreciate this script! '));
    console.log(''); // eslint-disable-line no-console

    this.resetScript();

    try {
      await this.doClanSetup();

      await this.doGameSetup();

      // eslint-disable-next-line no-constant-condition
      while (true) {
        await updateCheck(this.name);

        await this.doGameLoop();
      }
    } catch (e) {
      this.logger(`${chalk.bgRed(`${e.name}:`)} ${chalk.red(e.message)}`, e.name !== 'SalienScriptRestart' ? e : null);
      this.logger(`${chalk.bgMagenta(` Script will restart in ${this.defaultDelaySec} seconds... `)}\n\n`);

      await delay(this.defaultDelayMs);

      this.init();
    }
  }
}

module.exports = SalienScript;
