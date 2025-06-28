// Update this version number whenever you want to force cache updates
const CACHE_VERSION = 'v2'; // Change this when you update your app
const STATIC_CACHE = `static-cache-${CACHE_VERSION}`;
const SHARE_CACHE = 'share-cache';
const OFFLINE_URL = '/offline.html';

// Install event - cache essential resources
self.addEventListener('install', (event) => {
  console.log('[SW] Installing version:', CACHE_VERSION);
  
  event.waitUntil(
    (async () => {
      const cache = await caches.open(STATIC_CACHE);
      
      try {
        // Cache the main page
        const response = await fetch('/');
        if (response.ok) {
          await cache.put('/', response.clone());
        } else {
          console.warn('[SW] Skipped caching `/`: bad response', response.status);
        }
        
        // Cache offline page
        await cache.add(OFFLINE_URL);
        
        console.log('[SW] Install complete');
      } catch (err) {
        console.warn('[SW] Failed during install:', err);
      }
    })()
  );
  
  // Force the waiting service worker to become the active service worker
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating version:', CACHE_VERSION);
  
  event.waitUntil(
    (async () => {
      // Delete old caches
      const cacheNames = await caches.keys();
      const deletePromises = cacheNames
        .filter(name => (name.startsWith('static-cache-') && name !== STATIC_CACHE))
        .map(name => {
          console.log('[SW] Deleting old cache:', name);
          return caches.delete(name);
        });
      
      await Promise.all(deletePromises);
      
      // Take control of all clients immediately
      await self.clients.claim();
      
      console.log('[SW] Activation complete');
    })()
  );
});

// Fetch event - handle requests
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Share Target POST handler
  if (request.method === 'POST' && url.pathname.startsWith('/share-target')) {
    event.respondWith(
      (async () => {
        try {
          const formData = await request.formData();
          const cache = await caches.open(SHARE_CACHE);
          const shareId = Date.now().toString();

          const files = formData.getAll('files');
          
          const filePromises = files.map(async (file, i) => {
              const fileUrl = `/share-cache/${shareId}/file${i}`;
              await cache.put(fileUrl, new Response(file));
              return { url: fileUrl, name: file.name, type: file.type };
          });
          const fileInfos = await Promise.all(filePromises);

          const meta = {
              title: formData.get('title') || '',
              text: formData.get('text') || '',
              url: formData.get('url') || '',
              files: fileInfos
          };
          
          const metaUrl = `/share-cache/${shareId}/meta`;
          await cache.put(metaUrl, new Response(JSON.stringify(meta)));

          return Response.redirect(`/share-receiver?shareId=${shareId}`, 303);
        } catch(e) {
            console.error('[SW] Share target failed:', e);
            // Redirect to home on failure to provide user feedback
            return Response.redirect('/', 303);
        }
      })()
    );
    return;
  }

  // Handle navigation requests (HTML pages)
  if (request.mode === 'navigate') {
    event.respondWith(
      (async () => {
        try {
          // Try network first
          const networkResponse = await fetch(request);
          
          // If successful, update cache and return response
          if (networkResponse.ok) {
            const cache = await caches.open(STATIC_CACHE);
            cache.put(request, networkResponse.clone());
            return networkResponse;
          }
        } catch (error) {
          console.log('[SW] Network failed for navigation, falling back to cache');
        }
        
        // Network failed, try cache
        const cache = await caches.open(STATIC_CACHE);
        const cachedResponse = await cache.match(request);
        
        if (cachedResponse) {
          return cachedResponse;
        }
        
        // If no cache match, try root page
        const rootResponse = await cache.match('/');
        if (rootResponse) {
          return rootResponse;
        }
        
        // Last resort: offline page
        return cache.match(OFFLINE_URL);
      })()
    );
    return;
  }

  // Handle static assets (CSS, JS, images, etc.)
  if (
    request.method === 'GET' &&
    url.origin === location.origin &&
    (
      /^\/_next\/static\/.*/.test(url.pathname) ||
      /\.(css|js|png|jpg|jpeg|gif|svg|woff|woff2|ttf|eot)$/.test(url.pathname)
    )
  ) {
    event.respondWith(
      (async () => {
        const cache = await caches.open(STATIC_CACHE);
        
        try {
          // Try network first for better cache invalidation
          const networkResponse = await fetch(request);
          
          if (networkResponse.ok) {
            // Cache the new response
            cache.put(request, networkResponse.clone());
            return networkResponse;
          }
        } catch (error) {
          console.log('[SW] Network failed for static asset, trying cache');
        }
        
        // Network failed, try cache
        const cachedResponse = await cache.match(request);
        if (cachedResponse) {
          return cachedResponse;
        }
        
        // If no cache and no network, return offline page for critical resources
        return cache.match(OFFLINE_URL);
      })()
    );
  }
});

// Handle service worker updates
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
