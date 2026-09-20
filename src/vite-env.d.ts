/// <reference types="vite/client" />

interface QueueItem {
  title: string;
  channel: string;
  duration: string;
  url: string;
  genre?: string;
  format?: "mp3" | "webm";
  localPath?: string;
  source?: string;
  score?: number;
}

interface HunterResult extends QueueItem {
  uploadDate?: string;
  score?: number;
}

interface TrackRecord {
  title: string;
  channel: string;
  genre: string;
  url: string;
  localPath: string;
  duration: string;
  downloadDate: string;
  score: number;
  listened: boolean;
  favorite: boolean;
  source: string;
}

interface DownloadProgressEvent {
  title?: string;
  progress: number;
  status: string;
  file?: string;
}

interface Window {
  radx: {
    ping: () => string;

    scanMusic: () => Promise<{
      success: boolean;
      count?: number;
      path?: string;
      files?: any[];
      error?: string;
    }>;

    searchHunter: (query: string) => Promise<{
      success: boolean;
      results?: HunterResult[];
      error?: string;
    }>;

    addToQueue: (item: QueueItem) => Promise<{
      success: boolean;
      count?: number;
      error?: string;
    }>;

    getQueue: () => Promise<{
      success: boolean;
      queue?: QueueItem[];
      error?: string;
    }>;

    downloadTrack: (item: QueueItem, options?: { format?: "mp3" | "webm" }) => Promise<{
      success: boolean;
      file?: string;
      progress?: number;
      status?: string;
      error?: string;
      track?: TrackRecord;
    }>;

    processQueue: () => Promise<{
      success: boolean;
      processed?: number;
      failed?: number;
      error?: string;
    }>;

    runScout: () => Promise<{
      success: boolean;
      count?: number;
      results?: HunterResult[];
      error?: string;
    }>;

    runRadx: () => Promise<{
      success: boolean;
      scoutCount?: number;
      queued?: number;
      processed?: number;
      failed?: number;
      libraryCount?: number;
      error?: string;
      report?: {
        scout: HunterResult[];
        processedCount: number;
        failedCount: number;
      };
    }>;

    getLibrary: () => Promise<{
      success: boolean;
      tracks?: TrackRecord[];
      error?: string;
    }>;

    openTrackFolder: (track: TrackRecord) => Promise<{
      success: boolean;
      path?: string;
      error?: string;
    }>;

    deleteTrack: (track: TrackRecord) => Promise<{
      success: boolean;
      deleted?: boolean;
      error?: string;
    }>;

    favoriteTrack: (track: TrackRecord) => Promise<{
      success: boolean;
      favorite?: boolean;
      error?: string;
    }>;

    onDownloadProgress: (callback: (payload: DownloadProgressEvent) => void) => void;
  };
}