export function parseProductImages(raw: string | null | undefined): string[] {
  if (!raw) {
    return [];
  }

  const value = raw.trim();
  if (!value) {
    return [];
  }

  if (value.startsWith("[") && value.endsWith("]")) {
    try {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed)) {
        return parsed.filter((item): item is string => typeof item === "string" && item.length > 0);
      }
    } catch {
      return [value];
    }
  }

  return [value];
}

export function serializeProductImages(images: string[] | undefined): string | null {
  if (!images) {
    return null;
  }

  const cleaned = Array.from(new Set(images.map((item) => item.trim()).filter(Boolean)));
  if (cleaned.length === 0) {
    return null;
  }

  return JSON.stringify(cleaned);
}

export function firstProductImage(raw: string | null | undefined): string | null {
  const images = parseProductImages(raw);
  return images[0] ?? null;
}
