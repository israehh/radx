import { BrowserRouter, Routes, Route } from "react-router-dom";

import Sidebar from "./components/sidebar";

import Dashboard from "./pages/dashboard";
import Hunter from "./pages/hunter";
import Scout from "./pages/Scout";
import Library from "./pages/library";
import Queue from "./pages/Queue";
import Settings from "./pages/settings";

import "./App.css";

function App() {
  return (
    <BrowserRouter>
      <div className="layout">
        <Sidebar />

        <div className="content">
          <Routes>
            <Route
              path="/"
              element={<Dashboard />}
            />

            <Route
              path="/hunter"
              element={<Hunter />}
            />

            <Route
              path="/scout"
              element={<Scout />}
            />

            <Route
              path="/library"
              element={<Library />}
            />

            <Route
              path="/queue"
              element={<Queue />}
            />

            <Route
              path="/settings"
              element={<Settings />}
            />
          </Routes>
        </div>
      </div>
    </BrowserRouter>
  );
}

export default App;