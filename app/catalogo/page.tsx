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
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedLocations, setSelectedLocations] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>("");
  
  function toggleCategory(category: string) {
    setSelectedCategories(prev =>
      prev.includes(category)
        ? prev.filter(c => c !== category)
        : [...prev, category]
    );
  }

  function toggleLocation(location: string) {
    setSelectedLocations(prev =>
      prev.includes(location)
        ? prev.filter(l => l !== location)
        : [...prev, location]
    );
  }

  function clearFilters() {
    setSearchQuery("");
    setSelectedCategories([]);
    setSelectedLocations([]);
    setSelectedCategory("all");
  }
  const [selectedProduct, setSelectedProduct] = useState<CatalogItem | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [catalogItems, setCatalogItems] = useState<CatalogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [quantityInputs, setQuantityInputs] = useState<Record<string, { show: boolean; value: number }>>({});

  // El catálogo es público, no requiere login para verlo

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
    // Requerir login para agregar al carrito
    if (!user) {
      const shouldLogin = confirm("Para agregar productos al carrito necesitas iniciar sesión. ¿Deseas iniciar sesión ahora?");
      if (shouldLogin) {
        router.push(`/auth/login?redirect=/catalogo`);
      }
      return;
    }

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
    // Requerir login para modificar el carrito
    if (!user) {
      const shouldLogin = confirm("Para modificar el carrito necesitas iniciar sesión. ¿Deseas iniciar sesión ahora?");
      if (shouldLogin) {
        router.push(`/auth/login?redirect=/catalogo`);
      }
      return;
    }

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
    // Requerir login para modificar el carrito
    if (!user) {
      const shouldLogin = confirm("Para modificar el carrito necesitas iniciar sesión. ¿Deseas iniciar sesión ahora?");
      if (shouldLogin) {
        router.push(`/auth/login?redirect=/catalogo`);
      }
      return;
    }

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

  // Obtener ubicaciones únicas
  const locations = useMemo(() => {
    const locs = Array.from(new Set(catalogItems.map(item => item.location).filter(Boolean))) as string[];
    return locs.sort();
  }, [catalogItems]);

  // Obtener categorías únicas (sin "all")
  const categories = useMemo(() => {
    const cats = Array.from(new Set(catalogItems.map(item => item.category))).sort();
    return cats;
  }, [catalogItems]);

  const filteredItems = useMemo(() => {
    let filtered = catalogItems;

    // Filtrar por categorías seleccionadas
    if (selectedCategories.length > 0) {
      filtered = filtered.filter((item) => selectedCategories.includes(item.category));
    } else if (selectedCategory !== "all") {
      // Mantener compatibilidad con el filtro antiguo
      filtered = filtered.filter((item) => item.category === selectedCategory);
    }

    // Filtrar por ubicaciones seleccionadas
    if (selectedLocations.length > 0) {
      filtered = filtered.filter((item) => selectedLocations.includes(item.location || ""));
    }

    // Filtrar por búsqueda
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (item) =>
          item.name.toLowerCase().includes(query) ||
          item.category.toLowerCase().includes(query) ||
          item.sustainability.toLowerCase().includes(query) ||
          item.sellerName?.toLowerCase().includes(query)
      );
    }

    return filtered;
  }, [selectedCategory, selectedCategories, selectedLocations, catalogItems, searchQuery]);


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

  // El catálogo es público, no requiere login para verlo

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900">
      <TopNav 
        cartCount={cartCount} 
        cartHref={cartHref || undefined}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        showSearch={true}
      />
      <div className="flex w-full gap-6 px-4 py-6 sm:px-6 lg:px-8 xl:px-12 2xl:px-16">
        {/* Sidebar de filtros */}
        <aside className="hidden w-64 flex-shrink-0 lg:block">
          <div className="sticky top-24 max-h-[calc(100vh-8rem)] overflow-y-auto p-6">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-900">Filtros</h2>
              {(selectedCategories.length > 0 || selectedLocations.length > 0 || searchQuery) && (
                <button
                  onClick={clearFilters}
                  className="text-sm font-medium text-emerald-600 hover:text-emerald-700"
                >
                  Limpiar
                </button>
              )}
            </div>

            {/* Filtro por categoría */}
            {categories.length > 0 && (
              <div className="mb-6">
                <h3 className="mb-3 text-sm font-semibold text-slate-700">Categoría</h3>
                <div className="space-y-2">
                  {categories.map((category) => (
                    <label
                      key={category}
                      className="flex items-center gap-2 cursor-pointer hover:text-emerald-600 transition"
                    >
                      <input
                        type="checkbox"
                        checked={selectedCategories.includes(category)}
                        onChange={() => toggleCategory(category)}
                        className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                      />
                      <span className="text-sm text-slate-600">{category}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* Filtro por ubicación */}
            {locations.length > 0 && (
              <div>
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
          </div>
        </aside>

        {/* Contenido principal */}
        <main className="flex-1">
          {/* Breadcrumbs y título */}
          <div className="mb-6">
            <nav className="mb-2 text-sm text-slate-600">
              <Link href="/" className="hover:text-emerald-600">INICIO</Link>
              <span className="mx-2">/</span>
              <span className="text-slate-900 font-semibold">CATÁLOGO</span>
            </nav>
            <h1 className="text-3xl font-bold text-slate-900">CATÁLOGO</h1>
            <p className="mt-2 text-sm text-slate-600">
              Mostrando {filteredItems.length} de {catalogItems.length} productos
            </p>
          </div>

          {loading ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center shadow-sm">
              <p className="text-slate-600">Cargando productos...</p>
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center shadow-sm">
              <p className="text-slate-600">
                No encontramos productos. Ajusta los filtros o la búsqueda.
              </p>
              {(selectedCategories.length > 0 || selectedLocations.length > 0 || searchQuery) && (
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
              {filteredItems.map((item) => (
                <article
                  key={item.id}
                  className="group flex flex-col rounded-xl border border-slate-200 bg-white shadow-sm transition hover:border-emerald-500 hover:shadow-md"
                >
                  <button
                    onClick={() => openProductModal(item)}
                    className="flex w-full flex-col text-left"
                  >
                    <div className="relative h-52 w-full overflow-hidden rounded-t-xl bg-slate-100">
                      <Image
                        src={getProductImage(item)}
                        alt={item.name}
                        fill
                        className="object-cover transition group-hover:scale-105"
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, (max-width: 1280px) 33vw, 25vw"
                      />
                    </div>
                    <div className="flex flex-1 flex-col p-4">
                      <div className="mb-2">
                        <p className="text-xs font-semibold uppercase text-emerald-600">
                          {item.category}
                        </p>
                      </div>
                      <h3 className="mb-1 line-clamp-2 text-base font-semibold text-slate-900 group-hover:text-emerald-600">
                        {item.name}
                      </h3>
                      <p className="mb-2 line-clamp-1 text-xs text-slate-600">{item.harvestWindow}</p>
                      <div className="mb-3 flex items-center gap-2 text-sm">
                        <span className="font-semibold text-emerald-600">{item.priceRange}</span>
                        <span className="text-slate-400">•</span>
                        <span className={`text-xs font-semibold ${
                          (item.stock || 0) > 0 ? "text-emerald-600" : "text-red-600"
                        }`}>
                          {item.stock || 0} unidades
                        </span>
                      </div>
                      <div className="mt-auto flex items-center justify-between pt-2 border-t border-slate-100">
                        <span className="text-xs text-slate-500">{item.location || "Osorno"}</span>
                        <span className="text-xs font-semibold text-emerald-600">
                          {item.availability}
                        </span>
                      </div>
                    </div>
                  </button>
                  <div className="px-4 pb-4">
                    {cart[item.id] ? (
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1 rounded-lg border border-emerald-200 bg-emerald-50 px-2 py-1 text-xs text-emerald-700">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              decrement(item.id);
                            }}
                            className="h-4 w-4 rounded border border-emerald-400 text-center text-xs hover:bg-emerald-100"
                          >
                            −
                          </button>
                          <span className="text-xs">{cart[item.id]}</span>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              addToCart(item.id);
                            }}
                            disabled={(cart[item.id] || 0) >= (item.stock || 0)}
                            className="h-4 w-4 rounded border border-emerald-400 text-center text-xs hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            +
                          </button>
                        </div>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (!user) {
                              const shouldLogin = confirm("Para agregar productos al carrito necesitas iniciar sesión. ¿Deseas iniciar sesión ahora?");
                              if (shouldLogin) {
                                router.push(`/auth/login?redirect=/catalogo`);
                              }
                              return;
                            }
                            if ((item.stock || 0) > 0) {
                              setQuantityInputs((prev) => ({
                                ...prev,
                                [item.id]: { show: true, value: 1 },
                              }));
                            }
                          }}
                          className="flex-1 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-emerald-700"
                        >
                          Editar
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (!user) {
                            const shouldLogin = confirm("Para agregar productos al carrito necesitas iniciar sesión. ¿Deseas iniciar sesión ahora?");
                            if (shouldLogin) {
                              router.push(`/auth/login?redirect=/catalogo`);
                            }
                            return;
                          }
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
                        className="w-full rounded-lg bg-emerald-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-500"
                      >
                        {(item.stock || 0) > 0 ? "Añadir al carrito" : "Sin stock"}
                      </button>
                    )}
                    
                    {quantityInputs[item.id]?.show && (
                      <div className="mt-2 flex items-center gap-2">
                        <input
                          type="number"
                          min="1"
                          max={item.stock || 0}
                          value={quantityInputs[item.id].value || 1}
                          onChange={(e) => {
                            const val = parseInt(e.target.value, 10) || 1;
                            const availableStock = item.stock || 0;
                            const currentCartQuantity = cart[item.id] || 0;
                            const maxAllowed = availableStock - currentCartQuantity;
                            const limitedVal = Math.min(Math.max(1, val), maxAllowed);
                            setQuantityInputs((prev) => ({
                              ...prev,
                              [item.id]: { show: true, value: limitedVal },
                            }));
                          }}
                          onClick={(e) => e.stopPropagation()}
                          className="w-16 rounded border border-slate-300 px-2 py-1 text-xs text-slate-900 focus:border-emerald-500 focus:outline-none"
                        />
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
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
                            }
                          }}
                          className="flex-1 rounded-lg bg-emerald-600 px-2 py-1 text-xs font-semibold text-white transition hover:bg-emerald-700"
                        >
                          Agregar
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setQuantityInputs((prev) => {
                              const newState = { ...prev };
                              delete newState[item.id];
                              return newState;
                            });
                          }}
                          className="rounded border border-slate-300 px-2 py-1 text-xs text-slate-600 transition hover:bg-slate-100"
                        >
                          ✕
                        </button>
                      </div>
                    )}
                  </div>
                </article>
              ))}
            </div>
          )}

          <div className="mt-6 flex flex-wrap gap-3 text-sm font-semibold text-slate-600">
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
        </main>
      </div>

      <ProductModal
        product={selectedProduct}
        isOpen={isModalOpen}
        onClose={closeProductModal}
        cart={cart}
        onAddToCart={addToCart}
        onSetQuantity={setCartQuantity}
        onDecrement={decrement}
      />

      <Footer />
    </div>
  );
}

