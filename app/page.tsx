"use client";

import { useCallback, useMemo, useState } from "react";
import { OptionGrid } from "./configurator/components/OptionGrid";
import { SelectableCard } from "./configurator/components/SelectableCard";
import { createInitialSelectedItems, createInitialSelectedOptions, stepItems, steps } from "./configurator/data";
import {
  buildPickedByStep,
  calculateTotals,
  formatPrice,
  getActiveConfigurableSteps,
  getSelectedItem,
  optionKey,
} from "./configurator/pricing";
import type { Step } from "./configurator/types";

const MAX_OPTIONS_PER_FIELD = 4;
const NONE_OPTION_ID = "__none_option__";
const SYNTHETIC_OPTION_PREFIX = "__synthetic_option_";
const MULTI_SELECT_FIELD_IDS = new Set(["site-preparation", "foreman-visit"]);
type LotSourceTab = "cadastre" | "fund";
const CADASTRE_BASE_GROUPS = [2, 2, 7] as const;
const CADASTRE_OBJECT_MAX_DIGITS = 12;
const CADASTRE_VALID_PATTERN = /^\d{2}:\d{2}:\d{7}:\d{1,12}$/;
type NspdFeature = {
  type: "Feature";
  geometry?: {
    type?: string;
    coordinates?: unknown;
  };
  properties?: Record<string, unknown>;
};
type NspdSearchResponse = {
  data?: { features?: NspdFeature[] };
  error?: string;
  detail?: string;
};
type CadastreSearchResult = {
  cadNum: string;
  address: string | null;
  area: number | null;
  ring: [number, number][] | null;
};
type CadastreAddressParts = {
  region: string | null;
  district: string | null;
  settlement: string | null;
  streetPlot: string | null;
};
type SummarySelectedField = {
  id: string;
  fieldLabel: string;
  optionLabel: string;
  description: string;
  amount: number;
};

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

const normalizeRussianAddress = (rawAddress: string | null): string | null => {
  if (!rawAddress) {
    return null;
  }
  const trimmed = rawAddress.trim();
  return trimmed
    .replace(/^российская\s+федерация\s*,?\s*/i, "")
    .replace(/^рф\s*,?\s*/i, "")
    .trim();
};

const parseCadastreAddress = (address: string | null): CadastreAddressParts => {
  if (!address) {
    return { region: null, district: null, settlement: null, streetPlot: null };
  }

  const segments = address
    .split(",")
    .map((segment) => segment.trim())
    .filter((segment) => segment.length > 0);

  const used = new Set<number>();
  const pick = (matcher: RegExp) => {
    const index = segments.findIndex((segment, i) => !used.has(i) && matcher.test(segment));
    if (index === -1) {
      return null;
    }
    used.add(index);
    return segments[index]!;
  };

  const region = pick(
    /(область|край|республика|автономный округ|автономная область|федеральная территория|москва|санкт-петербург|севастополь)/i,
  );
  const district = pick(/(муниципальный|городской округ|район|улус|округ)/i);
  const settlement = pick(/(город|г\.|деревня|д\.|село|с\.|поселок|посёлок|пгт|хутор|станица)/i);

  const streetPlotParts = segments.filter((_, i) => !used.has(i));
  const streetPlot = streetPlotParts.length > 0 ? streetPlotParts.join(", ") : null;

  return { region, district, settlement, streetPlot };
};

const normalizeRingForScene = (ring: [number, number][]) => {
  if (ring.length < 3) {
    return "";
  }

  let minX = Number.POSITIVE_INFINITY;
  let minY = Number.POSITIVE_INFINITY;
  let maxX = Number.NEGATIVE_INFINITY;
  let maxY = Number.NEGATIVE_INFINITY;
  for (const [x, y] of ring) {
    if (x < minX) minX = x;
    if (y < minY) minY = y;
    if (x > maxX) maxX = x;
    if (y > maxY) maxY = y;
  }

  const spanX = Math.max(1e-9, maxX - minX);
  const spanY = Math.max(1e-9, maxY - minY);
  const scale = 80 / Math.max(spanX, spanY);
  const centerX = (minX + maxX) / 2;
  const centerY = (minY + maxY) / 2;

  return ring
    .map(([x, y]) => {
      const nx = 50 + (x - centerX) * scale;
      const ny = 50 - (y - centerY) * scale;
      return `${nx.toFixed(2)},${ny.toFixed(2)}`;
    })
    .join(" ");
};

const extractPolygonRing = (feature: NspdFeature): [number, number][] | null => {
  if (feature.geometry?.type !== "Polygon" || !Array.isArray(feature.geometry.coordinates)) {
    return null;
  }
  const outer = feature.geometry.coordinates[0];
  if (!Array.isArray(outer)) {
    return null;
  }

  const points: [number, number][] = [];
  for (const point of outer) {
    if (
      Array.isArray(point) &&
      point.length >= 2 &&
      typeof point[0] === "number" &&
      typeof point[1] === "number"
    ) {
      points.push([point[0], point[1]]);
    }
  }
  return points.length >= 3 ? points : null;
};

const extractCadastreResult = (json: NspdSearchResponse): CadastreSearchResult | null => {
  const feature = json.data?.features?.[0];
  if (!feature || feature.type !== "Feature") {
    return null;
  }

  const props = feature.properties ?? {};
  const options =
    props.options && typeof props.options === "object"
      ? (props.options as Record<string, unknown>)
      : null;

  const cadNum =
    (typeof options?.cad_num === "string" && options.cad_num) ||
    (typeof props.label === "string" && props.label) ||
    "";
  const address =
    typeof options?.readable_address === "string"
      ? normalizeRussianAddress(options.readable_address)
      : null;
  const rawArea = options?.specified_area;
  const area =
    typeof rawArea === "number"
      ? rawArea
      : typeof rawArea === "string" && rawArea.trim().length > 0
        ? Number(rawArea)
        : null;

  if (!cadNum) {
    return null;
  }

  return {
    cadNum,
    address,
    area: Number.isFinite(area) ? area : null,
    ring: extractPolygonRing(feature),
  };
};

export default function Home() {
  const [stepIndex, setStepIndex] = useState(0);
  const [lotSourceTab, setLotSourceTab] = useState<LotSourceTab>("cadastre");
  const [cadastreNumber, setCadastreNumber] = useState("");
  const [cadastreBusy, setCadastreBusy] = useState(false);
  const [cadastreError, setCadastreError] = useState<string | null>(null);
  const [cadastreResult, setCadastreResult] = useState<CadastreSearchResult | null>(null);
  const [selectedItems, setSelectedItems] = useState<Record<Step, string>>(createInitialSelectedItems);
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>(createInitialSelectedOptions);
  const [selectedMultiOptions, setSelectedMultiOptions] = useState<Record<string, string[]>>({});

  const currentStep = steps[stepIndex];
  const activeConfigurableSteps = getActiveConfigurableSteps(stepIndex);
  const currentItems = stepItems[currentStep.id];
  const selectedCurrentItem = getSelectedItem(currentStep.id, selectedItems[currentStep.id]);

  const pickedByStep = useMemo(
    () => buildPickedByStep(activeConfigurableSteps, selectedItems),
    [activeConfigurableSteps, selectedItems],
  );
  const lotEntry = useMemo(
    () => pickedByStep.find((entry) => entry.step === "lot") ?? null,
    [pickedByStep],
  );
  const pricedPickedByStep = useMemo(
    () => pickedByStep.filter((entry) => !(lotSourceTab === "cadastre" && entry.step === "lot")),
    [lotSourceTab, pickedByStep],
  );

  const mapSelectedFields = useCallback(
    (entry: (typeof pickedByStep)[number]): SummarySelectedField[] =>
      entry.item.fields
        .flatMap((field) => {
          const key = optionKey(entry.step, entry.item.id, field.id);
          if (MULTI_SELECT_FIELD_IDS.has(field.id)) {
            const selectedIds = selectedMultiOptions[key] ?? [];
            return selectedIds
              .filter((selectedId) => selectedId !== NONE_OPTION_ID)
              .map((selectedId, index) => {
                const selectedOption = field.options.find((option) => option.id === selectedId);
                return {
                  id: `${field.id}-${selectedId}-${index}`,
                  fieldLabel: field.label,
                  optionLabel: selectedOption?.label ?? "Не выбран",
                  description: selectedOption?.description ?? "Описание не указано",
                  amount: selectedOption?.priceDelta ?? 0,
                };
              });
          }
          const selectedId = selectedOptions[key];

          if (selectedId === NONE_OPTION_ID) {
            return [];
          }

          if (selectedId?.startsWith(SYNTHETIC_OPTION_PREFIX)) {
            const syntheticIndex = Number(
              selectedId.replace(SYNTHETIC_OPTION_PREFIX, "").replace("__", ""),
            );
            return [{
              id: `${field.id}-synthetic`,
              fieldLabel: field.label,
              optionLabel: `Вариант опции ${Number.isFinite(syntheticIndex) ? syntheticIndex : 1}`,
              description: "Базовый вариант без дополнительных работ",
              amount: 0,
            }];
          }

          const selectedOption = field.options.find((option) => option.id === selectedId);
          return [{
            id: `${field.id}-${selectedId ?? "none"}`,
            fieldLabel: field.label,
            optionLabel: selectedOption?.label ?? "Не выбран",
            description: selectedOption?.description ?? "Описание не указано",
            amount: selectedOption?.priceDelta ?? 0,
          }];
        })
        .filter((field): field is SummarySelectedField => Boolean(field?.id)),
    [selectedMultiOptions, selectedOptions],
  );
  const ownedLotSelectedFields = useMemo(
    () => (lotSourceTab === "cadastre" && lotEntry ? mapSelectedFields(lotEntry) : []),
    [lotEntry, lotSourceTab, mapSelectedFields],
  );
  const ownedLotAddonsTotal = useMemo(() => {
    if (lotSourceTab !== "cadastre" || !lotEntry) {
      return 0;
    }
    return lotEntry.item.fields.reduce((total, field) => {
      const key = optionKey(lotEntry.step, lotEntry.item.id, field.id);
      if (MULTI_SELECT_FIELD_IDS.has(field.id)) {
        const selectedIds = selectedMultiOptions[key] ?? [];
        const fieldTotal = selectedIds.reduce((sum, selectedId) => {
          if (selectedId === NONE_OPTION_ID || selectedId.startsWith(SYNTHETIC_OPTION_PREFIX)) {
            return sum;
          }
          const selectedOption = field.options.find((option) => option.id === selectedId);
          return sum + (selectedOption?.priceDelta ?? 0);
        }, 0);
        return total + fieldTotal;
      }

      const selectedId = selectedOptions[key];
      if (!selectedId || selectedId === NONE_OPTION_ID || selectedId.startsWith(SYNTHETIC_OPTION_PREFIX)) {
        return total;
      }
      const selectedOption = field.options.find((option) => option.id === selectedId);
      return total + (selectedOption?.priceDelta ?? 0);
    }, 0);
  }, [lotEntry, lotSourceTab, selectedMultiOptions, selectedOptions]);
  const totals = useMemo(() => {
    const baseTotals = calculateTotals(pricedPickedByStep, selectedOptions);
    if (lotSourceTab !== "cadastre") {
      return {
        ...baseTotals,
        discount: 0,
        finalTotal: baseTotals.base + baseTotals.options,
      };
    }
    const options = baseTotals.options + ownedLotAddonsTotal;
    const subtotal = baseTotals.base + options;
    return {
      base: baseTotals.base,
      options,
      discount: 0,
      finalTotal: subtotal,
    };
  }, [lotSourceTab, ownedLotAddonsTotal, pricedPickedByStep, selectedOptions]);
  const isCadastreNumberValid = CADASTRE_VALID_PATTERN.test(cadastreNumber);
  const cadastreScenePoints = useMemo(
    () => (cadastreResult?.ring ? normalizeRingForScene(cadastreResult.ring) : ""),
    [cadastreResult],
  );
  const cadastreAddressParts = useMemo(
    () => parseCadastreAddress(cadastreResult?.address ?? null),
    [cadastreResult?.address],
  );
  const cadastreAddressLines = useMemo(
    () =>
      [
        cadastreAddressParts.region,
        cadastreAddressParts.district,
        cadastreAddressParts.settlement,
        cadastreAddressParts.streetPlot,
      ].filter((line): line is string => Boolean(line && line.trim())),
    [
      cadastreAddressParts.region,
      cadastreAddressParts.district,
      cadastreAddressParts.settlement,
      cadastreAddressParts.streetPlot,
    ],
  );
  const onCadastreSearch = useCallback(async () => {
    if (!isCadastreNumberValid || cadastreBusy) {
      return;
    }

    setCadastreBusy(true);
    setCadastreError(null);
    setCadastreResult(null);

    try {
      // Шаг 1: прямой запрос из браузера (IP пользователя).
      const directUrl = new URL("https://nspd.gov.ru/api/geoportal/v2/search/geoportal");
      directUrl.searchParams.set("thematicSearchId", "1");
      directUrl.searchParams.set("query", cadastreNumber);
      try {
        const browserRes = await fetch(directUrl.toString(), {
          method: "GET",
          mode: "cors",
          credentials: "include",
          cache: "no-store",
        });
        const browserJson = (await browserRes.json()) as NspdSearchResponse;
        if (browserRes.ok) {
          const directParsed = extractCadastreResult(browserJson);
          if (directParsed) {
            setCadastreResult(directParsed);
            return;
          }
        }
      } catch {
        // Fallback ниже через серверный прокси.
      }

      // Шаг 2: fallback через серверный прокси.
      const response = await fetch(`/api/cadastre/search?q=${encodeURIComponent(cadastreNumber)}`);
      const json = (await response.json()) as NspdSearchResponse;

      if (!response.ok) {
        setCadastreError(
          json.detail
            ? `${json.error ?? `Ошибка запроса (${response.status})`}: ${json.detail}`
            : (json.error ?? `Ошибка запроса (${response.status})`),
        );
        return;
      }

      const parsed = extractCadastreResult(json);
      if (!parsed) {
        setCadastreError("По данному кадастровому номеру участок не найден.");
        return;
      }

      setCadastreResult(parsed);
    } catch (error) {
      setCadastreError(error instanceof Error ? error.message : "Сетевая ошибка.");
    } finally {
      setCadastreBusy(false);
    }
  }, [cadastreBusy, cadastreNumber, isCadastreNumberValid]);
  const summaryByStep = useMemo(
    () =>
      pricedPickedByStep.map((entry) => ({
        ...entry,
        selectedFields: mapSelectedFields(entry),
      })),
    [mapSelectedFields, pricedPickedByStep],
  );
  const ownedLotGroups = useMemo(() => {
    const grouped = new Map<string, { label: string; total: number; items: SummarySelectedField[] }>();
    for (const field of ownedLotSelectedFields) {
      const current = grouped.get(field.fieldLabel);
      if (current) {
        current.total += field.amount;
        current.items.push(field);
      } else {
        grouped.set(field.fieldLabel, {
          label: field.fieldLabel,
          total: field.amount,
          items: [field],
        });
      }
    }
    return Array.from(grouped.values());
  }, [ownedLotSelectedFields]);

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
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    void onCadastreSearch();
                  }
                }}
                placeholder="00:00:0000000:00000"
                inputMode="numeric"
                maxLength={26}
              />
              <button
                type="button"
                className="ghost-btn cadastre-search-btn cadastre-search-btn--green"
                disabled={!isCadastreNumberValid || cadastreBusy}
                onClick={() => void onCadastreSearch()}
              >
                {cadastreBusy ? "Поиск..." : "Найти"}
              </button>
              {cadastreError ? <p className="cadastre-search-error">{cadastreError}</p> : null}
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
              {lotSourceTab === "cadastre" && cadastreScenePoints ? (
                <svg className="scene-cadastre-svg" viewBox="0 0 100 100" preserveAspectRatio="xMidYMid meet">
                  <polygon className="scene-cadastre-stroke" points={cadastreScenePoints} />
                </svg>
              ) : null}
              <div className={["scene-overlay", lotSourceTab === "cadastre" ? "scene-overlay-cadastre" : ""].join(" ")}>
                {lotSourceTab === "cadastre" && cadastreResult ? (
                  <>
                    <p className="scene-cadastre-row">
                      <span className="scene-cadastre-label">Кадастровый номер:</span>
                      <span className="scene-cadastre-value">{cadastreResult.cadNum}</span>
                    </p>
                    <p className="scene-cadastre-row scene-cadastre-row-address">
                      <span className="scene-cadastre-label">Адрес:</span>
                      {cadastreAddressLines.length > 0 ? (
                        cadastreAddressLines.map((line) => (
                          <span key={line} className="scene-cadastre-value scene-cadastre-value-address">
                            {line}
                          </span>
                        ))
                      ) : (
                        <span className="scene-cadastre-value">—</span>
                      )}
                    </p>
                    {cadastreResult.area != null ? (
                      <p className="scene-cadastre-row">
                        <span className="scene-cadastre-label">Площадь:</span>
                        <span className="scene-cadastre-value">
                          {`${cadastreResult.area.toLocaleString("ru-RU")} м²`}
                        </span>
                      </p>
                    ) : null}
                  </>
                ) : (
                  <>
                    <h3>{currentStep.label}</h3>
                    <p>{selectedCurrentItem.title}</p>
                    <p>{selectedCurrentItem.subtitle}</p>
                  </>
                )}
              </div>
            </div>
            <section className="bottom-params">
              {selectedCurrentItem.fields.length === 0 ? (
                <p className="muted">На этом шаге нет дополнительных параметров.</p>
              ) : (
                <div className="params-grid">
                  {selectedCurrentItem.fields.map((field) => (
                    <article key={field.id} className="param-card">
                      <div className="param-card-head">
                        <h4>{field.label}</h4>
                      </div>
                      <div className="param-options">
                        {Array.from({ length: MAX_OPTIONS_PER_FIELD }).map((_, index) => {
                          const key = optionKey(currentStep.id, selectedCurrentItem.id, field.id);
                          const isMultiSelect = MULTI_SELECT_FIELD_IDS.has(field.id);
                          const selectedIds = isMultiSelect ? (selectedMultiOptions[key] ?? []) : [];
                          const isNoneSelected = isMultiSelect
                            ? selectedIds.length === 0 || selectedIds.includes(NONE_OPTION_ID)
                            : selectedOptions[key] === NONE_OPTION_ID;
                          const isNoneSlot = index === MAX_OPTIONS_PER_FIELD - 1;
                          if (isNoneSlot) {
                            return (
                              <button
                                key={`none-${field.id}`}
                                className={["param-option", isNoneSelected ? "is-selected" : "", "is-placeholder"].join(" ")}
                                type="button"
                                onClick={() =>
                                  isMultiSelect
                                    ? setSelectedMultiOptions((prev) => ({
                                        ...prev,
                                        [key]: [NONE_OPTION_ID],
                                      }))
                                    : setSelectedOptions((prev) => ({
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
                            const isSyntheticSelected = isMultiSelect
                              ? selectedIds.includes(syntheticId)
                              : selectedOptions[key] === syntheticId;
                            return (
                              <button
                                key={`synthetic-${field.id}-${index}`}
                                className={["param-option", isSyntheticSelected ? "is-selected" : ""].join(" ")}
                                type="button"
                                onClick={() =>
                                  isMultiSelect
                                    ? setSelectedMultiOptions((prev) => ({
                                        ...prev,
                                        [key]: [syntheticId],
                                      }))
                                    : setSelectedOptions((prev) => ({
                                        ...prev,
                                        [key]: syntheticId,
                                      }))
                                }
                              >
                                <span className="param-option-main">
                                  <span className="param-option-title-row">
                                    <span className="param-option-title">{`Вариант ${index + 1}`}</span>
                                  </span>
                                </span>
                                <span className="param-option-meta">0 руб.</span>
                              </button>
                            );
                          }

                          const isSelected = isMultiSelect
                            ? selectedIds.includes(option.id)
                            : selectedOptions[key] === option.id;
                          return (
                            <button
                              key={option.id}
                              className={["param-option", isSelected ? "is-selected" : ""].join(" ")}
                              type="button"
                              onClick={() =>
                                isMultiSelect
                                  ? setSelectedMultiOptions((prev) => {
                                      const current = prev[key] ?? [];
                                      const withoutNone = current.filter((id) => id !== NONE_OPTION_ID);
                                      const next = withoutNone.includes(option.id)
                                        ? withoutNone.filter((id) => id !== option.id)
                                        : [...withoutNone, option.id];
                                      return {
                                        ...prev,
                                        [key]: next.length > 0 ? next : [NONE_OPTION_ID],
                                      };
                                    })
                                  : setSelectedOptions((prev) => ({
                                      ...prev,
                                      [key]: option.id,
                                    }))
                              }
                            >
                              <span className="param-option-main">
                                <span className="param-option-title-row">
                                  <span className="param-option-title">{option.label}</span>
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
          {lotSourceTab === "cadastre" ? (
            <div className="summary-item summary-item--primary">
              <div className="summary-line">
                <span>Участок</span>
                <span>{formatPrice(0)}</span>
              </div>
              <p className="summary-note">в собственности</p>
            </div>
          ) : null}
          {lotSourceTab === "cadastre" && ownedLotGroups.length > 0 ? (
            <div className="summary-extra-section">
              <p className="summary-extra-title">Дополнительные услуги</p>
              {ownedLotGroups.map((group) => (
                <div key={`owned-group-${group.label}`} className="summary-group">
                  <div className="summary-line summary-line--service">
                    <span>{group.label}</span>
                    <span>{formatPrice(group.total)}</span>
                  </div>
                  {group.items.map((item) => (
                    <div key={`owned-lot-${item.id}`} className="summary-subline">
                      <span>{item.optionLabel}</span>
                      <span>{item.amount > 0 ? `+${formatPrice(item.amount)}` : formatPrice(0)}</span>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          ) : null}
          {summaryByStep.map((entry) => (
            <div key={entry.item.id} className="summary-item">
              <div className="summary-line">
                <span>{entry.item.title}</span>
                <span>{formatPrice(entry.item.basePrice)}</span>
              </div>
              {entry.selectedFields.map((selectedField) => (
                <div key={`${entry.item.id}-${selectedField.id}`} className="summary-subline">
                  <span>{selectedField.optionLabel}</span>
                  <span>{selectedField.amount > 0 ? `+${formatPrice(selectedField.amount)}` : formatPrice(0)}</span>
                </div>
              ))}
            </div>
          ))}
          <hr />
          <p className="summary-subline">
            <span>Стоимость участка</span>
            <span>{formatPrice(totals.base)}</span>
          </p>
          <p className="summary-subline">
            <span>Стоимость доп. услуг</span>
            <span>{formatPrice(totals.options)}</span>
          </p>
          <p className="summary-total-line">
            <span>ИТОГО</span>
            <span>{formatPrice(totals.finalTotal)}</span>
          </p>
        </aside>
      </main>
    </div>
  );
}
