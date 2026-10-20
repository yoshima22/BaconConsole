import { useEffect, useRef } from 'react';

export type ConfirmRequest = { title: string; message: string; confirmLabel: string; cancelLabel?: string; destructive?: boolean };

export function ConsoleModal({ request, onResolve }: { request: ConfirmRequest; onResolve: (confirmed: boolean) => void }) {
  const confirmRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    confirmRef.current?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') { event.preventDefault(); onResolve(false); }
      if (event.key === 'Enter') { event.preventDefault(); onResolve(true); }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onResolve]);
  return <div className="console-modal-backdrop" role="presentation"><section className="console-modal" role="dialog" aria-modal="true" aria-labelledby="console-modal-title"><p className="eyebrow">CONFIRMAR AÇÃO</p><h2 id="console-modal-title">{request.title}</h2><p>{request.message}</p><div className="console-modal__actions"><button className="action-button action-button--ghost" onClick={() => onResolve(false)}>{request.cancelLabel ?? 'Cancelar'}</button><button ref={confirmRef} className={request.destructive ? 'action-button action-button--danger' : 'action-button'} onClick={() => onResolve(true)}>{request.confirmLabel}</button></div></section></div>;
}
