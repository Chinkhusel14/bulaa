import { LOBBIES_OPEN_CHANNEL } from "@bulaa/shared";
import type { FastifyInstance } from "fastify";
import type { WebSocket } from "ws";
import { loadSessionUser } from "../modules/auth/authenticate";
import { snapshotMessage } from "../modules/lobby/snapshot";

/** Live open-lobby list. Each message is a full snapshot of the public rows. */
export async function registerLobbiesWs(app: FastifyInstance) {
  const sockets = new Set<WebSocket>();

  // A subscribed ioredis connection cannot run normal commands, so it must not be app.redis.
  const subscriber = app.redis.duplicate();
  subscriber.on("error", (err) => {
    app.log.warn({ err }, "lobbies subscriber error");
  });
  subscriber.on("message", (_channel, payload: string) => {
    for (const socket of sockets) {
      if (socket.readyState === socket.OPEN) socket.send(payload);
    }
  });
  subscriber.subscribe(LOBBIES_OPEN_CHANNEL).catch((err: unknown) => {
    app.log.error({ err }, "lobbies subscribe failed");
  });
  app.addHook("onClose", async () => {
    subscriber.disconnect();
  });

  app.get(
    "/ws/lobbies",
    { websocket: true, preValidation: [loadSessionUser] },
    async (socket) => {
      sockets.add(socket);
      socket.on("close", () => sockets.delete(socket));
      try {
        const payload = await snapshotMessage(app.db);
        if (socket.readyState === socket.OPEN) socket.send(payload);
      } catch (err) {
        app.log.warn({ err }, "lobbies initial snapshot failed");
        socket.close(1011);
      }
    },
  );
}
