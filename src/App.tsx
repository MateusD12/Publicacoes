import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { MainLayout } from "./components/layout/MainLayout";
import Dashboard from "./pages/Dashboard";
import Publish from "./pages/Publish";
import Schedule from "./pages/Schedule";
import Settings from "./pages/Settings";
import PwaInstallPopup from "./components/PwaInstallPopup";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<MainLayout />}>
          <Route index element={<Dashboard />} />
          <Route path="publish" element={<Publish />} />
          <Route path="schedule" element={<Schedule />} />
          <Route path="settings" element={<Settings />} />
        </Route>
      </Routes>
      <PwaInstallPopup />
    </Router>
  );
}

export default App;