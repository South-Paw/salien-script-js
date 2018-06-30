const chalk = require('chalk');

const { getPlanet } = require('../api/index');
const { SalienScriptException } = require('../exceptions');
const { getPercentage } = require('../util');

const formatPlanetName = name =>
  name
    .replace('#TerritoryControl_Planet', '')
    .split('_')
    .join(' ');

const getZoneDifficultyName = ({ type, difficulty }) => {
  const boss = type === 4 ? 'BOSS - ' : '';
  let name = '';

  switch (difficulty) {
    /* eslint-disable prettier/prettier */
    case 3: name = 'Hard'; break;
    case 2: name = 'Medium'; break;
    case 1: name = 'Easy'; break;
    default: name = difficulty;
    /* eslint-enable prettier/prettier */
  }

  return `${boss}${name}`;
};

const getScoreForZone = ({ difficulty }) => {
  let score;

  switch (difficulty) {
    /* eslint-disable prettier/prettier */
    case 1: score = 5; break;
    case 2: score = 10; break;
    case 3: score = 20; break;
    // Set fallback score equal to high zone score to avoid uninitialized variable if new
    // zone difficulty is introduced (e.g., for boss zones)
    default: score = 20;
    /* eslint-enable prettier/prettier */
  }

  return score * 120;
};

const getAllPlanetStates = async (planets, completionCutoff, logger, isSilentRequest) => {
  if (!planets) {
    throw new SalienScriptException('No planets provided.');
  }

  if (!completionCutoff) {
    throw new SalienScriptException('No completion cut-off percent given.');
  }

  logger(`Scanning all planets for next best zone...`);

  const knownPlanets = new Map();

  try {
    // Patch the apiGetPlanets response with zones from apiGetPlanet
    const mappedPlanets = await Promise.all(
      planets.map(async planet => {
        const object = { ...planet };

        const currentPlanet = await getPlanet(planet.id, logger, isSilentRequest);

        object.zones = currentPlanet.zones;

        return object;
      }),
    );

    mappedPlanets.forEach(planet => {
      let numHardZones = 0;
      let numMediumZones = 0;
      let numEasyZones = 0;
      let numUnknownZones = 0;

      let cleanZones = [];
      const bossZones = [];

      planet.zones.forEach(zone => {
        const { capture_progress: captureProgress, captured, type, difficulty, gameid } = zone;

        // disregard this zone if there is no gameid, it's close to being captured or already captured
        if (!gameid || (captureProgress && captureProgress > completionCutoff) || captured || captureProgress === 0) {
          return;
        }

        // store that it's a boss zone
        if (type === 4) {
          bossZones.push(zone);
        } else if (type !== 3) {
          logger(chalk.red(`!! Unknown zone type found: ${type}`));
        }

        // count the difficulties of this planet's zones
        switch (difficulty) {
          /* eslint-disable prettier/prettier */
          case 3: numHardZones += 1; break;
          case 2: numMediumZones += 1; break;
          case 1: numEasyZones += 1; break;
          default: numUnknownZones += 1;
          /* eslint-enable prettier/prettier */
        }

        cleanZones.push(zone);
      });

      // if we have boss zones, use them over anything else
      if (bossZones.length > 0) {
        cleanZones = bossZones;
      }

      // sort the clean zones by most difficult and then by capture progress
      cleanZones.sort((a, b) => {
        if (b.difficulty === a.difficulty) {
          if (a.capture_progress * 100 !== b.capture_progress * 100) {
            return a.capture_progress * 100000 - b.capture_progress * 100000;
          }

          return b.zone_position - a.zone_position;
        }

        return b.difficulty - a.difficulty;
      });

      knownPlanets.set(planet.id, {
        numHardZones,
        numMediumZones,
        numEasyZones,
        numUnknownZones,
        bestZone: cleanZones[0],
        bossZones,
        ...planet,
      });

      const planetName = formatPlanetName(planet.state.name);
      const planetCapturePercent = getPercentage(planet.state.capture_progress);
      const planetCurrentPlayers = planet.state.current_players.toLocaleString();

      let planetInfo = `>> Planet ${chalk.green(`${planet.id}`.padStart(3))}`;
      planetInfo += ` (Captured: ${chalk.yellow(`${planetCapturePercent}%`.padStart(6))})`;
      planetInfo += ` - Hard: ${chalk.yellow(`${numHardZones}`.padStart(2))}`;
      planetInfo += ` - Medium: ${chalk.yellow(`${numMediumZones}`.padStart(2))}`;
      planetInfo += ` - Easy: ${chalk.yellow(`${numEasyZones}`.padStart(2))}`;
      planetInfo += ` - Players: ${chalk.yellow(`${planetCurrentPlayers}`.padStart(7))}`;
      planetInfo += ` (${chalk.green(planetName)})`;
      planetInfo += numUnknownZones
        ? `\n${chalk.yellow(`!! ${`${numUnknownZones}`.padStart(2)} unknown zones found in planet`)}`
        : '';
      planetInfo += bossZones.length > 0 ? `\n${chalk.yellow(`!! Boss zone detected`)}` : '';

      logger(planetInfo);
    });
  } catch (e) {
    throw e;
  }

  return knownPlanets;
};

const getBestPlanetAndZone = async (planets, logger) => {
  const planetsWithSortKeys = [];
  let foundBoss = false;
  let selectedPlanet = null;

  planets.forEach(planet => {
    if (foundBoss) {
      return;
    }

    if (planet.bestZone.type === 4) {
      logger(chalk.green(`>> Planet ${planet.id} has an uncaptured boss zone, selecting it`));
      foundBoss = true;
      selectedPlanet = planet;
      return;
    }

    let sortKey = 0;

    if (planet.numEasyZones > 0) {
      sortKey = 99 - planet.numEasyZones;
    }

    if (planet.numMediumZones > 0) {
      sortKey = 10 ** 2 * (99 - planet.numMediumZones);
    }

    if (planet.numHardZones > 0) {
      sortKey = 10 ** 4 * (99 - planet.numHardZones);
    }

    planetsWithSortKeys.push({ ...planet, sortKey });
  });

  // early return
  if (selectedPlanet) {
    return selectedPlanet;
  }

  return planetsWithSortKeys.sort((a, b) => b.sortKey - a.sortKey)[0];
};

module.exports = { getZoneDifficultyName, getScoreForZone, getAllPlanetStates, getBestPlanetAndZone };
