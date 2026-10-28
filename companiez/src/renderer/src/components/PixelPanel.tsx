import { CSSProperties, ReactNode } from 'react';
import { AccentColorName } from '@/design/tokens';

type Variant = 'default' | 'inset' | 'active' | 'terminal' | 'dialog';

export interface PixelPanelProps {
  variant?: Variant;
  title?: string;
  accent?: AccentColorName;
  children?: ReactNode;
  style?: CSSProperties;
  className?: string;
  noPadding?: boolean;
}

// Companiez 2.5D: raised surfaces (default/active/dialog) float on a soft
// shadow with a lit top edge; `inset` reads as a recessed well. The terminal
// stays flat — a glow around a terminal reads as noise, not depth.
const borderByVariant: Record<Variant, string> = {
  default:  'var(--cth-panel-border), var(--cth-depth-panel)',
  inset:    'var(--cth-panel-border-inset), var(--cth-depth-well)',
  active:   'var(--cth-panel-border)',  // accent overlay added separately
  terminal: 'var(--cth-panel-border-terminal)',
  dialog:   'var(--cth-panel-border-dialog), var(--cth-depth-panel)'
};

const fillByVariant: Record<Variant, string> = {
  default:  'var(--cth-cream-100)',
  inset:    'var(--cth-cream-200)',
  active:   'var(--cth-cream-100)',
  terminal: 'var(--cth-paper-100)',
  dialog:   'var(--cth-cream-50)'
};

export function PixelPanel({
  variant = 'default',
  title,
  accent,
  children,
  style,
  className,
  noPadding = false
}: PixelPanelProps) {
  const baseStyle: CSSProperties = {
    background: fillByVariant[variant],
    boxShadow: borderByVariant[variant],
    padding: noPadding ? 0 : 'var(--cth-space-3)',
    position: 'relative',
    borderRadius: variant === 'terminal' ? 'var(--cth-radius-sm)' : 'var(--cth-radius-md)',
    ...style
  };

  // Active variant: paint accent over the middle border slot (3px ring at 1px inset)
  if (variant === 'active' && accent) {
    baseStyle.boxShadow = `
      inset 0 0 0 1px var(--cth-ink-100),
      inset 0 0 0 3px var(--cth-${accent}),
      inset 0 0 0 5px var(--cth-ink-900),
      var(--cth-depth-panel)`;
  }

  return (
    <div className={className} style={baseStyle}>
      {title && (
        <div
          style={{
            margin: noPadding ? 0 : '-12px -12px 12px',
            padding: '6px 12px 4px',
            borderRadius: 'var(--cth-radius-md) var(--cth-radius-md) 0 0',
            background: accent ? `var(--cth-${accent})` : 'var(--cth-cream-200)',
            color: 'var(--cth-ink-900)',
            fontFamily: 'var(--cth-font-display)',
            fontSize: 'var(--cth-text-display-md)',
            lineHeight: 'var(--cth-lh-display-md)',
            boxShadow: 'inset 0 -1px 0 var(--cth-ink-900)'
          }}
        >
          {title}
        </div>
      )}
      {children}
    </div>
  );
}
