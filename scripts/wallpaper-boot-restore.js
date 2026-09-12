function installBootRestore(wallpaper) {
  /* dsh-wallpaper-boot-retry-v1 */
  let disposed = false;
  let busy = false;
  let restored = null;
  let requested = null;
  let attempts = 0;
  let timer = null;
  const controller = new AbortController();
  const restore = async () => {
    if (disposed || busy) return;
    const selected = wallpaper.selection();
    if (selected !== requested) {
      requested = selected;
      attempts = 0;
      if (timer !== null) clearTimeout(timer);
      timer = null;
    }
    if (!selected || restored === selected || attempts >= 7) return;
    busy = true;
    attempts += 1;
    try {
      const response = await fetch('/api/skin-center/we/inventory', {
        cache: 'no-store',
        signal: AbortSignal.any([controller.signal, AbortSignal.timeout(10000)])
      });
      if (!response.ok) throw new Error('wallpaper-inventory-unavailable');
      const payload = await response.json();
      if (disposed || wallpaper.selection() !== selected) return;
      if (payload?.ok !== true || !Array.isArray(payload.wallpapers)) throw new Error('wallpaper-inventory-invalid');
      const match = resolveSelection(payload.wallpapers, selected);
      if (!match) throw new Error('wallpaper-inventory-pending');
      wallpaper.sync(match);
      restored = selected;
    } catch {
      // A cold host can become ready after the first inventory request.
    } finally {
      busy = false;
      if (!disposed && wallpaper.selection() !== selected) {
        void restore();
      } else if (!disposed && restored !== selected && attempts < 7) {
        timer = setTimeout(() => { timer = null; void restore(); }, Math.min(1000 * 2 ** (attempts - 1), 15000));
      }
    }
  };
  const unsubscribe = wallpaper.subscribe(() => { void restore(); });
  void restore();
  return () => {
    disposed = true;
    controller.abort();
    if (timer !== null) clearTimeout(timer);
    unsubscribe();
  };
}
