import { useEffect, useRef, useState } from 'react';
import { Crosshair, Loader2, MapPin, Search, X } from 'lucide-react';

import { searchPlaces } from '@/services/routing';
import { cn, uid } from '@/lib/utils';
import type { GeoSearchResult, Stop } from '@/types';

interface LocationFieldProps {
  value?: Stop | null;
  label: string;
  disabled?: boolean;
  picking: boolean;
  onStartPick: () => void;
  onChange: (stop: Stop | null) => void;
}

export default function LocationField({
  value,
  label,
  disabled,
  picking,
  onStartPick,
  onChange,
}: LocationFieldProps) {
  const [query, setQuery] = useState(value ? value.name : '');
  const [suggestions, setSuggestions] = useState<GeoSearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [open, setOpen] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);

  // Keep the visible input in sync when the parent replaces the selection
  // (e.g. a map click) without triggering an advisory setState-in-effect.
  const [prevValue, setPrevValue] = useState<Stop | null | undefined>(value);
  if (value !== prevValue) {
    setPrevValue(value);
    setQuery(value?.name ?? '');
  }

  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, []);

  useEffect(() => {
    const trimmed = query.trim();
    if (trimmed.length < 3 || value?.name === trimmed) return;
    let alive = true;
    const t = window.setTimeout(() => {
      setSearching(true);
      searchPlaces(trimmed)
        .then((r) => {
          if (alive) {
            setSuggestions(r);
            setOpen(true);
          }
        })
        .catch(() => {
          if (alive) setSuggestions([]);
        })
        .finally(() => {
          if (alive) setSearching(false);
        });
    }, 350);
    return () => {
      alive = false;
      window.clearTimeout(t);
    };
  }, [query, value]);

  return (
    <div ref={boxRef} className="relative flex flex-col gap-1.5">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-medium uppercase tracking-wide text-ink-faint">{label}</span>
        {value && (
          <span className="flex items-center gap-1 font-mono text-[10px] text-ink-faint">
            {value.location.lat.toFixed(4)}, {value.location.lng.toFixed(4)}
          </span>
        )}
      </div>

      <div
        className={cn(
          'flex items-center gap-2 rounded-[var(--r-sm)] border bg-surface px-2.5 transition-colors',
          picking ? 'border-accent/60 bg-accent-soft/10' : 'border-[var(--border)]',
          disabled && 'pointer-events-none opacity-50',
        )}
      >
        <MapPin className="size-4 shrink-0 text-ink-faint" />
        <input
          value={query}
          onChange={(e) => {
            const q = e.target.value;
            setQuery(q);
            if (value) onChange(null);
            if (q.trim().length < 3) {
              setSuggestions([]);
              setOpen(false);
            }
          }}
          onFocus={() => suggestions.length > 0 && setOpen(true)}
          placeholder={value ? value.name : 'Search city / warehouse…'}
          className="h-9 w-full bg-transparent text-sm text-ink outline-none placeholder:text-ink-faint"
        />
        {searching && <Loader2 className="size-3.5 shrink-0 animate-spin text-ink-faint" />}
        {query && !searching && (
          <button
            type="button"
            aria-label="Clear"
            onClick={() => {
              setQuery('');
              onChange(null);
            }}
            className="text-ink-faint transition-colors hover:text-ink"
          >
            <X className="size-3.5" />
          </button>
        )}
        <button
          type="button"
          aria-label="Pick on map"
          onClick={onStartPick}
          className={cn(
            'flex size-7 shrink-0 items-center justify-center rounded-md border transition-colors',
            picking
              ? 'border-accent/50 bg-accent-soft text-accent'
              : 'border-[var(--border)] text-ink-faint hover:border-[var(--border-h)] hover:text-ink',
          )}
        >
          <Crosshair className="size-3.5" />
        </button>
      </div>

      {picking && (
        <p className="animate-pulse-dot text-[11px] text-accent">Click on the map to place this point…</p>
      )}

      {open && suggestions.length > 0 && (
        <div className="glass-strong absolute left-0 right-0 top-[calc(100%+6px)] z-30 max-h-56 overflow-y-auto py-1 shadow-[var(--shadow-lg)]">
          {suggestions.map((r) => {
            const stop: Stop = {
              id: uid('loc'),
              name: r.label,
              city: r.region,
              location: { lat: r.latitude, lng: r.longitude },
            };
            return (
              <button
                key={`${r.longitude}-${r.latitude}-${r.label}`}
                type="button"
                onClick={() => {
                  onChange(stop);
                  setQuery(r.label);
                  setOpen(false);
                }}
                className="flex w-full items-start gap-3 px-3 py-2 text-left transition-colors hover:bg-surface-h"
              >
                <span className="mt-0.5 flex size-4 shrink-0 items-center justify-center text-[8px] text-ink-faint">
                  <Search className="size-3" />
                </span>
                <span className="min-w-0">
                  <span className="block truncate text-xs font-medium text-ink">{r.name}</span>
                  <span className="block truncate text-[10px] text-ink-faint">{r.label}</span>
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}