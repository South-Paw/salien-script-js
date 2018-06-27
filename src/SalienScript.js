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
  constructor({ token, clan, name = null }) {
    // user defined variables
    this.token = token;
    this.clanId = clan;
    this.cutoff = 0.99;
    this.name = name;

    // script variables
    this.startTime = null;
    this.knownPlanets = new Map();
    this.currentPlanetAndZone = null;
    this.steamThinksPlanet = null;
    this.skippedPlanets = [];

    // script defaults
    this.gameWaitTimeSec = 110;
    this.defaultDelayMs = 5000;
    this.defaultDelaySec = this.defaultDelayMs / 1000;
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
    return getPlayerInfo(this.token, (m, e) => this.logger(m, e));
  }

  async apiGetPlanets() {
    return getPlanets((m, e) => this.logger(m, e));
  }

  async apiGetPlanet(planetId) {
    return getPlanet(planetId, (m, e) => this.logger(m, e));
  }

  async apiRepresentClan(clanId) {
    return representClan(this.token, clanId, (m, e) => this.logger(m, e));
  }

  async apiLeaveGame(gameId) {
    return leaveGame(this.token, gameId, (m, e) => this.logger(m, e));
  }

  async apiJoinPlanet(planetId) {
    return joinPlanet(this.token, planetId, (m, e) => this.logger(m, e));
  }

  async apiJoinZone(zoneId) {
    return joinZone(this.token, zoneId, (m, e) => this.logger(m, e));
  }

  async apiReportScore(score) {
    return reportScore(this.token, score, (m, e) => this.logger(m, e));
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
      message += `we want to be on ${chalk.yellow(requestedPlanetId)}`;

      this.logger(message);

      await this.apiLeaveGame(activePlanet);
    }

    return activePlanet;
  }

  // TODO
  async doClanSetup() {
    this.logger('doClanSetup - unimplemented');
  }

  async doGameSetup() {
    const planets = await this.apiGetPlanets();

    this.knownPlanets = await getAllPlanetStates(planets, this.cutoff, (m, e) => this.logger(m, e));
    this.currentPlanetAndZone = await getBestPlanetAndZone(this.knownPlanets, (m, e) => this.logger(m, e));

    const zoneCapturePercent = getPercentage(this.currentPlanetAndZone.bestZone.capture_progress);

    let zoneMsg = `>> Selected Zone ${chalk.green(`${this.currentPlanetAndZone.bestZone.zone_position}`.padStart(3))}`;
    zoneMsg += ` on Planet ${chalk.green(`${this.currentPlanetAndZone.id}`.padStart(3))}`;
    zoneMsg += ` (Captured: ${chalk.yellow(`${zoneCapturePercent}%`.padStart(6))}`;
    zoneMsg += ` - Difficulty: ${chalk.yellow(getZoneDifficultyName(this.currentPlanetAndZone.bestZone))})`;

    this.logger(zoneMsg);
  }

  async doGameLoop() {
    while (this.currentPlanetAndZone.id !== this.steamThinksPlanet) {
      this.steamThinksPlanet = await this.leaveCurrentGame(this.currentPlanetAndZone);

      if (this.currentPlanetAndZone.id !== this.steamThinksPlanet) {
        this.apiJoinPlanet(this.currentPlanetAndZone.id);

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

    let joinMsg = `>> Joined Zone ${chalk.green(`${zoneInfo.zone_position}`.padStart(3))}`;
    joinMsg += ` on Planet ${chalk.green(`${this.currentPlanetAndZone.id}`.padStart(3))}`;
    joinMsg += ` (Captured: ${chalk.yellow(`${zoneCapturePercent}%`.padStart(6))}`;
    joinMsg += ` - Difficulty: ${chalk.yellow(getZoneDifficultyName(this.currentPlanetAndZone.bestZone))})`;

    this.logger(joinMsg);

    if (zoneInfo.top_clans) {
      this.logger(`-- Top Clans:${zoneInfo.top_clans.map(({ name }) => ` ${name}`)}`);
    }

    console.log(''); // eslint-disable-line no-console
    this.logger(`${chalk.bgMagenta(` Waiting ${this.gameWaitTimeSec} seconds for round to finish... `)}`);

    // TODO at about 100 out of 110 seconds we need to call for planets which will set the this variables
    // and then the loop will kick off with the next best fresh zone every time...

    await delay(this.gameWaitTimeSec * 1000);

    const score = await this.apiReportScore(getScoreForZone(zoneInfo));

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
      const levelEta = `${hoursRemaining}h ${minutesRemaining === 0 ? 2 : minutesRemaining}m`;

      let nextLevelMsg = `>> Next Level: ${chalk.yellow(nextLevelScore.toLocaleString())} XP`;
      nextLevelMsg += ` - Remaining: ${chalk.yellow(remainingXp.toLocaleString())} XP`;
      nextLevelMsg += ` - ETA: ${chalk.green(levelEta)}\n`;

      this.logger(nextLevelMsg);
    }

    await this.doGameSetup();

    const leavingGame = await this.leaveCurrentGame(this.currentPlanetAndZone.id);

    if (leavingGame !== this.currentPlanetAndZone.id) {
      throw new SalienScriptRestart(`!! Wrong current Planet ${chalk.yellow(leavingGame)}`);
    }
  }

  async init() {
    this.startTime = new Date().getTime();

    this.logger(chalk.bgGreen(` Started SalienScript | Version: ${pkg.version} `));
    this.logger(chalk.bgCyan(' Thanks for choosing https://github.com/South-Paw/salien-script-js '));
    this.logger(chalk.bgCyan(' Remeber to drop us a star on the project if you appreciate this script! '));

    this.resetScript();

    try {
      await this.doClanSetup();

      await this.doGameSetup();

      // eslint-disable-next-line no-constant-condition
      while (true) {
        console.log(''); // eslint-disable-line no-console

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
