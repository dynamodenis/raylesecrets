import { useState } from 'react'

import { QuantityStepper } from '#/components/cart-lines'
import { MAX_QUANTITY, addToCart } from '#/lib/cart'

import type { Product } from '#/data/catalog'

/** Quantity picker and Add to cart button on the product page. */
export function AddToCart({ product }: { product: Product }) {
  const [quantity, setQuantity] = useState(1)
  const max = Math.min(MAX_QUANTITY, product.stock)

  return (
    <div className="flex flex-wrap items-center gap-3">
      <QuantityStepper
        value={quantity}
        onChange={setQuantity}
        label={product.name}
        max={max}
      />
      <button
        type="button"
        className="btn btn-primary flex-1 sm:flex-none"
        onClick={() => {
          addToCart(product, quantity)
          setQuantity(1)
        }}
      >
        Add to cart
      </button>
    </div>
  )
}
