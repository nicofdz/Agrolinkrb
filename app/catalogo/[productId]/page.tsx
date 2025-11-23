"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import { TopNav } from "../../components/top-nav";
import { useAuth } from "../../components/auth-provider";
import Footer from "../../components/footer";

function getProductImage(product: any): string {
  // Si tiene image_url en la base de datos, usarla
  if (product.image_url) {
    return product.image_url;
  }
  // Fallback a mapeo por nombre si existe
  const nameLower = product.name.toLowerCase();
  if (nameLower.includes("espinaca")) return "/espinaca-baby.jpg";
  if (nameLower.includes("betarraga")) return "/betarraga.jpg";
  if (nameLower.includes("huevo")) return "/huevos-azules.jpg";
  if (nameLower.includes("tomate")) return "/TOMATE.jpg";
  if (nameLower.includes("zapallo")) return "/ZAPALLO.jpg";
  return "/next.svg";
}

type ProductPageProps = {
  params: Promise<{ productId: string }>;
};

type Product = {
  id: string;
  name: string;
  category: string;
  harvestWindow: string;
  priceRange: string;
  availability: string;
  sustainability: string;
  highlights: string[];
  image_url?: string;
  producerSlug: string;
  producerName: string;
  sellerId?: string;
  location: string;
  badges: string[];
};

export default function ProductDetailPage({ params }: ProductPageProps) {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { productId } = use(params);
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        router.push(`/auth/login?redirect=/catalogo/${productId}`);
      } else {
        loadProduct();
      }
    }
  }, [user, authLoading, router, productId]);

  async function loadProduct() {
    try {
      const response = await fetch("/api/products");
      if (response.ok) {
        const products = await response.json();
        const foundProduct = products.find((p: any) => p.id === productId);
        if (foundProduct) {
          setProduct({
            id: foundProduct.id,
            name: foundProduct.name,
            category: foundProduct.category,
            harvestWindow: foundProduct.harvest_window,
            priceRange: foundProduct.price_range,
            availability: foundProduct.availability,
            sustainability: foundProduct.sustainability,
            highlights: foundProduct.highlights || [],
            image_url: foundProduct.image_url,
            producerSlug: foundProduct.user_id || "agricultor",
            producerName: foundProduct.seller_name || "Agricultor",
            sellerId: foundProduct.user_id || null,
            location: foundProduct.location || "Local",
            badges: ["Producto local"],
          });
        }
      }
    } catch (error) {
      console.error("Error al cargar producto:", error);
    } finally {
      setLoading(false);
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

  if (!user) {
    return null; // El useEffect redirigirá
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-slate-100 text-slate-900">
        <TopNav />
        <div className="flex min-h-screen items-center justify-center">
          <div className="text-center">
            <p className="text-lg font-semibold text-slate-900">Producto no encontrado</p>
            <Link
              href="/catalogo"
              className="mt-4 inline-block text-sm font-semibold text-emerald-600 hover:text-emerald-700"
            >
              Volver al catálogo
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900">
      <TopNav />
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-8 px-4 py-10 sm:px-8 lg:px-12">
        <Link
          href="/catalogo"
          className="text-sm font-semibold text-emerald-600 transition hover:text-emerald-700"
        >
          ← Volver al catálogo
        </Link>

        <header className="space-y-3">
          <p className="text-xs font-semibold uppercase text-emerald-600">
            {product.category}
          </p>
          <h1 className="text-4xl font-semibold text-slate-900">
            {product.name}
          </h1>
          <p className="text-base text-slate-600">{product.harvestWindow}</p>
          <div className="flex flex-wrap gap-2 text-xs font-semibold text-emerald-700">
            {product.badges.map((badge) => (
              <span
                key={`${product.id}-${badge}`}
                className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1"
              >
                {badge}
              </span>
            ))}
          </div>
        </header>

        <div className="grid gap-8 lg:grid-cols-2">
          {/* Imagen completa a la izquierda */}
          <div className="relative w-full overflow-hidden rounded-3xl bg-slate-100">
            <div className="relative aspect-[4/3] w-full">
              <Image
                src={getProductImage(product)}
                alt={product.name}
                fill
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 50vw"
                priority
              />
            </div>
          </div>

          {/* Información del producto a la derecha */}
          <div className="flex flex-col gap-6 rounded-3xl border border-slate-200 bg-white p-8">
            <div className="grid gap-4 text-sm text-slate-700">
              <div>
                <span className="text-slate-500">Precio guía:</span>{" "}
                <span className="font-semibold text-slate-900">
                  {product.priceRange}
                </span>
              </div>
              <div>
                <span className="text-slate-500">Disponibilidad:</span>{" "}
                <span className="font-semibold text-slate-900">
                  {product.availability}
                </span>
              </div>
              <div>
                <span className="text-slate-500">Prácticas:</span>{" "}
                <span className="font-semibold text-slate-900">
                  {product.sustainability}
                </span>
              </div>
              <div>
                <span className="text-slate-500">Vendedor:</span>{" "}
                <span className="font-semibold text-slate-900">
                  {product.producerName}
                </span>
              </div>
            </div>

            <div className="border-t border-slate-200 pt-4">
              <p className="mb-3 text-sm font-semibold text-slate-700">
                Características destacadas:
              </p>
              <ul className="space-y-2 text-sm text-slate-600">
                {product.highlights.map((highlight) => (
                  <li key={highlight} className="flex items-start gap-2">
                    <span className="mt-1 text-emerald-600">•</span>
                    <span>{highlight}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="mt-auto space-y-3 border-t border-slate-200 pt-6">
              {product.sellerId ? (
                <Link
                  href={`/agricultores/${product.sellerId}`}
                  className="flex w-full items-center justify-center rounded-2xl border border-slate-300 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-700"
                >
                  Ver perfil del productor
                </Link>
              ) : null}
              <Link
                href="/catalogo"
                className="flex w-full items-center justify-center rounded-2xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700"
              >
                Volver al catálogo
              </Link>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}


