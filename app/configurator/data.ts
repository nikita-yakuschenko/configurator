import type { ConfigItem, Step, StepDescriptor } from "./types";
import { optionKey } from "./pricing";

export const steps: StepDescriptor[] = [
  { id: "lot", label: "Участок" },
  { id: "house", label: "Дом" },
  { id: "placement", label: "Экстерьер" },
  { id: "interior", label: "Интерьер" },
  { id: "engineering", label: "Инженерия" },
  { id: "proposal", label: "КП" },
];

export const stepItems: Record<Step, ConfigItem[]> = {
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
            {
              id: "stable",
              label: "Стабильный",
              priceDelta: 0,
              description: "Плотный грунт без дополнительного усиления",
              impact: "Стандартный срок",
              recommended: true,
            },
            {
              id: "mixed",
              label: "Смешанный",
              priceDelta: 60000,
              description: "Частичное усиление основания и дренаж",
              impact: "+2 дня к подготовке",
            },
            {
              id: "complex",
              label: "Сложный",
              priceDelta: 140000,
              description: "Расширенные работы по укреплению и геоподготовке",
              impact: "+4 дня к подготовке",
            },
          ],
        },
        {
          id: "relief",
          label: "Рельеф",
          options: [
            {
              id: "flat",
              label: "Ровный",
              priceDelta: 0,
              description: "Без перепада высот, стандартная техника монтажа",
              impact: "Без допработ",
              recommended: true,
            },
            {
              id: "slope",
              label: "Уклон",
              priceDelta: 45000,
              description: "Требуется террасирование и дополнительная подготовка",
              impact: "+1 день к монтажу",
            },
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

export const createInitialSelectedItems = (): Record<Step, string> => ({
  lot: stepItems.lot[0].id,
  house: stepItems.house[0].id,
  placement: stepItems.placement[0].id,
  interior: stepItems.interior[0].id,
  engineering: stepItems.engineering[0].id,
  proposal: stepItems.proposal[0].id,
});

export const createInitialSelectedOptions = (): Record<string, string> => {
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
};
