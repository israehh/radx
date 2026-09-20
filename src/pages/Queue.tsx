import { useEffect, useState } from "react";

import type { QueueItem } from "../types";

function Queue() {
  const [items, setItems] = useState<QueueItem[]>([]);
  const [downloading, setDownloading] = useState("");
  const [progressMap, setProgressMap] = useState<Record<string, number>>({});
  const [processing, setProcessing] = useState(false);

  const loadQueue = async () => {
    try {
      const response = await window.radx.getQueue();
      if (response.success) {
        setItems(response.queue || []);
      }
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    void loadQueue();

    window.radx.onDownloadProgress((payload) => {
      const key = payload.title || "radx-download";
      setProgressMap((previous) => ({ ...previous, [key]: payload.progress }));
    });
  }, []);

  const downloadTrack = async (item: QueueItem) => {
    try {
      setDownloading(item.url);
      const response = await window.radx.downloadTrack(item, { format: item.format || "mp3" });

      if (response.success) {
        alert(`Descarga completada\n\n${response.file || "Archivo listo"}`);
        await loadQueue();
      } else {
        alert(response.error || "No se pudo descargar la pista");
      }
    } catch (error) {
      console.error(error);
      alert(String(error));
    }

    setDownloading("");
  };

  const processQueue = async () => {
    try {
      setProcessing(true);
      const response = await window.radx.processQueue();

      if (response.success) {
        alert(`Cola procesada\n\nProcesadas: ${response.processed || 0}\nFallidas: ${response.failed || 0}`);
        await loadQueue();
      } else {
        alert(response.error || "Error al procesar la cola");
      }
    } catch (error) {
      console.error(error);
      alert(String(error));
    }

    setProcessing(false);
  };

  return (
    <div>
      <h1>🎵 COLA RAD X</h1>

      <div className="welcome-card">
        <h2>Pistas pendientes</h2>
        <p>Total: {items.length}</p>

        <button className="action-btn" onClick={() => void processQueue()} disabled={processing || items.length === 0}>
          {processing ? "⏳ Procesando..." : "🚀 Procesar cola"}
        </button>
      </div>

      {items.map((item, index) => (
        <div key={`${item.url}-${index}`} className="welcome-card">
          <h3>{item.title}</h3>
          <p>📺 {item.channel}</p>
          <p>⏱ {item.duration}</p>

          {progressMap[item.title] !== undefined && (
            <div>
              <p>Progreso: {progressMap[item.title]}%</p>
            </div>
          )}

          <p>
            <a href={item.url} target="_blank" rel="noreferrer">
              Abrir en YouTube
            </a>
          </p>

          <button
            className="action-btn"
            onClick={() => void downloadTrack(item)}
            disabled={downloading === item.url}
          >
            {downloading === item.url ? "⏳ Descargando..." : "⬇ Descargar"}
          </button>
        </div>
      ))}
    </div>
  );
}

export default Queue;