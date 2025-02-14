import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";
import { UpProvider } from "./context/UpProvider.tsx";

createRoot(document.getElementById("root")!).render(
  <UpProvider>
    <App />
  </UpProvider>
);
