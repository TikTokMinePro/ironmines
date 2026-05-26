document.addEventListener("DOMContentLoaded", () => {
  /**
   * ================================
   * UTIL
   * ================================
   */
  function appendParams(url) {
    try {
      const currentParams = new URLSearchParams(window.location.search);
      const target = new URL(url, window.location.origin);

      let changed = false;

      currentParams.forEach((value, key) => {
        if (!target.searchParams.has(key)) {
          target.searchParams.set(key, value);
          changed = true;
        }
      });

      return changed ? target.toString() : url;
    } catch (e) {
      return url;
    }
  }

  /**
   * ================================
   * 1. PERSISTÊNCIA + REIDRATAÇÃO
   * ================================
   */
  function e() {
    const params = new URLSearchParams(window.location.search);
    const b4f = params.get("b4f");

    if (b4f) {
      localStorage.setItem("b4f", b4f);
    } else {
      const stored = localStorage.getItem("b4f");

      if (stored && !params.has("b4f")) {
        params.set("b4f", stored);

        window.history.replaceState(
          {},
          "",
          `${window.location.pathname}?${params}${window.location.hash || ""}`
        );
      }
    }
  }

  /**
   * ================================
   * 2. ATUALIZA LINKS (<a>)
   * ================================
   */
  function t() {
    const params = new URLSearchParams(window.location.search);
    if (!params.toString()) return;

    document.querySelectorAll("a[href]").forEach((el) => {
      try {
        const href = el.getAttribute("href");

        if (!href || href.startsWith("#")) return;

        const newUrl = appendParams(href);

        if (newUrl !== href) {
          el.setAttribute("href", newUrl);
        }
      } catch (err) {}
    });
  }

  /**
   * ================================
   * 3. INTERCEPTA window.open 🔥
   * ================================
   */
  const originalOpen = window.open;
  window.open = function (url, ...args) {
    return originalOpen.call(this, appendParams(url), ...args);
  };

  /**
   * ================================
   * 4. INTERCEPTA redirects JS 🔥
   * ================================
   */
  const originalAssign = window.location.assign;
  window.location.assign = function (url) {
    return originalAssign.call(window.location, appendParams(url));
  };

  const originalReplace = window.location.replace;
  window.location.replace = function (url) {
    return originalReplace.call(window.location, appendParams(url));
  };

  /**
   * ================================
   * INIT
   * ================================
   */
  e();
  t();

  const observer = new MutationObserver(() => t());

  observer.observe(document.body, {
    childList: true,
    subtree: true,
  });
});