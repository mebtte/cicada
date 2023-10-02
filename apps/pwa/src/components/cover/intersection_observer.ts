const map = new window.WeakMap<Element, () => void>();

const intersectionObserver = new window.IntersectionObserver((entries) => {
  for (const entry of entries) {
    if (entry.isIntersecting) {
      map.get(entry.target)?.();
    }
  }
});

export default {
  observe: (target: Element, callback: () => void) => {
    map.set(target, callback);
    intersectionObserver.observe(target);
    return () => {
      map.delete(target);
      return intersectionObserver.unobserve(target);
    };
  },
};
