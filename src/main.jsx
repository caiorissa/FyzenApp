import React from "react";
import ReactDOM from "react-dom/client";
import { MotionConfig } from "framer-motion";
import App from "./App";
import PersistentBackground from "@/components/PersistentBackground";
import "./components/index.css";
import { ToastProvider } from "./components/Toast";

class RootErrorBoundary extends React.Component {
  state = { error: null };

  static getDerivedStateFromError(error) {
    return { error };
  }

  render() {
    if (this.state.error) {
      return (
        <div
          style={{
            minHeight: "100vh",
            background: "#0a0d11",
            color: "#e8edf2",
            padding: 24,
            fontFamily: "system-ui",
          }}
        >
          <h1 style={{ fontSize: 18, marginBottom: 8 }}>
            Erro ao abrir o Fyzen
          </h1>
          <p style={{ color: "#8b9aab", fontSize: 14 }}>
            {String(this.state.error?.message || this.state.error)}
          </p>
          <button
            type="button"
            style={{
              marginTop: 16,
              padding: "10px 16px",
              background: "#4a9b8c",
              border: 0,
              borderRadius: 8,
              color: "#0a0d11",
              cursor: "pointer",
            }}
            onClick={() => window.location.reload()}
          >
            Recarregar
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

const rootEl = document.getElementById("root");
if (!rootEl) {
  throw new Error("Elemento #root não encontrado.");
}

ReactDOM.createRoot(rootEl).render(
  <RootErrorBoundary>
    <MotionConfig reducedMotion="user">
      <ToastProvider>
        <PersistentBackground />
        <App />
      </ToastProvider>
    </MotionConfig>
  </RootErrorBoundary>,
);
