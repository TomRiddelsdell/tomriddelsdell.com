import React from "react";
import ReactDOM from "react-dom/client";

console.log('Debug: Starting main-debug.tsx');
console.log('Debug: React imported:', !!React);
console.log('Debug: ReactDOM imported:', !!ReactDOM);

// Very simple component
function SimpleApp() {
  console.log('Debug: SimpleApp rendering');
  return React.createElement('div', {}, 'Hello from React!');
}

try {
  console.log('Debug: Getting root element');
  const rootElement = document.getElementById("root");
  console.log('Debug: Root element found:', !!rootElement);
  
  if (rootElement) {
    console.log('Debug: Creating React root');
    const root = ReactDOM.createRoot(rootElement);
    console.log('Debug: React root created:', !!root);
    
    console.log('Debug: Attempting to render');
    root.render(React.createElement(SimpleApp));
    console.log('Debug: Render called successfully');
  } else {
    console.error('Debug: Root element not found');
  }
} catch (error) {
  console.error('Debug: Error during mounting:', error);
}