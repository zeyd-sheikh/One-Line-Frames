export default function FoundationPanel({ title, description, items = [] }) {
  return (
    <section className="foundation-panel">
      <div>
        <p className="eyebrow">foundation preview</p>
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
