export default function PageIntro({
  eyebrow,
  title,
  description,
  children,
}) {
  return (
    <header className="page-intro">
      <div className="page-intro-mark" aria-hidden="true">
        <span />
      </div>
      <div>
        {eyebrow ? <p className="eyebrow">{eyebrow}</p> : null}
        <h1>{title}</h1>
        {description ? <p className="page-description">{description}</p> : null}
      </div>
      {children}
    </header>
  );
}
