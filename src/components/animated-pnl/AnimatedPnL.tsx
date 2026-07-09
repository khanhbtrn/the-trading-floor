"use client";

import { useAnimatedNumber } from "@/hooks/useAnimatedNumber";

type Props = {
  value: number;
  className?: string;
  prefix?: string;
  duration?: number;
  decimals?: number;
};

export function AnimatedPnL({
  value,
  className = "",
  prefix = "",
  duration = 0.45,
  decimals = 2,
}: Props) {
  const display = useAnimatedNumber(value, duration);
  const sign = display >= 0 ? "+" : "-";
  const abs = Math.abs(display);
  const formatted =
    decimals > 0 ? abs.toFixed(decimals) : abs.toLocaleString();
  return (
    <span className={className}>
      {prefix}
      {sign}${formatted}
    </span>
  );
}
