# NicoGallery Management Tools - Development Handoff

## 1. Project Goal
Build a dedicated, independent management tool ecosystem under the `manage/` directory to handle photo uploads, EXIF metadata extraction, WebP image compression, Cloudflare R2 uploads, and local database (`data/gallery.json`) updates for the NicoGallery project.

## 2. Architecture & Tech Stack

### `manage/cli` (Command Line Interface)
*   **Purpose**: Designed for automated scripts, CI/CD, and batch processing.
*   **Language**: Go (Golang).
*   **Framework**: `spf13/cobra`.
*   **Features**: Extract EXIF data natively, compress images, upload to R2, and update the JSON database locally.

### `manage/web` (Web Dashboard)
*   **Purpose**: Designed for human users to manually fill in extensive metadata (Story/Description, Tags, Albums) and visually upload photos.
*   **Tech Stack**: Vite + React + TypeScript (Identical to the main NicoGallery system).
*   **UI Framework**: Material UI (MUI) v5.
*   **Design Constraints**: **Must strictly replicate the main system's Material Design 3 style.** The `theme.ts` from the main system must be reused to ensure 100% aesthetic consistency (fonts, dark mode, border radii, blurred app bars).
*   **Backend Support**: Requires a lightweight local API server (Node.js/Express or Go) to handle the actual file processing (`sharp`), EXIF extraction, and file system writes to `data/gallery.json`, as a pure Vite SPA cannot interact with the local file system.

## 3. Current State
*   The repository has been **hard-reset** to the stable main branch (`origin/master`).
*   All previous Next.js scaffolding attempts and experimental scripts have been completely removed due to dependency issues and styling conflicts.
*   The workspace is clean and ready for a fresh start.

## 4. Pending Development Tasks (Next Steps)

1.  **Initialize `manage/web` (Frontend)**:
    *   Run `create-vite` to scaffold a React+TS project.
    *   Install MUI dependencies (`@mui/material`, `@emotion/react`, `@emotion/styled`, `@mui/icons-material`).
    *   Port over the `src/theme.ts` from the root project.
    *   Build the premium UI: Drag-and-drop upload zone, image preview, and structured metadata input fields.

2.  **Initialize Local API Server for `manage/web`**:
    *   Set up a simple Express.js or Hono backend.
    *   Implement the `/upload` endpoint.
    *   Integrate `sharp` for WebP conversion and resizing.
    *   Integrate `exifreader` for metadata extraction.
    *   Implement S3 upload logic to Cloudflare R2.
    *   Update `data/gallery.json` upon successful upload.

3.  **Initialize `manage/cli`**:
    *   Run `go mod init`.
    *   Set up Cobra CLI structure.
    *   Implement the CLI logic for the exact same upload pipeline as the Web Dashboard.
