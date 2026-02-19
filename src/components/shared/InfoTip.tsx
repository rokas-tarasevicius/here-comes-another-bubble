import { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';

interface InfoTipProps {
  text: string;
}

export function InfoTip({ text }: InfoTipProps) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState<{ x: number; y: number; above: boolean } | null>(null);
  const markerRef = useRef<HTMLSpanElement>(null);

  const updatePos = useCallback(() => {
    if (!markerRef.current) return;
    const marker = markerRef.current;
    const rect = marker.getBoundingClientRect();
    const above = rect.bottom + 130 > window.innerHeight;
    setPos({
      x: rect.left,
      y: above ? rect.top - 6 : rect.bottom + 6,
      above,
    });
  }, []);

  useEffect(() => {
    const parent = markerRef.current?.parentElement;
    if (!parent) return;

    parent.style.cursor = 'help';
    parent.style.borderBottom = '1px dashed rgba(0,0,0,0.18)';

    const enter = () => { updatePos(); setOpen(true); };
    const leave = () => setOpen(false);
    parent.addEventListener('mouseenter', enter);
    parent.addEventListener('mouseleave', leave);
    return () => {
      parent.removeEventListener('mouseenter', enter);
      parent.removeEventListener('mouseleave', leave);
      parent.style.cursor = '';
      parent.style.borderBottom = '';
    };
  }, [updatePos]);

  return (
    <>
      <span
        ref={markerRef}
        aria-hidden
        style={{
          display: 'inline-block',
          width: 0,
          height: 0,
          overflow: 'hidden',
          verticalAlign: 'baseline',
        }}
      />
      {open && pos && createPortal(
        <div
          className="infotip-popup"
          style={{
            position: 'fixed',
            zIndex: 9999,
            left: `${pos.x}px`,
            [pos.above ? 'bottom' : 'top']: pos.above
              ? `${window.innerHeight - pos.y}px`
              : `${pos.y}px`,
            transform: 'translateX(-50%)',
            width: '224px',
            padding: '8px 12px',
            borderRadius: '8px',
            fontSize: '11px',
            lineHeight: 1.5,
            fontWeight: 400,
            textTransform: 'none' as const,
            letterSpacing: 'normal',
            pointerEvents: 'none' as const,
          }}
        >
          {text}
        </div>,
        document.body,
      )}
    </>
  );
}
