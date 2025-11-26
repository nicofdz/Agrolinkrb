"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";

type CatalogItem = {
  id: string;
  name: string;
  category: string;
  harvestWindow: string;
  priceRange: string;
  availability: "Alta" | "Media" | "Baja";
  sustainability: string;
  highlights: string[];
  producerSlug?: string;
  producerName?: string;
  sellerName?: string;
  location?: string;
  badges?: string[];
  image_url?: string;
  stock?: number;
};

function getProductImage(product: CatalogItem): string {
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

type ProductModalProps = {
  product: CatalogItem | null;
  isOpen: boolean;
  onClose: () => void;
  cart: Record<string, number>;
  onAddToCart: (id: string, quantity?: number) => void;
  onSetQuantity: (id: string, quantity: number) => void;
  onDecrement: (id: string) => void;
};

export function ProductModal({
  product,
  isOpen,
  onClose,
  cart,
  onAddToCart,
  onSetQuantity,
  onDecrement,
}: ProductModalProps) {
  const [quantity, setQuantity] = useState(1);
  const [showQuantityInput, setShowQuantityInput] = useState(false);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
      setQuantity(1);
      // Siempre mostrar el input de cantidad cuando se abre el modal
      setShowQuantityInput(true);
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  if (!isOpen || !product) return null;

  const cartQuantity = cart[product.id] || 0;

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div
          className="relative w-full max-w-5xl max-h-[90vh] overflow-y-auto rounded-3xl bg-slate-900 border border-white/10 shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Botón cerrar */}
          <button
            onClick={onClose}
            className="absolute right-4 top-4 z-10 rounded-full bg-slate-800/90 p-2 text-emerald-100 shadow-lg transition hover:bg-slate-800 hover:text-emerald-300"
            aria-label="Cerrar"
          >
            <svg
              className="h-6 w-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>

          <div className="grid gap-0 lg:grid-cols-2">
            {/* Imagen completa a la izquierda */}
            <div className="relative w-full bg-slate-950">
              <div className="relative aspect-square w-full lg:aspect-[4/5]">
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
            <div className="flex flex-col gap-6 p-8">
              <div className="space-y-3">
                <p className="text-xs font-semibold uppercase text-emerald-400">
                  {product.category}
                </p>
                <h2 className="text-3xl font-semibold text-white">
                  {product.name}
                </h2>
                <p className="text-base text-emerald-100">{product.harvestWindow}</p>
                <div className="flex flex-wrap gap-2 text-xs font-semibold text-emerald-300">
                  {(product.badges || []).map((badge) => (
                    <span
                      key={`${product.id}-${badge}`}
                      className="rounded-full border border-emerald-500/50 bg-emerald-900/30 px-3 py-1"
                    >
                      {badge}
                    </span>
                  ))}
                </div>
              </div>

              <div className="grid gap-4 border-t border-white/10 pt-6 text-sm text-emerald-100">
                <div>
                  <span className="text-emerald-300">Precio guía:</span>{" "}
                  <span className="font-semibold text-white">
                    {product.priceRange}
                  </span>
                </div>
                <div>
                  <span className="text-emerald-300">Disponibilidad:</span>{" "}
                  <span className="font-semibold text-white">
                    {product.availability}
                  </span>
                </div>
                <div>
                  <span className="text-emerald-300">Stock disponible:</span>{" "}
                  <span className={`font-semibold ${
                    (product.stock || 0) > 0 ? "text-white" : "text-red-400"
                  }`}>
                    {product.stock || 0} unidades
                  </span>
                </div>
                <div>
                  <span className="text-emerald-300">Prácticas:</span>{" "}
                  <span className="font-semibold text-white">
                    {product.sustainability}
                  </span>
                </div>
                <div>
                  <span className="text-emerald-300">Vendedor:</span>{" "}
                  <span className="font-semibold text-white">
                    {product.sellerName || product.producerName || "No especificado"}
                  </span>
                </div>
              </div>

              <div className="border-t border-white/10 pt-6">
                <p className="mb-3 text-sm font-semibold text-emerald-100">
                  Características destacadas:
                </p>
                <ul className="space-y-2 text-sm text-emerald-100">
                  {product.highlights.map((highlight) => (
                    <li key={highlight} className="flex items-start gap-2">
                      <span className="mt-1 text-emerald-400">•</span>
                      <span>{highlight}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="mt-auto space-y-3 border-t border-white/10 pt-6">
                <Link
                  href={`/productores/${product.producerSlug}`}
                  onClick={onClose}
                  className="flex w-full items-center justify-center rounded-2xl border border-white/10 bg-slate-800/50 px-4 py-3 text-sm font-semibold text-emerald-100 transition hover:border-emerald-500 hover:bg-emerald-900/30 hover:text-emerald-300"
                >
                  Ver perfil del productor
                </Link>
                
                {showQuantityInput ? (
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <label className="text-sm font-semibold text-emerald-100">
                        Cantidad:
                      </label>
                      <input
                        type="number"
                        min="1"
                        max={product.stock || 0}
                        value={quantity}
                        onChange={(e) => {
                          const val = parseInt(e.target.value, 10);
                          const availableStock = product.stock || 0;
                          const currentCartQuantity = cart[product.id] || 0;
                          const maxAllowed = availableStock - currentCartQuantity;
                          
                          if (!isNaN(val) && val > 0) {
                            // Limitar el valor al stock disponible
                            const limitedVal = Math.min(val, maxAllowed);
                            setQuantity(limitedVal);
                            if (val > maxAllowed) {
                              alert(`No puedes agregar más de ${maxAllowed} unidades. Stock disponible: ${availableStock} unidades. Ya tienes ${currentCartQuantity} en el carrito.`);
                            }
                          }
                        }}
                        className="flex-1 rounded-xl border border-white/10 bg-slate-800/50 px-4 py-2 text-sm text-white focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                        autoFocus
                      />
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          const availableStock = product.stock || 0;
                          const currentCartQuantity = cart[product.id] || 0;
                          const maxAllowed = availableStock - currentCartQuantity;
                          
                          if (quantity > 0 && quantity <= maxAllowed) {
                            onAddToCart(product.id, quantity);
                            setShowQuantityInput(false);
                            setQuantity(1);
                          } else if (quantity > maxAllowed) {
                            alert(`No puedes agregar más de ${maxAllowed} unidades. Stock disponible: ${availableStock} unidades. Ya tienes ${currentCartQuantity} en el carrito.`);
                          }
                        }}
                        disabled={quantity <= 0 || (product.stock || 0) <= 0}
                        className="flex-1 rounded-2xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-slate-600 disabled:opacity-50"
                      >
                        Agregar {quantity} al carrito
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setShowQuantityInput(false);
                          setQuantity(1);
                        }}
                        className="rounded-2xl border border-white/10 bg-slate-800/50 px-4 py-3 text-sm font-semibold text-emerald-100 transition hover:border-emerald-500"
                      >
                        Cancelar
                      </button>
                    </div>
                  </div>
                ) : cartQuantity > 0 ? (
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => onDecrement(product.id)}
                        className="flex h-10 w-10 items-center justify-center rounded-full border border-emerald-400 bg-slate-800/50 text-emerald-300 transition hover:bg-emerald-900/30"
                      >
                        −
                      </button>
                      <span className="flex-1 text-center text-sm font-semibold text-emerald-100">
                        {cartQuantity} en carrito
                      </span>
                      <button
                        type="button"
                        onClick={() => onAddToCart(product.id)}
                        disabled={(cartQuantity || 0) >= (product.stock || 0)}
                        className="flex h-10 w-10 items-center justify-center rounded-full border border-emerald-400 bg-slate-800/50 text-emerald-300 transition hover:bg-emerald-900/30 disabled:cursor-not-allowed disabled:opacity-50"
                        title={(cartQuantity || 0) >= (product.stock || 0) ? "Stock máximo alcanzado" : "Agregar más"}
                      >
                        +
                      </button>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowQuantityInput(true)}
                      className="w-full rounded-2xl border border-emerald-400 bg-slate-800/50 px-4 py-3 text-sm font-semibold text-emerald-100 transition hover:border-emerald-500 hover:bg-emerald-900/30"
                    >
                      Agregar más cantidad
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      if ((product.stock || 0) > 0) {
                        setShowQuantityInput(true);
                      } else {
                        alert("Este producto no tiene stock disponible.");
                      }
                    }}
                    disabled={(product.stock || 0) <= 0}
                    className="flex w-full items-center justify-center rounded-2xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-slate-600 disabled:opacity-50"
                  >
                    {(product.stock || 0) > 0 ? "Añadir al carrito" : "Sin stock disponible"}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

