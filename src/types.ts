export interface QueueItem {
  title: string;
  channel: string;
  duration: string;
  url: string;
  genre?: string;
  format?: "mp3" | "webm";
  localPath?: string;
  source?: string;
}

export interface TrackRecord {
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

export interface ScoutResult extends QueueItem {
  score?: number;
  uploadDate?: string;
}

export interface DownloadProgressEvent {
  title?: string;
  progress: number;
  status: string;
  file?: string;
}
