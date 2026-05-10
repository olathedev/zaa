export type TwilioWhatsAppWebhookPayload = {
  MessageSid?: string;
  SmsMessageSid?: string;
  AccountSid?: string;
  From?: string;
  To?: string;
  Body?: string;
  ButtonText?: string;
  ButtonPayload?: string;
  ListId?: string;
  ListTitle?: string;
  FlowData?: string;
  InteractiveData?: string;
  ProfileName?: string;
  WaId?: string;
  NumMedia?: string;
  [key: string]: string | undefined;
};

export type NormalizedWhatsAppMessage = {
  provider: "twilio";
  messageId: string;
  from: string;
  to: string;
  body: string;
  buttonText?: string;
  buttonPayload?: string;
  listId?: string;
  listTitle?: string;
  flowData?: string;
  interactiveData?: string;
  profileName?: string;
  whatsappId?: string;
  mediaCount: number;
  raw: TwilioWhatsAppWebhookPayload;
};
