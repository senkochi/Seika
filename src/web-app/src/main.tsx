import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { Provider } from "react-redux";
import "./index.css";
import "./i18n"; // side-effect: init i18next before render
import App from "./App";
import { store } from "./store";
import { setupAuthInterceptor } from "./api/client";
import { logout, setCredentials } from "./store/authSlice";

// Kết nối interceptor auto-refresh token với Redux store.
// Phải gọi trước khi render để interceptor có thể dispatch actions.
setupAuthInterceptor({
  dispatch: store.dispatch,
  logout,
  setCredentials,
});

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <Provider store={store}>
      <App />
    </Provider>
  </StrictMode>,
);
