const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("radx", {
  ping: () => "RAD X ONLINE",

  scanMusic: () => ipcRenderer.invoke("scan-music"),

  searchHunter: (query) => ipcRenderer.invoke("hunter-search", query),

  addToQueue: (item) => ipcRenderer.invoke("add-to-queue", item),

  getQueue: () => ipcRenderer.invoke("get-queue"),

  downloadTrack: (item, options = {}) => ipcRenderer.invoke("download-track", item, options),

  processQueue: () => ipcRenderer.invoke("process-queue"),

  runScout: () => ipcRenderer.invoke("run-scout"),

  runRadx: () => ipcRenderer.invoke("run-rad-x"),

  getLibrary: () => ipcRenderer.invoke("get-library"),

  openTrackFolder: (track) => ipcRenderer.invoke("open-track-folder", track),

  deleteTrack: (track) => ipcRenderer.invoke("delete-track", track),

  favoriteTrack: (track) => ipcRenderer.invoke("favorite-track", track),

  onDownloadProgress: (callback) => ipcRenderer.on("download-progress", (_, payload) => callback(payload))
});