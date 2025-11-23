"use client";

import Link from "next/link";
import { TopNav } from "./components/top-nav";
import { useAuth } from "./components/auth-provider";
import Footer from "./components/footer";

const beneficios = [
  {
    title: "Para Agricultores",
    items: [
      "Publica tus productos y gestiona tu inventario fácilmente",
      "Conecta directamente con restaurantes y cocinas locales",
      "Recibe pedidos organizados y planifica tus cosechas",
      "Aumenta tus ventas y reduce intermediarios",
    ],
  },
  {
    title: "Para Restaurantes",
    items: [
      "Accede a productos frescos y locales de la Región de Los Lagos",
      "Catálogo completo con precios transparentes",
      "Realiza pedidos multiproveedor en un solo lugar",
      "Gestiona tus compras y revisa tu historial de pedidos",
    ],
  },
];

const caracteristicas = [
  {
    icon: "🌱",
    title: "Productos Locales",
    description: "Conectamos agricultores de Osorno y Río Bueno con restaurantes que valoran lo local y fresco.",
  },
  {
    icon: "💰",
    title: "Precios Transparentes",
    description: "Todos los precios son claros desde el inicio, sin sorpresas ni negociaciones complicadas.",
  },
  {
    icon: "🚚",
    title: "Logística Optimizada",
    description: "Rutas agrupadas y opciones de entrega flexibles para reducir costos y tiempos.",
  },
  {
    icon: "📱",
    title: "Fácil de Usar",
    description: "Plataforma intuitiva diseñada para que cualquier persona pueda usarla sin complicaciones.",
  },
];

export default function Home() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-900 via-slate-950 to-black text-white">
      <TopNav />
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-12 px-4 pb-24 pt-12 sm:px-8 lg:px-12">
        <header className="flex flex-col gap-8 rounded-3xl bg-white/5 px-6 py-10 backdrop-blur-md sm:px-10 lg:flex-row lg:items-center lg:gap-16">
          <div className="flex-1 space-y-6">
            <p className="inline-flex items-center gap-2 rounded-full border border-white/30 px-4 py-2 text-xs uppercase tracking-[0.2em] text-emerald-200">
              AgroLink · Marketplace Agrícola
            </p>
            <h1 className="text-4xl font-semibold leading-tight text-white sm:text-5xl">
              Conectamos agricultores locales con restaurantes que valoran lo fresco y sostenible
            </h1>
            <p className="text-lg text-emerald-100 sm:text-xl">
              AgroLink es una plataforma digital que facilita la conexión entre productores agrícolas de la Región de Los Lagos 
              (Osorno y Río Bueno) y restaurantes, cocinas profesionales y negocios gastronómicos. 
              Nuestro objetivo es fortalecer la economía local, reducir intermediarios y promover el consumo de productos frescos y de calidad.
            </p>
            {!user && (
              <div className="flex flex-col gap-4 sm:flex-row">
                <Link
                  href="/auth/registro"
                  className="rounded-full bg-white px-6 py-3 text-center text-base font-semibold text-emerald-900 transition hover:bg-emerald-100"
                >
                  Crear cuenta
                </Link>
                <Link
                  href="/auth/login"
                  className="rounded-full border border-white/40 px-6 py-3 text-center text-base font-semibold text-white transition hover:bg-white/10"
                >
                  Iniciar sesión
                </Link>
              </div>
            )}
            {user && (
              <div className="flex flex-col gap-4 sm:flex-row">
                <Link
                  href="/catalogo"
                  className="rounded-full bg-white px-6 py-3 text-center text-base font-semibold text-emerald-900 transition hover:bg-emerald-100"
                >
                  Ver catálogo
                </Link>
                {user.user_metadata?.user_type === "restaurante" && (
                  <Link
                    href="/catalogo"
                    className="rounded-full border border-white/40 px-6 py-3 text-center text-base font-semibold text-white transition hover:bg-white/10"
                  >
                    Ver catálogo
                  </Link>
                )}
                {user.user_metadata?.user_type === "agricultor" && (
                  <Link
                    href="/agricultores"
                    className="rounded-full border border-white/40 px-6 py-3 text-center text-base font-semibold text-white transition hover:bg-white/10"
                  >
                    Gestionar productos
                  </Link>
                )}
              </div>
            )}
          </div>
        </header>

        <section className="rounded-3xl border border-white/10 bg-white/5 px-6 py-10 sm:px-10">
          <div className="mb-8 text-center">
            <h2 className="text-3xl font-semibold text-white">¿Qué es AgroLink?</h2>
            <p className="mt-4 text-lg text-emerald-100">
              Una plataforma digital que simplifica la compra y venta de productos agrícolas locales
            </p>
          </div>
          
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {caracteristicas.map((feature) => (
              <div
                key={feature.title}
                className="rounded-2xl border border-white/10 bg-black/30 p-6 text-center"
              >
                <div className="mb-4 text-4xl">{feature.icon}</div>
                <h3 className="mb-2 text-xl font-semibold text-white">
                  {feature.title}
                </h3>
                <p className="text-sm text-emerald-100">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </section>

        <section className="grid gap-6 rounded-3xl border border-white/10 bg-slate-900/40 px-6 py-10 sm:px-10 lg:grid-cols-2">
          {beneficios.map((beneficio) => (
            <article
              key={beneficio.title}
              className="flex flex-col gap-4 rounded-2xl bg-white p-6 shadow-xl"
            >
              <div>
                <h2 className="text-2xl font-semibold text-slate-900">
                  {beneficio.title}
                </h2>
              </div>
              <ul className="space-y-3 text-sm text-slate-600">
                {beneficio.items.map((item, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <span className="mt-1 h-2 w-2 rounded-full bg-emerald-600" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </section>

        <section className="rounded-3xl border border-white/10 bg-white/5 px-6 py-10 sm:px-10">
          <div className="mb-8">
            <h2 className="text-3xl font-semibold text-white">¿Cómo funciona?</h2>
            <p className="mt-4 text-lg text-emerald-100">
              El proceso es simple y está diseñado para facilitar la conexión entre productores y compradores
            </p>
          </div>
          
          <div className="grid gap-6 md:grid-cols-2">
            <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-6">
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500 text-lg font-semibold text-white">
                  1
                </div>
                <h3 className="text-xl font-semibold text-white">
                  Regístrate
                </h3>
              </div>
              <p className="text-sm text-emerald-100">
                Crea tu cuenta como agricultor o restaurante. El proceso es rápido y sencillo, 
                solo necesitas proporcionar información básica.
              </p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-6">
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500 text-lg font-semibold text-white">
                  2
                </div>
                <h3 className="text-xl font-semibold text-white">
                  Explora o Publica
                </h3>
              </div>
              <p className="text-sm text-emerald-100">
                Si eres agricultor, publica tus productos con precios y disponibilidad. 
                Si eres restaurante, explora el catálogo de productos frescos disponibles.
              </p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-6">
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500 text-lg font-semibold text-white">
                  3
                </div>
                <h3 className="text-xl font-semibold text-white">
                  Realiza Pedidos
                </h3>
              </div>
              <p className="text-sm text-emerald-100">
                Los restaurantes pueden armar pedidos con múltiples productos de diferentes agricultores 
                en un solo lugar, simplificando el proceso de compra.
              </p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-6">
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500 text-lg font-semibold text-white">
                  4
                </div>
                <h3 className="text-xl font-semibold text-white">
                  Recibe y Entrega
                </h3>
              </div>
              <p className="text-sm text-emerald-100">
                Coordina la logística de entrega. Ofrecemos opciones flexibles como rutas agrupadas, 
                retiro en puntos de encuentro o entrega directa.
              </p>
            </div>
          </div>
        </section>

        <section className="rounded-3xl border border-white/10 bg-white/5 px-6 py-10 sm:px-10">
          <div className="mb-8 text-center">
            <h2 className="text-3xl font-semibold text-white">¿Por qué elegir AgroLink?</h2>
          </div>
          
          <div className="grid gap-6 md:grid-cols-3">
            <div className="rounded-2xl border border-white/10 bg-black/30 p-6 text-center">
              <h3 className="mb-3 text-xl font-semibold text-white">
                Economía Local
              </h3>
              <p className="text-sm text-emerald-100">
                Fortalecemos la economía local conectando directamente a productores con compradores, 
                eliminando intermediarios y mejorando los ingresos de los agricultores.
              </p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-black/30 p-6 text-center">
              <h3 className="mb-3 text-xl font-semibold text-white">
                Productos Frescos
              </h3>
              <p className="text-sm text-emerald-100">
                Accede a productos recién cosechados de la Región de Los Lagos. 
                Frescura y calidad garantizadas directamente desde el campo.
              </p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-black/30 p-6 text-center">
              <h3 className="mb-3 text-xl font-semibold text-white">
                Sostenibilidad
              </h3>
              <p className="text-sm text-emerald-100">
                Promovemos prácticas agrícolas sostenibles y reducimos la huella de carbono 
                al optimizar las rutas de entrega y acortar las distancias.
              </p>
            </div>
          </div>
        </section>

        {!user && (
          <section className="rounded-3xl border border-emerald-500/30 bg-gradient-to-br from-emerald-900/50 to-black p-8 text-center sm:p-12">
            <h2 className="text-3xl font-semibold text-white">
              ¿Listo para comenzar?
            </h2>
            <p className="mt-4 text-lg text-emerald-100">
              Únete a nuestra comunidad y comienza a conectar con productores locales o restaurantes
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Link
                href="/auth/registro"
                className="rounded-full bg-white px-8 py-4 text-base font-semibold text-emerald-900 transition hover:bg-emerald-100"
              >
                Crear cuenta gratuita
              </Link>
              <Link
                href="/auth/login"
                className="rounded-full border-2 border-white/40 px-8 py-4 text-base font-semibold text-white transition hover:bg-white/10"
              >
                Ya tengo cuenta
              </Link>
            </div>
          </section>
        )}

        <Footer />
      </div>
    </div>
  );
}
