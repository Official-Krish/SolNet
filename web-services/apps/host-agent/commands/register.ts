import { createInterface } from "readline";
import { collectSpecs } from "../specs";
import { saveConfig, CONFIG_FILE, API_ENDPOINT } from "../config";

const rl = createInterface({ input: process.stdin, output: process.stdout });
const ask = (q: string): Promise<string> =>
  new Promise((r) => rl.question(q, r));

export async function register() {
  console.log("\n  Axion Host Registration\n");

  console.log("  Collecting system specs...");
  const specs = collectSpecs();
  console.log(`  OS:       ${specs.os}`);
  console.log(`  CPU:      ${specs.cpu_cores} cores`);
  console.log(`  RAM:      ${specs.ram_gb} GB`);
  console.log(`  Disk:     ${specs.disk_gb} GB`);
  console.log(`  IP:       ${specs.ip_address}\n`);

  const wallet = await ask("  Wallet address (public key): ");
  const key = await ask("  Registration key: ");

  if (!wallet || !key) {
    console.error("\n  Error: Wallet and key are required.");
    process.exit(1);
  }

  console.log("\n  Registering with Axion...");
  const url = `${API_ENDPOINT}/user/depin/depinVerification`;
  const body = {
    os: specs.os,
    cpu_cores: specs.cpu_cores,
    ram_gb: specs.ram_gb,
    disk_gb: specs.disk_gb,
    ip_address: specs.ip_address,
    wallet,
    key,
  };

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: res.statusText }));
      console.error(
        `\n  Registration failed: ${(err as any).error || res.statusText}`,
      );
      process.exit(1);
    }

    const data = (await res.json()) as { host_id: string; token: string };

    saveConfig({
      host_id: data.host_id,
      token: data.token,
      wallet,
      cpu: specs.cpu_cores,
      ram: specs.ram_gb,
      disk: specs.disk_gb,
      registered_at: new Date().toISOString(),
    });

    console.log(`\n  ✓ Registered successfully!`);
    console.log(`  Host ID: ${data.host_id}`);
    console.log(`  Config:  ${CONFIG_FILE}\n`);
  } catch (err: any) {
    console.error(`\n  Error: ${err.message}`);
    process.exit(1);
  } finally {
    rl.close();
  }
}
