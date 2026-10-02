"use client";

import { useId, useLayoutEffect, useRef, useState } from "react";
import DiagramHelp from "./diagram-help";
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
  help,
  stepper = false,
}: {
  label: ReactNode;
  value: number;
  step: number | "any";
  min?: number;
  max?: number;
  onChange: (value: number) => void;
  help?: { label: string; src: string; text: string };
  stepper?: boolean;
}) {
  const id = useId();
  const stepSize = typeof step === "number" ? step : 1;

  function commit(next: number) {
    const bounded = Math.min(max ?? next, Math.max(min ?? next, next));
    onChange(bounded);
  }

  const input = (
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
  );

  return (
    <div className={styles.numberField}>
      <div className={styles.fieldHeading}>
        <label className={styles.fieldLabel} htmlFor={id}>
          {label}
        </label>
        {help && <DiagramHelp label={help.label} diagrams={[{ src: help.src }]} help={help.text} />}
      </div>
      {stepper ? (
        <div className={styles.stepper}>
          {input}
          <span className={styles.stepperButtons}>
            <button
              type="button"
              aria-label={`Decrease ${typeof label === "string" ? label : "value"}`}
              disabled={min !== undefined && value <= min}
              onClick={() => commit(value - stepSize)}
            >
              −
            </button>
            <button
              type="button"
              aria-label={`Increase ${typeof label === "string" ? label : "value"}`}
              disabled={max !== undefined && value >= max}
              onClick={() => commit(value + stepSize)}
            >
              +
            </button>
          </span>
        </div>
      ) : (
        input
      )}
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
  maxDigits,
  disabled = false,
  onChange,
  help,
}: {
  label: ReactNode;
  value: number;
  step: number;
  min: number;
  max: number;
  digits?: number;
  maxDigits?: number;
  disabled?: boolean;
  onChange: (value: number) => void;
  help?: { label: string; src: string; text: string };
}) {
  const id = useId();
  const precision = maxDigits ?? digits;
  const display = formatDecimal(value, digits, precision);
  return (
    <div className={`${styles.rangeField} ${disabled ? styles.isDisabled : ""}`}>
      <div className={styles.rangeLabel}>
        <div className={styles.fieldHeading}>
          <label htmlFor={id}>{label}</label>
          {help && (
            <DiagramHelp label={help.label} diagrams={[{ src: help.src }]} help={help.text} />
          )}
        </div>
        {disabled ? (
          <output>{display}</output>
        ) : (
          <EditableRangeValue
            value={value}
            display={display}
            min={min}
            max={max}
            precision={precision}
            name={help?.label ?? "value"}
            onChange={onChange}
          />
        )}
      </div>
      <input
        id={id}
        className={styles.rangeSlider}
        type="range"
        value={value}
        step={step}
        min={min}
        max={max}
        disabled={disabled}
        onChange={(event) => onChange(Number(event.target.value))}
      />
    </div>
  );
}

function formatDecimal(value: number, minDigits: number, maxDigits: number) {
  const rounded = Number(value.toFixed(maxDigits));
  const [whole, fraction = ""] = rounded.toFixed(maxDigits).split(".");
  const kept = fraction.replace(/0+$/, "").padEnd(minDigits, "0");
  const text = kept ? `${whole}.${kept}` : whole;
  return text.replace("-", "−");
}

function EditableRangeValue({
  value,
  display,
  min,
  max,
  precision,
  name,
  onChange,
}: {
  value: number;
  display: string;
  min: number;
  max: number;
  precision: number;
  name: string;
  onChange: (value: number) => void;
}) {
  const fieldRef = useRef<HTMLSpanElement>(null);
  const [editing, setEditing] = useState(false);

  useLayoutEffect(() => {
    const field = fieldRef.current;
    if (!field || editing || field.textContent === display) return;
    field.textContent = display;
  }, [display, editing]);

  function commit(raw: string) {
    const parsed = Number(raw.replace("−", "-").trim());
    if (Number.isFinite(parsed)) {
      const rounded = Number(parsed.toFixed(precision));
      onChange(Math.min(max, Math.max(min, rounded)));
    }
    setEditing(false);
  }

  return (
    <span
      ref={fieldRef}
      className={styles.rangeValue}
      role="textbox"
      aria-label={`Edit ${name}`}
      contentEditable
      suppressContentEditableWarning
      spellCheck={false}
      onFocus={() => setEditing(true)}
      onBlur={(event) => commit(event.currentTarget.textContent ?? "")}
      onKeyDown={(event) => {
        if (event.key === "Enter") {
          event.preventDefault();
          event.currentTarget.blur();
        }
        if (event.key === "Escape") {
          event.preventDefault();
          event.currentTarget.textContent = display;
          event.currentTarget.blur();
        }
      }}
    />
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
  help?: string;
  diagram?: string;
  diagrams?: HelpDiagram[];
}) {
  const helpDiagrams = diagrams ?? (diagram ? [{ src: diagram }] : []);
  return (
    <div className={styles.configLabel}>
      <span className={styles.configTitle} id={`fractal-label-${index.toLowerCase()}`}>
        {title}
      </span>
      {helpDiagrams.length > 0 && (
        <DiagramHelp
          label={typeof title === "string" ? title : "Fractal setting"}
          diagrams={helpDiagrams}
          help={help ?? ""}
        />
      )}
    </div>
  );
}

export function FractalEquation({ family, power }: { family: FractalFamily; power: number }) {
  if (family === "newton") {
    return (
      <div
        className={`${styles.equation} ${styles.equationNewton}`}
        aria-label={`z sub n plus 1 equals z sub n minus the quantity z sub n to the power ${power} minus 1 divided by ${power} z sub n to the power ${power - 1}`}
      >
        <i>z</i>
        <sub>n+1</sub>
        <b>=</b>
        <i>z</i>
        <sub>n</sub>
        <b>−</b>
        <span className={styles.equationFraction}>
          <span>
            <i>z</i>
            <sub>n</sub>
            <sup>{power}</sup>
            <b>−</b>1
          </span>
          <span>
            <b>{power}</b>
            <i>z</i>
            <sub>n</sub>
            <sup>{power - 1}</sup>
          </span>
        </span>
      </div>
    );
  }

  if (family === "burning_ship") {
    return (
      <div
        className={`${styles.equation} ${styles.equationLong}`}
        aria-label={`z sub n plus 1 equals the quantity absolute real z sub n plus i absolute imaginary z sub n to the power ${power} plus c`}
      >
        <i>z</i>
        <sub>n+1</sub>
        <b>=</b>
        <span>
          (|Re(<i>z</i>
          <sub>n</sub>)| + <i>i</i>|Im(<i>z</i>
          <sub>n</sub>)|)
        </span>
        <sup>{power}</sup>
        <b>+</b>
        <i className={styles.equationConstant}>c</i>
      </div>
    );
  }

  return (
    <div
      className={styles.equation}
      aria-label={`z sub n plus 1 equals ${family === "tricorn" ? "the conjugate of " : ""}z sub n to the power ${power} plus c`}
    >
      <i>z</i>
      <sub>n+1</sub>
      <b>=</b>
      {family === "tricorn" ? (
        <span className={styles.equationConjugate}>
          <i>z</i>
        </span>
      ) : (
        <i>z</i>
      )}
      <sub>n</sub>
      <sup>{power}</sup>
      <b>+</b>
      <i className={styles.equationConstant}>c</i>
    </div>
  );
}
