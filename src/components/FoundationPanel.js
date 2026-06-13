import Icon from "./Icon";

export default function FoundationPanel({
  title,
  description,
  items = [],
  eyebrow = "coming into focus",
  icon = "sparkle",
}) {
  return (
    <section className="foundation-panel">
      <div className="panel-icon">
        <Icon name={icon} size={20} />
      </div>
      <div className="panel-copy">
        <p className="eyebrow">{eyebrow}</p>
        <h2>{title}</h2>
        <p>{description}</p>
      </div>

      {items.length > 0 ? (
        <ul>
          {items.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}
