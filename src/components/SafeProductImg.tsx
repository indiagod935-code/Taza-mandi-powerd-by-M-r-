import React, { useState, useEffect, useRef } from 'react';
import { Smartphone } from 'lucide-react';
import { resolveProductVisualAsset, ResolvableProduct } from '../utils/productVisualMapper';
import { getProduceVisualSpec } from '../utils/produceArtwork';

interface SafeProductImgProps {
  product: ResolvableProduct | string;
  alt: string;
  className?: string;
  isAccessory?: boolean;
}

export const SafeProductImg: React.FC<SafeProductImgProps> = ({
  product,
  alt,
  className = 'w-10 h-10 rounded-lg object-cover',
  isAccessory = false,
}) => {
  const src = resolveProductVisualAsset(product);
  const [failed, setFailed] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const imgRef = useRef<HTMLImageElement | null>(null);

  useEffect(() => {
    setFailed(false);
    const el = imgRef.current;
    if (el && el.complete && el.naturalWidth > 0) {
      setLoaded(true);
    } else {
      setLoaded(false);
    }
  }, [src]);

  if (!src || failed) {
    if (isAccessory) {
      return (
        <div
          className={`${className} bg-linear-to-br from-slate-800 to-slate-900 text-emerald-400 flex items-center justify-center shrink-0`}
          role="img"
          aria-label={alt}
        >
          <Smartphone className="w-1/2 h-1/2" />
        </div>
      );
    }

    const id = typeof product === 'string' ? product : product?.id || '';
    const category = typeof product === 'object' && product ? product.category || 'vegetables' : 'vegetables';
    const spec = getProduceVisualSpec(id, category, alt);

    return (
      <div
        className={`${className} bg-linear-to-br ${spec.bgGradient} text-white flex items-center justify-center shrink-0 select-none`}
        role="img"
        aria-label={alt}
      >
        <span className="text-base leading-none drop-shadow-xs">{spec.emoji}</span>
      </div>
    );
  }

  return (
    <span className={`relative inline-block overflow-hidden shrink-0 ${className}`}>
      {!loaded && (
        <span
          className="absolute inset-0 skeleton-shimmer block"
          aria-hidden="true"
        />
      )}
      <img
        ref={imgRef}
        src={src}
        alt={alt}
        loading="lazy"
        decoding="async"
        onLoad={() => setLoaded(true)}
        onError={() => {
          setLoaded(true);
          setFailed(true);
        }}
        className={`w-full h-full object-cover transition-opacity duration-300 ${
          loaded ? 'opacity-100' : 'opacity-0'
        }`}
      />
    </span>
  );
};

