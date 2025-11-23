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
};

export function TopNav({ cartCount: propCartCount, cartHref: propCartHref }: TopNavProps = {}) {
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
      <div className="mx-auto w-full max-w-6xl px-4 py-4 sm:px-8 lg:px-12">
        {/* Desktop Navbar */}
        <div className="hidden md:flex items-center justify-between gap-4 text-white">
          <Link href="/" className="text-lg font-semibold tracking-[0.2em] whitespace-nowrap">
            AgroLink
          </Link>
          
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
                  href="/auth/login"
                  className="rounded-lg px-3 py-2 transition hover:bg-white/10 hover:text-white whitespace-nowrap"
                >
                  Catálogo
                </Link>
                <Link
                  href="/auth/login"
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
                        className="rounded-full bg-emerald-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-600 whitespace-nowrap"
                      >
                        Carrito ({cartCount})
                      </Link>
                    ) : (
                      <span className="rounded-full bg-white/10 px-4 py-2 text-sm font-semibold text-emerald-200 whitespace-nowrap">
                        Carrito (0)
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
                      className="rounded-lg border border-white/20 px-3 py-2 text-sm transition hover:bg-white/10 whitespace-nowrap"
                    >
                      Salir
                    </button>
                  </>
                ) : (
                  <>
                    {hasCart && cartHref ? (
                      <Link
                        href={cartHref}
                        className="rounded-full bg-emerald-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-600 whitespace-nowrap"
                      >
                        Carrito ({cartCount})
                      </Link>
                    ) : (
                      <span className="rounded-full bg-white/10 px-4 py-2 text-sm font-semibold text-emerald-200 whitespace-nowrap">
                        Carrito (0)
                      </span>
                    )}
                    <Link
                      href="/auth/login"
                      className="rounded-lg border border-white/20 px-3 py-2 text-sm transition hover:bg-white/10 whitespace-nowrap"
                    >
                      Iniciar sesión
                    </Link>
                    <Link
                      href="/auth/registro"
                      className="rounded-lg bg-emerald-500 px-3 py-2 text-sm transition hover:bg-emerald-600 whitespace-nowrap"
                    >
                      Registrarse
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
                className="relative rounded-full bg-emerald-500 px-3 py-2 text-xs font-semibold text-white transition hover:bg-emerald-600"
              >
                <span className="hidden sm:inline">Carrito</span>
                <span className="sm:hidden">🛒</span>
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
                    href="/auth/login"
                    onClick={() => setMobileMenuOpen(false)}
                    className="rounded-lg px-3 py-2 transition hover:bg-white/10 hover:text-white"
                  >
                    Catálogo
                  </Link>
                  <Link
                    href="/auth/login"
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
                        <span className="rounded-full bg-white/10 px-3 py-2 text-sm font-semibold text-emerald-200 text-center">
                          Carrito (0)
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
                        className="rounded-lg border border-white/20 px-3 py-2 text-sm transition hover:bg-white/10 text-left"
                      >
                        Salir
                      </button>
                    </>
                  ) : (
                    <>
                      {!hasCart && (
                        <span className="rounded-full bg-white/10 px-3 py-2 text-sm font-semibold text-emerald-200 text-center">
                          Carrito (0)
                        </span>
                      )}
                      <Link
                        href="/auth/login"
                        onClick={() => setMobileMenuOpen(false)}
                        className="rounded-lg border border-white/20 px-3 py-2 text-sm transition hover:bg-white/10 text-center"
                      >
                        Iniciar sesión
                      </Link>
                      <Link
                        href="/auth/registro"
                        onClick={() => setMobileMenuOpen(false)}
                        className="rounded-lg bg-emerald-500 px-3 py-2 text-sm transition hover:bg-emerald-600 text-center"
                      >
                        Registrarse
                      </Link>
                    </>
                  )}
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}

