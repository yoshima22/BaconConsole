import packageJson from '../../package.json';

it('exposes a Tauri development command', () => {
  expect(packageJson.scripts).toHaveProperty('tauri');
});
