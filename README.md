# Jev plays 2048

A live demo of TypeSafe's **Jev** (a System One model) playing 2048. Each move is one typed
`choice` over the raw board, asking only "Which move is best in 2048?". There is no search and no heuristics.
The panel shows Jev's probability for each legal direction, its confidence and the call latency.

## Run

```bash
cp .env.local.example .env.local   # add your TYPESAFE_API_KEY
npm install
npm run dev                        # http://localhost:3000
npm test                           # engine unit tests
```

## How it works

- `lib/game.ts`: pure 2048 engine (stable tile ids, ghost tiles for merge animations).
- `app/api/move/route.ts`: server-side call to Jev. The API key never reaches the browser.
  Only legal directions are offered as options, and a single legal move skips the call.
- `hooks/useJevGame.ts`: sequential loop (think → move → animate → wait). Pausing, restarting or
  hiding the tab aborts any in-flight request, so a stale move can never be applied.
