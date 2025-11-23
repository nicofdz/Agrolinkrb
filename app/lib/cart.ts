// Utilidades para manejar el carrito con localStorage

const CART_STORAGE_KEY = "agrolink_cart";

export type Cart = Record<string, number>;

export function getCart(): Cart {
  if (typeof window === "undefined") return {};
  
  try {
    const stored = localStorage.getItem(CART_STORAGE_KEY);
    return stored ? JSON.parse(stored) : {};
  } catch {
    return {};
  }
}

export function saveCart(cart: Cart): void {
  if (typeof window === "undefined") return;
  
  try {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
  } catch (error) {
    console.error("Error al guardar carrito:", error);
  }
}

export function addToCart(productId: string, quantity: number = 1): Cart {
  const cart = getCart();
  const newCart = {
    ...cart,
    [productId]: (cart[productId] || 0) + quantity,
  };
  saveCart(newCart);
  return newCart;
}

export function setCartItem(productId: string, quantity: number): Cart {
  const cart = getCart();
  const newCart = { ...cart };
  
  if (quantity <= 0) {
    delete newCart[productId];
  } else {
    newCart[productId] = quantity;
  }
  
  saveCart(newCart);
  return newCart;
}

export function removeFromCart(productId: string): Cart {
  const cart = getCart();
  const newCart = { ...cart };
  delete newCart[productId];
  saveCart(newCart);
  return newCart;
}

export function clearCart(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(CART_STORAGE_KEY);
}

export function getCartCount(cart: Cart): number {
  return Object.values(cart).reduce((total, qty) => total + qty, 0);
}


