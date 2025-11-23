"use client";

import Link from "next/link";

export default function Footer() {
  return (
    <footer
      id="contacto"
      className="relative left-1/2 right-1/2 -ml-[50vw] -mr-[50vw] w-screen border-t border-white/10 bg-black px-6 py-10 text-sm text-emerald-100 sm:px-10"
    >
      <div className="mx-auto max-w-7xl">
        <div className="grid gap-8 md:grid-cols-3">
          {/* Columna izquierda - Información de la empresa */}
          <div className="flex flex-col gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-emerald-300 mb-2">
                AgroLink
              </p>
              <p className="text-base text-white font-semibold mb-2">
                Marketplace Agrícola de la Región de Los Lagos
              </p>
              <p className="text-sm text-emerald-100">
                Conectando agricultores locales con restaurantes y cocinas profesionales.
                Promoviendo el consumo local y la economía sostenible.
              </p>
            </div>
          </div>

          {/* Columna central - Conócenos */}
          <div className="flex flex-col gap-4">
            <h3 className="text-base font-semibold text-white uppercase tracking-wide">
              Conócenos
            </h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/historia" className="text-emerald-100 hover:text-emerald-300 transition">
                  Historia
                </Link>
              </li>
            </ul>
          </div>

          {/* Columna derecha - Contáctanos */}
          <div className="flex flex-col gap-4">
            <h3 className="text-base font-semibold text-white uppercase tracking-wide">
              Contáctanos
            </h3>
            <ul className="space-y-3 text-sm">
              <li className="flex items-center gap-2">
                <svg
                  className="h-5 w-5 text-emerald-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                  />
                </svg>
                <a
                  href="tel:+56956115492"
                  className="text-emerald-100 hover:text-emerald-300 transition"
                >
                  +56 9 5611 5492
                </a>
              </li>
              <li className="flex items-center gap-2">
                <svg
                  className="h-5 w-5 text-emerald-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                  />
                </svg>
                <a
                  href="mailto:nicolas.fdz2001@gmail.com"
                  className="text-emerald-100 hover:text-emerald-300 transition"
                >
                  nicolas.fdz2001@gmail.com
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Línea de copyright */}
        <div className="mt-8 border-t border-white/10 pt-6 text-center text-xs text-emerald-200/80">
          <p>© {new Date().getFullYear()} AgroLink. Todos los derechos reservados.</p>
        </div>
      </div>
    </footer>
  );
}

