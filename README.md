# Mini ALPS: Your Personal Knowledge Vault

Welcome to Mini ALPS (A Little Personal Storage), your private, offline-first personal knowledge vault designed to capture, organize, and connect your ideas without compromise. Everything you store is saved directly in your browser—nothing is ever sent to a server.

## Key Features

-   **Capture Everything**: Save notes with Markdown, import articles from URLs, create color palettes from hex codes, save quotes, track GitHub repos, and upload images, videos, audio, and other files.
-   **Offline-First & PWA**: Works seamlessly without an internet connection. Install it on your desktop or mobile device for a native-app experience.
-   **Spaces for Organization**: Group related artifacts into "Spaces." Create "Smart Spaces" that automatically organize artifacts by tags.
-   **Connect Your Ideas**:
    -   **Anchors**: Create named groups of related artifacts, perfect for managing projects or topics.
    -   **Wiki Links**: Directly link between notes using `[[artifact-id]]` syntax to build your personal knowledge graph.
-   **Powerful Search**: Instantly find what you need by searching content, titles, or tags. Use special keywords (`fav`, `trash`, `image`) and time-based queries (`yesterday`, `last month`) to filter your results.
-   **Privacy by Design**: Your data lives only on your device in your browser's local storage. You have full control.
-   **Import & Export**: Easily back up your entire vault to a JSON file or import a backup to a new device.

## Getting Started

1.  **Create Your First Artifact**: Click the `+` button to get started.
    -   **Paste a URL** (e.g., `example.com`) to import an article or a GitHub repository.
    -   **Paste a hex code** (e.g., `#D45715`) to create a color swatch.
    -   **Start typing** to create a note using Markdown.
2.  **Organize with Spaces**: Navigate to the "Spaces" view and create your first Space. Make it a "Smart Space" by adding tags to automatically pull in relevant artifacts.
3.  **Connect Your Notes**:
    -   Go to the "Anchors" view to link multiple artifacts under a single topic.
    -   In any note, type `[[` and paste an artifact's ID to create a direct link to it. You can copy an artifact's ID from its viewer or by right-clicking its card.
4.  **Explore the Help Menu**: Click the `?` icon in the sidebar for a detailed guide on all features.

## Tech Stack

This application is built with modern web technologies:

-   [Next.js](https://nextjs.org/) (React Framework)
-   [React](https://react.dev/)
-   [Tailwind CSS](https://tailwindcss.com/)
-   [ShadCN UI](https://ui.shadcn.com/) (Component Library)
-   [IndexedDB](https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API) (for local storage)
-   [Workbox](https://developer.chrome.com/docs/workbox) (for PWA service worker)

---

Enjoy building your personal knowledge vault!
