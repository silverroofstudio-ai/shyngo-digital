
const json = (statusCode, body) => ({
  statusCode,
  headers: {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
  },
  body: JSON.stringify(body),
});

export default async (request) => {
  if (request.httpMethod !== "POST") {
    return json(405, { error: "method_not_allowed" });
  }

  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  if (!token || !chatId) {
    return json(500, { error: "service_not_configured" });
  }

  let data;
  try {
    data = JSON.parse(request.body || "{}");
  } catch {
    return json(400, { error: "invalid_json" });
  }

  const clean = (v, max) => String(v ?? "").trim().slice(0, max);
  const name = clean(data.name, 80);
  const city = clean(data.city, 80);
  const contact = clean(data.contact, 100);
  const channel = clean(data.channel, 40);
  const type = clean(data.type, 80);
  const budget = clean(data.budget, 80);
  const details = clean(data.details, 1200);
  const language = data.language === "kz" ? "KZ" : "RU";

  if (!name || !city || !contact) {
    return json(400, { error: "required_fields_missing" });
  }

  const message = [
    "🟢 НОВАЯ ЗАЯВКА — SHYNGO DIGITAL",
    "",
    `👤 Имя: ${name}`,
    `📍 Город: ${city}`,
    `☎️ Контакт: ${contact}`,
    `💬 Связь: ${channel || "—"}`,
    `🌐 Тип сайта: ${type || "—"}`,
    `💰 Бюджет: ${budget || "—"}`,
    `📝 Детали: ${details || "—"}`,
    `🌍 Язык формы: ${language}`,
  ].join("\n");

  try {
    const response = await fetch(
      `https://api.telegram.org/bot${token}/sendMessage`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chat_id: chatId, text: message }),
      }
    );

    const result = await response.json();

    if (!response.ok || !result.ok) {
      return json(502, { error: "telegram_delivery_failed" });
    }

    return json(200, { ok: true });
  } catch {
    return json(502, { error: "telegram_unavailable" });
  }
};
