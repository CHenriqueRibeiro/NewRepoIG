/**
 * Extrai o primeiro nome cordial para comunicação humana no Instagram.
 * Ex: "Ana Késia Rodrigues" -> "Ana"
 * Ex: "Maria Clara Santos" -> "Maria"
 * Ex: "@anakesiaa" -> ""
 * Ex: "Cliente" -> ""
 */
export function getFriendlyFirstName(fullNameOrHandle?: string): string {
  if (!fullNameOrHandle) return '';
  const trimmed = fullNameOrHandle.trim();
  if (!trimmed || trimmed === 'Cliente' || trimmed.startsWith('@')) return '';

  const clean = trimmed.replace(/^[@#]+/, '').trim();
  const parts = clean.split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '';

  const first = parts[0].charAt(0).toUpperCase() + parts[0].slice(1).toLowerCase();
  return first;
}
