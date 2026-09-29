"use client";

import { useRef, useState } from "react";

import { startQuestionnaire, submitQuestionnaire } from "./actions";
import { questionnaire, type Framing } from "./questions";
import styles from "./questionnaire.module.css";

type Answer = {
  choiceId: string;
  preference: number;
  confidence: number;
  optionOrder: string[];
  responseTimeMs: number;
};

function shuffle<T>(items: T[]) {
  const next = [...items];
  for (let index = next.length - 1; index > 0; index -= 1) {
    const swap = Math.floor(Math.random() * (index + 1));
    [next[index], next[swap]] = [next[swap], next[index]];
  }
  return next;
}

export default function QuestionnaireForm() {
  const [email, setEmail] = useState("");
  const [framing, setFraming] = useState<Framing | null>(null);
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);
  const shownAt = useRef(0);
  const times = useRef<number[]>([]);

  const questions = framing ? questionnaire[framing] : [];
  const dilemma = questions[step - 1];
  const answer = answers[step - 1];

  function update(patch: Partial<Answer>) {
    setAnswers((current) =>
      current.map((item, index) => (index === step - 1 ? { ...item, ...patch } : item)),
    );
  }

  function recordTime(index: number) {
    const elapsed = Math.max(0, Date.now() - shownAt.current);
    times.current[index] = (times.current[index] ?? 0) + elapsed;
    shownAt.current = Date.now();
  }

  async function begin(event: React.FormEvent) {
    event.preventDefault();
    setPending(true);
    setError("");
    const result = await startQuestionnaire(email);
    setPending(false);
    if (!result.ok) {
      setError(
        result.reason === "already"
          ? "This email already has a completed questionnaire."
          : result.reason === "invalid"
            ? "Enter a valid email address."
            : "The questionnaire is unavailable right now. Try again in a moment.",
      );
      return;
    }
    const nextAnswers = questionnaire[result.framing].map((item) => ({
      choiceId: "",
      preference: 50,
      confidence: 50,
      optionOrder: shuffle(item.options.map((option) => option.id)),
      responseTimeMs: 0,
    }));
    times.current = nextAnswers.map(() => 0);
    setFraming(result.framing);
    setAnswers(nextAnswers);
    shownAt.current = Date.now();
    setStep(1);
  }

  async function advance(event: React.FormEvent) {
    event.preventDefault();
    if (!framing) return;
    recordTime(step - 1);
    if (step < questions.length) {
      setStep((current) => current + 1);
      return;
    }
    setPending(true);
    setError("");
    const payload = answers.map((item, index) => ({
      dilemmaId: questions[index].id,
      choiceId: item.choiceId,
      preference: item.preference,
      confidence: item.confidence,
      optionOrder: item.optionOrder,
      responseTimeMs: times.current[index] ?? 0,
    }));
    const result = await submitQuestionnaire(email, framing, payload);
    setPending(false);
    if (!result.ok) {
      setError(
        result.reason === "already"
          ? "This email already has a completed questionnaire."
          : "Your answers could not be saved. Try again.",
      );
      return;
    }
    setDone(true);
  }

  if (done) {
    return <p>Thank you. Your answers are saved. The article will show them next to the model results, identified by this email.</p>;
  }

  if (step === 0) {
    return (
      <form className={styles.form} onSubmit={begin}>
        <p>
          Six short hypothetical situations. For each one, pick the option you think is
          better, then say how much better and how sure you are. Use an email address so
          your answers can be shown with the results later.
        </p>
        <div className={styles.field}>
          <label htmlFor="participant-email">Email</label>
          <input
            id="participant-email"
            type="email"
            required
            autoComplete="email"
            placeholder="you@example.com"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
        </div>
        {error ? <p className={styles.error}>{error}</p> : null}
        <div className={styles.actions}>
          <button className="button" type="submit" disabled={pending}>
            Start
          </button>
        </div>
      </form>
    );
  }

  const options = dilemma.options
    .slice()
    .sort((left, right) => answer.optionOrder.indexOf(left.id) - answer.optionOrder.indexOf(right.id));

  return (
    <form className={styles.form} onSubmit={advance}>
      <p className={styles.progress}>
        {step} of {questions.length}
      </p>
      <h2>{dilemma.title}</h2>
      <p className={styles.scenario}>{dilemma.scenario}</p>
      <fieldset className={styles.choices}>
        <legend>{dilemma.question}</legend>
        {options.map((option) => (
          <label className={styles.choice} key={option.id}>
            <input
              type="radio"
              name={dilemma.id}
              required
              checked={answer.choiceId === option.id}
              onChange={() => update({ choiceId: option.id })}
            />
            <span>{option.text}</span>
          </label>
        ))}
      </fieldset>
      <div className={styles.ratings}>
        <div className={styles.rating}>
          <label htmlFor="preference">How much better is that choice? {answer.preference}</label>
          <input
            id="preference"
            type="range"
            min={0}
            max={100}
            value={answer.preference}
            onChange={(event) => update({ preference: Number(event.target.value) })}
          />
          <div className={styles.anchors}>
            <span>About the same</span>
            <span>Much better</span>
          </div>
        </div>
        <div className={styles.rating}>
          <label htmlFor="confidence">How sure are you? {answer.confidence}</label>
          <input
            id="confidence"
            type="range"
            min={0}
            max={100}
            value={answer.confidence}
            onChange={(event) => update({ confidence: Number(event.target.value) })}
          />
          <div className={styles.anchors}>
            <span>Not sure</span>
            <span>Completely sure</span>
          </div>
        </div>
      </div>
      {error ? <p className={styles.error}>{error}</p> : null}
      <div className={styles.actions}>
        <button
          className="button"
          type="button"
          disabled={pending}
          onClick={() => {
            recordTime(step - 1);
            setStep((current) => current - 1);
          }}
        >
          Back
        </button>
        <button className="button" type="submit" disabled={pending}>
          {step === questions.length ? "Finish" : "Next"}
        </button>
      </div>
    </form>
  );
}
