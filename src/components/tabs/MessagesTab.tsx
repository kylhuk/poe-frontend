import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { api } from '@/services/api';
import type { AppMessage, MessageSeverity } from '@/types/api';
import { cn } from '@/lib/utils';
import { Filter } from 'lucide-react';

const severityStyles: Record<MessageSeverity, string> = {
  critical: 'border-l-destructive bg-destructive/5',
  warning: 'border-l-warning bg-warning/5',
  info: 'border-l-info bg-info/5',
};

const severityDot: Record<MessageSeverity, string> = {
  critical: 'bg-destructive',
  warning: 'bg-warning',
  info: 'bg-info',
};

export default function MessagesTab() {
  const [messages, setMessages] = useState<AppMessage[]>([]);
  const [filter, setFilter] = useState<MessageSeverity | 'all'>('all');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.getMessages()
      .then((rows) => {
        setMessages(rows);
        setError(null);
      })
      .catch((err: unknown) => {
        setError(err instanceof Error ? err.message : 'Backend unavailable');
      });
  }, []);

  const filtered = filter === 'all' ? messages : messages.filter(m => m.severity === filter);
  const formatTime = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h2 className="text-lg font-semibold font-sans text-foreground">Messages & Alerts</h2>
        <div className="flex items-center gap-1">
          <Filter className="h-4 w-4 text-muted-foreground" />
          {(['all', 'critical', 'warning', 'info'] as const).map(f => (
            <Button
              key={f}
              size="sm"
              variant={filter === f ? 'default' : 'outline'}
              className="text-xs capitalize h-7"
              onClick={() => setFilter(f)}
            >
              {f}
            </Button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        {error && <p className="text-sm text-destructive">{error}</p>}
        {filtered.map(m => (
          <Card key={m.id} className={cn('border-l-4', severityStyles[m.severity])}>
            <CardContent className="p-3">
              <div className="flex items-start gap-3">
                <span className={cn('mt-1.5 h-2 w-2 rounded-full shrink-0', severityDot[m.severity])} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-mono text-muted-foreground">{formatTime(m.timestamp)}</span>
                    <span className="text-xs bg-secondary px-2 py-0.5 rounded">{m.sourceModule}</span>
                    <span className="text-xs capitalize text-muted-foreground">{m.severity}</span>
                  </div>
                  <p className="text-sm text-foreground">{m.message}</p>
                  <p className="text-xs text-primary mt-1">→ {m.suggestedAction}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
        {filtered.length === 0 && <p className="text-muted-foreground text-sm text-center py-8">No messages matching filter.</p>}
      </div>
    </div>
  );
}
