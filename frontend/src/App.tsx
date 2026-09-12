import { lazy, Suspense, useEffect } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';

import AppShell from '@/components/layout/AppShell';
import PageLoader from '@/components/ui/PageLoader';
import { hydrateFleet, persistFleet, useFleetStore } from '@/state/fleetStore';
import { useShipmentsStore } from '@/state/shipmentsStore';

const DashboardPage = lazy(() => import('@/pages/DashboardPage'));
const FleetPage = lazy(() => import('@/pages/FleetPage'));
const RouteBuilderPage = lazy(() => import('@/pages/RouteBuilderPage'));
const AiInsightsPage = lazy(() => import('@/pages/AiInsightsPage'));
const SustainabilityPage = lazy(() => import('@/pages/SustainabilityPage'));
const PlaceholderPage = lazy(() => import('@/pages/PlaceholderPage'));

export default function App() {
  // Phase 5 — hydrate the user's customized fleet on boot and persist every
  // fleet/shipment change (Firestore primary, localStorage fallback).
  useEffect(() => {
    void hydrateFleet();
    let timer: ReturnType<typeof setTimeout> | undefined;
    const schedulePersist = () => {
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => void persistFleet(), 700);
    };
    const unsubFleet = useFleetStore.subscribe((s, prev) => {
      if (s.vehicles !== prev.vehicles) schedulePersist();
    });
    const unsubShipments = useShipmentsStore.subscribe((s, prev) => {
      if (s.shipments !== prev.shipments) schedulePersist();
    });
    return () => {
      if (timer) clearTimeout(timer);
      unsubFleet();
      unsubShipments();
    };
  }, []);

  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        <Route element={<AppShell />}>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/fleet" element={<FleetPage />} />
          <Route path="/shipments" element={<PlaceholderPage title="Shipment Management" />} />
          <Route path="/routes" element={<RouteBuilderPage />} />
          <Route path="/ai/demand" element={<AiInsightsPage />} />
          <Route path="/ai/sustainability" element={<SustainabilityPage />} />
          <Route path="/settings" element={<PlaceholderPage title="Settings" />} />
          <Route path="*" element={<PlaceholderPage title="Not Found" />} />
        </Route>
      </Routes>
    </Suspense>
  );
}