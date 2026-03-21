import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

const { getSessionMock } = vi.hoisted(() => ({
  getSessionMock: vi.fn(),
}));

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    auth: {
      getSession: getSessionMock,
    },
  },
}));

import { api } from './api';

describe('stash api methods', () => {
  beforeEach(() => {
    vi.stubEnv('VITE_SUPABASE_PROJECT_ID', 'project-id');
    getSessionMock.mockResolvedValue({ data: { session: { access_token: 'token-123' } } });
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllEnvs();
  });

  test('starts a stash scan and returns scan metadata', async () => {
    const fetchMock = vi.fn(async () => ({
      ok: true,
      status: 202,
      json: async () => ({
        scanId: 'scan-2',
        status: 'running',
        startedAt: '2026-03-21T12:01:00Z',
        accountName: 'qa-exile',
        league: 'Mirage',
        realm: 'pc',
      }),
    }) as Response);
    vi.stubGlobal('fetch', fetchMock);

    const result = await api.startStashScan();

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(result.scanId).toBe('scan-2');
    expect(result.accountName).toBe('qa-exile');
  });

  test('fetches stash scan status and item history', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          status: 'running',
          activeScanId: 'scan-2',
          publishedScanId: 'scan-1',
          startedAt: '2026-03-21T12:01:00Z',
          updatedAt: '2026-03-21T12:02:00Z',
          publishedAt: null,
          progress: {
            tabsTotal: 8,
            tabsProcessed: 3,
            itemsTotal: 120,
            itemsProcessed: 44,
          },
          error: null,
        }),
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          fingerprint: 'sig:item-1',
          item: {
            name: 'Grim Bane',
            itemClass: 'Helmet',
            rarity: 'rare',
            iconUrl: 'https://web.poecdn.com/item.png',
          },
          history: [
            {
              scanId: 'scan-2',
              pricedAt: '2026-03-21T12:00:00Z',
              predictedValue: 45,
              listedPrice: 40,
              currency: 'chaos',
              confidence: 82,
              interval: { p10: 39, p90: 51 },
              priceRecommendationEligible: true,
              estimateTrust: 'normal',
              estimateWarning: '',
              fallbackReason: '',
            },
          ],
        }),
      } as Response);
    vi.stubGlobal('fetch', fetchMock);

    const status = await api.getStashScanStatus();
    const history = await api.getStashItemHistory('sig:item-1');

    expect(status.activeScanId).toBe('scan-2');
    expect(status.progress.itemsProcessed).toBe(44);
    expect(history.item.name).toBe('Grim Bane');
    expect(history.history[0].interval.p10).toBe(39);
  });
});
