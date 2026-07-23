const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function recognizableUsername(
  value: string | null | undefined,
): string | null {
  const normalized = value?.trim();
  if (!normalized || UUID_PATTERN.test(normalized)) {
    return null;
  }
  return normalized;
}
