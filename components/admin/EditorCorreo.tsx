"use client";

import { Color, TextStyle } from "@tiptap/extension-text-style";
import Highlight from "@tiptap/extension-highlight";
import TextAlign from "@tiptap/extension-text-align";
import { EditorContent, useEditor, useEditorState, type Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { prepararSubida } from "@/app/admin/correo/acciones";
import { BUCKET_CORREO, LIMITE_ADJUNTOS_BYTES, tamano } from "@/lib/correo-compartido";
import { supabaseNavegador } from "@/lib/supabase-navegador";

type Subida = {
  clave: string;
  nombre: string;
  tipo: string;
  bytes: number;
  estado: "subiendo" | "listo" | "error";
  ruta?: string;
  error?: string;
};

const COLORES = ["#1d1d1b", "#5b6166", "#b42318", "#c4320a", "#b54708", "#027a48", "#1f4fd1", "#6941c6", "#c11574"];
const RESALTADOS = ["#fdf2a3", "#d1fadf", "#d1e9ff", "#fce7f6", "#fee4e2"];

/**
 * Editor de correo: formato (negrita, color, listas, citas, enlaces…),
 * adjuntos y firma. Va dentro de un <form>: deja el resultado en campos
 * ocultos `cuerpo_html`, `cuerpo` (texto plano) y `adjuntos` (JSON).
 *
 * Los adjuntos se suben apenas se eligen, directo a Supabase Storage con una
 * URL firmada; el formulario no se puede enviar mientras alguno esté subiendo.
 */
export default function EditorCorreo({
  firmaHtml = "",
  inicialHtml,
  conAdjuntos = true,
  alto = "min-h-72",
  autoFocus = false,
}: {
  /** Se agrega al final, separada por dos renglones vacíos. */
  firmaHtml?: string;
  /** Contenido inicial (reemplaza al de la firma). Lo usa la página de la firma. */
  inicialHtml?: string;
  conAdjuntos?: boolean;
  alto?: string;
  autoFocus?: boolean;
}) {
  const [html, setHtml] = useState("");
  const [texto, setTexto] = useState("");
  const [subidas, setSubidas] = useState<Subida[]>([]);
  const [arrastrando, setArrastrando] = useState(false);
  const archivo = useRef<HTMLInputElement>(null);
  const guardia = useRef<HTMLInputElement>(null);

  const editor = useEditor({
    immediatelyRender: false,
    autofocus: autoFocus ? "start" : false,
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3] },
        link: { openOnClick: false, autolink: true, defaultProtocol: "https" },
        code: false,
        codeBlock: false,
      }),
      TextStyle,
      Color,
      Highlight.configure({ multicolor: true }),
      TextAlign.configure({ types: ["heading", "paragraph"] }),
    ],
    content: inicialHtml ?? (firmaHtml ? `<p></p><p></p>${firmaHtml}` : ""),
    editorProps: { attributes: { class: `contenido-correo ${alto} px-4 py-3 outline-none` } },
    onCreate: ({ editor }) => sincronizar(editor),
    onUpdate: ({ editor }) => sincronizar(editor),
  });

  function sincronizar(e: Editor) {
    setHtml(e.isEmpty ? "" : e.getHTML());
    setTexto(e.getText({ blockSeparator: "\n\n" }).trim());
  }

  const subiendo = subidas.some((s) => s.estado === "subiendo");
  const listos = subidas.filter((s) => s.estado === "listo");
  const totalBytes = subidas.filter((s) => s.estado !== "error").reduce((t, s) => t + s.bytes, 0);

  // Bloquea el envío del formulario mientras haya archivos subiendo.
  useEffect(() => {
    guardia.current?.setCustomValidity(subiendo ? "Esperá a que terminen de subir los adjuntos." : "");
  }, [subiendo]);

  async function agregarArchivos(lista: FileList | File[]) {
    let acumulado = totalBytes;
    for (const file of Array.from(lista)) {
      const clave = crypto.randomUUID();
      const base = { clave, nombre: file.name, tipo: file.type || "application/octet-stream", bytes: file.size };
      if (acumulado + file.size > LIMITE_ADJUNTOS_BYTES) {
        setSubidas((s) => [...s, { ...base, estado: "error", error: "Pasa el límite de 25 MB por correo" }]);
        continue;
      }
      acumulado += file.size;
      setSubidas((s) => [...s, { ...base, estado: "subiendo" }]);
      const actualizar = (cambio: Partial<Subida>) =>
        setSubidas((s) => s.map((x) => (x.clave === clave ? { ...x, ...cambio } : x)));

      const preparado = await prepararSubida(file.name, file.size);
      if ("error" in preparado) {
        actualizar({ estado: "error", error: preparado.error });
        continue;
      }
      const { error } = await supabaseNavegador()
        .storage.from(BUCKET_CORREO)
        .uploadToSignedUrl(preparado.ruta, preparado.token, file, { contentType: base.tipo });
      actualizar(error ? { estado: "error", error: error.message } : { estado: "listo", ruta: preparado.ruta });
    }
  }

  return (
    <div>
      <input type="hidden" name="cuerpo_html" value={html} />
      <input type="hidden" name="cuerpo" value={texto} />
      <input
        type="hidden"
        name="adjuntos"
        value={JSON.stringify(listos.map(({ ruta, nombre, tipo, bytes }) => ({ ruta, nombre, tipo, bytes })))}
      />
      {/* Campo invisible que solo sirve para frenar el envío con un mensaje. */}
      <input ref={guardia} aria-hidden tabIndex={-1} className="sr-only" defaultValue="ok" />

      <div
        className={`border bg-papel transition-colors ${arrastrando ? "border-morpho" : "border-linea focus-within:border-tinta"}`}
        onDragOver={(e) => {
          if (!conAdjuntos || !e.dataTransfer.types.includes("Files")) return;
          e.preventDefault();
          setArrastrando(true);
        }}
        onDragLeave={() => setArrastrando(false)}
        onDrop={(e) => {
          if (!conAdjuntos || !e.dataTransfer.files.length) return;
          e.preventDefault();
          setArrastrando(false);
          agregarArchivos(e.dataTransfer.files);
        }}
      >
        {editor ? <Barra editor={editor} onAdjuntar={conAdjuntos ? () => archivo.current?.click() : undefined} /> : null}
        <EditorContent editor={editor} />
        {!editor ? <div className={`${alto} px-4 py-3 text-sm text-pizarra`}>Cargando editor…</div> : null}
      </div>

      {conAdjuntos ? (
        <>
          <input
            ref={archivo}
            type="file"
            multiple
            className="hidden"
            onChange={(e) => {
              if (e.target.files?.length) agregarArchivos(e.target.files);
              e.target.value = "";
            }}
          />
          {subidas.length ? (
            <ul className="mt-3 flex flex-wrap gap-2">
              {subidas.map((s) => (
                <li
                  key={s.clave}
                  className={`flex items-center gap-2 border px-3 py-1.5 text-xs ${
                    s.estado === "error" ? "border-red-300 bg-red-50 text-red-900" : "border-linea bg-papel"
                  }`}
                >
                  <IconoClip />
                  <span className="max-w-56 truncate">{s.nombre}</span>
                  <span className="datos text-pizarra">
                    {s.estado === "subiendo" ? "subiendo…" : s.estado === "error" ? s.error : tamano(s.bytes)}
                  </span>
                  <button
                    type="button"
                    aria-label={`Quitar ${s.nombre}`}
                    onClick={() => setSubidas((l) => l.filter((x) => x.clave !== s.clave))}
                    className="ml-1 text-pizarra hover:text-tinta"
                  >
                    ✕
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-2 text-xs text-pizarra">Podés arrastrar archivos al mensaje. Hasta 25 MB en total.</p>
          )}
        </>
      ) : null}
    </div>
  );
}

// ─── Barra de herramientas ───────────────────────────────────────────────────

function Barra({ editor, onAdjuntar }: { editor: Editor; onAdjuntar?: () => void }) {
  const e = useEditorState({
    editor,
    selector: ({ editor: ed }) => ({
      negrita: ed.isActive("bold"),
      cursiva: ed.isActive("italic"),
      subrayado: ed.isActive("underline"),
      tachado: ed.isActive("strike"),
      titulo: ed.isActive("heading", { level: 2 }),
      subtitulo: ed.isActive("heading", { level: 3 }),
      vinetas: ed.isActive("bulletList"),
      numerada: ed.isActive("orderedList"),
      cita: ed.isActive("blockquote"),
      enlace: ed.isActive("link"),
      centro: ed.isActive({ textAlign: "center" }),
      derecha: ed.isActive({ textAlign: "right" }),
      color: (ed.getAttributes("textStyle").color as string | undefined) ?? null,
      puedeDeshacer: ed.can().undo(),
      puedeRehacer: ed.can().redo(),
    }),
  });
  const c = () => editor.chain().focus();

  function enlazar() {
    const actual = editor.getAttributes("link").href as string | undefined;
    const url = window.prompt("Dirección del enlace (dejala vacía para quitarlo)", actual ?? "https://");
    if (url === null) return;
    if (!url.trim() || url.trim() === "https://") c().extendMarkRange("link").unsetLink().run();
    else c().extendMarkRange("link").setLink({ href: url.trim() }).run();
  }

  return (
    <div className="flex flex-wrap items-center gap-0.5 border-b border-linea bg-lino/60 px-2 py-1.5">
      <Boton titulo="Negrita (Ctrl+B)" activo={e.negrita} onClick={() => c().toggleBold().run()}>
        <span className="font-bold">B</span>
      </Boton>
      <Boton titulo="Cursiva (Ctrl+I)" activo={e.cursiva} onClick={() => c().toggleItalic().run()}>
        <span className="font-serif italic">I</span>
      </Boton>
      <Boton titulo="Subrayado (Ctrl+U)" activo={e.subrayado} onClick={() => c().toggleUnderline().run()}>
        <span className="underline">U</span>
      </Boton>
      <Boton titulo="Tachado" activo={e.tachado} onClick={() => c().toggleStrike().run()}>
        <span className="line-through">S</span>
      </Boton>

      <Separador />

      <Paleta
        titulo="Color del texto"
        icono={
          <span className="flex flex-col items-center leading-none">
            <span className="text-[0.95rem] font-semibold">A</span>
            <span className="mt-0.5 h-1 w-3.5" style={{ background: e.color ?? "#1d1d1b" }} />
          </span>
        }
        colores={COLORES}
        onElegir={(color) => c().setColor(color).run()}
        onQuitar={() => c().unsetColor().run()}
        quitar="Automático"
      />
      <Paleta
        titulo="Resaltar"
        icono={<IconoResaltar />}
        colores={RESALTADOS}
        onElegir={(color) => c().setHighlight({ color }).run()}
        onQuitar={() => c().unsetHighlight().run()}
        quitar="Sin resaltado"
      />

      <Separador />

      <Boton titulo="Título" activo={e.titulo} onClick={() => c().toggleHeading({ level: 2 }).run()}>
        <span className="text-[0.8rem] font-semibold">H1</span>
      </Boton>
      <Boton titulo="Subtítulo" activo={e.subtitulo} onClick={() => c().toggleHeading({ level: 3 }).run()}>
        <span className="text-[0.8rem] font-semibold">H2</span>
      </Boton>
      <Boton titulo="Lista con viñetas" activo={e.vinetas} onClick={() => c().toggleBulletList().run()}>
        <Icono d="M9 6h11M9 12h11M9 18h11M4.5 6h.01M4.5 12h.01M4.5 18h.01" />
      </Boton>
      <Boton titulo="Lista numerada" activo={e.numerada} onClick={() => c().toggleOrderedList().run()}>
        <Icono d="M10 6h10M10 12h10M10 18h10M4 5l1.5-1v5M3.5 14.5c.4-.6 2.5-1 2.5.4 0 1-2.5 2-2.5 3.1H6" />
      </Boton>
      <Boton titulo="Citar" activo={e.cita} onClick={() => c().toggleBlockquote().run()}>
        <Icono d="M7 7h4v4c0 3-1.5 5-4 6M14 7h4v4c0 3-1.5 5-4 6" />
      </Boton>
      <Boton titulo="Enlace" activo={e.enlace} onClick={enlazar}>
        <Icono d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1" />
      </Boton>

      <Separador />

      <Boton titulo="Alinear a la izquierda" activo={!e.centro && !e.derecha} onClick={() => c().setTextAlign("left").run()}>
        <Icono d="M4 6h16M4 10h10M4 14h16M4 18h10" />
      </Boton>
      <Boton titulo="Centrar" activo={e.centro} onClick={() => c().setTextAlign("center").run()}>
        <Icono d="M4 6h16M7 10h10M4 14h16M7 18h10" />
      </Boton>
      <Boton titulo="Alinear a la derecha" activo={e.derecha} onClick={() => c().setTextAlign("right").run()}>
        <Icono d="M4 6h16M10 10h10M4 14h16M10 18h10" />
      </Boton>

      <Separador />

      <Boton titulo="Quitar formato" onClick={() => c().unsetAllMarks().clearNodes().run()}>
        <Icono d="M6 5h12M12 5l-3 14M15 15l5 5M20 15l-5 5" />
      </Boton>
      <Boton titulo="Deshacer (Ctrl+Z)" desactivado={!e.puedeDeshacer} onClick={() => c().undo().run()}>
        <Icono d="M9 14 4 9l5-5M4 9h10a6 6 0 0 1 0 12h-3" />
      </Boton>
      <Boton titulo="Rehacer (Ctrl+Y)" desactivado={!e.puedeRehacer} onClick={() => c().redo().run()}>
        <Icono d="m15 14 5-5-5-5M20 9H10a6 6 0 0 0 0 12h3" />
      </Boton>

      {onAdjuntar ? (
        <button
          type="button"
          onClick={onAdjuntar}
          className="ml-auto flex items-center gap-1.5 px-2.5 py-1.5 text-sm text-tinta transition-colors hover:bg-nube"
        >
          <IconoClip />
          Adjuntar
        </button>
      ) : null}
    </div>
  );
}

function Boton({
  titulo,
  activo = false,
  desactivado = false,
  onClick,
  children,
}: {
  titulo: string;
  activo?: boolean;
  desactivado?: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      title={titulo}
      aria-label={titulo}
      aria-pressed={activo}
      disabled={desactivado}
      // Sin esto el clic le quita el foco al editor y se pierde la selección.
      onMouseDown={(ev) => ev.preventDefault()}
      onClick={onClick}
      className={`grid size-8 place-items-center text-sm transition-colors disabled:opacity-35 ${
        activo ? "bg-tinta text-papel" : "text-tinta hover:bg-nube"
      }`}
    >
      {children}
    </button>
  );
}

function Paleta({
  titulo,
  icono,
  colores,
  onElegir,
  onQuitar,
  quitar,
}: {
  titulo: string;
  icono: ReactNode;
  colores: string[];
  onElegir: (color: string) => void;
  onQuitar: () => void;
  quitar: string;
}) {
  const [abierta, setAbierta] = useState(false);
  const caja = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!abierta) return;
    const fuera = (ev: MouseEvent) => !caja.current?.contains(ev.target as Node) && setAbierta(false);
    document.addEventListener("mousedown", fuera);
    return () => document.removeEventListener("mousedown", fuera);
  }, [abierta]);

  return (
    <div ref={caja} className="relative">
      <Boton titulo={titulo} activo={abierta} onClick={() => setAbierta((v) => !v)}>
        {icono}
      </Boton>
      {abierta ? (
        <div className="absolute left-0 top-full z-30 mt-1 w-44 border border-linea bg-papel p-2 shadow-[0_8px_24px_rgba(0,0,0,0.08)]">
          <div className="grid grid-cols-5 gap-1.5">
            {colores.map((color) => (
              <button
                key={color}
                type="button"
                title={color}
                aria-label={color}
                onMouseDown={(ev) => ev.preventDefault()}
                onClick={() => {
                  onElegir(color);
                  setAbierta(false);
                }}
                className="size-6 border border-black/10 transition-transform hover:scale-110"
                style={{ background: color }}
              />
            ))}
          </div>
          <button
            type="button"
            onMouseDown={(ev) => ev.preventDefault()}
            onClick={() => {
              onQuitar();
              setAbierta(false);
            }}
            className="mt-2 w-full border-t border-linea pt-2 text-left text-xs text-pizarra hover:text-tinta"
          >
            {quitar}
          </button>
        </div>
      ) : null}
    </div>
  );
}

function Separador() {
  return <span aria-hidden className="mx-1 h-5 w-px bg-linea" />;
}

function Icono({ d }: { d: string }) {
  return (
    <svg aria-hidden viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d={d} />
    </svg>
  );
}

function IconoClip() {
  return <Icono d="m21 11-8.6 8.6a5 5 0 0 1-7-7l8.5-8.6a3.3 3.3 0 0 1 4.7 4.7L10 17.3a1.7 1.7 0 0 1-2.4-2.4l7.9-7.9" />;
}

function IconoResaltar() {
  return <Icono d="m9 11 6-6 4 4-6 6M9 11l-4 4v4h4l4-4M9 11l4 4M4 21h7" />;
}
