import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";
import { execSync } from "child_process";

function getAppVersion() {
  try {
    // Try to get version from git commit count
    const count = parseInt(execSync("git rev-list --count HEAD").toString().trim(), 10);
    return (1.0 + (count - 13) * 0.01).toFixed(2);
  } catch (error) {
    // Fallback to package.json version if not a git repo
    try {
      const packageJson = require('./package.json');
      return packageJson.version || "1.1.0";
    } catch {
      // Ultimate fallback
      return "1.1.0";
    }
  }
}

export default defineConfig({
  define: {
    __APP_VERSION__: JSON.stringify(getAppVersion()),
  },
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },
  server: {
    port: 5173,
    proxy: {
      "/api": "http://localhost:3000",
    },
  },
});
