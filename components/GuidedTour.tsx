'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { getTourForSeite, type TourStep } from '@/lib/hilfe-content';

function getStorageKey(tourId: string) {
  return `tour-${tourId}-gesehen`;
}

interface TooltipPosition {
  top: number;
  left: number;
}

function calculateTooltipPosition(
  rect: DOMRect,
  position: TourStep['position'],
  tooltipWidth: number,
  tooltipHeight: number,
): TooltipPosition {
  const gap = 12;
  const viewportWidth = window.innerWidth;

  if (viewportWidth < 640) {
    return {
      top: rect.bottom + gap + window.scrollY,
      left: Math.max(8, Math.min(rect.left + window.scrollX, viewportWidth - tooltipWidth - 8)),
    };
  }

  let top: number;
  let left: number;

  switch (position) {
    case 'top':
      top = rect.top - tooltipHeight - gap + window.scrollY;
      left = rect.left + rect.width / 2 - tooltipWidth / 2 + window.scrollX;
      break;
    case 'bottom':
      top = rect.bottom + gap + window.scrollY;
      left = rect.left + rect.width / 2 - tooltipWidth / 2 + window.scrollX;
      break;
    case 'left':
      top = rect.top + rect.height / 2 - tooltipHeight / 2 + window.scrollY;
      left = rect.left - tooltipWidth - gap + window.scrollX;
      break;
    case 'right':
      top = rect.top + rect.height / 2 - tooltipHeight / 2 + window.scrollY;
      left = rect.right + gap + window.scrollX;
      break;
  }

  left = Math.max(8, Math.min(left, viewportWidth - tooltipWidth - 8));
  top = Math.max(8 + window.scrollY, top);

  return { top, left };
}

interface GuidedTourProps {
  externalTrigger?: boolean;
  onTriggerConsumed?: () => void;
}

export default function GuidedTour({ externalTrigger, onTriggerConsumed }: GuidedTourProps) {
  const pathname = usePathname();
  const tour = getTourForSeite(pathname);
  const [aktiv, setAktiv] = useState(false);
  const [showPrompt, setShowPrompt] = useState(false);
  const [step, setStep] = useState(0);
  const [tooltipPos, setTooltipPos] = useState<TooltipPosition>({ top: 0, left: 0 });
  const tooltipRef = useRef<HTMLDivElement>(null);
  const promptShownRef = useRef(false);

  const endTour = useCallback(() => {
    setAktiv(false);
    if (tour) {
      localStorage.setItem(getStorageKey(tour.id), 'true');
    }
  }, [tour]);

  const startTour = useCallback(() => {
    setShowPrompt(false);
    setStep(0);
    setAktiv(true);
  }, []);

  const nextStep = useCallback(() => {
    if (!tour) return;
    if (step < tour.steps.length - 1) {
      setStep((s) => s + 1);
    } else {
      endTour();
    }
  }, [step, tour, endTour]);

  const prevStep = useCallback(() => {
    if (step > 0) setStep((s) => s - 1);
  }, [step]);

  // Check if tour should auto-prompt on first visit
  useEffect(() => {
    if (!tour || promptShownRef.current) return;
    const seen = localStorage.getItem(getStorageKey(tour.id));
    if (!seen) {
      const timer = setTimeout(() => setShowPrompt(true), 800);
      promptShownRef.current = true;
      return () => clearTimeout(timer);
    }
  }, [tour]);

  // Reset when pathname changes
  useEffect(() => {
    setAktiv(false);
    setShowPrompt(false);
    setStep(0);
    promptShownRef.current = false;
  }, [pathname]);

  // Handle external trigger from HilfeDrawer
  useEffect(() => {
    if (externalTrigger && tour) {
      startTour();
      onTriggerConsumed?.();
    }
  }, [externalTrigger, tour, onTriggerConsumed, startTour]);

  // Position tooltip and scroll to target when step changes
  useEffect(() => {
    if (!aktiv || !tour) return;

    const currentStep = tour.steps[step];
    const el = document.querySelector(currentStep.target) as HTMLElement | null;
    if (!el) return;

    el.classList.add('drk-tour-spotlight');
    el.scrollIntoView({ behavior: 'smooth', block: 'center' });

    const timer = setTimeout(() => {
      const rect = el.getBoundingClientRect();
      const tooltipEl = tooltipRef.current;
      const tooltipWidth = tooltipEl?.offsetWidth ?? 320;
      const tooltipHeight = tooltipEl?.offsetHeight ?? 150;
      setTooltipPos(calculateTooltipPosition(rect, currentStep.position, tooltipWidth, tooltipHeight));
    }, 350);

    return () => {
      clearTimeout(timer);
      el.classList.remove('drk-tour-spotlight');
    };
  }, [aktiv, step, tour]);

  // Keyboard navigation
  useEffect(() => {
    if (!aktiv) return;

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        endTour();
      } else if (e.key === 'ArrowRight' || e.key === 'Enter') {
        nextStep();
      } else if (e.key === 'ArrowLeft') {
        prevStep();
      }
    }

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [aktiv, endTour, nextStep, prevStep]);

  if (!tour) return null;

  // Auto-prompt dialog
  if (showPrompt && !aktiv) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 drk-backdrop-enter">
        <div
          className="drk-card max-w-sm mx-4 drk-fade-in text-center"
          role="dialog"
          aria-label="Tour-Einladung"
        >
          <h3 className="text-lg font-bold mb-2" style={{ color: 'var(--text)' }}>
            {tour.titel}
          </h3>
          <p className="text-sm mb-4" style={{ color: 'var(--text-light)' }}>
            Möchten Sie eine kurze Einführung zu dieser Seite?
          </p>
          <div className="flex gap-3 justify-center">
            <button
              onClick={() => {
                setShowPrompt(false);
                localStorage.setItem(getStorageKey(tour.id), 'true');
              }}
              className="drk-btn-secondary text-sm"
            >
              Nein, danke
            </button>
            <button onClick={startTour} className="drk-btn-primary text-sm">
              Tour starten
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!aktiv) return null;

  const currentStep = tour.steps[step];

  return (
    <>
      <div className="drk-tour-overlay" onClick={endTour} />
      <div
        ref={tooltipRef}
        className="drk-tour-tooltip"
        style={{ top: tooltipPos.top, left: tooltipPos.left }}
        role="dialog"
        aria-label={currentStep.titel}
      >
        <div className="text-xs mb-1" style={{ color: 'var(--text-muted)' }}>
          {step + 1} von {tour.steps.length}
        </div>
        <h4 className="font-bold mb-1" style={{ color: 'var(--text)' }}>
          {currentStep.titel}
        </h4>
        <p className="text-sm mb-4" style={{ color: 'var(--text-light)' }}>
          {currentStep.text}
        </p>
        <div className="flex items-center justify-between gap-2">
          <button
            onClick={endTour}
            className="text-xs underline"
            style={{ color: 'var(--text-muted)' }}
          >
            Überspringen
          </button>
          <div className="flex gap-2">
            {step > 0 && (
              <button onClick={prevStep} className="drk-btn-secondary text-xs px-3 py-1.5" style={{ minHeight: 'auto' }}>
                Zurück
              </button>
            )}
            <button onClick={nextStep} className="drk-btn-primary text-xs px-3 py-1.5" style={{ minHeight: 'auto' }}>
              {step < tour.steps.length - 1 ? 'Weiter' : 'Fertig'}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
