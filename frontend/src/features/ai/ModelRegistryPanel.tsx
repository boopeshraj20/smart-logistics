import { useEffect, useState } from 'react';
import { RefreshCw, Database } from 'lucide-react';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import SectionHeading from '@/components/ui/SectionHeading';
import { listModels, retrainModels, type AiModelInfo } from '@/services/ai';

function Metrics({ metrics }: { metrics: Record<string, number> }) {
  const keys = Object.keys(metrics);
  if (keys.length === 0) return <span className="text-xs text-ink-faint">—</span>;
  return (
    <span className="font-mono text-xs text-ink-mid">
      {keys
        .slice(0, 3)
        .map((k) => `${k.toUpperCase()} ${metrics[k].toFixed(2)}`)
        .join(' · ')}
    </span>
  );
}

export default function ModelRegistryPanel() {
  const [models, setModels] = useState<AiModelInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [retraining, setRetraining] = useState(false);
  const [offline, setOffline] = useState(false);

  useEffect(() => {
    let active = true;
    void listModels().then((next) => {
      if (!active) return;
      setModels(next ?? []);
      setOffline(!next);
      setLoading(false);
    });
    return () => {
      active = false;
    };
  }, []);

  async function handleRetrain() {
    setRetraining(true);
    const result = await retrainModels();
    if (result) {
      setModels(result.models);
      setOffline(false);
    } else {
      setOffline(true);
    }
    setRetraining(false);
  }

  return (
    <Card variant="default" padding="md" className="flex flex-col gap-4">
      <SectionHeading
        title="Model Registry"
        subtitle="Trained scikit-learn models with evaluation metrics"
        action={
          <Button variant="ghost" size="sm" onClick={handleRetrain} loading={retraining}>
            <RefreshCw className="size-3.5" /> Retrain
          </Button>
        }
      />
      {offline ? (
        <div className="rounded-[var(--r-md)] border border-dashed border-[var(--border)] px-4 py-6 text-center">
          <p className="text-sm text-ink-muted">Backend offline — regeneration requires the ML service (`py -m uvicorn app.main:app`).</p>
        </div>
      ) : loading ? (
        <p className="text-sm text-ink-muted">Loading registry…</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-[var(--border)] text-[10px] uppercase tracking-[0.16em] text-ink-faint">
                <th className="pb-2.5 pr-3 font-medium">Model</th>
                <th className="pb-2.5 pr-3 font-medium">Family</th>
                <th className="pb-2.5 pr-3 font-medium">Dataset</th>
                <th className="pb-2.5 pr-3 font-medium">Features</th>
                <th className="pb-2.5 pr-3 font-medium">Metrics</th>
                <th className="pb-2.5 font-medium">Confidence</th>
              </tr>
            </thead>
            <tbody>
              {models.map((m) => (
                <tr key={m.model_id} className="border-b border-[var(--border)]/50 transition-colors last:border-0 hover:bg-surface-h">
                  <td className="py-3 pr-3">
                    <p className="text-sm font-medium text-ink">{m.model_name}</p>
                    <p className="font-mono text-[11px] text-ink-faint">{m.model_id}</p>
                  </td>
                  <td className="py-3 pr-3 text-sm text-ink-muted">{m.family}</td>
                  <td className="py-3 pr-3">
                    <Badge variant="info" size="sm" className="gap-1">
                      <Database className="size-2.5" /> {m.dataset}
                    </Badge>
                  </td>
                  <td className="py-3 pr-3 text-sm text-ink-mid">{m.features.length}</td>
                  <td className="py-3 pr-3"><Metrics metrics={m.metrics} /></td>
                  <td className="py-3 font-mono text-xs text-ink-mid">{Math.round(m.confidence * 100)}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
}