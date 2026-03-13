import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { api } from '@/services/api';
import type { StashTab, StashItem } from '@/types/api';
import { cn } from '@/lib/utils';

const GRID = 12;

export default function StashViewerTab() {
  const [tabs, setTabs] = useState<StashTab[]>([]);
  const [activeTab, setActiveTab] = useState(0);
  useEffect(() => { api.getStashTabs().then(setTabs); }, []);

  const tab = tabs[activeTab];

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <h2 className="text-lg font-semibold font-sans text-foreground">Stash Viewer</h2>
        <div className="flex gap-1">
          {tabs.map((t, i) => (
            <button
              key={t.id}
              onClick={() => setActiveTab(i)}
              className={cn(
                'px-3 py-1 text-xs rounded border transition-colors',
                i === activeTab ? 'bg-primary text-primary-foreground border-primary' : 'bg-secondary text-muted-foreground border-border hover:text-foreground'
              )}
            >
              {t.name}
            </button>
          ))}
        </div>
      </div>

      {tab && (
        <Card>
          <CardContent className="p-4">
            <div
              className="grid gap-px bg-border/50 rounded overflow-hidden"
              style={{ gridTemplateColumns: `repeat(${GRID}, 1fr)`, gridTemplateRows: `repeat(${GRID}, 1fr)` }}
            >
              {/* Render empty cells */}
              {Array.from({ length: GRID * GRID }).map((_, i) => {
                const gx = i % GRID;
                const gy = Math.floor(i / GRID);
                const item = tab.items.find(it => gx >= it.x && gx < it.x + it.w && gy >= it.y && gy < it.y + it.h);

                // Only render occupied cell at item origin
                if (item && gx === item.x && gy === item.y) {
                  return (
                    <StashCell
                      key={item.id}
                      item={item}
                      style={{
                        gridColumn: `${item.x + 1} / span ${item.w}`,
                        gridRow: `${item.y + 1} / span ${item.h}`,
                      }}
                    />
                  );
                }
                // Skip cells occupied by multi-cell items (not origin)
                if (item && (gx !== item.x || gy !== item.y)) return null;

                return <div key={i} className="stash-cell bg-background/50 min-h-[40px]" />;
              })}
            </div>

            <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
              <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-success/30 border border-success/50" /> Well priced</span>
              <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-warning/30 border border-warning/50" /> Could be better</span>
              <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-destructive/30 border border-destructive/50" /> Mispriced</span>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function StashCell({ item, style }: { item: StashItem; style: React.CSSProperties }) {
  const healthColor = {
    good: 'bg-success/15 border-success/30 hover:bg-success/25',
    ok: 'bg-warning/15 border-warning/30 hover:bg-warning/25',
    bad: 'bg-destructive/15 border-destructive/30 hover:bg-destructive/25',
  };

  const rarityColor = {
    normal: 'text-muted-foreground',
    magic: 'text-info',
    rare: 'text-exalt',
    unique: 'text-chaos',
  };

  const delta = item.listedPrice ? item.estimatedValue - item.listedPrice : null;

  return (
    <div
      className={cn('stash-cell border flex-col p-1 cursor-pointer transition-colors min-h-[40px]', healthColor[item.priceHealth])}
      style={style}
      title={`${item.name}\nEst: ${item.estimatedValue} ${item.currency}\nListed: ${item.listedPrice ?? 'N/A'} ${item.currency}`}
    >
      <span className={cn('text-[10px] leading-tight text-center truncate w-full', rarityColor[item.rarity])}>{item.name}</span>
      <span className="text-[9px] font-mono text-gold-bright">{item.estimatedValue}{item.currency === 'div' ? 'd' : 'c'}</span>
      {item.listedPrice && (
        <span className={cn('text-[8px] font-mono', delta && delta > 0 ? 'text-destructive' : 'text-success')}>
          {item.listedPrice}{item.currency === 'div' ? 'd' : 'c'} listed
        </span>
      )}
    </div>
  );
}
