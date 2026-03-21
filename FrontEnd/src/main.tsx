import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom"; // Import this
import App from "./App.tsx";
import "./index.css";

createRoot(document.getElementById("root")!).render(
  // The basename MUST match the 'base' in your vite.config.ts
<BrowserRouter basename="/PriceSync"> 
    <App />
</BrowserRouter>
);