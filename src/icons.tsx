/** Tiny strokes used by selects/search — keep lucide out of this package. */

type IconProps = {
  size?: number;
  className?: string;
};

function svgProps(size: number, className?: string) {
  return {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none" as const,
    stroke: "currentColor",
    strokeWidth: 2,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true as const,
    className,
  };
}

export function IconCheck({ size = 12, className }: IconProps) {
  return (
    <svg {...svgProps(size, className)}>
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
}

export function IconChevronDown({ size = 16, className }: IconProps) {
  return (
    <svg {...svgProps(size, className)}>
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}

export function IconX({ size = 12, className }: IconProps) {
  return (
    <svg {...svgProps(size, className)}>
      <path d="M18 6 6 18M6 6l12 12" />
    </svg>
  );
}

export function IconSearch({ size = 16, className }: IconProps) {
  return (
    <svg {...svgProps(size, className)}>
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.3-4.3" />
    </svg>
  );
}

export function IconSend({ size = 16, className }: IconProps) {
  return (
    <svg {...svgProps(size, className)}>
      <path d="m22 2-7 20-4-9-9-4Z" />
      <path d="M22 2 11 13" />
    </svg>
  );
}
