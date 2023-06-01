self.addEventListener('fetch', event => {
  const url = new URL(event.request.url)

  // these files will not be cached at all
  if (
    url.protocol === 'chrome-extension:'
    || url.pathname === "/_frsh/alive"
    || url.pathname === "/_frsh/refresh.js"
  ) {
    event.respondWith(fetch(event.request))
    return
  } 
  
  // Otherwise, cache the response and return it
  event.respondWith(
    caches.open('my-cache').then(cache => {
      return cache.match(event.request).then(response => {
        return response || fetch(event.request).then(response => {
          cache.put(event.request, response.clone())
          return response
        })
      })
    })
  )

})