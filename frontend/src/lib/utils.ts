const API_BASE = "";

export function getAuthToken(): string | null {
  return localStorage.getItem("vps_token");
}

export async function apiFetch(path: string, options: RequestInit = {}): Promise<any> {
  const token = getAuthToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };
  if (token) headers["authorization"] = `Bearer ${token}`;
  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || data.message || `HTTP ${res.status}`);
  return data;
}

export function cn(...classes: (string | boolean | undefined | null)[]): string {
  return classes.filter(Boolean).join(" ");
}

export function formatDate(d: any): string {
  if (!d) return "-";
  const date = new Date(d);
  return date.toLocaleDateString("id-ID", { year: "numeric", month: "short", day: "numeric" });
}

export function formatCurrency(n: number): string {
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(n);
}

export function getInitials(name: string): string {
  return name?.split(" ").map((w: string) => w[0]).join("").toUpperCase().slice(0, 2) || "??";
}
