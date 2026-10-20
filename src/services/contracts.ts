export type BaconDiscSummary = { id: string; title: string; platform: string; packageType: string; entryPoint: string; modes: string[]; fileCount: number; totalBytes: number };
export type StorageTarget = { kind: 'ssd' | 'cache' | 'pc'; root: string; availableBytes: number };
export type CopyProgress = { jobId: string; copiedBytes: number; totalBytes: number; completedFiles: number; fileCount: number };
export type CopyRequest = { jobId: string; root: string; destination: string; targetKind: 'permanent' | 'cache' };
export type LibraryRecord = { id: string; title: string; installPath: string; installKind: 'permanent' | 'cache'; requiresDisc: boolean };
export interface DiscService { inspect(root: string): Promise<BaconDiscSummary>; verify(root: string): Promise<number>; copy(root: string, destination: string): Promise<number>; storageTargets(): Promise<StorageTarget[]>; startCopy(request: CopyRequest): Promise<number>; cancelCopy(jobId: string): Promise<void>; onCopyProgress(listener: (progress: CopyProgress) => void): Promise<() => void>; }
export interface GameLibrary { list(): Promise<LibraryRecord[]>; }
export type CatalogInstallation = { id: number; source: string; platform: string; installPath: string; installKind: string; available: boolean; requiresDisc: boolean; emulatorProfileId?: string | null };
export type CatalogGame = { id: number; identityKey: string; title: string; platform: string; favorite: boolean; installations: CatalogInstallation[] };
export type LocalImportRequest = { root: string; platform: LaunchRequest['contentPlatform']; profileId: string };
export type LocalImportResult = { imported: number; titles: string[] };
export type SteamSyncResult = { imported: number; titles: string[] };
export type WindowsAppResult = { title: string };
export type UserProfile = { id: number; name: string; avatar?: string | null };
export interface CatalogService { listGames(): Promise<CatalogGame[]>; importAuthorizedLibrary(request: LocalImportRequest): Promise<LocalImportResult>; syncSteamLibrary(root?: string): Promise<SteamSyncResult>; registerWindowsApplication(path: string): Promise<WindowsAppResult>; listUsers(): Promise<UserProfile[]>; activeUser(): Promise<UserProfile>; createUser(name: string, avatar?: string): Promise<UserProfile>; setActiveUser(userId: number): Promise<void>; toggleFavorite(gameId: number): Promise<boolean>; }
export type MetadataStatus = 'notConfigured' | 'configured';
export type IntegrationId = 'steam' | 'steamgriddb' | 'screenscraper' | 'retroachievements';
export type IntegrationState = 'notConfigured' | 'configured' | 'checking' | 'connected' | 'error' | 'unavailable';
export type IntegrationStatus = { id: IntegrationId; state: IntegrationState; detail: string };
export type MetadataCandidate = { id: number; name: string };
export type ArtworkKind = 'cover' | 'background' | 'logo';
export type ArtworkRecord = { provider: string; remoteId: number; kind: ArtworkKind; originalUrl: string; localPath: string; mime: string; hash: string };
export type ArtworkOption = { id: number; url: string; thumb: string };
export interface MetadataService { status(): Promise<MetadataStatus>; integrationStatus(): Promise<IntegrationStatus[]>; configureAndTestSteamGridDb(key: string): Promise<IntegrationStatus>; configureAndTestRetroAchievements(username: string, key: string): Promise<IntegrationStatus>; configureSteamGridDb(key: string): Promise<MetadataStatus>; searchSteamGridDb(title: string): Promise<MetadataCandidate[]>; artworkOptions(remoteId: number, kind: ArtworkKind): Promise<ArtworkOption[]>; cacheSteamGridDbArtwork(gameId: number, remoteId: number, kind: ArtworkKind, url: string): Promise<ArtworkRecord>; selectedArtwork(gameId: number): Promise<ArtworkRecord[]>; }
export type EmulatorKind = 'retroarch' | 'duckstation' | 'pcsx2' | 'windows-portable';
export type EmulatorProfile = { id: string; name: string; kind: EmulatorKind; executable: string; cores: Partial<Record<'nes' | 'snes' | 'megadrive' | 'gba' | 'ps1' | 'ps2', string>> };
export interface EmulatorProfileService { list(): Promise<EmulatorProfile[]>; listEffective(): Promise<EmulatorProfile[]>; bundled(): Promise<EmulatorProfile[]>; save(profile: EmulatorProfile): Promise<void>; }
export type LaunchRequest = { profileId: string; contentRoot: string; contentRelative: string; contentPlatform: 'nes' | 'snes' | 'megadrive' | 'gba' | 'ps1' | 'ps2' | 'windows' };
export interface LauncherService { launch(request: LaunchRequest): Promise<void>; launchCatalogGame(gameId: number, installationId: number): Promise<void>; onState(listener: (state: 'running' | 'returned' | 'failed') => void): Promise<() => void>; }
