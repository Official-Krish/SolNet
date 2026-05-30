import { readFileSync, writeFileSync, mkdirSync, existsSync } from "fs";
import { homedir } from "os";
import { join } from "path";

const CONFIG_DIR = join(homedir(), ".axion");
const CONFIG_FILE = join(CONFIG_DIR, "config.json");

export const WS_ENDPOINT = "wss://wss.depin.axion.krishlabs.tech";
export const API_ENDPOINT = "https://api.axion.krishlabs.tech/api/v2";

export interface AgentConfig {
  host_id: string;
  token: string;
  wallet: string;
  registered_at: string;
}

export function loadConfig(): AgentConfig {
  if (!existsSync(CONFIG_FILE)) {
    throw new Error(
      `Config not found at ${CONFIG_FILE}. Run 'axion register' first.`,
    );
  }
  return JSON.parse(readFileSync(CONFIG_FILE, "utf-8"));
}

export function saveConfig(config: AgentConfig): void {
  mkdirSync(CONFIG_DIR, { recursive: true });
  writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2), { mode: 0o600 });
}

export { CONFIG_DIR, CONFIG_FILE };
