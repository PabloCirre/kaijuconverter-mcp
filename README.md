# `@kaijuconverter/mcp-server` — Official KaijuConverter MCP Server & CLI

[![Website](https://img.shields.io/badge/Website-kaijuconverter.com-0d9488?style=flat-square)](https://kaijuconverter.com)
[![Remote MCP](https://img.shields.io/badge/MCP_HTTP-kaijuconverter.com%2Fapi%2Fmcp-2563eb?style=flat-square)](https://kaijuconverter.com/integrations)
[![License: MIT](https://img.shields.io/badge/License-MIT-10b981?style=flat-square)](LICENSE)

Official **Model Context Protocol (MCP) Server & CLI** for **[KaijuConverter](https://kaijuconverter.com)** — convert **201+ file formats** (HEIC, WebP, AVIF, PDF, DOCX, XLSX, PPTX, CSV, ODS, RAW, CAD, HWP, DICOM, EPUB, MP4, MP3, FLAC, DSF/DFF, VTT/SRT, ZIP) and discover **54 precision Studio workspaces** directly inside **Claude Desktop, Claude Code, Cursor, Windsurf, Cline, ChatGPT**, or your terminal.

- **Zero dependencies** (Node.js `>=18` native `fetch` / `FormData`).
- **Two transports supported**:
  1. **Remote Streamable HTTP MCP** (zero local install): [`https://kaijuconverter.com/api/mcp`](https://kaijuconverter.com/api/mcp)
  2. **Local Stdio MCP + CLI** (supports converting local files on disk): `npx -y https://kaijuconverter.com/downloads/kaijuconverter-mcp.tgz`
- **Privacy & Security**: Cryptographic **SHA-256 output verification** + automatic **60-minute GDPR file shredding** ([Security Architecture](https://kaijuconverter.com/security)).

---

## 1. Quick Configuration (`claude_desktop_config.json` / `.cursor/mcp.json` / `mcp_config.json`)

### Option A: Local File Conversion via `npx` (Recommended for Desktop IDEs)
```json
{
  "mcpServers": {
    "kaijuconverter": {
      "command": "npx",
      "args": ["-y", "https://kaijuconverter.com/downloads/kaijuconverter-mcp.tgz"]
    }
  }
}
```

*(Optional: add `"env": { "KAIJU_API_KEY": "kc_..." }` for up to 2 GB files and priority API quotas.)*

### Option B: Zero-Install Remote Streamable HTTP MCP
Point any Streamable HTTP MCP client (Claude.ai Custom Connectors, ChatGPT MCP, Cursor Remote MCP) to:
```text
https://kaijuconverter.com/api/mcp
```

---

## 2. Terminal CLI Usage
```bash
npx -y https://kaijuconverter.com/downloads/kaijuconverter-mcp.tgz --convert ./photo.heic jpg ./photo.jpg
npx -y https://kaijuconverter.com/downloads/kaijuconverter-mcp.tgz --formats image
```

---

## 3. Available MCP Tools (`JSON-RPC 2.0`)
| Tool Name | Description |
| :--- | :--- |
| `convert_local_file` | Uploads a local file, converts it synchronously across 10 isolated engines, verifies SHA-256, and writes the converted file directly to disk. |
| `convert_file_from_url` | Converts any public HTTPS URL (SSRF-protected) to 201+ target formats and returns a direct download link + SHA-256 hash. |
| `convert_base64_file` | Converts inline base64 payloads up to 10 MB (ideal for remote Streamable HTTP MCP agents). |
| `list_supported_formats` | Lists all [201+ supported formats](https://kaijuconverter.com/formats) grouped by family (`image`, `document`, `spreadsheet`, `audio`, `video`, `archive`, `vector`, `cad`, `ebook`, `subtitle`). |
| `get_conversion_targets` | Lists all verified target formats and localized URLs across 12 languages (`en`, `es`, `pt`, `de`, `fr`, `ja`, `it`, `id`, `tr`, `ko`, `pl`, `nl`). |
| `find_studio_tool` | Searches [54 specialized Studio workspaces](https://kaijuconverter.com/tools) (`<=20KB`/`50KB`/`100KB` exact image cap, `PDF/A` ISO archival, 12-language OCR, `CM/MM` 300 DPI passport photo resizer, Merge/Split PDF). |

---

## 4. Key Platform Hubs & Technical Documentation
- **Web Workbench (201+ Formats & 3,208 Pairs):** [https://kaijuconverter.com](https://kaijuconverter.com)
- **54 Precision Studio Tools:** [https://kaijuconverter.com/tools](https://kaijuconverter.com/tools)
  - [Compress Image to 20KB](https://kaijuconverter.com/tools/compress-image-to-20kb) · [Compress PDF to 100KB](https://kaijuconverter.com/tools/compress-pdf-to-100kb)
  - [PDF to PDF/A ISO Archival](https://kaijuconverter.com/tools/pdf-to-pdfa) · [OCR Image & PDF to Text (12 Languages)](https://kaijuconverter.com/tools/ocr-image-to-text)
  - [Resize Image in CM / MM at 300 DPI](https://kaijuconverter.com/tools/resize-image-cm) · [Merge PDF](https://kaijuconverter.com/tools/merge-pdf)
- **Format Encyclopedia (Magic Bytes & MIME Specs):** [https://kaijuconverter.com/formats](https://kaijuconverter.com/formats)
  - [CSV Format Guide](https://kaijuconverter.com/formats/csv) · [BMP Format](https://kaijuconverter.com/formats/bmp) · [TIFF Format](https://kaijuconverter.com/formats/tiff) · [HEIC Format](https://kaijuconverter.com/formats/heic) · [ODS OpenDocument Spreadsheet](https://kaijuconverter.com/formats/ods)
- **Side-by-Side Format Benchmarks:** [https://kaijuconverter.com/compare](https://kaijuconverter.com/compare)
  - [JPG vs TIFF Quality Comparison](https://kaijuconverter.com/compare/jpg-vs-tiff) · [M4A vs MP3 Audio Comparison](https://kaijuconverter.com/compare/m4a-vs-mp3) · [DFF vs DSF DSD Audio](https://kaijuconverter.com/compare/dff-vs-dsf) · [CSV vs ODS](https://kaijuconverter.com/compare/csv-vs-ods)
- **Technical Guides & Tutorials:** [https://kaijuconverter.com/guides](https://kaijuconverter.com/guides)
- **AI Integrations, OpenAPI 3.1 & Embed Widgets:** [https://kaijuconverter.com/integrations](https://kaijuconverter.com/integrations)

## License
MIT © [KaijuConverter](https://kaijuconverter.com)
