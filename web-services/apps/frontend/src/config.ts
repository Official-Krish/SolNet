export const BACKEND_URL =
  import.meta.env.VITE_BACKEND_URL || "http://localhost:3000/api/v2";
export const SECRET_KEY: string =
  import.meta.env.VITE_SECRET_KEY || "your-secret-key";
export const ADMIN_KEY = import.meta.env.VITE_ADMIN_KEY || "your-admin-key";
export const WS_RELAYER_URL =
  import.meta.env.VITE_WS_RELAYER_URL || "ws://localhost:9093";
export const DEPIN_WORKER =
  import.meta.env.VITE_DEPIN_WORKER || "http://localhost:6000";
