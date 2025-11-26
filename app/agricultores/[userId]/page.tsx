"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { TopNav } from "../../components/top-nav";
import { useAuth } from "../../components/auth-provider";
import Footer from "../../components/footer";
import { supabase } from "../../lib/supabase";

type FarmerProfile = {
  id?: string;
  user_id: string;
  bio: string | null;
  location: string | null;
  phone: string | null;
  website: string | null;
  social_media: Record<string, string> | null;
  certifications: string[] | null;
  specialties: string[] | null;
};

type Product = {
  id: string;
  name: string;
  category: string;
  price_range: string;
  stock: number;
  is_active: boolean;
  image_url: string | null;
  location: string;
  availability: string;
};

type FarmerPageProps = {
  params: Promise<{ userId: string }>;
};

export default function FarmerPublicProfilePage({ params }: FarmerPageProps) {
  const { user, loading: authLoading } = useAuth();
  const { userId } = use(params);
  const [farmerName, setFarmerName] = useState<string | null>(null);
  const [profile, setProfile] = useState<FarmerProfile | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  // El perfil público de agricultor es accesible sin login
  useEffect(() => {
    if (!authLoading) {
      loadData();
    }
  }, [authLoading, userId]);

  async function loadData() {
    try {
      setLoading(true);
      await Promise.all([
        loadFarmerName(),
        loadProfile(),
        loadProducts(),
      ]);
    } catch (error) {
      console.error("Error al cargar datos:", error);
    } finally {
      setLoading(false);
    }
  }

  async function loadFarmerName() {
    try {
      const { data: name, error } = await supabase.rpc('get_user_name', {
        user_id_param: userId
      });
      
      if (!error && name) {
        setFarmerName(name);
      }
    } catch (error) {
      console.error("Error al cargar nombre del agricultor:", error);
    }
  }

  async function loadProfile() {
    try {
      const response = await fetch(`/api/farmer-profile?user_id=${userId}`);
      if (response.ok) {
        const data = await response.json();
        setProfile(data);
      }
    } catch (error) {
      console.error("Error al cargar perfil:", error);
    }
  }

  async function loadProducts() {
    try {
      const response = await fetch(`/api/products?user_id=${userId}&only_active=true`);
      if (response.ok) {
        const data = await response.json();
        setProducts(data || []);
      }
    } catch (error) {
      console.error("Error al cargar productos:", error);
    }
  }

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-slate-100 text-slate-900">
        <TopNav />
        <div className="flex min-h-screen items-center justify-center">
          <p className="text-slate-600">Cargando...</p>
        </div>
      </div>
    );
  }

  // El perfil es público, no requiere login

  const displayName = farmerName || "Agricultor";

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900">
      <TopNav />
      <div className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-8 lg:px-12">
        <Link
          href="/catalogo"
          className="mb-6 inline-block text-sm font-semibold text-emerald-600 transition hover:text-emerald-700"
        >
          ← Volver al catálogo
        </Link>

        {/* Header del perfil */}
        <header className="mb-8 rounded-3xl border border-slate-200 bg-white p-8">
          <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
            <div className="flex-1">
              <p className="text-sm font-semibold text-emerald-600">
                Perfil del agricultor
              </p>
              <h1 className="mt-2 text-4xl font-semibold text-slate-900">
                {displayName}
              </h1>
              {profile?.location && (
                <p className="mt-2 text-lg text-slate-600">{profile.location}</p>
              )}
              {profile?.bio && (
                <p className="mt-4 text-slate-600">{profile.bio}</p>
              )}
            </div>
            {user?.id === userId && (
              <Link
                href="/agricultores/perfil"
                className="rounded-xl border border-emerald-500 bg-emerald-50 px-6 py-3 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-100"
              >
                Editar mi perfil
              </Link>
            )}
          </div>

          {/* Certificaciones y especialidades */}
          {(profile?.certifications && profile.certifications.length > 0) ||
          (profile?.specialties && profile.specialties.length > 0) ? (
            <div className="mt-6 flex flex-wrap gap-3">
              {profile?.certifications?.map((cert, index) => (
                <span
                  key={`cert-${index}`}
                  className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-1 text-sm font-semibold text-emerald-700"
                >
                  {cert}
                </span>
              ))}
              {profile?.specialties?.map((specialty, index) => (
                <span
                  key={`spec-${index}`}
                  className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-1 text-sm font-semibold text-slate-700"
                >
                  {specialty}
                </span>
              ))}
            </div>
          ) : null}

          {/* Información de contacto */}
          {(profile?.phone || profile?.website) && (
            <div className="mt-6 grid gap-4 border-t border-slate-200 pt-6 sm:grid-cols-2">
              {profile.phone && (
                <div>
                  <p className="text-sm font-semibold text-slate-700">Teléfono</p>
                  <a
                    href={`tel:${profile.phone}`}
                    className="mt-1 text-emerald-600 hover:underline"
                  >
                    {profile.phone}
                  </a>
                </div>
              )}
              {profile.website && (
                <div>
                  <p className="text-sm font-semibold text-slate-700">Sitio web</p>
                  <a
                    href={profile.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-1 text-emerald-600 hover:underline"
                  >
                    {profile.website}
                  </a>
                </div>
              )}
            </div>
          )}
        </header>

        {/* Productos disponibles */}
        <section className="rounded-3xl border border-slate-200 bg-white p-8">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-semibold text-slate-900">
                Productos disponibles
              </h2>
              <p className="mt-1 text-sm text-slate-600">
                {products.length} producto{products.length !== 1 ? "s" : ""} activo{products.length !== 1 ? "s" : ""}
              </p>
            </div>
          </div>

          {products.length === 0 ? (
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-12 text-center">
              <p className="text-slate-600">
                Este agricultor aún no tiene productos disponibles.
              </p>
            </div>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {products.map((product) => (
                <Link
                  key={product.id}
                  href={`/catalogo/${product.id}`}
                  className="group rounded-2xl border border-slate-200 bg-white p-6 transition hover:border-emerald-500 hover:shadow-lg"
                >
                  {product.image_url && (
                    <div className="mb-4 h-48 w-full overflow-hidden rounded-xl">
                      <Image
                        src={product.image_url}
                        alt={product.name}
                        width={400}
                        height={200}
                        className="h-full w-full object-cover transition group-hover:scale-105"
                      />
                    </div>
                  )}
                  <div className="mb-2">
                    <p className="text-xs font-semibold uppercase text-emerald-600">
                      {product.category}
                    </p>
                    <h3 className="mt-1 text-lg font-semibold text-slate-900 group-hover:text-emerald-600">
                      {product.name}
                    </h3>
                  </div>
                  <div className="space-y-2 text-sm text-slate-600">
                    <p>
                      <span className="font-semibold text-emerald-600">Precio:</span>{" "}
                      {product.price_range}
                    </p>
                    <p>
                      <span className="font-semibold text-emerald-600">Stock:</span>{" "}
                      <span className={product.stock > 0 ? "text-emerald-600" : "text-red-600"}>
                        {product.stock} unidades
                      </span>
                    </p>
                    <p>
                      <span className="font-semibold text-emerald-600">Disponibilidad:</span>{" "}
                      {product.availability}
                    </p>
                    <p>
                      <span className="font-semibold text-emerald-600">Ubicación:</span>{" "}
                      {product.location}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>
      </div>
      <Footer />
    </div>
  );
}


