import type { FastifyInstance } from "fastify";
import { queuePartySizeSchema } from "@bulaa/shared";

/** Live matchmaking queue channel. */
export async function registerQueueWs(app: FastifyInstance) {
  app.get("/ws/queue", { websocket: true }, (socket) => {
    socket.send(JSON.stringify({ type: "connected", channel: "queue" }));

    socket.on("message", (raw) => {
      try {
        const data = JSON.parse(String(raw)) as { type?: string; partySize?: number };
        if (data.type === "enqueue") {
          const partySize = queuePartySizeSchema.parse(data.partySize ?? 1);
          socket.send(JSON.stringify({ type: "queued", partySize }));
          return;
        }
        socket.send(JSON.stringify({ type: "error", message: "unknown_message" }));
      } catch {
        socket.send(JSON.stringify({ type: "error", message: "invalid_payload" }));
      }
    });
  });
}
