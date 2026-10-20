import { presentationFor } from './integrationState';

it('leaves unavailable providers without a fake account action', () => {
  expect(presentationFor({ id: 'retroachievements', state: 'unavailable', detail: 'Integração será adicionada em etapa posterior.' }).action).toBeUndefined();
});
