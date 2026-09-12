import { Menu, MonitorPlay, Search } from 'lucide-react';
import { motion } from 'framer-motion';
import { useNavigate, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useSettingsStore } from '@/state/settingsStore';
import { useSearchStore } from '@/state/searchStore';

interface TopBarProps {
  onMenuToggle: () => void;
}

export default function TopBar({ onMenuToggle }: TopBarProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const demoMode = useSettingsStore((s) => s.demoMode);
  const presentationMode = useSettingsStore((s) => s.presentationMode);
  const toggleDemoMode = useSettingsStore((s) => s.toggleDemoMode);
  const togglePresentationMode = useSettingsStore((s) => s.togglePresentationMode);
  const query = useSearchStore((s) => s.query);
  const setQuery = useSearchStore((s) => s.setQuery);

  function submitSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!query.trim()) return;
    if (location.pathname !== '/shipments') navigate('/shipments');
  }

  return (
    <header className="glass-strong flex h-14 shrink-0 items-center gap-3 px-4">
      <button
        onClick={onMenuToggle}
        aria-label="Open navigation"
        className="focus-ring flex size-9 items-center justify-center rounded-[var(--r-sm)] text-ink-muted transition-colors hover:bg-surface-h hover:text-ink lg:hidden"
      >
        <Menu className="size-5" />
      </button>

      <form onSubmit={submitSearch} className="relative hidden max-w-md flex-1 sm:block" role="search">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink-faint" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search shipments…  (Enter to jump)"
          aria-label="Search shipments"
          className="focus-ring h-9 w-full rounded-[var(--r-md)] border border-[var(--border)] bg-surface-h/40 pl-9 pr-3 text-sm text-ink placeholder:text-ink-faint transition-colors focus:border-[var(--border-h)]"
        />
      </form>

      <div className="ml-auto flex items-center gap-2.5">
        <div className="hidden items-center gap-2 sm:flex">
          <span
            className={cn(
              'relative h-5 w-9 cursor-pointer rounded-full transition-colors duration-[var(--dur-norm)]',
              demoMode ? 'bg-accent' : 'bg-surface-sh',
            )}
            onClick={toggleDemoMode}
            role="switch"
            aria-checked={demoMode}
            aria-label="Toggle demo mode"
          >
            <motion.span
              layout
              transition={{ type: 'spring', stiffness: 500, damping: 30 }}
              className={cn('absolute top-0.5 size-4 rounded-full bg-white shadow-sm', demoMode ? 'left-[18px]' : 'left-0.5')}
            />
          </span>
          <span className="text-xs font-medium text-ink-muted">Demo</span>
        </div>

        <button
          onClick={togglePresentationMode}
          aria-label="Launch presentation mode"
          title="Presentation mode"
          className={cn(
            'focus-ring flex size-9 items-center justify-center rounded-[var(--r-sm)] transition-colors',
            presentationMode
              ? 'bg-cyan-soft text-cyan ring-1 ring-cyan/30'
              : 'text-ink-muted hover:bg-surface-h hover:text-ink',
          )}
        >
          <MonitorPlay className="size-4.5" />
        </button>

        <button className="focus-ring flex size-9 items-center justify-center rounded-full bg-accent-soft text-xs font-semibold text-accent ring-1 ring-accent/20 transition-colors hover:bg-accent hover:text-white">
          PM
        </button>
      </div>
    </header>
  );
}