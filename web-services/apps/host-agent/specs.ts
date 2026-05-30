import { execSync } from "child_process";
import { cpus, totalmem, platform, type } from "os";

export interface SystemSpecs {
  os: string;
  cpu_cores: number;
  ram_gb: number;
  disk_gb: number;
  ip_address: string;
}

export function collectSpecs(): SystemSpecs {
  return {
    os: `${type()}-${platform()}`,
    cpu_cores: cpus().length,
    ram_gb: Math.floor(totalmem() / 1024 / 1024 / 1024),
    disk_gb: getDiskGB(),
    ip_address: getPublicIP(),
  };
}

function getDiskGB(): number {
  try {
    if (platform() === "win32") {
      const out = execSync("wmic logicaldisk get size", { encoding: "utf-8" });
      const sizes = out.split("\n").filter((l) => /^\d+/.test(l.trim()));
      return Math.floor(Number(sizes[0]?.trim()) / 1024 / 1024 / 1024) || 100;
    }
    const out = execSync("df -k / | tail -1", { encoding: "utf-8" });
    const parts = out.trim().split(/\s+/);
    return Math.floor(Number(parts[1]) / 1024 / 1024) || 100;
  } catch {
    return 100;
  }
}

function getPublicIP(): string {
  try {
    return execSync("curl -s --connect-timeout 5 ifconfig.me", {
      encoding: "utf-8",
    }).trim();
  } catch {
    return "127.0.0.1";
  }
}
