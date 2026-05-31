import React from "react";
import { NavigationContainer } from "@react-navigation/native";

import RootNavigator from "./src/navigation/RootNavigator";

import { AuthProvider } from "./src/providers/AuthProvider";
import { UserProvider } from "./src/providers/UserProvider";   // ✅ THÊM
import { CartProvider } from "./src/providers/CartProvider";
import { OrderProvider } from "./src/providers/OrderProvider";
import { ProductProvider } from "./src/providers/ProductProvider";
import { WarrantyProvider } from "./src/providers/WarrantyProvider";

export default function App() {
  return (
    <AuthProvider>
      <UserProvider> {/* ✅ BẮT BUỘC */}
        <CartProvider>
          <ProductProvider>
            <OrderProvider>
                <WarrantyProvider>
              <NavigationContainer>
                <RootNavigator />
              </NavigationContainer>
              </WarrantyProvider>
            </OrderProvider>
          </ProductProvider>
        </CartProvider>
      </UserProvider>
    </AuthProvider>
  );
}
