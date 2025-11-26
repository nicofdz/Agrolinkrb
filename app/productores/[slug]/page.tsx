"use client";

import Link from "next/link";
import { use } from "react";
import { TopNav } from "../../components/top-nav";
import { useAuth } from "../../components/auth-provider";
import Footer from "../../components/footer";
import { producers } from "../../lib/mock-data";

type ProducerPageProps = {
  params: Promise<{ slug: string }>;
};

export default function ProducerPage({ params }: ProducerPageProps) {
  const { loading: authLoading } = useAuth();
  const { slug } = use(params);
  const producer = producers.find((item) => item.slug === slug);

  // La página de perfil de productor es pública, no requiere login para verla
  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-950 text-white">
        <TopNav />
        <div className="flex min-h-screen items-center justify-center">
          <p className="text-emerald-200">Cargando...</p>
        </div>
      </div>
    );
  }

  if (!producer) {
    return (
      <div className="min-h-screen bg-slate-950 text-white">
        <TopNav />
        <div className="flex min-h-screen items-center justify-center">
          <div className="text-center">
            <p className="text-lg font-semibold text-white">Productor no encontrado</p>
            <Link
              href="/productores"
              className="mt-4 inline-block text-sm font-semibold text-emerald-400 hover:text-emerald-300"
            >
              Volver a productores
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <TopNav />
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-10 px-4 py-10 sm:px-8 lg:px-12">
        <Link
          href="/catalogo"
          className="text-sm font-semibold text-emerald-200 underline"
        >
          ← Volver al catálogo
        </Link>

        <header className="rounded-3xl border border-white/10 bg-gradient-to-br from-emerald-900/50 to-black px-6 py-8 sm:px-10">
          <p className="text-xs uppercase tracking-[0.3em] text-emerald-200">
            Perfil productor · Sello AgroLink
          </p>
          <h1 className="mt-3 text-4xl font-semibold text-white">
            {producer.name}
          </h1>
          <p className="text-lg text-emerald-100">{producer.location}</p>
          <p className="mt-4 text-emerald-50">{producer.summary}</p>
          <div className="mt-4 flex flex-wrap gap-3 text-xs font-semibold uppercase tracking-[0.2em] text-emerald-200">
            {producer.badges.map((badge) => (
              <span
                key={badge}
                className="rounded-full border border-white/20 px-3 py-1"
              >
                {badge}
              </span>
            ))}
          </div>
        </header>

        <section className="grid gap-6 lg:grid-cols-3">
          {Object.entries(producer.impact).map(([label, value]) => (
            <article
              key={label}
              className="rounded-2xl border border-white/10 bg-black/30 p-5"
            >
              <p className="text-xs uppercase tracking-[0.3em] text-emerald-200">
                {label === "wasteReduction"
                  ? "Reducción de merma"
                  : label === "priceStability"
                    ? "Precios estables"
                    : "Puntualidad logística"}
              </p>
              <p className="mt-2 text-3xl font-semibold text-white">{value}</p>
              <p className="text-sm text-emerald-100">
                Datos compartidos en la investigación.
              </p>
            </article>
          ))}
        </section>

        <section className="rounded-3xl border border-white/10 bg-white/5 px-6 py-8 sm:px-10">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-emerald-200">
                Inventario disponible
              </p>
              <h2 className="text-3xl font-semibold text-white">
                Productos listos para cotizar
              </h2>
              <p className="text-emerald-100">
                Precios y disponibilidad se sincronizan con la agenda semanal.
              </p>
            </div>
            <button className="rounded-full border border-white/30 px-5 py-2 text-sm font-semibold text-white transition hover:bg-white/10">
              Descargar ficha PDF
            </button>
          </div>
          <div className="mt-8 grid gap-6 md:grid-cols-2">
            {producer.inventory.map((item) => (
              <article
                key={item.id}
                className="rounded-2xl border border-white/10 bg-black/40 p-5"
              >
                <h3 className="text-xl font-semibold text-white">{item.name}</h3>
                <p className="text-sm text-emerald-200">{item.category}</p>
                <p className="mt-2 text-sm text-emerald-100">
                  {item.harvestWindow}
                </p>
                <div className="mt-4 grid gap-2 text-sm text-emerald-50">
                  <p>
                    <span className="text-emerald-200">Precio:</span>{" "}
                    {item.priceRange}
                  </p>
                  <p>
                    <span className="text-emerald-200">Disponibilidad:</span>{" "}
                    {item.availability}
                  </p>
                  <p>
                    <span className="text-emerald-200">Prácticas:</span>{" "}
                    {item.sustainability}
                  </p>
                </div>
                <ul className="mt-4 space-y-2 text-sm text-emerald-100">
                  {item.highlights.map((highlight) => (
                    <li key={highlight}>• {highlight}</li>
                  ))}
                </ul>
                <div className="mt-4 flex flex-wrap gap-3 text-sm font-semibold">
                  <button className="rounded-full bg-white px-4 py-2 text-emerald-900 transition hover:bg-emerald-100">
                    Agendar pedido
                  </button>
                  <button className="rounded-full border border-white/20 px-4 py-2 text-white transition hover:border-white/50 hover:bg-white/5">
                    Chat directo
                  </button>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="rounded-3xl border border-white/10 bg-black/40 px-6 py-8 sm:px-10">
          <p className="text-xs uppercase tracking-[0.3em] text-emerald-200">
            Logística paso a paso
          </p>
          <h2 className="mt-2 text-3xl font-semibold text-white">
            Compromisos operativos
          </h2>
          <p className="text-emerald-100">
            Basado en los hallazgos de la unidad: tiempos claros y soporte en
            todo momento.
          </p>
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            {producer.timeline.map((stage) => (
              <article
                key={stage.title}
                className="rounded-2xl border border-white/10 bg-slate-900/60 p-4"
              >
                <p className="text-xs uppercase tracking-[0.3em] text-emerald-200">
                  {stage.duration}
                </p>
                <h3 className="mt-2 text-lg font-semibold text-white">
                  {stage.title}
                </h3>
                <p className="text-sm text-emerald-100">{stage.detail}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="rounded-3xl border border-white/10 bg-white/5 px-6 py-8 sm:px-10">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-emerald-200">
                Canales de soporte
              </p>
              <h2 className="text-3xl font-semibold text-white">
                ¿Cómo se mantiene la comunicación?
              </h2>
            </div>
            <Link
              href="/#contacto"
              className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-emerald-900 transition hover:bg-emerald-100"
            >
              Pedir acompañamiento
            </Link>
          </div>
          <div className="mt-6 flex flex-wrap gap-3 text-sm text-emerald-100">
            {producer.supportChannels.map((channel) => (
              <span
                key={channel}
                className="rounded-full border border-white/20 px-4 py-2"
              >
                {channel}
              </span>
            ))}
          </div>
        </section>
      </div>
      <Footer />
    </div>
  );
}



