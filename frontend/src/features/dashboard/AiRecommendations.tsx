import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Zap, AlertTriangle, Info, Brain, ExternalLink } from 'lucide-react';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import SectionHeading from '@/components/ui/SectionHeading';
import { AI_RECOMMENDATIONS, type AiRecommendation } from './data';
import { assessEco, forecastDemand, predictMaintenance } from '@/services/ai';
import { useFleetStore } from '@/state/fleetStore';
import { useShipmentsStore } from '@/state/shipmentsStore';
import { cn } from '@/lib/utils';

const typeMeta = {
  optimization: { icon: Zap, tone: 'text-accent', bg: 'bg-accent-soft', badge: 'info' as const },
  warning: { icon: AlertTriangle, tone: 'text-amber', bg: 'bg-amber-soft', badge: 'warning' as const },
  info: { icon: Info, tone: 'text-cyan', bg: 'bg-cyan-soft', badge: 'default' as const },
};

const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08 } },
};

const fadeUp = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.175, 0.885, 0.32, 1.02] as const } },
};

function fmtDay(iso: string): string {
  const d = new Date(`${iso.slice(0, 10)}T00:00:00`);
  return d.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' });
}

function RecommendationItem({ rec }: { rec: AiRecommendation }) {
  const meta = typeMeta[rec.type];
  return (
    <motion.li
      variants={fadeUp}
      className="flex gap-3 rounded-[var(--r-md)] p-3 transition-colors hover:bg-surface-h"
    >
      <div className={cn('flex size-9 shrink-0 items-center justify-center rounded-[var(--r-sm)]', meta.bg, meta.tone)}>
        <meta.icon className="size-4" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <p className="text-sm font-medium leading-snug text-ink">{rec.title}</p>
          <Badge variant={meta.badge} size="sm" className="shrink-0">{rec.impact}</Badge>
        </div>
        <p className="mt-1 text-xs leading-relaxed text-ink-muted">{rec.description}</p>
      </div>
    </motion.li>
  );
}

export default function AiRecommendations() {
  const vehicles = useFleetStore((s) => s.vehicles);
  const shipments = useShipmentsStore((s) => s.shipments);
  const [recommendations, setRecommendations] = useState<AiRecommendation[]>(() => AI_RECOMMENDATIONS);
  const [live, setLive] = useState(false);

  useEffect(() => {
    let active = true;
    async function load() {
      const [forecast, health] = await Promise.all([forecastDemand(14), predictMaintenance(vehicles)]);
      if (!active) return;

      const recs: AiRecommendation[] = [];
      let anyLive = false;

      if (forecast) {
        anyLive = true;
        const peakValue = Math.max(...forecast.points.map((p) => p.predicted), 0);
        recs.push({
          id: 'rec-live-demand',
          type: 'optimization',
          title: `Peak demand expected ${forecast.peakDays.length ? fmtDay(forecast.peakDays[0]) : 'next week'}`,
          description: forecast.explanation.bullets[1] ?? forecast.recommendation,
          impact: `Peak +${Math.round(peakValue)} loads`,
        });
      }

      if (health && health.length > 0) {
        anyLive = true;
        const worst = [...health].sort((a, b) => a.healthScore - b.healthScore)[0];
        if (worst.predictedFailureRisk >= 45 || worst.healthScore < 70) {
          recs.push({
            id: 'rec-live-maintenance',
            type: 'warning',
            title: `${worst.plateNumber || worst.vehicleName} needs service soon`,
            description: worst.recommendations[0] ?? `${worst.remainingKmToService.toLocaleString()} km until the next interval.`,
            impact: `−${Math.round(worst.predictedFailureRisk)}% risk`,
          });
        }
        const average = health.reduce((s, h) => s + h.healthScore, 0) / health.length;
        if (average < 78) {
          recs.push({
            id: 'rec-live-health',
            type: 'info',
            title: 'Fleet health trending downward',
            description: `Average predicted health is ${average.toFixed(0)}/100. Prioritise inspection of vehicles below 70.`,
            impact: 'Prioritise',
          });
        }
      }

      const shipment = shipments.find((s) => s.status !== 'delivered' && s.status !== 'cancelled' && s.route?.distanceKm);
      if (shipment?.route && vehicles.length > 0) {
        const eco = await assessEco({
          distanceKm: shipment.route.distanceKm,
          weightKg: shipment.weightKg ?? 0,
          vehicles,
        });
        if (active && eco && eco.ranking.length > 0) {
          anyLive = true;
          const leader = eco.ranking[0];
          recs.push({
            id: 'rec-live-eco',
            type: 'optimization',
            title: `Prefer ${leader.vehicleName} for lower-carbon dispatch`,
            description: `On the ${shipment.pickup.name} → ${shipment.destination.name} corridor, the greenest option saves ${Math.round(eco.ecoSavingsKg)} kg CO₂.`,
            impact: `−${Math.round(eco.ecoSavingsKg)} kg CO₂`,
          });
        }
      }

      if (active) {
        setRecommendations(recs.length >= 2 ? recs.slice(0, 5) : recs);
        setLive(anyLive && recs.length >= 1);
      }
    }
    void load();
    return () => {
      active = false;
    };
  }, [vehicles, shipments]);

  return (
    <Card variant="strong" padding="md" className="flex h-full flex-col gap-3">
      <SectionHeading
        title="AI Insights"
        subtitle={live ? 'Generated live from the ML layer' : 'Recommendations from the optimization engine'}
        action={
          <div className="flex items-center gap-2">
            {live && (
              <Badge variant="success" size="sm">
                <ExternalLink className="size-2.5" /> LIVE
              </Badge>
            )}
            <div className="flex size-9 items-center justify-center rounded-[var(--r-sm)] bg-accent-soft text-accent">
              <Brain className="size-4" />
            </div>
          </div>
        }
      />
      <motion.ul variants={stagger} initial="hidden" animate="show" className="flex flex-1 flex-col gap-1">
        {recommendations.map((rec) => (
          <RecommendationItem key={rec.id} rec={rec} />
        ))}
      </motion.ul>
    </Card>
  );
}