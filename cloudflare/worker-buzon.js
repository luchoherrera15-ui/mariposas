/**
 * Email Worker de Cloudflare para info@tropicalbutterflies.lat
 *
 * 1. Manda el correo completo al sitio (se guarda en /admin/correo).
 * 2. Lo reenvía a Gmail, pase lo que pase con el paso 1.
 *
 * Variables del Worker (Settings → Variables and Secrets):
 *   BUZON_URL    = https://tropicalbutterflies.lat/api/correo/entrante
 *   BUZON_CLAVE  = (la misma clave que CORREO_WEBHOOK_SECRETO en Vercel) → tipo Secret
 *   REENVIAR_A   = luchoherrera15@gmail.com
 */
export default {
  async email(message, env, ctx) {
    const crudo = await new Response(message.raw).arrayBuffer();

    try {
      const r = await fetch(env.BUZON_URL, {
        method: "POST",
        headers: {
          "content-type": "message/rfc822",
          "x-buzon-clave": env.BUZON_CLAVE,
          "x-buzon-de": message.from,
          "x-buzon-para": message.to,
        },
        body: crudo,
      });
      if (!r.ok) console.log("El sitio respondió", r.status, await r.text());
    } catch (error) {
      console.log("No se pudo guardar en el sitio:", error);
    }

    if (env.REENVIAR_A) {
      await message.forward(env.REENVIAR_A);
    }
  },
};
