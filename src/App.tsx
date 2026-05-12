import { Routes, Route, Navigate } from "react-router-dom";
import { useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "./lib/supabase";
import { MainLayout } from "./components/layout/MainLayout";
import Dashboard from "./pages/Dashboard";
import Publish from "./pages/Publish";
import Schedule from "./pages/Schedule";
import Settings from "./pages/Settings";
import Login from "./pages/Login";
import PwaInstallPopup from "./components/PwaInstallPopup";

function App() {
  const [session, setSession] = useState<Session | null | undefined>(undefined);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (session === undefined) {
    return null;
  }

  return (
    <>
      <Routes>
        <Route path="/login" element={session ? <Navigate to="/" replace /> : <Login />} />

        {session ? (
          <Route path="/" element={<MainLayout />}>
            <Route index element={<Dashboard />} />
            <Route path="publish" element={<Publish />} />
            <Route path="schedule" element={<Schedule />} />
            <Route path="settings" element={<Settings />} />
          </Route>
        ) : null}

        <Route
          path="*"
          element={session ? <Navigate to="/" replace /> : <Navigate to="/login" replace />}
        />
      </Routes>
      <PwaInstallPopup />
    </>
  );
}

export default App;