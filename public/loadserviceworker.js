if ("serviceWorker" in navigator) {
  if (window.location.hostname.indexOf("localhost") === -1) {
    window.addEventListener("load", () => {
      navigator.serviceWorker.register("/serviceworker.js").then(
        (registration) => {
          console.log("Service worker registered: ", registration);
        },
      ).catch((error) => {
        console.log("Service worker registration failed: ", error);
      });
    });
  }
}
