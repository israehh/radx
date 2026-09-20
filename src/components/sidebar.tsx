import { Link } from "react-router-dom";

function Sidebar() {
  return (
    <div className="sidebar">
      <h2>RAD X</h2>

      <nav>
        <Link to="/">
          🏠 Dashboard
        </Link>

        <Link to="/hunter">
          🔎 Hunter
        </Link>

        <Link to="/scout">
          🤖 Scout
        </Link>

        <Link to="/library">
          🎧 Biblioteca
        </Link>

        <Link to="/queue">
          🎵 Cola
        </Link>

        <Link to="/settings">
          ⚙️ Configuración
        </Link>
      </nav>
    </div>
  );
}

export default Sidebar;