import { mapStandardGamepad } from './gamepadInput';

it('maps a standard controller confirm button and d-pad right', () => {
  const buttons = Array.from({ length: 16 }, () => ({ pressed: false }));
  buttons[0].pressed = true;
  buttons[15].pressed = true;
  expect(mapStandardGamepad({ mapping: 'standard', buttons } as unknown as Gamepad)).toEqual(['confirm', 'move-right']);
});
