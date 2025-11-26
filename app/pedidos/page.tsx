"use client";

import Link from "next/link";
import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { TopNav } from "../components/top-nav";
import { useAuth } from "../components/auth-provider";
import Footer from "../components/footer";

type OrderItem = {
  id: string;
  quantity: number;
  products: {
    id: string;
    name: string;
    category: string;
    price_range: string;
    image_url?: string;
  };
};

type DeliveryPoint = {
  id: string;
  name: string;
  address: string;
  zone: string;
  latitude: number | null;
  longitude: number | null;
};

type Order = {
  id: string;
  customer_name: string | null;
  customer_email: string | null;
  customer_phone: string | null;
  delivery_slot: string;
  logistics_option: string;
  delivery_point_id: string | null;
  delivery_points: DeliveryPoint | null;
  notes: string | null;
  status: string;
  total_items: number;
  created_at: string;
  cancellation_reason?: string | null;
  order_items: OrderItem[];
};

const statusColors: Record<string, string> = {
  pendiente: "bg-yellow-100 text-yellow-800 border-yellow-200",
  confirmado: "bg-blue-100 text-blue-800 border-blue-200",
  en_preparacion: "bg-purple-100 text-purple-800 border-purple-200",
  listo: "bg-emerald-100 text-emerald-800 border-emerald-200",
  entregado: "bg-slate-100 text-slate-800 border-slate-200",
  cancelado: "bg-red-100 text-red-800 border-red-200",
};

const statusLabels: Record<string, string> = {
  pendiente: "Pendiente",
  confirmado: "Confirmado",
  en_preparacion: "En preparación",
  listo: "Listo para entregar",
  entregado: "Entregado",
  cancelado: "Cancelado",
};

const logisticsLabels: Record<string, string> = {
  "agrolink": "Entrega por Agrolink",
  "punto-encuentro": "Punto de encuentro",
  "presencial": "Entrega presencial",
};

export default function MisPedidosPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [expandedOrders, setExpandedOrders] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/auth/login?redirect=/pedidos");
    }
  }, [user, authLoading, router]);

  const loadOrders = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      if (!user?.id) {
        throw new Error("No hay usuario autenticado");
      }

      const response = await fetch(`/api/orders/mis-pedidos?user_id=${user.id}`);

      if (response.ok) {
        const data = await response.json();
        setOrders(data);
        setError(null);
        
        // Marcar pedidos cancelados como vistos cuando se carga la página
        const hasCanceledOrders = data.some((order: Order) => order.status === "cancelado");
        if (hasCanceledOrders) {
          fetch("/api/orders/mark-cancellations-viewed", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ user_id: user.id }),
          }).catch((err) => {
            console.error("Error al marcar pedidos como vistos:", err);
          });
        }
      } else {
        // Intentar obtener el mensaje de error de la respuesta
        let errorMessage = "Error al cargar pedidos";
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorMessage;
        } catch {
          errorMessage = `Error ${response.status}: ${response.statusText}`;
        }
        setError(errorMessage);
        console.error("Error al cargar pedidos:", errorMessage);
      }
    } catch (error: any) {
      const errorMessage = error.message || "Error al cargar pedidos";
      setError(errorMessage);
      console.error("Error al cargar pedidos:", error);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    if (user) {
      loadOrders();
    }
  }, [user, loadOrders]);

  // Refrescar pedidos cada 30 segundos para actualizar el badge
  useEffect(() => {
    if (user) {
      const interval = setInterval(() => {
        loadOrders();
      }, 30000); // 30 segundos

      return () => clearInterval(interval);
    }
  }, [user, loadOrders]);

  const filteredOrders =
    filterStatus === "all"
      ? orders
      : orders.filter((order) => order.status === filterStatus);

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

  function formatDate(dateString: string) {
    const date = new Date(dateString);
    return date.toLocaleDateString("es-CL", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  function formatShortDate(dateString: string) {
    const date = new Date(dateString);
    return date.toLocaleDateString("es-CL", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  }

  function toggleOrder(orderId: string) {
    setExpandedOrders((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(orderId)) {
        newSet.delete(orderId);
      } else {
        newSet.add(orderId);
      }
      return newSet;
    });
  }

  function getProductNames(order: Order): string {
    if (!order.order_items || order.order_items.length === 0) {
      return "Sin productos";
    }
    const names = order.order_items.map((item) => item.products.name);
    if (names.length === 1) {
      return names[0];
    }
    if (names.length === 2) {
      return `${names[0]} y ${names[1]}`;
    }
    return `${names[0]}, ${names[1]} y ${names.length - 2} más`;
  }

  async function handleDeleteOrder(orderId: string) {
    if (!user?.id) return;
    
    if (!confirm("¿Estás seguro de que deseas eliminar este pedido cancelado?")) {
      return;
    }

    try {
      const response = await fetch(`/api/orders?id=${orderId}&user_id=${user.id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        // Recargar pedidos
        await loadOrders();
        // Actualizar el badge en el navbar (forzar actualización)
        window.dispatchEvent(new CustomEvent("orders-updated"));
      } else {
        const error = await response.json();
        alert(error.error || "Error al eliminar el pedido");
      }
    } catch (error) {
      console.error("Error al eliminar pedido:", error);
      alert("Error al eliminar el pedido");
    }
  }

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900">
      <TopNav />
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-10 sm:px-8 lg:px-12">
        <header className="flex flex-col gap-2">
          <p className="text-sm font-semibold text-emerald-600">
            Mis pedidos
          </p>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-3xl font-semibold text-slate-900">
                Historial de pedidos
              </h1>
              <p className="text-base text-slate-600">
                Revisa el estado y detalles de todos tus pedidos realizados.
              </p>
            </div>
            <Link
              href="/catalogo"
              className="rounded-xl border border-emerald-500 bg-emerald-50 px-6 py-3 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-100"
            >
              Ver catálogo
            </Link>
          </div>
        </header>

        <section className="rounded-3xl border border-slate-200 bg-white px-6 py-8 sm:px-10">
          <div className="mb-6">
            <p className="text-xs font-semibold uppercase text-emerald-600">
              Filtros
            </p>
            <h2 className="mt-1 text-2xl font-semibold text-slate-900">
              Filtrar por estado
            </h2>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setFilterStatus("all")}
              className={`rounded-xl border px-4 py-2 text-sm font-semibold transition ${
                filterStatus === "all"
                  ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                  : "border-slate-200 bg-white text-slate-600 hover:border-emerald-500"
              }`}
            >
              Todos ({orders.length})
            </button>
            {Object.entries(statusLabels).map(([status, label]) => {
              const count = orders.filter((o) => o.status === status).length;
              return (
                <button
                  key={status}
                  type="button"
                  onClick={() => setFilterStatus(status)}
                  className={`rounded-xl border px-4 py-2 text-sm font-semibold transition ${
                    filterStatus === status
                      ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                      : "border-slate-200 bg-white text-slate-600 hover:border-emerald-500"
                  }`}
                >
                  {label} ({count})
                </button>
              );
            })}
          </div>

          {loading ? (
            <p className="mt-8 text-sm text-slate-600">Cargando pedidos...</p>
          ) : error ? (
            <div className="mt-8 rounded-3xl border border-red-200 bg-red-50 p-8 text-center">
              <p className="text-sm font-semibold text-red-800 mb-2">Error al cargar pedidos</p>
              <p className="text-sm text-red-700 mb-4">{error}</p>
              <button
                onClick={() => loadOrders()}
                className="rounded-xl border border-red-500 bg-red-100 px-6 py-3 text-sm font-semibold text-red-700 transition hover:bg-red-200"
              >
                Reintentar
              </button>
            </div>
          ) : filteredOrders.length === 0 ? (
            <div className="mt-8 rounded-3xl border border-slate-200 bg-white p-8 text-center">
              <p className="text-sm text-slate-600">
                {filterStatus === "all"
                  ? "Aún no has realizado ningún pedido."
                  : `No hay pedidos con estado "${statusLabels[filterStatus]}".`}
              </p>
              {filterStatus === "all" && (
                <Link
                  href="/catalogo"
                  className="mt-4 inline-block rounded-xl border border-emerald-500 bg-emerald-50 px-6 py-3 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-100"
                >
                  Ver catálogo
                </Link>
              )}
            </div>
          ) : (
            <div className="mt-8 space-y-3">
              {filteredOrders.map((order) => {
                const isExpanded = expandedOrders.has(order.id);
                return (
                  <div
                    key={order.id}
                    className="rounded-xl border border-slate-200 bg-white transition hover:shadow-md"
                  >
                    {/* Vista compacta - siempre visible */}
                    <div className="flex items-center gap-2 p-4">
                      <button
                        onClick={() => toggleOrder(order.id)}
                        className="flex-1 text-left transition hover:bg-slate-50 rounded-lg p-2 -m-2"
                      >
                        <div className="flex items-center justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-3">
                              <h3 className="text-base font-semibold text-slate-900">
                                Pedido #{order.id.slice(0, 8)}
                              </h3>
                              <span
                                className={`rounded-full border px-2 py-0.5 text-xs font-semibold ${
                                  statusColors[order.status] || statusColors.pendiente
                                }`}
                              >
                                {statusLabels[order.status] || order.status}
                              </span>
                            </div>
                            <p className="mt-1 text-sm text-slate-600">
                              {getProductNames(order)}
                            </p>
                            <p className="mt-1 text-xs text-slate-500">
                              {formatShortDate(order.created_at)}
                            </p>
                          </div>
                          <div className="flex-shrink-0">
                            <svg
                              className={`h-5 w-5 text-slate-400 transition-transform ${
                                isExpanded ? "rotate-180" : ""
                              }`}
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
                          </div>
                        </div>
                      </button>
                      {order.status === "cancelado" && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteOrder(order.id);
                          }}
                          className="flex-shrink-0 rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-xs font-semibold text-red-700 transition hover:bg-red-100"
                          title="Eliminar pedido cancelado"
                        >
                          Eliminar
                        </button>
                      )}
                    </div>

                    {/* Vista expandida - detalles completos */}
                    {isExpanded && (
                      <div className="border-t border-slate-200 p-6">
                        <div className="mb-6">
                          <p className="text-sm text-slate-600">
                            Realizado el {formatDate(order.created_at)}
                          </p>
                          <p className="mt-2 text-sm text-slate-600">
                            {order.total_items} producto
                            {order.total_items !== 1 ? "s" : ""} · {order.delivery_slot}
                          </p>
                          <p className="text-sm text-slate-600">
                            <span className="font-semibold">Modalidad:</span> {logisticsLabels[order.logistics_option] || order.logistics_option}
                          </p>
                          
                          {/* Punto de entrega si aplica */}
                          {order.logistics_option === "punto-encuentro" && order.delivery_points && (
                            <div className="mt-3 rounded-lg border-2 border-emerald-200 bg-emerald-50 p-3">
                              <p className="text-xs font-bold text-emerald-800 mb-1 flex items-center gap-1">
                                <span>📍</span>
                                <span>Punto de encuentro:</span>
                              </p>
                              <p className="text-sm font-bold text-emerald-900">{order.delivery_points.name}</p>
                              <p className="text-xs text-emerald-700 mt-1">{order.delivery_points.address}</p>
                              <p className="text-xs text-emerald-600">Zona: {order.delivery_points.zone}</p>
                              {order.delivery_points.latitude && order.delivery_points.longitude && (
                                <a
                                  href={`https://www.google.com/maps/dir/?api=1&destination=${order.delivery_points.latitude},${order.delivery_points.longitude}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="mt-2 inline-flex items-center gap-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 px-3 py-1.5 text-xs font-bold text-white transition"
                                >
                                  🗺️ Cómo llegar
                                </a>
                              )}
                            </div>
                          )}
                        </div>

                        <div className="mb-6">
                          <h4 className="mb-4 text-sm font-semibold text-slate-700">
                            Productos del pedido:
                          </h4>
                          <div className="space-y-4">
                            {order.order_items.map((item) => (
                              <div
                                key={item.id}
                                className="flex items-start gap-4 rounded-xl border border-slate-200 bg-slate-50 p-4"
                              >
                                {item.products.image_url ? (
                                  <div className="relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-lg">
                                    <Image
                                      src={item.products.image_url}
                                      alt={item.products.name}
                                      fill
                                      className="object-cover"
                                    />
                                  </div>
                                ) : (
                                  <div className="flex h-20 w-20 flex-shrink-0 items-center justify-center rounded-lg bg-slate-200">
                                    <svg
                                      className="h-8 w-8 text-slate-400"
                                      fill="none"
                                      stroke="currentColor"
                                      viewBox="0 0 24 24"
                                    >
                                      <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                                      />
                                    </svg>
                                  </div>
                                )}
                                <div className="flex-1">
                                  <p className="font-semibold text-slate-900">
                                    {item.products.name}
                                  </p>
                                  <p className="text-sm text-slate-600">
                                    {item.products.category}
                                  </p>
                                  <p className="text-sm text-slate-600">
                                    {item.products.price_range}
                                  </p>
                                </div>
                                <div className="text-right">
                                  <p className="text-sm font-semibold text-emerald-700">
                                    Cantidad: {item.quantity}
                                  </p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                        {order.notes && (
                          <div className="mb-6 rounded-xl border border-slate-200 bg-slate-50 p-4">
                            <p className="text-xs font-semibold uppercase text-emerald-700">
                              Notas:
                            </p>
                            <p className="mt-1 text-sm text-slate-700">{order.notes}</p>
                          </div>
                        )}

                        {order.status === "cancelado" && order.cancellation_reason && (
                          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4">
                            <p className="text-xs font-semibold uppercase text-red-700">
                              Motivo de cancelación:
                            </p>
                            <p className="mt-1 text-sm text-red-800">
                              {order.cancellation_reason}
                            </p>
                          </div>
                        )}

                        {order.status === "cancelado" && (
                          <div className="mb-6 flex justify-end">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteOrder(order.id);
                              }}
                              className="rounded-lg border border-red-300 bg-red-50 px-4 py-2 text-sm font-semibold text-red-700 transition hover:bg-red-100"
                            >
                              Eliminar pedido
                            </button>
                          </div>
                        )}

                        <div className="border-t border-slate-200 pt-4">
                          <p className="text-xs font-semibold uppercase text-emerald-700">
                            Información de contacto
                          </p>
                          <p className="mt-1 text-sm text-slate-900">
                            {order.customer_name || "No especificado"}
                          </p>
                          <p className="text-sm text-slate-600">
                            {order.customer_email || ""}
                          </p>
                          {order.customer_phone && (
                            <p className="text-sm text-slate-600">
                              {order.customer_phone}
                            </p>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>
      <Footer />
    </div>
  );
}

