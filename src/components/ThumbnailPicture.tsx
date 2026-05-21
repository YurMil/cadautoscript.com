import React from 'react';

type ThumbnailPictureProps = {
  /** Path to the original thumbnail (e.g. "/img/utilities/foo.png"). */
  src: string;
  alt: string;
  className?: string;
  width?: number;
  height?: number;
  loading?: 'lazy' | 'eager';
  decoding?: 'async' | 'auto' | 'sync';
};

/**
 * Renders a <picture> with WebP variants when the source is a utility PNG
 * for which scripts/optimize-thumbnails.js has produced downscaled siblings.
 * Falls back to a plain <img> for SVGs or any path that doesn't match the
 * `/img/utilities/<slug>.png` convention. Browsers without WebP support fall
 * back to the original PNG automatically.
 */
export default function ThumbnailPicture({
  src,
  alt,
  className,
  width,
  height,
  loading = 'lazy',
  decoding = 'async',
}: ThumbnailPictureProps): React.JSX.Element {
  const match = src.match(/^(\/img\/utilities\/)([^/]+)\.png$/i);

  if (!match) {
    return (
      <img
        src={src}
        alt={alt}
        className={className}
        width={width}
        height={height}
        loading={loading}
        decoding={decoding}
      />
    );
  }

  const [, base, slug] = match;
  const webp1x = `${base}cards/${slug}.webp`;
  const webp2x = `${base}cards/${slug}@2x.webp`;

  return (
    // display: contents keeps the <picture> transparent in layout so any flex/grid
    // sizing applied to the img (e.g. width: 100% of an absolutely-sized parent)
    // continues to work as it did before the wrapper was introduced.
    <picture style={{display: 'contents'}}>
      <source type="image/webp" srcSet={`${webp1x} 1x, ${webp2x} 2x`} />
      <img
        src={src}
        alt={alt}
        className={className}
        width={width}
        height={height}
        loading={loading}
        decoding={decoding}
      />
    </picture>
  );
}
