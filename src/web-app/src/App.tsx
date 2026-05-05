import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { Suspense, lazy } from "react";
import NotFound from "./pages/not-found/NotFound";
import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";
import PageLoader from "./pages/loading/PageLoader";
import { Toaster } from "./components/ui/sonner";

const LandingPage = lazy(() => import("./pages/home/LandingPage"));

function App() {
  return (
    <>
      <Router>
        <Suspense fallback={<PageLoader />}>
          <Routes>
            <Route path="/" element={<Navigate to="/home" />} />
            <Route path="/home" element={<LandingPage />} />
            <Route path="/auth/login" element={<Login />} />
            <Route path="/auth/register" element={<Register />} />
            <Route path="/loading" element={<PageLoader />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </Router>
      <Toaster position="top-center" richColors duration={2000} />
    </>
  );
}

export default App;
