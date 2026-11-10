# Dev tooling

## omniroute (optional AI gateway)
OmniRoute is an OpenAI-compatible gateway that routes to 375+ LLM providers. It is a standalone service, not an app dependency.

- Install/run: `npx omniroute` (listens on `http://localhost:20128`) or Docker.
- Optional env var: `OMNIROUTE_BASE_URL=http://localhost:20128` (add to `backend/.env`).
- The billing app has no AI features today; this var is reserved for future AI features.

## engram (optional agent memory)
- Install: `npm i -g @sentropic/engram`.
- State lives in `.engram/` (gitignored). MCP mode exposes memory to the agent.

## Agent skills
Skills live in `.commandcode/skills/` (Addy Osmani agent-skills + ponytail). They appear in the Command Code slash menu.
- Ponytail commands: `/ponytail`, `/ponytail-review`, `/ponytail-audit`, `/ponytail-debt`, `/ponytail-gain`, `/ponytail-help`.
- Addy lifecycle commands: `/spec`, `/plan`, `/build`, `/test`, `/review`, `/ship`, plus 25 skills (e.g. `/code-review-and-quality`, `/security-and-hardening`).
