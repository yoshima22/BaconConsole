import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, expect, it, vi } from 'vitest';
import { ArtworkPicker } from './ArtworkPicker';
const service={ status:vi.fn(),configureSteamGridDb:vi.fn(),searchSteamGridDb:vi.fn(),artworkOptions:vi.fn(),cacheSteamGridDbArtwork:vi.fn(),selectedArtwork:vi.fn() };
beforeEach(()=>vi.clearAllMocks());
it('explains configuration when SteamGridDB has no key', async()=>{service.status.mockResolvedValue('notConfigured');render(<ArtworkPicker gameId={1} title="Chrono" service={service} onUpdated={()=>{}} />);expect(await screen.findByText(/não conectado/i)).toBeInTheDocument();});
it('shows multiple search candidates for manual choice', async()=>{service.status.mockResolvedValue('configured');service.searchSteamGridDb.mockResolvedValue([{id:1,name:'Chrono'},{id:2,name:'Chrono II'}]);render(<ArtworkPicker gameId={1} title="Chrono" service={service} onUpdated={()=>{}} />);fireEvent.click(await screen.findByRole('button',{name:/buscar/i}));expect(await screen.findByRole('button',{name:'Chrono II'})).toBeInTheDocument();});
