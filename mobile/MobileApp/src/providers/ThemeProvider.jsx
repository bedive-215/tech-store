// src/contexts/ThemeContext.jsx
import React, { createContext, useState, useEffect, useContext } from "react";
import { Appearance } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

// ============================
// Context
// ============================
export const ThemeContext = createContext({
  theme: "light",
  toggleTheme: () => {},
});

// Hook tiện lợi
export const useTheme = () => {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
};

// ============================
// Provider
// ============================
export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState("light");

  // Load theme từ AsyncStorage hoặc hệ thống
  useEffect(() => {
    const loadTheme = async () => {
      try {
        const savedTheme = await AsyncStorage.getItem("theme");
        if (savedTheme) {
          setTheme(savedTheme);
        } else {
          const colorScheme = Appearance.getColorScheme(); // light/dark
          setTheme(colorScheme || "light");
        }
      } catch (err) {
        console.log("Không thể load theme:", err);
      }
    };
    loadTheme();
  }, []);

  // Toggle theme
  const toggleTheme = async () => {
    const nextTheme = theme === "light" ? "dark" : "light";
    setTheme(nextTheme);
    try {
      await AsyncStorage.setItem("theme", nextTheme);
    } catch (err) {
      console.log("Không thể lưu theme:", err);
    }
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};
