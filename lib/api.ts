import type { Dir } from "./game";

export interface MoveResponse {
  move: Dir;
  probabilities: Partial<Record<Dir, number>>;
  confidence: number;
  latencyMs: number;
  inputTokens: number;
  /** Only one legal move existed, so Jev wasn't asked. */
  forced: boolean;
}

export interface MoveError {
  code: "bad_request" | "no_key" | "unreachable" | "aborted";
  message: string;
}
