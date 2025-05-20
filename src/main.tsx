import React from "react";
import ReactDOM from "react-dom/client";
import Home from "./Home";
import Login from './Login';
import { Amplify } from "aws-amplify";
import outputs from "../amplify_outputs.json";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Suspense } from 'react';
import AppStore from './AppStore';
import { availableApps, importCss as importCss } from './AppConfig';
import { AuthProvider } from './AuthContext';
import ProtectedRoute from './component/ProtectedRoute';
import { ThemeProvider } from '@mui/material/styles';
import theme from './Theme1'; // Import the custom theme

Amplify.configure(outputs);
importCss();

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ThemeProvider theme={theme}>
      <BrowserRouter>
        <AuthProvider>
          <Suspense fallback={<div>Loading...</div>}>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<Login />} />
              <Route path="/appstore" element={<ProtectedRoute element={<AppStore />}/>} />
              {availableApps.map((app) => {
                const Component = React.lazy(() => import(`.${app.path}`));
                return <Route key={app.link} path={app.link} element={<ProtectedRoute element={<Component />} />} />;
              })}
            </Routes>
          </Suspense>
        </AuthProvider>
      </BrowserRouter>
    </ThemeProvider>
  </React.StrictMode>
);