import { RouterProvider } from "react-router-dom";

import { Toaster } from "./components/ui/sonner";
import { router } from "./routes";

function App() {
  return (
    <>
      <RouterProvider router={router} />
      <Toaster position="top-center" richColors duration={2000} />
    </>
  );
}

export default App;
