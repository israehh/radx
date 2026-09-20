import { useState } from "react";

interface ScoutResult {
  title: string;
  channel: string;
  duration: string;
  url: string;
  genre?: string;
}

function Scout() {
  const [results, setResults] =
    useState<ScoutResult[]>([]);

  const [loading, setLoading] =
    useState(false);

  const runScout = async () => {
    setLoading(true);

    try {
      const response =
        await window.radx.runScout();

      if (response.success) {
        setResults(
          response.results || []
        );
      } else {
        alert(
          response.error ||
          "Error Scout"
        );
      }
    } catch (err) {
      console.error(err);

      alert(
        "Error ejecutando Scout"
      );
    }

    setLoading(false);
  };

  const addToQueue = async (
    item: ScoutResult
  ) => {
    try {
      const response =
        await window.radx.addToQueue(
          item
        );

      if (response.success) {
        alert(
          `Añadido a Cola RAD X\n\nTotal cola: ${response.count}`
        );
      } else {
        alert(
          response.error
        );
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div>
      <h1>🤖 SCOUT</h1>

      <div className="welcome-card">
        <h2>
          Scout Automático
          Multi-Género
        </h2>

        <p>
          Industrial Techno ·
          Hard Techno ·
          Dark Techno ·
          Peak Time Techno ·
          Minimal Techno ·
          EBM ·
          Synthwave
        </p>

        <button
          className="action-btn"
          onClick={runScout}
        >
          🚀 Ejecutar Scout
        </button>
      </div>

      <div className="welcome-card">
        <h2>Resultados</h2>

        {loading && (
          <p>
            Scout trabajando...
          </p>
        )}

        {!loading && (
          <p>
            Resultados encontrados:
            {" "}
            <strong>
              {results.length}
            </strong>
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
                📺 Canal:
                {" "}
                <strong>
                  {item.channel}
                </strong>
              </p>

              <p>
                ⏱ Duración:
                {" "}
                {item.duration}
              </p>

              {item.genre && (
                <p>
                  🎵 Género:
                  {" "}
                  {item.genre}
                </p>
              )}

              <p>
                <a
                  href={item.url}
                  target="_blank"
                  rel="noreferrer"
                >
                  Abrir en YouTube
                </a>
              </p>

              <button
                className="action-btn"
                onClick={() =>
                  addToQueue(item)
                }
              >
                ➕ Añadir a Cola
              </button>
            </div>
          )
        )}
      </div>
    </div>
  );
}

export default Scout;