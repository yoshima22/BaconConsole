import type { IntegrationStatus } from '../../services/contracts';
export function presentationFor(status: IntegrationStatus) {
  if (status.state === 'unavailable') return { label: 'Disponível em breve', tone: 'warning' as const };
  if (status.state === 'connected') return { label: 'Conectado', tone: 'success' as const, action: status.id === 'retroachievements' ? 'Gerenciar RetroAchievements' : 'Gerenciar SteamGridDB' };
  if (status.state === 'error') return { label: 'Erro de conexão', tone: 'error' as const, action: 'Tentar novamente' };
  if (status.id === 'steamgriddb') return { label: 'Não conectado', tone: 'neutral' as const, action: 'Configurar SteamGridDB' };
  return { label: 'Não configurado', tone: 'neutral' as const };
}
