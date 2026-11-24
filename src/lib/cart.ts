import { useSyncExternalStore } from 'react'
import { Store } from '@tanstack/react-store'

import { primaryImage } from '#/data/catalog'

import type { Product } from '#/data/catalog'

/**
 * The shopping cart. It lives in the browser (localStorage), so no account is
 * needed. Names and prices here are only for display: the server reads the
 * real prices from the database again at checkout.
 */
export type CartItem = {
  slug: string
  name: string
  sizeLabel: string
  priceKes: number
  image: string
  quantity: number
}

type CartState = {
  items: Array<CartItem>
  drawerOpen: boolean
  /** False until the saved cart has been read from localStorage */
  ready: boolean
}

export const MAX_QUANTITY = 10
const STORAGE_KEY = 'rls-cart-v1'

export const cartStore = new Store<CartState>({
  items: [],
  drawerOpen: false,
  ready: false,
})

function clamp(quantity: number) {
  return Math.max(1, Math.min(MAX_QUANTITY, Math.round(quantity)))
}

function save(items: Array<CartItem>) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
  } catch {
    // Private browsing or storage full: the cart still works for this visit.
  }
}

function setItems(update: (items: Array<CartItem>) => Array<CartItem>) {
  cartStore.setState((state) => {
    const items = update(state.items)
    save(items)
    return { ...state, items }
  })
}

/** Read the saved cart. Called once in the browser when the site loads. */
export function loadCart() {
  if (cartStore.state.ready) return
  let items: Array<CartItem> = []
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]')
    if (Array.isArray(saved)) {
      items = saved.filter(
        (item) =>
          typeof item?.slug === 'string' &&
          typeof item?.name === 'string' &&
          typeof item?.priceKes === 'number' &&
          typeof item?.quantity === 'number',
      )
    }
  } catch {
    // Unreadable saved cart: start empty.
  }
  cartStore.setState((state) => ({ ...state, items, ready: true }))
}

export function addToCart(product: Product, quantity = 1) {
  const image = primaryImage(product)
  setItems((items) => {
    const existing = items.find((item) => item.slug === product.slug)
    if (existing) {
      return items.map((item) =>
        item.slug === product.slug
          ? { ...item, quantity: clamp(item.quantity + quantity) }
          : item,
      )
    }
    return [
      ...items,
      {
        slug: product.slug,
        name: product.name,
        sizeLabel: product.sizeLabel,
        priceKes: product.priceKes,
        image: `${image.src}-${image.widths[0]}.webp`,
        quantity: clamp(quantity),
      },
    ]
  })
  setDrawerOpen(true)
}

export function setQuantity(slug: string, quantity: number) {
  setItems((items) =>
    items.map((item) =>
      item.slug === slug ? { ...item, quantity: clamp(quantity) } : item,
    ),
  )
}

export function removeFromCart(slug: string) {
  setItems((items) => items.filter((item) => item.slug !== slug))
}

export function clearCart() {
  setItems(() => [])
}

export function setDrawerOpen(drawerOpen: boolean) {
  cartStore.setState((state) => ({ ...state, drawerOpen }))
}

export function cartSubtotal(items: Array<CartItem>) {
  return items.reduce((sum, item) => sum + item.priceKes * item.quantity, 0)
}

export function cartCount(items: Array<CartItem>) {
  return items.reduce((sum, item) => sum + item.quantity, 0)
}

const NO_ITEMS: Array<CartItem> = []

/**
 * Read from the cart in a component. While the server-rendered page is being
 * taken over by the browser, components see the empty server value, so the
 * two always match; the saved cart appears straight after.
 */
function useCart<T>(select: (state: CartState) => T, serverValue: T) {
  return useSyncExternalStore(
    (onChange) => {
      const subscription = cartStore.subscribe(onChange)
      return () => subscription.unsubscribe()
    },
    () => select(cartStore.state),
    () => serverValue,
  )
}

export const useCartItems = () => useCart((state) => state.items, NO_ITEMS)
export const useCartReady = () => useCart((state) => state.ready, false)
export const useDrawerOpen = () => useCart((state) => state.drawerOpen, false)
