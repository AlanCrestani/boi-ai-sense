// Service Worker for asset caching and performance optimization
const CACHE_NAME = 'conectaboi-v1';
const STATIC_CACHE_NAME = 'conectaboi-static-v1';

// Assets to cache immediately
const STATIC_ASSETS = [
  '/',
  '/src/main.tsx',
  '/placeholder.svg',
  'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap'
];

// Cache strategies for different resource types
const CACHE_STRATEGIES = {
  images: 'cache-first',
  fonts: 'cache-first',
  scripts: 'stale-while-revalidate',
  stylesheets: 'stale-while-revalidate',
  api: 'network-first'
};

// Install event - cache static assets
self.addEventListener('install', event => {
  console.log('Service Worker installing...');

  event.waitUntil(
    caches.open(STATIC_CACHE_NAME)
      .then(cache => {
        console.log('Caching static assets...');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => {
        console.log('Static assets cached successfully');
        return self.skipWaiting();
      })
      .catch(err => {
        console.error('Failed to cache static assets:', err);
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', event => {
  console.log('Service Worker activating...');

  event.waitUntil(
    caches.keys()
      .then(cacheNames => {
        return Promise.all(
          cacheNames.map(cacheName => {
            if (cacheName !== CACHE_NAME && cacheName !== STATIC_CACHE_NAME) {
              console.log('Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        console.log('Service Worker activated');
        return self.clients.claim();
      })
  );
});

// Fetch event - implement caching strategies
self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  // Skip chrome-extension and other non-http requests
  if (!url.protocol.startsWith('http')) {
    return;
  }

  // Skip API calls to Supabase (let them handle their own caching)
  if (url.hostname.includes('supabase')) {
    return;
  }

  // Determine cache strategy based on resource type
  let strategy = 'network-first'; // default

  if (request.destination === 'image') {
    strategy = CACHE_STRATEGIES.images;
  } else if (request.destination === 'font') {
    strategy = CACHE_STRATEGIES.fonts;
  } else if (request.destination === 'script') {
    strategy = CACHE_STRATEGIES.scripts;
  } else if (request.destination === 'style') {
    strategy = CACHE_STRATEGIES.stylesheets;
  }

  event.respondWith(handleRequest(request, strategy));
});

// Handle requests based on strategy
async function handleRequest(request, strategy) {
  const cache = await caches.open(CACHE_NAME);

  switch (strategy) {
    case 'cache-first':
      return cacheFirst(request, cache);
    case 'network-first':
      return networkFirst(request, cache);
    case 'stale-while-revalidate':
      return staleWhileRevalidate(request, cache);
    default:
      return fetch(request);
  }
}

// Cache-first strategy (good for images, fonts)
async function cacheFirst(request, cache) {
  try {
    const cachedResponse = await cache.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }

    const networkResponse = await fetch(request);
    if (networkResponse.status === 200) {
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    console.error('Cache-first strategy failed:', error);
    return new Response('Network error', { status: 503 });
  }
}

// Network-first strategy (good for API calls, dynamic content)
async function networkFirst(request, cache) {
  try {
    const networkResponse = await fetch(request);
    if (networkResponse.status === 200) {
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    console.warn('Network failed, trying cache:', error);
    const cachedResponse = await cache.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    return new Response('Network error and no cache available', { status: 503 });
  }
}

// Stale-while-revalidate strategy (good for scripts, stylesheets)
async function staleWhileRevalidate(request, cache) {
  const cachedResponse = await cache.match(request);

  const fetchPromise = fetch(request).then(networkResponse => {
    if (networkResponse.status === 200) {
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  }).catch(error => {
    console.warn('Background fetch failed:', error);
  });

  return cachedResponse || fetchPromise;
}

// Background sync for offline functionality (future enhancement)
self.addEventListener('sync', event => {
  if (event.tag === 'background-sync') {
    console.log('Background sync triggered');
    // Implement background sync logic here
  }
});

// Push notifications (future enhancement)
self.addEventListener('push', event => {
  if (event.data) {
    const data = event.data.json();
    console.log('Push notification received:', data);
    // Implement push notification logic here
  }
});