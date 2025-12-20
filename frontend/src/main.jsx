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
              <ProductProvider>
                {/* ⭐ BỌC CartProvider ở đây để toàn app con (Product, Cart, Checkout, CustomerInfo...) có thể dùng useCart */}
                <CartProvider>
                  {/* ⭐ BỌC OrderProvider Ở NGOÀI CustomerInfo, Cart, Checkout,... */}
                  <OrderProvider>
                    {/* ⭐ BỌC FlashSaleProvider để useFlashSale có thể dùng ở toàn app (đặc biệt admin) */}
                    <FlashSaleProvider>
                      <App />
                    </FlashSaleProvider>
                  </OrderProvider>
                </CartProvider>
              </ProductProvider>
            </PaymentProvider>
          </UserProvider>
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  </React.StrictMode>
);
