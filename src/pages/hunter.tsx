import { useState } from "react";

interface HunterResult {
  title: string;
  channel: string;
  duration: string;
  url: string;
}

function Hunter() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<HunterResult[]>([]);
  const [loading, setLoading] = useState(false);

  const search = async () => {
    if (!query.trim()) return;

    setLoading(true);

    try {
      const response =
        await window.radx.searchHunter(query);

      if (response.success) {
        setResults(response.results || []);
      } else {
        setResults([]);
        alert(response.error);
      }
    } catch (err) {
      console.error(err);
      setResults([]);
      alert(String(err));
    }

    setLoading(false);
  };

  const addToQueue = async (
    item: HunterResult
  ) => {
    try {
      const response =
        await window.radx.addToQueue(item);
        const downloadTrack = async (
  item: HunterResult
) => {
  try {

    const response =
      await window.radx.downloadTrack(
        item,
        {
          format: "mp3"
        }
      );

    if (response.success) {

      alert(
        "Descarga completada"
      );

    } else {

      alert(
        response.error
      );

    }

  } catch (err) {

    console.error(err);

    alert(
      String(err)
    );

  }
};

      if (response.success) {
        alert(
          `Añadido a Cola RAD X\n\nTotal: ${response.count}`
        );
      } else {
        alert(response.error);
      }
    } catch (err) {
      console.error(err);
      alert(String(err));
    }
  };

  const downloadTrack = async (
    item: HunterResult
  ) => {
    try {

      const response =
        await window.radx.downloadTrack(
          item,
          {
            format: "mp3"
          }
        );

      if (response.success) {

        alert(
          "Descarga completada"
        );

      } else {

        alert(
          response.error
        );

      }

    } catch (err) {

      console.error(err);

      alert(
        String(err)
      );

    }
  };

  return (
    <div>
      <h1>🎯 HUNTER</h1>

      <div className="welcome-card">
        <h2>
          Descubrimiento Musical
        </h2>

        <input
          type="text"
          placeholder="Industrial Techno"
          value={query}
          onChange={(e) =>
            setQuery(
              e.target.value
            )
          }
          style={{
            width: "100%",
            padding: "12px",
            borderRadius: "8px",
            border: "1px solid #444",
            marginBottom: "15px",
            background: "#222",
            color: "#fff"

          }}
        />

        <button
          className="action-btn"
          onClick={search}
        >
          🔍 Buscar
        </button>
      </div>

      <div className="welcome-card">
        <h2>Resultados</h2>

        {loading && (
          <p>Buscando...</p>
        )}

        {!loading &&
          results.length === 0 && (
            <p>
              No hay resultados.
            </p>
          )}

        {results.map(
          (item, index) => (
            <div
              key={index}
              style={{
                padding: "15px",
                marginBottom: "15px",
                borderBottom:
                  "1px solid #333"
              }}
            >
              <h3>
                {item.title}
              </h3>

              <p>
                📺 Canal:{" "}
                <strong>
                  {item.channel}
                </strong>
              </p>

              <p>
                ⏱ Duración:{" "}
                {item.duration}
              </p>

              <p>
                <a
                  href={item.url}
                  target="_blank"
                  rel="noreferrer"
                >
                  Abrir en YouTube
                </a>
              </p>

              <div
                style={{
                  display: "flex",
                  gap: "10px",
                  marginTop: "10px"
                }}
              >
                <button
                  className="action-btn"
                  onClick={() =>
                    addToQueue(item)
                  }
                >
                  ➕ Cola
                </button>
                <button
  className="action-btn"
  onClick={() =>
    downloadTrack(item)
  }
>
  ⬇ Descargar MP3
</button>
                <button
                  className="action-btn"
                  onClick={() =>
                    downloadTrack(
                      item
                    )
                  }
                >
                  ⬇ MP3
                </button>
              </div>
            </div>
          )
        )}
      </div>
    </div>
  );
}

export default Hunter;