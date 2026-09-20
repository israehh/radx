const { app, BrowserWindow, ipcMain, shell } = require("electron");
const path = require("path");
const fs = require("fs");
const { execFile } = require("child_process");

const MUSIC_PATH = "C:\\Music";
const SCOUT_PATH = path.join(MUSIC_PATH, "Scout");
const DATA_DIR = path.join("C:\\", "ia", "radx", "data");
const QUEUE_FILE = path.join(DATA_DIR, "queue.json");
const TRACKS_FILE = path.join(DATA_DIR, "tracks.json");
const YT_DLP_PATH = "C:\\AI\\yt-dlp\\yt-dlp.exe";
const AUDIO_EXTENSIONS = [".mp3", ".flac", ".wav", ".m4a", ".webm"];
const DEFAULT_GENRES = [
  "Industrial Techno",
  "Hard Techno",
  "Dark Techno",
  "Peak Time Techno",
  "Minimal Techno",
  "Raw Techno",
  "EBM",
  "Synthwave"
];

function ensureDirectory(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

function ensureQueueFile() {
  ensureDirectory(path.dirname(QUEUE_FILE));

  if (!fs.existsSync(QUEUE_FILE)) {
    fs.writeFileSync(QUEUE_FILE, "[]", "utf8");
  }
}

function ensureTracksFile() {
  ensureDirectory(path.dirname(TRACKS_FILE));

  if (!fs.existsSync(TRACKS_FILE)) {
    fs.writeFileSync(TRACKS_FILE, "[]", "utf8");
  }
}

function loadQueue() {
  ensureQueueFile();

  try {
    const data = fs.readFileSync(QUEUE_FILE, "utf8");
    return JSON.parse(data || "[]");
  } catch {
    return [];
  }
}

function saveQueue(queue) {
  ensureQueueFile();
  fs.writeFileSync(QUEUE_FILE, JSON.stringify(queue, null, 2), "utf8");
}

function loadTracks() {
  ensureTracksFile();

  try {
    const data = fs.readFileSync(TRACKS_FILE, "utf8");
    return JSON.parse(data || "[]");
  } catch {
    return [];
  }
}

function saveTracks(tracks) {
  ensureTracksFile();
  fs.writeFileSync(TRACKS_FILE, JSON.stringify(tracks, null, 2), "utf8");
}

function findTrackByUrl(url) {
  return loadTracks().find((track) => track.url === url || track.localPath === url) || null;
}

function addTrack(track) {
  const tracks = loadTracks();
  const existingIndex = tracks.findIndex((item) => item.url === track.url || item.localPath === track.localPath);

  if (existingIndex >= 0) {
    tracks[existingIndex] = { ...tracks[existingIndex], ...track };
    saveTracks(tracks);
    return tracks[existingIndex];
  }

  const normalizedTrack = {
    title: track.title || "Untitled",
    channel: track.channel || "Unknown",
    genre: track.genre || "Techno",
    url: track.url || "",
    localPath: track.localPath || SCOUT_PATH,
    duration: track.duration || "0:00",
    downloadDate: track.downloadDate || new Date().toISOString(),
    score: Number(track.score || 0),
    listened: Boolean(track.listened),
    favorite: Boolean(track.favorite),
    source: track.source || "manual"
  };

  tracks.push(normalizedTrack);
  saveTracks(tracks);
  return normalizedTrack;
}

function removeTrack(url) {
  const tracks = loadTracks().filter((track) => track.url !== url && track.localPath !== url);
  saveTracks(tracks);
  return tracks;
}

function scanDirectory(dir) {
  if (!fs.existsSync(dir)) {
    return [];
  }

  const files = [];

  function walk(folder) {
    const items = fs.readdirSync(folder);

    for (const item of items) {
      const fullPath = path.join(folder, item);
      const stat = fs.statSync(fullPath);

      if (stat.isDirectory()) {
        walk(fullPath);
        continue;
      }

      const extension = path.extname(item).toLowerCase();

      if (AUDIO_EXTENSIONS.includes(extension)) {
        files.push({
          name: path.basename(item, extension),
          extension: extension.replace(".", ""),
          path: fullPath
        });
      }
    }
  }

  walk(dir);
  return files;
}

function normalizeFormat(value) {
  const normalized = String(value || "mp3").toLowerCase();
  return normalized === "webm" ? "webm" : "mp3";
}

function parseDurationToSeconds(input) {
  if (!input || typeof input !== "string") {
    return 0;
  }

  const trimmed = input.trim();

  if (!trimmed) {
    return 0;
  }

  const parts = trimmed.split(":").map((part) => Number(part) || 0).reverse();

  let totalSeconds = 0;

  for (let index = 0; index < parts.length; index += 1) {
    totalSeconds += parts[index] * (index === 0 ? 1 : index === 1 ? 60 : 3600);
  }

  return totalSeconds;
}

function estimateScore(item) {
  const title = `${item.title || ""} ${item.channel || ""}`.toLowerCase();
  let score = 0;

  if (/(official|artist|channel)/i.test(item.channel || "")) {
    score += 10;
  }

  if (parseDurationToSeconds(item.duration) > 600) {
    score += 5;
  }

  if (/(live|live set|session|stream)/i.test(title)) {
    score += 4;
  }

  if (/(mix|dj mix|set|radio mix)/i.test(title)) {
    score += 3;
  }

  if (item.uploadDate) {
    const uploadDate = new Date(`${item.uploadDate.slice(0, 4)}-${item.uploadDate.slice(4, 6)}-${item.uploadDate.slice(6, 8)}`);
    const ageInDays = (Date.now() - uploadDate.getTime()) / (1000 * 60 * 60 * 24);

    if (Number.isFinite(ageInDays) && ageInDays <= 30) {
      score += 2;
    }
  }

  return score;
}

function createResultItem(rawItem, genre) {
  const item = {
    title: rawItem.title || "",
    channel: rawItem.channel || "",
    duration: rawItem.duration || "0:00",
    url: rawItem.url || "",
    genre: genre || rawItem.genre || "Techno",
    uploadDate: rawItem.uploadDate || "",
    score: estimateScore(rawItem)
  };

  return item;
}

function getNewestAudioFile(dirPath) {
  if (!fs.existsSync(dirPath)) {
    return "";
  }

  const files = fs
    .readdirSync(dirPath)
    .filter((file) => AUDIO_EXTENSIONS.includes(path.extname(file).toLowerCase()))
    .map((file) => path.join(dirPath, file));

  if (!files.length) {
    return "";
  }

  files.sort((left, right) => fs.statSync(right).mtimeMs - fs.statSync(left).mtimeMs);
  return files[0];
}

async function runScoutSearch() {
  const allResults = [];

  for (const genre of DEFAULT_GENRES) {
    const searchQuery = `ytsearch5:${genre}`;

    const genreResults = await new Promise((resolve) => {
      execFile(
        YT_DLP_PATH,
        [
          searchQuery,
          "--print",
          "%(title)s|||%(channel)s|||%(duration_string)s|||%(webpage_url)s|||%(upload_date)s"
        ],
        { encoding: "utf8" },
        (error, stdout) => {
          if (error) {
            resolve([]);
            return;
          }

          const parsed = stdout
            .split("\n")
            .filter(Boolean)
            .map((line) => {
              const parts = line.split("|||");

              return {
                title: parts[0] || "",
                channel: parts[1] || "",
                duration: parts[2] || "0:00",
                url: parts[3] || "",
                uploadDate: parts[4] || "",
                genre
              };
            })
            .filter((item) => item.url);

          resolve(parsed);
        }
      );
    });

    allResults.push(...genreResults);
  }

  const existingUrls = new Set([
    ...loadTracks().map((track) => track.url),
    ...loadQueue().map((item) => item.url)
  ]);

  const deduplicated = allResults.filter((item, index, list) => {
    const firstIndex = list.findIndex((candidate) => candidate.url === item.url);
    const isUnique = index === firstIndex;
    const isNew = !existingUrls.has(item.url);
    return isUnique && isNew;
  });

  return deduplicated
    .map((item) => createResultItem(item, item.genre))
    .sort((left, right) => (right.score || 0) - (left.score || 0));
}

async function processQueueItems(event) {
  const queue = loadQueue();
  let processed = 0;
  let failed = 0;

  for (const item of [...queue]) {
    try {
      const result = await downloadTrack(event, item, item.format || "mp3");

      if (result && result.success) {
        const remainingQueue = loadQueue().filter((queuedItem) => queuedItem.url !== item.url);
        saveQueue(remainingQueue);
        processed += 1;
      } else {
        failed += 1;
      }
    } catch {
      failed += 1;
    }
  }

  return { success: true, processed, failed };
}

async function downloadTrack(event, item, format = "mp3") {
  if (!item || !item.url) {
    return { success: false, error: "URL inválida" };
  }

  const normalizedFormat = normalizeFormat(format);
  const existingTrack = findTrackByUrl(item.url);

  if (existingTrack) {
    return {
      success: true,
      alreadyDownloaded: true,
      file: existingTrack.localPath || SCOUT_PATH,
      progress: 100,
      status: "already-downloaded",
      track: existingTrack
    };
  }

  ensureDirectory(MUSIC_PATH);
  ensureDirectory(SCOUT_PATH);

  const queue = loadQueue();
  const inQueue = queue.some((queuedItem) => queuedItem.url === item.url);

  if (inQueue && !item.forceDownload) {
    return {
      success: false,
      error: "La pista ya está en cola.",
      status: "already-queued"
    };
  }

  const downloadArgs = [
    "--extract-audio",
    "--audio-format",
    normalizedFormat,
    "--no-keep-video",
    "-o",
    `${SCOUT_PATH}\\%(title)s.%(ext)s`,
    item.url
  ];

  event?.sender?.send("download-progress", {
    title: item.title || "RAD X",
    progress: 10,
    status: "starting"
  });

  return await new Promise((resolve) => {
    execFile(YT_DLP_PATH, downloadArgs, { encoding: "utf8" }, (error) => {
      if (error) {
        resolve({
          success: false,
          error: error.message,
          progress: 0,
          status: "error"
        });
        return;
      }

      const resolvedFile = getNewestAudioFile(SCOUT_PATH);
      const savedTrack = addTrack({
        title: item.title || path.basename(resolvedFile || "downloaded-track", path.extname(resolvedFile || ".mp3")),
        channel: item.channel || "Unknown",
        genre: item.genre || "Techno",
        url: item.url,
        localPath: resolvedFile || SCOUT_PATH,
        duration: item.duration || "0:00",
        downloadDate: new Date().toISOString(),
        score: item.score || 0,
        listened: false,
        favorite: false,
        source: item.source || "queue"
      });

      event?.sender?.send("download-progress", {
        title: item.title || "RAD X",
        progress: 100,
        status: "complete",
        file: savedTrack.localPath
      });

      resolve({
        success: true,
        file: savedTrack.localPath,
        progress: 100,
        status: "complete",
        track: savedTrack
      });
    });
  });
}

function createWindow() {
  const win = new BrowserWindow({
    width: 1400,
    height: 900,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  win.loadURL("http://localhost:5173");
}

ipcMain.handle("scan-music", async () => {
  try {
    const files = scanDirectory(MUSIC_PATH);
    return {
      success: true,
      count: files.length,
      path: MUSIC_PATH,
      files
    };
  } catch (error) {
    return {
      success: false,
      error: String(error)
    };
  }
});

ipcMain.handle("hunter-search", async (_, query) => {
  if (!query || !String(query).trim()) {
    return { success: false, error: "Consulta vacía." };
  }

  return await new Promise((resolve) => {
    execFile(
      YT_DLP_PATH,
      [
        `ytsearch10:${query}`,
        "--print",
        "%(title)s|||%(channel)s|||%(duration_string)s|||%(webpage_url)s|||%(upload_date)s"
      ],
      { encoding: "utf8" },
      (error, stdout) => {
        if (error) {
          resolve({ success: false, error: error.message });
          return;
        }

        const results = stdout
          .split("\n")
          .filter(Boolean)
          .map((line) => {
            const parts = line.split("|||");
            return {
              title: parts[0] || "",
              channel: parts[1] || "",
              duration: parts[2] || "0:00",
              url: parts[3] || "",
              uploadDate: parts[4] || "",
              score: estimateScore({ title: parts[0], channel: parts[1], duration: parts[2], uploadDate: parts[4] })
            };
          })
          .filter((item) => item.url)
          .filter((item, index, list) => list.findIndex((candidate) => candidate.url === item.url) === index);

        resolve({ success: true, results });
      }
    );
  });
});

ipcMain.handle("get-queue", async () => ({ success: true, queue: loadQueue() }));

ipcMain.handle("add-to-queue", async (_, item) => {
  try {
    const queue = loadQueue();
    const hasSameUrl = queue.some((entry) => entry.url === item.url);

    if (!hasSameUrl) {
      queue.push({
        title: item.title || "Untitled",
        channel: item.channel || "Unknown",
        duration: item.duration || "0:00",
        url: item.url || "",
        genre: item.genre || "Techno",
        format: normalizeFormat(item.format || "mp3"),
        source: item.source || "manual"
      });
      saveQueue(queue);
    }

    return { success: true, count: loadQueue().length };
  } catch (error) {
    return { success: false, error: String(error) };
  }
});

ipcMain.handle("run-scout", async () => {
  try {
    const results = await runScoutSearch();
    return { success: true, count: results.length, results };
  } catch (error) {
    return { success: false, error: String(error) };
  }
});

ipcMain.handle("get-library", async () => ({ success: true, tracks: loadTracks() }));

ipcMain.handle("download-track", async (event, item, options = {}) => {
  try {
    const format = normalizeFormat(options.format || item?.format || "mp3");
    const result = await downloadTrack(event, item, format);

    if (!result.success && result.error === "La pista ya está en cola.") {
      return result;
    }

    return result;
  } catch (error) {
    return { success: false, error: String(error) };
  }
});

ipcMain.handle("process-queue", async (event) => {
  try {
    return await processQueueItems(event);
  } catch (error) {
    return { success: false, error: String(error), processed: 0, failed: 0 };
  }
});

ipcMain.handle("run-rad-x", async (event) => {
  try {
    const scoutResults = await runScoutSearch();
    const queuedItems = scoutResults.slice(0, 8).map((item) => ({
      title: item.title,
      channel: item.channel,
      duration: item.duration,
      url: item.url,
      genre: item.genre,
      format: "mp3",
      source: "scout"
    }));

    const existingQueue = loadQueue();
    const queueNow = [...existingQueue];

    for (const item of queuedItems) {
      const alreadyQueued = queueNow.some((queuedItem) => queuedItem.url === item.url);
      const alreadyDownloaded = findTrackByUrl(item.url);

      if (!alreadyQueued && !alreadyDownloaded) {
        queueNow.push(item);
      }
    }

    saveQueue(queueNow);

    const queueProcessing = await processQueueItems(event);
    const tracks = loadTracks();

    return {
      success: true,
      scoutCount: scoutResults.length,
      queued: queuedItems.length,
      processed: queueProcessing.processed,
      failed: queueProcessing.failed,
      libraryCount: tracks.length,
      report: {
        scout: scoutResults.slice(0, 8),
        processedCount: queueProcessing.processed,
        failedCount: queueProcessing.failed
      }
    };
  } catch (error) {
    return { success: false, error: String(error) };
  }
});

ipcMain.handle("open-track-folder", async (_, track) => {
  try {
    const folderPath = track?.localPath ? path.dirname(track.localPath) : SCOUT_PATH;
    const folder = fs.existsSync(folderPath) ? folderPath : SCOUT_PATH;
    await shell.openPath(folder);
    return { success: true, path: folder };
  } catch (error) {
    return { success: false, error: String(error) };
  }
});

ipcMain.handle("delete-track", async (_, track) => {
  try {
    const trackUrl = track?.url || track?.localPath || "";
    const existing = findTrackByUrl(trackUrl);

    if (existing && existing.localPath && fs.existsSync(existing.localPath)) {
      fs.unlinkSync(existing.localPath);
    }

    removeTrack(trackUrl);
    return { success: true, deleted: true };
  } catch (error) {
    return { success: false, error: String(error) };
  }
});

ipcMain.handle("favorite-track", async (_, track) => {
  try {
    const tracks = loadTracks();
    const index = tracks.findIndex((item) => item.url === track.url);

    if (index >= 0) {
      tracks[index].favorite = !tracks[index].favorite;
      saveTracks(tracks);
      return { success: true, favorite: tracks[index].favorite };
    }

    return { success: false, error: "Pista no encontrada" };
  } catch (error) {
    return { success: false, error: String(error) };
  }
});

app.whenReady().then(() => {
  createWindow();
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});
