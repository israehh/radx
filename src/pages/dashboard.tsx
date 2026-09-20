import { useState } from "react";

function Dashboard() {
  const [report, setReport] = useState<string>("");
  const [running, setRunning] = useState(false);

  const handleRunRadx = async () => {
    try {
      setRunning(true);
      const response = await window.radx.runRadx();

      if (response.success) {
        setReport(
          `Scout: ${response.scoutCount ?? 0}\nCola: ${response.queued ?? 0}\nProcesadas: ${response.processed ?? 0}\nFallidas: ${response.failed ?? 0}\nBiblioteca: ${response.libraryCount ?? 0}`
        );
      } else {
        setReport(response.error || "RAD X no pudo ejecutarse");
      }
    } catch (error) {
      setReport(String(error));
    }

    setRunning(false);
  };

  return (
    <div>
      <h1>RAD X Control Center</h1>

      <div className="stats-grid">
        <div className="stat-card">
          <h3>🤖 IA</h3>
          <p>Offline</p>
        </div>

        <div className="stat-card">
          <h3>🎤 Kokoro</h3>
          <p>Offline</p>
        </div>

        <div className="stat-card">
          <h3>🔎 Hunter</h3>
          <p>0 pistas</p>
        </div>

        <div className="stat-card">
          <h3>🎧 Biblioteca</h3>
          <p>0 tracks</p>
        </div>
      </div>

      <div className="welcome-card">
        <h2>Bienvenido a RAD X</h2>

        <p>
          Centro de control para Radikal Electronik.
        </p>

        <p>
          Desde aquí podrás gestionar Hunter, Biblioteca,
          IA, Locuciones y Automatizaciones.
        </p>

        <button className="action-btn" onClick={() => void handleRunRadx()} disabled={running}>
          {running ? "⏳ Ejecutando RAD X..." : "🚀 RUN RAD X"}
        </button>

        {report ? <pre style={{ whiteSpace: "pre-wrap", marginTop: 16 }}>{report}</pre> : null}
      </div>
    </div>
  );
}

export default Dashboard;