import { APIUserAbortError, AuthenticationError, TypeSafeClient, choice } from "@typesafe-ai/sdk";
import { DIRS, SIZE, type Dir } from "@/lib/game";
import type { MoveResponse } from "@/lib/api";

// The client throws when TYPESAFE_API_KEY is missing, so build it on first use.
let client: TypeSafeClient | null = null;
function getClient() {
  if (!process.env.TYPESAFE_API_KEY) return null;
  client ??= new TypeSafeClient();
  return client;
}

function isGrid(v: unknown): v is (number | null)[][] {
  return (
    Array.isArray(v) &&
    v.length === SIZE &&
    v.every(
      (row) =>
        Array.isArray(row) &&
        row.length === SIZE &&
        row.every((x) => x === null || (Number.isInteger(x) && x >= 2 && (x & (x - 1)) === 0)),
    )
  );
}

function isLegal(v: unknown): v is Dir[] {
  return (
    Array.isArray(v) &&
    v.length > 0 &&
    v.length <= DIRS.length &&
    new Set(v).size === v.length &&
    v.every((d) => DIRS.includes(d))
  );
}

function error(code: string, message: string, status: number) {
  return Response.json({ code, message }, { status });
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const grid = body?.grid;
  const legal = body?.legal;
  if (!isGrid(grid) || !isLegal(legal)) return error("bad_request", "Expected a 4×4 grid and legal moves.", 400);

  // Only one way to go: nothing to decide.
  if (legal.length === 1) {
    const res: MoveResponse = {
      move: legal[0],
      probabilities: { [legal[0]]: 1 },
      confidence: 1,
      latencyMs: 0,
      inputTokens: 0,
      forced: true,
    };
    return Response.json(res);
  }

  const jev = getClient();
  if (!jev) return error("no_key", "Set TYPESAFE_API_KEY in .env.local and restart the dev server.", 500);

  const criteria = Object.fromEntries(legal.map((d) => [d, null])) as Record<Dir, null>;
  const started = performance.now();
  try {
    const { answers, usage } = await jev.systemOne(
      {
        state: { board: grid },
        questions: { move: choice("Which move is best in 2048?", criteria) },
      },
      { signal: request.signal },
    );
    const res: MoveResponse = {
      move: answers.move.choice as Dir,
      probabilities: answers.move.probabilities as Partial<Record<Dir, number>>,
      confidence: answers.move.confidence,
      latencyMs: Math.round(performance.now() - started),
      inputTokens: usage.input_tokens,
      forced: false,
    };
    return Response.json(res);
  } catch (e) {
    if (e instanceof APIUserAbortError) return error("aborted", "Request cancelled.", 499);
    if (e instanceof AuthenticationError) return error("no_key", "TYPESAFE_API_KEY was rejected.", 500);
    console.error("[jev]", e);
    return error("unreachable", "Jev is unreachable.", 502);
  }
}
