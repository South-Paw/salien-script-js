const fetch = require('node-fetch');

const api = require('./index');

jest.mock('node-fetch');

const token = 'token';

describe('api', () => {
  describe('getPlayerInfo()', () => {
    it('returns a response', async () => {
      const mockLogger = jest.fn();
      fetch.mockResolvedValue({ json: async () => ({ response: { a: 1 } }) });

      const response = await api.getPlayerInfo(token, mockLogger, true, 1, 0);

      expect(response.a).toBe(1);
    });

    it('throws an exception when theres no json()', async () => {
      const mockLogger = jest.fn();
      fetch.mockResolvedValue({});

      try {
        await api.getPlayerInfo(token, mockLogger, true, 1, 0);
      } catch (e) {
        expect(e.message).toBe('Failed to send ITerritoryControlMinigameService/GetPlayerInfo/v0001 after 1 attempts');
      }
    });
  });

  describe('getPlanets()', () => {
    it('returns a response', async () => {
      const mockLogger = jest.fn();
      fetch.mockResolvedValue({ json: async () => ({ response: { planets: [1, 2] } }) });

      const response = await api.getPlanets(mockLogger, true, 1, 0);

      expect(response.length).toBe(2);
    });

    it('throws an exception when theres no json()', async () => {
      const mockLogger = jest.fn();
      fetch.mockResolvedValue({});

      try {
        await api.getPlanets(mockLogger, true, 1, 0);
      } catch (e) {
        expect(e.message).toBe('Failed to send ITerritoryControlMinigameService/GetPlanets/v0001 after 1 attempts');
      }
    });
  });

  describe('getPlanet()', () => {
    const planetId = 1234;

    it('returns a response', async () => {
      const mockLogger = jest.fn();
      fetch.mockResolvedValue({ json: async () => ({ response: { planets: [1] } }) });

      const response = await api.getPlanet(planetId, mockLogger, true, 1, 0);

      expect(response).toBe(1);
    });

    it('throws an exception when theres no json()', async () => {
      const mockLogger = jest.fn();
      fetch.mockResolvedValue({});

      try {
        await api.getPlanet(planetId, mockLogger, true, 1, 0);
      } catch (e) {
        expect(e.message).toBe('Failed to send ITerritoryControlMinigameService/GetPlanet/v0001 after 1 attempts');
      }
    });
  });

  describe('representClan()', () => {
    const clanId = 1234;

    it('returns a response', async () => {
      const mockLogger = jest.fn();
      fetch.mockResolvedValue({ json: async () => ({ response: { a: 1 } }) });

      const response = await api.representClan(token, clanId, mockLogger, true, 1, 0);

      expect(response.a).toBe(1);
    });

    it('throws an exception when theres no json()', async () => {
      const mockLogger = jest.fn();
      fetch.mockResolvedValue({});

      try {
        await api.representClan(token, clanId, mockLogger, true, 1, 0);
      } catch (e) {
        expect(e.message).toBe('Failed to send ITerritoryControlMinigameService/RepresentClan/v0001 after 1 attempts');
      }
    });
  });

  describe('leaveGame()', () => {
    const gameId = 1234;

    it('returns a response', async () => {
      const mockLogger = jest.fn();
      fetch.mockResolvedValue({ json: async () => ({ response: { a: 1 } }) });

      const response = await api.leaveGame(token, gameId, mockLogger, true, 1, 0);

      expect(response.a).toBe(1);
    });

    it('throws an exception when theres no json()', async () => {
      const mockLogger = jest.fn();
      fetch.mockResolvedValue({});

      try {
        await api.leaveGame(token, gameId, mockLogger, true, 1, 0);
      } catch (e) {
        expect(e.message).toBe('Failed to send IMiniGameService/LeaveGame/v0001 after 1 attempts');
      }
    });
  });

  describe('joinPlanet()', () => {
    const planetId = 1234;

    it('returns a response', async () => {
      const mockLogger = jest.fn();
      fetch.mockResolvedValue({ json: async () => ({ response: { a: 1 } }) });

      const response = await api.joinPlanet(token, planetId, mockLogger, true, 1, 0);

      expect(response.a).toBe(1);
    });

    it('throws an exception when theres no json()', async () => {
      const mockLogger = jest.fn();
      fetch.mockResolvedValue({});

      try {
        await api.joinPlanet(token, planetId, mockLogger, true, 1, 0);
      } catch (e) {
        expect(e.message).toBe('Failed to send ITerritoryControlMinigameService/JoinPlanet/v0001 after 1 attempts');
      }
    });
  });

  describe('joinZone()', () => {
    const zoneId = 1234;

    it('returns a response', async () => {
      const mockLogger = jest.fn();
      fetch.mockResolvedValue({ json: async () => ({ response: { a: 1 } }) });

      const response = await api.joinZone(token, zoneId, mockLogger, true, 1, 0);

      expect(response.a).toBe(1);
    });

    it('throws an exception when theres no json()', async () => {
      const mockLogger = jest.fn();
      fetch.mockResolvedValue({});

      try {
        await api.joinZone(token, zoneId, mockLogger, true, 1, 0);
      } catch (e) {
        expect(e.message).toBe('Failed to send ITerritoryControlMinigameService/JoinZone/v0001 after 1 attempts');
      }
    });
  });

  describe('reportScore()', () => {
    const score = 1234;

    it('returns a response', async () => {
      const mockLogger = jest.fn();
      fetch.mockResolvedValue({ json: async () => ({ response: { a: 1 } }) });

      const response = await api.reportScore(token, score, mockLogger, true, 1, 0);

      expect(response.a).toBe(1);
    });

    it('throws an exception when theres no json()', async () => {
      const mockLogger = jest.fn();
      fetch.mockResolvedValue({});

      try {
        await api.reportScore(token, score, mockLogger, true, 1, 0);
      } catch (e) {
        expect(e.message).toBe('Failed to send ITerritoryControlMinigameService/ReportScore/v0001 after 1 attempts');
      }
    });
  });
});
