import type { FastifyInstance } from "fastify";
import type { WebSocket } from "ws";
import { z } from "zod";
import { loadSessionUser } from "../modules/auth/authenticate";
import { assertRoomMember } from "../modules/lobby/commands";
import { loadRoomCore, personalizeRoom, roomMessage, type RoomCore } from "../modules/lobby/snapshot";

const paramsSchema = z.object({ id: z.string().uuid() });

export async function registerRoomWs(app: FastifyInstance) {
  const rooms = new Map<string, Set<{ socket: WebSocket; userId: string }>>();

  const subscriber = app.redis.duplicate();
  subscriber.on("error", (err) => {
    app.log.warn({ err }, "lobby room subscriber error");
  });
  subscriber.on("pmessage", (_pattern, channel: string, payload: string) => {
    const prefix = "lobby:";
    if (!channel.startsWith(prefix)) return;
    const lobbyId = channel.slice(prefix.length);
    const sockets = rooms.get(lobbyId);
    if (!sockets || sockets.size === 0) return;
    let core: RoomCore;
    try {
      core = JSON.parse(payload) as RoomCore;
    } catch {
      return;
    }
    for (const entry of sockets) {
      if (entry.socket.readyState === entry.socket.OPEN) {
        entry.socket.send(roomMessage(personalizeRoom(core, entry.userId)));
      }
    }
  });
  subscriber.psubscribe("lobby:*").catch((err: unknown) => {
    app.log.error({ err }, "lobby room psubscribe failed");
  });
  app.addHook("onClose", async () => {
    subscriber.disconnect();
  });

  app.get(
    "/ws/lobbies/:id",
    { websocket: true, preValidation: [loadSessionUser] },
    async (socket, request) => {
      const params = paramsSchema.safeParse(request.params);
      if (!params.success) {
        socket.close(1008);
        return;
      }
      const lobbyId = params.data.id;
      const userId = request.user.id;
      try {
        await assertRoomMember(app.db, lobbyId, userId);
      } catch {
        socket.close(1008);
        return;
      }

      const entry = { socket, userId };
      const set = rooms.get(lobbyId) ?? new Set();
      set.add(entry);
      rooms.set(lobbyId, set);
      socket.on("close", () => {
        set.delete(entry);
        if (set.size === 0) rooms.delete(lobbyId);
      });

      try {
        const room = personalizeRoom(await loadRoomCore(app.db, lobbyId), userId);
        if (socket.readyState === socket.OPEN) socket.send(roomMessage(room));
      } catch (err) {
        app.log.warn({ err, lobbyId }, "lobby room initial snapshot failed");
        socket.close(1011);
      }
    },
  );
}
