import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ConfidenceBadge, CurrencyValue } from '@/components/shared/StatusIndicators';
import { api } from '@/services/api';
import type { PriceCheckResponse } from '@/types/api';
import { Search } from 'lucide-react';

export default function PriceCheckTab() {
  const [text, setText] = useState('');
  const [result, setResult] = useState<PriceCheckResponse | null>(null);
  const [loading, setLoading] = useState(false);

  const check = async () => {
    if (!text.trim()) return;
    setLoading(true);
    const r = await api.priceCheck({ itemText: text });
    setResult(r);
    setLoading(false);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="space-y-3">
        <h2 className="text-lg font-semibold font-sans text-foreground">Price Check</h2>
        <p className="text-xs text-muted-foreground">Paste item text from PoE (Ctrl+C on item) and submit for price prediction.</p>
        <Textarea
          value={text}
          onChange={e => setText(e.target.value)}
          placeholder={`Rarity: Rare\nGrim Bane\nHubris Circlet\n--------\nQuality: +20%\n+2 to Level of Socketed Minion Gems\n+93 to maximum Life\n...`}
          className="min-h-[160px] font-mono text-xs"
        />
        <Button onClick={check} disabled={loading} className="gap-2 w-full sm:w-auto">
          <Search className="h-4 w-4" />
          {loading ? 'Checking...' : 'Price Check'}
        </Button>
      </div>

      {result && (
        <Card className="glow-gold">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-sans">Prediction</CardTitle>
              <ConfidenceBadge value={result.confidence} />
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center py-4">
              <p className="text-3xl font-mono text-gold-bright font-semibold">
                {result.predictedValue} <span className="text-lg text-muted-foreground">{result.currency}</span>
              </p>
            </div>

            <div>
              <p className="text-xs text-muted-foreground mb-2">Comparable Items</p>
              <div className="space-y-2">
                {result.comparables.map((c, i) => (
                  <div key={i} className="flex items-center justify-between bg-secondary/50 rounded p-2 text-xs">
                    <span className="text-foreground">{c.name}</span>
                    <CurrencyValue value={c.price} currency={c.currency} />
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
