"use client";

import { useRef, useState } from "react";

/**
 * Muestra el HTML de un correo tal como lo ve quien lo recibe. Va en un iframe
 * sin permiso para scripts ni formularios (el HTML de afuera no es confiable);
 * `allow-same-origin` solo sirve para medir la altura y ajustar el marco.
 */
export default function VistaCorreo({ html, titulo }: { html: string; titulo: string }) {
  const marco = useRef<HTMLIFrameElement>(null);
  const [alto, setAlto] = useState(80);

  const documento = `<!doctype html><html><head><meta charset="utf-8"><base target="_blank"><style>
    html,body{margin:0;background:#fff}
    body{padding:2px 2px 8px;font-family:Helvetica,Arial,sans-serif;font-size:14px;line-height:1.6;color:#1d1d1b;word-wrap:break-word;overflow-wrap:anywhere}
    img{max-width:100%;height:auto}
    table{max-width:100%}
  </style></head><body>${html}</body></html>`;

  function medir() {
    // Se mide el body (alto del contenido), no el documento: este nunca baja
    // del alto actual del marco y el correo corto quedaría con espacio vacío.
    const cuerpo = marco.current?.contentDocument?.body;
    if (cuerpo) setAlto(Math.min(Math.max(Math.ceil(cuerpo.getBoundingClientRect().height) + 12, 40), 4000));
  }

  return (
    <iframe
      ref={marco}
      title={titulo}
      srcDoc={documento}
      sandbox="allow-same-origin allow-popups allow-popups-to-escape-sandbox"
      referrerPolicy="no-referrer"
      onLoad={() => {
        medir();
        // Las imágenes remotas cambian la altura cuando terminan de cargar.
        marco.current?.contentWindow?.addEventListener("load", medir);
        setTimeout(medir, 600);
      }}
      style={{ height: alto }}
      className="w-full border-0 bg-white"
    />
  );
}
