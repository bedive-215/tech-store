// src/main.jsx
import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";

import App from "@/App";
import "@/index.css";

import { AuthProvider } from "@/providers/AuthProvider.jsx";
import { ThemeProvider } from "@/providers/ThemeProvider";
import { PaymentProvider } from "@/providers/PaymentProvider"; 
import UserProvider from "@/providers/UserProvider"; 

console.log("🚀 Rendering App...");

const root = ReactDOM.createRoot(document.getElementById("root"));

root.render(
  <React.StrictMode>
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <UserProvider>
                  <PaymentProvider>
                    <App />
                  </PaymentProvider>
          </UserProvider>
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  </React.StrictMode>
);
