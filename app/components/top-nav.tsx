"use client";

import Link from "next/link";
import { useAuth } from "./auth-provider";
import { useState, useEffect, useCallback } from "react";
import { getCart, getCartCount } from "../lib/cart";

const navLinks = [
  { label: "Inicio", href: "/" },
  { label: "Catálogo", href: "/catalogo" },
  { label: "Pedidos", href: "/pedido" },
  { label: "Productores", href: "/productores" },
  { label: "Agricultores", href: "/agricultores" },
  { label: "Contacto", href: "/#contacto" },
];

type TopNavProps = {
  cartCount?: number;
  cartHref?: string;
  searchQuery?: string;
  onSearchChange?: (query: string) => void;
  showSearch?: boolean;
};

export function TopNav({ 
  cartCount: propCartCount, 
  cartHref: propCartHref,
  searchQuery = "",
  onSearchChange,
  showSearch = false
}: TopNavProps = {}) {
  const { user, loading, signOut } = useAuth();
  const [canceledOrdersCount, setCanceledOrdersCount] = useState(0);
  const [cartCount, setCartCount] = useState(propCartCount ?? 0);
  const [cartHref, setCartHref] = useState(propCartHref);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  const userType = user?.user_metadata?.user_type;
  const userTypeLabel = userType === "restaurante" ? "Restaurante" : userType === "agricultor" ? "Agricultor" : null;

  // Cargar carrito desde localStorage si no se pasa como prop
  useEffect(() => {
    if (propCartCount === undefined) {
      const cart = getCart();
      const count = getCartCount(cart);
      setCartCount(count);
      
      if (count > 0) {
        const items = Object.entries(cart)
          .map(([id, qty]) => `${id}:${qty}`)
          .join(",");
        setCartHref(`/carrito?items=${encodeURIComponent(items)}`);
      } else {
        setCartHref(undefined);
      }
    } else {
      setCartCount(propCartCount);
      setCartHref(propCartHref);
    }
  }, [propCartCount, propCartHref]);

  // Escuchar cambios en localStorage
  useEffect(() => {
    const handleStorageChange = () => {
      if (propCartCount === undefined) {
        const cart = getCart();
        const count = getCartCount(cart);
        setCartCount(count);
        
        if (count > 0) {
          const items = Object.entries(cart)
            .map(([id, qty]) => `${id}:${qty}`)
            .join(",");
          setCartHref(`/carrito?items=${encodeURIComponent(items)}`);
        } else {
          setCartHref(undefined);
        }
      }
    };

    window.addEventListener("storage", handleStorageChange);
    // También escuchar eventos personalizados para cambios en la misma pestaña
    window.addEventListener("cart-updated", handleStorageChange);
    
    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("cart-updated", handleStorageChange);
    };
  }, [propCartCount]);

  const hasCart = Boolean(cartHref && cartCount > 0);

  // Función para cargar el conteo
  const loadCancelCount = useCallback(() => {
    if (user && userType === "restaurante") {
      fetch(`/api/orders/cancel-count?user_id=${user.id}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.count !== undefined) {
            setCanceledOrdersCount(data.count);
          }
        })
        .catch((err) => {
          console.error("Error al cargar conteo de pedidos cancelados:", err);
        });
    }
  }, [user, userType]);

  // Cargar conteo de pedidos cancelados para restaurantes
  useEffect(() => {
    loadCancelCount();
  }, [loadCancelCount]);

  // Refrescar conteo cada 30 segundos
  useEffect(() => {
    if (user && userType === "restaurante") {
      const interval = setInterval(() => {
        loadCancelCount();
      }, 30000); // 30 segundos

      return () => clearInterval(interval);
    }
  }, [user, userType, loadCancelCount]);

  // Escuchar evento de actualización de pedidos
  useEffect(() => {
    const handleOrdersUpdate = () => {
      loadCancelCount();
    };

    window.addEventListener("orders-updated", handleOrdersUpdate);
    return () => {
      window.removeEventListener("orders-updated", handleOrdersUpdate);
    };
  }, [loadCancelCount]);

  return (
    <nav className="sticky top-0 z-40 border-b border-white/10 bg-slate-950/70 backdrop-blur">
      <div className="w-full px-4 py-4 sm:px-6 lg:px-8 xl:px-12 2xl:px-16">
        {/* Desktop Navbar */}
        <div className="hidden md:flex items-center justify-between gap-4 text-white">
          <Link href="/" className="text-lg font-semibold tracking-[0.2em] whitespace-nowrap">
            AgroLink
          </Link>
          
          {/* Barra de búsqueda centrada (si está habilitada) */}
          {showSearch && onSearchChange && (
            <div className="flex-1 max-w-md mx-8">
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <svg
                    className="h-4 w-4 text-slate-400"
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
                  value={searchQuery}
                  onChange={(e) => onSearchChange(e.target.value)}
                  placeholder="Buscar productores..."
                  className="w-full rounded-lg border border-white/20 bg-white/10 pl-9 pr-8 py-1.5 text-sm text-white placeholder:text-slate-400 transition focus:border-emerald-500 focus:bg-white/20 focus:outline-none focus:ring-1 focus:ring-emerald-500/50"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => onSearchChange("")}
                    className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-white"
                  >
                    <svg
                      className="h-4 w-4"
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
          )}
          
          <div className="flex items-center gap-2 text-sm font-semibold text-emerald-100">
            <Link
              href="/"
              className="rounded-lg px-3 py-2 transition hover:bg-white/10 hover:text-white whitespace-nowrap"
            >
              Inicio
            </Link>
            {user ? (
              <>
                <Link
                  href="/catalogo"
                  className="rounded-lg px-3 py-2 transition hover:bg-white/10 hover:text-white whitespace-nowrap"
                >
                  Catálogo
                </Link>
                {userType === "restaurante" && (
                  <Link
                    href="/pedidos"
                    className="relative rounded-lg px-3 py-2 transition hover:bg-white/10 hover:text-white whitespace-nowrap"
                  >
                    Mis pedidos
                    {canceledOrdersCount > 0 && (
                      <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-600 text-xs font-bold text-white">
                        {canceledOrdersCount > 9 ? "9+" : canceledOrdersCount}
                      </span>
                    )}
                  </Link>
                )}
                <Link
                  href="/productores"
                  className="rounded-lg px-3 py-2 transition hover:bg-white/10 hover:text-white whitespace-nowrap"
                >
                  Productores
                </Link>
                {userType === "agricultor" && (
                  <Link
                    href="/agricultores"
                    className="rounded-lg px-3 py-2 transition hover:bg-white/10 hover:text-white whitespace-nowrap"
                  >
                    Mis productos
                  </Link>
                )}
              </>
            ) : (
              <>
                <Link
                  href="/catalogo"
                  className="rounded-lg px-3 py-2 transition hover:bg-white/10 hover:text-white whitespace-nowrap"
                >
                  Catálogo
                </Link>
                <Link
                  href="/productores"
                  className="rounded-lg px-3 py-2 transition hover:bg-white/10 hover:text-white whitespace-nowrap"
                >
                  Productores
                </Link>
              </>
            )}
            <Link
              href="/#contacto"
              className="rounded-lg px-3 py-2 transition hover:bg-white/10 hover:text-white whitespace-nowrap"
            >
              Contacto
            </Link>
          </div>

          <div className="flex items-center gap-3 flex-shrink-0">
            {!loading && (
              <>
                {user ? (
                  <>
                    {hasCart && cartHref ? (
                      <Link
                        href={cartHref}
                        className="relative rounded-full bg-emerald-500 p-3 text-white transition hover:bg-emerald-600"
                        title={`Carrito (${cartCount})`}
                      >
                        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                        {cartCount > 0 && (
                          <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-600 text-xs font-bold text-white">
                            {cartCount > 9 ? "9+" : cartCount}
                          </span>
                        )}
                      </Link>
                    ) : (
                      <span className="relative rounded-full bg-white/10 p-3 text-emerald-200" title="Carrito vacío">
                        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                      </span>
                    )}
                    {userType === "agricultor" ? (
                      <Link
                        href="/agricultores/perfil"
                        className="flex flex-col items-end gap-0.5 rounded-lg px-3 py-2 transition hover:bg-white/10"
                      >
                        <span className="text-sm font-semibold text-emerald-100 whitespace-nowrap">
                          {user.user_metadata?.name || user.email}
                        </span>
                        {userTypeLabel && (
                          <span className="text-xs text-emerald-300/80 whitespace-nowrap">
                            {userTypeLabel}
                          </span>
                        )}
                      </Link>
                    ) : (
                      <div className="flex flex-col items-end gap-0.5">
                        <span className="text-sm font-semibold text-emerald-100 whitespace-nowrap">
                          {user.user_metadata?.name || user.email}
                        </span>
                        {userTypeLabel && (
                          <span className="text-xs text-emerald-300/80 whitespace-nowrap">
                            {userTypeLabel}
                          </span>
                        )}
                      </div>
                    )}
                    <button
                      onClick={signOut}
                      className="rounded-lg border border-white/20 p-3 transition hover:bg-white/10"
                      title="Cerrar sesión"
                    >
                      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                      </svg>
                    </button>
                  </>
                ) : (
                  <>
                    {hasCart && cartHref ? (
                      <Link
                        href={cartHref}
                        className="relative rounded-full bg-emerald-500 p-3 text-white transition hover:bg-emerald-600"
                        title={`Carrito (${cartCount})`}
                      >
                        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                        {cartCount > 0 && (
                          <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-600 text-xs font-bold text-white">
                            {cartCount > 9 ? "9+" : cartCount}
                          </span>
                        )}
                      </Link>
                    ) : (
                      <span className="relative rounded-full bg-white/10 p-3 text-emerald-200" title="Carrito vacío">
                        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                      </span>
                    )}
                    <Link
                      href="/auth/login"
                      className="rounded-lg border border-white/20 p-3 transition hover:bg-white/10"
                      title="Iniciar sesión"
                    >
                      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </Link>
                    <Link
                      href="/auth/registro"
                      className="rounded-lg bg-emerald-500 p-3 transition hover:bg-emerald-600"
                      title="Registrarse"
                    >
                      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                      </svg>
                    </Link>
                  </>
                )}
              </>
            )}
          </div>
        </div>

        {/* Mobile Navbar */}
        <div className="flex md:hidden items-center justify-between text-white">
          <Link href="/" className="text-lg font-semibold tracking-[0.2em] whitespace-nowrap">
            AgroLink
          </Link>
          
          <div className="flex items-center gap-2">
            {!loading && hasCart && cartHref && (
              <Link
                href={cartHref}
                className="relative rounded-full bg-emerald-500 p-2.5 text-white transition hover:bg-emerald-600"
                title={`Carrito (${cartCount})`}
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                {cartCount > 0 && (
                  <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-600 text-xs font-bold text-white">
                    {cartCount > 9 ? "9+" : cartCount}
                  </span>
                )}
              </Link>
            )}
            
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="rounded-lg p-2 transition hover:bg-white/10"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? (
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden mt-4 pb-4 border-t border-white/10 pt-4">
            <div className="flex flex-col gap-2 text-sm font-semibold text-emerald-100">
              <Link
                href="/"
                onClick={() => setMobileMenuOpen(false)}
                className="rounded-lg px-3 py-2 transition hover:bg-white/10 hover:text-white"
              >
                Inicio
              </Link>
              {user ? (
                <>
                  <Link
                    href="/catalogo"
                    onClick={() => setMobileMenuOpen(false)}
                    className="rounded-lg px-3 py-2 transition hover:bg-white/10 hover:text-white"
                  >
                    Catálogo
                  </Link>
                  {userType === "restaurante" && (
                    <Link
                      href="/pedidos"
                      onClick={() => setMobileMenuOpen(false)}
                      className="relative rounded-lg px-3 py-2 transition hover:bg-white/10 hover:text-white"
                    >
                      Mis pedidos
                      {canceledOrdersCount > 0 && (
                        <span className="ml-2 inline-flex h-5 w-5 items-center justify-center rounded-full bg-red-600 text-xs font-bold text-white">
                          {canceledOrdersCount > 9 ? "9+" : canceledOrdersCount}
                        </span>
                      )}
                    </Link>
                  )}
                  <Link
                    href="/productores"
                    onClick={() => setMobileMenuOpen(false)}
                    className="rounded-lg px-3 py-2 transition hover:bg-white/10 hover:text-white"
                  >
                    Productores
                  </Link>
                  {userType === "agricultor" && (
                    <Link
                      href="/agricultores"
                      onClick={() => setMobileMenuOpen(false)}
                      className="rounded-lg px-3 py-2 transition hover:bg-white/10 hover:text-white"
                    >
                      Mis productos
                    </Link>
                  )}
                </>
              ) : (
                <>
                  <Link
                    href="/catalogo"
                    onClick={() => setMobileMenuOpen(false)}
                    className="rounded-lg px-3 py-2 transition hover:bg-white/10 hover:text-white"
                  >
                    Catálogo
                  </Link>
                  <Link
                    href="/productores"
                    onClick={() => setMobileMenuOpen(false)}
                    className="rounded-lg px-3 py-2 transition hover:bg-white/10 hover:text-white"
                  >
                    Productores
                  </Link>
                </>
              )}
              <Link
                href="/#contacto"
                onClick={() => setMobileMenuOpen(false)}
                className="rounded-lg px-3 py-2 transition hover:bg-white/10 hover:text-white"
              >
                Contacto
              </Link>
            </div>
            
            <div className="mt-4 pt-4 border-t border-white/10 flex flex-col gap-2">
              {!loading && (
                <>
                  {user ? (
                    <>
                      {!hasCart && (
                        <span className="rounded-full bg-white/10 p-2.5 text-emerald-200 text-center inline-flex items-center justify-center" title="Carrito vacío">
                          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                          </svg>
                        </span>
                      )}
                      <div className="rounded-lg px-3 py-2 bg-white/5">
                        <div className="text-sm font-semibold text-emerald-100">
                          {user.user_metadata?.name || user.email}
                        </div>
                        {userTypeLabel && (
                          <div className="text-xs text-emerald-300/80 mt-0.5">
                            {userTypeLabel}
                          </div>
                        )}
                      </div>
                      {userType === "agricultor" && (
                        <Link
                          href="/agricultores/perfil"
                          onClick={() => setMobileMenuOpen(false)}
                          className="rounded-lg px-3 py-2 text-sm transition hover:bg-white/10 text-emerald-100"
                        >
                          Mi perfil
                        </Link>
                      )}
                      <button
                        onClick={() => {
                          setMobileMenuOpen(false);
                          signOut();
                        }}
                        className="rounded-lg border border-white/20 p-2.5 transition hover:bg-white/10"
                        title="Cerrar sesión"
                      >
                        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                        </svg>
                      </button>
                    </>
                  ) : (
                    <>
                      {!hasCart && (
                        <span className="rounded-full bg-white/10 p-2.5 text-emerald-200 text-center inline-flex items-center justify-center" title="Carrito vacío">
                          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                          </svg>
                        </span>
                      )}
                      <Link
                        href="/auth/login"
                        onClick={() => setMobileMenuOpen(false)}
                        className="rounded-lg border border-white/20 p-2.5 transition hover:bg-white/10"
                        title="Iniciar sesión"
                      >
                        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                      </Link>
                      <Link
                        href="/auth/registro"
                        onClick={() => setMobileMenuOpen(false)}
                        className="rounded-lg bg-emerald-500 p-2.5 transition hover:bg-emerald-600"
                        title="Registrarse"
                      >
                        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                        </svg>
                      </Link>
                    </>
                  )}
                </>
              )}
            </div>
          </div>
        )}

        {/* Barra de búsqueda móvil (debajo del navbar) */}
        {showSearch && onSearchChange && (
          <div className="mt-4 md:hidden">
            <div className="relative">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                <svg
                  className="h-4 w-4 text-slate-400"
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
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder="Buscar..."
                className="w-full rounded-lg border border-white/20 bg-white/10 pl-10 pr-4 py-2 text-sm text-white placeholder:text-slate-400 transition focus:border-emerald-500 focus:bg-white/20 focus:outline-none"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => onSearchChange("")}
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400"
                >
                  <svg
                    className="h-4 w-4"
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
        )}
      </div>
    </nav>
  );
}

