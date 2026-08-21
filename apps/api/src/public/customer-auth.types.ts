export interface CustomerAccessTokenPayload {
  sub: string;
  sid: string;
}

export interface CustomerAuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface CustomerContext {
  tenantId: string;
  userId: string;
  customerId: string;
  customerName: string;
}
