const chalk = require('chalk');
const delay = require('delay');
const fetch = require('node-fetch');

const { SalienScriptException } = require('../exceptions');

const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 3000;

const doFetch = async (method, params, requestOptions = {}, logger, isSilentRequest, maxRetries, retryDelayMs) => {
  let url = `https://community.steam-api.com/${method}`;

  if (params) {
    url += '/?';

    params.forEach(param => {
      url += `${param}&`;
    });

    url = url.substring(0, url.length - 1);
  }

  const options = {
    headers: {
      Accept: '*/*',
      Origin: 'https://steamcommunity.com',
      Referer: 'https://steamcommunity.com/saliengame/play/',
      'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/67.0.3396.87 Safari/537.36',
    },
    ...requestOptions,
  };

  let request = null;
  let response = null;
  let attempts = 0;

  while (!response && attempts < maxRetries) {
    try {
      if (!isSilentRequest) {
        logger(chalk.blue(`Sending ${method}...`));
      }

      request = await fetch(url, options);
      response = await request.json();
    } catch (e) {
      logger(`${chalk.bgRed(`${e.name}:`)} ${chalk.red(`For ${method}`)}`, e);

      attempts += 1;

      if (attempts < maxRetries) {
        logger(`Retrying ${method} in ${retryDelayMs / 1000} seconds...`);
      } else {
        throw new SalienScriptException(`Failed to send ${method} after ${attempts} attempts`);
      }

      await delay(retryDelayMs);
    }
  }

  return response.response;
};

const getPlayerInfo = async (token, logger, silent, maxRetries = MAX_RETRIES, retryDelayMs = RETRY_DELAY_MS) => {
  const method = 'ITerritoryControlMinigameService/GetPlayerInfo/v0001';
  const params = [`access_token=${token}`];
  const options = { method: 'POST' };

  const response = await doFetch(method, params, options, logger, silent, maxRetries, retryDelayMs);

  return response;
};

const getPlanets = async (logger, silent, maxRetries = MAX_RETRIES, retryDelayMs = RETRY_DELAY_MS) => {
  const method = 'ITerritoryControlMinigameService/GetPlanets/v0001';
  const params = ['active_only=1'];
  const options = {};

  const response = await doFetch(method, params, options, logger, silent, maxRetries, retryDelayMs);

  return response.planets;
};

const getPlanet = async (planetId, logger, silent, maxRetries = MAX_RETRIES, retryDelayMs = RETRY_DELAY_MS) => {
  const method = 'ITerritoryControlMinigameService/GetPlanet/v0001';
  const params = [`id=${planetId}`, `language=english`];
  const options = {};

  const response = await doFetch(method, params, options, logger, silent, maxRetries, retryDelayMs);

  return response.planets[0];
};

const representClan = async (
  token,
  clanId,
  logger,
  silent,
  maxRetries = MAX_RETRIES,
  retryDelayMs = RETRY_DELAY_MS,
) => {
  const method = 'ITerritoryControlMinigameService/RepresentClan/v0001';
  const params = [`access_token=${token}`, `clanid=${clanId}`];
  const options = { method: 'POST' };

  const response = await doFetch(method, params, options, logger, silent, maxRetries, retryDelayMs);

  return response;
};

const leaveGame = async (token, gameId, logger, silent, maxRetries = MAX_RETRIES, retryDelayMs = RETRY_DELAY_MS) => {
  const method = 'IMiniGameService/LeaveGame/v0001';
  const params = [`access_token=${token}`, `gameid=${gameId}`];
  const options = { method: 'POST' };

  const response = await doFetch(method, params, options, logger, silent, maxRetries, retryDelayMs);

  return response;
};

const joinPlanet = async (token, planetId, logger, silent, maxRetries = MAX_RETRIES, retryDelayMs = RETRY_DELAY_MS) => {
  const method = 'ITerritoryControlMinigameService/JoinPlanet/v0001';
  const params = [`access_token=${token}`, `id=${planetId}`];
  const options = { method: 'POST' };

  const response = await doFetch(method, params, options, logger, silent, maxRetries, retryDelayMs);

  return response;
};

const joinZone = async (token, zoneId, logger, silent, maxRetries = MAX_RETRIES, retryDelayMs = RETRY_DELAY_MS) => {
  const method = 'ITerritoryControlMinigameService/JoinZone/v0001';
  const params = [`access_token=${token}`, `zone_position=${zoneId}`];
  const options = { method: 'POST' };

  const response = await doFetch(method, params, options, logger, silent, maxRetries, retryDelayMs);

  return response;
};

const reportScore = async (token, score, logger, silent, maxRetries = MAX_RETRIES, retryDelayMs = RETRY_DELAY_MS) => {
  const method = 'ITerritoryControlMinigameService/ReportScore/v0001';
  const params = [`access_token=${token}`, `score=${score}`, `language=english`];
  const options = { method: 'POST' };

  const response = await doFetch(method, params, options, logger, silent, maxRetries, retryDelayMs);

  return response;
};

module.exports = {
  doFetch,
  getPlayerInfo,
  getPlanets,
  getPlanet,
  representClan,
  leaveGame,
  joinPlanet,
  joinZone,
  reportScore,
};
