export type NormalizedInputAction = 'move-left' | 'move-right' | 'move-up' | 'move-down' | 'confirm' | 'back' | 'previous-tab' | 'next-tab';

export function mapStandardGamepad(gamepad: Gamepad): NormalizedInputAction[] {
  if (gamepad.mapping !== 'standard') return [];
  const pressed = (index: number) => gamepad.buttons[index]?.pressed;
  return [
    pressed(0) && 'confirm', pressed(1) && 'back', pressed(4) && 'previous-tab', pressed(5) && 'next-tab',
    pressed(14) && 'move-left', pressed(15) && 'move-right', pressed(12) && 'move-up', pressed(13) && 'move-down',
  ].filter(Boolean) as NormalizedInputAction[];
}
