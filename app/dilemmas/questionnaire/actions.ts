"use server";

import { dilemmaDatabase } from "./db";
import { isFraming, questionnaire, type Framing } from "./questions";

export type SubmittedAnswer = {
  dilemmaId: string;
  choiceId: string;
  preference: number;
  confidence: number;
  optionOrder: string[];
  responseTimeMs: number;
};

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function cleanEmail(email: string) {
  const trimmed = email.trim();
  if (trimmed.length > 320 || !emailPattern.test(trimmed)) return null;
  return trimmed;
}

function sameIds(left: string[], right: string[]) {
  return left.length === right.length && left.every((id) => right.includes(id)) && new Set(left).size === left.length;
}

export async function startQuestionnaire(email: string): Promise<
  { ok: true; framing: Framing } | { ok: false; reason: "invalid" | "already" | "unavailable" }
> {
  const cleaned = cleanEmail(email);
  const db = dilemmaDatabase();
  if (!cleaned) return { ok: false, reason: "invalid" };
  if (!db) return { ok: false, reason: "unavailable" };

  const framing: Framing = Math.random() < 0.5 ? "classic" : "disguised";
  const client = await db.connect();
  try {
    await client.query("begin");
    const inserted = await client.query<{ id: string; framing: Framing | null }>(
      `insert into "ai-dilemmas".participants (email, framing)
       values ($1, $2)
       on conflict ((lower(email))) do update set email = "ai-dilemmas".participants.email
       returning id, framing`,
      [cleaned, framing],
    );
    const participant = inserted.rows[0];
    const existing = await client.query(
      `select 1 from "ai-dilemmas".human_results where participant_id = $1 limit 1`,
      [participant.id],
    );
    if (existing.rowCount) {
      await client.query("commit");
      return { ok: false, reason: "already" };
    }

    let assigned = participant.framing;
    if (!assigned) {
      const updated = await client.query<{ framing: Framing }>(
        `update "ai-dilemmas".participants
         set framing = $2
         where id = $1 and framing is null
         returning framing`,
        [participant.id, framing],
      );
      assigned = updated.rows[0]?.framing ?? framing;
      if (!updated.rows[0]) {
        const current = await client.query<{ framing: Framing }>(
          `select framing from "ai-dilemmas".participants where id = $1`,
          [participant.id],
        );
        assigned = current.rows[0].framing;
      }
    }
    await client.query("commit");
    if (!assigned || !isFraming(assigned)) return { ok: false, reason: "unavailable" };
    return { ok: true, framing: assigned };
  } catch (error) {
    await client.query("rollback");
    console.error("Failed to start questionnaire:", error);
    return { ok: false, reason: "unavailable" };
  } finally {
    client.release();
  }
}

export async function submitQuestionnaire(
  email: string,
  framing: string,
  answers: SubmittedAnswer[],
): Promise<{ ok: true } | { ok: false; reason: "invalid" | "already" | "unavailable" }> {
  const cleaned = cleanEmail(email);
  const db = dilemmaDatabase();
  if (!cleaned || !isFraming(framing)) return { ok: false, reason: "invalid" };
  if (!db) return { ok: false, reason: "unavailable" };

  const expected = questionnaire[framing];
  if (answers.length !== expected.length) return { ok: false, reason: "invalid" };
  for (const dilemma of expected) {
    const answer = answers.find((item) => item.dilemmaId === dilemma.id);
    const optionIds = dilemma.options.map((option) => option.id);
    if (
      !answer
      || !optionIds.includes(answer.choiceId)
      || !sameIds(answer.optionOrder, optionIds)
      || !Number.isInteger(answer.preference)
      || answer.preference < 0
      || answer.preference > 100
      || !Number.isInteger(answer.confidence)
      || answer.confidence < 0
      || answer.confidence > 100
      || !Number.isInteger(answer.responseTimeMs)
      || answer.responseTimeMs < 0
    ) {
      return { ok: false, reason: "invalid" };
    }
  }

  const client = await db.connect();
  try {
    await client.query("begin");
    const participant = await client.query<{ id: string; framing: Framing }>(
      `select id, framing from "ai-dilemmas".participants where lower(email) = lower($1)`,
      [cleaned],
    );
    const row = participant.rows[0];
    if (!row || row.framing !== framing) {
      await client.query("rollback");
      return { ok: false, reason: "invalid" };
    }
    for (const dilemma of expected) {
      const answer = answers.find((item) => item.dilemmaId === dilemma.id)!;
      await client.query(
        `insert into "ai-dilemmas".human_results (
           participant_id, framing, dilemma_id, choice_id, preference_strength,
           confidence, option_order, response_time_ms
         ) values ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [
          row.id,
          framing,
          dilemma.id,
          answer.choiceId,
          answer.preference,
          answer.confidence,
          answer.optionOrder,
          answer.responseTimeMs,
        ],
      );
    }
    await client.query("commit");
    return { ok: true };
  } catch (error) {
    await client.query("rollback");
    const code = typeof error === "object" && error && "code" in error ? error.code : undefined;
    if (code === "23505") return { ok: false, reason: "already" };
    console.error("Failed to save questionnaire:", error);
    return { ok: false, reason: "unavailable" };
  } finally {
    client.release();
  }
}
