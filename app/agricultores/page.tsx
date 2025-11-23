"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { TopNav } from "../components/top-nav";
import { useAuth } from "../components/auth-provider";
import Footer from "../components/footer";

type FormData = {
  name: string;
  category: string;
  harvestWindow: string;
  priceRange: string;
  availability: "Alta" | "Media" | "Baja";
  sustainability: string;
  highlights: string[];
  location: string;
  stock: number;
  image: File | null;
};

type Product = {
  id: string;
  name: string;
  category: string;
  harvest_window: string;
  price_range: string;
  availability: string;
  sustainability: string;
  highlights: string[];
  location: string;
  image_url: string | null;
  stock: number;
  is_active: boolean;
  created_at: string;
};

const categories = [
  "Hojas verdes",
  "Raíces y tubérculos",
  "Proteína",
  "Fruta - Solanáceas",
  "Hortaliza de guarda",
  "Microgreens",
];

// Función para calcular disponibilidad basada en stock
function calculateAvailability(stock: number): "Alta" | "Media" | "Baja" {
  if (stock > 100) {
    return "Alta";
  } else if (stock >= 40) {
    return "Media";
  } else {
    return "Baja";
  }
}

const initialFormData: FormData = {
  name: "",
  category: "",
  harvestWindow: "",
  priceRange: "",
  availability: "Baja",
  sustainability: "",
  highlights: [],
  location: "Osorno",
  stock: 0,
  image: null,
};

export default function AgricultoresPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [highlightInput, setHighlightInput] = useState("");
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        router.push("/auth/login?redirect=/agricultores");
      } else if (user.user_metadata?.user_type !== "agricultor") {
        alert("Esta sección es solo para agricultores. Los restaurantes pueden hacer pedidos desde el catálogo.");
        router.push("/catalogo");
      } else {
        loadProducts();
      }
    }
  }, [user, authLoading, router]);

  async function loadProducts() {
    if (!user?.id) return;
    
    try {
      setLoading(true);
      const response = await fetch(`/api/products?user_id=${user.id}`);
      if (response.ok) {
        const data = await response.json();
        setProducts(data || []);
      }
    } catch (error) {
      console.error("Error al cargar productos:", error);
    } finally {
      setLoading(false);
    }
  }

  function handleInputChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) {
    const { name, value } = e.target;
    if (name === "stock") {
      const stockValue = parseInt(value) || 0;
      const calculatedAvailability = calculateAvailability(stockValue);
      setFormData((prev) => ({ 
        ...prev, 
        [name]: stockValue,
        availability: calculatedAvailability
      }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  }

  function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      setFormData((prev) => ({ ...prev, image: file }));
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  }

  function addHighlight() {
    if (highlightInput.trim()) {
      setFormData((prev) => ({
        ...prev,
        highlights: [...prev.highlights, highlightInput.trim()],
      }));
      setHighlightInput("");
    }
  }

  function removeHighlight(index: number) {
    setFormData((prev) => ({
      ...prev,
      highlights: prev.highlights.filter((_, i) => i !== index),
    }));
  }

  async function uploadImage(file: File): Promise<string | null> {
    try {
      const uploadFormData = new FormData();
      uploadFormData.append("file", file);

      const response = await fetch("/api/upload-image", {
        method: "POST",
        body: uploadFormData,
      });

      if (response.ok) {
        const data = await response.json();
        return data.url;
      } else {
        const errorData = await response.json();
        console.error("Error al subir imagen:", errorData);
        const errorMessage = errorData.error || "Error desconocido al subir la imagen";
        alert(`Error al subir la imagen: ${errorMessage}`);
        return null;
      }
    } catch (error: any) {
      console.error("Error al subir imagen:", error);
      alert(`Error al subir la imagen: ${error.message || "Error de conexión"}`);
      return null;
    }
  }

  async function handleProductSubmit(e: React.FormEvent) {
    e.preventDefault();
    
    if (!user?.id) return;

    try {
      // Subir imagen si existe
      let imageUrl: string | null = null;
      if (formData.image) {
        imageUrl = await uploadImage(formData.image);
        if (!imageUrl) {
          const continueWithoutImage = confirm(
            "No se pudo subir la imagen. ¿Deseas guardar el producto sin imagen?"
          );
          if (!continueWithoutImage) {
            return;
          }
        }
      }

      if (editingProduct) {
        // Editar producto existente
        const response = await fetch("/api/products", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: editingProduct.id,
            user_id: user.id,
            name: formData.name,
            category: formData.category,
            harvest_window: formData.harvestWindow,
            price_range: formData.priceRange,
            // La disponibilidad se calcula automáticamente en el servidor basada en stock
            sustainability: formData.sustainability,
            highlights: formData.highlights,
            location: formData.location,
            stock: formData.stock,
            image_url: imageUrl || editingProduct.image_url || null,
          }),
        });

        if (response.ok) {
          await loadProducts();
          closeModal();
        } else {
          const errorData = await response.json();
          throw new Error(errorData.error || "Error al actualizar producto");
        }
      } else {
        // Agregar nuevo producto
        const response = await fetch("/api/products", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            user_id: user.id,
            name: formData.name,
            category: formData.category,
            harvest_window: formData.harvestWindow,
            price_range: formData.priceRange,
            // La disponibilidad se calcula automáticamente en el servidor basada en stock
            sustainability: formData.sustainability,
            highlights: formData.highlights,
            location: formData.location,
            stock: formData.stock,
            image_url: imageUrl,
          }),
        });

        if (response.ok) {
          await loadProducts();
          closeModal();
        } else {
          const errorData = await response.json();
          throw new Error(errorData.error || "Error al crear producto");
        }
      }
      
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    } catch (error: any) {
      console.error("Error:", error);
      alert(error.message || "Error al guardar el producto. Por favor, intenta nuevamente.");
    }
  }

  function openModal(product?: Product) {
    if (product) {
      setEditingProduct(product);
      const stock = product.stock || 0;
      const calculatedAvailability = calculateAvailability(stock);
      setFormData({
        name: product.name,
        category: product.category,
        harvestWindow: product.harvest_window,
        priceRange: product.price_range,
        availability: calculatedAvailability,
        sustainability: product.sustainability,
        highlights: product.highlights || [],
        location: product.location || "Osorno",
        stock: stock,
        image: null,
      });
      if (product.image_url) {
        setImagePreview(product.image_url);
      } else {
        setImagePreview(null);
      }
    } else {
      setEditingProduct(null);
      setFormData(initialFormData);
      setImagePreview(null);
    }
    setShowModal(true);
  }

  function closeModal() {
    setShowModal(false);
    setEditingProduct(null);
    setFormData(initialFormData);
    setHighlightInput("");
    setImagePreview(null);
  }

  async function removeProduct(id: string) {
    if (!confirm("¿Estás seguro de que deseas eliminar este producto?")) {
      return;
    }

    if (!user?.id) return;

    try {
      const response = await fetch(`/api/products?id=${id}&user_id=${user.id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        await loadProducts();
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || "Error al eliminar producto");
      }
    } catch (error: any) {
      console.error("Error:", error);
      alert(error.message || "Error al eliminar el producto. Por favor, intenta nuevamente.");
    }
  }

  async function toggleProductStatus(product: Product) {
    if (!user?.id) return;

    try {
      const response = await fetch("/api/products", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: product.id,
          user_id: user.id,
          is_active: !product.is_active,
        }),
      });

      if (response.ok) {
        await loadProducts();
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || "Error al actualizar estado");
      }
    } catch (error: any) {
      console.error("Error:", error);
      alert(error.message || "Error al actualizar el estado del producto.");
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
              Mis productos
            </h1>
            <p className="text-base text-slate-600">
              Administra tus productos y añade nuevos al catálogo.
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => openModal()}
              className="rounded-xl bg-emerald-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700"
            >
              + Agregar producto
            </button>
            <Link
              href="/agricultores/perfil"
              className="rounded-xl border border-slate-300 bg-white px-6 py-3 text-sm font-semibold text-slate-700 transition hover:border-emerald-500 hover:text-emerald-600"
            >
              Mi perfil
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
            ✓ Operación realizada exitosamente
          </div>
        )}

        {products.length === 0 ? (
          <div className="rounded-3xl border border-slate-200 bg-white p-12 text-center">
            <p className="text-slate-600">
              Aún no has agregado productos. Haz clic en "Agregar producto" para comenzar.
            </p>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {products.map((product) => (
              <div
                key={product.id}
                className={`rounded-2xl border bg-white p-6 transition ${
                  product.is_active
                    ? "border-slate-200"
                    : "border-slate-300 bg-slate-50 opacity-75"
                }`}
              >
                {product.image_url && (
                  <div className="mb-4 h-48 w-full overflow-hidden rounded-xl">
                    <Image
                      src={product.image_url}
                      alt={product.name}
                      width={400}
                      height={200}
                      className="h-full w-full object-cover"
                    />
                  </div>
                )}
                <div className="mb-4">
                  <div className="mb-2 flex items-start justify-between">
                    <h3 className="text-lg font-semibold text-slate-900">
                      {product.name}
                    </h3>
                    {!product.is_active && (
                      <span className="rounded-full bg-slate-200 px-2 py-1 text-xs font-semibold text-slate-600">
                        Desactivado
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-slate-600">{product.category}</p>
                  <p className="mt-1 text-sm font-semibold text-emerald-600">
                    {product.price_range}
                  </p>
                  <div className="mt-2 flex items-center gap-2">
                    <span className="text-sm text-slate-600">Stock:</span>
                    <span className={`text-sm font-semibold ${
                      product.stock > 0 ? "text-emerald-600" : "text-red-600"
                    }`}>
                      {product.stock} unidades
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-slate-500">
                    {product.location} · {product.availability}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => openModal(product)}
                    className="flex-1 rounded-lg border border-emerald-500 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-100"
                  >
                    Editar
                  </button>
                  <button
                    type="button"
                    onClick={() => toggleProductStatus(product)}
                    className={`flex-1 rounded-lg border px-3 py-2 text-xs font-semibold transition ${
                      product.is_active
                        ? "border-amber-500 bg-amber-50 text-amber-700 hover:bg-amber-100"
                        : "border-emerald-500 bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                    }`}
                  >
                    {product.is_active ? "Desactivar" : "Activar"}
                  </button>
                  <button
                    type="button"
                    onClick={() => removeProduct(product.id)}
                    className="rounded-lg border border-red-500/50 bg-red-50 px-3 py-2 text-xs font-semibold text-red-700 transition hover:bg-red-100"
                  >
                    Eliminar
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal para agregar/editar producto */}
      {showModal && (
        <>
          <div
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
            onClick={closeModal}
          />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div
              className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl border border-slate-200 bg-white p-6 shadow-xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="mb-6 flex items-center justify-between">
                <h2 className="text-2xl font-semibold text-slate-900">
                  {editingProduct ? "Editar producto" : "Agregar nuevo producto"}
                </h2>
                <button
                  onClick={closeModal}
                  className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleProductSubmit} className="space-y-6">
                <div>
                  <label
                    htmlFor="name"
                    className="mb-2 block text-sm font-semibold text-slate-700"
                  >
                    Nombre del producto *
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 transition focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                    placeholder="Ej: Espinaca baby agroecológica"
                  />
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label
                      htmlFor="category"
                      className="mb-2 block text-sm font-semibold text-slate-700"
                    >
                      Categoría *
                    </label>
                    <select
                      id="category"
                      name="category"
                      value={formData.category}
                      onChange={handleInputChange}
                      required
                      className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 transition focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                    >
                      <option value="">Selecciona una categoría</option>
                      {categories.map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label
                      htmlFor="stock"
                      className="mb-2 block text-sm font-semibold text-slate-700"
                    >
                      Stock (unidades) *
                    </label>
                    <input
                      type="number"
                      id="stock"
                      name="stock"
                      value={formData.stock}
                      onChange={handleInputChange}
                      min="0"
                      required
                      className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 transition focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                      placeholder="0"
                    />
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="harvestWindow"
                    className="mb-2 block text-sm font-semibold text-slate-700"
                  >
                    Temporada de cosecha *
                  </label>
                  <input
                    type="text"
                    id="harvestWindow"
                    name="harvestWindow"
                    value={formData.harvestWindow}
                    onChange={handleInputChange}
                    required
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 transition focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                    placeholder="Ej: Todo el año · peak otoño"
                  />
                </div>

                <div>
                  <label
                    htmlFor="priceRange"
                    className="mb-2 block text-sm font-semibold text-slate-700"
                  >
                    Precio guía *
                  </label>
                  <input
                    type="text"
                    id="priceRange"
                    name="priceRange"
                    value={formData.priceRange}
                    onChange={handleInputChange}
                    required
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 transition focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                    placeholder="Ej: $4.500 - $5.200 / kg"
                  />
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label
                      htmlFor="availability"
                      className="mb-2 block text-sm font-semibold text-slate-700"
                    >
                      Disponibilidad (calculada automáticamente)
                    </label>
                    <div className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700">
                      {formData.availability}
                      <span className="ml-2 text-xs text-slate-500">
                        (Stock: {formData.stock})
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-slate-500">
                      Alta: más de 100 unidades | Media: 40-100 unidades | Baja: menos de 40 unidades
                    </p>
                  </div>

                  <div>
                    <label
                      htmlFor="location"
                      className="mb-2 block text-sm font-semibold text-slate-700"
                    >
                      Ubicación *
                    </label>
                    <select
                      id="location"
                      name="location"
                      value={formData.location}
                      onChange={handleInputChange}
                      required
                      className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 transition focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                    >
                      <option value="Osorno">Osorno</option>
                      <option value="Río Bueno">Río Bueno</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="sustainability"
                    className="mb-2 block text-sm font-semibold text-slate-700"
                  >
                    Prácticas sostenibles *
                  </label>
                  <input
                    type="text"
                    id="sustainability"
                    name="sustainability"
                    value={formData.sustainability}
                    onChange={handleInputChange}
                    required
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 transition focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                    placeholder="Ej: Riego por goteo + compost local"
                  />
                </div>

                <div>
                  <label
                    htmlFor="image"
                    className="mb-2 block text-sm font-semibold text-slate-700"
                  >
                    Imagen del producto
                  </label>
                  <input
                    type="file"
                    id="image"
                    name="image"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 transition focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                  />
                  {imagePreview && (
                    <div className="mt-4 h-40 w-full overflow-hidden rounded-xl">
                      <Image
                        src={imagePreview}
                        alt="Preview"
                        width={400}
                        height={200}
                        className="h-full w-full object-cover"
                      />
                    </div>
                  )}
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Características destacadas
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={highlightInput}
                      onChange={(e) => setHighlightInput(e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          addHighlight();
                        }
                      }}
                      className="flex-1 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 transition focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                      placeholder="Ej: Lavada y lista para mise en place"
                    />
                    <button
                      type="button"
                      onClick={addHighlight}
                      className="rounded-xl border border-emerald-500 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-100"
                    >
                      Agregar
                    </button>
                  </div>
                  {formData.highlights.length > 0 && (
                    <ul className="mt-3 space-y-2">
                      {formData.highlights.map((highlight, index) => (
                        <li
                          key={index}
                          className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700"
                        >
                          <span>{highlight}</span>
                          <button
                            type="button"
                            onClick={() => removeHighlight(index)}
                            className="text-emerald-600 transition hover:text-red-600"
                          >
                            ×
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                <div className="flex gap-3">
                  <button
                    type="submit"
                    className="flex-1 rounded-xl bg-emerald-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700"
                  >
                    {editingProduct ? "Guardar cambios" : "Agregar producto"}
                  </button>
                  <button
                    type="button"
                    onClick={closeModal}
                    className="rounded-xl border border-slate-200 bg-white px-6 py-3 text-sm font-semibold text-slate-600 transition hover:border-emerald-500 hover:text-emerald-600"
                  >
                    Cancelar
                  </button>
                </div>
              </form>
            </div>
          </div>
        </>
      )}

      <Footer />
    </div>
  );
}
