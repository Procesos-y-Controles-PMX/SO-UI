"use client";

import React from "react";

import { cn } from "./lib/cn";
import { CHEVRON_SELECT, FIELD_INPUT, FIELD_LABEL, FIELD_SELECT } from "./styles";

export type FieldProps = {
  label?: React.ReactNode;
  htmlFor?: string;
  className?: string;
  children: React.ReactNode;
};

export function Field({ label, htmlFor, className, children }: FieldProps) {
  return (
    <div className={cn("block", className)}>
      {label ? (
        <label htmlFor={htmlFor} className={cn(FIELD_LABEL, "mb-1.5 block")}>
          {label}
        </label>
      ) : null}
      {children}
    </div>
  );
}

export type InputProps = React.InputHTMLAttributes<HTMLInputElement>;

export function Input({ className, ...props }: InputProps) {
  return <input className={cn(FIELD_INPUT, className)} {...props} />;
}

export type TextareaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement>;

export function Textarea({ className, ...props }: TextareaProps) {
  return <textarea className={cn(FIELD_INPUT, "min-h-36 resize-y", className)} {...props} />;
}

export type NativeSelectOption = {
  value: string;
  label: string;
};

export type NativeSelectProps = Omit<
  React.SelectHTMLAttributes<HTMLSelectElement>,
  "children"
> & {
  options: NativeSelectOption[];
  placeholder?: string;
};

/** OS `<select>` with clay chrome. Prefer `Select` / `FormSelect` for suite menus. */
export function NativeSelect({
  options,
  placeholder,
  className,
  ...props
}: NativeSelectProps) {
  return (
    <select className={cn(FIELD_SELECT, CHEVRON_SELECT, className)} {...props}>
      {placeholder ? <option value="">{placeholder}</option> : null}
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
}
