let counter = 0;

/**
 * Generate a simple unique ID.
 * Not cryptographically secure — fine for game entities.
 */
export function generateId(): string {
  counter += 1;
  return `${Date.now().toString(36)}-${counter.toString(36)}`;
}
