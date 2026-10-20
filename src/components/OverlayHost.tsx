import { createContext, useCallback, useContext, useRef, useState, type PropsWithChildren } from 'react';
import { ConsoleModal, type ConfirmRequest } from './ConsoleModal';
import { ConsoleNotification, type NotificationRequest } from './ConsoleNotification';

type OverlayApi = { confirm(request: ConfirmRequest): Promise<boolean>; notify(notification: NotificationRequest): void; closeTop(): boolean };
const OverlayContext = createContext<OverlayApi | null>(null);

export function OverlayHost({ children }: PropsWithChildren) {
  const [request, setRequest] = useState<ConfirmRequest | null>(null);
  const [notification, setNotification] = useState<NotificationRequest | null>(null);
  const opener = useRef<HTMLElement | null>(null);
  const resolver = useRef<((confirmed: boolean) => void) | null>(null);
  const timer = useRef<number | null>(null);
  const resolve = useCallback((confirmed: boolean) => {
    resolver.current?.(confirmed);
    resolver.current = null;
    setRequest(null);
    const target = opener.current;
    opener.current = null;
    if (target?.isConnected && !(target as HTMLButtonElement).disabled) queueMicrotask(() => target.focus());
  }, []);
  const confirm = useCallback((next: ConfirmRequest) => new Promise<boolean>((done) => {
    opener.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    resolver.current = done;
    setRequest(next);
  }), []);
  const notify = useCallback((next: NotificationRequest) => {
    setNotification(next);
    if (timer.current !== null) window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setNotification(null), 4500);
  }, []);
  const closeTop = useCallback(() => { if (!request) return false; resolve(false); return true; }, [request, resolve]);
  return <OverlayContext.Provider value={{ confirm, notify, closeTop }}>{children}{notification && <ConsoleNotification notification={notification} />}{request && <ConsoleModal request={request} onResolve={resolve} />}</OverlayContext.Provider>;
}

export function useOverlay() { const value = useContext(OverlayContext); if (!value) throw new Error('useOverlay deve ser usado dentro de OverlayHost.'); return value; }
