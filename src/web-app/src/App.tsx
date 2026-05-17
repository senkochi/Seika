import { Toaster } from "./components/ui/sonner";
import AppRouter from "./routes";

function App() {
  return (
    <>
      <AppRouter />
      <Toaster position="top-center" richColors duration={2000} />
    </>
  );
}

export default App;
