"use client";

import { useMemo, useState } from "react";
import { OptionGrid } from "./configurator/components/OptionGrid";
import { SelectableCard } from "./configurator/components/SelectableCard";
import { createInitialSelectedItems, createInitialSelectedOptions, stepItems, steps } from "./configurator/data";
import { buildPickedByStep, calculateTotals, formatPrice, getActiveConfigurableSteps, getSelectedItem, optionKey } from "./configurator/pricing";
import type { Step } from "./configurator/types";

const MAX_OPTIONS_PER_FIELD = 4;
const NONE_OPTION_ID = "__none_option__";
const SYNTHETIC_OPTION_PREFIX = "__synthetic_option_";
type LotSourceTab = "cadastre" | "fund";
const CADASTRE_BASE_GROUPS = [2, 2, 7] as const;
const CADASTRE_OBJECT_MAX_DIGITS = 12;
const CADASTRE_VALID_PATTERN = /^\d{2}:\d{2}:\d{7}:\d{1,12}$/;

const formatCadastreValue = (rawValue: string) => {
  const totalMaxDigits =
    CADASTRE_BASE_GROUPS.reduce((sum, size) => sum + size, 0) + CADASTRE_OBJECT_MAX_DIGITS;
  const digitsOnly = rawValue.replace(/\D/g, "").slice(0, totalMaxDigits);
  const parts: string[] = [];
  let cursor = 0;

  for (const groupSize of CADASTRE_BASE_GROUPS) {
    if (cursor >= digitsOnly.length) {
      break;
    }
    parts.push(digitsOnly.slice(cursor, cursor + groupSize));
    cursor += groupSize;
  }

  if (digitsOnly.length > cursor) {
    parts.push(digitsOnly.slice(cursor));
  }

  return parts.join(":");
};

export default function Home() {
  const [stepIndex, setStepIndex] = useState(0);
  const [lotSourceTab, setLotSourceTab] = useState<LotSourceTab>("cadastre");
  const [cadastreNumber, setCadastreNumber] = useState("");
  const [selectedItems, setSelectedItems] = useState<Record<Step, string>>(createInitialSelectedItems);
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>(createInitialSelectedOptions);

  const currentStep = steps[stepIndex];
  const activeConfigurableSteps = getActiveConfigurableSteps(stepIndex);
  const currentItems = stepItems[currentStep.id];
  const selectedCurrentItem = getSelectedItem(currentStep.id, selectedItems[currentStep.id]);

  const pickedByStep = useMemo(
    () => buildPickedByStep(activeConfigurableSteps, selectedItems),
    [activeConfigurableSteps, selectedItems],
  );

  const totals = useMemo(() => calculateTotals(pickedByStep, selectedOptions), [pickedByStep, selectedOptions]);
  const isCadastreNumberValid = CADASTRE_VALID_PATTERN.test(cadastreNumber);
  const summaryByStep = useMemo(
    () =>
      pickedByStep.map((entry) => ({
        ...entry,
        selectedFields: entry.item.fields
          .map((field) => {
          const key = optionKey(entry.step, entry.item.id, field.id);
          const selectedId = selectedOptions[key];

          if (selectedId === NONE_OPTION_ID) {
            return null;
          }

          if (selectedId?.startsWith(SYNTHETIC_OPTION_PREFIX)) {
            const syntheticIndex = Number(
              selectedId.replace(SYNTHETIC_OPTION_PREFIX, "").replace("__", ""),
            );
            return {
              fieldId: field.id,
              fieldLabel: field.label,
              optionLabel: `Вариант опции ${Number.isFinite(syntheticIndex) ? syntheticIndex : 1}`,
              description: "Базовый вариант без дополнительных работ",
            };
          }

          const selectedOption = field.options.find((option) => option.id === selectedId);
          return {
            fieldId: field.id,
            fieldLabel: field.label,
            optionLabel: selectedOption?.label ?? "Не выбран",
            description: selectedOption?.description ?? "Описание не указано",
          };
        })
          .filter((field): field is NonNullable<typeof field> => field !== null),
      })),
    [pickedByStep, selectedOptions],
  );

  return (
    <div className="configurator-root">
      <header className="topbar">
        <div>
          <p className="brand">Русский стиль 2.0</p>
          <h1>Конфигуратор дома</h1>
        </div>
        <ol className="steps">
          {steps.map((step, index) => (
            <li
              key={step.id}
              className={[
                "step-chip",
                index === stepIndex ? "is-active" : "",
                index < stepIndex ? "is-done" : "",
              ].join(" ")}
            >
              <span>{index + 1}</span>
              {step.label}
            </li>
          ))}
        </ol>
        <div className="topbar-actions">
          <button
            className="ghost-btn"
            type="button"
            onClick={() => setStepIndex((index) => Math.max(index - 1, 0))}
            disabled={stepIndex === 0}
          >
            Назад
          </button>
          <button
            className="primary-btn"
            type="button"
            onClick={() => setStepIndex((index) => Math.min(index + 1, steps.length - 1))}
            disabled={stepIndex === steps.length - 1}
          >
            Далее
          </button>
        </div>
      </header>

      <main className="app-grid">
        <aside className="left-panel">
          <div className="left-tabs">
            <button
              type="button"
              className={["left-tab", lotSourceTab === "cadastre" ? "is-active" : ""].join(" ")}
              onClick={() => setLotSourceTab("cadastre")}
            >
              <span className="left-tab-text">Есть участок</span>
            </button>
            <button
              type="button"
              className={["left-tab", "left-tab-soon", lotSourceTab === "fund" ? "is-active" : ""].join(" ")}
              disabled
            >
              <span className="left-tab-text">Подобрать участок</span>
              <span className="left-tab-badge">Скоро</span>
            </button>
          </div>
          {lotSourceTab === "cadastre" ? (
            <label className="cadastre-input-wrap">
              <span className="cadastre-input-label">Введите кадастровый номер</span>
              <input
                className="cadastre-input"
                type="text"
                value={cadastreNumber}
                onChange={(event) => setCadastreNumber(formatCadastreValue(event.target.value))}
                placeholder="00:00:0000000:00000"
                inputMode="numeric"
                maxLength={26}
              />
              <button
                type="button"
                className="ghost-btn cadastre-search-btn cadastre-search-btn--green"
                disabled={!isCadastreNumberValid}
              >
                Найти
              </button>
            </label>
          ) : null}
          {lotSourceTab === "fund" ? (
            <p className="muted">
              {currentStep.label}: {stepIndex + 1} из {steps.length}
            </p>
          ) : null}
          {lotSourceTab === "fund" ? (
            <OptionGrid>
              {currentItems.map((item) => (
                <SelectableCard
                  key={item.id}
                  selected={item.id === selectedItems[currentStep.id]}
                  onClick={() =>
                    setSelectedItems((prev) => ({ ...prev, [currentStep.id]: item.id }))
                  }
                  title={item.title}
                  lines={[item.subtitle, `База: ${formatPrice(item.basePrice)}`]}
                />
              ))}
            </OptionGrid>
          ) : null}
        </aside>

        <section className="center-panel">
          <div className="center-layout">
            <div className="scene">
              <div className="scene-overlay">
                <h3>{currentStep.label}</h3>
                <p>{selectedCurrentItem.title}</p>
                <p>{selectedCurrentItem.subtitle}</p>
              </div>
            </div>
            <section className="bottom-params">
              {selectedCurrentItem.fields.length === 0 ? (
                <p className="muted">На этом шаге нет дополнительных параметров.</p>
              ) : (
                <div className="params-grid">
                  {selectedCurrentItem.fields.map((field, fieldIndex) => (
                    <article key={field.id} className="param-card">
                      <div className="param-card-head">
                        <h4>{`Опция ${fieldIndex + 1}`}</h4>
                      </div>
                      <div className="param-options">
                        {Array.from({ length: MAX_OPTIONS_PER_FIELD }).map((_, index) => {
                          const key = optionKey(currentStep.id, selectedCurrentItem.id, field.id);
                          const isNoneSelected = selectedOptions[key] === NONE_OPTION_ID;
                          const isNoneSlot = index === MAX_OPTIONS_PER_FIELD - 1;
                          if (isNoneSlot) {
                            return (
                              <button
                                key={`none-${field.id}`}
                                className={["param-option", isNoneSelected ? "is-selected" : "", "is-placeholder"].join(" ")}
                                type="button"
                                onClick={() =>
                                  setSelectedOptions((prev) => ({
                                    ...prev,
                                    [key]: NONE_OPTION_ID,
                                  }))
                                }
                              >
                                <span className="param-option-main">
                                  <span className="param-option-title-row">
                                    <span className="param-option-title">Не добавлять опцию</span>
                                  </span>
                                </span>
                                <span className="param-option-meta">0 руб.</span>
                              </button>
                            );
                          }

                          const option = field.options[index];
                          if (!option) {
                            const syntheticId = `${SYNTHETIC_OPTION_PREFIX}${index + 1}__`;
                            const isSyntheticSelected = selectedOptions[key] === syntheticId;
                            return (
                              <button
                                key={`synthetic-${field.id}-${index}`}
                                className={["param-option", isSyntheticSelected ? "is-selected" : ""].join(" ")}
                                type="button"
                                onClick={() =>
                                  setSelectedOptions((prev) => ({
                                    ...prev,
                                    [key]: syntheticId,
                                  }))
                                }
                              >
                                <span className="param-option-main">
                                  <span className="param-option-title-row">
                                    <span className="param-option-title">{`Вариант опции ${index + 1}`}</span>
                                  </span>
                                </span>
                                <span className="param-option-meta">0 руб.</span>
                              </button>
                            );
                          }

                          const isSelected = selectedOptions[key] === option.id;
                          return (
                            <button
                              key={option.id}
                              className={["param-option", isSelected ? "is-selected" : ""].join(" ")}
                              type="button"
                              onClick={() =>
                                setSelectedOptions((prev) => ({
                                  ...prev,
                                  [key]: option.id,
                                }))
                              }
                            >
                              <span className="param-option-main">
                                <span className="param-option-title-row">
                                  <span className="param-option-title">{`Вариант опции ${index + 1}`}</span>
                                </span>
                              </span>
                              <span className="param-option-meta">
                                {option.priceDelta > 0 ? `+ ${formatPrice(option.priceDelta)}` : "0 руб."}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </section>
          </div>
        </section>

        <aside className="summary-panel">
          <h2>Предварительная калькуляция</h2>
          {summaryByStep.map((entry) => (
            <div key={entry.item.id} className="summary-item">
              <p>
                {entry.item.title}: {formatPrice(entry.item.basePrice)}
              </p>
              {entry.selectedFields.map((selectedField) => (
                <p key={`${entry.item.id}-${selectedField.fieldId}`} className="summary-option">
                  {selectedField.fieldLabel}: {selectedField.optionLabel} - {selectedField.description}
                </p>
              ))}
            </div>
          ))}
          <hr />
          <p>База: {formatPrice(totals.base)}</p>
          <p>Параметры: {formatPrice(totals.options)}</p>
          <p>Скидка: - {formatPrice(totals.discount)}</p>
          <p className="summary-price">{formatPrice(totals.finalTotal)}</p>
        </aside>
      </main>
    </div>
  );
}
