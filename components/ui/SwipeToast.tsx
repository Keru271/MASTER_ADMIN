'use client';

import React, { useEffect, useRef, useState } from 'react';
import { CheckCircle2, AlertCircle, AlertTriangle, Info, X } from 'lucide-react';
import './SwipeToast.css';

const FLICK = 0.11;
const DEAD_ZONE = 3;
const RESIST_PX = 24;
const COLLAPSE_MS = 200;
const EXIT = 0.7;
const BURN = [{ transform: 'scaleX(1)' }, { transform: 'scaleX(0)' }];
const HAS_STARTING_STYLE = typeof window !== 'undefined' && 'CSSStartingStyleRule' in window;

const rubberband = (over: number, dim: number, c = 0.55) => (over * dim * c) / (dim + c * Math.abs(over));

const velocityOf = (hist: [number, number][]) => {
  if (hist.length < 2) return 0;
  const [t0, y0] = hist[0];
  const [t1, y1] = hist[hist.length - 1];
  return performance.now() - t1 > 100 ? 0 : (y1 - y0) / Math.max(1, t1 - t0);
};

export type SwipeToastType = 'success' | 'error' | 'warning' | 'info';

export interface SwipeToastProps {
  id?: string;
  title?: React.ReactNode;
  description?: React.ReactNode;
  type?: SwipeToastType;
  icon?: React.ReactNode;
  actionLabel?: string;
  onAction?: () => void;
  open?: boolean;
  onClose?: (reason?: string) => void;
  background?: string;
  color?: string;
  borderColor?: string;
  fuseColor?: string;
  width?: number;
  radius?: number;
  slideMs?: number;
  settleBounce?: number;
  swipeDistance?: number;
  duration?: number;
  fuse?: 'bottom' | 'top' | 'none';
  pauseOnHover?: boolean;
  closeButton?: boolean;
  inline?: boolean;
  dismissible?: boolean;
  className?: string;
}

const TYPE_CONFIG: Record<
  SwipeToastType,
  {
    bg: string;
    border: string;
    color: string;
    fuse: string;
    iconBg: string;
    DefaultIcon: React.FC<{ className?: string }>;
  }
> = {
  success: {
    bg: '#0c1f17',
    border: 'rgba(16, 185, 129, 0.35)',
    color: '#ecfdf5',
    fuse: '#10b981',
    iconBg: 'rgba(16, 185, 129, 0.15)',
    DefaultIcon: ({ className }) => <CheckCircle2 className={`text-emerald-400 ${className || ''}`} />,
  },
  error: {
    bg: '#240e14',
    border: 'rgba(244, 63, 94, 0.35)',
    color: '#fff1f2',
    fuse: '#f43f5e',
    iconBg: 'rgba(244, 63, 94, 0.15)',
    DefaultIcon: ({ className }) => <AlertCircle className={`text-rose-400 ${className || ''}`} />,
  },
  warning: {
    bg: '#251b0d',
    border: 'rgba(245, 158, 11, 0.35)',
    color: '#fffbeb',
    fuse: '#f59e0b',
    iconBg: 'rgba(245, 158, 11, 0.15)',
    DefaultIcon: ({ className }) => <AlertTriangle className={`text-amber-400 ${className || ''}`} />,
  },
  info: {
    bg: '#0b1d2e',
    border: 'rgba(14, 165, 233, 0.35)',
    color: '#f0f9ff',
    fuse: '#00e5ff',
    iconBg: 'rgba(14, 165, 233, 0.15)',
    DefaultIcon: ({ className }) => <Info className={`text-cyan-400 ${className || ''}`} />,
  },
};

export function SwipeToast({
  title = '',
  description = '',
  type,
  icon,
  actionLabel = '',
  onAction,
  open = true,
  onClose,
  background,
  color,
  borderColor,
  fuseColor,
  width = 380,
  radius = 14,
  slideMs = 400,
  settleBounce = 0.2,
  swipeDistance = 40,
  duration = 4000,
  fuse = 'bottom',
  pauseOnHover = true,
  closeButton = true,
  inline = false,
  dismissible = true,
  className = '',
}: SwipeToastProps) {
  const [phase, setPhase] = useState<'open' | 'closing' | 'gone'>('open');
  const [instant, setInstant] = useState(false);
  const [mounted, setMounted] = useState(HAS_STARTING_STYLE);
  const cardRef = useRef<HTMLDivElement>(null);
  const fuseRef = useRef<HTMLElement>(null);
  const anim = useRef<Animation | null>(null);
  const drag = useRef<{
    id: number;
    startY: number;
    grab: number | null;
    moved: boolean;
    hist: [number, number][];
  } | null>(null);

  const flags = useRef({ hover: false, interacting: false, focus: false, hidden: false });
  const lastInput = useRef<'pointer' | 'keyboard'>('pointer');
  const pendingClose = useRef<string | null>(null);
  const closeTimer = useRef<NodeJS.Timeout | undefined>(undefined);
  const reason = useRef('timeout');
  const leaving = useRef(false);
  const currentY = useRef(0);
  const phaseRef = useRef(phase);
  phaseRef.current = phase;

  const latest = useRef({ onClose, onAction, slideMs, inline });
  latest.current = { onClose, onAction, slideMs, inline };

  const typeCfg = type ? TYPE_CONFIG[type] : undefined;
  const resolvedBg = background || typeCfg?.bg || '#18181b';
  const resolvedColor = color || typeCfg?.color || '#f5f5f5';
  const resolvedBorder = borderColor || typeCfg?.border || 'rgba(255, 255, 255, 0.12)';
  const resolvedFuse = fuseColor || typeCfg?.fuse || '#f5a524';
  const resolvedIconBg = typeCfg?.iconBg || 'rgba(255, 255, 255, 0.08)';

  const renderIcon = () => {
    if (icon) return icon;
    if (typeCfg) {
      const IconComp = typeCfg.DefaultIcon;
      return <IconComp className="w-4 h-4" />;
    }
    return null;
  };

  const syncFuse = () => {
    const a = anim.current;
    if (!a) return;
    const f = flags.current;
    if (f.hover || f.interacting || f.focus || f.hidden) {
      a.pause();
    } else if (a.playState === 'paused') {
      a.play();
    }
  };

  const finish = (why: string) => {
    setPhase('gone');
    leaving.current = false;
    if (latest.current.inline) {
      closeTimer.current = setTimeout(() => latest.current.onClose?.(why), COLLAPSE_MS);
    } else {
      latest.current.onClose?.(why);
    }
  };

  const close = (why: string) => {
    if (phaseRef.current !== 'open' || leaving.current) return;
    if (drag.current) {
      pendingClose.current = why;
      return;
    }
    anim.current?.pause();
    reason.current = why;
    const now =
      why === 'escape' || ((why === 'action' || why === 'close') && lastInput.current === 'keyboard');
    setInstant(now);
    setPhase('closing');
    clearTimeout(closeTimer.current);
    closeTimer.current = setTimeout(
      () => finish(why),
      now ? 0 : latest.current.slideMs * EXIT + 60,
    );
  };

  const rescue = () => {
    clearTimeout(closeTimer.current);
    setInstant(false);
    currentY.current = 0;
    if (cardRef.current) {
      cardRef.current.style.transform = 'translateY(0px)';
      cardRef.current.style.opacity = '1';
    }
    setPhase('open');
  };

  useEffect(() => {
    if (!open) close('programmatic');
    else if (phaseRef.current !== 'open') rescue();
  }, [open]);

  useEffect(() => {
    if (!HAS_STARTING_STYLE) {
      const raf = requestAnimationFrame(() => setMounted(true));
      return () => cancelAnimationFrame(raf);
    }
  }, []);

  // Web Animations API Burning Fuse
  useEffect(() => {
    if (phase !== 'open' || duration <= 0 || !fuseRef.current) return undefined;
    anim.current?.cancel();
    try {
      const a = fuseRef.current.animate(BURN, {
        duration,
        easing: 'linear',
        fill: 'forwards',
      });
      a.onfinish = () => close('timeout');
      anim.current = a;
      syncFuse();
      return () => {
        a.onfinish = null;
        a.pause();
      };
    } catch {
      const t = setTimeout(() => close('timeout'), duration);
      return () => clearTimeout(t);
    }
  }, [phase, duration]);

  useEffect(() => {
    if (!pauseOnHover) {
      flags.current.hover = false;
      syncFuse();
    }
  }, [pauseOnHover]);

  useEffect(() => {
    const onVisibility = () => {
      flags.current.hidden = document.hidden;
      syncFuse();
    };
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      document.removeEventListener('visibilitychange', onVisibility);
      clearTimeout(closeTimer.current);
      anim.current?.cancel();
    };
  }, []);

  const swipeOut = (dy: number, v: number) => {
    anim.current?.pause();
    leaving.current = true;
    pendingClose.current = null;
    const card = cardRef.current;
    if (card) {
      const targetY = dy + card.offsetHeight + 40;
      card.animate(
        [
          { transform: `translateY(${dy}px)`, opacity: 1 },
          { transform: `translateY(${targetY}px)`, opacity: 0 },
        ],
        {
          duration: 250,
          easing: 'cubic-bezier(0.23, 1, 0.32, 1)',
          fill: 'forwards',
        },
      ).onfinish = () => finish('swipe');
    } else {
      finish('swipe');
    }
  };

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    lastInput.current = 'pointer';
    if (
      e.button !== 0 ||
      !dismissible ||
      drag.current ||
      leaving.current ||
      (e.target as HTMLElement).closest('button')
    )
      return;
    if (phaseRef.current === 'closing') rescue();
    try {
      cardRef.current?.setPointerCapture(e.pointerId);
    } catch {}
    drag.current = {
      id: e.pointerId,
      startY: e.clientY,
      grab: null,
      moved: false,
      hist: [[performance.now(), currentY.current]],
    };
    flags.current.interacting = true;
    syncFuse();
  };

  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const d = drag.current;
    if (!d || d.id !== e.pointerId) return;
    if (d.grab === null) {
      if (Math.abs(e.clientY - d.startY) < DEAD_ZONE) return;
      d.grab = e.clientY - currentY.current;
      if (cardRef.current) cardRef.current.dataset.swiping = '';
    }
    const raw = e.clientY - d.grab;
    const next = raw >= 0 ? raw : rubberband(raw, RESIST_PX);
    currentY.current = next;
    if (cardRef.current) {
      cardRef.current.style.transform = `translateY(${next}px)`;
    }
    d.moved = true;
    d.hist.push([performance.now(), next]);
    if (d.hist.length > 4) d.hist.shift();
  };

  const onPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    const d = drag.current;
    if (!d || d.id !== e.pointerId) return;
    drag.current = null;
    if (cardRef.current) delete cardRef.current.dataset.swiping;
    try {
      cardRef.current?.releasePointerCapture(e.pointerId);
    } catch {}
    flags.current.interacting = false;
    const dy = currentY.current;
    const v = velocityOf(d.hist);

    if (dy > 0 && (v > FLICK || (dy >= swipeDistance && v >= 0))) {
      swipeOut(dy, v);
      return;
    }
    if (d.moved && cardRef.current) {
      cardRef.current.animate(
        [
          { transform: `translateY(${dy}px)` },
          { transform: 'translateY(0px)' },
        ],
        {
          duration: 400,
          easing: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
          fill: 'forwards',
        },
      ).onfinish = () => {
        currentY.current = 0;
        if (cardRef.current) cardRef.current.style.transform = 'translateY(0px)';
      };
    }
    const queued = pendingClose.current;
    pendingClose.current = null;
    if (queued) close(queued);
    else syncFuse();
  };

  if (phase === 'gone' && !inline) return null;

  const renderedIcon = renderIcon();

  return (
    <div
      className={`swipe-toast${className ? ` ${className}` : ''}`}
      data-phase={phase}
      data-inline={inline ? 'true' : 'false'}
      data-fuse={duration > 0 ? fuse : 'none'}
      data-dismissible={dismissible ? 'true' : 'false'}
      data-instant={instant ? '' : undefined}
      data-mounted={mounted ? 'true' : 'false'}
      style={
        {
          '--st-bg': resolvedBg,
          '--st-ink': resolvedColor,
          '--st-border': resolvedBorder,
          '--st-fuse': resolvedFuse,
          '--st-icon-bg': resolvedIconBg,
          '--st-w': `${width}px`,
          '--st-radius': `${radius}px`,
          '--st-slide': `${slideMs}ms`,
          '--st-gap': '10px',
        } as React.CSSProperties
      }
    >
      <div className="swipe-toast__gate">
        <div className="swipe-toast__lift">
          <div
            ref={cardRef}
            className="swipe-toast__card"
            role="status"
            aria-live="polite"
            aria-atomic="true"
            tabIndex={0}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerCancel={onPointerUp}
            onPointerEnter={(e) => {
              if (pauseOnHover && e.pointerType === 'mouse') {
                flags.current.hover = true;
                syncFuse();
              }
            }}
            onPointerLeave={(e) => {
              if (e.pointerType === 'mouse') {
                flags.current.hover = false;
                syncFuse();
              }
            }}
            onFocus={() => {
              flags.current.focus = true;
              syncFuse();
            }}
            onBlur={(e) => {
              if (!e.currentTarget.contains(e.relatedTarget as Node)) {
                flags.current.focus = false;
                syncFuse();
              }
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') lastInput.current = 'keyboard';
              if (e.key === 'Escape' && dismissible) {
                e.stopPropagation();
                close('escape');
              }
            }}
          >
            {renderedIcon ? (
              <span className="swipe-toast__icon" aria-hidden="true">
                {renderedIcon}
              </span>
            ) : null}

            <span className="swipe-toast__body">
              {title ? <span className="swipe-toast__title">{title}</span> : null}
              {description ? <span className="swipe-toast__desc">{description}</span> : null}
            </span>

            {actionLabel ? (
              <button
                type="button"
                className="swipe-toast__action"
                onClick={(e) => {
                  e.stopPropagation();
                  latest.current.onAction?.();
                  close('action');
                }}
              >
                {actionLabel}
              </button>
            ) : null}

            {closeButton ? (
              <button
                type="button"
                className="swipe-toast__close"
                aria-label="Close"
                onClick={(e) => {
                  e.stopPropagation();
                  close('close');
                }}
              >
                <X className="w-3.5 h-3.5" />
              </button>
            ) : null}

            <i ref={fuseRef} className="swipe-toast__fuse" aria-hidden="true" />
          </div>
        </div>
      </div>
    </div>
  );
}

export default SwipeToast;
