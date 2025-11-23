"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useEffect, useMemo, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { TopNav } from "../components/top-nav";
import { useAuth } from "../components/auth-provider";
import Footer from "../components/footer";
import { supabase } from "../lib/supabase";
import { getCart, saveCart, setCartItem, type Cart } from "../lib/cart";
import dynamic from "next/dynamic";

// Importar el mapa dinámicamente para evitar problemas de SSR
const DeliveryPointsMap = dynamic(() => import("../components/delivery-points-map").then(mod => ({ default: mod.DeliveryPointsMap })), { ssr: false });

type CartItem = {
  id: string;
  name: string;
  category: string;
  priceRange: string;
  image_url?: string;
  quantity: number;
};

const deliverySlots = [
  { id: "martes-am", label: "Martes · 09:00 - 12:00" },
  { id: "martes-pm", label: "Martes · 14:00 - 17:00" },
  { id: "viernes-am", label: "Viernes · 09:00 - 12:00" },
  { id: "viernes-pm", label: "Viernes · 14:00 - 17:00" },
];

type LogisticsOption = {
  id: string;
  label: string;
  description: string;
  deliveredBy: string;
};

const logisticsOptions: LogisticsOption[] = [
  {
    id: "agrolink",
    label: "Entrega por Agrolink",
    description: "Agrolink se encarga de la entrega",
    deliveredBy: "Agrolink",
  },
  {
    id: "punto-encuentro",
    label: "Punto de encuentro",
    description: "Reúnete en un punto específico",
    deliveredBy: "Agricultor",
  },
  {
    id: "presencial",
    label: "Entrega presencial",
    description: "El agricultor entrega directamente",
    deliveredBy: "Agricultor",
  },
];

type DeliveryPoint = {
  id: string;
  name: string;
  address: string;
  zone: string;
  farmer_id: string;
  latitude: number | null;
  longitude: number | null;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
};

function getProductImage(product: any): string {
  if (product.image_url) {
    return product.image_url;
  }
  const nameLower = product.name.toLowerCase();
  if (nameLower.includes("espinaca")) return "/espinaca-baby.jpg";
  if (nameLower.includes("betarraga")) return "/betarraga.jpg";
  if (nameLower.includes("huevo")) return "/huevos-azules.jpg";
  if (nameLower.includes("tomate")) return "/TOMATE.jpg";
  if (nameLower.includes("zapallo")) return "/ZAPALLO.jpg";
  return "/next.svg";
}

function CarritoContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, loading: authLoading } = useAuth();
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [step, setStep] = useState(1);
  const [slot, setSlot] = useState("martes-am");
  const [logistics, setLogistics] = useState("agrolink");
  const [selectedDeliveryPoint, setSelectedDeliveryPoint] = useState<string>("");
  const [deliveryPoints, setDeliveryPoints] = useState<DeliveryPoint[]>([]);
  const [loadingDeliveryPoints, setLoadingDeliveryPoints] = useState(false);
  const [productZones, setProductZones] = useState<string[]>([]);
  const [notes, setNotes] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/auth/login?redirect=/carrito");
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user) {
      loadCartItems();
      // Pre-llenar nombre y email del usuario
      if (user.user_metadata?.name) {
        setCustomerName(user.user_metadata.name);
      }
      if (user.email) {
        setCustomerEmail(user.email);
      }
      // Pre-llenar teléfono si ya está guardado
      if (user.user_metadata?.phone) {
        setCustomerPhone(user.user_metadata.phone);
      }
    }
  }, [user, searchParams]);

  // Sincronizar carrito con localStorage cuando cambia
  useEffect(() => {
    const cart = getCart();
    const itemsParam = searchParams.get("items");
    
    // Si hay items en la URL, actualizar localStorage
    if (itemsParam) {
      const items = itemsParam.split(",").reduce((acc, item) => {
        const [id, qty] = item.split(":");
        acc[id] = parseInt(qty, 10);
        return acc;
      }, {} as Record<string, number>);
      saveCart(items);
    }
  }, [searchParams]);

  async function loadCartItems() {
    try {
      setLoading(true);
      
      // Primero intentar desde localStorage
      const cart = getCart();
      const items = Object.entries(cart).map(([id, qty]) => ({
        id,
        quantity: qty,
      }));

      // Si no hay items en localStorage, intentar desde URL
      if (items.length === 0) {
        const itemsParam = searchParams.get("items");
        if (itemsParam) {
          const urlItems = itemsParam.split(",").map((item) => {
            const [id, qty] = item.split(":");
            return { id, quantity: parseInt(qty, 10) };
          });
          items.push(...urlItems);
        }
      }

      if (items.length === 0) {
        setCartItems([]);
        return;
      }

      // Obtener información de los productos
      const response = await fetch("/api/products");
      if (response.ok) {
        const products = await response.json();
        const cartItemsData: CartItem[] = items
          .map((item) => {
            const product = products.find((p: any) => p.id === item.id);
            if (!product) return null;
            const cartItem: CartItem = {
              id: product.id,
              name: product.name,
              category: product.category,
              priceRange: product.price_range,
              quantity: item.quantity,
            };
            if (product.image_url) {
              cartItem.image_url = product.image_url;
            }
            return cartItem;
          })
          .filter((item): item is CartItem => item !== null);
        setCartItems(cartItemsData);

        // Obtener zonas únicas de los productos
        const zones = [...new Set(products
          .filter((p: any) => items.some((item) => item.id === p.id))
          .map((p: any) => p.location)
          .filter((zone: string) => zone))] as string[];
        setProductZones(zones);

        // Cargar puntos de entrega para las zonas de los productos
        if (zones.length > 0) {
          loadDeliveryPoints(zones);
        }
      }
    } catch (error) {
      console.error("Error al cargar productos del carrito:", error);
    } finally {
      setLoading(false);
    }
  }

  async function loadDeliveryPoints(zones: string[]) {
    try {
      setLoadingDeliveryPoints(true);
      // Cargar puntos de entrega para todas las zonas
      const allPoints: DeliveryPoint[] = [];
      for (const zone of zones) {
        const response = await fetch(`/api/delivery-points?zone=${encodeURIComponent(zone)}&active_only=true`);
        if (response.ok) {
          const points = await response.json();
          allPoints.push(...points);
        }
      }
      setDeliveryPoints(allPoints);
    } catch (error) {
      console.error("Error al cargar puntos de entrega:", error);
    } finally {
      setLoadingDeliveryPoints(false);
    }
  }

  // Resetear punto seleccionado cuando cambia la opción logística
  useEffect(() => {
    if (logistics !== "punto-encuentro") {
      setSelectedDeliveryPoint("");
    }
  }, [logistics]);

  function updateQuantity(id: string, delta: number) {
    setCartItems((prev) => {
      const item = prev.find((i) => i.id === id);
      if (!item) return prev;
      
      const newQuantity = item.quantity + delta;
      if (newQuantity <= 0) {
        const updated = prev.filter((i) => i.id !== id);
        // Actualizar localStorage
        const cart = getCart();
        delete cart[id];
        saveCart(cart);
        // Disparar evento después del render
        setTimeout(() => {
          window.dispatchEvent(new CustomEvent("cart-updated"));
        }, 0);
        return updated;
      }
      
      const updated = prev.map((i) =>
        i.id === id ? { ...i, quantity: newQuantity } : i
      );
      // Actualizar localStorage
      setCartItem(id, newQuantity);
      // Disparar evento después del render
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent("cart-updated"));
      }, 0);
      return updated;
    });
  }

  function removeItem(id: string) {
    setCartItems((prev) => {
      const updated = prev.filter((i) => i.id !== id);
      // Actualizar localStorage
      const cart = getCart();
      delete cart[id];
      saveCart(cart);
      // Disparar evento después del render
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent("cart-updated"));
      }, 0);
      return updated;
    });
  }

  async function handleSubmit() {
    if (!user) return;

    try {
      setSubmitting(true);

      // Solo preguntar si quiere guardar el teléfono si:
      // 1. Hay un teléfono ingresado
      // 2. El teléfono es diferente al que ya tiene guardado
      // 3. El teléfono no está guardado aún
      const savedPhone = user.user_metadata?.phone;
      const phoneChanged = customerPhone && customerPhone !== savedPhone;
      const phoneNotSaved = customerPhone && !savedPhone;

      let shouldSavePhone = false;
      if (phoneChanged || phoneNotSaved) {
        shouldSavePhone = window.confirm(
          "¿Deseas guardar este número de teléfono para futuros pedidos?"
        );
      }

      // Si el usuario quiere guardar el teléfono, actualizar user_metadata
      if (shouldSavePhone && customerPhone) {
        const { error: updateError } = await supabase.auth.updateUser({
          data: {
            ...user.user_metadata,
            phone: customerPhone,
          },
        });

        if (updateError) {
          console.error("Error al guardar teléfono:", updateError);
          // Continuar con el pedido aunque falle el guardado del teléfono
        } else {
          // Refrescar la sesión para que los cambios se reflejen
          await supabase.auth.refreshSession();
        }
      }

      const orderItems = cartItems.map((item) => ({
        product_id: item.id,
        quantity: item.quantity,
      }));

      // Obtener el label de la opción logística seleccionada
      const selectedLogisticsOption = logisticsOptions.find(opt => opt.id === logistics);
      const logisticsLabel = selectedLogisticsOption?.label || logistics;

      const response = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customer_name: customerName,
          customer_email: customerEmail,
          customer_phone: customerPhone,
          delivery_slot: slot,
          logistics_option: logisticsLabel,
          delivery_point_id: logistics === "punto-encuentro" ? selectedDeliveryPoint : null,
          notes: notes || null,
          items: orderItems,
          user_id: user.id,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        // Limpiar el carrito después de crear el pedido
        setCartItems([]);
        // Limpiar localStorage también
        const { clearCart } = await import("../lib/cart");
        clearCart();
        // Disparar evento después del render
        setTimeout(() => {
          window.dispatchEvent(new CustomEvent("cart-updated"));
        }, 0);
        router.push("/pedidos");
      } else {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.error || "Error al crear pedido";
        throw new Error(errorMessage);
      }
    } catch (error) {
      console.error("Error:", error);
      alert("Error al crear el pedido. Por favor, intenta nuevamente.");
    } finally {
      setSubmitting(false);
    }
  }

  const totalItems = cartItems.reduce((sum, item) => sum + item.quantity, 0);
  const canContinue = cartItems.length > 0;

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-black text-white">
        <TopNav />
        <div className="flex min-h-screen items-center justify-center">
          <p className="text-emerald-100">Cargando...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  if (cartItems.length === 0 && !loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-black text-white">
        <TopNav />
        <div className="mx-auto flex w-full max-w-5xl flex-col gap-8 px-4 py-10 sm:px-8">
          <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-8 text-center">
            <p className="text-lg font-semibold text-white mb-4">
              Tu carrito está vacío
            </p>
            <Link
              href="/catalogo"
              className="inline-block rounded-xl border border-emerald-500 bg-emerald-900/30 px-6 py-3 text-sm font-semibold text-emerald-300 transition hover:bg-emerald-900/50"
            >
              Ir al catálogo
            </Link>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900">
      <TopNav />
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-3 py-6 sm:px-6 sm:py-10 lg:gap-8">
        <header className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-6 shadow-sm">
          <p className="text-xs sm:text-sm font-semibold text-emerald-600">
            Carrito de compras
          </p>
          <h1 className="mt-2 text-2xl sm:text-3xl font-semibold text-slate-900">
            Completa tu pedido
          </h1>
          <p className="mt-2 text-sm sm:text-base text-slate-700">
            Revisa tus productos y completa la información para realizar el pedido.
          </p>
        </header>

        <nav className="grid gap-3 sm:gap-4 rounded-2xl border border-slate-200 bg-white p-4 sm:p-6 grid-cols-3 shadow-sm">
          {[
            { id: 1, title: "Productos" },
            { id: 2, title: "Logística" },
            { id: 3, title: "Confirmación" },
          ].map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setStep(item.id)}
              className={`rounded-xl border px-3 py-2.5 sm:px-4 sm:py-3 text-left text-xs sm:text-sm font-semibold transition ${
                step === item.id
                  ? "border-emerald-500 bg-emerald-50 text-emerald-700 shadow-md"
                  : "border-slate-200 bg-slate-50 text-slate-600 hover:border-emerald-500/50 hover:bg-emerald-50/50"
              }`}
            >
              <span className="block text-[10px] sm:text-xs font-medium text-emerald-600 mb-0.5">
                Paso {item.id}
              </span>
              <span className="block truncate">{item.title}</span>
            </button>
          ))}
        </nav>

        {step === 1 && (
          <section className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-6 shadow-sm">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between mb-6">
              <div>
                <h2 className="text-lg sm:text-xl font-semibold text-slate-900">
                  Productos en el carrito
                </h2>
                <p className="text-xs sm:text-sm text-slate-600 mt-1">
                  {totalItems} producto{totalItems !== 1 ? "s" : ""}
                </p>
              </div>
            </div>
            <div className="space-y-3 sm:space-y-4">
              {cartItems.map((item) => (
                <div
                  key={item.id}
                  className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3 sm:p-4 hover:border-emerald-500/50 hover:shadow-md transition-all"
                >
                  <div className="flex gap-3 sm:gap-4">
                    <div className="relative h-20 w-20 sm:h-24 sm:w-24 flex-shrink-0 overflow-hidden rounded-lg bg-slate-200 ring-1 ring-slate-300">
                      <Image
                        src={getProductImage(item)}
                        alt={item.name}
                        fill
                        className="object-cover"
                        sizes="(max-width: 640px) 80px, 96px"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-base sm:text-lg font-semibold text-slate-900 truncate">
                        {item.name}
                      </h3>
                      <p className="text-xs sm:text-sm text-slate-600 mt-0.5">{item.category}</p>
                      <p className="text-xs sm:text-sm text-emerald-600 mt-0.5 font-medium">{item.priceRange}</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between gap-3 pt-3 border-t border-slate-200">
                    <div className="flex items-center gap-2 sm:gap-3">
                      <button
                        type="button"
                        onClick={() => updateQuantity(item.id, -1)}
                        className="h-8 w-8 sm:h-9 sm:w-9 rounded-full border border-slate-300 bg-white text-base sm:text-lg text-slate-700 hover:bg-slate-100 hover:border-emerald-500/50 transition-all"
                      >
                        −
                      </button>
                      <span className="w-8 sm:w-10 text-center text-sm sm:text-base font-bold text-slate-900">
                        {item.quantity}
                      </span>
                      <button
                        type="button"
                        onClick={() => updateQuantity(item.id, 1)}
                        className="h-8 w-8 sm:h-9 sm:w-9 rounded-full border border-emerald-500 bg-emerald-50 text-base sm:text-lg text-emerald-600 hover:bg-emerald-100 transition-all"
                      >
                        +
                      </button>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeItem(item.id)}
                      className="rounded-lg border border-red-300 bg-red-50 px-3 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm font-semibold text-red-600 transition hover:bg-red-100 hover:border-red-400"
                    >
                      Eliminar
                    </button>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-6 flex flex-col sm:flex-row gap-3">
              <button
                type="button"
                disabled={!canContinue}
                onClick={() => setStep(2)}
                className="rounded-lg bg-emerald-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700 shadow-md hover:shadow-lg disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-500 disabled:shadow-none"
              >
                Continuar con logística →
              </button>
              <Link
                href="/catalogo"
                className="rounded-lg border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 hover:border-emerald-500 hover:bg-emerald-50 transition-all text-center"
              >
                ← Seguir comprando
              </Link>
            </div>
          </section>
        )}

        {step === 2 && (
          <section className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-6 shadow-sm">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between mb-6">
              <div>
                <h2 className="text-lg sm:text-xl font-semibold text-slate-900">
                  Agenda de entrega
                </h2>
                <p className="text-xs sm:text-sm text-slate-600 mt-1">
                  Define horario y modalidad de entrega.
                </p>
              </div>
            </div>
            <div className="grid gap-5 sm:gap-6 lg:grid-cols-2">
              <div>
                <p className="text-xs sm:text-sm font-semibold text-slate-700 mb-3">📅 Horarios</p>
                <div className="space-y-2">
                  {deliverySlots.map((option) => (
                    <label
                      key={option.id}
                      className={`flex items-center gap-3 rounded-xl border px-3 py-3 sm:px-4 text-xs sm:text-sm cursor-pointer transition-all ${
                        slot === option.id 
                          ? 'border-emerald-500 bg-emerald-50 text-emerald-700 shadow-md' 
                          : 'border-slate-200 bg-slate-50 text-slate-700 hover:border-emerald-500/50 hover:bg-emerald-50/50'
                      }`}
                    >
                      <input
                        type="radio"
                        name="slot"
                        value={option.id}
                        checked={slot === option.id}
                        onChange={() => setSlot(option.id)}
                        className="h-4 w-4 accent-emerald-600 cursor-pointer"
                      />
                      <span className="flex-1 font-medium">{option.label}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-xs sm:text-sm font-semibold text-slate-700 mb-3">
                  🚚 Modalidad logística
                </p>
                <div className="space-y-2">
                  {logisticsOptions.map((option) => (
                    <label
                      key={option.id}
                      className={`flex flex-col gap-2 rounded-xl border px-3 py-3 sm:px-4 cursor-pointer transition-all ${
                        logistics === option.id 
                          ? 'border-emerald-500 bg-emerald-50 shadow-md' 
                          : 'border-slate-200 bg-slate-50 hover:border-emerald-500/50 hover:bg-emerald-50/50'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <input
                          type="radio"
                          name="logistics"
                          value={option.id}
                          checked={logistics === option.id}
                          onChange={() => setLogistics(option.id)}
                          className="h-4 w-4 accent-emerald-600 cursor-pointer flex-shrink-0"
                        />
                        <span className={`font-semibold text-sm sm:text-base ${logistics === option.id ? 'text-emerald-700' : 'text-slate-900'}`}>{option.label}</span>
                      </div>
                      <div className="ml-7 text-xs sm:text-sm space-y-1">
                        <p className="text-slate-600">{option.description}</p>
                        <p className="text-slate-700">
                          <span className="font-semibold">Entrega:</span> {option.deliveredBy}
                        </p>
                      </div>
                    </label>
                  ))}
                </div>
                
                {/* Selector de punto de encuentro */}
                {logistics === "punto-encuentro" && (
                  <div className="mt-4 space-y-4">
                    <p className="text-xs sm:text-sm font-semibold text-slate-700 mb-3">
                      📍 Selecciona un punto de encuentro
                    </p>
                    {loadingDeliveryPoints ? (
                      <div className="rounded-xl border border-blue-300 bg-blue-50 px-4 py-3">
                        <p className="text-sm text-blue-700 flex items-center gap-2">
                          <span className="animate-pulse">⏳</span>
                          Cargando puntos de entrega...
                        </p>
                      </div>
                    ) : deliveryPoints.length === 0 ? (
                      <div className="rounded-xl border border-yellow-300 bg-yellow-50 px-3 py-3 sm:px-4">
                        <p className="text-xs sm:text-sm text-yellow-800 font-semibold">⚠️ No hay puntos de entrega disponibles</p>
                        <p className="mt-1 text-xs text-yellow-700">
                          Zonas: {productZones.join(", ") || "No especificadas"}
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-2 max-h-64 sm:max-h-80 overflow-y-auto pr-2 custom-scrollbar">
                        {deliveryPoints.map((point) => (
                          <label
                            key={point.id}
                            className={`flex items-start gap-3 rounded-xl border px-3 py-3 sm:px-4 cursor-pointer transition-all ${
                              selectedDeliveryPoint === point.id
                                ? 'border-emerald-500 bg-emerald-50 shadow-md'
                                : 'border-slate-200 bg-slate-50 hover:border-emerald-500/50 hover:bg-emerald-50/50'
                            }`}
                          >
                            <input
                              type="radio"
                              name="delivery_point"
                              value={point.id}
                              checked={selectedDeliveryPoint === point.id}
                              onChange={() => setSelectedDeliveryPoint(point.id)}
                              className="h-4 w-4 accent-emerald-600 mt-1 cursor-pointer flex-shrink-0"
                            />
                            <div className="flex-1 min-w-0">
                              <p className={`font-semibold text-sm sm:text-base ${selectedDeliveryPoint === point.id ? 'text-emerald-700' : 'text-slate-900'}`}>{point.name}</p>
                              <p className="text-xs sm:text-sm text-slate-600 mt-1">{point.address}</p>
                              <p className="text-xs text-slate-500 mt-1">📌 {point.zone}</p>
                            </div>
                          </label>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
            
            {/* Mapa del punto de entrega seleccionado - Ancho completo */}
            {logistics === "punto-encuentro" && selectedDeliveryPoint && (() => {
              const selectedPoint = deliveryPoints.find(p => p.id === selectedDeliveryPoint);
              return selectedPoint && selectedPoint.latitude && selectedPoint.longitude ? (
                <div className="mt-6 rounded-xl border border-emerald-300 bg-emerald-50/50 p-3 sm:p-4 shadow-sm">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
                    <p className="text-xs sm:text-sm font-bold text-emerald-700">
                      📍 Ubicación del punto de entrega
                    </p>
                    <a
                      href={`https://www.google.com/maps/dir/?api=1&destination=${selectedPoint.latitude},${selectedPoint.longitude}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full sm:w-auto rounded-lg bg-blue-600 hover:bg-blue-700 px-4 py-2 text-xs sm:text-sm font-bold text-white transition flex items-center justify-center gap-2 shadow-md hover:shadow-lg"
                    >
                      🗺️ Abrir en Google Maps
                    </a>
                  </div>
                  <div className="rounded-lg overflow-hidden border-2 border-slate-300 shadow-lg" style={{ height: "350px", width: "100%" }}>
                    <DeliveryPointsMap
                      deliveryPoints={[selectedPoint]}
                      editable={false}
                      center={[selectedPoint.latitude, selectedPoint.longitude]}
                      zoom={16}
                    />
                  </div>
                  <div className="mt-3 bg-emerald-100 border border-emerald-300 rounded-lg p-3">
                    <p className="text-sm font-bold text-emerald-800">{selectedPoint.name}</p>
                    <p className="text-xs text-emerald-700 mt-1 break-words">{selectedPoint.address}</p>
                    <p className="text-xs text-emerald-600 mt-1">📌 Zona: {selectedPoint.zone}</p>
                  </div>
                </div>
              ) : selectedPoint ? (
                <div className="mt-6 rounded-xl border border-yellow-300 bg-yellow-50 px-3 py-3 sm:px-4 text-sm">
                  <p className="font-semibold text-yellow-800">⚠️ Ubicación no disponible</p>
                  <p className="text-xs mt-1 text-yellow-700">Este punto de entrega no tiene coordenadas registradas.</p>
                </div>
              ) : null;
            })()}
            <div className="mt-6">
              <label className="text-sm font-semibold text-slate-700">
                📝 Notas para los productores
                <textarea
                  value={notes}
                  onChange={(event) => setNotes(event.target.value)}
                  rows={4}
                  className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/30 transition"
                  placeholder="Ej: separar 2 cajas para menú ejecutivo, avisar si hay cambios en calibres."
                />
              </label>
            </div>
            <div className="mt-6 flex flex-col sm:flex-row gap-3">
              <button
                type="button"
                onClick={() => {
                  // Validar que si se seleccionó "punto-encuentro", se debe haber elegido un punto
                  if (logistics === "punto-encuentro" && !selectedDeliveryPoint) {
                    alert("Por favor selecciona un punto de encuentro antes de continuar.");
                    return;
                  }
                  setStep(3);
                }}
                disabled={logistics === "punto-encuentro" && !selectedDeliveryPoint}
                className="rounded-lg bg-emerald-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700 shadow-md hover:shadow-lg disabled:bg-slate-300 disabled:text-slate-500 disabled:cursor-not-allowed disabled:shadow-none"
              >
                Revisar pedido →
              </button>
              <button
                type="button"
                onClick={() => setStep(1)}
                className="rounded-lg border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 hover:border-emerald-500 hover:bg-emerald-50 transition-all"
              >
                ← Volver a productos
              </button>
            </div>
            {logistics === "punto-encuentro" && !selectedDeliveryPoint && (
              <div className="mt-3 rounded-lg border border-yellow-300 bg-yellow-50 px-3 py-2">
                <p className="text-xs sm:text-sm text-yellow-800 font-semibold">
                  ⚠️ Debes seleccionar un punto de encuentro para continuar
                </p>
              </div>
            )}
          </section>
        )}

        {step === 3 && (
          <section className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-6 shadow-sm">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between mb-6">
              <div>
                <h2 className="text-lg sm:text-xl font-semibold text-slate-900">
                  Revisión y envío
                </h2>
                <p className="text-xs sm:text-sm text-slate-600 mt-1">
                  Completa tu información y envía el pedido.
                </p>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <div>
                <label className="mb-2 block text-xs sm:text-sm font-semibold text-slate-700">
                  👤 Nombre completo *
                </label>
                <input
                  type="text"
                  value={customerName}
                  onChange={(event) => setCustomerName(event.target.value)}
                  required
                  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 sm:px-4 sm:py-3 text-sm text-slate-900 placeholder:text-slate-400 transition focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                  placeholder="Tu nombre completo"
                />
              </div>
              <div>
                <label className="mb-2 block text-xs sm:text-sm font-semibold text-slate-700">
                  ✉️ Email *
                </label>
                <input
                  type="email"
                  value={customerEmail}
                  onChange={(event) => setCustomerEmail(event.target.value)}
                  required
                  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 sm:px-4 sm:py-3 text-sm text-slate-900 placeholder:text-slate-400 transition focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                  placeholder="tu@email.com"
                />
              </div>
              <div className="sm:col-span-2 lg:col-span-1">
                <label className="mb-2 block text-xs sm:text-sm font-semibold text-slate-700">
                  📱 Teléfono *
                </label>
                <input
                  type="tel"
                  value={customerPhone}
                  onChange={(event) => setCustomerPhone(event.target.value)}
                  required
                  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 sm:px-4 sm:py-3 text-sm text-slate-900 placeholder:text-slate-400 transition focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                  placeholder="+56 9 1234 5678"
                />
              </div>
            </div>

            <div className="mt-6 space-y-3">
              <h3 className="text-xs sm:text-sm font-semibold text-slate-700">🛒 Resumen del pedido</h3>
              {cartItems.map((item) => (
                <div
                  key={`${item.id}-summary`}
                  className="flex flex-col gap-2 rounded-xl border border-slate-200 bg-slate-50 p-3 sm:p-4 sm:flex-row sm:items-center sm:justify-between hover:border-emerald-500/50 hover:shadow-md transition-all"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-900 truncate">
                      {item.name}
                    </p>
                    <p className="text-xs text-slate-600 mt-0.5">{item.category}</p>
                  </div>
                  <p className="text-sm font-bold text-emerald-600 whitespace-nowrap">
                    ✕ {item.quantity} unidades
                  </p>
                </div>
              ))}
            </div>
            <div className="mt-6 rounded-xl border border-emerald-300 bg-emerald-50 p-4 shadow-sm">
              <p className="font-bold text-emerald-800 mb-3 flex items-center gap-2">
                <span>📦</span>
                <span>Detalles de entrega</span>
              </p>
              <div className="space-y-2 text-xs sm:text-sm">
                <p className="flex flex-col sm:flex-row sm:items-center gap-1">
                  <span className="text-emerald-700">📅 Horario:</span>
                  <span className="font-semibold text-slate-900">{deliverySlots.find((s) => s.id === slot)?.label}</span>
                </p>
                <p className="flex flex-col sm:flex-row sm:items-center gap-1">
                  <span className="text-emerald-700">🚚 Modalidad:</span>
                  <span className="font-semibold text-emerald-700">
                    {logisticsOptions.find(opt => opt.id === logistics)?.label || logistics}
                  </span>
                </p>
                <p className="flex flex-col sm:flex-row sm:items-center gap-1">
                  <span className="text-emerald-700">👤 Entrega:</span>
                  <span className="font-semibold text-emerald-700">
                    {logisticsOptions.find(opt => opt.id === logistics)?.deliveredBy || "No especificado"}
                  </span>
                </p>
                {logistics === "punto-encuentro" && selectedDeliveryPoint && (
                  <p className="flex flex-col sm:flex-row sm:items-center gap-1">
                    <span className="text-emerald-700">📍 Punto:</span>
                    <span className="font-semibold text-emerald-700">
                      {deliveryPoints.find(p => p.id === selectedDeliveryPoint)?.name || "No seleccionado"}
                    </span>
                  </p>
                )}
              </div>
            </div>
            <div className="mt-6 flex flex-col sm:flex-row gap-3">
              <button
                type="button"
                onClick={handleSubmit}
                disabled={
                  submitting || 
                  !customerName || 
                  !customerEmail || 
                  !customerPhone ||
                  (logistics === "punto-encuentro" && !selectedDeliveryPoint)
                }
                className="flex-1 rounded-lg bg-emerald-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700 shadow-md hover:shadow-lg disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-500 disabled:shadow-none"
              >
                {submitting ? "⏳ Enviando..." : "✅ Confirmar y enviar pedido"}
              </button>
              <button
                type="button"
                onClick={() => setStep(2)}
                disabled={submitting}
                className="rounded-lg border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 hover:border-emerald-500 hover:bg-emerald-50 transition-all disabled:opacity-50"
              >
                ← Editar logística
              </button>
            </div>
          </section>
        )}
      </div>
      <Footer />
    </div>
  );
}

export default function CarritoPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-slate-100 flex items-center justify-center">
        <p className="text-slate-600">Cargando...</p>
      </div>
    }>
      <CarritoContent />
    </Suspense>
  );
}

