import React, { useEffect, useCallback } from 'react';
import ReactDOM from 'react-dom';
import useForceRepaint from '../../hooks/useForceRepaint';

/**
 * Modal Component
 *
 * App-wide portal modal wrapper to eliminate Chrome GPU compositing,
 * stale-repaint glitches, and nested-scroll clipping.
 *
 * Features:
 * - Uses ReactDOM.createPortal into document.body.
 * - Solid opaque backdrop bg-black/70 (NO backdrop-blur).
 * - Locks document.body overflow while open.
 * - Forces repaint on resize, visibilitychange, and resolution changes.
 * - Content container uses transform-gpu and isolate with data-modal containment.
 */
export const Modal = ({
  isOpen = true,
  onClose,
  children,
  zIndex = 'z-[100]',
  closeOnBackdropClick = true,
  closeOnEsc = true,
  backdropClassName = 'bg-black/70',
  containerClassName = 'flex items-center justify-center p-4',
  contentClassName = '',
  id,
  'aria-label': ariaLabel,
}) => {
  // Trigger re-render / force-repaint on window resize, tab switch, DPI change
  useForceRepaint(isOpen);

  // Lock body scroll while open and restore on unmount
  useEffect(() => {
    if (!isOpen || typeof document === 'undefined') return;

    const originalOverflow = document.body.style.overflow;
    window.__activeModalCount = (window.__activeModalCount || 0) + 1;
    document.body.style.overflow = 'hidden';

    return () => {
      window.__activeModalCount = Math.max(0, (window.__activeModalCount || 1) - 1);
      if (window.__activeModalCount === 0) {
        document.body.style.overflow = originalOverflow || '';
      }
    };
  }, [isOpen]);

  // Handle ESC key to close
  useEffect(() => {
    if (!isOpen || !closeOnEsc || !onClose) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, closeOnEsc, onClose]);

  const handleBackdropClick = useCallback(
    (e) => {
      if (e.target === e.currentTarget && closeOnBackdropClick && onClose) {
        onClose();
      }
    },
    [closeOnBackdropClick, onClose]
  );

  if (!isOpen || typeof document === 'undefined') return null;

  const modalNode = (
    <div
      id={id}
      data-modal="true"
      className={`fixed inset-0 ${zIndex} ${backdropClassName} ${containerClassName} overflow-y-auto overflow-x-hidden`}
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-label={ariaLabel}
    >
      <div
        className={`relative w-full max-w-full transform-gpu isolate flex justify-center items-center ${contentClassName}`}
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );

  return ReactDOM.createPortal(modalNode, document.body);
};

export default Modal;
