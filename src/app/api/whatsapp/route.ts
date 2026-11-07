// Envío de alertas por WhatsApp a los familiares principales.
// Con TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN y TWILIO_WHATSAPP_FROM configurados se envía
// de verdad por la API de Twilio (sandbox o número aprobado). Sin ellos, queda simulado.

type Entrada = { telefonos: string[]; texto: string };

const aWhatsApp = (tel: string) => {
  const d = tel.replace(/\D/g, "");
  const e164 = d.length === 10 ? `+52${d}` : `+${d}`;
  return `whatsapp:${e164}`;
};

export async function POST(req: Request) {
  const { telefonos, texto } = (await req.json()) as Entrada;
  const sid = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  const from = process.env.TWILIO_WHATSAPP_FROM;
  if (!sid || !token || !from) return Response.json({ modo: "simulado", enviados: 0 });

  const auth = Buffer.from(`${sid}:${token}`).toString("base64");
  const resultados = await Promise.all(
    telefonos.map(async (tel) => {
      const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`, {
        method: "POST",
        headers: { Authorization: `Basic ${auth}`, "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({ From: from.startsWith("whatsapp:") ? from : `whatsapp:${from}`, To: aWhatsApp(tel), Body: texto }),
      });
      return res.ok;
    }),
  );
  return Response.json({ modo: "real", enviados: resultados.filter(Boolean).length, fallidos: resultados.filter((x) => !x).length });
}
