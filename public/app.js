const form = document.getElementById('download-form');
const urlInput = document.getElementById('url-input');
const filenameInput = document.getElementById('filename-input');
const submitBtn = document.getElementById('submit-btn');
const historyList = document.getElementById('history-list');
const emptyMsg = document.getElementById('empty-msg');
const antiPaywallToggle = document.getElementById('anti-paywall-toggle');

const API_BASE = window.location.protocol === 'file:' ? 'http://localhost:3000' : '';
let antiPaywallEnabled = false;

antiPaywallToggle.addEventListener('click', () => {
  antiPaywallEnabled = !antiPaywallEnabled;
  antiPaywallToggle.classList.toggle('active', antiPaywallEnabled);
});

document.addEventListener('keydown', (e) => {
  if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
    e.preventDefault();
    urlInput.focus();
  }
});

async function loadHistory() {
  try {
    const res = await fetch(`${API_BASE}/api/downloads`);
    const downloads = await res.json();
    renderHistory(downloads);
  } catch (error) {
    showTempMessage('history unavailable', 'error');
  }
}

function renderHistory(downloads) {
  const items = Array.isArray(downloads) ? downloads : [];

  if (items.length === 0) {
    historyList.innerHTML = '';
    emptyMsg.style.display = 'block';
    return;
  }

  emptyMsg.style.display = 'none';
  historyList.innerHTML = items
    .map(
      (item, index) => `
      <li class="history-item" style="animation-delay: ${index * 0.04}s">
        <a href="javascript:void(0)" data-url="${escapeHtml(item.url)}" title="Click to copy URL">
          <div class="filename">${escapeHtml(item.filename)}</div>
          <div class="url">${escapeHtml(item.url)}</div>
          <div class="date">${formatDate(item.date)}</div>
        </a>
      </li>
    `
    )
    .join('');
}

function escapeHtml(text) {
  return String(text)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function formatDate(isoString) {
  const date = new Date(isoString);

  if (Number.isNaN(date.getTime())) {
    return 'unknown time';
  }

  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

async function copyToClipboard(text) {
  try {
    await navigator.clipboard.writeText(text);
    showTempMessage('url copied', 'success');
  } catch (error) {
    showTempMessage('copy failed', 'error');
  }
}

function showTempMessage(message, type) {
  const existing = document.querySelector('.temp-msg');

  if (existing) {
    existing.remove();
  }

  const el = document.createElement('div');
  el.className = `temp-msg ${type === 'error' ? 'error-msg' : 'success-msg'}`;
  el.textContent = message;
  form.appendChild(el);

  setTimeout(() => {
    el.remove();
  }, 2200);
}

historyList.addEventListener('click', (event) => {
  const target = event.target.closest('a[data-url]');
  if (!target) {
    return;
  }
  copyToClipboard(target.dataset.url);
});

form.addEventListener('submit', async (event) => {
  event.preventDefault();

  let url = urlInput.value.trim();
  const filename = filenameInput.value.trim();

  if (!url) {
    return;
  }

  if (antiPaywallEnabled) {
    url = url.replace(/medium\.com/g, 'freedium-mirror.cfd');
  }

  submitBtn.disabled = true;
  submitBtn.querySelector('.btn-text').textContent = 'saving';

  try {
    const res = await fetch(`${API_BASE}/api/download`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url, filename }),
    });
    const data = await res.json();

    if (!res.ok || !data.success) {
      showTempMessage(data.error || 'save failed', 'error');
      return;
    }

    urlInput.value = '';
    filenameInput.value = '';
    showTempMessage(`saved ${data.filename}`, 'success');
    await loadHistory();
  } catch (error) {
    showTempMessage('network error', 'error');
  } finally {
    submitBtn.disabled = false;
    submitBtn.querySelector('.btn-text').textContent = 'save';
  }
});

loadHistory();
