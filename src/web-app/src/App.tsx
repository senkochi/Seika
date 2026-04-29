import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import LandingPage from "./pages/home/LandingPage";
import NotFound from "./pages/not-found/NotFound";
import Register from "./pages/auth/Register";
import { Toaster } from "./components/ui/sonner";

function App() {
  return (
    <>
      <Router>
        <Routes>
          <Route path="/" element={<Navigate to="/home" />} />
          <Route path="/home" element={<LandingPage />} />
          <Route path="/auth/register" element={<Register />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Router>
      <Toaster position="top-center" richColors duration={2000} />
    </>
  );
}

export default App;
