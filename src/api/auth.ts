import { apiRequest } from './client';

/** Raw response from POST /api/BankIdAuth/start */
interface StartBankIdRawResponse {
  InProgress: boolean;
  BankIdData: {
    SignId: string;
    AutoStartToken: string;
    QRStartToken: string;
    Time: string;
    QRAuthCode: string;
  };
  LoginInfo: null;
}

/** Normalized start response */
export interface StartBankIdResponse {
  signId: string;
  autoStartToken: string;
  qrStartToken: string;
  qrTime: string;
  qrAuthCode: string;
}

/** Raw response from GET /api/BankIdAuth/jwt/{signId} when still pending */
interface PollPendingRawResponse {
  InProgress: true;
  BankIdData: {
    SignId: string;
    AutoStartToken: string;
    QRStartToken: string;
    Time: string;
    QRAuthCode: string;
  };
  LoginInfo: null;
}

/** Raw response when auth is complete */
interface PollCompleteRawResponse {
  InProgress: false;
  BankIdData: null;
  LoginInfo: {
    AuthTokens: {
      AccessToken: string;
      RefreshToken: string;
    };
    PersonId: number;
    Name: string;
  };
}

type PollRawResponse = PollPendingRawResponse | PollCompleteRawResponse;

export interface PollPendingResponse {
  status: 'pending';
  qrStartToken: string;
  qrTime: string;
  qrAuthCode: string;
}

export interface PollCompleteResponse {
  status: 'complete';
  jwt: string;
  employeeId?: number;
  name?: string;
}

export type PollResponse = PollPendingResponse | PollCompleteResponse;

export async function startBankId(): Promise<StartBankIdResponse> {
  const raw = await apiRequest<StartBankIdRawResponse>('/BankIdAuth/start', {
    method: 'POST',
  });
  return {
    signId: raw.BankIdData.SignId,
    autoStartToken: raw.BankIdData.AutoStartToken,
    qrStartToken: raw.BankIdData.QRStartToken,
    qrTime: raw.BankIdData.Time,
    qrAuthCode: raw.BankIdData.QRAuthCode,
  };
}

export async function pollJwt(signId: string): Promise<PollResponse> {
  const raw = await apiRequest<PollRawResponse>(`/BankIdAuth/jwt/${signId}`);

  if (!raw.InProgress && raw.LoginInfo) {
    return {
      status: 'complete',
      jwt: raw.LoginInfo.AuthTokens.AccessToken,
      employeeId: raw.LoginInfo.PersonId,
      name: raw.LoginInfo.Name,
    };
  }

  const pending = raw as PollPendingRawResponse;
  return {
    status: 'pending',
    qrStartToken: pending.BankIdData.QRStartToken,
    qrTime: pending.BankIdData.Time,
    qrAuthCode: pending.BankIdData.QRAuthCode,
  };
}
