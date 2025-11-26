"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useEffect, useMemo } from "react";
import { TopNav } from "../components/top-nav";
import { useAuth } from "../components/auth-provider";
import Footer from "../components/footer";

type Farmer = {
  user_id: string;
  name: string;
  location: string;
  bio: string | null;
  phone: string | null;
  website: string | null;
  certifications: string[];
  specialties: string[];
  products_count: number;
  created_at: string | null;
};

export default function ProductoresPage() {
  const { loading: authLoading } = useAuth();
  const [farmers, setFarmers] = useState<Farmer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedLocations, setSelectedLocations] = useState<string[]>([]);
  const [selectedCertifications, setSelectedCertifications] = useState<string[]>([]);

  useEffect(() => {
    loadFarmers();
  }, []);

  async function loadFarmers() {
    try {
      setLoading(true);
      const response = await fetch("/api/farmers");
      if (response.ok) {
        const data = await response.json();
        setFarmers(data || []);
      }
    } catch (error) {
      console.error("Error al cargar agricultores:", error);
    } finally {
      setLoading(false);
    }
  }

  // Obtener ubicaciones únicas
  const locations = useMemo(() => {
    const locs = Array.from(new Set(farmers.map(f => f.location).filter(Boolean))) as string[];
    return locs.sort();
  }, [farmers]);

  // Obtener certificaciones únicas
  const certifications = useMemo(() => {
    const certs = new Set<string>();
    farmers.forEach(f => {
      f.certifications?.forEach(c => certs.add(c));
    });
    return Array.from(certs).sort();
  }, [farmers]);

  // Filtrar agricultores
  const filteredFarmers = useMemo(() => {
    let filtered = farmers;

    // Filtro por búsqueda
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(f =>
        f.name.toLowerCase().includes(query) ||
        f.location?.toLowerCase().includes(query) ||
        f.bio?.toLowerCase().includes(query) ||
        f.certifications?.some(c => c.toLowerCase().includes(query)) ||
        f.specialties?.some(s => s.toLowerCase().includes(query))
      );
    }

    // Filtro por ubicación
    if (selectedLocations.length > 0) {
      filtered = filtered.filter(f => selectedLocations.includes(f.location));
    }

    // Filtro por certificaciones
    if (selectedCertifications.length > 0) {
      filtered = filtered.filter(f =>
        f.certifications?.some(cert => selectedCertifications.includes(cert))
      );
    }

    return filtered;
  }, [farmers, searchQuery, selectedLocations, selectedCertifications]);

  function toggleLocation(location: string) {
    setSelectedLocations(prev =>
      prev.includes(location)
        ? prev.filter(l => l !== location)
        : [...prev, location]
    );
  }

  function toggleCertification(cert: string) {
    setSelectedCertifications(prev =>
      prev.includes(cert)
        ? prev.filter(c => c !== cert)
        : [...prev, cert]
    );
  }

  function clearFilters() {
    setSearchQuery("");
    setSelectedLocations([]);
    setSelectedCertifications([]);
  }

  // La página de productores es pública, no requiere login para verla
  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-slate-100 text-slate-900">
        <TopNav searchQuery={searchQuery} onSearchChange={setSearchQuery} showSearch={true} />
        <div className="flex min-h-screen items-center justify-center">
          <p className="text-slate-600">Cargando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900">
      <TopNav searchQuery={searchQuery} onSearchChange={setSearchQuery} showSearch={true} />
      <div className="mx-auto flex w-full max-w-7xl gap-6 px-4 py-8 sm:px-6 lg:px-8">
        {/* Sidebar de filtros */}
        <aside className="hidden w-64 flex-shrink-0 lg:block">
          <div className="sticky top-24 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-900">Filtros</h2>
              {(selectedLocations.length > 0 || selectedCertifications.length > 0 || searchQuery) && (
                <button
                  onClick={clearFilters}
                  className="text-sm font-medium text-emerald-600 hover:text-emerald-700"
                >
                  Limpiar
                </button>
              )}
            </div>

            {/* Filtro por ubicación */}
            {locations.length > 0 && (
              <div className="mb-6">
                <h3 className="mb-3 text-sm font-semibold text-slate-700">Ubicación</h3>
                <div className="space-y-2">
                  {locations.map((location) => (
                    <label
                      key={location}
                      className="flex items-center gap-2 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={selectedLocations.includes(location)}
                        onChange={() => toggleLocation(location)}
                        className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                      />
                      <span className="text-sm text-slate-600">{location}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* Filtro por certificaciones */}
            {certifications.length > 0 && (
              <div>
                <h3 className="mb-3 text-sm font-semibold text-slate-700">Certificaciones</h3>
                <div className="space-y-2">
                  {certifications.map((cert) => (
                    <label
                      key={cert}
                      className="flex items-center gap-2 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={selectedCertifications.includes(cert)}
                        onChange={() => toggleCertification(cert)}
                        className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                      />
                      <span className="text-sm text-slate-600">{cert}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}
          </div>
        </aside>

        {/* Contenido principal */}
        <main className="flex-1">
          {/* Breadcrumbs y título */}
          <div className="mb-6">
            <nav className="mb-2 text-sm text-slate-600">
              <Link href="/" className="hover:text-emerald-600">INICIO</Link>
              <span className="mx-2">/</span>
              <span className="text-slate-900 font-semibold">PRODUCTORES</span>
            </nav>
            <h1 className="text-3xl font-bold text-slate-900">PRODUCTORES</h1>
            <p className="mt-2 text-sm text-slate-600">
              Mostrando {filteredFarmers.length} de {farmers.length} productores
            </p>
          </div>

          {/* Grid de productores */}
          {filteredFarmers.length === 0 ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center shadow-sm">
              <p className="text-slate-600">
                {farmers.length === 0
                  ? "Aún no hay agricultores registrados."
                  : "No se encontraron productores con los filtros seleccionados."}
              </p>
              {farmers.length > 0 && (
                <button
                  onClick={clearFilters}
                  className="mt-4 text-sm font-medium text-emerald-600 hover:text-emerald-700"
                >
                  Limpiar filtros
                </button>
              )}
            </div>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {filteredFarmers.map((farmer) => (
                <Link
                  key={farmer.user_id}
                  href={`/agricultores/${farmer.user_id}`}
                  className="group flex flex-col rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:border-emerald-500 hover:shadow-lg"
                >
                  {/* Imagen placeholder o avatar */}
                  <div className="relative h-48 w-full overflow-hidden rounded-t-2xl bg-gradient-to-br from-emerald-100 to-emerald-50">
                    <div className="flex h-full items-center justify-center">
                      <div className="flex h-24 w-24 items-center justify-center rounded-full bg-emerald-500 text-3xl font-bold text-white">
                        {farmer.name.charAt(0).toUpperCase()}
                      </div>
                    </div>
                  </div>

                  {/* Contenido */}
                  <div className="flex flex-1 flex-col p-5">
                    <div className="mb-2">
                      <p className="text-xs font-semibold uppercase text-emerald-600">
                        AGRICULTOR
                      </p>
                    </div>
                    <h3 className="mb-1 text-lg font-semibold text-slate-900 group-hover:text-emerald-600">
                      {farmer.name}
                    </h3>
                    <p className="mb-3 text-sm text-slate-600">
                      📍 {farmer.location}
                    </p>

                    {farmer.bio && (
                      <p className="mb-3 line-clamp-2 text-sm text-slate-600">
                        {farmer.bio}
                      </p>
                    )}

                    <div className="mt-auto flex items-center justify-between pt-3 border-t border-slate-100">
                      <span className="text-sm font-semibold text-emerald-600">
                        {farmer.products_count} producto{farmer.products_count !== 1 ? "s" : ""}
                      </span>
                      <span className="text-sm font-semibold text-slate-600 group-hover:text-emerald-600">
                        Ver perfil →
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </main>
      </div>
      <Footer />
    </div>
  );
}

