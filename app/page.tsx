"use client";

import { useMemo, useState } from "react";

type ParameterOption = {
  id: string;
  label: string;
  priceDelta: number;
};

type ParameterField = {
  id: string;
  label: string;
  options: ParameterOption[];
};

type ConfigItem = {
  id: string;
  title: string;
  subtitle: string;
  basePrice: number;
  fields: ParameterField[];
};

type Step =
  | "lot"
  | "house"
  | "placement"
  | "interior"
  | "engineering"
  | "proposal";

const steps: { id: Step; label: string }[] = [
  { id: "lot", label: "Участок" },
  { id: "house", label: "Дом" },
  { id: "placement", label: "Экстерьер" },
  { id: "interior", label: "Интерьер" },
  { id: "engineering", label: "Инженерия" },
  { id: "proposal", label: "КП" },
];

const stepItems: Record<Step, ConfigItem[]> = {
  lot: [
    {
      id: "lot-1",
      title: "Участок 1",
      subtitle: "12.5 соток, прямоугольный",
      basePrice: 640000,
      fields: [
        {
          id: "soil",
          label: "Тип грунта",
          options: [
            { id: "stable", label: "Стабильный", priceDelta: 0 },
            { id: "mixed", label: "Смешанный", priceDelta: 60000 },
            { id: "complex", label: "Сложный", priceDelta: 140000 },
          ],
        },
        {
          id: "relief",
          label: "Рельеф",
          options: [
            { id: "flat", label: "Ровный", priceDelta: 0 },
            { id: "slope", label: "Уклон", priceDelta: 45000 },
          ],
        },
      ],
    },
    {
      id: "lot-2",
      title: "Участок 2",
      subtitle: "15 соток, ровный",
      basePrice: 760000,
      fields: [
        {
          id: "access",
          label: "Подъезд к участку",
          options: [
            { id: "base", label: "Базовый", priceDelta: 0 },
            { id: "premium", label: "Усиленный", priceDelta: 85000 },
          ],
        },
      ],
    },
    {
      id: "lot-3",
      title: "Участок 3",
      subtitle: "18 соток, с уклоном",
      basePrice: 840000,
      fields: [
        {
          id: "prep",
          label: "Подготовка рельефа",
          options: [
            { id: "base", label: "Базовая", priceDelta: 0 },
            { id: "reinforced", label: "Усиленная", priceDelta: 120000 },
          ],
        },
      ],
    },
  ],
  house: [
    {
      id: "comfort-120",
      title: "Комфорт 120",
      subtitle: "2 этажа, 118.5 м²",
      basePrice: 8450000,
      fields: [
        {
          id: "facade",
          label: "Материал фасада",
          options: [
            { id: "wood", label: "Дерево", priceDelta: 0 },
            { id: "stone", label: "Камень + дерево", priceDelta: 180000 },
          ],
        },
      ],
    },
    {
      id: "family-150",
      title: "Семейный 150",
      subtitle: "2 этажа, 146.2 м²",
      basePrice: 9750000,
      fields: [
        {
          id: "roof",
          label: "Кровля",
          options: [
            { id: "metal", label: "Металл", priceDelta: 0 },
            { id: "ceramic", label: "Керамика", priceDelta: 220000 },
          ],
        },
      ],
    },
    {
      id: "premium-180",
      title: "Премиум 180",
      subtitle: "2 этажа, 182.4 м²",
      basePrice: 11600000,
      fields: [
        {
          id: "windows",
          label: "Остекление",
          options: [
            { id: "base", label: "Энерго пакет", priceDelta: 0 },
            { id: "panorama", label: "Панорамное", priceDelta: 340000 },
          ],
        },
      ],
    },
  ],
  placement: [
    {
      id: "drainage",
      title: "Водосточная система",
      subtitle: "Отвод осадков и защита фасада",
      basePrice: 135000,
      fields: [
        {
          id: "material",
          label: "Материал",
          options: [
            { id: "pvc", label: "ПВХ", priceDelta: 0 },
            { id: "metal", label: "Металл", priceDelta: 45000 },
            { id: "copper", label: "Медь", priceDelta: 120000 },
          ],
        },
        {
          id: "color",
          label: "Цвет",
          options: [
            { id: "graphite", label: "Графит", priceDelta: 0 },
            { id: "brown", label: "Коричневый", priceDelta: 8000 },
            { id: "white", label: "Белый", priceDelta: 6000 },
          ],
        },
      ],
    },
    {
      id: "terrace",
      title: "Терраса",
      subtitle: "Открытая зона отдыха",
      basePrice: 240000,
      fields: [
        {
          id: "deck",
          label: "Настил",
          options: [
            { id: "larch", label: "Лиственница", priceDelta: 0 },
            { id: "composite", label: "Композит", priceDelta: 70000 },
          ],
        },
      ],
    },
    {
      id: "lighting",
      title: "Ландшафтное освещение",
      subtitle: "Подсветка дорожек и акцентов",
      basePrice: 160000,
      fields: [
        {
          id: "scenario",
          label: "Сценарий",
          options: [
            { id: "base", label: "Базовый", priceDelta: 0 },
            { id: "smart", label: "Смарт-сценарии", priceDelta: 65000 },
          ],
        },
      ],
    },
  ],
  interior: [
    {
      id: "bedroom",
      title: "Спальня",
      subtitle: "24.6 м²",
      basePrice: 310000,
      fields: [
        {
          id: "style",
          label: "Стиль",
          options: [
            { id: "scandi", label: "Скандинавский", priceDelta: 0 },
            { id: "modern", label: "Современный", priceDelta: 60000 },
          ],
        },
      ],
    },
    {
      id: "kitchen",
      title: "Кухня-гостиная",
      subtitle: "34.4 м²",
      basePrice: 470000,
      fields: [
        {
          id: "kitchen-set",
          label: "Кухонный гарнитур",
          options: [
            { id: "comfort", label: "Комфорт", priceDelta: 0 },
            { id: "premium", label: "Премиум", priceDelta: 150000 },
          ],
        },
      ],
    },
    {
      id: "bathroom",
      title: "Санузел",
      subtitle: "8.2 м²",
      basePrice: 230000,
      fields: [
        {
          id: "tile",
          label: "Плитка",
          options: [
            { id: "base", label: "Базовая", priceDelta: 0 },
            { id: "designer", label: "Дизайнерская", priceDelta: 95000 },
          ],
        },
      ],
    },
  ],
  engineering: [
    {
      id: "heating",
      title: "Отопление",
      subtitle: "Тёплый пол + радиаторы",
      basePrice: 520000,
      fields: [
        {
          id: "source",
          label: "Источник тепла",
          options: [
            { id: "gas", label: "Газовый котёл", priceDelta: 0 },
            { id: "electric", label: "Электрокотёл", priceDelta: 70000 },
            { id: "heat-pump", label: "Тепловой насос", priceDelta: 260000 },
          ],
        },
      ],
    },
    {
      id: "vent",
      title: "Вентиляция",
      subtitle: "Рекуперация",
      basePrice: 340000,
      fields: [
        {
          id: "level",
          label: "Уровень",
          options: [
            { id: "comfort", label: "Комфорт", priceDelta: 0 },
            { id: "silent", label: "Тихий премиум", priceDelta: 85000 },
          ],
        },
      ],
    },
    {
      id: "smart",
      title: "Умный дом",
      subtitle: "Базовая автоматизация",
      basePrice: 390000,
      fields: [
        {
          id: "package",
          label: "Пакет",
          options: [
            { id: "base", label: "Базовый", priceDelta: 0 },
            { id: "extended", label: "Расширенный", priceDelta: 140000 },
          ],
        },
      ],
    },
  ],
  proposal: [
    {
      id: "proposal-item",
      title: "Финальная сборка",
      subtitle: "Проверка перед КП",
      basePrice: 0,
      fields: [],
    },
  ],
};

const formatPrice = (value: number) =>
  new Intl.NumberFormat("ru-RU", {
    style: "currency",
    currency: "RUB",
    maximumFractionDigits: 0,
  }).format(value);

const optionKey = (step: Step, itemId: string, fieldId: string) =>
  `${step}:${itemId}:${fieldId}`;

export default function Home() {
  const [stepIndex, setStepIndex] = useState(0);
  const [selectedItems, setSelectedItems] = useState<Record<Step, string>>({
    lot: stepItems.lot[0].id,
    house: stepItems.house[0].id,
    placement: stepItems.placement[0].id,
    interior: stepItems.interior[0].id,
    engineering: stepItems.engineering[0].id,
    proposal: stepItems.proposal[0].id,
  });
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {};
    (Object.keys(stepItems) as Step[]).forEach((step) => {
      stepItems[step].forEach((item) => {
        item.fields.forEach((field) => {
          if (field.options[0]) {
            initial[optionKey(step, item.id, field.id)] = field.options[0].id;
          }
        });
      });
    });
    return initial;
  });

  const currentStep = steps[stepIndex];
  const configurableSteps = steps
    .map((step) => step.id)
    .filter((step): step is Exclude<Step, "proposal"> => step !== "proposal");
  const activeConfigurableSteps = configurableSteps.slice(
    0,
    Math.min(stepIndex + 1, configurableSteps.length),
  );
  const currentItems = stepItems[currentStep.id];
  const selectedCurrentItem =
    currentItems.find((item) => item.id === selectedItems[currentStep.id]) ?? currentItems[0];

  const pickedByStep = useMemo(
    () => {
      return activeConfigurableSteps.map((step) => {
        const list = stepItems[step];
        const selectedId = selectedItems[step];
        return {
          step,
          item: list.find((entry) => entry.id === selectedId) ?? list[0],
        };
      });
    },
    [activeConfigurableSteps, selectedItems],
  );

  const totals = useMemo(() => {
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
    const discount = Math.round(subtotal * 0.04);
    const finalTotal = subtotal - discount;
    return { base, options, discount, finalTotal };
  }, [pickedByStep, selectedOptions]);

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
          <h2 className="panel-title">Варианты этапа</h2>
          <p className="muted">
            {currentStep.label}: {stepIndex + 1} из {steps.length}
          </p>
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
        </aside>

        <section className="center-panel">
          <div className="scene">
            <div className="scene-overlay">
              <h3>{currentStep.label}</h3>
              <p>{selectedCurrentItem.title}</p>
              <p>{selectedCurrentItem.subtitle}</p>
            </div>
          </div>
        </section>

        <aside className="summary-panel">
          <h2>Предварительная калькуляция</h2>
          {pickedByStep.map((entry) => (
            <p key={entry.item.id}>
              {entry.item.title}: {formatPrice(entry.item.basePrice)}
            </p>
          ))}
          <hr />
          <p>База: {formatPrice(totals.base)}</p>
          <p>Параметры: {formatPrice(totals.options)}</p>
          <p>Скидка: - {formatPrice(totals.discount)}</p>
          <p className="summary-price">{formatPrice(totals.finalTotal)}</p>
        </aside>
      </main>

      <section className="bottom-params">
        <header className="bottom-header">
          <h3>Параметры элемента: {selectedCurrentItem.title}</h3>
          <p>{selectedCurrentItem.subtitle}</p>
        </header>
        {selectedCurrentItem.fields.length === 0 ? (
          <p className="muted">На этом шаге нет дополнительных параметров.</p>
        ) : (
          <div className="params-grid">
            {selectedCurrentItem.fields.map((field) => (
              <article key={field.id} className="param-card">
                <h4>{field.label}</h4>
                <div className="param-options">
                  {field.options.map((option) => {
                    const key = optionKey(currentStep.id, selectedCurrentItem.id, field.id);
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
                        <span>{option.label}</span>
                        <span>
                          {option.priceDelta > 0
                            ? `+ ${formatPrice(option.priceDelta)}`
                            : "0 ₽"}
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
  );
}

function OptionGrid({ children }: { children: React.ReactNode }) {
  return <div className="option-grid">{children}</div>;
}

function SelectableCard({
  selected,
  onClick,
  title,
  lines,
}: {
  selected: boolean;
  onClick: () => void;
  title: string;
  lines: string[];
}) {
  return (
    <button
      className={["select-card", selected ? "is-selected" : ""].join(" ")}
      type="button"
      onClick={onClick}
    >
      <h3>{title}</h3>
      {lines.map((line) => (
        <p key={line}>{line}</p>
      ))}
    </button>
  );
}
