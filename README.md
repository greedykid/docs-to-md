# DocxToMarkdown - Native Web Converter

**DocxToMarkdown** is a professional, pure client-side web application that allows you to instantly and securely convert Microsoft Word (`.docx`) documents to Markdown (`.md`) format directly inside your browser.

Because it runs entirely on the client side without any backend server, your document content remains completely private and secure.

---

## Key Features

- **Drag & Drop Upload:** Drag your `.docx` file directly onto the converter dropzone or browse your local file system.
- **Client-Side Parsing:** Extremely fast document conversion powered by local JavaScript libraries inside your browser memory (no data is sent to external servers).
- **Split Screen / Tabbed View:** View raw Markdown code side-by-side with its live visual preview (on desktop) or toggle between them (on mobile viewports).
- **Image Extraction & Asset Panel:** Embedded images inside your Word document are automatically extracted and presented in a thumbnail gallery in the left panel. Download them individually or all at once using **Download All Images**.
- **ZIP Bundle Export:** Export your conversion as a unified `.zip` file containing a clean `.md` document and a `media/` folder holding all extracted assets. The image path references within the Markdown are dynamically rewritten as clean, relative paths (e.g. `![altText](media/image-1.png)`).
- **Advanced VS Code-Style Workspace:**
  - An interactive environment mimicking a VS Code IDE, allowing you to load local folders containing Markdown files and their relative image folders (such as the unzipped output of the converter).
  - Features an activity bar, collapsible file explorer tree, tabbed document navigation, text editor with line numbers, and live Markdown rendering.
  - **Draggable Gutter Resizer (Splitter):** Drag the vertical border between the editor and preview panes freely to scale your layout. It features a wider, invisible hover grab target for ease of use, constrains layout ratios between 15% and 85% to keep panes visible, supports touch gestures on tablets, and hides completely on mobile viewports.
  - **Automatic Relative Path Resolution:** Dynamically maps relative image paths like `media/image.png` to local browser Blob URLs in real-time, allowing images to render instantly inside the preview panel.
  - **Full Mobile Responsiveness:** On mobile screens, the file tree sidebar collapses automatically upon file selection, and quick-toggle action buttons (**Preview** and **Code**) are displayed in the header.
- **Customization Settings:**
  - Toggle document table parsing (GFM Tables).
  - Enable double-tilde strikethrough support (`~~strikethrough~~`).
  - Configure heading level offset (e.g. shift H1 to H2 dynamically).
  - Set image conversion behaviors (Inline Base64, Insert Placeholders, or Ignore Images).
  - Select horizontal rule markers (`---`, `***`, `___`).
- **Quick Action Utilities:**
  - **Copy:** Copy generated Markdown code to the clipboard in a single click.
  - **Download MD:** Download your document as a standalone `.md` file.
  - **Download ZIP:** Export your document along with all media assets in a zip file.
- **Aesthetic Dark & Light Themes:** Includes a premium futuristic dark theme by default, with an elegant light theme toggle that applies across all components, including the VS Code Workspace.

---

## System Requirements

- **Node.js** (version 16 or newer recommended)
- **npm** (usually bundled together with Node.js)

---

## Installation & Local Setup

Follow these steps to run the application locally on your development server:

1. **Install Dependencies:**
   Open a terminal in the project root directory and install `vite` (the local development server):
   ```bash
   npm install
   ```

2. **Start the Development Server:**
   Launch the local server using:
   ```bash
   npm run dev
   ```

3. **Open the Application:**
   Vite will host the web server (usually at `http://localhost:5173`). Open the link in your preferred modern web browser (Google Chrome, Firefox, Safari, or Microsoft Edge).

---

## Directory Structure

```text
docs-to-md/
├── PRD.md               # Product Requirements Document
├── README.md            # Installation and setup documentation (This file)
├── index.html           # Main HTML structure and markup
├── style.css            # Custom stylesheet for dark/light themes and responsive layout
├── app.js               # Main application logic, parser rules, and UI interactions
└── package.json         # Dependency configuration and scripts (Vite)
```

---

## Security & Privacy Guarantee

This application **does not collect, store, or transmit any of your files or personal data**.

All operations—parsing `.docx` structure with `mammoth.js`, converting markup with `turndown.js`, compiling folders with `jszip.js`, and rendering visuals with `marked.js`—happen completely inside your local browser memory. Your documents are 100% secure.
