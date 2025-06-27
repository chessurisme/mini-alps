self.addEventListener("fetch", (event) => {
	const { request } = event;
	const url = new URL(request.url);

	if (request.mode === "navigate") {
		event.respondWith(
			fetch(request).catch(async () => {
				const cache = await caches.open("static-cache-v1");

				const match = await cache.match("/");
				return match || (await cache.match("/offline.html"));
			})
		);
		return;
	}

	if (
		request.method === "GET" &&
		url.origin === location.origin &&
		/^\/_next\/static\/.*/.test(url.pathname)
	) {
		event.respondWith(
			caches.open("static-cache-v1").then((cache) =>
				cache.match(request).then((cached) => {
					return fetch(request)
						.then((response) => {
							if (response.ok && response.status === 200) {
								cache.put(request, response.clone());
							} else {
								console.warn("[SW] Skipped caching bad response:", request.url);
							}
							return response;
						})
						.catch(() => cached || caches.match("/offline.html"));
				})
			)
		);
	}
});

self.addEventListener("install", (event) => {
	event.waitUntil(
		(async () => {
			const cache = await caches.open("static-cache-v1");

			try {
				const response = await fetch("/");
				if (response.ok) {
					await cache.put("/", response.clone());
				} else {
					console.warn(
						"[SW] Skipped caching `/`: bad response",
						response.status
					);
				}
			} catch (err) {
				console.warn("[SW] Failed to fetch `/` during install:", err);
			}

			await cache.add("/offline.html");
		})()
	);
	self.skipWaiting();
});
