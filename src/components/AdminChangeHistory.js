import Icon from "./Icon";

const DATE_FORMATTER = new Intl.DateTimeFormat("en-CA", {
  month: "short",
  day: "numeric",
  year: "numeric",
  hour: "numeric",
  minute: "2-digit",
});

export default function AdminChangeHistory({
  events = [],
  defaultOpen = false,
  compact = false,
}) {
  if (!events.length) {
    return null;
  }

  const changeCount = events.reduce(
    (total, event) => total + event.changes.length,
    0
  );

  return (
    <details
      className={`admin-change-history ${compact ? "is-compact" : ""}`}
      open={defaultOpen}
    >
      <summary>
        <span>
          <Icon name="journal" size={14} />
          admin change history
        </span>
        <small>
          {changeCount} {changeCount === 1 ? "change" : "changes"}
        </small>
      </summary>

      <ol>
        {events.map((event) => (
          <li key={event.id}>
            <div className="admin-change-event-heading">
              <strong>
                {event.changes.length}{" "}
                {event.changes.length === 1 ? "field changed" : "fields changed"}
              </strong>
              <time dateTime={event.createdAt}>
                {DATE_FORMATTER.format(new Date(event.createdAt))}
              </time>
            </div>

            <div className="admin-change-fields">
              {event.changes.map((change) => (
                <div key={change.id}>
                  <span>{change.label}</span>
                  <p>
                    <del>{change.before}</del>
                    <Icon name="arrow" size={12} />
                    <ins>{change.after}</ins>
                  </p>
                </div>
              ))}
            </div>

            <p className="admin-change-reason">
              <strong>admin note</strong>
              {event.reason}
            </p>
          </li>
        ))}
      </ol>
    </details>
  );
}
