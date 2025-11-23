"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { TopNav } from "../components/top-nav";
import { ProductModal } from "../components/product-modal";
import { useAuth } from "../components/auth-provider";
import Footer from "../components/footer";
import { getCart, saveCart, setCartItem, clearCart as clearCartStorage, type Cart } from "../lib/cart";

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
  sellerId?: string;
  location?: string;
  badges?: string[];
  image_url?: string;
  stock?: number;
};

// Mapeo de IDs de productos a imágenes
const productImages: Record<string, string> = {
  "rv-espinaca": "/espinaca-baby.jpg",
  "rv-betarraga": "/betarraga.jpg",
  "gt-huevoazul": "/huevos-azules.jpg",
  "hk-tomate": "/TOMATE.jpg",
  "hk-zapallo": "/ZAPALLO.jpg",
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

export default function CatalogoPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [cart, setCart] = useState<Cart>({});
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedProduct, setSelectedProduct] = useState<CatalogItem | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [catalogItems, setCatalogItems] = useState<CatalogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [quantityInputs, setQuantityInputs] = useState<Record<string, { show: boolean; value: number }>>({});

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/auth/login?redirect=/catalogo");
    }
  }, [user, authLoading, router]);

  // Cargar carrito desde localStorage al montar
  useEffect(() => {
    const savedCart = getCart();
    setCart(savedCart);
  }, []);

  useEffect(() => {
    loadProducts();
  }, []);

  const cartItems = Object.entries(cart);
  const cartCount = cartItems.reduce((total, [, qty]) => total + qty, 0);
  const cartHref = useMemo(() => {
    if (cartItems.length === 0) {
      return "";
    }
    const serialized = cartItems
      .map(([id, qty]) => `${id}:${qty}`)
      .join(",");
    return `/carrito?items=${encodeURIComponent(serialized)}`;
  }, [cartItems]);

  function addToCart(id: string, quantity: number = 1) {
    const product = catalogItems.find((item) => item.id === id);
    if (!product) return;
    
    const currentCartQuantity = cart[id] || 0;
    const totalQuantity = currentCartQuantity + quantity;
    const availableStock = product.stock || 0;
    
    // Validar que no se exceda el stock disponible
    if (totalQuantity > availableStock) {
      alert(`No hay suficiente stock disponible. Stock disponible: ${availableStock} unidades. Ya tienes ${currentCartQuantity} en el carrito.`);
      return;
    }
    
    const newCart = setCartItem(id, totalQuantity);
    setCart(newCart);
    // Disparar evento después del render
    setTimeout(() => {
      window.dispatchEvent(new CustomEvent("cart-updated"));
    }, 0);
  }

  function setCartQuantity(id: string, quantity: number) {
    const product = catalogItems.find((item) => item.id === id);
    if (!product) return;
    
    const availableStock = product.stock || 0;
    
    // Validar que no se exceda el stock disponible
    if (quantity > availableStock) {
      alert(`No hay suficiente stock disponible. Stock disponible: ${availableStock} unidades.`);
      return;
    }
    
    const newCart = setCartItem(id, quantity);
    setCart(newCart);
    // Disparar evento después del render
    setTimeout(() => {
      window.dispatchEvent(new CustomEvent("cart-updated"));
    }, 0);
  }

  function decrement(id: string) {
    const current = cart[id] || 0;
    if (current <= 1) {
      const newCart = { ...cart };
      delete newCart[id];
      setCart(newCart);
      saveCart(newCart);
    } else {
      const newCart = setCartItem(id, current - 1);
      setCart(newCart);
    }
    // Disparar evento después del render
    setTimeout(() => {
      window.dispatchEvent(new CustomEvent("cart-updated"));
    }, 0);
  }

  function clearCart() {
    clearCartStorage();
    setCart({});
    // Disparar evento después del render
    setTimeout(() => {
      window.dispatchEvent(new CustomEvent("cart-updated"));
    }, 0);
  }

  function openProductModal(product: CatalogItem) {
    setSelectedProduct(product);
    setIsModalOpen(true);
  }

  function closeProductModal() {
    setIsModalOpen(false);
    setSelectedProduct(null);
  }

  async function loadProducts() {
    try {
      setLoading(true);
      const response = await fetch("/api/products?only_active=true");
      if (response.ok) {
        const data = await response.json();
        // Convertir productos de la BD al formato CatalogItem
        const convertedProducts: CatalogItem[] = data.map((product: any) => {
          const sellerName = product.seller_name || null;
          const sellerId = product.user_id || null;
          console.log(`[CATALOG] Producto ${product.name}: seller_name = ${sellerName}, sellerId = ${sellerId}`);
          return {
            id: product.id,
            name: product.name,
            category: product.category,
            harvestWindow: product.harvest_window,
            priceRange: product.price_range,
            availability: product.availability,
            sustainability: product.sustainability,
            highlights: product.highlights || [],
            image_url: product.image_url,
            location: product.location || "Osorno",
            sellerName: sellerName,
            sellerId: sellerId,
            stock: product.stock || 0,
            // Valores por defecto ya que los productos de agricultores no tienen productor asociado
            producerSlug: sellerId || "agricultor",
            producerName: sellerName || "Agricultor",
            badges: ["Producto local"],
          };
        });
        setCatalogItems(convertedProducts);
      }
    } catch (error) {
      console.error("Error al cargar productos:", error);
    } finally {
      setLoading(false);
    }
  }

  // Obtener categorías únicas de los productos disponibles
  const categoryOptions = useMemo(() => {
    const categories = Array.from(
      new Set(catalogItems.map((item) => item.category))
    ).sort();
    return [
      { value: "all", label: "Todas las categorías" },
      ...categories.map((category) => ({ value: category, label: category })),
    ];
  }, [catalogItems]);

  const filteredItems = useMemo(() => {
    let filtered = catalogItems;

    // Filtrar por categoría
    if (selectedCategory !== "all") {
      filtered = filtered.filter((item) => item.category === selectedCategory);
    }

    // Filtrar por búsqueda
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (item) =>
          item.name.toLowerCase().includes(query) ||
          item.category.toLowerCase().includes(query) ||
          item.sustainability.toLowerCase().includes(query)
      );
    }

    return filtered;
  }, [selectedCategory, catalogItems, searchQuery]);

  // Agrupar productos por ubicación
  const productsByLocation = useMemo(() => {
    const grouped: Record<string, CatalogItem[]> = {};
    filteredItems.forEach((item) => {
      const location = item.location || "Osorno";
      if (!grouped[location]) {
        grouped[location] = [];
      }
      grouped[location].push(item);
    });
    return grouped;
  }, [filteredItems]);

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
      <TopNav cartCount={cartCount} cartHref={cartHref || undefined} />
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-10 sm:px-8 lg:px-12">
        <header className="flex flex-col gap-2">
          <p className="text-sm font-semibold text-emerald-600">
            Catálogo vivo
          </p>
          <h1 className="text-3xl font-semibold text-slate-900">
            Productos disponibles para armar pedidos multiproveedor
          </h1>
          <p className="text-base text-slate-600">
            Añade los productos al carrito y agenda la logística desde la vista
            de pedidos.
          </p>
        </header>

        <section className="rounded-3xl border border-slate-200 bg-white px-6 py-8 sm:px-10">
          <div className="flex flex-col gap-6">
            <div>
              <p className="text-xs font-semibold uppercase text-emerald-600">
                Filtros y búsqueda
              </p>
              <h2 className="mt-1 text-2xl font-semibold text-slate-900">
                Buscar y filtrar productos
              </h2>
            </div>
            
            {/* Barra de búsqueda */}
            <div className="relative">
              <label htmlFor="search" className="sr-only">
                Buscar productos
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
                  <svg
                    className="h-5 w-5 text-slate-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                    />
                  </svg>
                </div>
                <input
                  type="text"
                  id="search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Buscar por nombre, categoría o prácticas..."
                  className="w-full rounded-xl border border-slate-200 bg-white pl-12 pr-4 py-3 text-sm font-semibold text-slate-900 placeholder:text-slate-400 transition hover:border-emerald-500 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery("")}
                    className="absolute inset-y-0 right-0 flex items-center pr-4 text-slate-400 hover:text-emerald-600"
                  >
                    <svg
                      className="h-5 w-5"
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
                )}
              </div>
            </div>

            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="relative flex-1 sm:max-w-xs">
                <label htmlFor="category-filter" className="sr-only">
                  Seleccionar categoría
                </label>
                <select
                  id="category-filter"
                  value={selectedCategory}
                  onChange={(event) => setSelectedCategory(event.target.value)}
                  className="w-full appearance-none rounded-xl border border-slate-200 bg-white px-4 py-3 pr-10 text-sm font-semibold text-slate-900 transition hover:border-emerald-500 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                >
                  {categoryOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3 text-emerald-600">
                  <svg
                    className="h-5 w-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </span>
              </div>
              {(selectedCategory !== "all" || searchQuery) && (
                <button
                  type="button"
                  onClick={() => {
                    setSelectedCategory("all");
                    setSearchQuery("");
                  }}
                  className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-600 transition hover:border-emerald-500 hover:bg-emerald-50 hover:text-emerald-700"
                >
                  Limpiar filtros
                </button>
              )}
            </div>
            {(selectedCategory !== "all" || searchQuery) && (
              <p className="text-sm text-slate-600">
                Mostrando {filteredItems.length} producto
                {filteredItems.length !== 1 ? "s" : ""}
                {searchQuery && ` para "${searchQuery}"`}
              </p>
            )}
          </div>
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white px-6 py-10 sm:px-10">
          <div className="mb-8">
            <p className="text-xs font-semibold uppercase text-emerald-600">
              Inventario disponible
            </p>
            <h2 className="mt-1 text-3xl font-semibold text-slate-900">
              Productos disponibles
            </h2>
          </div>

          {loading ? (
            <p className="text-sm text-slate-600">Cargando productos...</p>
          ) : filteredItems.length === 0 ? (
            <p className="text-sm text-slate-600">
              No encontramos productos. Ajusta los filtros o la búsqueda.
            </p>
          ) : (
            <div className="space-y-12">
              {Object.entries(productsByLocation).map(([location, items]) => (
                <div key={location} className="space-y-6">
                  <div className="flex items-center gap-3">
                    <div className="h-px flex-1 bg-slate-200"></div>
                    <h3 className="text-xl font-semibold text-slate-900">
                      {location}
                    </h3>
                    <div className="h-px flex-1 bg-slate-200"></div>
                    <span className="text-sm text-emerald-700">
                      {items.length} producto{items.length !== 1 ? "s" : ""}
                    </span>
                  </div>
                  <div className="grid gap-6 md:grid-cols-2">
                    {items.map((item) => (
                <article
                  key={item.id}
                  className="flex flex-col gap-5 rounded-3xl border border-slate-200 bg-white p-6 shadow-lg transition hover:-translate-y-1 hover:border-emerald-500 hover:shadow-xl"
                >
                  <button
                    onClick={() => openProductModal(item)}
                    className="group flex w-full flex-col gap-4 text-left"
                  >
                    <div className="relative h-40 w-full overflow-hidden rounded-2xl bg-slate-100">
                      <Image
                        src={getProductImage(item)}
                        alt={item.name}
                        fill
                        className="object-cover transition group-hover:scale-105"
                        sizes="(max-width: 768px) 100vw, 50vw"
                      />
                    </div>
                    <div className="flex flex-col gap-2">
                      <p className="text-xs font-semibold uppercase text-emerald-600">
                        {item.category}
                      </p>
                      <h3 className="text-2xl font-semibold text-slate-900 group-hover:text-emerald-600">
                        {item.name}
                      </h3>
                      <p className="text-sm text-slate-600">{item.harvestWindow}</p>
                    </div>
                    <div className="flex flex-wrap gap-2 text-xs font-semibold text-emerald-700">
                      {(item.badges || []).map((badge) => (
                        <span
                          key={`${item.id}-${badge}`}
                          className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1"
                        >
                          {badge}
                        </span>
                      ))}
                    </div>
                    <div className="grid gap-3 text-sm text-slate-600 sm:grid-cols-2">
                      <p>
                        <span className="text-emerald-600 font-semibold">Precio guía:</span>{" "}
                        {item.priceRange}
                      </p>
                      <p>
                        <span className="text-emerald-600 font-semibold">Disponibilidad:</span>{" "}
                        {item.availability}
                      </p>
                      <p>
                        <span className="text-emerald-600 font-semibold">Stock disponible:</span>{" "}
                        <span className={`font-semibold ${
                          (item.stock || 0) > 0 ? "text-emerald-600" : "text-red-600"
                        }`}>
                          {item.stock || 0} unidades
                        </span>
                      </p>
                      <p>
                        <span className="text-emerald-600 font-semibold">Prácticas:</span>{" "}
                        {item.sustainability}
                      </p>
                      <p>
                        <span className="text-emerald-600 font-semibold">Vendedor:</span>{" "}
                        <span className="font-semibold text-slate-900">
                          {item.sellerName || item.producerName || "No especificado"}
                        </span>
                      </p>
                      <p>
                        <span className="text-emerald-600 font-semibold">Ubicación:</span>{" "}
                        <span className="font-semibold text-slate-900">
                          {item.location || "Osorno"}
                        </span>
                      </p>
                    </div>
                  </button>
                  <div className="flex flex-wrap items-center gap-3 text-sm font-semibold">
                    {item.sellerId ? (
                      <Link
                        href={`/agricultores/${item.sellerId}`}
                        className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-slate-600 transition hover:border-emerald-500 hover:text-emerald-600"
                      >
                        Ver productor
                      </Link>
                    ) : null}
                    
                    {quantityInputs[item.id]?.show ? (
                      <div className="flex items-center gap-2">
                        <label className="text-xs text-slate-600">Cantidad:</label>
                        <input
                          type="text"
                          inputMode="numeric"
                          pattern="[0-9]*"
                          value={quantityInputs[item.id].value === 0 ? "" : quantityInputs[item.id].value}
                          onChange={(e) => {
                            const inputValue = e.target.value;
                            // Permitir campo vacío mientras escribe
                            if (inputValue === "") {
                              setQuantityInputs((prev) => ({
                                ...prev,
                                [item.id]: { show: true, value: 0 },
                              }));
                              return;
                            }
                            // Solo permitir números
                            const numericValue = inputValue.replace(/[^0-9]/g, "");
                            if (numericValue === "") {
                              setQuantityInputs((prev) => ({
                                ...prev,
                                [item.id]: { show: true, value: 0 },
                              }));
                              return;
                            }
                            const val = parseInt(numericValue, 10);
                            const availableStock = item.stock || 0;
                            const currentCartQuantity = cart[item.id] || 0;
                            const maxAllowed = availableStock - currentCartQuantity;
                            
                            if (!isNaN(val) && val > 0) {
                              // Limitar el valor al stock disponible
                              const limitedVal = Math.min(val, maxAllowed);
                              setQuantityInputs((prev) => ({
                                ...prev,
                                [item.id]: { show: true, value: limitedVal },
                              }));
                              if (val > maxAllowed) {
                                alert(`No puedes agregar más de ${maxAllowed} unidades. Stock disponible: ${availableStock} unidades. Ya tienes ${currentCartQuantity} en el carrito.`);
                              }
                            }
                          }}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              const currentValue = quantityInputs[item.id].value;
                              const availableStock = item.stock || 0;
                              const currentCartQuantity = cart[item.id] || 0;
                              const maxAllowed = availableStock - currentCartQuantity;
                              
                              if (currentValue > 0 && currentValue <= maxAllowed) {
                                addToCart(item.id, currentValue);
                                setQuantityInputs((prev) => {
                                  const newState = { ...prev };
                                  delete newState[item.id];
                                  return newState;
                                });
                              } else if (currentValue > maxAllowed) {
                                alert(`No puedes agregar más de ${maxAllowed} unidades. Stock disponible: ${availableStock} unidades. Ya tienes ${currentCartQuantity} en el carrito.`);
                              }
                            }
                          }}
                          onFocus={(e) => {
                            // Seleccionar todo el texto cuando se enfoca para que se pueda reemplazar fácilmente
                            e.target.select();
                          }}
                          className="w-20 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                          autoFocus
                          placeholder="1"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            const currentValue = quantityInputs[item.id].value;
                            const availableStock = item.stock || 0;
                            const currentCartQuantity = cart[item.id] || 0;
                            const maxAllowed = availableStock - currentCartQuantity;
                            
                            if (currentValue > 0 && currentValue <= maxAllowed) {
                              addToCart(item.id, currentValue);
                              setQuantityInputs((prev) => {
                                const newState = { ...prev };
                                delete newState[item.id];
                                return newState;
                              });
                            } else if (currentValue > maxAllowed) {
                              alert(`No puedes agregar más de ${maxAllowed} unidades. Stock disponible: ${availableStock} unidades. Ya tienes ${currentCartQuantity} en el carrito.`);
                            }
                          }}
                          disabled={!quantityInputs[item.id]?.value || quantityInputs[item.id].value <= 0}
                          className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-500"
                        >
                          Agregar
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setQuantityInputs((prev) => {
                              const newState = { ...prev };
                              delete newState[item.id];
                              return newState;
                            });
                          }}
                          className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-600 transition hover:border-slate-300"
                        >
                          Cancelar
                        </button>
                      </div>
                    ) : cart[item.id] ? (
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs text-emerald-700">
                          <button
                            type="button"
                            onClick={() => decrement(item.id)}
                            className="h-5 w-5 rounded-full border border-emerald-400 text-center text-xs hover:bg-emerald-100"
                          >
                            −
                          </button>
                          <span>{cart[item.id]} en carrito</span>
                          <button
                            type="button"
                            onClick={() => addToCart(item.id)}
                            disabled={(cart[item.id] || 0) >= (item.stock || 0)}
                            className="h-5 w-5 rounded-full border border-emerald-400 text-center text-xs hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-50"
                            title={(cart[item.id] || 0) >= (item.stock || 0) ? "Stock máximo alcanzado" : "Agregar más"}
                          >
                            +
                          </button>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setQuantityInputs((prev) => ({
                              ...prev,
                              [item.id]: { show: true, value: 1 },
                            }));
                          }}
                          className="rounded-lg border border-emerald-500 bg-white px-3 py-1 text-xs font-semibold text-emerald-600 transition hover:bg-emerald-50"
                        >
                          Editar cantidad
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => {
                          if ((item.stock || 0) > 0) {
                            setQuantityInputs((prev) => ({
                              ...prev,
                              [item.id]: { show: true, value: 1 },
                            }));
                          } else {
                            alert("Este producto no tiene stock disponible.");
                          }
                        }}
                        disabled={(item.stock || 0) <= 0}
                        className="rounded-lg bg-emerald-600 px-4 py-2 text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-500"
                      >
                        {(item.stock || 0) > 0 ? "Añadir al carrito" : "Sin stock"}
                      </button>
                    )}
                  </div>
                </article>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

          <ProductModal
            product={selectedProduct}
            isOpen={isModalOpen}
            onClose={closeProductModal}
            cart={cart}
            onAddToCart={addToCart}
            onSetQuantity={setCartQuantity}
            onDecrement={decrement}
          />

        <div className="flex flex-wrap gap-3 py-4 text-sm font-semibold text-slate-600">
          <button
            type="button"
            onClick={clearCart}
            className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-slate-600 transition hover:border-emerald-500 hover:text-emerald-600 disabled:opacity-40"
            disabled={cartItems.length === 0}
          >
            Vaciar carrito
          </button>
          {cartItems.length > 0 && (
            <span className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-2 text-emerald-700">
              {cartCount} unidades listas para envío
            </span>
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
}

