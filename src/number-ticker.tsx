"use client";

import {
  animate,
  useInView,
  useMotionValue,
  useReducedMotion,
} from "motion/react";
import { useEffect, useRef, type ComponentPropsWithoutRef } from "react";

import { cn } from "./lib/cn";

/** Shared count-up duration (seconds) — also used by Equipo gauge fills. */
export const NUMBER_TICKER_DURATION = 0.9;

interface NumberTickerProps extends ComponentPropsWithoutRef<"span"> {
  value: number;
  startValue?: number;
  direction?: "up" | "down";
  /** Delay before the animation starts, in seconds. */
  delay?: number;
  /** Fixed animation duration in seconds, regardless of magnitude. */
  duration?: number;
  decimalPlaces?: number;
}

function formatValue(latest: number, decimalPlaces: number) {
  return Intl.NumberFormat("en-US", {
    minimumFractionDigits: decimalPlaces,
    maximumFractionDigits: decimalPlaces,
  }).format(Number(latest.toFixed(decimalPlaces)));
}

export function NumberTicker({
  value,
  startValue = 0,
  direction = "up",
  delay = 0,
  duration = NUMBER_TICKER_DURATION,
  className,
  decimalPlaces = 0,
  ...props
}: NumberTickerProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const hasAnimated = useRef(false);
  const reduceMotion = useReducedMotion();
  const from = direction === "down" ? value : startValue;
  const to = direction === "down" ? startValue : value;
  const motionValue = useMotionValue(from);
  const isInView = useInView(ref, { once: true, margin: "0px" });

  useEffect(
    () =>
      motionValue.on("change", (latest) => {
        if (ref.current) {
          ref.current.textContent = formatValue(latest, decimalPlaces);
        }
      }),
    [motionValue, decimalPlaces],
  );

  useEffect(() => {
    if (!isInView) return;

    const target = to;
    const start = hasAnimated.current ? motionValue.get() : from;

    if (reduceMotion) {
      motionValue.set(target);
      if (ref.current) {
        ref.current.textContent = formatValue(target, decimalPlaces);
      }
      hasAnimated.current = true;
      return;
    }

    let controls: ReturnType<typeof animate> | null = null;
    const timer = setTimeout(() => {
      motionValue.set(start);
      controls = animate(motionValue, target, {
        duration,
        ease: [0.32, 0.72, 0, 1],
      });
      hasAnimated.current = true;
    }, delay * 1000);

    return () => {
      clearTimeout(timer);
      controls?.stop();
    };
  }, [
    isInView,
    delay,
    duration,
    from,
    to,
    reduceMotion,
    motionValue,
    decimalPlaces,
  ]);

  return (
    <span
      ref={ref}
      className={cn(
        "inline-block tracking-wider tabular-nums text-inherit",
        className,
      )}
      {...props}
    >
      {formatValue(from, decimalPlaces)}
    </span>
  );
}
