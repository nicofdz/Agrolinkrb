"use client";

import Link from "next/link";
import { TopNav } from "../components/top-nav";
import Footer from "../components/footer";

export default function HistoriaPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-white">
      <TopNav />
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-10 px-4 py-16 sm:px-8 lg:px-12">
        <Link
          href="/"
          className="text-sm font-semibold text-emerald-300 transition hover:text-emerald-200"
        >
          ← Volver al inicio
        </Link>

        <header className="space-y-4">
          <p className="text-xs uppercase tracking-[0.3em] text-emerald-300">
            Nuestra Historia
          </p>
          <h1 className="text-4xl font-semibold text-white">
            AgroLink: Conectando el Campo con la Cocina
          </h1>
        </header>

        <section className="space-y-6 rounded-3xl border border-white/10 bg-slate-900/40 px-6 py-10 sm:px-10">
          <div className="space-y-4 text-emerald-100">
            <p className="text-lg leading-relaxed">
              AgroLink nació de la necesidad de fortalecer la conexión entre los agricultores 
              locales de la Región de Los Lagos y los restaurantes, cocinas profesionales y 
              establecimientos gastronómicos que buscan productos frescos y de calidad.
            </p>

            <p className="leading-relaxed">
              En un contexto donde la cadena de suministro tradicional presenta desafíos como 
              intermediarios múltiples, falta de transparencia en precios y dificultades 
              logísticas, identificamos la oportunidad de crear una plataforma que acorte 
              distancias y genere valor tanto para productores como para compradores.
            </p>

            <p className="leading-relaxed">
              Nuestra misión es promover el consumo local, reducir la huella de carbono 
              asociada al transporte de alimentos, y mejorar los ingresos de los agricultores 
              al eliminar intermediarios innecesarios. Creemos firmemente que la tecnología 
              puede ser un puente que conecte de manera eficiente y sostenible a quienes 
              producen alimentos con quienes los transforman en experiencias culinarias.
            </p>

            <p className="leading-relaxed">
              AgroLink se posiciona como un marketplace especializado que no solo facilita 
              transacciones, sino que también promueve prácticas agrícolas sostenibles y 
              fortalece la economía local de la Región de Los Lagos.
            </p>
          </div>
        </section>

        <section className="grid gap-6 rounded-3xl border border-white/10 bg-slate-900/40 px-6 py-10 sm:px-10 md:grid-cols-2">
          <div className="space-y-3">
            <h2 className="text-2xl font-semibold text-white">Nuestra Visión</h2>
            <p className="text-emerald-100 leading-relaxed">
              Ser la plataforma líder en la Región de Los Lagos para la comercialización 
              directa de productos agrícolas locales, contribuyendo a una economía más 
              sostenible y justa.
            </p>
          </div>
          <div className="space-y-3">
            <h2 className="text-2xl font-semibold text-white">Nuestros Valores</h2>
            <ul className="space-y-2 text-emerald-100">
              <li className="flex items-start gap-2">
                <span className="mt-1 h-2 w-2 rounded-full bg-emerald-500" />
                <span>Transparencia en precios y procesos</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1 h-2 w-2 rounded-full bg-emerald-500" />
                <span>Apoyo a la economía local</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1 h-2 w-2 rounded-full bg-emerald-500" />
                <span>Sostenibilidad ambiental</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1 h-2 w-2 rounded-full bg-emerald-500" />
                <span>Innovación tecnológica</span>
              </li>
            </ul>
          </div>
        </section>
      </div>
      <Footer />
    </div>
  );
}


