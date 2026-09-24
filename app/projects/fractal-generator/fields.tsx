"use client";

import { useId } from "react";
import type { ReactNode } from "react";

import styles from "./fractal-studio.module.css";
import type { FractalFamily } from "./presets";

// The controls in the fractal form. Each one is a normal HTML input.

export function NumberField({
  label,
  value,
  step,
  min,
  max,
  onChange,
}: {
  label: ReactNode;
  value: number;
  step: number | "any";
  min?: number;
  max?: number;
  onChange: (value: number) => void;
}) {
  const id = useId();

  return (
    <div className={styles.numberField}>
      <label className={styles.fieldLabel} htmlFor={id}>{label}</label>
      <input
        id={id}
        className={styles.numberInput}
        type="number"
        value={value}
        step={step}
        min={min}
        max={max}
        onChange={(event) => {
          if (event.target.value === "") {
            onChange(0);
            return;
          }
          const parsed = Number(event.target.value);
          if (Number.isFinite(parsed)) onChange(parsed);
        }}
      />
    </div>
  );
}

export function RangeField({
  label,
  value,
  step,
  min,
  max,
  digits = 0,
  disabled = false,
  onChange,
}: {
  label: ReactNode;
  value: number;
  step: number;
  min: number;
  max: number;
  digits?: number;
  disabled?: boolean;
  onChange: (value: number) => void;
}) {
  return (
    <label className={`${styles.rangeField} ${disabled ? styles.isDisabled : ""}`}>
      <span className={styles.rangeLabel}>
        <span>{label}</span>
        <output>{value.toFixed(digits).replace("-", "−")}</output>
      </span>
      <input
        className={styles.rangeSlider}
        type="range"
        value={value}
        step={step}
        min={min}
        max={max}
        disabled={disabled}
        onChange={(event) => onChange(Number(event.target.value))}
      />
    </label>
  );
}

export function stopLabel(index: number, count: number) {
  if (index === 0) return "0";
  if (index === count - 1) return "1";
  if (count === 4) return index === 1 ? "⅓" : "⅔";
  return (index / (count - 1)).toFixed(2);
}

type HelpDiagram = { src: string; label?: string };

export function ConfigLabel({
  index,
  title,
  help,
  diagram,
  diagrams,
}: {
  index: string;
  title: ReactNode;
  help: string;
  diagram?: string;
  diagrams?: HelpDiagram[];
}) {
  const helpId = `fractal-help-${index.toLowerCase()}`;
  const helpDiagrams = diagrams ?? (diagram ? [{ src: diagram }] : []);

  return (
    <div className={styles.configLabel} tabIndex={0} aria-describedby={helpId}>
      <span className={styles.configIndex}>{index}</span>
      <span className={styles.configTitle} id={`fractal-label-${index.toLowerCase()}`}>{title}</span>
      <div className={styles.configHelp} id={helpId} role="tooltip">
        <div className={`${styles.configHelpVisuals} ${helpDiagrams.length > 1 ? styles.isGrid : ""}`}>
          {helpDiagrams.map(({ src, label }) => (
            <figure key={src}>
              <img src={src} alt="" width="240" height="104" />
              {label && <figcaption>{label}</figcaption>}
            </figure>
          ))}
        </div>
        <p>{help}</p>
      </div>
    </div>
  );
}

export function FractalEquation({ family, power }: { family: FractalFamily; power: number }) {
  if (family === "newton") {
    return (
      <div className={`${styles.equation} ${styles.equationNewton}`} aria-label={`z sub n plus 1 equals z sub n minus the quantity z sub n to the power ${power} minus 1 divided by ${power} z sub n to the power ${power - 1}`}>
        <i>z</i><sub>n+1</sub><b>=</b><i>z</i><sub>n</sub><b>−</b>
        <span className={styles.equationFraction}>
          <span><i>z</i><sub>n</sub><sup>{power}</sup><b>−</b>1</span>
          <span><b>{power}</b><i>z</i><sub>n</sub><sup>{power - 1}</sup></span>
        </span>
      </div>
    );
  }

  if (family === "burning_ship") {
    return (
      <div className={`${styles.equation} ${styles.equationLong}`} aria-label={`z sub n plus 1 equals the quantity absolute real z sub n plus i absolute imaginary z sub n to the power ${power} plus c`}>
        <i>z</i><sub>n+1</sub><b>=</b>
        <span>(|Re(<i>z</i><sub>n</sub>)| + <i>i</i>|Im(<i>z</i><sub>n</sub>)|)</span>
        <sup>{power}</sup><b>+</b><i className={styles.equationConstant}>c</i>
      </div>
    );
  }

  return (
    <div className={styles.equation} aria-label={`z sub n plus 1 equals ${family === "tricorn" ? "the conjugate of " : ""}z sub n to the power ${power} plus c`}>
      <i>z</i><sub>n+1</sub><b>=</b>
      {family === "tricorn" ? <span className={styles.equationConjugate}><i>z</i></span> : <i>z</i>}
      <sub>n</sub><sup>{power}</sup><b>+</b><i className={styles.equationConstant}>c</i>
    </div>
  );
}
