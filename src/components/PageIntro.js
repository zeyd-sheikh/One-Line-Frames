export default function PageIntro({
  eyebrow,
  title,
  description,
  children,
}) {
  return (
    <header className="page-intro">
      {eyebrow ? <p className="eyebrow">{eyebrow}</p> : null}
      <h1>{title}</h1>
      {description ? <p className="page-description">{description}</p> : null}
      {children}
    </header>
  );
}
