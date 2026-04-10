# readffs.

A sleek, minimal web application that serves as a local "read-it-later" pipeline. It takes article URLs, bypasses paywalls (optionally), and converts them into beautifully formatted, printable PDFs saved directly to your local machine using `percollate`.

## Features
- **URL to PDF**: Instantly converts any web article into a clean, distraction-free PDF.
- **Anti-Paywall Toggle**: Automatically prepends `freedium-mirror.cfd/` to `medium.com` links to bypass paywalls.
- **Theme Selection**: Choose between light and dark themes for your generated PDFs.
- **Custom Typography**: Generated PDFs are styled with a sleek monospace font stack (`Iosevka`, `JetBrains Mono`, `Fira Code`) for a developer-friendly reading experience.
- **Library & Pagination**: Keeps a history of your saved articles, beautifully paginated on the frontend using `localStorage`.
- **Direct Viewing**: Click on any generated item in your library to instantly open and read the PDF directly in the browser.
- **Quick Shortcuts**: Press `Ctrl + K` (or `Cmd + K`) to immediately focus the URL input field.
- **Elegant Dark UI**: A soft, minimal, dark-themed interface built with vanilla HTML/CSS/JS (inspired by high-quality terminal tools).

## Tech Stack
- **Backend**: Node.js, Express
- **Core Engine**: [percollate](https://github.com/danburzo/percollate) (CLI tool for generating PDFs from web pages)
- **Frontend**: Vanilla HTML, CSS, JavaScript (No build step required)

## Installation

1. Make sure you have Node.js and `percollate` installed globally:
   ```bash
   npm install -g percollate
   ```
2. Clone the repository and install dependencies:
   ```bash
   git clone <repo-url>
   cd readffs
   npm install
   ```

## Usage

1. Start the server:
   ```bash
   node server.js
   ```
2. The server will run on `http://localhost:3000`.
3. Paste a link into the input field, optionally toggle the anti-paywall or select a theme, and hit **save**.
4. The PDF will be automatically generated and saved to `~/personal/reading/`.

## API

- `POST /api/download`: Accepts `{ "url": "...", "theme": "dark" }` and generates a PDF.
- `GET /api/pdf/:filename`: Serves the generated PDF file from disk.
