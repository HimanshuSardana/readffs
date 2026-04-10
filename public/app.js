const form = document.getElementById('download-form');
const urlInput = document.getElementById('url-input');
const filenameInput = document.getElementById('filename-input');
const submitBtn = document.getElementById('submit-btn');
const historyList = document.getElementById('history-list');
const emptyMsg = document.getElementById('empty-msg');

// Use localhost:3000 if opened directly via file:// protocol
const API_BASE = window.location.protocol === 'file:' ? 'http://localhost:3000' : '';

async function loadHistory() {
  try {
    const res = await fetch(`${API_BASE}/api/downloads`);
    const downloads = await res.json();
    renderHistory(downloads);
  } catch (e) {
    console.error('Failed to load history:', e);
  }
}

function renderHistory(downloads) {
  if (!downloads || downloads.length === 0) {
    historyList.innerHTML = '';
    emptyMsg.style.display = 'block';
    return;
  }

  emptyMsg.style.display = 'none';
  historyList.innerHTML = downloads
    .map(
      (item, i) => `
      <li class="history-item" style="animation-delay: ${i * 0.05}s">
        <a href="javascript:void(0)" onclick="copyToClipboard('${item.url}')" title="Click to copy URL">
          <div class="url">${escapeHtml(item.url)}</div>
          <div class="filename">${escapeHtml(item.filename)}</div>
          <div class="date">${formatDate(item.date)}</div>
        </a>
      </li>
    `
    )
    .join('');
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function formatDate(isoString) {
  const date = new Date(isoString);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

function copyToClipboard(text) {
  navigator.clipboard.writeText(text).then(() => {
    showTempMessage('url copied!', 'success');
  });
}

function showTempMessage(msg, type) {
  const existing = document.querySelector('.temp-msg');
  if (existing) existing.remove();

  const div = document.createElement('div');
  div.className = `temp-msg ${type === 'error' ? 'error-msg' : 'success-msg'}`;
  div.textContent = msg;
  form.appendChild(div);

  setTimeout(() => div.remove(), 2500);
}

form.addEventListener('submit', async (e) => {
  e.preventDefault();

  const url = urlInput.value.trim();
  const filename = filenameInput.value.trim();

  if (!url) return;

  submitBtn.classList.add('loading');
  submitBtn.disabled = true;
  submitBtn.querySelector('.btn-text').textContent = 'saving...';

  try {
    const res = await fetch(`${API_BASE}/api/download`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url, filename })
    });

    const data = await res.json();

    if (data.success) {
      urlInput.value = '';
      filenameInput.value = '';
      showTempMessage(`saved: ${data.filename}`, 'success');
      loadHistory();
    } else {
      showTempMessage(data.error || 'failed to save', 'error');
    }
  } catch (e) {
    showTempMessage('network error', 'error');
  } finally {
    submitBtn.classList.remove('loading');
    submitBtn.disabled = false;
    submitBtn.querySelector('.btn-text').textContent = 'save';
  }
});

loadHistory();