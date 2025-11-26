"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { TopNav } from "../../components/top-nav";
import { useAuth } from "../../components/auth-provider";
import Footer from "../../components/footer";
import { supabase } from "../../lib/supabase";
import { DeliveryPointsMap } from "../../components/delivery-points-map";

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
  created_at: string;
};

type Order = {
  id: string;
  customer_name: string | null;
  status: string;
  total_items: number;
  created_at: string;
  order_items: Array<{
    quantity: number;
    products: {
      name: string;
    };
  }>;
};

type DeliveryPoint = {
  id: string;
  name: string;
  address: string;
  zone: string;
  latitude: number | null;
  longitude: number | null;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
  farmer_id?: string;
};

export default function PerfilAgricultorPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [profile, setProfile] = useState<FarmerProfile | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [deliveryPoints, setDeliveryPoints] = useState<DeliveryPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showDeliveryPoints, setShowDeliveryPoints] = useState(false);
  const [editingDeliveryPoint, setEditingDeliveryPoint] = useState<DeliveryPoint | null>(null);
  const [deliveryPointForm, setDeliveryPointForm] = useState({
    name: "",
    address: "",
    zone: "Osorno",
    latitude: null as number | null,
    longitude: null as number | null,
    is_active: true,
  });
  const [showMap, setShowMap] = useState(false);
  const [mapMode, setMapMode] = useState<"view" | "add" | "edit">("view");
  const [geocodingAddress, setGeocodingAddress] = useState(false);
  const geocodeTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Formulario de perfil
  const [formData, setFormData] = useState({
    bio: "",
    location: "",
    phone: "",
    website: "",
    certifications: [] as string[],
    specialties: [] as string[],
    certificationInput: "",
    specialtyInput: "",
  });

  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        router.push("/auth/login?redirect=/agricultores/perfil");
      } else if (user.user_metadata?.user_type !== "agricultor") {
        alert("Esta sección es solo para agricultores.");
        router.push("/catalogo");
      } else {
        loadData();
      }
    }
  }, [user, authLoading, router]);

  async function loadData() {
    if (!user?.id) return;

    try {
      setLoading(true);
      await Promise.all([
        loadProfile(),
        loadProducts(),
        loadOrders(),
        loadDeliveryPoints(),
      ]);
    } catch (error) {
      console.error("Error al cargar datos:", error);
    } finally {
      setLoading(false);
    }
  }

  async function loadProfile() {
    if (!user?.id) return;

    try {
      const response = await fetch(`/api/farmer-profile?user_id=${user.id}`);
      if (response.ok) {
        const data = await response.json();
        if (data) {
          setProfile(data);
          setFormData({
            bio: data.bio || "",
            location: data.location || "",
            phone: data.phone || "",
            website: data.website || "",
            certifications: data.certifications || [],
            specialties: data.specialties || [],
            certificationInput: "",
            specialtyInput: "",
          });
        }
      }
    } catch (error) {
      console.error("Error al cargar perfil:", error);
    }
  }

  async function loadProducts() {
    if (!user?.id) return;

    try {
      const response = await fetch(`/api/products?user_id=${user.id}`);
      if (response.ok) {
        const data = await response.json();
        setProducts(data || []);
      }
    } catch (error) {
      console.error("Error al cargar productos:", error);
    }
  }

  async function loadDeliveryPoints() {
    if (!user?.id) return;
    try {
      const response = await fetch(`/api/delivery-points?farmer_id=${user.id}`);
      if (response.ok) {
        const data = await response.json();
        setDeliveryPoints(data);
      }
    } catch (error) {
      console.error("Error al cargar puntos de entrega:", error);
    }
  }

  async function loadOrders() {
    if (!user?.id) return;

    try {
      // Obtener todos los pedidos
      const response = await fetch("/api/orders/agricultor");
      if (response.ok) {
        const allOrders = await response.json();
        
        // Obtener IDs de productos del agricultor
        const productResponse = await fetch(`/api/products?user_id=${user.id}`);
        if (productResponse.ok) {
          const farmerProducts = await productResponse.json();
          const farmerProductIds = new Set(farmerProducts.map((p: Product) => p.id));
          
          // Filtrar pedidos que contienen productos del agricultor
          const farmerOrders = allOrders.filter((order: any) => {
            return order.order_items?.some((item: any) => {
              return farmerProductIds.has(item.product_id);
            });
          });
          
          setOrders(farmerOrders || []);
        } else {
          setOrders(allOrders || []);
        }
      }
    } catch (error) {
      console.error("Error al cargar pedidos:", error);
    }
  }

  async function handleSaveProfile(e: React.FormEvent) {
    e.preventDefault();
    if (!user?.id) return;

    try {
      const response = await fetch("/api/farmer-profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: user.id,
          bio: formData.bio || null,
          location: formData.location || null,
          phone: formData.phone || null,
          website: formData.website || null,
          certifications: formData.certifications,
          specialties: formData.specialties,
        }),
      });

      if (response.ok) {
        await loadProfile();
        setEditing(false);
        setShowSuccess(true);
        setTimeout(() => setShowSuccess(false), 3000);
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || "Error al guardar perfil");
      }
    } catch (error: any) {
      console.error("Error:", error);
      alert(error.message || "Error al guardar el perfil. Por favor, intenta nuevamente.");
    }
  }

  function addCertification() {
    if (formData.certificationInput.trim()) {
      setFormData((prev) => ({
        ...prev,
        certifications: [...prev.certifications, prev.certificationInput.trim()],
        certificationInput: "",
      }));
    }
  }

  function removeCertification(index: number) {
    setFormData((prev) => ({
      ...prev,
      certifications: prev.certifications.filter((_, i) => i !== index),
    }));
  }

  function addSpecialty() {
    if (formData.specialtyInput.trim()) {
      setFormData((prev) => ({
        ...prev,
        specialties: [...prev.specialties, prev.specialtyInput.trim()],
        specialtyInput: "",
      }));
    }
  }

  function removeSpecialty(index: number) {
    setFormData((prev) => ({
      ...prev,
      specialties: prev.specialties.filter((_, i) => i !== index),
    }));
  }

  async function handleSaveDeliveryPoint(e: React.FormEvent) {
    e.preventDefault();
    if (!user?.id) return;

    try {
      const url = editingDeliveryPoint
        ? "/api/delivery-points"
        : "/api/delivery-points";
      const method = editingDeliveryPoint ? "PUT" : "POST";

      const body: any = {
        name: deliveryPointForm.name,
        address: deliveryPointForm.address,
        zone: deliveryPointForm.zone,
        latitude: deliveryPointForm.latitude,
        longitude: deliveryPointForm.longitude,
        is_active: deliveryPointForm.is_active,
        farmer_id: user.id,
      };

      if (editingDeliveryPoint) {
        body.id = editingDeliveryPoint.id;
      }

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (response.ok) {
        await loadDeliveryPoints();
        setDeliveryPointForm({ name: "", address: "", zone: "Osorno", latitude: null, longitude: null, is_active: true });
        setEditingDeliveryPoint(null);
        setShowDeliveryPoints(false);
        setShowMap(false);
        setMapMode("view");
        alert("Punto de entrega guardado correctamente");
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || "Error al guardar punto de entrega");
      }
    } catch (error: any) {
      console.error("Error:", error);
      alert(error.message || "Error al guardar el punto de entrega. Por favor, intenta nuevamente.");
    }
  }

  async function handleDeleteDeliveryPoint(id: string) {
    if (!user?.id) return;
    if (!confirm("¿Estás seguro de que deseas eliminar este punto de entrega?")) return;

    try {
      const response = await fetch(`/api/delivery-points?id=${id}&farmer_id=${user.id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        await loadDeliveryPoints();
        alert("Punto de entrega eliminado correctamente");
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || "Error al eliminar punto de entrega");
      }
    } catch (error: any) {
      console.error("Error:", error);
      alert(error.message || "Error al eliminar el punto de entrega. Por favor, intenta nuevamente.");
    }
  }

  function handleEditDeliveryPoint(point: DeliveryPoint) {
    setEditingDeliveryPoint(point);
    setDeliveryPointForm({
      name: point.name,
      address: point.address,
      zone: point.zone,
      latitude: point.latitude,
      longitude: point.longitude,
      is_active: point.is_active !== false,
    });
    setShowDeliveryPoints(true);
    if (point.latitude && point.longitude) {
      setMapMode("edit");
      setShowMap(true);
    }
  }

  function handleNewDeliveryPoint() {
    setEditingDeliveryPoint(null);
    setDeliveryPointForm({ name: "", address: "", zone: "Osorno", latitude: null, longitude: null, is_active: true });
    setShowDeliveryPoints(true);
    setMapMode("add");
    setShowMap(true); // El mapa siempre se muestra en el modal
  }

  async function handleMapClick(lat: number, lng: number) {
    if (mapMode === "add" || mapMode === "edit") {
      setDeliveryPointForm((prev) => ({
        ...prev,
        latitude: lat,
        longitude: lng,
      }));

      // Intentar obtener la dirección usando geocodificación inversa
      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`
        );
        const data = await response.json();
        if (data.address) {
          const addressParts = [];
          if (data.address.road) addressParts.push(data.address.road);
          if (data.address.house_number) addressParts.push(data.address.house_number);
          if (addressParts.length === 0 && data.address.suburb) addressParts.push(data.address.suburb);
          if (addressParts.length === 0 && data.address.city) addressParts.push(data.address.city);

          const fullAddress = addressParts.length > 0
            ? `${addressParts.join(" ")}, ${data.address.city || data.address.town || data.address.village || ""}`
            : data.display_name || "";

          setDeliveryPointForm((prev) => ({
            ...prev,
            address: prev.address || fullAddress,
          }));
        }
      } catch (error) {
        console.error("Error al obtener dirección:", error);
      }
    }
  }

  function handlePointClick(point: DeliveryPoint) {
    if (mapMode === "view") {
      // Mostrar información del punto
      alert(`${point.name}\n${point.address}\nZona: ${point.zone}`);
    }
  }

  // Geocodificación: convertir dirección a coordenadas
  async function geocodeAddress(address: string) {
    if (!address || address.trim().length < 5) {
      return;
    }

    setGeocodingAddress(true);
    try {
      // Mejorar la búsqueda: incluir país y región para mayor precisión
      // Formato: "calle número, ciudad, región, país"
      const searchQuery = `${address.trim()}, ${deliveryPointForm.zone}, Los Lagos, Chile`;
      
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&limit=5&addressdetails=1&countrycodes=cl&bounded=1&viewbox=-73.5,-40.3,-72.8,-40.9&extratags=1`,
        {
          headers: {
            'User-Agent': 'AgroLink-Marketplace/1.0'
          }
        }
      );
      
      if (response.ok) {
        const data = await response.json();
        if (data && data.length > 0) {
          // Priorizar resultados que tengan número de casa y calle
          let bestResult = data[0];
          
          // Buscar el resultado más preciso (que tenga house_number y road)
          for (const result of data) {
            if (result.address && result.address.house_number && result.address.road) {
              bestResult = result;
              break;
            }
          }
          
          const lat = parseFloat(bestResult.lat);
          const lng = parseFloat(bestResult.lon);
          
          if (lat && lng && !isNaN(lat) && !isNaN(lng)) {
            setDeliveryPointForm((prev) => ({
              ...prev,
              latitude: lat,
              longitude: lng,
            }));
          }
        }
      }
    } catch (error) {
      console.error("Error al geocodificar dirección:", error);
    } finally {
      setGeocodingAddress(false);
    }
  }

  // Efecto para geocodificar cuando cambia la dirección (con debounce)
  useEffect(() => {
    // Limpiar timeout anterior
    if (geocodeTimeoutRef.current) {
      clearTimeout(geocodeTimeoutRef.current);
    }

    // Solo geocodificar si:
    // 1. Estamos en modo add o edit
    // 2. Hay una dirección escrita (mínimo 8 caracteres para mejor precisión)
    // 3. No hay coordenadas ya establecidas (para evitar sobrescribir si el usuario hizo clic en el mapa)
    // 4. El modal está abierto
    if (
      (mapMode === "add" || mapMode === "edit") && 
      deliveryPointForm.address && 
      deliveryPointForm.address.trim().length >= 8 &&
      !deliveryPointForm.latitude && // Solo geocodificar si no hay coordenadas
      showDeliveryPoints
    ) {
      // Esperar 1.5 segundos después de que el usuario deje de escribir
      geocodeTimeoutRef.current = setTimeout(() => {
        geocodeAddress(deliveryPointForm.address);
      }, 1500);
    }

    return () => {
      if (geocodeTimeoutRef.current) {
        clearTimeout(geocodeTimeoutRef.current);
      }
    };
  }, [deliveryPointForm.address, mapMode, showDeliveryPoints, deliveryPointForm.latitude]);

  // Estadísticas
  const stats = {
    totalProducts: products.length,
    activeProducts: products.filter((p) => p.is_active).length,
    totalOrders: orders.length,
    pendingOrders: orders.filter((o) => o.status === "pendiente").length,
    completedOrders: orders.filter((o) => o.status === "entregado").length,
    totalItemsSold: (() => {
      if (!user?.id) return 0;
      // Obtener IDs de productos del agricultor
      const farmerProductIds = new Set(products.map((p) => p.id));
      // Solo contar unidades de pedidos completados (entregados)
      return orders
        .filter((order) => order.status === "entregado")
        .reduce((sum, order) => {
          const farmerItems = order.order_items?.filter((item: any) => 
            farmerProductIds.has(item.product_id)
          ) || [];
          return sum + farmerItems.reduce((itemSum: number, item: any) => itemSum + item.quantity, 0);
        }, 0);
    })(),
  };

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

  if (!user || user.user_metadata?.user_type !== "agricultor") {
    return null; // El useEffect redirigirá
  }

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900">
      <TopNav />
      <div className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-8 lg:px-12">
        <header className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-emerald-600">
              Panel de agricultores
            </p>
            <h1 className="text-3xl font-semibold text-slate-900">
              Mi perfil
            </h1>
            <p className="text-base text-slate-600">
              Administra tu información y visualiza tus estadísticas.
            </p>
          </div>
          <div className="flex gap-3">
            <Link
              href="/agricultores"
              className="rounded-xl border border-slate-300 bg-white px-6 py-3 text-sm font-semibold text-slate-700 transition hover:border-emerald-500 hover:text-emerald-600"
            >
              Mis productos
            </Link>
            <Link
              href="/agricultores/pedidos"
              className="rounded-xl border border-emerald-500 bg-emerald-50 px-6 py-3 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-100"
            >
              Ver pedidos recibidos
            </Link>
          </div>
        </header>

        {showSuccess && (
          <div className="mb-6 rounded-xl border border-emerald-500/50 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">
            ✓ Perfil actualizado exitosamente
          </div>
        )}

        {/* Estadísticas */}
        <section className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-6">
            <p className="text-sm text-slate-600">Total productos</p>
            <p className="mt-2 text-3xl font-semibold text-slate-900">
              {stats.totalProducts}
            </p>
            <p className="mt-1 text-xs text-slate-500">
              {stats.activeProducts} activos
            </p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-6">
            <p className="text-sm text-slate-600">Total pedidos</p>
            <p className="mt-2 text-3xl font-semibold text-slate-900">
              {stats.totalOrders}
            </p>
            <p className="mt-1 text-xs text-slate-500">
              {stats.pendingOrders} pendientes
            </p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-6">
            <p className="text-sm text-slate-600">Pedidos completados</p>
            <p className="mt-2 text-3xl font-semibold text-emerald-600">
              {stats.completedOrders}
            </p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-6">
            <p className="text-sm text-slate-600">Unidades vendidas</p>
            <p className="mt-2 text-3xl font-semibold text-emerald-600">
              {stats.totalItemsSold}
            </p>
          </div>
        </section>

        <div className="grid gap-8 lg:grid-cols-3">
          {/* Información del perfil */}
          <section className="lg:col-span-2 rounded-3xl border border-slate-200 bg-white p-8">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-2xl font-semibold text-slate-900">
                Información del perfil
              </h2>
              {!editing && (
                <button
                  onClick={() => setEditing(true)}
                  className="rounded-xl border border-emerald-500 bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-100"
                >
                  Editar perfil
                </button>
              )}
            </div>

            {editing ? (
              <form onSubmit={handleSaveProfile} className="space-y-6">
                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Nombre
                  </label>
                  <input
                    type="text"
                    value={user.user_metadata?.name || ""}
                    disabled
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-500"
                  />
                  <p className="mt-1 text-xs text-slate-500">
                    El nombre se actualiza desde tu cuenta de usuario
                  </p>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Email
                  </label>
                  <input
                    type="email"
                    value={user.email || ""}
                    disabled
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-500"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Biografía
                  </label>
                  <textarea
                    value={formData.bio}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, bio: e.target.value }))
                    }
                    rows={4}
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 transition focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                    placeholder="Cuéntanos sobre ti y tu trabajo..."
                  />
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-sm font-semibold text-slate-700">
                      Ubicación
                    </label>
                    <input
                      type="text"
                      value={formData.location}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          location: e.target.value,
                        }))
                      }
                      className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 transition focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                      placeholder="Ej: Osorno, Chile"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-semibold text-slate-700">
                      Teléfono
                    </label>
                    <input
                      type="text"
                      value={formData.phone}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          phone: e.target.value,
                        }))
                      }
                      className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 transition focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                      placeholder="+56912345678"
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Sitio web
                  </label>
                  <input
                    type="url"
                    value={formData.website}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        website: e.target.value,
                      }))
                    }
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 transition focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                    placeholder="https://..."
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Certificaciones
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={formData.certificationInput}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          certificationInput: e.target.value,
                        }))
                      }
                      onKeyPress={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          addCertification();
                        }
                      }}
                      className="flex-1 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 transition focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                      placeholder="Ej: Certificación orgánica"
                    />
                    <button
                      type="button"
                      onClick={addCertification}
                      className="rounded-xl border border-emerald-500 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-100"
                    >
                      Agregar
                    </button>
                  </div>
                  {formData.certifications.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {formData.certifications.map((cert, index) => (
                        <span
                          key={index}
                          className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1 text-sm text-slate-700"
                        >
                          {cert}
                          <button
                            type="button"
                            onClick={() => removeCertification(index)}
                            className="text-red-600 hover:text-red-700"
                          >
                            ×
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Especialidades
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={formData.specialtyInput}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          specialtyInput: e.target.value,
                        }))
                      }
                      onKeyPress={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          addSpecialty();
                        }
                      }}
                      className="flex-1 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 transition focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                      placeholder="Ej: Hortalizas orgánicas"
                    />
                    <button
                      type="button"
                      onClick={addSpecialty}
                      className="rounded-xl border border-emerald-500 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-100"
                    >
                      Agregar
                    </button>
                  </div>
                  {formData.specialties.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {formData.specialties.map((specialty, index) => (
                        <span
                          key={index}
                          className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1 text-sm text-slate-700"
                        >
                          {specialty}
                          <button
                            type="button"
                            onClick={() => removeSpecialty(index)}
                            className="text-red-600 hover:text-red-700"
                          >
                            ×
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex gap-3">
                  <button
                    type="submit"
                    className="flex-1 rounded-xl bg-emerald-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700"
                  >
                    Guardar cambios
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setEditing(false);
                      loadProfile();
                    }}
                    className="rounded-xl border border-slate-200 bg-white px-6 py-3 text-sm font-semibold text-slate-600 transition hover:border-emerald-500 hover:text-emerald-600"
                  >
                    Cancelar
                  </button>
                </div>
              </form>
            ) : (
              <div className="space-y-6">
                <div>
                  <p className="text-sm font-semibold text-slate-700">Nombre</p>
                  <p className="mt-1 text-slate-900">
                    {user.user_metadata?.name || "No especificado"}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-700">Email</p>
                  <p className="mt-1 text-slate-900">{user.email}</p>
                </div>
                {profile?.bio && (
                  <div>
                    <p className="text-sm font-semibold text-slate-700">
                      Biografía
                    </p>
                    <p className="mt-1 text-slate-600">{profile.bio}</p>
                  </div>
                )}
                {(profile?.location || profile?.phone || profile?.website) && (
                  <div className="grid gap-4 sm:grid-cols-2">
                    {profile.location && (
                      <div>
                        <p className="text-sm font-semibold text-slate-700">
                          Ubicación
                        </p>
                        <p className="mt-1 text-slate-600">{profile.location}</p>
                      </div>
                    )}
                    {profile.phone && (
                      <div>
                        <p className="text-sm font-semibold text-slate-700">
                          Teléfono
                        </p>
                        <p className="mt-1 text-slate-600">{profile.phone}</p>
                      </div>
                    )}
                    {profile.website && (
                      <div>
                        <p className="text-sm font-semibold text-slate-700">
                          Sitio web
                        </p>
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
                {profile?.certifications && profile.certifications.length > 0 && (
                  <div>
                    <p className="text-sm font-semibold text-slate-700">
                      Certificaciones
                    </p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {profile.certifications.map((cert, index) => (
                        <span
                          key={index}
                          className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-1 text-sm text-emerald-700"
                        >
                          {cert}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                {profile?.specialties && profile.specialties.length > 0 && (
                  <div>
                    <p className="text-sm font-semibold text-slate-700">
                      Especialidades
                    </p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {profile.specialties.map((specialty, index) => (
                        <span
                          key={index}
                          className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-1 text-sm text-slate-700"
                        >
                          {specialty}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                {!profile && (
                  <p className="text-sm text-slate-500">
                    Haz clic en "Editar perfil" para agregar información sobre ti.
                  </p>
                )}
              </div>
            )}
          </section>

          {/* Resumen de productos y pedidos */}
          <aside className="space-y-6">
            {/* Productos recientes */}
            <section className="rounded-3xl border border-slate-200 bg-white p-6">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-lg font-semibold text-slate-900">
                  Mis productos
                </h3>
                <Link
                  href="/agricultores"
                  className="text-sm font-semibold text-emerald-600 hover:text-emerald-700"
                >
                  Ver todos
                </Link>
              </div>
              {products.length === 0 ? (
                <p className="text-sm text-slate-500">
                  Aún no has agregado productos.
                </p>
              ) : (
                <div className="space-y-3">
                  {products.slice(0, 3).map((product) => (
                    <div
                      key={product.id}
                      className="flex gap-3 rounded-lg border border-slate-200 bg-slate-50 p-3"
                    >
                      {product.image_url && (
                        <div className="h-16 w-16 flex-shrink-0 overflow-hidden rounded-lg">
                          <Image
                            src={product.image_url}
                            alt={product.name}
                            width={64}
                            height={64}
                            className="h-full w-full object-cover"
                          />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-slate-900 truncate">
                          {product.name}
                        </p>
                        <p className="text-xs text-slate-600">
                          Stock: {product.stock} unidades
                        </p>
                        <p className="text-xs text-slate-500">
                          {product.is_active ? "Activo" : "Desactivado"}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* Puntos de entrega */}
            <section className="rounded-3xl border border-slate-200 bg-white p-6">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-lg font-semibold text-slate-900">
                  Puntos de entrega
                </h3>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setShowMap(!showMap);
                      setMapMode("view");
                    }}
                    className="text-sm font-semibold text-blue-600 hover:text-blue-700"
                  >
                    {showMap ? "Ocultar mapa" : "Ver mapa"}
                  </button>
                  <button
                    onClick={handleNewDeliveryPoint}
                    className="text-sm font-semibold text-emerald-600 hover:text-emerald-700"
                  >
                    + Agregar punto
                  </button>
                </div>
              </div>
              
              {/* Mapa */}
              {showMap && (
                <div className="mb-6">
                  <DeliveryPointsMap
                    deliveryPoints={deliveryPoints}
                    onPointClick={handlePointClick}
                    onMapClick={mapMode === "add" || mapMode === "edit" ? handleMapClick : undefined}
                    editable={mapMode === "add" || mapMode === "edit"}
                    center={[-40.5739, -73.1342]} // Osorno, Chile
                    zoom={12}
                  />
                  {(mapMode === "add" || mapMode === "edit") && (
                    <p className="mt-2 text-sm text-slate-600">
                      💡 Haz clic en el mapa para seleccionar la ubicación del punto de entrega
                    </p>
                  )}
                </div>
              )}
              {deliveryPoints.length === 0 ? (
                <p className="text-sm text-slate-500">
                  Aún no has agregado puntos de entrega.
                </p>
              ) : (
                <div className="space-y-3">
                  {deliveryPoints.map((point) => (
                    <div
                      key={point.id}
                      className="rounded-lg border border-slate-200 bg-slate-50 p-3"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-semibold text-slate-900">
                            {point.name}
                          </p>
                          {point.is_active !== false ? (
                            <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-700">
                              Activo
                            </span>
                          ) : (
                            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-700">
                              Inactivo
                            </span>
                          )}
                          </div>
                          <p className="mt-1 text-xs text-slate-600">
                            {point.address}
                          </p>
                          <p className="text-xs text-slate-500">
                            Zona: {point.zone}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleEditDeliveryPoint(point)}
                            className="rounded-lg border border-emerald-500 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-100"
                          >
                            Editar
                          </button>
                          <button
                            onClick={() => handleDeleteDeliveryPoint(point.id)}
                            className="rounded-lg border border-red-500 bg-red-50 px-3 py-1 text-xs font-semibold text-red-700 transition hover:bg-red-100"
                          >
                            Eliminar
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* Modal para agregar/editar punto de entrega */}
            {showDeliveryPoints && (
              <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/50 p-2 sm:p-4 overflow-y-auto">
                <div className="w-full max-w-4xl rounded-lg border border-slate-200 bg-white shadow-2xl my-2 sm:my-4">
                  {/* Header */}
                  <div className="bg-gradient-to-r from-emerald-50 to-emerald-100 border-b border-emerald-200 px-4 sm:px-6 py-3.5 flex items-center justify-between">
                    <h3 className="text-base sm:text-lg font-bold text-emerald-900">
                      {editingDeliveryPoint ? "✏️ Editar punto de entrega" : "➕ Nuevo punto de entrega"}
                    </h3>
                    <button
                      type="button"
                      onClick={() => {
                        setShowDeliveryPoints(false);
                        setEditingDeliveryPoint(null);
                        setDeliveryPointForm({ name: "", address: "", zone: "Osorno", latitude: null, longitude: null, is_active: true });
                        setShowMap(false);
                        setMapMode("view");
                      }}
                      className="text-emerald-600 hover:text-emerald-900 hover:bg-emerald-200 text-2xl font-light leading-none w-8 h-8 flex items-center justify-center rounded-full transition flex-shrink-0"
                    >
                      ×
                    </button>
                  </div>
                  
                  <form onSubmit={handleSaveDeliveryPoint}>
                    <div className="p-4 sm:p-6 grid gap-5 lg:grid-cols-2">
                      {/* Columna izquierda: Formulario */}
                      <div className="space-y-4">
                        <div>
                          <label className="mb-2 block text-sm font-bold text-slate-900">
                            Nombre del punto *
                          </label>
                          <input
                            type="text"
                            value={deliveryPointForm.name}
                            onChange={(e) =>
                              setDeliveryPointForm((prev) => ({ ...prev, name: e.target.value }))
                            }
                            required
                            className="w-full rounded-lg border-2 border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 transition focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                            placeholder="Ej: Mercado Central Osorno"
                          />
                        </div>
                        
                        <div>
                          <label className="mb-2 block text-sm font-bold text-slate-900">
                            Zona *
                          </label>
                          <select
                            value={deliveryPointForm.zone}
                            onChange={(e) =>
                              setDeliveryPointForm((prev) => ({ ...prev, zone: e.target.value }))
                            }
                            required
                            className="w-full rounded-lg border-2 border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 transition focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                          >
                            <option value="Osorno">Osorno</option>
                            <option value="Río Bueno">Río Bueno</option>
                          </select>
                        </div>
                        
                        <div>
                          <label className="mb-2 block text-sm font-bold text-slate-900">
                            Dirección *
                          </label>
                          <input
                            type="text"
                            value={deliveryPointForm.address}
                            onChange={(e) =>
                              setDeliveryPointForm((prev) => ({ ...prev, address: e.target.value }))
                            }
                            required
                            className="w-full rounded-lg border-2 border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 transition focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                            placeholder="Ej: Arturo Prat 534, Osorno"
                          />
                          <p className="mt-2 text-xs text-slate-600 bg-slate-50 p-2 rounded border border-slate-200">
                            ℹ️ Escribe la dirección completa con calle y número. El mapa se actualizará automáticamente.
                          </p>
                        </div>
                        
                        {/* Coordenadas seleccionadas */}
                        {(deliveryPointForm.latitude !== null && deliveryPointForm.longitude !== null) && (
                          <div className="rounded-lg border-2 border-emerald-300 bg-emerald-50 p-3">
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-bold text-emerald-800 mb-1.5 flex items-center gap-1.5">
                                  <span>✅</span>
                                  <span>Ubicación seleccionada</span>
                                </p>
                                <p className="text-xs text-emerald-700 font-mono">
                                  Lat: {deliveryPointForm.latitude.toFixed(6)}
                                </p>
                                <p className="text-xs text-emerald-700 font-mono">
                                  Lng: {deliveryPointForm.longitude.toFixed(6)}
                                </p>
                              </div>
                              <button
                                type="button"
                                onClick={() => {
                                  setDeliveryPointForm((prev) => ({ ...prev, latitude: null, longitude: null }));
                                }}
                                className="text-xs text-red-600 hover:text-white hover:bg-red-600 font-bold px-3 py-1.5 rounded-lg border-2 border-red-600 transition flex-shrink-0"
                              >
                                Limpiar
                              </button>
                            </div>
                          </div>
                        )}
                        
                        {geocodingAddress && (
                          <div className="rounded-lg border-2 border-blue-300 bg-blue-50 p-3">
                            <p className="text-sm font-bold text-blue-800 flex items-center gap-2">
                              <span className="animate-pulse">🔍</span>
                              <span>Buscando ubicación...</span>
                            </p>
                          </div>
                        )}
                        
                        <div className="flex items-center gap-3 p-3 rounded-lg bg-slate-100 border-2 border-slate-300">
                          <input
                            type="checkbox"
                            id="is_active"
                            checked={deliveryPointForm.is_active}
                            onChange={(e) =>
                              setDeliveryPointForm((prev) => ({ ...prev, is_active: e.target.checked }))
                            }
                            className="h-5 w-5 accent-emerald-600 cursor-pointer"
                          />
                          <label htmlFor="is_active" className="text-sm font-bold text-slate-900 cursor-pointer">
                            ✓ Punto activo (visible para clientes)
                          </label>
                        </div>
                      </div>
                      
                      {/* Columna derecha: Mapa */}
                      <div className="space-y-2">
                        <label className="text-sm font-bold text-slate-900">
                          📍 Ubicación en el mapa
                        </label>
                        
                        <div className="rounded-lg overflow-hidden border-2 border-slate-300 shadow-md" style={{ height: "450px" }}>
                          <DeliveryPointsMap
                            deliveryPoints={deliveryPoints.filter(p => p.id !== editingDeliveryPoint?.id)}
                            onPointClick={handlePointClick}
                            onMapClick={handleMapClick}
                            editable={true}
                            center={
                              deliveryPointForm.latitude && deliveryPointForm.longitude
                                ? [deliveryPointForm.latitude, deliveryPointForm.longitude]
                                : [-40.5739, -73.1342]
                            }
                            zoom={deliveryPointForm.latitude && deliveryPointForm.longitude ? 17 : 13}
                            tempMarker={
                              deliveryPointForm.latitude && deliveryPointForm.longitude
                                ? { lat: deliveryPointForm.latitude, lng: deliveryPointForm.longitude }
                                : null
                            }
                          />
                        </div>
                        
                        <p className="text-xs text-slate-600 flex items-start gap-1 bg-blue-50 p-2 rounded border border-blue-200">
                          <span>💡</span>
                          <span>Escribe una dirección arriba o haz clic en el mapa para seleccionar la ubicación</span>
                        </p>
                      </div>
                    </div>
                    
                    {/* Botones de acción - Footer */}
                    <div className="bg-slate-50 border-t border-slate-200 px-4 sm:px-6 py-4 flex gap-3">
                      <button
                        type="submit"
                        className="flex-1 rounded-lg bg-emerald-600 px-6 py-3 text-sm font-bold text-white transition hover:bg-emerald-700 shadow-lg hover:shadow-xl"
                      >
                        {editingDeliveryPoint ? "💾 Guardar cambios" : "✨ Crear punto"}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setShowDeliveryPoints(false);
                          setEditingDeliveryPoint(null);
                          setDeliveryPointForm({ name: "", address: "", zone: "Osorno", latitude: null, longitude: null, is_active: true });
                          setShowMap(false);
                          setMapMode("view");
                        }}
                        className="rounded-lg border-2 border-slate-300 bg-white px-6 py-3 text-sm font-bold text-slate-700 transition hover:bg-slate-100 hover:border-slate-400"
                      >
                        Cancelar
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {/* Pedidos recientes */}
            <section className="rounded-3xl border border-slate-200 bg-white p-6">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-lg font-semibold text-slate-900">
                  Pedidos recientes
                </h3>
                <Link
                  href="/agricultores/pedidos"
                  className="text-sm font-semibold text-emerald-600 hover:text-emerald-700"
                >
                  Ver todos
                </Link>
              </div>
              {orders.length === 0 ? (
                <p className="text-sm text-slate-500">
                  Aún no has recibido pedidos.
                </p>
              ) : (
                <div className="space-y-3">
                  {orders.slice(0, 3).map((order) => (
                    <div
                      key={order.id}
                      className="rounded-lg border border-slate-200 bg-slate-50 p-3"
                    >
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-semibold text-slate-900">
                          Pedido #{order.id.substring(0, 8)}
                        </p>
                        <span
                          className={`rounded-full px-2 py-1 text-xs font-semibold ${
                            order.status === "entregado"
                              ? "bg-emerald-100 text-emerald-700"
                              : order.status === "cancelado"
                              ? "bg-red-100 text-red-700"
                              : "bg-yellow-100 text-yellow-700"
                          }`}
                        >
                          {order.status}
                        </span>
                      </div>
                      <p className="mt-1 text-xs text-slate-600">
                        {order.customer_name || "Cliente"}
                      </p>
                      <p className="text-xs text-slate-500">
                        {new Date(order.created_at).toLocaleDateString("es-ES")}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </aside>
        </div>
      </div>
      <Footer />
    </div>
  );
}

