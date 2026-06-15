const FIELD_LABELS = Object.freeze({
  one_line: "one line",
  display_name_snapshot: "public name",
  is_anonymous: "attribution",
  category_id: "category",
  frame_id: "frame",
  tags: "mood tags",
  status: "publication status",
  is_photo_of_week: "photo of the week",
  is_category_featured: "featured moment",
});

function formatBoolean(field, value) {
  if (field === "is_anonymous") {
    return value ? "anonymous" : "named";
  }

  if (field === "is_photo_of_week") {
    return value ? "selected" : "not selected";
  }

  if (field === "is_category_featured") {
    return value ? "featured" : "not featured";
  }

  return value ? "yes" : "no";
}

function formatValue(field, value, lookups) {
  if (value === null || value === undefined || value === "") {
    return "none";
  }

  if (field === "category_id") {
    return lookups.categoryById?.get(String(value)) ?? "previous category";
  }

  if (field === "frame_id") {
    return lookups.frameById?.get(String(value)) ?? "previous frame";
  }

  if (Array.isArray(value)) {
    return value.length ? value.map((item) => `#${item}`).join(", ") : "none";
  }

  if (typeof value === "boolean") {
    return formatBoolean(field, value);
  }

  return String(value).replaceAll("_", " ");
}

export function buildAdminChangeEvents(edits = [], lookups = {}) {
  const eventsBySubmission = new Map();
  const eventIndexes = new Map();

  edits.forEach((edit) => {
    const submissionId = edit.submission_id;
    const eventKey = [
      submissionId,
      edit.admin_id,
      edit.created_at,
      edit.reason,
    ].join(":");
    let event = eventIndexes.get(eventKey);

    if (!event) {
      event = {
        id: edit.id,
        createdAt: edit.created_at,
        reason: edit.reason,
        changes: [],
      };
      eventIndexes.set(eventKey, event);

      const submissionEvents = eventsBySubmission.get(submissionId) ?? [];
      submissionEvents.push(event);
      eventsBySubmission.set(submissionId, submissionEvents);
    }

    event.changes.push({
      id: edit.id,
      field: edit.changed_field,
      label: FIELD_LABELS[edit.changed_field] ?? edit.changed_field,
      before: formatValue(edit.changed_field, edit.old_value, lookups),
      after: formatValue(edit.changed_field, edit.new_value, lookups),
    });
  });

  return eventsBySubmission;
}
