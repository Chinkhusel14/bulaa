export interface SmsSender {
  send(toE164: string, text: string): Promise<void>;
}
