const baseUrl = import.meta.env.VITE_API_URL || "";

export async function api(path: string, options: RequestInit = {}) {
  const token = localStorage.getItem("auth_token");
  const res = await fetch(`${baseUrl}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || res.statusText);
  return data;
}
