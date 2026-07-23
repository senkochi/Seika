import { Toaster } from "./components/ui/sonner";
import AppRouter from "./routes";

function App() {
  return (
    <>
      <AppRouter />
      {/* Fixed grain overlay — breaks digital flatness (high-end-visual-design §4.C) */}
      <div aria-hidden className="grain-overlay" />
      <Toaster position="top-center" richColors duration={2000} />
    </>
  );
}

export default App;