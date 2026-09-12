import type { SmsSender } from "./sender";

export class CallProSms implements SmsSender {
  constructor(
    private apiKey: string,
    private from: string,
    private endpoint: string,
  ) {}

  async send(toE164: string, text: string): Promise<void> {
    const nationalNumber = toE164.replace("+976", "");
    const res = await fetch(this.endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": this.apiKey,
      },
      body: JSON.stringify({ from: this.from, to: nationalNumber, text }),
    });
    if (!res.ok) {
      throw new Error(`CallPro SMS failed: ${res.status} ${await res.text()}`);
    }
  }
}
