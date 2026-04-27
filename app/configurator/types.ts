export type ParameterOption = {
  id: string;
  label: string;
  priceDelta: number;
  description?: string;
  impact?: string;
  recommended?: boolean;
};

export type ParameterField = {
  id: string;
  label: string;
  options: ParameterOption[];
};

export type ConfigItem = {
  id: string;
  title: string;
  subtitle: string;
  basePrice: number;
  fields: ParameterField[];
};

export type Step = "lot" | "house" | "placement" | "interior" | "engineering" | "proposal";

export type StepDescriptor = {
  id: Step;
  label: string;
};

export type Totals = {
  base: number;
  options: number;
  discount: number;
  finalTotal: number;
};
