if ("serviceWorker" in navigator) {
  const hostname = window.location.hostname;
  const isLocalHost =
    hostname === "localhost" ||
    hostname === "127.0.0.1" ||
    hostname === "::1";

  window.addEventListener("load", async () => {
    if (isLocalHost) {
      let shouldReload = false;

      const registrations = await navigator.serviceWorker.getRegistrations();
      if (registrations.length > 0) {
        await Promise.all(registrations.map(registration => registration.unregister()));
        shouldReload = true;
      }

      if ("caches" in window) {
        const cacheKeys = await caches.keys();
        if (cacheKeys.length > 0) {
          await Promise.all(cacheKeys.map(cacheKey => caches.delete(cacheKey)));
          shouldReload = true;
        }
      }

      if (shouldReload && sessionStorage.getItem("local-sw-reset") !== "done") {
        sessionStorage.setItem("local-sw-reset", "done");
        window.location.reload();
        return;
      }

      sessionStorage.removeItem("local-sw-reset");
      return;
    }

    navigator.serviceWorker.register("/serviceworker.js").then(
      registration => {
        console.log("Service worker registered: ", registration);
      },
    ).catch(error => {
      console.log("Service worker registration failed: ", error);
    });
  });
}
