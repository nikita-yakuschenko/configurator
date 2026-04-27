import type { ReactNode } from "react";

export function OptionGrid({ children }: { children: ReactNode }) {
  return <div className="option-grid">{children}</div>;
}
