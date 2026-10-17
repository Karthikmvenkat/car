/** Upgrade known directory thumbnails without changing arbitrary external URLs. */
export function fullSizePhoto(raw: string | null | undefined): string | null {
  if (!raw) return null;
  try {
    const url = new URL(raw);
    if (url.protocol === 'https:' && url.hostname === 'stimg.cardekho.com') {
      // Some directory records contain stray quoting, a repeated path, or .jp.
      url.pathname = url.pathname.replace(/^\/(?:%22|%60)+images\//i, '/images/').replace(/(?:%22|%60)+$/i, '').replace(/\.jpgimages\/.*$/i, '.jpg').replace(/\.jp$/i, '.jpg');
      // This legacy Flying Spur collection has only 500px originals; its
      // advertised 930px variants return 404. Preserve the working source.
      if (/\/Bentley\/Bentley-Flying-Spur\//.test(url.pathname)) {
        url.pathname = url.pathname.replace('/930x620/', '/large/');
        return url.toString();
      }
      url.pathname = url.pathname.replace(/^\/images\/car-images\/(?:large|360x240|630x420)\//, '/images/car-images/930x620/');
      return url.toString();
    }
  } catch { /* Relative upload URLs remain unchanged. */ }
  return raw;
}
