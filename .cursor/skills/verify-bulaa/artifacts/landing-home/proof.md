# landing-home proof

- Feature ID: `landing-home`
- Entry point: `GET http://127.0.0.1:13100/` (verification front, not :3100)
- Doctor: `control-bulaa doctor` → ok; health `{"ok":true,"service":"backend"}`; auth `{"ready":false}`
- Viewport: desktop (Main nav and `Steam-ээр нэвтрэх` visible)

## Observations

- Document title `Bulaa — Paid CS2 5v5 Matchmaking`
- Heading `Төлбөртэй 5v5 matchmaking.`
- Header wordmark link `Bulaa`
- Button `Steam-ээр нэвтрэх` (inert; no href — not clicked in this run)
- Hero button `Find Match` and CTA button `Find Match` (nth=1)
- How it works amounts in the accessibility tree: `₮ 55,000`, `₮ 500,000`, `₮ 100,000`
- CTA heading `Бэлэн үү?`

## Artifacts

- `home.aria.yml` — accessibility snapshot after load
- `home.png` — screenshot with Bulaa, Find Match, Steam control
