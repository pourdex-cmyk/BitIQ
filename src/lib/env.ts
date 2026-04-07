export function getEnv(name: string): string | undefined {
  const value = process.env[name];

  if (typeof value !== "string") {
    return undefined;
  }

  const normalized = value.trim().replace(/^["']|["']$/g, "").trim();
  return normalized.length > 0 ? normalized : undefined;
}

export function getRequiredEnv(name: string): string {
  const value = getEnv(name);

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}
