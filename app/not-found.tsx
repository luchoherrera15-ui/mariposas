import Link from "next/link";

export default function NoEncontrado() {
  return (
    <main className="flex flex-1 flex-col justify-center px-6 py-32">
      <div className="mx-auto w-full max-w-[62rem]">
        <p className="datos text-sm text-pizarra">Error 404</p>
        <h1 className="titulo-2 mt-4 max-w-xl">Esta página no existe.</h1>
        <p className="prosa mt-5 text-pizarra">
          Puede que el enlace esté viejo o que la hayamos movido.
        </p>
        <div className="mt-10 flex flex-wrap gap-x-10 gap-y-3 text-[1.05rem]">
          <Link href="/" className="border-b border-linea pb-0.5 transition-colors hover:border-tinta">
            Volver al inicio
          </Link>
          <Link href="/especies" className="border-b border-linea pb-0.5 transition-colors hover:border-tinta">
            Ver las especies
          </Link>
        </div>
      </div>
    </main>
  );
}
