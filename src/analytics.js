function getSource(referrer) {
  if (!referrer) return "direct";

  try {
    return new URL(referrer).hostname;
  } catch {
    return "direct";
  }
}

export async function sendVisit({
  endpoint,
  referrer = "",
  eventId = crypto.randomUUID(),
  fetcher = fetch,
}) {
  const url = new URL(
    endpoint,
    globalThis.location?.origin || "https://localhost",
  );

  if (!["http:", "https:"].includes(url.protocol)) {
    throw new Error("Endpoint inválido");
  }

  const response = await fetcher(url.href, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ eventId, source: getSource(referrer) }),
    credentials: "omit",
    cache: "no-store",
    keepalive: true,
    signal: AbortSignal.timeout(5000),
  });

  if (!response.ok) {
    throw new Error(`Registro indisponível: ${response.status}`);
  }
}

export async function recordPageView() {
  try {
    const response = await fetch("/config.json", { cache: "no-store" });
    if (!response.ok) return;

    const config = await response.json();
    if (!config.analyticsEnabled) return;

    await sendVisit({
      endpoint: config.visitsEndpoint || "/api/visits",
      referrer: document.referrer,
    });
  } catch {
    // A API é opcional. Uma falha na medição não impede a página de abrir.
  }
}
