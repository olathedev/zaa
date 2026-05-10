import { env } from "../../config/env.js";

export type CreateSquadVirtualAccountParams = {
  customerIdentifier: string;
  firstName: string;
  lastName: string;
  middleName: string;
  mobileNumber: string;
  dob: string;
  email: string;
  bvn: string;
  gender: "1" | "2";
  address: string;
};

export type SquadVirtualAccount = {
  first_name?: string;
  last_name?: string;
  bank_code?: string;
  virtual_account_number?: string;
  beneficiary_account?: string | null;
  customer_identifier?: string;
  created_at?: string;
  updated_at?: string;
};

type SquadResponse = {
  success?: boolean;
  status?: number | string;
  message?: string;
  data?: SquadVirtualAccount;
};

export async function createSquadVirtualAccount(
  params: CreateSquadVirtualAccountParams,
) {
  if (!env.squad.secretKey) {
    throw new Error("SQUAD_SECRET_KEY is required to create a virtual account");
  }

  if (!env.squad.beneficiaryAccount) {
    throw new Error("SQUAD_BENEFICIARY_ACCOUNT is required to create a virtual account");
  }

  const response = await fetch(`${env.squad.baseUrl}/virtual-account`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.squad.secretKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      customer_identifier: params.customerIdentifier,
      first_name: params.firstName,
      last_name: params.lastName,
      middle_name: params.middleName,
      mobile_num: params.mobileNumber,
      dob: params.dob,
      email: params.email,
      bvn: params.bvn,
      gender: params.gender,
      address: params.address,
      beneficiary_account: env.squad.beneficiaryAccount,
    }),
  });

  const responseBody = (await response.json()) as SquadResponse;

  if (!response.ok || responseBody.success === false) {
    throw new Error(
      `Squad virtual account creation failed: ${response.status} ${JSON.stringify(responseBody)}`,
    );
  }

  if (!responseBody.data?.virtual_account_number || !responseBody.data.customer_identifier) {
    throw new Error(`Squad virtual account response is missing account data`);
  }

  return responseBody.data;
}

