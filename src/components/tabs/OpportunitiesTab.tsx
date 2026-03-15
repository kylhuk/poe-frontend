import { forwardRef, useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { RenderState } from '@/components/shared/RenderState';
import { api } from '@/services/api';
import type { ScannerRecommendation } from '@/types/api';
import { useMouseGlow } from '@/hooks/useMouseGlow';

const OpportunitiesTab = forwardRef<HTMLDivElement, Record<string, never>>(function OpportunitiesTab(_props, ref) {
  const [recommendations, setRecommendations] = useState<ScannerRecommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const mouseGlow = useMouseGlow();

  useEffect(() => {
    api.getScannerRecommendations()
      .then(recs => {
        setRecommendations(recs);
        setError(null);
      })
      .catch((err: unknown) => {
        setError(err instanceof Error ? err.message : 'Failed to load opportunities');
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  if (loading) {
    return <div ref={ref} data-testid="panel-opportunities-root"><RenderState kind="loading" message="Scanning market..." /></div>;
  }

  if (error) {
    return <div ref={ref} data-testid="panel-opportunities-root"><RenderState kind="degraded" message={error} /></div>;
  }

  return (
    <div ref={ref} className="space-y-6" data-testid="panel-opportunities-root">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold font-sans text-foreground">Market Opportunities</h2>
          <p className="text-xs text-muted-foreground">Scanner-backed recommendations based on current market data.</p>
        </div>
      </div>

      {recommendations.length === 0 ? (
        <RenderState kind="empty" message="No opportunities found in the latest scan." />
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {recommendations.map(r => (
            <Card key={`${r.scannerRunId}-${r.itemOrMarketKey}`} className="card-game" onMouseMove={mouseGlow}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-sans">{r.itemOrMarketKey}</CardTitle>
                  <span className="text-xs font-mono text-muted-foreground">{r.strategyId}</span>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-foreground">{r.whyItFired}</p>
                
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 bg-secondary/30 rounded p-3 border border-border">
                  <div>
                    <p className="text-xs text-muted-foreground">Buy Plan</p>
                    <p className="text-sm font-medium text-success">{r.buyPlan}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Transform</p>
                    <p className="text-sm font-medium text-foreground">{r.transformPlan}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Exit Plan</p>
                    <p className="text-sm font-medium text-foreground">{r.exitPlan}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Expected Profit</p>
                    <p className="text-sm font-medium text-warning">{r.expectedProfitChaos !== null ? `${r.expectedProfitChaos}c` : 'N/A'}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
});

OpportunitiesTab.displayName = 'OpportunitiesTab';
export default OpportunitiesTab;
