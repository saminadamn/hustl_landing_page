import { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { auth } from "./lib/firebase";
import LandingPage from "./components/LandingPage";
import Dashboard from "./components/Dashboard";
import PoweredByBolt from "./components/PoweredByBolt";

function App() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((authUser) => {
      setUser(authUser);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0038FF]"></div>
      </div>
    );
  }

  return (
    <Router>
      <Toaster position="top-center" />
      <Routes>
        <Route path="/" element={user ? <Navigate to="/app" /> : <LandingPage />} />
        <Route path="/app" element={user ? <Dashboard /> : <Navigate to="/" />} />
      </Routes>
      <PoweredByBolt position="bottom-right" />
    </Router>
  );
}

export default App;