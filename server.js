const express = require('express');
const cors = require('cors');
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());
app.use(express.static('public'));

const DOWNLOAD_DIR = path.join(os.homedir(), 'personal', 'reading');
const HISTORY_FILE = path.join(DOWNLOAD_DIR, 'downloads.json');

if (!fs.existsSync(DOWNLOAD_DIR)) {
  fs.mkdirSync(DOWNLOAD_DIR, { recursive: true });
}

function loadHistory() {
  try {
    if (fs.existsSync(HISTORY_FILE)) {
      return JSON.parse(fs.readFileSync(HISTORY_FILE, 'utf8'));
    }
  } catch (e) {
    console.error('Error loading history:', e);
  }
  return [];
}

function saveHistory(history) {
  fs.writeFileSync(HISTORY_FILE, JSON.stringify(history, null, 2));
}

function slugify(text) {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
}

function extractFilenameFromUrl(url) {
  try {
    const urlObj = new URL(url);
    const pathname = urlObj.pathname;
    const filename = pathname.split('/').pop();
    if (filename && filename.length > 3) {
      const baseName = filename.replace(/\.[^.]+$/, '');
      return slugify(baseName) || slugify(urlObj.hostname);
    }
  } catch (e) {}
  return `page-${Date.now()}`;
}

app.post('/api/download', (req, res) => {
  const { url, filename } = req.body;

  if (!url) {
    return res.status(400).json({ success: false, error: 'URL is required' });
  }

  let pdfFilename;
  if (filename && filename.trim()) {
    pdfFilename = slugify(filename.trim()) + '.pdf';
  } else {
    pdfFilename = extractFilenameFromUrl(url) + '.pdf';
  }

  const outputPath = path.join(DOWNLOAD_DIR, pdfFilename);

  console.log(`Generating PDF: ${url} -> ${outputPath}`);

  const percollate = spawn('percollate', ['pdf', '-o', outputPath, url]);

  let stderr = '';

  percollate.stderr.on('data', (data) => {
    stderr += data.toString();
  });

  percollate.on('close', (code) => {
    if (code !== 0) {
      console.error('Percollate error:', stderr);
      return res.status(500).json({ success: false, error: stderr || 'Failed to generate PDF' });
    }

    const history = loadHistory();
    history.unshift({
      url,
      filename: pdfFilename,
      date: new Date().toISOString()
    });
    saveHistory(history);

    res.json({ success: true, filename: pdfFilename, url });
  });
});

app.get('/api/downloads', (req, res) => {
  const history = loadHistory();
  res.json(history);
});

app.listen(PORT, () => {
  console.log(`readffs. running at http://localhost:${PORT}`);
  console.log(`PDFs will be saved to: ${DOWNLOAD_DIR}`);
});