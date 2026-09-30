"use client";

import { useRef, useState } from "react";

import { Slider } from "@/components/ui/slider";
import {
  Questionnaire,
  QuestionnaireActions,
  QuestionnaireChoice,
  QuestionnaireChoiceDescription,
  QuestionnaireChoices,
  QuestionnaireDescription,
  QuestionnaireError,
  QuestionnaireItem,
  QuestionnaireNext,
  QuestionnairePrevious,
  QuestionnaireProgress,
  QuestionnaireSubmit,
  QuestionnaireTitle,
} from "@/components/ui/questionnaire";
import { setArticleNotification, startQuestionnaire, submitQuestionnaire } from "./actions";
import { questionnaireStyles } from "@/components/ui/questionnaire";
import { questionnaire, type Dilemma, type Framing } from "./questions";
import styles from "./questionnaire.module.css";

type Rating = { preference: number; confidence: number };

function shuffle<T>(items: T[]) {
  const next = [...items];
  for (let index = next.length - 1; index > 0; index -= 1) {
    const swap = Math.floor(Math.random() * (index + 1));
    [next[index], next[swap]] = [next[swap], next[index]];
  }
  return next;
}

function splitChoice(text: string) {
  const match = text.match(/^(.+?[.!?])\s+([\s\S]+)$/);
  if (!match) return { label: text, description: "" };
  return { label: match[1], description: match[2] };
}

export default function QuestionnaireForm() {
  const [email, setEmail] = useState("");
  const [framing, setFraming] = useState<Framing | null>(null);
  const [orders, setOrders] = useState<Record<string, string[]>>({});
  const [ratings, setRatings] = useState<Record<string, Rating>>({});
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);
  const [notify, setNotify] = useState<boolean | null>(null);
  const shownAt = useRef(0);
  const activeId = useRef("");
  const times = useRef<Record<string, number>>({});

  const questions = framing ? questionnaire[framing] : [];

  function stamp(id: string) {
    if (!id) return;
    times.current[id] = (times.current[id] ?? 0) + Math.max(0, Date.now() - shownAt.current);
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
    const nextOrders: Record<string, string[]> = {};
    const nextRatings: Record<string, Rating> = {};
    for (const item of questionnaire[result.framing]) {
      nextOrders[item.id] = shuffle(item.options.map((option) => option.id));
      nextRatings[item.id] = { preference: 50, confidence: 50 };
      times.current[item.id] = 0;
    }
    activeId.current = questionnaire[result.framing][0].id;
    shownAt.current = Date.now();
    setOrders(nextOrders);
    setRatings(nextRatings);
    setFraming(result.framing);
  }

  async function finish(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!framing) return;
    stamp(activeId.current);
    setPending(true);
    setError("");
    const data = new FormData(event.currentTarget);
    const payload = questions.map((item) => ({
      dilemmaId: item.id,
      choiceId: String(data.get(item.id) ?? ""),
      preference: ratings[item.id].preference,
      confidence: ratings[item.id].confidence,
      optionOrder: orders[item.id],
      responseTimeMs: times.current[item.id] ?? 0,
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

  async function chooseNotification(wantsNotification: boolean) {
    setPending(true);
    setError("");
    const result = await setArticleNotification(email, wantsNotification);
    setPending(false);
    if (!result.ok) {
      setError("That preference could not be saved. Try again.");
      return;
    }
    setNotify(wantsNotification);
  }

  if (done) {
    return (
      <div className={styles.form}>
        <p>
          Thank you, your answers are saved.
          {notify === null
            ? " Would you like to be notified once the article is published?"
            : notify
              ? " I'll email you when the article is published."
              : " I won't email you about the article."}
        </p>
        {notify === null ? (
          <div className={styles.actions}>
            <button className="button" type="button" disabled={pending} onClick={() => chooseNotification(true)}>
              Yes
            </button>
            <button className="button" type="button" disabled={pending} onClick={() => chooseNotification(false)}>
              No
            </button>
          </div>
        ) : null}
        {error ? <p className={styles.error}>{error}</p> : null}
      </div>
    );
  }

  if (!framing) {
    return (
      <form className={styles.form} onSubmit={begin}>
        <p>
          Please choose an answer for the following six short hypothetical situations. For each one, pick the option you think is better, then say how much better it is compared to the other option and how sure you are in your choice. Use an email address so your answers can compare your choices with the models, nobody else will see your answers.
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

  return (
    <Questionnaire
      items={questions.map((item) => ({
        name: item.id,
        required: true,
        choices: orders[item.id].map((value) => ({ value })),
      }))}
      onItemChange={(item) => {
        stamp(activeId.current);
        activeId.current = item;
      }}
      onSubmit={finish}
    >
      <QuestionnaireProgress />
      {questions.map((item) => (
        <QuestionStep key={item.id} item={item} order={orders[item.id]} rating={ratings[item.id]} onRate={(rating) => {
          setRatings((current) => ({ ...current, [item.id]: rating }));
        }} />
      ))}
      {error ? <p className={styles.error}>{error}</p> : null}
      <QuestionnaireActions>
        <QuestionnairePrevious disabled={pending} />
        <QuestionnaireNext disabled={pending} />
        <QuestionnaireSubmit disabled={pending} />
      </QuestionnaireActions>
    </Questionnaire>
  );
}

function QuestionStep({
  item,
  order,
  rating,
  onRate,
}: {
  item: Dilemma;
  order: string[];
  rating: Rating;
  onRate: (rating: Rating) => void;
}) {
  const options = order.map((id) => item.options.find((option) => option.id === id)!);

  return (
    <QuestionnaireItem name={item.id} required>
      <QuestionnaireTitle>{item.title}</QuestionnaireTitle>
      <QuestionnaireDescription>{item.scenario}</QuestionnaireDescription>
      <p className={styles.prompt}>{item.question}</p>
      <QuestionnaireChoices>
        {options.map((option) => {
          const choice = splitChoice(option.text);
          return (
            <QuestionnaireChoice key={option.id} value={option.id}>
              <span className={questionnaireStyles.choiceTitle}>{choice.label}</span>
              {choice.description ? (
                <QuestionnaireChoiceDescription>{choice.description}</QuestionnaireChoiceDescription>
              ) : null}
            </QuestionnaireChoice>
          );
        })}
      </QuestionnaireChoices>
      <QuestionnaireError />
      <div className={styles.ratings}>
        <RatingSlider
          label="How much better is that choice?"
          low="About the same"
          high="Much better"
          value={rating.preference}
          onChange={(preference) => onRate({ ...rating, preference })}
        />
        <RatingSlider
          label="How sure are you in your choice?"
          low="Not sure"
          high="Completely sure"
          value={rating.confidence}
          onChange={(confidence) => onRate({ ...rating, confidence })}
        />
      </div>
    </QuestionnaireItem>
  );
}

function RatingSlider({
  label,
  low,
  high,
  value,
  onChange,
}: {
  label: string;
  low: string;
  high: string;
  value: number;
  onChange: (value: number) => void;
}) {
  return (
    <div className={styles.rating}>
      <div className={styles.ratingLabel}>
        <span>{label}</span>
        <span>{value}</span>
      </div>
      <Slider
        min={0}
        max={100}
        step={1}
        value={[value]}
        onValueChange={(next) => onChange(next[0] ?? value)}
      />
      <div className={styles.anchors}>
        <span>{low}</span>
        <span>{high}</span>
      </div>
    </div>
  );
}
