"use client";

import Link from "next/link";
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
  const [showMobileFilters, setShowMobileFilters] = useState(false);

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
      <div className="flex w-full gap-6 px-4 py-6 sm:px-6 lg:px-8 xl:px-12 2xl:px-16">
        {/* Sidebar de filtros */}
        <aside className="hidden w-64 flex-shrink-0 lg:block">
          <div className="sticky top-24 max-h-[calc(100vh-8rem)] overflow-y-auto p-6">
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
                      className="flex items-center gap-2 cursor-pointer hover:text-emerald-600 transition"
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
                      className="flex items-center gap-2 cursor-pointer hover:text-emerald-600 transition"
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

        {/* Botón de filtros móvil */}
        <button
          onClick={() => setShowMobileFilters(true)}
          className="fixed bottom-6 right-6 z-30 lg:hidden flex items-center gap-2 rounded-full bg-emerald-600 px-6 py-3 text-sm font-semibold text-white shadow-lg transition hover:bg-emerald-700"
        >
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
          </svg>
          Filtros
          {(selectedLocations.length + selectedCertifications.length) > 0 && (
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white text-xs font-bold text-emerald-600">
              {selectedLocations.length + selectedCertifications.length}
            </span>
          )}
        </button>

        {/* Panel de filtros móvil */}
        {showMobileFilters && (
          <div className="fixed inset-0 z-50 lg:hidden">
            {/* Overlay */}
            <div
              className="absolute inset-0 bg-black/50"
              onClick={() => setShowMobileFilters(false)}
            />
            
            {/* Panel deslizable */}
            <div className="absolute right-0 top-0 h-full w-full max-w-sm bg-white shadow-xl">
              <div className="flex h-full flex-col">
                {/* Header */}
                <div className="flex items-center justify-between border-b border-slate-200 p-4">
                  <h2 className="text-lg font-semibold text-slate-900">Filtros</h2>
                  <button
                    onClick={() => setShowMobileFilters(false)}
                    className="rounded-lg p-2 text-slate-600 transition hover:bg-slate-100"
                  >
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                {/* Contenido de filtros */}
                <div className="flex-1 overflow-y-auto p-4">
                  {/* Filtro por ubicación */}
                  {locations.length > 0 && (
                    <div className="mb-6">
                      <h3 className="mb-3 text-sm font-semibold text-slate-700">Ubicación</h3>
                      <div className="space-y-2">
                        {locations.map((location) => (
                          <label
                            key={location}
                            className="flex items-center gap-2 cursor-pointer hover:text-emerald-600 transition"
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
                            className="flex items-center gap-2 cursor-pointer hover:text-emerald-600 transition"
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

                {/* Footer con botones */}
                <div className="border-t border-slate-200 p-4">
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        clearFilters();
                        setShowMobileFilters(false);
                      }}
                      className="flex-1 rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
                    >
                      Limpiar
                    </button>
                    <button
                      onClick={() => setShowMobileFilters(false)}
                      className="flex-1 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-emerald-700"
                    >
                      Aplicar
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Contenido principal */}
        <main className="flex-1">
          {/* Breadcrumbs y título */}
          <div className="mb-4">
            <nav className="mb-2 text-xs font-semibold text-slate-500">
              <Link href="/" className="hover:text-emerald-600">INICIO</Link>
              <span className="mx-2">/</span>
              <span className="text-slate-900">PRODUCTORES</span>
            </nav>
            <h1 className="text-2xl font-bold text-slate-900">Productores</h1>
            <p className="mt-1 text-xs text-slate-500">
              {filteredFarmers.length} de {farmers.length} productores
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
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
              {filteredFarmers.map((farmer) => (
                <Link
                  key={farmer.user_id}
                  href={`/agricultores/${farmer.user_id}`}
                  className="group flex flex-col rounded-xl border border-slate-200 bg-white shadow-sm transition hover:border-emerald-500 hover:shadow-md"
                >
                  {/* Avatar con inicial */}
                  <div className="relative h-52 w-full overflow-hidden rounded-t-xl bg-gradient-to-br from-emerald-100 to-emerald-50">
                    <div className="flex h-full items-center justify-center">
                      <div className="flex h-20 w-20 items-center justify-center rounded-full bg-emerald-500 text-3xl font-bold text-white shadow-lg">
                        {farmer.name.charAt(0).toUpperCase()}
                      </div>
                    </div>
                  </div>

                  {/* Contenido */}
                  <div className="flex flex-1 flex-col p-4">
                    <div className="mb-2">
                      <p className="text-xs font-semibold uppercase text-emerald-600">
                        AGRICULTOR
                      </p>
                    </div>
                    <h3 className="mb-1 line-clamp-2 text-base font-semibold text-slate-900 group-hover:text-emerald-600">
                      {farmer.name}
                </h3>
                    <p className="mb-2 line-clamp-1 text-xs text-slate-600">
                      📍 {farmer.location}
                    </p>

                    {farmer.bio && (
                      <p className="mb-3 line-clamp-2 text-xs text-slate-600">
                        {farmer.bio}
                      </p>
                    )}

                    <div className="mt-auto flex items-center justify-between pt-2 border-t border-slate-100">
                      <span className="text-xs font-semibold text-emerald-600">
                        {farmer.products_count} producto{farmer.products_count !== 1 ? "s" : ""}
                      </span>
                      <span className="text-xs font-semibold text-slate-600 group-hover:text-emerald-600">
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

