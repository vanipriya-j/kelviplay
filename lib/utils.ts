export function cn(...values: Array<string | false | null | undefined>): string {
  return values.filter(Boolean).join(" ");
}

export function initials(name: string): string {
  const parts = name.trim().split(/\s+/).slice(0, 2);
  return parts.map((part) => part[0]?.toUpperCase() ?? "").join("");
}

export function publicName(displayName: string | null | undefined, fallback = "Guest"): string {
  const name = (displayName ?? "").trim();
  if (!name) return fallback;
  if (name.includes("@") || /^\+?\d{8,}$/.test(name)) return fallback;
  return name;
}

export function randomVoucherCode(prefix = "AARLA"): string {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let body = "";
  for (let i = 0; i < 8; i += 1) {
    body += alphabet[Math.floor(Math.random() * alphabet.length)];
  }
  return `${prefix}-${body.slice(0, 4)}-${body.slice(4)}`;
}

export function parseDateInput(value: string): Date | null {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}
