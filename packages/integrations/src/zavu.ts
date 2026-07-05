export type ZavuEscalationInput = {
  signature_request_id: string;
  jurisdiction: "SV";
  reason: string;
  test?: boolean;
};

export type ZavuEscalationResult = {
  status: string;
  channel: string;
  zavu_message_id?: string;
  provider_mode: "live" | "simulated";
};

export async function escalateToZavu(input: ZavuEscalationInput, env = process.env): Promise<ZavuEscalationResult> {
  const endpoint = env.ZAVU_ESCALATE_URL || (env.ZAVU_BASE_URL ? `${env.ZAVU_BASE_URL.replace(/\/$/, "")}/escalate` : "");
  if (!endpoint) {
    return {
      status: "pending_human_review",
      channel: "simulated",
      zavu_message_id: `sim_${input.signature_request_id}`,
      provider_mode: "simulated"
    };
  }

  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      ...(env.ZAVU_API_KEY ? { authorization: `Bearer ${env.ZAVU_API_KEY}` } : {})
    },
    body: JSON.stringify(input)
  });

  if (!response.ok) {
    throw new Error(`ZAVU_ESCALATION_FAILED_${response.status}`);
  }

  const body = (await response.json().catch(() => ({}))) as Partial<ZavuEscalationResult>;
  return {
    status: body.status || "pending_human_review",
    channel: body.channel || "zavu",
    zavu_message_id: body.zavu_message_id,
    provider_mode: "live"
  };
}
