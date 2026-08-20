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

export interface EvolutionSendContext {
  instanceName: string;
}
