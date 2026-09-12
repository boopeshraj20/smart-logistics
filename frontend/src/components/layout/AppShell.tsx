import { useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Truck,
  LayoutDashboard,
  Package,
  Navigation,
  TrendingUp,
  Droplets,
  Settings,
  X,
  type LucideIcon,
} from 'lucide-react';

import TopBar from '@/components/layout/TopBar';
import AssistantDock from '@/components/layout/AssistantDock';
import PresentationDashboard from '@/components/presentation/PresentationDashboard';
import { useSettingsStore } from '@/state/settingsStore';
import { cn } from '@/lib/utils';

interface NavItem {
  to: string;
  label: string;
  icon: LucideIcon;
}

const NAV_GROUPS: { section: string; items: NavItem[] }[] = [
  {
    section: 'Operations',
    items: [
      { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
      { to: '/fleet', label: 'Fleet Management', icon: Truck },
      { to: '/shipments', label: 'Shipments', icon: Package },
      { to: '/routes', label: 'Route Optimizer', icon: Navigation },
    ],
  },
  {
    section: 'Intelligence',
    items: [
      { to: '/ai/demand', label: 'AI Analytics', icon: TrendingUp },
      { to: '/ai/sustainability', label: 'Sustainability', icon: Droplets },
    ],
  },
  {
    section: 'System',
    items: [{ to: '/settings', label: 'Settings', icon: Settings }],
  },
];

function NavGroup({ group, onNavigate }: { group: (typeof NAV_GROUPS)[number]; onNavigate?: () => void }) {
  return (
    <div>
      <p className="px-3 pb-2 text-[10px] font-medium uppercase tracking-[0.18em] text-ink-faint">
        {group.section}
      </p>
      <ul className="flex flex-col gap-1">
        {group.items.map((item) => (
          <li key={item.to}>
            <NavLink
              to={item.to}
              onClick={onNavigate}
              className={({ isActive }) =>
                cn(
                  'group flex items-center gap-3 rounded-[var(--r-sm)] px-3 py-2.5 text-sm text-ink-muted transition-all duration-[var(--dur-norm)]',
                  'hover:bg-surface-h hover:text-ink',
                  isActive && 'bg-accent-soft font-medium text-accent hover:text-accent',
                )
              }
            >
              <item.icon className="size-[18px]" />
              {item.label}
            </NavLink>
          </li>
        ))}
      </ul>
    </div>
  );
}

function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <div className="flex h-full flex-col gap-6 px-4 py-5">
      <div className="flex items-center gap-3 px-2">
        <div className="flex size-9 items-center justify-center rounded-[var(--r-md)] bg-accent-soft text-accent">
          <Truck className="size-5" />
        </div>
        <div>
          <p className="text-sm font-semibold tracking-wide text-ink">Lumina</p>
          <p className="text-[11px] text-ink-faint">Smart Logistics</p>
        </div>
      </div>

      <nav className="flex flex-1 flex-col gap-5 overflow-y-auto">
        {NAV_GROUPS.map((group) => (
          <NavGroup key={group.section} group={group} onNavigate={onNavigate} />
        ))}
      </nav>

      <div className="rounded-[var(--r-md)] border border-[var(--border)] bg-surface px-3 py-3">
        <div className="flex items-center justify-between">
          <p className="text-[10px] uppercase tracking-widest text-ink-faint">Environment</p>
          <span className="size-1.5 animate-pulse-dot rounded-full bg-success" />
        </div>
        <p className="mt-1 text-xs text-ink-mid">Live Demo · v0.2.0</p>
      </div>
    </div>
  );
}

export default function AppShell() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const presentationMode = useSettingsStore((s) => s.presentationMode);

  if (presentationMode) {
    return <PresentationDashboard />;
  }

  return (
    <div className="flex h-full overflow-hidden">
      <aside className="glass-strong m-3 mr-0 hidden w-[250px] shrink-0 lg:block">
        <SidebarContent />
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <div className="mx-3 mt-3">
          <TopBar onMenuToggle={() => setMobileOpen(true)} />
        </div>
        <main className="bg-grid relative flex-1 overflow-hidden">
          <div className="relative z-10 h-full overflow-y-auto p-6">
            <Outlet />
          </div>
        </main>
      </div>

      <AssistantDock />

      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setMobileOpen(false)}
              className="fixed inset-0 z-40 bg-void/70 backdrop-blur-sm lg:hidden"
            />
            <motion.div
              initial={{ x: -300 }}
              animate={{ x: 0 }}
              exit={{ x: -300 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="glass-strong fixed inset-y-0 left-0 z-50 w-[280px] lg:hidden"
            >
              <button
                onClick={() => setMobileOpen(false)}
                aria-label="Close navigation"
                className="focus-ring absolute right-3 top-4 flex size-8 items-center justify-center rounded-[var(--r-sm)] text-ink-muted hover:bg-surface-h hover:text-ink"
              >
                <X className="size-4.5" />
              </button>
              <SidebarContent onNavigate={() => setMobileOpen(false)} />
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}