interface TunnelInfo {
  tunnelId: string;
  tunnelToken: string;
  credentials: Record<string, unknown>;
}

interface DNSRecord {
  id: string;
  name: string;
}

const CF_API = "https://api.cloudflare.com/client/v4";

function headers(token: string) {
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };
}

export function getCloudflareAPI() {
  const token = process.env.CLOUDFLARE_API_TOKEN;
  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
  const zoneId = process.env.CLOUDFLARE_ZONE_ID;
  const domain = process.env.CLOUDFLARE_DOMAIN || "krishlabs.tech";

  if (!token || !accountId || !zoneId) {
    throw new Error(
      "Cloudflare API token, account ID, and zone ID must be set in environment variables.",
    );
  }

  async function createTunnel(hostMachineId: string): Promise<TunnelInfo> {
    const name = `depin-host-${hostMachineId}`;
    const res = await fetch(`${CF_API}/accounts/${accountId}/cfd_tunnel`, {
      method: "POST",
      headers: headers(token!),
      body: JSON.stringify({ name, config_src: "local" }),
    });
    const body = (await res.json()) as {
      success: boolean;
      result: {
        id: string;
        tunnel_token?: string;
        credentials?: Record<string, unknown>;
      };
    };
    if (!body.success)
      throw new Error(`Failed to create tunnel: ${JSON.stringify(body)}`);

    const tunnelId = body.result.id;
    const tokenRes = await fetch(
      `${CF_API}/accounts/${accountId}/cfd_tunnel/${tunnelId}/token`,
      { headers: headers(token!) },
    );
    const tokenBody = (await tokenRes.json()) as {
      success: boolean;
      result: string;
    };
    if (!tokenBody.success)
      throw new Error(
        `Failed to get tunnel token: ${JSON.stringify(tokenBody)}`,
      );

    return {
      tunnelId,
      tunnelToken: tokenBody.result,
      credentials: body.result.credentials || {},
    };
  }

  async function deleteTunnel(tunnelId: string): Promise<void> {
    await fetch(`${CF_API}/accounts/${accountId}/cfd_tunnel/${tunnelId}`, {
      method: "DELETE",
      headers: headers(token!),
    });
  }

  async function createDNSRecord(
    subdomain: string,
    tunnelId: string,
  ): Promise<DNSRecord> {
    const name = `${subdomain}-depin`;
    const content = `${tunnelId}.cfargotunnel.com`;
    const res = await fetch(`${CF_API}/zones/${zoneId}/dns_records`, {
      method: "POST",
      headers: headers(token!),
      body: JSON.stringify({
        type: "CNAME",
        name,
        content,
        proxied: true,
        ttl: 1,
      }),
    });
    const body = (await res.json()) as {
      success: boolean;
      result: { id: string; name: string };
    };
    if (!body.success)
      throw new Error(`Failed to create DNS record: ${JSON.stringify(body)}`);
    return { id: body.result.id, name: body.result.name };
  }

  async function deleteDNSRecord(subdomain: string): Promise<void> {
    const name = `${subdomain}-depin.${domain}`;
    const listRes = await fetch(
      `${CF_API}/zones/${zoneId}/dns_records?name=${encodeURIComponent(name)}`,
      { headers: headers(token!) },
    );
    const listBody = (await listRes.json()) as {
      success: boolean;
      result: { id: string }[];
    };
    if (!listBody.success || listBody.result.length === 0) return;
    await fetch(
      `${CF_API}/zones/${zoneId}/dns_records/${listBody.result[0].id}`,
      { method: "DELETE", headers: headers(token!) },
    );
  }

  return {
    createTunnel,
    deleteTunnel,
    createDNSRecord,
    deleteDNSRecord,
    domain,
  };
}

export type CloudflareAPI = ReturnType<typeof getCloudflareAPI>;
