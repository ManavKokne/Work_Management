export function parsePhotoUrls(photoValue) {
  if (!photoValue) {
    return [];
  }

  if (Array.isArray(photoValue)) {
    return photoValue.filter((value) => typeof value === "string" && value.trim().length > 0);
  }

  if (typeof photoValue !== "string") {
    return [];
  }

  const trimmed = photoValue.trim();
  if (!trimmed) {
    return [];
  }

  try {
    const parsed = JSON.parse(trimmed);
    if (Array.isArray(parsed)) {
      return parsed.filter((value) => typeof value === "string" && value.trim().length > 0);
    }
  } catch {
    // Legacy single-url storage falls through below.
  }

  return [trimmed];
}

export function serializePhotoUrls(photoUrls) {
  const normalized = parsePhotoUrls(photoUrls);
  if (!normalized.length) {
    return null;
  }

  return JSON.stringify(normalized);
}
