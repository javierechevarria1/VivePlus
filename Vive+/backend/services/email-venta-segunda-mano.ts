type ImagenEmail = {
  src: string | null;
  adjunto?: { filename: string; content: Buffer; cid: string; contentType: string };
};

// Las imágenes de productos se guardan como data URI base64. Gmail y Outlook
// descartan src="data:...", así que hay que adjuntarlas y referenciarlas por cid.
// Las rutas relativas necesitan además URL absoluta para cargarse desde el correo.
export function prepararImagenVenta(imagen: string | string[] | null | undefined): ImagenEmail {
  let lista: string[] = [];
  if (Array.isArray(imagen)) {
    lista = imagen;
  } else if (typeof imagen === "string") {
    if (imagen.startsWith("[")) {
      try {
        const parsed = JSON.parse(imagen);
        if (Array.isArray(parsed)) lista = parsed;
      } catch {
        lista = [imagen];
      }
    } else {
      lista = [imagen];
    }
  }

  const url = lista.find(i => typeof i === "string" && i.trim() !== "");
  if (!url) return { src: null };

  const dataUri = /^data:(image\/[a-zA-Z0-9.+-]+);base64,([\s\S]+)$/.exec(url);
  if (dataUri) {
    const contentType = dataUri[1];
    const cid = `producto-${Date.now()}@viveplus`;
    return {
      src: `cid:${cid}`,
      adjunto: {
        filename: `producto.${contentType.split("/")[1] || "jpg"}`,
        content: Buffer.from(dataUri[2], "base64"),
        cid,
        contentType,
      },
    };
  }

  if (url.startsWith("http")) return { src: url };

  const base = process.env.NEXT_PUBLIC_BASE_URL || "";
  if (!base) return { src: null };
  return { src: `${base.replace(/\/$/, "")}/${url.replace(/^\//, "")}` };
}

const escapar = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

export function plantillaVentaSegundaMano(params: {
  username: string;
  nombre: string;
  precio: number;
  imagenSrc?: string | null;
  direccionEnvio?: string | null;
  limiteEnvio?: Date | null;
  etiquetaUrl?: string | null;
}) {
  const { username, nombre, precio } = params;
  const imagenUrl = params.imagenSrc ?? null;
  const nombreSeguro = escapar(nombre);
  const usuarioSeguro = escapar(username);
  const fechaLimite = params.limiteEnvio
    ? params.limiteEnvio.toLocaleDateString("es-ES", { day: "numeric", month: "long" })
    : null;

  const bloqueDireccion = params.direccionEnvio
    ? `<p style="margin:14px 0 0;font-size:14px;color:#3C4A43;line-height:1.6;">
         <strong style="color:#13211A;">Enviar a:</strong><br>${escapar(params.direccionEnvio)}
       </p>`
    : "";

  // Miniatura de ancho fijo: las fotos verticales reventarían el alto del correo
  // si se sirvieran a ancho completo, y max-height/object-fit no son fiables aquí.
  const bloqueImagen = imagenUrl
    ? `<tr>
         <td align="center" style="padding:0 28px;">
           <img src="${escapar(imagenUrl)}" alt="${nombreSeguro}" width="240"
                style="display:block;width:240px;max-width:100%;height:auto;border:0;outline:none;text-decoration:none;border-radius:16px;background:#EFEAE1;box-shadow:0 4px 16px rgba(19,33,26,0.12);" />
         </td>
       </tr>`
    : "";

  return `
<div style="display:none;font-size:1px;color:#F7F5F0;line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden;">Tu producto "${nombreSeguro}" acaba de venderse en Vive+.</div>
<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background:#F7F5F0;margin:0;padding:40px 12px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;">
  <tr>
    <td align="center">
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="560" style="width:100%;max-width:560px;background:#FFFFFF;border-radius:22px;overflow:hidden;box-shadow:0 8px 32px rgba(19,33,26,0.10);">

        <tr>
          <td style="background:linear-gradient(135deg,#1A5245 0%,#2A7A6A 100%);padding:40px 28px 34px;text-align:center;">
            <div style="display:inline-block;width:52px;height:52px;line-height:52px;border-radius:50%;background:rgba(255,255,255,0.18);font-size:26px;">✓</div>
            <h1 style="margin:16px 0 6px;color:#FFFFFF;font-size:27px;font-weight:700;letter-spacing:-0.4px;">¡Se ha vendido!</h1>
            <p style="margin:0;color:rgba(255,255,255,0.82);font-size:15px;">Hola ${usuarioSeguro}, tienes buenas noticias</p>
          </td>
        </tr>

        <tr><td style="height:28px;line-height:28px;font-size:0;">&nbsp;</td></tr>

        ${bloqueImagen}

        <tr>
          <td style="padding:22px 28px 0;text-align:center;">
            <p style="margin:0 0 10px;font-size:19px;font-weight:700;color:#13211A;line-height:1.35;">${nombreSeguro}</p>
            <div style="display:inline-block;background:#EAF5F0;border-radius:999px;padding:9px 22px;">
              <span style="font-size:24px;font-weight:800;color:#1A5245;letter-spacing:-0.5px;">€${precio.toFixed(2)}</span>
            </div>
          </td>
        </tr>

        <tr>
          <td style="padding:26px 28px 0;">
            <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background:#F7F5F0;border-radius:14px;">
              <tr>
                <td style="padding:18px 20px;">
                  <p style="margin:0;font-size:15px;color:#3C4A43;line-height:1.65;">
                    <strong style="color:#13211A;">Ahora te toca enviarlo.</strong><br>
                    ${params.etiquetaUrl
                      ? `<strong>El envío ya está pagado</strong>: descarga la etiqueta, pégala en el paquete y déjalo en tu oficina o punto de entrega más cercano. No tienes que pagar nada.`
                      : fechaLimite
                        ? `Tienes hasta el <strong>${fechaLimite}</strong> para enviar el paquete y anotar el número de seguimiento en tu panel.`
                        : `Envía el paquete y anota el número de seguimiento en tu panel.`}
                    ${fechaLimite && params.etiquetaUrl ? `Tienes hasta el <strong>${fechaLimite}</strong>.` : ""}
                    Cuando el comprador confirme que lo ha recibido, te ingresamos los €${precio.toFixed(2)} íntegros en tu cuenta bancaria.
                  </p>
                  ${params.etiquetaUrl
                    ? `<p style="margin:16px 0 0;">
                         <a href="${escapar(params.etiquetaUrl)}"
                            style="display:inline-block;background:#1A5245;color:#FFFFFF;text-decoration:none;padding:12px 24px;border-radius:10px;font-size:15px;font-weight:700;">
                           Descargar etiqueta de envío
                         </a>
                       </p>`
                    : ""}
                  ${bloqueDireccion}
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <tr>
          <td style="padding:26px 28px 32px;">
            <p style="margin:0 0 4px;font-size:15px;color:#3C4A43;line-height:1.6;">Gracias por confiar en el mercado de segunda mano de Vive+.</p>
            <p style="margin:0;font-size:15px;color:#13211A;">Un abrazo,<br><strong style="color:#2A7A6A;">El equipo de Vive+</strong></p>
          </td>
        </tr>

        <tr>
          <td style="background:#F7F5F0;padding:20px 28px;text-align:center;border-top:1px solid #EDE8DF;">
            <p style="margin:0;font-size:12px;color:#9AA69F;line-height:1.6;">© ${new Date().getFullYear()} Vive+ · Cuidando a quienes más importan</p>
          </td>
        </tr>

      </table>
    </td>
  </tr>
</table>
  `;
}
