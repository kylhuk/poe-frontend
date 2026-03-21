import React, { forwardRef, useCallback, useEffect, useState } from 'react';
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { api } from '@/services/api';
import type {
  StashItem,
  StashItemHistoryResponse,
  StashScanStatus,
  StashStatus,
  StashTab,
  PriceEvaluation,
} from '@/types/api';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import {
  Coins, Diamond, CircleDot, FlaskConical, Sword, ShieldHalf,
  FileText, Shirt, HardHat, Crown, ChevronDown, Copy, Loader2, History, type LucideIcon,
} from 'lucide-react';
import { RenderState } from '@/components/shared/RenderState';

const ITEM_CLASS_ICONS: Record<string, LucideIcon> = {
  Currency: Coins, Gem: Diamond, Jewel: CircleDot, Flask: FlaskConical,
  Weapon: Sword, Shield: ShieldHalf, 'Body Armour': Shirt, Helmet: HardHat,
  Blueprint: FileText, Amulet: Crown, Belt: Crown,
};

const RARITY_COLOR: Record<string, string> = {
  normal: 'text-muted-foreground', magic: 'text-info', rare: 'text-exalt', unique: 'text-chaos',
};

const RARITY_GLOW: Record<string, string> = {
  normal: '', magic: 'drop-shadow-[0_0_4px_hsl(210,60%,50%,0.4)]',
  rare: 'drop-shadow-[0_0_4px_hsl(45,80%,60%,0.4)]', unique: 'drop-shadow-[0_0_6px_hsl(35,90%,55%,0.5)]',
};

const EVAL_BG: Record<PriceEvaluation, string> = {
  well_priced: 'bg-[hsl(140,60%,15%,0.3)]',
  could_be_better: 'bg-[hsl(35,80%,15%,0.3)]',
  mispriced: 'bg-[hsl(0,60%,15%,0.4)]',
};

const EVAL_LABEL: Record<PriceEvaluation, string> = {
  well_priced: 'Well Priced', could_be_better: 'Could Be Better', mispriced: 'Mispriced',
};

function getGridSize(type: StashTab['type']) {
  return type === 'quad' ? 24 : 12;
}

function renderEmptyCells(grid: number) {
  const cells: React.ReactNode[] = [];
  for (let row = 0; row < grid; row += 1) {
    for (let col = 0; col < grid; col += 1) {
      cells.push(
        <div
          key={`empty-${row}-${col}`}
          className="stash-empty-cell"
          style={{
            gridColumn: col + 1,
            gridRow: row + 1,
          }}
        />
      );
    }
  }
  return cells;
}

const API_SCHEMA = `{
  "scanId": "string | null",
  "publishedAt": "ISO-8601 | null",
  "isStale": false,
  "scanStatus": {
    "status": "idle | running | publishing | published | failed"
  },
  "stashTabs": []
}`;

const EMPTY_SCAN_STATUS: StashScanStatus = {
  status: 'idle',
  activeScanId: null,
  publishedScanId: null,
  startedAt: null,
  updatedAt: null,
  publishedAt: null,
  progress: { tabsTotal: 0, tabsProcessed: 0, itemsTotal: 0, itemsProcessed: 0 },
  error: null,
};

const StashViewerTab = forwardRef<HTMLDivElement, Record<string, never>>(function StashViewerTab(_props, ref) {
  const [tabs, setTabs] = useState<StashTab[]>([]);
  const [status, setStatus] = useState<StashStatus['status'] | 'loading' | 'degraded'>('loading');
  const [activeTab, setActiveTab] = useState(0);
  const [schemaOpen, setSchemaOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [publishedScanId, setPublishedScanId] = useState<string | null>(null);
  const [publishedAt, setPublishedAt] = useState<string | null>(null);
  const [scanStatus, setScanStatus] = useState<StashScanStatus>(EMPTY_SCAN_STATUS);
  const [scanBusy, setScanBusy] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyPayload, setHistoryPayload] = useState<StashItemHistoryResponse | null>(null);

  const loadPublished = useCallback(async () => {
    const stashStatus = await api.getStashStatus();
    setStatus(stashStatus.status);
    setPublishedScanId(stashStatus.publishedScanId ?? null);
    setPublishedAt(stashStatus.publishedAt ?? null);
    setScanStatus(stashStatus.scanStatus ?? EMPTY_SCAN_STATUS);
    if (stashStatus.connected) {
      const payload = await api.getStashTabs();
      setTabs(payload.stashTabs);
      setPublishedScanId(payload.scanId ?? stashStatus.publishedScanId ?? null);
      setPublishedAt(payload.publishedAt ?? stashStatus.publishedAt ?? null);
      if (payload.scanStatus) {
        setScanStatus(payload.scanStatus);
      }
      setActiveTab((current) => (payload.stashTabs[current] ? current : 0));
    } else {
      setTabs([]);
      setActiveTab(0);
    }
    setError(null);
  }, []);

  useEffect(() => {
    loadPublished().catch((err: unknown) => {
      setError(err instanceof Error ? err.message : 'Stash feature unavailable');
      setStatus('degraded');
    });
  }, [loadPublished]);

  useEffect(() => {
    if (!scanBusy) {
      return;
    }
    const timer = window.setInterval(async () => {
      try {
        const next = await api.getStashScanStatus();
        setScanStatus(next);
        if (next.status === 'published') {
          window.clearInterval(timer);
          setScanBusy(false);
          await loadPublished();
        }
        if (next.status === 'failed') {
          window.clearInterval(timer);
          setScanBusy(false);
          if (next.error) {
            toast.error(next.error);
          }
        }
      } catch (err) {
        window.clearInterval(timer);
        setScanBusy(false);
        toast.error(err instanceof Error ? err.message : 'Failed to fetch scan status');
      }
    }, 1500);
    return () => window.clearInterval(timer);
  }, [scanBusy, loadPublished]);

  const startScan = useCallback(async () => {
    try {
      const next = await api.startStashScan();
      setScanStatus((current) => ({
        ...current,
        status: 'running',
        activeScanId: next.scanId,
        startedAt: next.startedAt,
        updatedAt: next.startedAt,
        error: null,
      }));
      setScanBusy(true);
      toast.success(next.deduplicated ? 'Scan already running' : 'Scan started');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to start scan');
    }
  }, []);

  const openHistory = useCallback(async (item: StashItem) => {
    if (!item.fingerprint) {
      return;
    }
    setHistoryLoading(true);
    setHistoryOpen(true);
    try {
      const payload = await api.getStashItemHistory(item.fingerprint);
      setHistoryPayload(payload);
    } catch (err) {
      setHistoryOpen(false);
      toast.error(err instanceof Error ? err.message : 'Failed to load history');
    } finally {
      setHistoryLoading(false);
    }
  }, []);

  const tab = tabs[activeTab];
  const grid = tab ? getGridSize(tab.type) : 12;
  const runningScan = scanBusy || scanStatus.status === 'running' || scanStatus.status === 'publishing';

  return (
    <div ref={ref} className="space-y-3" data-testid="panel-stash-root">
      <div className="flex flex-col gap-3 rounded border border-gold-dim/20 bg-card/60 p-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <p className="text-sm font-semibold text-foreground">Private Stash</p>
          <p className="text-xs text-muted-foreground">
            {publishedScanId ? `Published ${publishedScanId}` : 'No published scan yet'}
            {publishedAt ? ` · ${publishedAt}` : ''}
          </p>
          {(runningScan || scanStatus.error) && (
            <p className="text-xs text-muted-foreground">
              {scanStatus.status === 'failed'
                ? `Last scan failed${scanStatus.error ? `: ${scanStatus.error}` : ''}`
                : `Scan ${scanStatus.status}: ${scanStatus.progress.tabsProcessed}/${scanStatus.progress.tabsTotal} tabs · ${scanStatus.progress.itemsProcessed}/${scanStatus.progress.itemsTotal} items`}
            </p>
          )}
        </div>
        <Button onClick={startScan} disabled={runningScan} className="gap-2" aria-label="Scan">
          {runningScan ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <History className="h-3.5 w-3.5" />}
          Scan
        </Button>
      </div>

      <div className="flex items-end gap-0">
        {tabs.map((t, i) => (
          <button
            type="button"
            data-testid={`stash-tab-${t.id}`}
            key={t.id}
            onClick={() => setActiveTab(i)}
            className={cn(
              'px-4 py-1.5 text-xs font-display tracking-wide border border-b-0 transition-all relative -mb-px',
              i === activeTab
                ? 'bg-gold-dim/30 text-gold-bright border-gold-dim z-10'
                : 'bg-card text-muted-foreground border-gold-dim/30 hover:text-gold hover:bg-gold-dim/10'
            )}
          >
            {t.name}
            {t.type === 'quad' && <span className="ml-1 text-[9px] opacity-50">(Q)</span>}
          </button>
        ))}
      </div>

      {error && <RenderState kind="degraded" message={error} />}
      {!error && status === 'disconnected' && <RenderState kind="disconnected" message="Connect account to view stash" />}
      {!error && status === 'session_expired' && <RenderState kind="session_expired" message="Session expired, login again" />}
      {!error && status === 'feature_unavailable' && <RenderState kind="feature_unavailable" message="Stash feature unavailable" />}
      {!error && tabs.length === 0 && status === 'connected_empty' && <RenderState kind="empty" message="Connected but stash is empty" />}
      {tab && (
        <div className="stash-frame" data-testid="stash-panel-grid">
          <div
            className="stash-grid"
            style={{
              gridTemplateColumns: `repeat(${grid}, minmax(0, 1fr))`,
              gridTemplateRows: `repeat(${grid}, minmax(0, 1fr))`,
            }}
          >
            {renderEmptyCells(grid)}
            {tab.items.map(item => (
              <StashCell
                key={item.fingerprint || item.id}
                item={item}
                gridSize={grid}
                onOpenHistory={openHistory}
                style={{
                  gridColumn: `${item.x + 1} / span ${item.w}`,
                  gridRow: `${item.y + 1} / span ${item.h}`,
                  zIndex: 1,
                }}
              />
            ))}
          </div>

          <div className="flex items-center gap-4 mt-2 px-1 text-[10px] text-muted-foreground">
            <span className="flex items-center gap-1"><span className="w-3 h-2 rounded-sm bg-[hsl(140,60%,15%,0.5)]" /> Well priced</span>
            <span className="flex items-center gap-1"><span className="w-3 h-2 rounded-sm bg-[hsl(35,80%,15%,0.5)]" /> Could be better</span>
            <span className="flex items-center gap-1"><span className="w-3 h-2 rounded-sm bg-[hsl(0,60%,15%,0.6)]" /> Mispriced</span>
          </div>
        </div>
      )}

      <Collapsible open={schemaOpen} onOpenChange={setSchemaOpen}>
        <CollapsibleTrigger asChild>
          <Button variant="ghost" size="sm" className="text-xs text-muted-foreground gap-1.5">
            <ChevronDown className={cn('h-3 w-3 transition-transform', schemaOpen && 'rotate-180')} />
            API JSON Schema
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="relative mt-2">
            <Button
              variant="outline"
              size="sm"
              className="absolute top-2 right-2 h-7 text-[10px] gap-1"
              onClick={() => { navigator.clipboard.writeText(API_SCHEMA); toast.success('Schema copied'); }}
            >
              <Copy className="h-3 w-3" /> Copy
            </Button>
            <pre className="bg-background border border-gold-dim/20 rounded p-4 text-[11px] font-mono text-muted-foreground overflow-x-auto whitespace-pre">
              {API_SCHEMA}
            </pre>
          </div>
        </CollapsibleContent>
      </Collapsible>

      <Dialog open={historyOpen} onOpenChange={setHistoryOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{historyPayload?.item.name || 'Item history'}</DialogTitle>
            <DialogDescription>
              {historyPayload?.item.itemClass || ''}
            </DialogDescription>
          </DialogHeader>
          {historyLoading && <p className="text-sm text-muted-foreground">Loading history...</p>}
          {!historyLoading && historyPayload && (
            <div className="space-y-3">
              {historyPayload.history.map(entry => (
                <div key={`${entry.scanId}-${entry.pricedAt}`} className="rounded border border-border p-3 text-sm">
                  <div className="flex items-center justify-between gap-3">
                    <span className="font-medium">{entry.predictedValue}{entry.currency === 'div' ? ' div' : ' c'}</span>
                    <span className="text-xs text-muted-foreground">{entry.pricedAt}</span>
                  </div>
                  <div className="mt-1 text-xs text-muted-foreground">
                    Confidence {entry.confidence}% · p10 {entry.interval.p10 ?? 'n/a'} · p90 {entry.interval.p90 ?? 'n/a'}
                  </div>
                </div>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
});

StashViewerTab.displayName = 'StashViewerTab';
export default StashViewerTab;

function StashCell({ item, gridSize, style, onOpenHistory }: { item: StashItem; gridSize: number; style: React.CSSProperties; onOpenHistory: (item: StashItem) => void }) {
  const isQuad = gridSize === 24;
  const IconComp = item.itemClass ? ITEM_CLASS_ICONS[item.itemClass] : null;
  const iconSize = isQuad ? 10 : 18;
  const cur = item.currency === 'div' ? 'div' : 'c';

  return (
    <HoverCard openDelay={80} closeDelay={50}>
      <HoverCardTrigger asChild>
        <button
          type="button"
          data-testid={item.fingerprint ? `stash-item-history-${item.fingerprint}` : undefined}
          onClick={() => onOpenHistory(item)}
          className={cn('stash-item-cell group text-left', EVAL_BG[item.priceEvaluation])}
          style={style}
        >
          {IconComp && (
            <IconComp
              size={iconSize}
              className={cn(
                'transition-all shrink-0',
                RARITY_COLOR[item.rarity],
                RARITY_GLOW[item.rarity],
                'opacity-70 group-hover:opacity-100'
              )}
            />
          )}
          <span className={cn(
            'leading-tight text-center truncate w-full px-0.5',
            RARITY_COLOR[item.rarity],
            isQuad ? 'text-[5px]' : 'text-[7px]'
          )}>
            {item.name}
          </span>
          {!isQuad && (
            <span className="absolute bottom-0.5 left-0.5 text-[6px] font-mono text-gold-bright/50">
              {item.estimatedPrice}{cur}
            </span>
          )}
        </button>
      </HoverCardTrigger>
      <HoverCardContent side="right" className="w-56 p-3 space-y-2 bg-card border-gold-dim/40">
        <div className="space-y-1">
          <div className="flex items-center gap-1.5">
            {IconComp && <IconComp size={14} className={RARITY_COLOR[item.rarity]} />}
            <p className={cn('font-semibold text-sm', RARITY_COLOR[item.rarity])}>{item.name}</p>
          </div>
          {item.itemClass && (
            <span className="text-[10px] text-muted-foreground">{item.itemClass}</span>
          )}
        </div>
        <div className="space-y-1 text-xs">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Estimated</span>
            <span className="font-mono text-gold-bright">{item.estimatedPrice} {cur}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Confidence</span>
            <span className="font-mono">{item.estimatedPriceConfidence}%</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Listed</span>
            <span className="font-mono">{item.listedPrice != null ? `${item.listedPrice} ${cur}` : 'N/A'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Band</span>
            <span className="font-mono">{item.interval?.p10 ?? 'n/a'} - {item.interval?.p90 ?? 'n/a'}</span>
          </div>
        </div>
        <div className={cn('flex items-center gap-1.5 pt-1 border-t border-border text-xs text-muted-foreground')}>
          <span className={cn('w-3 h-2 rounded-sm', EVAL_BG[item.priceEvaluation])} />
          {EVAL_LABEL[item.priceEvaluation]}
        </div>
      </HoverCardContent>
    </HoverCard>
  );
}
