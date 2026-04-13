import { useEffect, useRef, type RefObject } from 'react';

const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * Traps keyboard focus within a container element.
 * - On mount: saves the previously focused element, focuses the first focusable child
 * - Tab / Shift+Tab cycle within the container
 * - On unmount: restores focus to the previously focused element
 */
export function useFocusTrap(
  containerRef: RefObject<HTMLElement | null>,
  onEscape?: () => void,
) {
  const previousFocusRef = useRef<Element | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    previousFocusRef.current = document.activeElement;

    // Focus first focusable element after a tick (allows render to complete)
    const timer = requestAnimationFrame(() => {
      const first = container.querySelector<HTMLElement>(FOCUSABLE_SELECTOR);
      first?.focus();
    });

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape' && onEscape) {
        e.preventDefault();
        onEscape();
        return;
      }

      if (e.key !== 'Tab') return;

      const focusable = container!.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR);
      if (focusable.length === 0) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault();
          last.focus();
        }
      } else {
        if (document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    }

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      cancelAnimationFrame(timer);
      document.removeEventListener('keydown', handleKeyDown);
      // Restore focus
      const prev = previousFocusRef.current;
      if (prev instanceof HTMLElement) {
        prev.focus();
      }
    };
  }, [containerRef, onEscape]);
}
