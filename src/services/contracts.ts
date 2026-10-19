export type BaconDiscSummary = { id: string; title: string; platform: string; packageType: string; entryPoint: string; modes: string[]; fileCount: number; totalBytes: number };
export type StorageTarget = { kind: 'ssd' | 'cache' | 'pc'; root: string; availableBytes: number };
export type CopyProgress = { jobId: string; copiedBytes: number; totalBytes: number; completedFiles: number; fileCount: number };
export type CopyRequest = { jobId: string; root: string; destination: string; targetKind: 'permanent' | 'cache' };
export type LibraryRecord = { id: string; title: string; installPath: string; installKind: 'permanent' | 'cache'; requiresDisc: boolean };
export interface DiscService { inspect(root: string): Promise<BaconDiscSummary>; verify(root: string): Promise<number>; copy(root: string, destination: string): Promise<number>; storageTargets(): Promise<StorageTarget[]>; startCopy(request: CopyRequest): Promise<number>; cancelCopy(jobId: string): Promise<void>; onCopyProgress(listener: (progress: CopyProgress) => void): Promise<() => void>; }
export interface GameLibrary { list(): Promise<LibraryRecord[]>; }
export type EmulatorKind = 'retroarch' | 'duckstation' | 'pcsx2' | 'windows-portable';
export type EmulatorProfile = { id: string; name: string; kind: EmulatorKind; executable: string; cores: Partial<Record<'nes' | 'snes' | 'megadrive' | 'gba', string>> };
export interface EmulatorProfileService { list(): Promise<EmulatorProfile[]>; bundled(): Promise<EmulatorProfile[]>; save(profile: EmulatorProfile): Promise<void>; }
export type LaunchRequest = { profileId: string; contentRoot: string; contentRelative: string; contentPlatform: 'nes' | 'snes' | 'megadrive' | 'gba' | 'ps1' | 'ps2' | 'windows' };
export interface LauncherService { launch(request: LaunchRequest): Promise<void>; onState(listener: (state: 'running' | 'returned' | 'failed') => void): Promise<() => void>; }
