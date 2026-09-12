import type { SmsSender } from "./sender";

export class ConsoleSms implements SmsSender {
  async send(toE164: string, text: string): Promise<void> {
    console.log(`[SMS:console] to=${toE164} text=${text}`);
  }
}
