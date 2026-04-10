const form = document.getElementById("download-form");
const urlInput = document.getElementById("url-input");
const submitBtn = document.getElementById("submit-btn");
const historyList = document.getElementById("history-list");
const emptyMsg = document.getElementById("empty-msg");
const antiPaywallToggle = document.getElementById("anti-paywall-toggle");
const historyCount = document.getElementById("history-count");
const pagination = document.getElementById("pagination");
const prevPageBtn = document.getElementById("prev-page");
const nextPageBtn = document.getElementById("next-page");
const pageInfo = document.getElementById("page-info");

const API_BASE =
  window.location.protocol === "file:" ? "http://localhost:3000" : "";
let antiPaywallEnabled = false;

let allDownloads = [];
let currentPage = 1;
const itemsPerPage = 8;

antiPaywallToggle.addEventListener("click", () => {
  antiPaywallEnabled = !antiPaywallEnabled;
  antiPaywallToggle.classList.toggle("active", antiPaywallEnabled);
});

document.addEventListener("keydown", (e) => {
  if ((e.ctrlKey || e.metaKey) && e.key === "k") {
    e.preventDefault();
    urlInput.focus();
  }
});

function loadHistory() {
  try {
    const stored = localStorage.getItem("readffs_history");
    allDownloads = stored ? JSON.parse(stored) : [];
    if (!Array.isArray(allDownloads)) allDownloads = [];
    currentPage = 1; // Reset to first page on load
    renderHistory();
  } catch (error) {
    showTempMessage("history unavailable", "error");
    allDownloads = [];
  }
}

function saveHistoryToLocal() {
  localStorage.setItem("readffs_history", JSON.stringify(allDownloads));
}

function renderHistory() {
  historyCount.textContent = `${allDownloads.length} ${allDownloads.length === 1 ? "row" : "rows"}`;

  if (allDownloads.length === 0) {
    historyList.innerHTML = "";
    emptyMsg.style.display = "block";
    pagination.style.display = "none";
    return;
  }

  emptyMsg.style.display = "none";

  const totalPages = Math.ceil(allDownloads.length / itemsPerPage);
  if (currentPage > totalPages) currentPage = totalPages;
  if (currentPage < 1) currentPage = 1;

  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const pageItems = allDownloads.slice(startIndex, endIndex);

  historyList.innerHTML = pageItems
    .map(
      (item, index) => {
        const actualIndex = startIndex + index;
        return `
      <li class="history-item" style="animation-delay: ${index * 0.05}s">
        <a href="javascript:void(0)" data-filename="${escapeHtml(item.filename)}" data-url="${escapeHtml(item.url)}" title="Click to view PDF">
          <div class="filename">${escapeHtml(item.filename)}</div>
          <div class="url">${escapeHtml(item.url)}</div>
          <div class="date">${formatDate(item.date)}</div>
        </a>
        <button class="delete-btn" data-index="${actualIndex}" title="Remove from history">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"></path><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path></svg>
        </button>
      </li>
    `})
    .join("");

  if (totalPages > 1) {
    pagination.style.display = "flex";
    pageInfo.textContent = `${currentPage} / ${totalPages}`;
    prevPageBtn.disabled = currentPage === 1;
    nextPageBtn.disabled = currentPage === totalPages;
  } else {
    pagination.style.display = "none";
  }
}

prevPageBtn.addEventListener("click", () => {
  if (currentPage > 1) {
    currentPage--;
    renderHistory();
  }
});

nextPageBtn.addEventListener("click", () => {
  const totalPages = Math.ceil(allDownloads.length / itemsPerPage);
  if (currentPage < totalPages) {
    currentPage++;
    renderHistory();
  }
});

function escapeHtml(text) {
  return String(text)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function formatDate(isoString) {
  const date = new Date(isoString);

  if (Number.isNaN(date.getTime())) {
    return "unknown time";
  }

  return date.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

async function copyToClipboard(text) {
  try {
    await navigator.clipboard.writeText(text);
    showTempMessage("url copied", "success");
  } catch (error) {
    showTempMessage("copy failed", "error");
  }
}

function showTempMessage(message, type) {
  const existing = document.querySelector(".temp-msg");
  if (existing) existing.remove();

  const el = document.createElement("div");
  el.className = `temp-msg ${type === "error" ? "error-msg" : "success-msg"}`;
  el.textContent = message;
  document.body.appendChild(el);

  setTimeout(() => el.remove(), 2500);
}

historyList.addEventListener("click", async (event) => {
  const deleteBtn = event.target.closest(".delete-btn");
  if (deleteBtn) {
    event.stopPropagation();
    const index = parseInt(deleteBtn.dataset.index, 10);
    if (!isNaN(index)) {
      allDownloads.splice(index, 1);
      saveHistoryToLocal();
      renderHistory();
      showTempMessage("item removed", "success");
    }
    return;
  }

  const target = event.target.closest("a[data-filename]");
  if (!target) return;
  const filename = target.dataset.filename;
  try {
    const res = await fetch(`${API_BASE}/api/pdf/${encodeURIComponent(filename)}`);
    if (!res.ok) throw new Error("Failed to fetch PDF");
    const blob = await res.blob();
    const blobUrl = URL.createObjectURL(blob);
    window.open(blobUrl, "_blank");
  } catch (error) {
    showTempMessage("failed to load PDF", "error");
  }
});

form.addEventListener("submit", async (event) => {
  event.preventDefault();

  let url = urlInput.value.trim();

  if (!url) return;

  if (antiPaywallEnabled && url.includes("medium.com")) {
    url = "https://freedium-mirror.cfd/" + url;
  }

  submitBtn.disabled = true;
  submitBtn.querySelector(".btn-text").textContent = "Saving...";

  try {
    const res = await fetch(`${API_BASE}/api/download`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url }), // Filename removed
    });
    const data = await res.json();

    if (!res.ok || !data.success) {
      showTempMessage(data.error || "save failed", "error");
      return;
    }

    urlInput.value = "";
    showTempMessage(`saved ${data.filename}`, "success");
    
    allDownloads.unshift({
      url: url,
      filename: data.filename,
      date: new Date().toISOString()
    });
    saveHistoryToLocal();
    renderHistory();
  } catch (error) {
    showTempMessage("network error", "error");
  } finally {
    submitBtn.disabled = false;
    submitBtn.querySelector(".btn-text").textContent = "Save";
  }
});

loadHistory();

