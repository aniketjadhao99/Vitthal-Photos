export const isS3ImageUrl = (url) => {
  return typeof url === 'string' && /https?:\/\/(?:[\w.-]+\.)?amazonaws\.com\//.test(url);
};

export const normalizeImageUrl = (url) => {
  if (!url || typeof url !== 'string') return url;
  if (isS3ImageUrl(url)) {
    return `/api/upload/proxy?url=${encodeURIComponent(url)}`;
  }
  return url;
};

export const normalizeProductImage = (product) => {
  if (!product || typeof product !== 'object') return product;
  return {
    ...product,
    image: normalizeImageUrl(product.image),
    images: Array.isArray(product.images) ? product.images.map(normalizeImageUrl) : product.images,
  };
};
