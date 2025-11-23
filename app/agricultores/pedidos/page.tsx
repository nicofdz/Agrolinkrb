"use client";

import { useState, useEffect } from "react";
import { TopNav } from "../../components/top-nav";
import Footer from "../../components/footer";

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

export default function PedidosAgricultorPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [cancelOrderId, setCancelOrderId] = useState<string | null>(null);
  const [cancelReason, setCancelReason] = useState<string>("");
  const [showCancelModal, setShowCancelModal] = useState(false);

  useEffect(() => {
    loadOrders();
  }, []);

  async function loadOrders() {
    try {
      setLoading(true);
      const response = await fetch("/api/orders/agricultor");
      if (response.ok) {
        const data = await response.json();
        setOrders(data);
      }
    } catch (error) {
      console.error("Error al cargar pedidos:", error);
    } finally {
      setLoading(false);
    }
  }

  async function updateOrderStatus(orderId: string, newStatus: string, cancellationReason?: string) {
    try {
      const response = await fetch("/api/orders", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: orderId,
          status: newStatus,
          cancellation_reason: cancellationReason || null,
        }),
      });

      if (response.ok) {
        await loadOrders();
        if (newStatus === "cancelado") {
          setShowCancelModal(false);
          setCancelReason("");
          setCancelOrderId(null);
        }
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || "Error al actualizar estado");
      }
    } catch (error: any) {
      console.error("Error:", error);
      alert(error.message || "Error al actualizar el estado del pedido");
    }
  }

  function handleCancelClick(orderId: string) {
    setCancelOrderId(orderId);
    setShowCancelModal(true);
  }

  function handleCancelConfirm() {
    if (!cancelOrderId || !cancelReason.trim()) {
      alert("Por favor, ingresa el motivo de cancelación");
      return;
    }
    updateOrderStatus(cancelOrderId, "cancelado", cancelReason.trim());
  }

  function handleCancelClose() {
    setShowCancelModal(false);
    setCancelReason("");
    setCancelOrderId(null);
  }

  const filteredOrders = filterStatus === "all" 
    ? orders 
    : orders.filter((order) => order.status === filterStatus);

  const deliverySlots: Record<string, string> = {
    "martes-am": "Martes · 09:00 - 12:00",
    "martes-pm": "Martes · 14:00 - 17:00",
    "viernes-am": "Viernes · 09:00 - 12:00",
    "viernes-pm": "Viernes · 14:00 - 17:00",
  };

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900">
      <TopNav />
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-10 sm:px-8 lg:px-12">
        <header className="flex flex-col gap-2">
          <p className="text-sm font-semibold text-emerald-600">
            Panel de agricultores
          </p>
          <h1 className="text-3xl font-semibold text-slate-900">
            Pedidos recibidos
          </h1>
          <p className="text-base text-slate-600">
            Gestiona los pedidos que has recibido de tus productos.
          </p>
        </header>

        {/* Filtro de estado */}
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setFilterStatus("all")}
            className={`rounded-xl border px-4 py-2 text-sm font-semibold transition ${
              filterStatus === "all"
                ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
            }`}
          >
            Todos ({orders.length})
          </button>
          {Object.entries(statusLabels).map(([status, label]) => {
            const count = orders.filter((o) => o.status === status).length;
            return (
              <button
                key={status}
                onClick={() => setFilterStatus(status)}
                className={`rounded-xl border px-4 py-2 text-sm font-semibold transition ${
                  filterStatus === status
                    ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                    : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
                }`}
              >
                {label} ({count})
              </button>
            );
          })}
        </div>

        {loading ? (
          <p className="text-sm text-slate-500">Cargando pedidos...</p>
        ) : filteredOrders.length === 0 ? (
          <div className="rounded-3xl border border-slate-200 bg-white p-8 text-center">
            <p className="text-sm text-slate-500">
              {filterStatus === "all"
                ? "Aún no has recibido pedidos."
                : `No hay pedidos con estado "${statusLabels[filterStatus]}".`}
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {filteredOrders.map((order) => (
              <div
                key={order.id}
                className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"
              >
                <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <div className="flex items-center gap-3">
                      <h3 className="text-xl font-semibold text-slate-900">
                        Pedido #{order.id.substring(0, 8)}
                      </h3>
                      <span
                        className={`rounded-full border px-3 py-1 text-xs font-semibold ${
                          statusColors[order.status] || statusColors.pendiente
                        }`}
                      >
                        {statusLabels[order.status] || order.status}
                      </span>
                    </div>
                    <p className="mt-2 text-sm text-slate-600">
                      {new Date(order.created_at).toLocaleDateString("es-ES", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                    {order.customer_name && (
                      <p className="mt-1 text-sm text-slate-600">
                        Cliente: <span className="font-semibold">{order.customer_name}</span>
                      </p>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {order.status === "pendiente" && (
                      <button
                        onClick={() => updateOrderStatus(order.id, "confirmado")}
                        className="rounded-lg border border-emerald-300 bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-100"
                      >
                        Confirmar pedido
                      </button>
                    )}
                    {order.status === "confirmado" && (
                      <button
                        onClick={() => updateOrderStatus(order.id, "en_preparacion")}
                        className="rounded-lg border border-purple-300 bg-purple-50 px-4 py-2 text-sm font-semibold text-purple-700 transition hover:bg-purple-100"
                      >
                        En preparación
                      </button>
                    )}
                    {order.status === "en_preparacion" && (
                      <button
                        onClick={() => updateOrderStatus(order.id, "listo")}
                        className="rounded-lg border border-emerald-300 bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-100"
                      >
                        Marcar como listo
                      </button>
                    )}
                    {order.status === "listo" && (
                      <button
                        onClick={() => updateOrderStatus(order.id, "entregado")}
                        className="rounded-lg border border-slate-300 bg-slate-50 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
                      >
                        Marcar como entregado
                      </button>
                    )}
                    {order.status !== "cancelado" && order.status !== "entregado" && (
                      <button
                        onClick={() => handleCancelClick(order.id)}
                        className="rounded-lg border border-red-300 bg-red-50 px-4 py-2 text-sm font-semibold text-red-700 transition hover:bg-red-100"
                      >
                        Cancelar pedido
                      </button>
                    )}
                  </div>
                </div>

                <div className="mb-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <div className="grid gap-4 text-sm sm:grid-cols-2">
                    <div>
                      <span className="text-slate-500">Horario de entrega:</span>{" "}
                      <span className="font-semibold text-slate-900">
                        {deliverySlots[order.delivery_slot] || order.delivery_slot}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-500">Modalidad logística:</span>{" "}
                      <span className="font-semibold text-slate-900">
                        {logisticsLabels[order.logistics_option] || order.logistics_option}
                      </span>
                    </div>
                    {order.customer_email && (
                      <div>
                        <span className="text-slate-500">Email:</span>{" "}
                        <span className="font-semibold text-slate-900">
                          {order.customer_email}
                        </span>
                      </div>
                    )}
                    {order.customer_phone && (
                      <div>
                        <span className="text-slate-500">Teléfono:</span>{" "}
                        <span className="font-semibold text-slate-900">
                          {order.customer_phone}
                        </span>
                      </div>
                    )}
                  </div>
                  
                  {/* Información del punto de entrega */}
                  {order.logistics_option === "punto-encuentro" && order.delivery_points && (
                    <div className="mt-4 pt-4 border-t border-slate-300">
                      <div className="rounded-lg border-2 border-emerald-200 bg-emerald-50 p-3">
                        <p className="text-xs font-bold text-emerald-800 mb-2 flex items-center gap-1">
                          <span>📍</span>
                          <span>Punto de encuentro seleccionado:</span>
                        </p>
                        <p className="text-sm font-bold text-emerald-900">{order.delivery_points.name}</p>
                        <p className="text-xs text-emerald-700 mt-1">{order.delivery_points.address}</p>
                        <p className="text-xs text-emerald-600 mt-1">Zona: {order.delivery_points.zone}</p>
                        {order.delivery_points.latitude && order.delivery_points.longitude && (
                          <a
                            href={`https://www.google.com/maps/dir/?api=1&destination=${order.delivery_points.latitude},${order.delivery_points.longitude}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="mt-2 inline-flex items-center gap-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 px-3 py-1.5 text-xs font-bold text-white transition"
                          >
                            🗺️ Ver en Google Maps
                          </a>
                        )}
                      </div>
                    </div>
                  )}
                  
                  {order.logistics_option === "punto-encuentro" && !order.delivery_points && (
                    <div className="mt-4 pt-4 border-t border-slate-300">
                      <div className="rounded-lg border border-yellow-300 bg-yellow-50 p-3">
                        <p className="text-xs font-semibold text-yellow-800">
                          ⚠️ El cliente seleccionó punto de encuentro pero no hay información del punto registrado.
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                <div className="mb-4">
                  <h4 className="mb-3 text-sm font-semibold text-slate-700">
                    Productos ({order.total_items} unidades)
                  </h4>
                  <div className="space-y-2">
                    {order.order_items?.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center justify-between rounded-lg border border-slate-200 bg-white p-3"
                      >
                        <div>
                          <p className="text-sm font-semibold text-slate-900">
                            {item.products.name}
                          </p>
                          <p className="text-xs text-slate-500">
                            {item.products.category} · {item.products.price_range}
                          </p>
                        </div>
                        <span className="rounded-full bg-emerald-50 px-3 py-1 text-sm font-semibold text-emerald-700">
                          {item.quantity} unidades
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {order.notes && (
                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                    <p className="text-xs font-semibold text-slate-500">Notas del cliente:</p>
                    <p className="mt-1 text-sm text-slate-700">{order.notes}</p>
                  </div>
                )}

                {order.status === "cancelado" && order.cancellation_reason && (
                  <div className="rounded-xl border border-red-200 bg-red-50 p-4">
                    <p className="text-xs font-semibold text-red-700">Motivo de cancelación:</p>
                    <p className="mt-1 text-sm text-red-800">{order.cancellation_reason}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Modal de cancelación */}
        {showCancelModal && (
          <>
            <div
              className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
              onClick={handleCancelClose}
            />
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <div
                className="relative w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-xl"
                onClick={(e) => e.stopPropagation()}
              >
                <h3 className="mb-4 text-xl font-semibold text-slate-900">
                  Cancelar pedido
                </h3>
                <p className="mb-4 text-sm text-slate-600">
                  Por favor, indica el motivo de la cancelación. Esta información será visible para el cliente.
                </p>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Motivo de cancelación *
                </label>
                <textarea
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  rows={4}
                  className="mb-4 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 transition focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                  placeholder="Ej: Producto no disponible, problemas de logística, etc."
                />
                <div className="flex gap-3">
                  <button
                    onClick={handleCancelConfirm}
                    disabled={!cancelReason.trim()}
                    className="flex-1 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-500"
                  >
                    Confirmar cancelación
                  </button>
                  <button
                    onClick={handleCancelClose}
                    className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600 transition hover:border-slate-300"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
      <Footer />
    </div>
  );
}

