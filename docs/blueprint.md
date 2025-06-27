# **App Name**: Mini ALPS: Your Personal Knowledge Vault

## Core Features:

- Artifact Saver: Save various artifact types (`notes`, `color`, `articles`, `image`, `video`, `audio`) to a local database (IDB) using reign-idb.
- Notes Creator: Create and edit notes using the milkdown editor. Save notes as `note` by default, or as `color` if a color hex code is detected.
- Link Fetcher: Fetch data from dropped links. If an image, video, article, audio, or app is posted in editor, the tool checks website configs (rewrite medium), and then parses via mercury parser, and then cached in IDB. It is a note by default upon content failure.
- Offline Reading: Access saved content while offline. Fetched content is cached for offline reading.
- Export Function: Export all artifacts from IDB as an SQLite file.
- Import Function: Import an SQLite file to load artifacts into IDB and update the UI.
- Artifact Anchoring: Save artifact to reference as reference manager. User can create multiple ID when there's is the similar artifacts, displayed in Anchor Page, clicking id will direct to artifacts
- Pinning, Favoriting, and Trashing: Pin or favorite artifacts for quick access and prevent accidental permanent deletions with a trash bin.
- Artifact Cards: Display artifacts in visually appealing cards. Each card represents an artifact and provides a preview of its content. Design inspired by attached image.
- Zettelkasten Notes: Notes as Zettelkasten inspired - ID styled by Fira Code Mono, Tags creator, and support wiki `[[]]` to backlink in `milkdown`.
- Search functionality: Notes can searched by tags, content, title, id, time, and more

## Style Guidelines:

- Primary color: Burnt sienna (#D45715) evokes warmth and creativity.
- Background color: Eggshell (#F9F3EF) for a soft, unobtrusive backdrop.
- Secondary color: Taupe (#E6D9CE) offers a subtle, natural contrast.
- Body font: 'Inter' (sans-serif) for clear and modern readability. Note: currently only Google Fonts are supported.
- Heading font: 'Libre Baskerville' (serif) for elegant headlines. Note: currently only Google Fonts are supported.
- Code/ID font: 'Fira Code Mono' (monospace) for IDs and code snippets. Note: currently only Google Fonts are supported.
- Use a Pinterest-style masonry layout for displaying artifacts. Use full screen when editing notes. Follow SPA with two main tabs for artifacts (amphora icon) and Anchor (anchor icon)
- Subtle animations with a cubic-bezier(0.215, 0.61, 0.355, 1) curve for smooth transitions.