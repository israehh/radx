import { useEffect, useMemo, useState } from "react";

import AudioPlayer from "../components/AudioPlayer";
import type { TrackRecord } from "../types";

function Library() {
  const [tracks, setTracks] = useState<TrackRecord[]>([]);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "favorite" | "downloaded">("all");
  const [sortKey, setSortKey] = useState<"title" | "artist" | "genre" | "duration" | "date" | "score">("date");
  const [selectedTrackIndex, setSelectedTrackIndex] = useState(0);

  const loadLibrary = async () => {
    try {
      const response = await window.radx.getLibrary();

      if (response.success) {
        setTracks(response.tracks || []);
      }
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    void loadLibrary();
  }, []);

  const filteredTracks = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();
    let filtered = [...tracks];

    if (normalizedSearch) {
      filtered = filtered.filter((track) =>
        [track.title, track.channel, track.genre].some((value) => value.toLowerCase().includes(normalizedSearch))
      );
    }

    if (filter === "favorite") {
      filtered = filtered.filter((track) => track.favorite);
    }

    if (sortKey === "title") {
      filtered.sort((left, right) => left.title.localeCompare(right.title));
    }

    if (sortKey === "artist") {
      filtered.sort((left, right) => left.channel.localeCompare(right.channel));
    }

    if (sortKey === "genre") {
      filtered.sort((left, right) => left.genre.localeCompare(right.genre));
    }

    if (sortKey === "duration") {
      filtered.sort((left, right) => Number(right.duration.split(":").reduce((total, part, index, array) => total + Number(part) * 60 ** (array.length - index - 1), 0)) - Number(left.duration.split(":").reduce((total, part, index, array) => total + Number(part) * 60 ** (array.length - index - 1), 0)));
    }

    if (sortKey === "date") {
      filtered.sort((left, right) => new Date(right.downloadDate).getTime() - new Date(left.downloadDate).getTime());
    }

    if (sortKey === "score") {
      filtered.sort((left, right) => right.score - left.score);
    }

    return filtered;
  }, [filter, search, sortKey, tracks]);

  const handlePlay = (track: TrackRecord) => {
    const index = filteredTracks.findIndex((item) => item.url === track.url);
    setSelectedTrackIndex(index >= 0 ? index : 0);
  };

  const handleOpenFolder = async (track: TrackRecord) => {
    try {
      const response = await window.radx.openTrackFolder(track);
      if (!response.success) {
        alert(response.error || "No se pudo abrir la carpeta");
      }
    } catch (error) {
      console.error(error);
    }
  };

  const handleDelete = async (track: TrackRecord) => {
    try {
      const response = await window.radx.deleteTrack(track);
      if (response.success) {
        await loadLibrary();
      } else {
        alert(response.error || "No se pudo borrar la pista");
      }
    } catch (error) {
      console.error(error);
    }
  };

  const handleFavorite = async (track: TrackRecord) => {
    try {
      const response = await window.radx.favoriteTrack(track);
      if (response.success) {
        await loadLibrary();
      } else {
        alert(response.error || "No se pudo marcar como favorito");
      }
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div>
      <h1>🎧 Biblioteca RAD X</h1>

      <div className="welcome-card">
        <h2>Archivo musical</h2>

        <div className="library-toolbar">
          <input
            type="text"
            placeholder="Buscar por título, artista o género"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            aria-label="Buscar biblioteca"
          />

          <select value={filter} onChange={(event) => setFilter(event.target.value as "all" | "favorite" | "downloaded")}>
            <option value="all">Todas</option>
            <option value="favorite">Favoritas</option>
            <option value="downloaded">Descargadas</option>
          </select>

          <select value={sortKey} onChange={(event) => setSortKey(event.target.value as "title" | "artist" | "genre" | "duration" | "date" | "score")}>
            <option value="date">Fecha</option>
            <option value="score">Puntuación</option>
            <option value="title">Título</option>
            <option value="artist">Artista</option>
            <option value="genre">Género</option>
            <option value="duration">Duración</option>
          </select>

          <button className="action-btn secondary" onClick={() => void loadLibrary()}>
            Refrescar
          </button>
        </div>

        <div className="stats-grid">
          <div className="stat-card">
            <h3>🎵 Total</h3>
            <p>{tracks.length}</p>
          </div>

          <div className="stat-card">
            <h3>📌 Mostradas</h3>
            <p>{filteredTracks.length}</p>
          </div>

          <div className="stat-card">
            <h3>⭐ Favoritas</h3>
            <p>{tracks.filter((track) => track.favorite).length}</p>
          </div>
        </div>
      </div>

      <AudioPlayer tracks={filteredTracks} initialTrackIndex={selectedTrackIndex} key={selectedTrackIndex} />

      <div className="welcome-card">
        <h2>Lista de pistas</h2>

        {filteredTracks.length === 0 ? (
          <p>No hay pistas para mostrar.</p>
        ) : (
          <table className="library-table">
            <thead>
              <tr>
                <th>Título</th>
                <th>Artista</th>
                <th>Género</th>
                <th>Duración</th>
                <th>Fecha</th>
                <th>Score</th>
                <th>Fav</th>
                <th>Acciones</th>
              </tr>
            </thead>

            <tbody>
              {filteredTracks.map((track) => (
                <tr key={`${track.url}-${track.title}`}>
                  <td>{track.title}</td>
                  <td>{track.channel}</td>
                  <td>{track.genre}</td>
                  <td>{track.duration}</td>
                  <td>{new Date(track.downloadDate).toLocaleDateString("es-ES")}</td>
                  <td>{track.score}</td>
                  <td>{track.favorite ? "★" : "☆"}</td>
                  <td>
                    <div className="library-actions">
                      <button className="action-btn secondary" onClick={() => handlePlay(track)}>
                        Play
                      </button>
                      <button className="action-btn secondary" onClick={() => void handleOpenFolder(track)}>
                        Open Folder
                      </button>
                      <button className="action-btn secondary" onClick={() => void handleFavorite(track)}>
                        Favorite
                      </button>
                      <button className="action-btn delete" onClick={() => void handleDelete(track)}>
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

export default Library;