import { env } from "../../config/env.js";

export type InitiateDvaParams = {
  amountKobo: number;
  email: string;
  transactionRef: string;
  durationSeconds?: number;
};

export type SquadDvaData = {
  account_number: string;
  bank: string;
  amount: number;
  transaction_reference: string;
  expires_at?: string;
};

type SquadDvaResponse = {
  success?: boolean;
  status?: number;
  message?: string;
  data?: SquadDvaData;
  errors?: unknown;
};

export class SquadDvaError extends Error {
  status: number;
  responseBody: SquadDvaResponse;

  constructor(params: { status: number; responseBody: SquadDvaResponse }) {
    super(
      `Squad DVA creation failed: ${params.status} ${JSON.stringify(params.responseBody)}`,
    );
    this.name = "SquadDvaError";
    this.status = params.status;
    this.responseBody = params.responseBody;
  }
}

export async function initiateDynamicVirtualAccount(
  params: InitiateDvaParams,
): Promise<SquadDvaData> {
  if (!env.squad.secretKey) {
    throw new Error("SQUAD_SECRET_KEY is required");
  }

  const response = await fetch(
    `${env.squad.baseUrl}/virtual-account/initiate-dynamic-virtual-account`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.squad.secretKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        amount: params.amountKobo,
        email: params.email,
        transaction_ref: params.transactionRef,
        duration: params.durationSeconds ?? 86400,
      }),
    },
  );

  const body = (await response.json()) as SquadDvaResponse;

  if (!response.ok || body.success === false) {
    throw new SquadDvaError({ status: response.status, responseBody: body });
  }

  if (!body.data?.account_number) {
    throw new Error(`Squad DVA response missing account number: ${JSON.stringify(body)}`);
  }

  return body.data;
}
