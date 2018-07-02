const fetch = require('node-fetch');

const api = require('./index');

// Steam Web API EResult reference: https://raw.githubusercontent.com/SteamRE/SteamKit/master/Resources/SteamLanguage/eresult.steamd
const headersEmpty = new Map();
const headersSuccess = new Map([['x-eresult', '1']]);
const headersBusy = new Map([['x-eresult', '10']]);
const headersInvalidState = new Map([['x-eresult', '11'], ['x-error_message', 'Invalid state']]);
jest.mock('node-fetch');

const token = 'token';

describe('api', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getPlayerInfo()', () => {
    it('returns a response', async () => {
      const mockLogger = jest.fn();
      fetch.mockResolvedValue({ headers: headersSuccess, json: async () => ({ response: { a: 1 } }) });

      const response = await api.getPlayerInfo(token, mockLogger, true, 1, 0);

      expect(response.a).toBe(1);
    });

    it('throws an exception when the response is empty', async () => {
      const mockLogger = jest.fn();
      fetch.mockResolvedValue({ headers: headersEmpty });

      try {
        await api.getPlayerInfo(token, mockLogger, true, 1, 0);
      } catch (e) {
        expect(e.message).toBe('Failed to send ITerritoryControlMinigameService/GetPlayerInfo/v0001 after 1 attempts');
      }
    });

    it('tries again when the API is busy', async () => {
      const mockLogger = jest.fn();
      fetch
        .mockResolvedValue({ headers: headersSuccess, json: async () => ({ response: { a: 1 } }) })
        .mockResolvedValueOnce({ headers: headersBusy });

      const response = await api.getPlayerInfo(token, mockLogger, true, 2, 0);

      expect(response.a).toBe(1);
      expect(fetch.mock.calls.length).toBe(2);
    });

    it('logs any error message returned by the API', async () => {
      const mockLogger = jest.fn();
      fetch.mockResolvedValue({ headers: headersInvalidState });

      try {
        await api.getPlayerInfo(token, mockLogger, true, 1, 0);
      } catch (e) {
        expect(e.message).toBe('Failed to send ITerritoryControlMinigameService/GetPlayerInfo/v0001 after 1 attempts');
      }
      expect(mockLogger).toBeCalledWith(expect.stringContaining('Invalid state'));
    });

    it('logs the API call', async () => {
      const mockLogger = jest.fn();
      fetch.mockResolvedValue({ headers: headersSuccess, json: async () => ({ response: { a: 1 } }) });

      const response = await api.getPlayerInfo(token, mockLogger, false, 1, 0);

      expect(response.a).toBe(1);
      expect(mockLogger).toBeCalledWith(
        expect.stringContaining('Sending ITerritoryControlMinigameService/GetPlayerInfo/v0001...'),
      );
    });
  });

  describe('getPlanets()', () => {
    it('returns a response', async () => {
      const mockLogger = jest.fn();
      fetch.mockResolvedValue({ headers: headersSuccess, json: async () => ({ response: { planets: [1, 2] } }) });

      const response = await api.getPlanets(mockLogger, true, 1, 0);

      expect(response.length).toBe(2);
    });

    it('throws an exception when the response is empty', async () => {
      const mockLogger = jest.fn();
      fetch.mockResolvedValue({ headers: headersEmpty });

      try {
        await api.getPlanets(mockLogger, true, 1, 0);
      } catch (e) {
        expect(e.message).toBe('Failed to send ITerritoryControlMinigameService/GetPlanets/v0001 after 1 attempts');
      }
    });

    it('tries again when the API is busy', async () => {
      const mockLogger = jest.fn();
      fetch
        .mockResolvedValue({ headers: headersSuccess, json: async () => ({ response: { planets: [1, 2] } }) })
        .mockResolvedValueOnce({ headers: headersBusy });

      const response = await api.getPlanets(mockLogger, true, 2, 0);

      expect(response.length).toBe(2);
      expect(fetch.mock.calls.length).toBe(2);
    });

    it('logs any error message returned by the API', async () => {
      const mockLogger = jest.fn();
      fetch.mockResolvedValue({ headers: headersInvalidState });

      try {
        await api.getPlanets(mockLogger, true, 1, 0);
      } catch (e) {
        expect(e.message).toBe('Failed to send ITerritoryControlMinigameService/GetPlanets/v0001 after 1 attempts');
      }
      expect(mockLogger).toBeCalledWith(expect.stringContaining('Invalid state'));
    });

    it('logs the API call', async () => {
      const mockLogger = jest.fn();
      fetch.mockResolvedValue({ headers: headersSuccess, json: async () => ({ response: { planets: [1, 2] } }) });

      const response = await api.getPlanets(mockLogger, false, 1, 0);

      expect(response.length).toBe(2);
      expect(mockLogger).toBeCalledWith(
        expect.stringContaining('Sending ITerritoryControlMinigameService/GetPlanets/v0001...'),
      );
    });
  });

  describe('getPlanet()', () => {
    const planetId = 1234;

    it('returns a response', async () => {
      const mockLogger = jest.fn();
      fetch.mockResolvedValue({ headers: headersSuccess, json: async () => ({ response: { planets: [1] } }) });

      const response = await api.getPlanet(planetId, mockLogger, true, 1, 0);

      expect(response).toBe(1);
    });

    it('throws an exception when the response is empty', async () => {
      const mockLogger = jest.fn();
      fetch.mockResolvedValue({ headers: headersEmpty });

      try {
        await api.getPlanet(planetId, mockLogger, true, 1, 0);
      } catch (e) {
        expect(e.message).toBe('Failed to send ITerritoryControlMinigameService/GetPlanet/v0001 after 1 attempts');
      }
    });

    it('tries again when the API is busy', async () => {
      const mockLogger = jest.fn();
      fetch
        .mockResolvedValue({ headers: headersSuccess, json: async () => ({ response: { planets: [1] } }) })
        .mockResolvedValueOnce({ headers: headersBusy });

      const response = await api.getPlanet(planetId, mockLogger, true, 2, 0);

      expect(response).toBe(1);
      expect(fetch.mock.calls.length).toBe(2);
    });

    it('logs any error message returned by the API', async () => {
      const mockLogger = jest.fn();
      fetch.mockResolvedValue({ headers: headersInvalidState });

      try {
        await api.getPlanet(planetId, mockLogger, true, 1, 0);
      } catch (e) {
        expect(e.message).toBe('Failed to send ITerritoryControlMinigameService/GetPlanet/v0001 after 1 attempts');
      }
      expect(mockLogger).toBeCalledWith(expect.stringContaining('Invalid state'));
    });

    it('logs the API call', async () => {
      const mockLogger = jest.fn();
      fetch.mockResolvedValue({ headers: headersSuccess, json: async () => ({ response: { planets: [1] } }) });

      const response = await api.getPlanet(planetId, mockLogger, false, 1, 0);

      expect(response).toBe(1);
      expect(mockLogger).toBeCalledWith(
        expect.stringContaining('Sending ITerritoryControlMinigameService/GetPlanet/v0001...'),
      );
    });
  });

  describe('representClan()', () => {
    const clanId = 1234;

    it('returns a response', async () => {
      const mockLogger = jest.fn();
      fetch.mockResolvedValue({ headers: headersSuccess, json: async () => ({ response: { a: 1 } }) });

      const response = await api.representClan(token, clanId, mockLogger, true, 1, 0);

      expect(response.a).toBe(1);
    });

    it('throws an exception when the response is empty', async () => {
      const mockLogger = jest.fn();
      fetch.mockResolvedValue({ headers: headersEmpty });

      try {
        await api.representClan(token, clanId, mockLogger, true, 1, 0);
      } catch (e) {
        expect(e.message).toBe('Failed to send ITerritoryControlMinigameService/RepresentClan/v0001 after 1 attempts');
      }
    });

    it('tries again when the API is busy', async () => {
      const mockLogger = jest.fn();
      fetch
        .mockResolvedValue({ headers: headersSuccess, json: async () => ({ response: { a: 1 } }) })
        .mockResolvedValueOnce({ headers: headersBusy });

      const response = await api.representClan(token, clanId, mockLogger, true, 2, 0);

      expect(response.a).toBe(1);
      expect(fetch.mock.calls.length).toBe(2);
    });

    it('logs any error message returned by the API', async () => {
      const mockLogger = jest.fn();
      fetch.mockResolvedValue({ headers: headersInvalidState });

      try {
        await api.representClan(token, clanId, mockLogger, true, 1, 0);
      } catch (e) {
        expect(e.message).toBe('Failed to send ITerritoryControlMinigameService/RepresentClan/v0001 after 1 attempts');
      }
      expect(mockLogger).toBeCalledWith(expect.stringContaining('Invalid state'));
    });

    it('logs the API call', async () => {
      const mockLogger = jest.fn();
      fetch.mockResolvedValue({ headers: headersSuccess, json: async () => ({ response: { a: 1 } }) });

      const response = await api.representClan(token, clanId, mockLogger, false, 1, 0);

      expect(response.a).toBe(1);
      expect(mockLogger).toBeCalledWith(
        expect.stringContaining('Sending ITerritoryControlMinigameService/RepresentClan/v0001...'),
      );
    });
  });

  describe('leaveGame()', () => {
    const gameId = 1234;

    it('returns a response', async () => {
      const mockLogger = jest.fn();
      fetch.mockResolvedValue({ headers: headersSuccess, json: async () => ({ response: { a: 1 } }) });

      const response = await api.leaveGame(token, gameId, mockLogger, true, 1, 0);

      expect(response.a).toBe(1);
    });

    it('throws an exception when the response is empty', async () => {
      const mockLogger = jest.fn();
      fetch.mockResolvedValue({ headers: headersEmpty });

      try {
        await api.leaveGame(token, gameId, mockLogger, true, 1, 0);
      } catch (e) {
        expect(e.message).toBe('Failed to send IMiniGameService/LeaveGame/v0001 after 1 attempts');
      }
    });

    it('tries again when the API is busy', async () => {
      const mockLogger = jest.fn();
      fetch
        .mockResolvedValue({ headers: headersSuccess, json: async () => ({ response: { a: 1 } }) })
        .mockResolvedValueOnce({ headers: headersBusy });

      const response = await api.leaveGame(token, gameId, mockLogger, true, 2, 0);

      expect(response.a).toBe(1);
      expect(fetch.mock.calls.length).toBe(2);
    });

    it('logs any error message returned by the API', async () => {
      const mockLogger = jest.fn();
      fetch.mockResolvedValue({ headers: headersInvalidState });

      try {
        await api.leaveGame(token, gameId, mockLogger, true, 1, 0);
      } catch (e) {
        expect(e.message).toBe('Failed to send IMiniGameService/LeaveGame/v0001 after 1 attempts');
      }
      expect(mockLogger).toBeCalledWith(expect.stringContaining('Invalid state'));
    });

    it('logs the API call', async () => {
      const mockLogger = jest.fn();
      fetch.mockResolvedValue({ headers: headersSuccess, json: async () => ({ response: { a: 1 } }) });

      const response = await api.leaveGame(token, gameId, mockLogger, false, 1, 0);

      expect(response.a).toBe(1);
      expect(mockLogger).toBeCalledWith(expect.stringContaining('Sending IMiniGameService/LeaveGame/v0001...'));
    });
  });

  describe('joinPlanet()', () => {
    const planetId = 1234;

    it('returns a response', async () => {
      const mockLogger = jest.fn();
      fetch.mockResolvedValue({ headers: headersSuccess, json: async () => ({ response: { a: 1 } }) });

      const response = await api.joinPlanet(token, planetId, mockLogger, true, 1, 0);

      expect(response.a).toBe(1);
    });

    it('throws an exception when the response is empty', async () => {
      const mockLogger = jest.fn();
      fetch.mockResolvedValue({ headers: headersEmpty });

      try {
        await api.joinPlanet(token, planetId, mockLogger, true, 1, 0);
      } catch (e) {
        expect(e.message).toBe('Failed to send ITerritoryControlMinigameService/JoinPlanet/v0001 after 1 attempts');
      }
    });

    it('tries again when the API is busy', async () => {
      const mockLogger = jest.fn();
      fetch
        .mockResolvedValue({ headers: headersSuccess, json: async () => ({ response: { a: 1 } }) })
        .mockResolvedValueOnce({ headers: headersBusy });

      const response = await api.joinPlanet(token, planetId, mockLogger, true, 2, 0);

      expect(response.a).toBe(1);
      expect(fetch.mock.calls.length).toBe(2);
    });

    it('logs any error message returned by the API', async () => {
      const mockLogger = jest.fn();
      fetch.mockResolvedValue({ headers: headersInvalidState });

      try {
        await api.joinPlanet(token, planetId, mockLogger, true, 1, 0);
      } catch (e) {
        expect(e.message).toBe('Failed to send ITerritoryControlMinigameService/JoinPlanet/v0001 after 1 attempts');
      }
      expect(mockLogger).toBeCalledWith(expect.stringContaining('Invalid state'));
    });

    it('logs the API call', async () => {
      const mockLogger = jest.fn();
      fetch.mockResolvedValue({ headers: headersSuccess, json: async () => ({ response: { a: 1 } }) });

      const response = await api.joinPlanet(token, planetId, mockLogger, false, 1, 0);

      expect(response.a).toBe(1);
      expect(mockLogger).toBeCalledWith(
        expect.stringContaining('Sending ITerritoryControlMinigameService/JoinPlanet/v0001...'),
      );
    });
  });

  describe('joinZone()', () => {
    const zoneId = 1234;

    it('returns a response', async () => {
      const mockLogger = jest.fn();
      fetch.mockResolvedValue({ headers: headersSuccess, json: async () => ({ response: { a: 1 } }) });

      const response = await api.joinZone(token, zoneId, mockLogger, true, 1, 0);

      expect(response.a).toBe(1);
    });

    it('throws an exception when the response is empty', async () => {
      const mockLogger = jest.fn();
      fetch.mockResolvedValue({ headers: headersEmpty });

      try {
        await api.joinZone(token, zoneId, mockLogger, true, 1, 0);
      } catch (e) {
        expect(e.message).toBe('Failed to send ITerritoryControlMinigameService/JoinZone/v0001 after 1 attempts');
      }
    });

    it('tries again when the API is busy', async () => {
      const mockLogger = jest.fn();
      fetch
        .mockResolvedValue({ headers: headersSuccess, json: async () => ({ response: { a: 1 } }) })
        .mockResolvedValueOnce({ headers: headersBusy });

      const response = await api.joinZone(token, zoneId, mockLogger, true, 2, 0);

      expect(response.a).toBe(1);
      expect(fetch.mock.calls.length).toBe(2);
    });

    it('logs any error message returned by the API', async () => {
      const mockLogger = jest.fn();
      fetch.mockResolvedValue({ headers: headersInvalidState });

      try {
        await api.joinZone(token, zoneId, mockLogger, true, 1, 0);
      } catch (e) {
        expect(e.message).toBe('Failed to send ITerritoryControlMinigameService/JoinZone/v0001 after 1 attempts');
      }
      expect(mockLogger).toBeCalledWith(expect.stringContaining('Invalid state'));
    });

    it('logs the API call', async () => {
      const mockLogger = jest.fn();
      fetch.mockResolvedValue({ headers: headersSuccess, json: async () => ({ response: { a: 1 } }) });

      const response = await api.joinZone(token, zoneId, mockLogger, false, 1, 0);

      expect(response.a).toBe(1);
      expect(mockLogger).toBeCalledWith(
        expect.stringContaining('Sending ITerritoryControlMinigameService/JoinZone/v0001...'),
      );
    });
  });

  describe('joinBossZone()', () => {
    const zoneId = 1234;

    it('returns a response', async () => {
      const mockLogger = jest.fn();
      fetch.mockResolvedValue({ headers: headersSuccess, json: async () => ({ response: { a: 1 } }) });

      const response = await api.joinBossZone(token, zoneId, mockLogger, true, 1, 0);

      expect(response.a).toBe(1);
    });

    it('throws an exception when the response is empty', async () => {
      const mockLogger = jest.fn();
      fetch.mockResolvedValue({ headers: headersEmpty });

      try {
        await api.joinBossZone(token, zoneId, mockLogger, true, 1, 0);
      } catch (e) {
        expect(e.message).toBe('Failed to send ITerritoryControlMinigameService/JoinBossZone/v0001 after 1 attempts');
      }
    });

    it('tries again when the API is busy', async () => {
      const mockLogger = jest.fn();
      fetch
        .mockResolvedValue({ headers: headersSuccess, json: async () => ({ response: { a: 1 } }) })
        .mockResolvedValueOnce({ headers: headersBusy });

      const response = await api.joinBossZone(token, zoneId, mockLogger, true, 2, 0);

      expect(response.a).toBe(1);
      expect(fetch.mock.calls.length).toBe(2);
    });

    it('logs any error message returned by the API', async () => {
      const mockLogger = jest.fn();
      fetch.mockResolvedValue({ headers: headersInvalidState });

      try {
        await api.joinBossZone(token, zoneId, mockLogger, true, 1, 0);
      } catch (e) {
        expect(e.message).toBe('Failed to send ITerritoryControlMinigameService/JoinBossZone/v0001 after 1 attempts');
      }
      expect(mockLogger).toBeCalledWith(expect.stringContaining('Invalid state'));
    });

    it('logs the API call', async () => {
      const mockLogger = jest.fn();
      fetch.mockResolvedValue({ headers: headersSuccess, json: async () => ({ response: { a: 1 } }) });

      const response = await api.joinBossZone(token, zoneId, mockLogger, false, 1, 0);

      expect(response.a).toBe(1);
      expect(mockLogger).toBeCalledWith(
        expect.stringContaining('Sending ITerritoryControlMinigameService/JoinBossZone/v0001...'),
      );
    });
  });

  describe('reportBossDamage()', () => {
    const useHeal = false;
    const damageToBoss = 1;
    const damageTaken = 234;

    it('returns a response', async () => {
      const mockLogger = jest.fn();
      fetch.mockResolvedValue({ headers: headersSuccess, json: async () => ({ response: { a: 1 } }) });

      const response = await api.reportBossDamage(token, useHeal, damageToBoss, damageTaken, mockLogger, true, 1, 0);

      expect(response.a).toBe(1);
    });

    it('throws an exception when the response is empty', async () => {
      const mockLogger = jest.fn();
      fetch.mockResolvedValue({ headers: headersEmpty });

      try {
        await api.reportBossDamage(token, useHeal, damageToBoss, damageTaken, mockLogger, true, 1, 0);
      } catch (e) {
        expect(e.message).toBe(
          'Failed to send ITerritoryControlMinigameService/ReportBossDamage/v0001 after 1 attempts',
        );
      }
    });

    it('tries again when the API is busy', async () => {
      const mockLogger = jest.fn();
      fetch
        .mockResolvedValue({ headers: headersSuccess, json: async () => ({ response: { a: 1 } }) })
        .mockResolvedValueOnce({ headers: headersBusy });

      const response = await api.reportBossDamage(token, useHeal, damageToBoss, damageTaken, mockLogger, true, 2, 0);

      expect(response.a).toBe(1);
      expect(fetch.mock.calls.length).toBe(2);
    });

    it('logs any error message returned by the API', async () => {
      const mockLogger = jest.fn();
      fetch.mockResolvedValue({ headers: headersInvalidState });

      try {
        await api.reportBossDamage(token, useHeal, damageToBoss, damageTaken, mockLogger, true, 1, 0);
      } catch (e) {
        expect(e.message).toBe(
          'Failed to send ITerritoryControlMinigameService/ReportBossDamage/v0001 after 1 attempts',
        );
      }
      expect(mockLogger).toBeCalledWith(expect.stringContaining('Invalid state'));
    });

    it('logs the API call', async () => {
      const mockLogger = jest.fn();
      fetch.mockResolvedValue({ headers: headersSuccess, json: async () => ({ response: { a: 1 } }) });

      const response = await api.reportBossDamage(token, useHeal, damageToBoss, damageTaken, mockLogger, false, 1, 0);

      expect(response.a).toBe(1);
      expect(mockLogger).toBeCalledWith(
        expect.stringContaining('Sending ITerritoryControlMinigameService/ReportBossDamage/v0001...'),
      );
    });
  });

  describe('reportScore()', () => {
    const score = 1234;

    it('returns a response', async () => {
      const mockLogger = jest.fn();
      fetch.mockResolvedValue({ headers: headersSuccess, json: async () => ({ response: { a: 1 } }) });

      const response = await api.reportScore(token, score, mockLogger, true, 1, 0);

      expect(response.a).toBe(1);
    });

    it('throws an exception when the response is empty', async () => {
      const mockLogger = jest.fn();
      fetch.mockResolvedValue({ headers: headersEmpty });

      try {
        await api.reportScore(token, score, mockLogger, true, 1, 0);
      } catch (e) {
        expect(e.message).toBe('Failed to send ITerritoryControlMinigameService/ReportScore/v0001 after 1 attempts');
      }
    });

    it('tries again when the API is busy', async () => {
      const mockLogger = jest.fn();
      fetch
        .mockResolvedValue({ headers: headersSuccess, json: async () => ({ response: { a: 1 } }) })
        .mockResolvedValueOnce({ headers: headersBusy });

      const response = await api.reportScore(token, score, mockLogger, true, 2, 0);

      expect(response.a).toBe(1);
      expect(fetch.mock.calls.length).toBe(2);
    });

    it('logs any error message returned by the API', async () => {
      const mockLogger = jest.fn();
      fetch.mockResolvedValue({ headers: headersInvalidState });

      try {
        await api.reportScore(token, score, mockLogger, true, 1, 0);
      } catch (e) {
        expect(e.message).toBe('Failed to send ITerritoryControlMinigameService/ReportScore/v0001 after 1 attempts');
      }
      expect(mockLogger).toBeCalledWith(expect.stringContaining('Invalid state'));
    });

    it('logs the API call', async () => {
      const mockLogger = jest.fn();
      fetch.mockResolvedValue({ headers: headersSuccess, json: async () => ({ response: { a: 1 } }) });

      const response = await api.reportScore(token, score, mockLogger, false, 1, 0);

      expect(response.a).toBe(1);
      expect(mockLogger).toBeCalledWith(
        expect.stringContaining('Sending ITerritoryControlMinigameService/ReportScore/v0001...'),
      );
    });
  });
});
