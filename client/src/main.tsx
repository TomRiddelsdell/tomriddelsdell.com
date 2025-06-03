import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

document.addEventListener("DOMContentLoaded", () => {
  const metaTag = document.createElement("meta");
  metaTag.name = "description";
  metaTag.content = 
    "FlowCreate - Create custom workflows between your favorite apps. Automate your content creation process with our easy-to-use platform.";
  document.head.appendChild(metaTag);

  const titleTag = document.createElement("title");
  titleTag.textContent = "FlowCreate - Automation for Content Creators";
  document.head.appendChild(titleTag);

  // Open Graph tags
  const ogTitleTag = document.createElement("meta");
  ogTitleTag.setAttribute("property", "og:title");
  ogTitleTag.content = "FlowCreate - Automation for Content Creators";
  document.head.appendChild(ogTitleTag);

  const ogDescTag = document.createElement("meta");
  ogDescTag.setAttribute("property", "og:description");
  ogDescTag.content = 
    "Create custom workflows between your favorite apps and automate your content creation process.";
  document.head.appendChild(ogDescTag);

  const ogTypeTag = document.createElement("meta");
  ogTypeTag.setAttribute("property", "og:type");
  ogTypeTag.content = "website";
  document.head.appendChild(ogTypeTag);
});

createRoot(document.getElementById("root")!).render(<App />);
