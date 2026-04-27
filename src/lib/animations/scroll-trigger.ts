// IntersectionObserver wrapper for one-shot scroll-triggered scenes.

export function observeOnce(
  el: Element,
  init: IntersectionObserverInit = { rootMargin: "-100px", threshold: 0 },
): Promise<void> {
  return new Promise((resolve) => {
    if (typeof IntersectionObserver === "undefined") {
      resolve();
      return;
    }
    const io = new IntersectionObserver(
      (entries, observer) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            observer.disconnect();
            resolve();
            return;
          }
        }
      },
      init,
    );
    io.observe(el);
  });
}
