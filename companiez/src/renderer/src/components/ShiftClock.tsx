import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { cssHex, skyAt, skyAtMinute, type Sky } from '@shared/shift';

/**
 * The shift clock in the title bar — the same sky that lights the office floor
 * (shared/shift.ts), shown as a small swatch with the sun or moon riding across
 * it, plus which shift is on and the local time. It is the visible half of
 * Companiez's "the office never closes" signature.
 */

function readMinute(now: Date): number {
  // Same debug override the floor reads, so chrome and floor always agree.
  try {
    const forced = localStorage.getItem('cth.debug.skyMinute');
    if (forced !== null && forced !== '' && Number.isFinite(Number(forced))) return Number(forced);
  } catch { /* storage unavailable */ }
  return now.getHours() * 60 + now.getMinutes();
}

export function ShiftClock() {
  const { t, i18n } = useTranslation();
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 30_000);
    return () => clearInterval(id);
  }, []);

  const minute = readMinute(now);
  const sky: Sky = minute === now.getHours() * 60 + now.getMinutes() ? skyAt(now) : skyAtMinute(minute);
  const isNight = sky.phase === 'night';
  // Sun travels 06:00→20:00, moon 20:00→06:00, left to right across the swatch.
  const progress = isNight
    ? (((minute - 20 * 60) + 1440) % 1440) / (10 * 60)
    : Math.min(1, Math.max(0, (minute - 6 * 60) / (14 * 60)));
  const shown = new Date(now);
  shown.setHours(Math.floor(minute / 60) % 24, minute % 60);
  const time = shown.toLocaleTimeString(i18n.language, { hour: '2-digit', minute: '2-digit' });

  return (
    <span
      className="cth-tip"
      data-tip={t('shift.tip')}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 8,
        height: 24, padding: '0 10px 0 4px',
        borderRadius: 999,
        background: 'var(--cth-paper-100)',
        boxShadow: 'inset 0 0 0 1px var(--cth-ink-100), inset 0 1px 0 var(--cth-depth-highlight)',
        fontFamily: 'var(--cth-font-ui)', fontSize: 12, color: 'var(--cth-ink-700)',
        whiteSpace: 'nowrap'
      }}
    >
      <span
        aria-hidden
        style={{
          position: 'relative', width: 34, height: 16, borderRadius: 999, overflow: 'hidden',
          background: `linear-gradient(180deg, ${cssHex(sky.skyTop)} 0%, ${cssHex(sky.skyBottom)} 100%)`,
          boxShadow: 'inset 0 0 0 1px rgba(0, 0, 0, 0.12)'
        }}
      >
        <span style={{
          position: 'absolute', top: isNight ? 3 : 4 + Math.round(4 * Math.abs(progress - 0.5) * 2),
          left: `calc(${Math.round(progress * 100)}% - ${Math.round(progress * 9)}px)`,
          width: 9, height: 9, borderRadius: 999,
          background: isNight ? '#E8EEFF' : '#FFE7A3',
          boxShadow: isNight ? '0 0 6px rgba(232, 238, 255, 0.9)' : '0 0 8px rgba(255, 214, 120, 0.95)'
        }} />
      </span>
      <span style={{
        fontFamily: 'var(--cth-font-display)', fontSize: 9, color: 'var(--cth-ink-900)', textTransform: 'uppercase'
      }}>{t(`shift.${sky.phase}`)}</span>
      <span style={{ fontVariantNumeric: 'tabular-nums', color: 'var(--cth-ink-500)' }}>{time}</span>
    </span>
  );
}
