// src/main.jsx
import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";

import App from "@/App";
import "@/index.css";

// Providers
import { AuthProvider } from "@/providers/AuthProvider.jsx";
import { ThemeProvider } from "@/providers/ThemeProvider";
import  PaymentProvider  from "@/providers/PaymentProvider";
import UserProvider from "@/providers/UserProvider";
import ProductProvider from "@/providers/ProductProvider";
import { BrandProvider } from "@/providers/BrandProvider";
import { CategoryProvider } from "@/providers/CategoryProvider";


// 👉 THÊM ORDER PROVIDER
import { OrderProvider } from "@/providers/OrderProvider";

// NEW: FlashSaleProvider
import FlashSaleProvider from "@/providers/FlashSaleProvider";

// 🎯 NEW: CartProvider
import CartProvider from "@/providers/CartProvider";

console.log("🚀 Rendering App...");

const root = ReactDOM.createRoot(document.getElementById("root"));

root.render(
  <React.StrictMode>
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
  <UserProvider>
    <PaymentProvider>

      {/* ✅ THÊM 2 PROVIDER Ở ĐÂY */}
      <BrandProvider>
        <CategoryProvider>

          <ProductProvider>
            <CartProvider>
              <OrderProvider>
                <FlashSaleProvider>
                  <App />
                </FlashSaleProvider>
              </OrderProvider>
            </CartProvider>
          </ProductProvider>

        </CategoryProvider>
      </BrandProvider>

    </PaymentProvider>
  </UserProvider>
</AuthProvider>

      </ThemeProvider>
    </BrowserRouter>
  </React.StrictMode>
);
