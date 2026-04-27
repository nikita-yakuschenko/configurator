type SelectableCardProps = {
  selected: boolean;
  onClick: () => void;
  title: string;
  lines: string[];
};

export function SelectableCard({ selected, onClick, title, lines }: SelectableCardProps) {
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
