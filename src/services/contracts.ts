export type BaconDiscSummary = { id: string; title: string; entryPoint: string; modes: string[]; fileCount: number };
export interface DiscService { inspect(root: string): Promise<BaconDiscSummary>; verify(root: string): Promise<number>; copy(root: string, destination: string): Promise<number>; }
