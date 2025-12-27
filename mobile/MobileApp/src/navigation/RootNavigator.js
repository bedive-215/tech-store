// File: src/navigation/RootNavigator.jsx
import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

// Auth
import LoginScreen from "../screens/auth/LoginScreen";
import RegisterScreen from "../screens/auth/RegisterScreen";
import ForgotPassword from "../screens/auth/ForgotPassword";

// Main
import ProductScreen from "../screens/home/ProductScreen";
import CartScreen from "../screens/home/CartScreen";
import OrdersScreen from "../screens/home/OrdersScreen";

// User
import CustomerInfoScreen from "../screens/home/CustomerInfoScreen";

// Bottom Tab Navigator
import BottomTabNavigator from "./BottomTabNavigator";

const Stack = createNativeStackNavigator();

export default function RootNavigator() {
  return (
    <Stack.Navigator
      initialRouteName="Login"
      screenOptions={{ headerShown: false }}
    >
      {/* Auth Screens */}
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Register" component={RegisterScreen} />
      <Stack.Screen name="ForgotPassword" component={ForgotPassword} />

      {/* Main App with Bottom Tabs */}
      <Stack.Screen name="MainApp" component={BottomTabNavigator} />

      {/* Detail Screens (Stack trên Tab) */}
      <Stack.Screen name="Product" component={ProductScreen} />
      <Stack.Screen name="Cart" component={CartScreen} />
      <Stack.Screen name="CustomerInfo" component={CustomerInfoScreen} />
      <Stack.Screen name="Orders" component={OrdersScreen} />
      
      {/* 
        Tạm thời giữ UserHome để tương thích với code cũ
        TODO: Sửa tất cả navigation.navigate('UserHome') thành 'MainApp'
      */}
      <Stack.Screen 
        name="UserHome" 
        component={BottomTabNavigator}
        options={{ headerShown: false }}
      />
    </Stack.Navigator>
  );
}