import type { FastifyInstance } from "fastify";

/** Live captain draft channel. */
export async function registerDraftWs(app: FastifyInstance) {
  app.get("/ws/draft/:matchId", { websocket: true }, (socket, request) => {
    const { matchId } = request.params as { matchId: string };
    socket.send(JSON.stringify({ type: "connected", channel: "draft", matchId }));
  });
}
