/**
 * Transform API response keys from PascalCase to snake_case
 */
function pascalToSnake(str: string): string {
  return str.replace(/([A-Z])/g, (match) => `_${match.toLowerCase()}`).replace(/^_/, "");
}

function transformKeys(obj: unknown): unknown {
  if (Array.isArray(obj)) {
    return obj.map((item) => transformKeys(item));
  }

  if (obj !== null && typeof obj === "object") {
    const transformed: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(obj)) {
      const snakeKey = pascalToSnake(key);
      transformed[snakeKey] = transformKeys(value);
    }
    return transformed;
  }

  return obj;
}

export function transformResponse<T>(data: unknown): T {
  return transformKeys(data) as T;
}
