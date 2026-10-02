import type { Metadata } from "next";

import QuestionnaireForm from "./questionnaire-form";

export const metadata: Metadata = {
  title: "Dilemma questionnaire | Keith Openshaw",
  description: "A short set of hypothetical moral choices.",
};

export default function DilemmaQuestionnairePage() {
  return (
    <section className="page-shell" aria-labelledby="questionnaire-heading">
      <h1 id="questionnaire-heading">
        Dilemma questionnaire
      </h1>
      <QuestionnaireForm />
    </section>
  );
}
