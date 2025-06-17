import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App-minimal.tsx";

// Debug logging
console.log('Main.tsx: Starting execution');
console.log('Main.tsx: App imported:', !!App);
import "./index.css";

try {
  console.log('Main.tsx: Attempting to get root element');
  const rootElement = document.getElementById("root");
  console.log('Main.tsx: Root element found:', !!rootElement);
  
  if (rootElement) {
    console.log('Main.tsx: Creating React root');
    const root = ReactDOM.createRoot(rootElement);
    console.log('Main.tsx: React root created');
    
    console.log('Main.tsx: Rendering App');
    root.render(
      <React.StrictMode>
        <App />
      </React.StrictMode>
    );
    console.log('Main.tsx: App rendered successfully');
  }
} catch (error) {
  console.error('Main.tsx: Error during mounting:', error);
}