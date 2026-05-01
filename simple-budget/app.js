const STORAGE_KEY = "zeroBudgetDataV1";

const GROUPS = [
  "Giving",
  "Housing",
  "Food",
  "Transportation",
  "Insurance",
  "Debt",
  "Savings",
  "Personal",
  "Subscriptions",
  "Fees"
];

const FEE_TERMS = ["ATM FEE", "OVERDRAFT", "MAINTENANCE FEE", "LATE FEE", "INTEREST CHARGE", "SERVICE CHARGE"];
const SUBSCRIPTION_TERMS = ["NETFLIX", "SPOTIFY", "APPLE", "GOOGLE", "AMAZON PRIME", "HULU", "DISNEY"];

const starterCategories = [
  category("cat-giving", "Giving", "Giving", 350),
  category("cat-rent", "Rent", "Housing", 1400),
  category("cat-utilities", "Utilities", "Housing", 250),
  category("cat-groceries", "Groceries", "Food", 500),
  category("cat-restaurants", "Restaurants", "Food", 150),
  category("cat-gas", "Gas", "Transportation", 180),
  category("cat-auto", "Auto Maintenance", "Transportation", 100),
  category("cat-insurance", "Insurance", "Insurance", 260),
  category("cat-debt", "Debt Payment", "Debt", 400),
  category("cat-emergency", "Emergency Fund", "Savings", 1110),
  category("cat-personal", "Personal", "Personal", 200),
  category("cat-subscriptions", "Subscriptions", "Subscriptions", 75),
  category("cat-fees", "Fees", "Fees", 25)
];

const starterRules = [
  rule("rule-kroger", "KROGER", "Groceries"),
  rule("rule-shell", "SHELL", "Gas"),
  rule("rule-netflix", "NETFLIX", "Subscriptions"),
  rule("rule-payroll", "PAYROLL", "Income")
];

const starterTransactions = [
  transaction("tx-1", "2026-05-01", "PAYROLL DIRECT DEP", "First paycheck", 2500, "Income", "Checking", "csv"),
  transaction("tx-2", "2026-05-02", "KROGER 441", "", -86.42, "Groceries", "Checking", "csv"),
  transaction("tx-3", "2026-05-03", "SHELL OIL 0821", "", -42.1, "Gas", "Credit Card", "csv"),
  transaction("tx-4", "2026-05-04", "NETFLIX.COM", "", -15.49, "Subscriptions", "Credit Card", "csv"),
  transaction("tx-5", "2026-05-05", "MONTHLY MAINTENANCE FEE", "", -12, "Fees", "Checking", "csv"),
  transaction("tx-6", "2026-05-06", "UNKNOWN MARKET", "", -28.77, "", "Credit Card", "csv")
];

let state = loadState();
let importRows = [];
let importHeaders = [];

const elements = {
  month: document.querySelector("#budget-month"),
  tabs: document.querySelectorAll(".tab-button"),
  views: document.querySelectorAll(".view"),
  title: document.querySelector("#view-title"),
  subtitle: document.querySelector("#view-subtitle"),
  dashboardStats: document.querySelector("#dashboard-stats"),
  overspentList: document.querySelector("#overspent-list"),
  attentionList: document.querySelector("#attention-list"),
  budgetTable: document.querySelector("#budget-table"),
  addCategoryButton: document.querySelector("#add-category-button"),
  transactionForm: document.querySelector("#transaction-form"),
  transactionSearch: document.querySelector("#transaction-search"),
  transactionFilter: document.querySelector("#transaction-filter"),
  transactionsTable: document.querySelector("#transactions-table"),
  csvFile: document.querySelector("#csv-file"),
  csvText: document.querySelector("#csv-text"),
  previewImportButton: document.querySelector("#preview-import-button"),
  mappingPanel: document.querySelector("#mapping-panel"),
  mappingFields: document.querySelector("#mapping-fields"),
  importButton: document.querySelector("#import-transactions-button"),
  importPreviewHead: document.querySelector("#import-preview-head"),
  importPreviewBody: document.querySelector("#import-preview-body"),
  ruleForm: document.querySelector("#rule-form"),
  rulesList: document.querySelector("#rules-list"),
  reportOutput: document.querySelector("#report-output"),
  downloadReportButton: document.querySelector("#download-report-button"),
  exportJsonButton: document.querySelector("#export-json-button"),
  resetDataButton: document.querySelector("#reset-data-button")
};

function category(id, name, group, planned) {
  return { id, name, group, planned };
}

function rule(id, matchText, categoryName) {
  return { id, matchText, category: categoryName };
}

function transaction(id, date, payee, memo, amount, categoryName, account, source) {
  return {
    id,
    date,
    payee,
    memo,
    amount,
    category: categoryName,
    account,
    source,
    status: "cleared"
  };
}

function defaultState() {
  return {
    month: "2026-05",
    expectedIncome: 5000,
    categories: starterCategories,
    rules: starterRules,
    transactions: starterTransactions
  };
}

function loadState() {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (!saved) return defaultState();

  try {
    return JSON.parse(saved);
  } catch {
    return defaultState();
  }
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function formatMoney(value) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(value || 0);
}

function makeId(prefix) {
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function monthTransactions() {
  return state.transactions.filter((item) => item.date.startsWith(state.month));
}

function actualForCategory(categoryName) {
  return Math.abs(
    monthTransactions()
      .filter((item) => item.category === categoryName && item.amount < 0)
      .reduce((sum, item) => sum + item.amount, 0)
  );
}

function monthlyIncome() {
  return monthTransactions()
    .filter((item) => item.amount > 0)
    .reduce((sum, item) => sum + item.amount, 0);
}

function budgetSummary() {
  const planned = state.categories.reduce((sum, item) => sum + Number(item.planned || 0), 0);
  const actual = monthTransactions()
    .filter((item) => item.amount < 0)
    .reduce((sum, item) => sum + Math.abs(item.amount), 0);
  const remaining = planned - actual;
  const unassigned = state.expectedIncome - planned;

  return {
    income: state.expectedIncome,
    importedIncome: monthlyIncome(),
    planned,
    actual,
    remaining,
    unassigned
  };
}

function isFee(item) {
  const text = `${item.payee} ${item.memo}`.toUpperCase();
  return FEE_TERMS.some((term) => text.includes(term));
}

function isSubscription(item) {
  const text = `${item.payee} ${item.memo}`.toUpperCase();
  return SUBSCRIPTION_TERMS.some((term) => text.includes(term));
}

function applyRules(item) {
  const payee = item.payee.toUpperCase();
  const matched = state.rules.find((candidate) => payee.includes(candidate.matchText.toUpperCase()));
  if (matched) return matched.category;
  if (isFee(item)) return "Fees";
  return item.category || "";
}

function duplicateKey(item) {
  return [item.date, item.payee.trim().toUpperCase(), Number(item.amount).toFixed(2), item.account.trim().toUpperCase()].join("|");
}

function isDuplicate(item) {
  const key = duplicateKey(item);
  return state.transactions.some((existing) => duplicateKey(existing) === key);
}

function render() {
  saveState();
  elements.month.value = state.month;
  renderCategoryOptions();
  renderDashboard();
  renderBudget();
  renderTransactions();
  renderRules();
  renderReport();
}

function renderDashboard() {
  const summary = budgetSummary();
  const stats = [
    ["Expected Income", summary.income],
    ["Planned Spending", summary.planned],
    ["Actual Spending", summary.actual],
    ["Remaining Planned", summary.remaining],
    ["Unassigned", summary.unassigned]
  ];

  elements.dashboardStats.innerHTML = stats
    .map(([label, value]) => `<div class="stat"><span>${label}</span><strong>${formatMoney(value)}</strong></div>`)
    .join("");

  const overspent = state.categories
    .map((item) => ({ ...item, actual: actualForCategory(item.name) }))
    .filter((item) => item.actual > Number(item.planned || 0));

  elements.overspentList.innerHTML = overspent.length
    ? overspent.map((item) => notice(`${item.name}: ${formatMoney(item.actual - item.planned)} over`, "danger")).join("")
    : notice("No overspent categories for this month.", "good");

  const uncategorized = monthTransactions().filter((item) => !item.category);
  const fees = monthTransactions().filter(isFee);
  elements.attentionList.innerHTML = [
    notice(`${uncategorized.length} uncategorized transaction(s)`, uncategorized.length ? "warning" : "good"),
    notice(`${fees.length} likely fee transaction(s)`, fees.length ? "warning" : "good")
  ].join("");
}

function renderBudget() {
  elements.budgetTable.innerHTML = state.categories
    .map((item, index) => {
      const actual = actualForCategory(item.name);
      const remaining = Number(item.planned || 0) - actual;
      return `
        <tr>
          <td><input aria-label="Category name" value="${escapeHtml(item.name)}" data-category-field="name" data-id="${item.id}"></td>
          <td>${groupSelect(item.group, item.id)}</td>
          <td><input aria-label="Planned amount" type="number" step="0.01" value="${item.planned}" data-category-field="planned" data-id="${item.id}"></td>
          <td>${formatMoney(actual)}</td>
          <td class="${remaining < 0 ? "money-negative" : "money-positive"}">${formatMoney(remaining)}</td>
          <td>
            <div class="row-actions">
              <button class="secondary" type="button" data-move-category="${item.id}" data-direction="-1" ${index === 0 ? "disabled" : ""}>Up</button>
              <button class="secondary" type="button" data-move-category="${item.id}" data-direction="1" ${index === state.categories.length - 1 ? "disabled" : ""}>Down</button>
              <button class="danger" type="button" data-delete-category="${item.id}">Delete</button>
            </div>
          </td>
        </tr>
      `;
    })
    .join("");
}

function renderTransactions() {
  const search = elements.transactionSearch.value.trim().toLowerCase();
  const filter = elements.transactionFilter.value;
  const categories = categoryOptionsHtml();

  const rows = monthTransactions().filter((item) => {
    const searchable = `${item.payee} ${item.memo} ${item.account}`.toLowerCase();
    if (search && !searchable.includes(search)) return false;
    if (filter === "uncategorized") return !item.category;
    if (filter === "fees") return isFee(item);
    if (filter === "subscriptions") return isSubscription(item);
    return true;
  });

  elements.transactionsTable.innerHTML = rows
    .map((item) => {
      const flags = [
        isFee(item) ? '<span class="tag">fee</span>' : "",
        isSubscription(item) ? '<span class="tag">subscription</span>' : "",
        !item.category ? '<span class="tag">uncategorized</span>' : ""
      ].join(" ");

      return `
        <tr>
          <td>${item.date}</td>
          <td>${escapeHtml(item.payee)}</td>
          <td class="${item.amount < 0 ? "money-negative" : "money-positive"}">${formatMoney(item.amount)}</td>
          <td>
            <select data-transaction-category="${item.id}">
              <option value="">Uncategorized</option>
              ${categories.replace(`value="${escapeHtml(item.category)}"`, `value="${escapeHtml(item.category)}" selected`)}
            </select>
          </td>
          <td>${escapeHtml(item.account)}</td>
          <td>${flags}</td>
          <td><button class="danger" type="button" data-delete-transaction="${item.id}">Delete</button></td>
        </tr>
      `;
    })
    .join("");
}

function renderRules() {
  elements.rulesList.innerHTML = state.rules
    .map((item) => {
      const matchCount = state.transactions.filter((tx) => tx.payee.toUpperCase().includes(item.matchText.toUpperCase())).length;
      return `
        <div class="notice">
          <strong>${escapeHtml(item.matchText)}</strong> -> ${escapeHtml(item.category)}
          <span class="tag">${matchCount} match(es)</span>
          <button class="danger" type="button" data-delete-rule="${item.id}">Delete</button>
        </div>
      `;
    })
    .join("");
}

function renderReport() {
  elements.reportOutput.value = generateMarkdownReport();
}

function renderCategoryOptions() {
  document.querySelectorAll('select[name="category"]').forEach((select) => {
    const current = select.value;
    select.innerHTML = `<option value="">Uncategorized</option>${categoryOptionsHtml()}`;
    select.value = current;
  });
}

function categoryOptionsHtml() {
  const names = ["Income", ...state.categories.map((item) => item.name)];
  return names.map((name) => `<option value="${escapeHtml(name)}">${escapeHtml(name)}</option>`).join("");
}

function groupSelect(selected, id) {
  const options = GROUPS.map((group) => `<option value="${group}" ${group === selected ? "selected" : ""}>${group}</option>`).join("");
  return `<select aria-label="Category group" data-category-field="group" data-id="${id}">${options}</select>`;
}

function notice(text, type) {
  return `<div class="notice ${type || ""}">${escapeHtml(text)}</div>`;
}

function escapeHtml(value) {
  return String(value || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function parseCsv(text) {
  const rows = [];
  let current = "";
  let row = [];
  let quoted = false;

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    const next = text[index + 1];

    if (char === '"' && quoted && next === '"') {
      current += '"';
      index += 1;
    } else if (char === '"') {
      quoted = !quoted;
    } else if (char === "," && !quoted) {
      row.push(current.trim());
      current = "";
    } else if ((char === "\n" || char === "\r") && !quoted) {
      if (char === "\r" && next === "\n") index += 1;
      row.push(current.trim());
      if (row.some(Boolean)) rows.push(row);
      row = [];
      current = "";
    } else {
      current += char;
    }
  }

  row.push(current.trim());
  if (row.some(Boolean)) rows.push(row);
  return rows;
}

function guessMapping(headers) {
  const find = (...terms) => headers.find((header) => terms.some((term) => header.toLowerCase().includes(term)));
  return {
    date: find("date") || "",
    payee: find("description", "payee", "merchant", "name") || "",
    amount: find("amount") || "",
    debit: find("debit", "withdrawal") || "",
    credit: find("credit", "deposit") || "",
    account: find("account") || ""
  };
}

function renderImportPreview() {
  elements.importPreviewHead.innerHTML = `<tr>${importHeaders.map((header) => `<th>${escapeHtml(header)}</th>`).join("")}<th>Duplicate</th></tr>`;
  elements.importPreviewBody.innerHTML = importRows
    .slice(0, 10)
    .map((row) => {
      const mapped = mapImportRow(row, getMapping());
      return `<tr>${row.map((cell) => `<td>${escapeHtml(cell)}</td>`).join("")}<td>${isDuplicate(mapped) ? "Yes" : "No"}</td></tr>`;
    })
    .join("");
}

function renderMappingFields(mapping) {
  const fields = ["date", "payee", "amount", "debit", "credit", "account"];
  elements.mappingFields.innerHTML = fields
    .map((field) => {
      const options = [`<option value="">Not used</option>`]
        .concat(importHeaders.map((header) => `<option value="${escapeHtml(header)}" ${mapping[field] === header ? "selected" : ""}>${escapeHtml(header)}</option>`))
        .join("");
      return `<label>${field}<select data-map-field="${field}">${options}</select></label>`;
    })
    .join("");
}

function getMapping() {
  const mapping = {};
  document.querySelectorAll("[data-map-field]").forEach((select) => {
    mapping[select.dataset.mapField] = select.value;
  });
  return mapping;
}

function mapImportRow(row, mapping) {
  const value = (field) => {
    const header = mapping[field];
    const index = importHeaders.indexOf(header);
    return index >= 0 ? row[index] || "" : "";
  };

  const debit = parseAmount(value("debit"));
  const credit = parseAmount(value("credit"));
  const amountValue = value("amount") ? parseAmount(value("amount")) : credit - debit;
  const item = transaction(makeId("tx"), normalizeDate(value("date")), value("payee"), "", amountValue, "", value("account") || "Imported", "csv");
  item.category = applyRules(item);
  return item;
}

function parseAmount(value) {
  const cleaned = String(value || "").replace(/[$,()]/g, "").trim();
  const parsed = Number(cleaned);
  if (String(value).includes("(") && String(value).includes(")")) return -Math.abs(parsed);
  return Number.isFinite(parsed) ? parsed : 0;
}

function normalizeDate(value) {
  const parsed = new Date(value);
  if (!Number.isNaN(parsed.getTime())) return parsed.toISOString().slice(0, 10);
  return value;
}

function generateMarkdownReport() {
  const summary = budgetSummary();
  const categories = state.categories.map((item) => {
    const actual = actualForCategory(item.name);
    return { ...item, actual, remaining: Number(item.planned || 0) - actual };
  });
  const overspent = categories.filter((item) => item.remaining < 0);
  const fees = monthTransactions().filter(isFee);
  const subscriptions = monthTransactions().filter(isSubscription);
  const uncategorized = monthTransactions().filter((item) => !item.category);
  const suggestedRules = uncategorized.slice(0, 5).map((item) => `- If payee contains "${item.payee.split(" ")[0]}", category = `);

  return `# Zero Budget Monthly Review

## Month

${state.month}

## Income Summary

- Expected income: ${formatMoney(summary.income)}
- Imported income found: ${formatMoney(summary.importedIncome)}

## Planned vs Actual Spending

| Category | Planned | Actual | Remaining |
| --- | ---: | ---: | ---: |
${categories.map((item) => `| ${item.name} | ${formatMoney(item.planned)} | ${formatMoney(item.actual)} | ${formatMoney(item.remaining)} |`).join("\n")}

## Zero-Based Status

- Planned total: ${formatMoney(summary.planned)}
- Unassigned money: ${formatMoney(summary.unassigned)}
- Status: ${summary.unassigned === 0 ? "Zero-based" : "Needs assignment"}

## Overspent Categories

${overspent.length ? overspent.map((item) => `- ${item.name}: ${formatMoney(Math.abs(item.remaining))} over`).join("\n") : "- None"}

## Fees Found

${fees.length ? fees.map((item) => `- ${item.date} ${item.payee}: ${formatMoney(item.amount)}`).join("\n") : "- None"}

## Subscriptions Found

${subscriptions.length ? subscriptions.map((item) => `- ${item.date} ${item.payee}: ${formatMoney(item.amount)}`).join("\n") : "- None"}

## Uncategorized Transactions

${uncategorized.length ? uncategorized.map((item) => `- ${item.date} ${item.payee}: ${formatMoney(item.amount)}`).join("\n") : "- None"}

## Suggested Merchant Rules

${suggestedRules.length ? suggestedRules.join("\n") : "- None"}

## Notes

- 
`;
}

function downloadText(filename, text, type) {
  const blob = new Blob([text], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

function bindEvents() {
  elements.tabs.forEach((button) => {
    button.addEventListener("click", () => {
      elements.tabs.forEach((tab) => tab.classList.remove("active"));
      elements.views.forEach((view) => view.classList.remove("active-view"));
      button.classList.add("active");
      document.querySelector(`#${button.dataset.tab}`).classList.add("active-view");
      elements.title.textContent = button.textContent;
    });
  });

  elements.month.addEventListener("change", () => {
    state.month = elements.month.value;
    render();
  });

  elements.addCategoryButton.addEventListener("click", () => {
    state.categories.push(category(makeId("cat"), "New Category", "Personal", 0));
    render();
  });

  elements.budgetTable.addEventListener("change", (event) => {
    const field = event.target.dataset.categoryField;
    if (!field) return;
    const item = state.categories.find((candidate) => candidate.id === event.target.dataset.id);
    item[field] = field === "planned" ? Number(event.target.value) : event.target.value;
    render();
  });

  elements.budgetTable.addEventListener("click", (event) => {
    const deleteId = event.target.dataset.deleteCategory;
    const moveId = event.target.dataset.moveCategory;
    if (deleteId) state.categories = state.categories.filter((item) => item.id !== deleteId);
    if (moveId) {
      const index = state.categories.findIndex((item) => item.id === moveId);
      const direction = Number(event.target.dataset.direction);
      const nextIndex = index + direction;
      const item = state.categories.splice(index, 1)[0];
      state.categories.splice(nextIndex, 0, item);
    }
    render();
  });

  elements.transactionForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const data = new FormData(elements.transactionForm);
    state.transactions.push(
      transaction(
        makeId("tx"),
        data.get("date"),
        data.get("payee"),
        data.get("memo"),
        Number(data.get("amount")),
        data.get("category"),
        data.get("account"),
        "manual"
      )
    );
    elements.transactionForm.reset();
    render();
  });

  elements.transactionSearch.addEventListener("input", renderTransactions);
  elements.transactionFilter.addEventListener("change", renderTransactions);

  elements.transactionsTable.addEventListener("change", (event) => {
    const id = event.target.dataset.transactionCategory;
    if (!id) return;
    const item = state.transactions.find((candidate) => candidate.id === id);
    item.category = event.target.value;
    render();
  });

  elements.transactionsTable.addEventListener("click", (event) => {
    const id = event.target.dataset.deleteTransaction;
    if (!id) return;
    state.transactions = state.transactions.filter((item) => item.id !== id);
    render();
  });

  elements.csvFile.addEventListener("change", async () => {
    const file = elements.csvFile.files[0];
    if (file) elements.csvText.value = await file.text();
  });

  elements.previewImportButton.addEventListener("click", () => {
    const rows = parseCsv(elements.csvText.value);
    importHeaders = rows[0] || [];
    importRows = rows.slice(1);
    renderMappingFields(guessMapping(importHeaders));
    elements.mappingPanel.classList.toggle("hidden", !importRows.length);
    renderImportPreview();
  });

  elements.mappingFields.addEventListener("change", renderImportPreview);

  elements.importButton.addEventListener("click", () => {
    const mapping = getMapping();
    const mappedRows = importRows.map((row) => mapImportRow(row, mapping));
    const newRows = mappedRows.filter((item) => !isDuplicate(item));
    state.transactions = state.transactions.concat(newRows);
    render();
    renderImportPreview();
  });

  elements.ruleForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const data = new FormData(elements.ruleForm);
    state.rules.push(rule(makeId("rule"), data.get("matchText"), data.get("category")));
    elements.ruleForm.reset();
    render();
  });

  elements.rulesList.addEventListener("click", (event) => {
    const id = event.target.dataset.deleteRule;
    if (!id) return;
    state.rules = state.rules.filter((item) => item.id !== id);
    render();
  });

  elements.downloadReportButton.addEventListener("click", () => {
    downloadText(`zero-budget-${state.month}.md`, elements.reportOutput.value, "text/markdown");
  });

  elements.exportJsonButton.addEventListener("click", () => {
    downloadText(`zero-budget-backup-${state.month}.json`, JSON.stringify(state, null, 2), "application/json");
  });

  elements.resetDataButton.addEventListener("click", () => {
    if (!confirm("Reset all local budget data to starter data?")) return;
    state = defaultState();
    render();
  });
}

bindEvents();
render();
