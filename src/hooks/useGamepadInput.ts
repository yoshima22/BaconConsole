import { useEffect, useRef } from 'react';
import { mapStandardGamepad, type NormalizedInputAction } from './gamepadInput';

export function useGamepadInput(onAction: (action: NormalizedInputAction) => void) {
  const held = useRef(new Set<string>());
  useEffect(() => { let frame = 0; const poll = () => { const current = new Set<string>(); for (const pad of navigator.getGamepads?.() ?? []) if (pad) for (const action of mapStandardGamepad(pad)) current.add(action); for (const action of current) if (!held.current.has(action)) onAction(action as NormalizedInputAction); held.current = current; frame = requestAnimationFrame(poll); }; frame = requestAnimationFrame(poll); return () => cancelAnimationFrame(frame); }, [onAction]);
}
