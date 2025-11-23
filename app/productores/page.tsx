"use client";

import Link from "next/link";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { TopNav } from "../components/top-nav";
import { useAuth } from "../components/auth-provider";
import Footer from "../components/footer";
import { producers } from "../lib/mock-data";

export default function ProductoresPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/auth/login?redirect=/productores");
    }
  }, [user, authLoading, router]);

  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-100 text-slate-900">
        <TopNav />
        <div className="flex min-h-screen items-center justify-center">
          <p className="text-slate-600">Cargando...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null; // El useEffect redirigirá
  }
  return (
    <div className="min-h-screen bg-slate-100 text-slate-900">
      <TopNav />
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-10 sm:px-8 lg:px-12">
        <header className="flex flex-col gap-2">
          <p className="text-sm font-semibold text-emerald-600">
            Productores disponibles
          </p>
          <h1 className="text-3xl font-semibold text-slate-900">
            Estado de verificación
          </h1>
        </header>

        <section className="rounded-3xl border border-slate-200 bg-white px-6 py-10 sm:px-10">
          <div className="mt-8 grid gap-6 md:grid-cols-3">
            {producers.map((producer) => (
              <article
                key={producer.slug}
                className="rounded-2xl border border-slate-200 bg-white p-5 shadow-lg transition hover:border-emerald-500 hover:shadow-xl"
              >
                <h3 className="text-xl font-semibold text-slate-900">
                  {producer.name}
                </h3>
                <p className="text-sm text-slate-600">{producer.location}</p>
                <p className="mt-2 text-sm text-emerald-600">
                  {producer.focus}
                </p>
                <ul className="mt-4 space-y-2 text-sm text-slate-600">
                  {producer.logisticsNotes.map((note) => (
                    <li key={note}>• {note}</li>
                  ))}
                </ul>
                <Link
                  href={`/productores/${producer.slug}`}
                  className="mt-4 inline-flex rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600 transition hover:border-emerald-500 hover:text-emerald-600"
                >
                  Abrir perfil
                </Link>
              </article>
            ))}
          </div>
        </section>
      </div>
      <Footer />
    </div>
  );
}

