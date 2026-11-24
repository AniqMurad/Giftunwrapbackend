export const normalizeRingSizing = (product) => {
  const mode = product.ringSizeMode || 'none';
  if (!['none', 'adjustable', 'available'].includes(mode)) return 'Choose a valid ring sizing option.';
  product.ringSizeMode = mode;
  if (mode === 'adjustable') {
    product.showSizeOptions = false;
    product.sizeOptions = [];
  } else if (mode === 'available') {
    const sizes = Array.isArray(product.sizeOptions) ? product.sizeOptions : [];
    if (!sizes.length) return 'Add at least one available ring size.';
    const names = new Set();
    for (const size of sizes) {
      const name = String(typeof size === 'string' ? size : size?.name || size?.size || '').trim();
      const price = Number(typeof size === 'string' ? product.price : size?.price);
      if (!name || name.length > 50 || !Number.isFinite(price) || price <= 0) return 'Enter a size label (up to 50 characters) and a valid price for every ring size.';
      if (names.has(name.toLowerCase())) return 'Ring sizes must be unique.';
      names.add(name.toLowerCase());
    }
    product.showSizeOptions = true;
  }
  return '';
};
