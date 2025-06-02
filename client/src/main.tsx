import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { AuthProvider } from "react-oidc-context";

// Use production URL for authentication since dev URLs are dynamic
const getRedirectUri = () => {
  // Check if we're on the custom domain
  if (window.location.hostname === 'tomriddelsdell.com' || window.location.hostname === 'www.tomriddelsdell.com') {
    return window.location.origin + '/';
  }
  // In production, use the configured domain
  if (window.location.hostname.includes('tomriddelsdell.replit.app')) {
    return 'https://tomriddelsdell.replit.app/';
  }
  // For development, we'll need to deploy to test authentication
  return 'https://tomriddelsdell.replit.app/';
};

const cognitoAuthConfig = {
  authority: "https://eu-west-2g2bs4xiwn.auth.eu-west-2.amazoncognito.com",
  client_id: "483n96q9sudb248kp2sgto7i47",
  redirect_uri: getRedirectUri(),
  post_logout_redirect_uri: getRedirectUri(),
  response_type: "code",
  scope: "email openid phone",
  automaticSilentRenew: false,
  loadUserInfo: true,
  extraQueryParams: {
    response_mode: "query"
  }
};

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

createRoot(document.getElementById("root")!).render(
  <AuthProvider {...cognitoAuthConfig}>
    <App />
  </AuthProvider>
);
