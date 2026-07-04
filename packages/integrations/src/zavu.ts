export interface ZavuEscalationInput {
  signature_request_id: string;
  jurisdiction: "SV";
  reason: string;
  test?: boolean;
}

export interface ZavuEscalationResult {
  status: string;
  channel: string;
  zavu_message_id: string;
  provider_mode: "live" | "simulated";
}

export interface ZavuClient {
  escalate(input: ZavuEscalationInput): Promise<ZavuEscalationResult>;
}

export interface ZavuClientOptions {
  baseUrl?: string;
  escalateUrl?: string;
  apiKey?: string;
  defaultChannel?: string;
  fetch?: typeof fetch;
}

interface ZavuResponse {
  status?: unknown;
  channel?: unknown;
  message_id?: unknown;
  zavu_message_id?: unknown;
}

export function createZavuClient(options: ZavuClientOptions = {}): ZavuClient {
  const endpoint = options.escalateUrl ?? joinUrl(options.baseUrl, "/escalate");
  const fetchImpl = options.fetch ?? fetch;
  const defaultChannel = options.defaultChannel ?? process.env.ZAVU_DEFAULT_CHANNEL ?? "whatsapp";
  const apiKey = options.apiKey ?? process.env.ZAVU_API_KEY;

  return {
    async escalate(input) {
      if (!endpoint) {
        return {
          status: "escalated",
          channel: defaultChannel,
          zavu_message_id: `msg_sim_${input.signature_request_id}`,
          provider_mode: "simulated",
        };
      }

      const headers: Record<string, string> = {
        "content-type": "application/json",
        "accept": "application/json",
      };
      if (apiKey) {
        headers.authorization = `Bearer ${apiKey}`;
      }

      const response = await fetchImpl(endpoint, {
        method: "POST",
        headers,
        body: JSON.stringify({
          ...input,
          channel: defaultChannel,
        }),
      });
      if (!response.ok) {
        throw new Error(`Zavu escalation failed with status ${response.status}`);
      }

      const body = await response.json() as ZavuResponse;
      return {
        status: stringOr(body.status, "queued"),
        channel: stringOr(body.channel, defaultChannel),
        zavu_message_id: stringOr(body.zavu_message_id, stringOr(body.message_id, `msg_live_${input.signature_request_id}`)),
        provider_mode: "live",
      };
    },
  };
}

export function createZavuClientFromEnv(env: NodeJS.ProcessEnv = process.env): ZavuClient {
  return createZavuClient({
    baseUrl: env.ZAVU_BASE_URL,
    escalateUrl: env.ZAVU_ESCALATE_URL,
    apiKey: env.ZAVU_API_KEY,
    defaultChannel: env.ZAVU_DEFAULT_CHANNEL,
  });
}

function joinUrl(baseUrl: string | undefined, path: string): string | undefined {
  if (!baseUrl) {
    return undefined;
  }
  return `${baseUrl.replace(/\/$/, "")}${path}`;
}

function stringOr(value: unknown, fallback: string): string {
  return typeof value === "string" && value.length > 0 ? value : fallback;
}
