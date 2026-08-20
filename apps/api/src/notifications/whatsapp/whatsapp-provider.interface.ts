export interface WhatsAppMessage {
  to: string;
  body: string;
}

export interface WhatsAppSendResult {
  success: boolean;
  providerMessageId?: string;
  error?: string;
}

export interface WhatsAppProvider {
  send(message: WhatsAppMessage): Promise<WhatsAppSendResult>;
}

export interface MetaSendContext {
  phoneNumberId: string;
  accessToken: string;
}

export interface TwilioSendContext {
  accountSid: string;
  authToken: string;
  fromNumber: string;
}

export interface EvolutionSendContext {
  instanceName: string;
}
