import type { FastifyInstance } from "fastify";
import { sweepDueLobbies } from "./commands";
import { publishOpenLobbies, publishRoom } from "./snapshot";

export function startLobbySweeper(app: FastifyInstance): () => void {
  const timer = setInterval(() => {
    sweepDueLobbies(app.db)
      .then(async (results) => {
        const seen = new Set<string>();
        let open = false;
        for (const result of results) {
          if (!seen.has(result.lobbyId)) {
            seen.add(result.lobbyId);
            await publishRoom(app, result.lobbyId);
          }
          if (result.publishOpen) open = true;
        }
        if (open) await publishOpenLobbies(app);
      })
      .catch((err: unknown) => {
        app.log.warn({ err }, "lobby sweep failed");
      });
  }, 1000);
  timer.unref();
  return () => clearInterval(timer);
}
