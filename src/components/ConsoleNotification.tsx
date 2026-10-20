export type NotificationRequest = { kind: 'info' | 'success' | 'error'; message: string };

export function ConsoleNotification({ notification }: { notification: NotificationRequest }) {
  return <aside className={`console-notification console-notification--${notification.kind}`} role={notification.kind === 'error' ? 'alert' : 'status'}>{notification.message}</aside>;
}
