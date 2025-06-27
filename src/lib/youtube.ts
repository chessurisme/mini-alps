

export async function getYouTubeThumbnail(url: string): Promise<string | null> {
	const videoId = extractYouTubeID(url);
	if (!videoId) return null;

	const base = `https://img.youtube.com/vi/${videoId}/`;
	const resolutions = [
		'maxresdefault.jpg',
		'sddefault.jpg',
		'hqdefault.jpg',
		'mqdefault.jpg',
		'default.jpg',
	];

	for (const res of resolutions) {
		const thumbUrl = base + res;
		try {
			const response = await fetch(thumbUrl);
			if (response.ok) {
                const blob = await response.blob();
                if (blob.size > 1000) { // Placeholder thumbnail is about 1KB
				    return thumbUrl;
                }
			}
		} catch (error) {
            console.warn(`Could not fetch YouTube thumbnail ${thumbUrl}:`, error);
        }
	}

	return `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`; // Fallback to a guaranteed resolution
}

export function extractYouTubeID(url: string): string | null {
	if (!url) return null;
	const regExp = /^.*(youtu\.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
	const match = url.match(regExp);
	if (match && match[2].length === 11) {
		return match[2];
	}
	// Fallback for just ID pasted
	if (url.length === 11 && !url.match(/[^a-zA-Z0-9_-]/)) {
		return url;
	}
	return null;
}

export async function getYouTubeTitle(url: string): Promise<string | null> {
	const oembedUrl = `https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`;
	try {
		const res = await fetch(oembedUrl);
		if (!res.ok) throw new Error('Not a valid YouTube video');
		const data = await res.json();
		return data.title;
	} catch (err) {
		console.error(err);
		return null;
	}
}
