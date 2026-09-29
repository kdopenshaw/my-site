"use client";

import * as React from "react";
import { Questionnaire as QuestionnairePrimitive } from "@shadcn/react/questionnaire";

import styles from "./questionnaire.module.css";

function Questionnaire({ className, ...props }: React.ComponentProps<typeof QuestionnairePrimitive.Root>) {
  return <QuestionnairePrimitive.Root className={[styles.root, className].filter(Boolean).join(" ")} {...props} />;
}

function QuestionnaireProgress({ className, ...props }: React.ComponentProps<typeof QuestionnairePrimitive.Progress>) {
  return (
    <QuestionnairePrimitive.Progress className={[styles.progress, className].filter(Boolean).join(" ")} {...props} />
  );
}

function QuestionnaireItem({ className, ...props }: React.ComponentProps<typeof QuestionnairePrimitive.Item>) {
  return <QuestionnairePrimitive.Item className={[styles.item, className].filter(Boolean).join(" ")} {...props} />;
}

function QuestionnaireTitle({ className, ...props }: React.ComponentProps<typeof QuestionnairePrimitive.Title>) {
  return <QuestionnairePrimitive.Title className={[styles.title, className].filter(Boolean).join(" ")} {...props} />;
}

function QuestionnaireDescription({
  className,
  ...props
}: React.ComponentProps<typeof QuestionnairePrimitive.Description>) {
  return (
    <QuestionnairePrimitive.Description className={[styles.description, className].filter(Boolean).join(" ")} {...props} />
  );
}

function QuestionnaireChoices({ className, ...props }: React.ComponentProps<typeof QuestionnairePrimitive.Choices>) {
  return <QuestionnairePrimitive.Choices className={[styles.choices, className].filter(Boolean).join(" ")} {...props} />;
}

function QuestionnaireChoice({
  children,
  className,
  ...props
}: React.ComponentProps<typeof QuestionnairePrimitive.Choice>) {
  return (
    <QuestionnairePrimitive.Choice className={[styles.choice, className].filter(Boolean).join(" ")} {...props}>
      <QuestionnairePrimitive.ChoiceInput className={styles.input} />
      <QuestionnairePrimitive.ChoiceLabel className={styles.label}>{children}</QuestionnairePrimitive.ChoiceLabel>
      <span className={styles.mark} aria-hidden="true">
        <svg viewBox="0 0 16 16" fill="none">
          <path
            d="M3.5 8.2 6.4 11l6.1-6.2"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </span>
    </QuestionnairePrimitive.Choice>
  );
}

function QuestionnaireChoiceDescription({ className, ...props }: React.ComponentProps<"span">) {
  return <span className={[styles.choiceBody, className].filter(Boolean).join(" ")} {...props} />;
}

function QuestionnaireError({ className, ...props }: React.ComponentProps<typeof QuestionnairePrimitive.Error>) {
  return <QuestionnairePrimitive.Error className={[styles.error, className].filter(Boolean).join(" ")} {...props} />;
}

function QuestionnaireActions({ className, ...props }: React.ComponentProps<"div">) {
  return <div className={[styles.actions, className].filter(Boolean).join(" ")} {...props} />;
}

function QuestionnairePrevious({
  children,
  className,
  ...props
}: React.ComponentProps<typeof QuestionnairePrimitive.Previous>) {
  return (
    <QuestionnairePrimitive.Previous className={["button", className].filter(Boolean).join(" ")} {...props}>
      {children ?? "Back"}
    </QuestionnairePrimitive.Previous>
  );
}

function QuestionnaireNext({
  children,
  className,
  ...props
}: React.ComponentProps<typeof QuestionnairePrimitive.Next>) {
  return (
    <QuestionnairePrimitive.Next className={["button", className].filter(Boolean).join(" ")} {...props}>
      {children ?? "Next"}
    </QuestionnairePrimitive.Next>
  );
}

function QuestionnaireSubmit({
  children,
  className,
  ...props
}: React.ComponentProps<typeof QuestionnairePrimitive.Submit>) {
  return (
    <QuestionnairePrimitive.Submit className={["button", className].filter(Boolean).join(" ")} {...props}>
      {children ?? "Finish"}
    </QuestionnairePrimitive.Submit>
  );
}

export {
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
};
export { styles as questionnaireStyles };
