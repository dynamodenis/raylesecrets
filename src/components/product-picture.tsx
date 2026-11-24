import type { ProductImage } from '#/data/catalog'

type Props = {
  image: ProductImage
  /** The `sizes` attribute: how wide the image is shown at each screen size */
  sizes: string
  /** Set for the first image on the page so it loads straight away */
  priority?: boolean
  className?: string
}

/** A responsive product image. The browser picks the smallest file that fits. */
export function ProductPicture({
  image,
  sizes,
  priority = false,
  className,
}: Props) {
  const largest = image.widths[image.widths.length - 1]
  return (
    <img
      src={`${image.src}-${largest}.webp`}
      srcSet={image.widths
        .map((w) => `${image.src}-${w}.webp ${w}w`)
        .join(', ')}
      sizes={sizes}
      width={image.width}
      height={image.height}
      alt={image.alt}
      loading={priority ? 'eager' : 'lazy'}
      fetchPriority={priority ? 'high' : 'auto'}
      decoding="async"
      className={className}
    />
  )
}
