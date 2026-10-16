// ================================================
//  Internship Board – app.js
//  Handles: rendering, search, filter, sort,
//           empty state, error state, keyboard nav
// ================================================

// ─── State ───────────────────────────────────────
const state = {
  query: "",
  domain: "All",
  sort: "deadline",
  isLoading: true,
  hasError: false,
};

// ─── DOM refs ────────────────────────────────────
const grid = document.getElementById("card-grid");
const searchInput = document.getElementById("search-input");
const clearBtn = document.getElementById("clear-btn");
const sortSelect = document.getElementById("sort-select");
const resultCount = document.getElementById("result-count");
const filterList = document.getElementById("domain-filters");
const liveRegion = document.getElementById("live-region");

// ─── Utility: Days until deadline ────────────────
function daysUntil(dateStr) {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const target = new Date(dateStr);
  return Math.ceil((target - now) / (1000 * 60 * 60 * 24));
}

function formatDeadline(dateStr) {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

// ─── Utility: Parse stipend to number for sort ───
function stipendToNum(str) {
  const match = str.replace(/,/g, "").match(/\d+/);
  return match ? parseInt(match[0], 10) : 0;
}

// ─── Utility: Escape HTML ────────────────────────
function esc(str) {
  const d = document.createElement("div");
  d.textContent = str;
  return d.innerHTML;
}

// ─── Utility: Highlight search term in text ──────
function highlight(text, query) {
  if (!query) return esc(text);
  const escaped = esc(text);
  const re = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`, "gi");
  return escaped.replace(re, '<mark>$1</mark>');
}

// ─── Build domain filter pills ───────────────────
function buildFilters() {
  filterList.innerHTML = "";
  DOMAINS.forEach((domain) => {
    const li = document.createElement("li");
    const btn = document.createElement("button");
    btn.textContent = domain;
    btn.className = "filter-pill";
    btn.setAttribute("aria-pressed", domain === state.domain ? "true" : "false");
    btn.setAttribute("data-domain", domain);
    btn.addEventListener("click", () => {
      state.domain = domain;
      buildFilters();
      renderCards();
    });
    li.appendChild(btn);
    filterList.appendChild(li);
  });
}

// ─── Filter & Sort data ──────────────────────────
function getFiltered() {
  let list = [...INTERNSHIPS];

  // Domain filter
  if (state.domain !== "All") {
    list = list.filter((i) => i.domain === state.domain);
  }

  // Search
  if (state.query) {
    const q = state.query.toLowerCase();
    list = list.filter(
      (i) =>
        i.title.toLowerCase().includes(q) ||
        i.company.toLowerCase().includes(q) ||
        i.description.toLowerCase().includes(q) ||
        i.tags.some((t) => t.toLowerCase().includes(q)) ||
        i.location.toLowerCase().includes(q)
    );
  }

  // Sort
  switch (state.sort) {
    case "deadline":
      list.sort((a, b) => new Date(a.deadline) - new Date(b.deadline));
      break;
    case "stipend-high":
      list.sort((a, b) => stipendToNum(b.stipend) - stipendToNum(a.stipend));
      break;
    case "stipend-low":
      list.sort((a, b) => stipendToNum(a.stipend) - stipendToNum(b.stipend));
      break;
    case "company":
      list.sort((a, b) => a.company.localeCompare(b.company));
      break;
  }

  return list;
}

// ─── Render a single card ────────────────────────
function renderCard(internship, query) {
  const days = daysUntil(internship.deadline);
  const isUrgent = days <= 7 && days >= 0;
  const isExpired = days < 0;
  const deadlineLabel = isExpired
    ? "Deadline passed"
    : isUrgent
    ? `⚡ ${days} day${days === 1 ? "" : "s"} left`
    : `Closes ${formatDeadline(internship.deadline)}`;

  const card = document.createElement("article");
  card.className = "card";
  card.setAttribute("role", "listitem");
  card.setAttribute("aria-label", `${internship.title} at ${internship.company}`);

  card.innerHTML = `
    <span class="domain-badge" aria-label="Domain: ${esc(internship.domain)}">${esc(internship.domain)}</span>

    <div class="card-header">
      <div class="company-logo" style="background-color:${esc(internship.logoColor)}" aria-hidden="true">
        ${esc(internship.logo)}
      </div>
      <div class="card-titles">
        <h3 class="card-title">${highlight(internship.title, query)}</h3>
        <p class="card-company">${highlight(internship.company, query)}</p>
      </div>
    </div>

    <ul class="card-meta" aria-label="Internship details">
      <li class="card-meta-item">
        <svg aria-hidden="true" viewBox="0 0 24 24"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>
        <span>${esc(internship.location)}</span>
      </li>
      <li class="card-meta-item">
        <svg aria-hidden="true" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
        <span>${esc(internship.duration)}</span>
      </li>
      <li class="card-meta-item">
        <svg aria-hidden="true" viewBox="0 0 24 24"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
        <span>${esc(internship.stipend)}</span>
      </li>
    </ul>

    <p class="card-desc">${highlight(internship.description, query)}</p>

    <ul class="card-tags" aria-label="Skills required">
      ${internship.tags.map((t) => `<li class="card-tag">${esc(t)}</li>`).join("")}
    </ul>

    <div class="card-footer">
      <p class="card-deadline${isUrgent ? " urgent" : ""}" aria-label="Application deadline: ${deadlineLabel}">
        <svg aria-hidden="true" viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
        ${deadlineLabel}
      </p>
      <button
        class="apply-btn"
        data-id="${internship.id}"
        aria-label="Apply for ${esc(internship.title)} at ${esc(internship.company)}"
        ${isExpired ? 'disabled aria-disabled="true" style="opacity:0.5;cursor:not-allowed"' : ""}
      >${isExpired ? "Closed" : "Apply Now"}</button>
    </div>
  `;


  return card;
}

// ─── Skeleton loaders ────────────────────────────
function renderSkeletons(count = 6) {
  grid.innerHTML = "";
  for (let i = 0; i < count; i++) {
    const sk = document.createElement("div");
    sk.className = "skeleton";
    sk.setAttribute("aria-hidden", "true");
    sk.innerHTML = `
      <div class="skeleton-pulse" style="height:48px;width:48px;border-radius:10px"></div>
      <div class="skeleton-pulse" style="height:20px;width:70%"></div>
      <div class="skeleton-pulse" style="height:14px;width:40%"></div>
      <div class="skeleton-pulse" style="height:56px"></div>
      <div class="skeleton-pulse" style="height:14px;width:55%"></div>
    `;
    grid.appendChild(sk);
  }
}

// ─── Empty State ─────────────────────────────────
function renderEmptyState() {
  grid.innerHTML = "";
  const div = document.createElement("div");
  div.className = "state-container";
  div.setAttribute("role", "status");
  div.setAttribute("aria-live", "polite");
  div.innerHTML = `
    <div class="state-icon" aria-hidden="true">
      <svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/><line x1="8" y1="11" x2="14" y2="11"/></svg>
    </div>
    <h2>No internships found</h2>
    <p>We couldn't find anything matching <strong>"${esc(state.query || state.domain)}"</strong>. Try a different keyword or domain.</p>
    <button class="reset-btn" id="reset-btn">Clear Filters</button>
  `;
  grid.appendChild(div);
  document.getElementById("reset-btn").addEventListener("click", resetFilters);
}

// ─── Error State ─────────────────────────────────
function renderErrorState() {
  grid.innerHTML = "";
  const div = document.createElement("div");
  div.className = "state-container error-state";
  div.setAttribute("role", "alert");
  div.innerHTML = `
    <div class="state-icon" aria-hidden="true">
      <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
    </div>
    <h2>Something went wrong</h2>
    <p>We had trouble loading the internship listings. Please check your connection and try again.</p>
    <button class="retry-btn" id="retry-btn">Retry</button>
  `;
  grid.appendChild(div);
  document.getElementById("retry-btn").addEventListener("click", simulateLoad);
}

// ─── Main render ─────────────────────────────────
function renderCards() {
  if (state.hasError) {
    renderErrorState();
    updateCount(0);
    return;
  }

  const filtered = getFiltered();
  grid.innerHTML = "";
  grid.setAttribute("role", "list");

  updateCount(filtered.length);

  if (filtered.length === 0) {
    renderEmptyState();
    announce(`No internships found for "${state.query || state.domain}".`);
    return;
  }

  filtered.forEach((internship, idx) => {
    const card = renderCard(internship, state.query);
    // Stagger animation
    card.style.animationDelay = `${idx * 40}ms`;
    grid.appendChild(card);
  });

  announce(`${filtered.length} internship${filtered.length === 1 ? "" : "s"} found.`);
}

// ─── Update result count label ────────────────────
function updateCount(n) {
  const total = INTERNSHIPS.length;
  resultCount.innerHTML = `Showing <strong>${n}</strong> of <strong>${total}</strong> internship${total === 1 ? "" : "s"}`;
}

// ─── Announce to screen readers ──────────────────
function announce(msg) {
  liveRegion.textContent = "";
  setTimeout(() => {
    liveRegion.textContent = msg;
  }, 100);
}

// ─── Reset all filters ───────────────────────────
function resetFilters() {
  state.query = "";
  state.domain = "All";
  searchInput.value = "";
  sortSelect.value = "deadline";
  state.sort = "deadline";
  clearBtn.classList.remove("visible");
  clearBtn.setAttribute("aria-hidden", "true");
  buildFilters();
  renderCards();
  searchInput.focus();
}

// ─── Simulate data loading ───────────────────────
function simulateLoad() {
  state.isLoading = true;
  state.hasError = false;
  renderSkeletons(6);

  // 5% chance of error to demonstrate error state
  const shouldError = Math.random() < 0.05;

  setTimeout(() => {
    state.isLoading = false;
    if (shouldError) {
      state.hasError = true;
    }
    buildFilters();
    renderCards();
  }, 900);
}

// ─── Event: Search input ─────────────────────────
let debounceTimer;
searchInput.addEventListener("input", () => {
  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => {
    state.query = searchInput.value.trim();
    const hasQuery = state.query.length > 0;
    clearBtn.classList.toggle("visible", hasQuery);
    clearBtn.setAttribute("aria-hidden", hasQuery ? "false" : "true");
    renderCards();
  }, 250);
});

// ─── Event: Clear search ─────────────────────────
clearBtn.addEventListener("click", () => {
  searchInput.value = "";
  state.query = "";
  clearBtn.classList.remove("visible");
  clearBtn.setAttribute("aria-hidden", "true");
  searchInput.focus();
  renderCards();
});

// ─── Event: Sort ─────────────────────────────────
sortSelect.addEventListener("change", () => {
  state.sort = sortSelect.value;
  renderCards();
});

// ─── Keyboard navigation for filter pills ────────
filterList.addEventListener("keydown", (e) => {
  const pills = [...filterList.querySelectorAll(".filter-pill")];
  const current = document.activeElement;
  const idx = pills.indexOf(current);

  if (e.key === "ArrowRight" || e.key === "ArrowDown") {
    e.preventDefault();
    pills[(idx + 1) % pills.length].focus();
  } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
    e.preventDefault();
    pills[(idx - 1 + pills.length) % pills.length].focus();
  } else if (e.key === "Home") {
    e.preventDefault();
    pills[0].focus();
  } else if (e.key === "End") {
    e.preventDefault();
    pills[pills.length - 1].focus();
  }
});

// ─── Bootstrap ───────────────────────────────────
simulateLoad();

// ══════════════════════════════════════════════════
//  MODAL LOGIC
// ══════════════════════════════════════════════════

const modal        = document.getElementById("apply-modal");
const modalTitle   = document.getElementById("modal-title");
const modalCompany = document.getElementById("modal-company");
const modalClose   = document.getElementById("modal-close");
const modalCancel  = document.getElementById("modal-cancel-btn");
const applyForm    = document.getElementById("apply-form");
const modalSuccess = document.getElementById("modal-success");
const submitBtn    = document.getElementById("form-submit-btn");
const coverTextarea = document.getElementById("applicant-cover");
const coverCount    = document.getElementById("cover-count");

// Track which button opened the modal (for returning focus)
let openerBtn = null;

// ─── Open modal ──────────────────────────────────
function openModal(internship, triggerEl) {
  openerBtn = triggerEl;

  // Populate header
  modalTitle.textContent   = internship.title;
  modalCompany.textContent = internship.company;

  // Reset form & success state
  applyForm.reset();
  applyForm.hidden   = false;
  modalSuccess.hidden = true;
  coverCount.textContent = "0";
  clearAllErrors();

  // Show modal
  modal.removeAttribute("aria-hidden");
  modal.classList.add("open");
  document.body.classList.add("modal-open");

  // Focus the close button (first focusable element)
  modalClose.focus();
}

// ─── Close modal ─────────────────────────────────
function closeModal() {
  modal.setAttribute("aria-hidden", "true");
  modal.classList.remove("open");
  document.body.classList.remove("modal-open");

  // Return focus to the card button that opened the modal
  if (openerBtn) {
    openerBtn.focus();
    openerBtn = null;
  }
}

// ─── Click on a card's Apply button ──────────────
grid.addEventListener("click", (e) => {
  const btn = e.target.closest("button.apply-btn[data-id]");
  if (!btn || btn.disabled) return;

  const id = parseInt(btn.dataset.id, 10);
  const internship = INTERNSHIPS.find((i) => i.id === id);
  if (internship) openModal(internship, btn);
});

// ─── Close triggers ───────────────────────────────
modalClose.addEventListener("click", closeModal);
modalCancel.addEventListener("click", closeModal);

// Click outside the modal box to close
modal.addEventListener("click", (e) => {
  if (e.target === modal) closeModal();
});

// Escape key closes
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && modal.classList.contains("open")) closeModal();
});

// ─── Focus trap inside modal ─────────────────────
modal.addEventListener("keydown", (e) => {
  if (e.key !== "Tab" || !modal.classList.contains("open")) return;

  const focusable = [...modal.querySelectorAll(
    'button:not([disabled]), input:not([disabled]), textarea:not([disabled]), select:not([disabled]), [tabindex="0"]'
  )].filter((el) => !el.closest("[hidden]"));

  if (!focusable.length) return;
  const first = focusable[0];
  const last  = focusable[focusable.length - 1];

  if (e.shiftKey) {
    if (document.activeElement === first) {
      e.preventDefault();
      last.focus();
    }
  } else {
    if (document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  }
});

// ─── Character counter for cover letter ──────────
coverTextarea.addEventListener("input", () => {
  coverCount.textContent = coverTextarea.value.length;
});

// ─── Form validation helpers ─────────────────────
function showError(fieldId, errorId, msg) {
  const field = document.getElementById(fieldId);
  const err   = document.getElementById(errorId);
  field.classList.add("invalid");
  field.setAttribute("aria-invalid", "true");
  err.textContent = msg;
}

function clearError(fieldId, errorId) {
  const field = document.getElementById(fieldId);
  const err   = document.getElementById(errorId);
  field.classList.remove("invalid");
  field.removeAttribute("aria-invalid");
  err.textContent = "";
}

function clearAllErrors() {
  [
    ["applicant-name",      "name-error"],
    ["applicant-email",     "email-error"],
    ["applicant-phone",     "phone-error"],
    ["applicant-portfolio", "portfolio-error"],
    ["applicant-cover",     "cover-error"],
  ].forEach(([f, e]) => clearError(f, e));
}

function validateForm() {
  let valid = true;
  clearAllErrors();

  // Name
  const name = document.getElementById("applicant-name").value.trim();
  if (!name) {
    showError("applicant-name", "name-error", "Full name is required.");
    valid = false;
  }

  // Email
  const email = document.getElementById("applicant-email").value.trim();
  const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email) {
    showError("applicant-email", "email-error", "Email address is required.");
    valid = false;
  } else if (!emailRe.test(email)) {
    showError("applicant-email", "email-error", "Please enter a valid email.");
    valid = false;
  }

  // Portfolio URL (optional but must be valid if provided)
  const portfolio = document.getElementById("applicant-portfolio").value.trim();
  if (portfolio) {
    try {
      new URL(portfolio);
    } catch {
      showError("applicant-portfolio", "portfolio-error", "Please enter a valid URL (include https://).");
      valid = false;
    }
  }

  // Cover letter
  const cover = coverTextarea.value.trim();
  if (!cover) {
    showError("applicant-cover", "cover-error", "A cover letter is required.");
    valid = false;
  } else if (cover.length < 30) {
    showError("applicant-cover", "cover-error", "Cover letter must be at least 30 characters.");
    valid = false;
  }

  return valid;
}

// ─── Form submit ──────────────────────────────────
applyForm.addEventListener("submit", (e) => {
  e.preventDefault();

  if (!validateForm()) {
    // Focus first invalid field
    const firstInvalid = applyForm.querySelector(".invalid");
    if (firstInvalid) firstInvalid.focus();
    return;
  }

  // Simulate async submission
  submitBtn.classList.add("loading");
  submitBtn.textContent = "Submitting…";

  setTimeout(() => {
    submitBtn.classList.remove("loading");
    submitBtn.textContent = "Submit Application";

    // Show success state
    applyForm.hidden    = true;
    modalSuccess.hidden = false;

    // Focus the Done button
    document.getElementById("modal-done-btn").focus();
  }, 1200);
});

// ─── Done button closes modal ─────────────────────
document.getElementById("modal-done-btn").addEventListener("click", closeModal);
