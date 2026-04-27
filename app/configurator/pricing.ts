import { stepItems, steps } from "./data";
import type { ConfigItem, Step, Totals } from "./types";

export const DISCOUNT_RATE = 0.04;

export const formatPrice = (value: number) =>
  new Intl.NumberFormat("ru-RU", {
    style: "decimal",
    maximumFractionDigits: 0,
  }).format(value) + " руб.";

export const optionKey = (step: Step, itemId: string, fieldId: string) =>
  `${step}:${itemId}:${fieldId}`;

export const getConfigurableSteps = (): Exclude<Step, "proposal">[] =>
  steps.map((step) => step.id).filter((step): step is Exclude<Step, "proposal"> => step !== "proposal");

export const getActiveConfigurableSteps = (stepIndex: number): Exclude<Step, "proposal">[] => {
  const configurableSteps = getConfigurableSteps();
  return configurableSteps.slice(0, Math.min(stepIndex + 1, configurableSteps.length));
};

export const getSelectedItem = (step: Step, selectedId: string): ConfigItem => {
  const items = stepItems[step];
  return items.find((item) => item.id === selectedId) ?? items[0];
};

export const buildPickedByStep = (
  activeSteps: Exclude<Step, "proposal">[],
  selectedItems: Record<Step, string>,
) =>
  activeSteps.map((step) => ({
    step,
    item: getSelectedItem(step, selectedItems[step]),
  }));

export const calculateTotals = (
  pickedByStep: { step: Exclude<Step, "proposal">; item: ConfigItem }[],
  selectedOptions: Record<string, string>,
): Totals => {
  const base = pickedByStep.reduce((acc, entry) => acc + entry.item.basePrice, 0);
  const options = pickedByStep.reduce((acc, entry) => {
    const fieldTotal = entry.item.fields.reduce((fieldAcc, field) => {
      const selectedOptionId = selectedOptions[optionKey(entry.step, entry.item.id, field.id)];
      const selectedOption = field.options.find((opt) => opt.id === selectedOptionId);
      return fieldAcc + (selectedOption?.priceDelta ?? 0);
    }, 0);
    return acc + fieldTotal;
  }, 0);

  const subtotal = base + options;
  const discount = Math.round(subtotal * DISCOUNT_RATE);
  const finalTotal = subtotal - discount;

  return { base, options, discount, finalTotal };
};
