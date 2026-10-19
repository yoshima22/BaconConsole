import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

it('defines the approved primary and focus colors', () => {
  const css = readFileSync(resolve(process.cwd(), 'src/design-system/tokens.css'), 'utf8');
  expect(css).toContain('--color-background-primary: #0B1220');
  expect(css).toContain('--color-accent-primary: #35C2FF');
});
