const STORAGE_KEY = "zeroBudgetDataV1";
const API_BUDGET_URL = "/api/budget";

const GROUPS = [
  "Giving",
  "Housing",
  "Food",
  "Transportation",
  "Lifestyle",
  "Health",
  "Insurance",
  "Debt",
  "Savings",
  "Personal",
  "Subscriptions",
  "Fees"
];

const FEE_TERMS = ["ATM FEE", "OVERDRAFT", "MAINTENANCE FEE", "LATE FEE", "INTEREST CHARGE", "SERVICE CHARGE"];
const SUBSCRIPTION_TERMS = ["NETFLIX", "SPOTIFY", "APPLE", "GOOGLE", "AMAZON PRIME", "HULU", "DISNEY"];

const starterIncomeSources = [
  { id: "income-primary-job", name: "Primary Job", planned: 3200, received: 0 },
  { id: "income-side-work", name: "Side Work", planned: 300, received: 0 }
];

const starterCategories = [
  category("cat-giving", "Giving", "Giving", 350),
  category("cat-emergency-fund", "Emergency Fund", "Savings", 0),
  category("cat-tax-fund", "Tax Fund", "Savings", 350),
  category("cat-savings-fund", "Savings Fund", "Savings", 300),
  category("cat-tuition-fund", "Tuition Fund", "Savings", 0),
  category("cat-rent", "Rent", "Housing", 900),
  category("cat-utilities", "Utilities", "Housing", 200),
  category("cat-gas", "Gas", "Transportation", 120),
  category("cat-groceries", "Groceries", "Food", 400),
  category("cat-restaurants", "Restaurants", "Food", 150),
  category("cat-phone", "Phone", "Personal", 60),
  category("cat-personal", "Personal", "Personal", 100),
  category("cat-subscriptions", "Subscriptions", "Personal", 40),
  category("cat-miscellaneous", "Miscellaneous", "Lifestyle", 80),
  category("cat-health", "Health", "Health", 0),
  category("cat-auto-insurance", "Auto Insurance", "Insurance", 150),
  category("cat-credit-card", "Credit Card", "Debt", 100),
  category("cat-car-loan", "Car Loan", "Debt", 200)
];

const starterFunds = [
  fund("fund-giving", "Giving Fund", "Giving", 0, 350, 0),
  fund("fund-tax", "Tax Fund", "Tax Fund", 1000, 350, 0),
  fund("fund-emergency", "Emergency Fund", "Emergency Fund", 5000, 0, 0),
  fund("fund-savings", "Savings Fund", "Savings Fund", 2000, 300, 0),
  fund("fund-tuition", "Tuition Fund", "Tuition Fund", 0, 0, 0)
];

const starterRules = [
  rule("rule-kroger", "KROGER", "Groceries"),
  rule("rule-shell", "SHELL", "Gas"),
  rule("rule-netflix", "NETFLIX", "Subscriptions"),
  rule("rule-payroll", "PAYROLL", "Income")
];

const starterTransactions = [
  transaction("tx-1", "2026-02-01", "PAYROLL DIRECT DEP", "Paycheck", 3200, "Income", "Checking", "manual"),
  transaction("tx-2", "2026-02-02", "LOCAL GROCERY", "DEBIT", -86.42, "Groceries", "Checking", "manual"),
  transaction("tx-3", "2026-02-03", "FUEL STATION", "DEBIT", -42.1, "Gas", "Checking", "manual"),
  transaction("tx-4", "2026-02-04", "STREAMING SERVICE", "DEBIT", -15.49, "Subscriptions", "Checking", "manual")
];

let state = loadLocalState();
let storageMode = "browser";
let saveTimer = null;
let importRows = [];
let importHeaders = [];

const elements = {
  month: document.querySelector("#budget-month"),
  previousMonthButton: document.querySelector("#previous-month-button"),
  nextMonthButton: document.querySelector("#next-month-button"),
  tabs: document.querySelectorAll(".tab-button"),
  views: document.querySelectorAll(".view"),
  title: document.querySelector("#view-title"),
  subtitle: document.querySelector("#view-subtitle"),
  dashboardStats: document.querySelector("#dashboard-stats"),
  overspentList: document.querySelector("#overspent-list"),
  attentionList: document.querySelector("#attention-list"),
  budgetTable: document.querySelector("#budget-table"),
  budgetIncomeSummary: document.querySelector("#budget-income-summary"),
  addCategoryButton: document.querySelector("#add-category-button"),
  transactionForm: document.querySelector("#transaction-form"),
  transactionSearch: document.querySelector("#transaction-search"),
  transactionFilter: document.querySelector("#transaction-filter"),
  transactionTypeFilter: document.querySelector("#transaction-type-filter"),
  transactionSort: document.querySelector("#transaction-sort"),
  transactionsTable: document.querySelector("#transactions-table"),
  csvFile: document.querySelector("#csv-file"),
  csvText: document.querySelector("#csv-text"),
  previewImportButton: document.querySelector("#preview-import-button"),
  mappingPanel: document.querySelector("#mapping-panel"),
  mappingFields: document.querySelector("#mapping-fields"),
  importSummary: document.querySelector("#import-summary"),
  importCategorySummary: document.querySelector("#import-category-summary"),
  importButton: document.querySelector("#import-transactions-button"),
  importPreviewHead: document.querySelector("#import-preview-head"),
  importPreviewBody: document.querySelector("#import-preview-body"),
  fundsTable: document.querySelector("#funds-table"),
  fundOpeningLabel: document.querySelector("#fund-opening-label"),
  addFundButton: document.querySelector("#add-fund-button"),
  ruleForm: document.querySelector("#rule-form"),
  rulesList: document.querySelector("#rules-list"),
  reportOutput: document.querySelector("#report-output"),
  downloadReportButton: document.querySelector("#download-report-button"),
  exportJsonButton: document.querySelector("#export-json-button"),
  resetDataButton: document.querySelector("#reset-data-button"),
  dataLocation: document.querySelector("#data-location")
};

function category(id, name, group, planned) {
  return { id, name, group, planned };
}

function rule(id, matchText, categoryName) {
  return { id, matchText, category: categoryName };
}

function fund(id, name, categoryName, openingBalance, plannedThisMonth, activityThisMonth) {
  return {
    id,
    name,
    category: categoryName,
    openingBalance,
    plannedThisMonth,
    activityThisMonth
  };
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
  const expectedIncome = starterIncomeSources.reduce((sum, item) => sum + item.planned, 0);

  return {
    month: "2026-02",
    expectedIncome,
    incomeSources: clone(starterIncomeSources),
    categories: clone(starterCategories),
    funds: clone(starterFunds),
    monthlyFunds: {
      "2026-02": clone(starterFunds)
    },
    rules: clone(starterRules),
    transactions: clone(starterTransactions)
  };
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function loadLocalState() {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (!saved) return defaultState();

  try {
    return normalizeState(JSON.parse(saved));
  } catch {
    return defaultState();
  }
}

function normalizeState(savedState) {
  const defaults = defaultState();
  return {
    ...defaults,
    ...savedState,
    incomeSources: savedState.incomeSources || defaults.incomeSources,
    categories: savedState.categories || defaults.categories,
    funds: savedState.funds || defaults.funds,
    monthlyFunds: savedState.monthlyFunds || { [savedState.month || defaults.month]: savedState.funds || defaults.funds },
    rules: savedState.rules || defaults.rules,
    transactions: savedState.transactions || defaults.transactions
  };
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));

  if (storageMode !== "server") {
    return;
  }

  window.clearTimeout(saveTimer);
  saveTimer = window.setTimeout(saveServerState, 300);
}

async function loadServerState() {
  if (window.location.protocol === "file:") {
    return;
  }

  try {
    const response = await fetch(API_BUDGET_URL);
    if (!response.ok) throw new Error(`Budget API returned ${response.status}`);
    state = normalizeState(await response.json());
    storageMode = "server";
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (error) {
    console.warn("Using browser localStorage because the local JSON server is unavailable.", error);
    storageMode = "browser";
  }
}

async function saveServerState() {
  try {
    const response = await fetch(API_BUDGET_URL, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(state)
    });

    if (!response.ok) throw new Error(`Budget API returned ${response.status}`);
  } catch (error) {
    console.warn("Could not save to local JSON file. Browser localStorage still has the latest state.", error);
  }
}

function formatMoney(value) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(value || 0);
}

function makeId(prefix) {
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function monthTransactions(monthValue = state.month) {
  return state.transactions.filter((item) => item.date.startsWith(monthValue));
}

function actualForCategory(categoryName) {
  return Math.abs(
    monthTransactions()
      .filter((item) => item.category === categoryName && item.amount < 0)
      .reduce((sum, item) => sum + item.amount, 0)
  );
}

function monthlyIncome(monthValue = state.month) {
  return monthTransactions(monthValue)
    .filter((item) => item.amount > 0 && item.category === "Income")
    .reduce((sum, item) => sum + item.amount, 0);
}

function previousMonthValue(monthValue) {
  const [year, month] = monthValue.split("-").map(Number);
  const date = new Date(year, month - 2, 1);
  return date.toISOString().slice(0, 7);
}

function shiftMonth(monthValue, offset) {
  const [year, month] = monthValue.split("-").map(Number);
  const date = new Date(year, month - 1 + offset, 1);
  return date.toISOString().slice(0, 7);
}

function budgetIncomeBasis() {
  const previousMonth = previousMonthValue(state.month);
  const previousIncome = monthlyIncome(previousMonth);
  const fallbackIncome = Number(state.expectedIncome || 0);

  return {
    month: previousMonth,
    amount: previousIncome > 0 ? previousIncome : fallbackIncome,
    source: previousIncome > 0 ? "previous-month-actual" : "fallback-expected"
  };
}

function fundAvailable(item) {
  return Number(item.openingBalance || 0) + Number(item.plannedThisMonth || 0) + Number(item.activityThisMonth || 0);
}

function currentFunds() {
  if (!state.monthlyFunds) state.monthlyFunds = {};
  if (!state.monthlyFunds[state.month]) state.monthlyFunds[state.month] = clone(state.funds || []);
  return state.monthlyFunds[state.month];
}

function budgetSummary() {
  const incomeBasis = budgetIncomeBasis();
  const planned = state.categories.reduce((sum, item) => sum + Number(item.planned || 0), 0);
  const actual = monthTransactions()
    .filter((item) => item.amount < 0)
    .reduce((sum, item) => sum + Math.abs(item.amount), 0);
  const remaining = planned - actual;
  const unassigned = incomeBasis.amount - planned;

  return {
    income: incomeBasis.amount,
    incomeBasis,
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
  currentFunds();
  saveState();
  elements.month.value = state.month;
  renderDataLocation();
  renderCategoryOptions();
  renderTransactionTypeOptions();
  renderDashboard();
  renderBudget();
  renderFunds();
  renderTransactions();
  renderRules();
  renderReport();
}

function renderDataLocation() {
  if (!elements.dataLocation) return;

  elements.dataLocation.textContent =
    storageMode === "server"
      ? "Saving to data/zero-budget.json through the local server."
      : "Saving to this browser's localStorage fallback.";
}

function renderDashboard() {
  const summary = budgetSummary();
  const stats = [
    ["Budget Basis Income", summary.income],
    ["Current Month Income", summary.importedIncome],
    ["Planned Spending", summary.planned],
    ["Actual Spending", summary.actual],
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
  renderBudgetIncomeSummary();

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

function renderBudgetIncomeSummary() {
  if (!elements.budgetIncomeSummary) return;

  const summary = budgetSummary();
  const sourceLabel =
    summary.incomeBasis.source === "previous-month-actual"
      ? `${summary.incomeBasis.month} actual income`
      : "fallback expected income";

  const items = [
    ["Budget Basis", summary.income, sourceLabel],
    ["Current Month Income", summary.importedIncome, state.month],
    ["Planned Categories", summary.planned, "monthly plan"],
    ["Unassigned", summary.unassigned, "basis minus planned"]
  ];

  elements.budgetIncomeSummary.innerHTML = items
    .map(([label, value, note]) => `<div class="stat"><span>${label}</span><strong>${formatMoney(value)}</strong><small>${escapeHtml(note)}</small></div>`)
    .join("");
}

function renderFunds() {
  if (elements.fundOpeningLabel) {
    elements.fundOpeningLabel.textContent = `${previousMonthName(state.month)} Balance`;
  }

  elements.fundsTable.innerHTML = currentFunds()
    .map((item) => {
      const available = fundAvailable(item);
      return `
        <tr>
          <td><input aria-label="Fund name" value="${escapeHtml(item.name)}" data-fund-field="name" data-id="${item.id}"></td>
          <td>
            <select aria-label="Budget category" data-fund-field="category" data-id="${item.id}">
              ${state.categories.map((categoryItem) => `<option value="${escapeHtml(categoryItem.name)}" ${categoryItem.name === item.category ? "selected" : ""}>${escapeHtml(categoryItem.name)}</option>`).join("")}
            </select>
          </td>
          <td><input aria-label="Opening balance" type="number" step="0.01" value="${item.openingBalance}" data-fund-field="openingBalance" data-id="${item.id}"></td>
          <td><input aria-label="Planned this month" type="number" step="0.01" value="${item.plannedThisMonth}" data-fund-field="plannedThisMonth" data-id="${item.id}"></td>
          <td><input aria-label="Activity this month" type="number" step="0.01" value="${item.activityThisMonth}" data-fund-field="activityThisMonth" data-id="${item.id}"></td>
          <td class="${available < 0 ? "money-negative" : "money-positive"}">${formatMoney(available)}</td>
          <td><button class="danger" type="button" data-delete-fund="${item.id}">Delete</button></td>
        </tr>
      `;
    })
    .join("");
}

function previousMonthName(monthValue) {
  const [year, month] = monthValue.split("-").map(Number);
  const date = new Date(year, month - 2, 1);
  return date.toLocaleString("en-US", { month: "long" });
}

function renderTransactions() {
  const search = elements.transactionSearch.value.trim().toLowerCase();
  const filter = elements.transactionFilter.value;
  const typeFilter = elements.transactionTypeFilter.value;
  const sort = elements.transactionSort.value;
  const categories = categoryOptionsHtml();

  const rows = monthTransactions()
    .filter((item) => {
      const searchable = `${item.payee} ${item.memo} ${item.account} ${item.category}`.toLowerCase();
      if (search && !searchable.includes(search)) return false;
      if (typeFilter !== "all" && transactionType(item) !== typeFilter) return false;
      if (filter === "uncategorized") return !item.category;
      if (filter === "fees") return isFee(item);
      if (filter === "subscriptions") return isSubscription(item);
      return true;
    })
    .sort((left, right) => compareTransactions(left, right, sort));

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
          <td><span class="tag">${escapeHtml(transactionType(item))}</span></td>
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

function transactionType(item) {
  return item.memo || item.source || "manual";
}

function compareTransactions(left, right, sort) {
  const textCompare = (a, b) => String(a || "").localeCompare(String(b || ""));

  if (sort === "date-asc") return textCompare(left.date, right.date);
  if (sort === "amount-desc") return Number(right.amount || 0) - Number(left.amount || 0);
  if (sort === "amount-asc") return Number(left.amount || 0) - Number(right.amount || 0);
  if (sort === "income-first") return Number(right.amount > 0) - Number(left.amount > 0) || textCompare(right.date, left.date);
  if (sort === "spending-first") return Number(left.amount > 0) - Number(right.amount > 0) || textCompare(right.date, left.date);
  if (sort === "payee-asc") return textCompare(left.payee, right.payee);
  if (sort === "category-asc") return textCompare(left.category, right.category) || textCompare(left.date, right.date);
  if (sort === "category-desc") return textCompare(right.category, left.category) || textCompare(left.date, right.date);
  if (sort === "type-asc") return textCompare(transactionType(left), transactionType(right)) || textCompare(left.date, right.date);
  if (sort === "type-desc") return textCompare(transactionType(right), transactionType(left)) || textCompare(left.date, right.date);

  return textCompare(right.date, left.date);
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

function renderTransactionTypeOptions() {
  if (!elements.transactionTypeFilter) return;

  const current = elements.transactionTypeFilter.value || "all";
  const types = [...new Set(monthTransactions().map(transactionType))].sort((left, right) => left.localeCompare(right));
  elements.transactionTypeFilter.innerHTML = `<option value="all">All types</option>${types
    .map((type) => `<option value="${escapeHtml(type)}">${escapeHtml(type)}</option>`)
    .join("")}`;
  elements.transactionTypeFilter.value = types.includes(current) ? current : "all";
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
    account: find("account") || "",
    category: find("suggestedcategory", "category") || "",
    memo: find("memo", "transaction type") || "",
    source: find("source") || ""
  };
}

function renderImportPreview() {
  const mapping = getMapping();
  const mappedRows = importRows.map((row) => mapImportRow(row, mapping));
  const duplicateCount = mappedRows.filter(isDuplicate).length;
  const categorizedCount = mappedRows.filter((item) => item.category).length;

  elements.importSummary.textContent = importRows.length
    ? `${importRows.length} row(s) ready, ${categorizedCount} categorized, ${duplicateCount} duplicate(s) detected.`
    : "";

  renderImportCategorySummary(mappedRows);

  elements.importPreviewHead.innerHTML = `<tr>${importHeaders.map((header) => `<th>${escapeHtml(header)}</th>`).join("")}<th>Duplicate</th></tr>`;
  elements.importPreviewBody.innerHTML = importRows
    .slice(0, 10)
    .map((row) => {
      const mapped = mapImportRow(row, mapping);
      return `<tr>${row.map((cell) => `<td>${escapeHtml(cell)}</td>`).join("")}<td>${isDuplicate(mapped) ? "Yes" : "No"}</td></tr>`;
    })
    .join("");
}

function renderImportCategorySummary(rows) {
  if (!rows.length) {
    elements.importCategorySummary.innerHTML = "";
    return;
  }

  const totals = rows.reduce((summary, item) => {
    const key = item.category || "Uncategorized";
    if (!summary[key]) summary[key] = { count: 0, total: 0 };
    summary[key].count += 1;
    summary[key].total += Number(item.amount || 0);
    return summary;
  }, {});

  elements.importCategorySummary.innerHTML = Object.entries(totals)
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([name, summary]) => `<div class="notice"><strong>${escapeHtml(name)}</strong>: ${summary.count} row(s), ${formatMoney(summary.total)}</div>`)
    .join("");
}

function renderMappingFields(mapping) {
  const fields = ["date", "payee", "amount", "debit", "credit", "account", "category", "memo", "source"];
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
  item.memo = value("memo");
  item.source = value("source") || "csv";
  item.category = value("category") || applyRules(item);
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
  const incomeSources = state.incomeSources || [];
  const funds = currentFunds();
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

- Budget basis income: ${formatMoney(summary.income)}
- Basis source: ${summary.incomeBasis.source === "previous-month-actual" ? `${summary.incomeBasis.month} actual income` : "fallback expected income"}
- Current month income found: ${formatMoney(summary.importedIncome)}

| Source | Planned | Received |
| --- | ---: | ---: |
${incomeSources.map((item) => `| ${item.name} | ${formatMoney(item.planned)} | ${formatMoney(item.received)} |`).join("\n") || "| No income sources | $0.00 | $0.00 |"}

## Planned vs Actual Spending

| Category | Planned | Actual | Remaining |
| --- | ---: | ---: | ---: |
${categories.map((item) => `| ${item.name} | ${formatMoney(item.planned)} | ${formatMoney(item.actual)} | ${formatMoney(item.remaining)} |`).join("\n")}

## Zero-Based Status

- Planned total: ${formatMoney(summary.planned)}
- Unassigned money: ${formatMoney(summary.unassigned)}
- Status: ${summary.unassigned === 0 ? "Zero-based" : "Needs assignment"}

## Funds

| Fund | January Balance | Planned This Month | Activity This Month | Available |
| --- | ---: | ---: | ---: | ---: |
${funds.map((item) => `| ${item.name} | ${formatMoney(item.openingBalance)} | ${formatMoney(item.plannedThisMonth)} | ${formatMoney(item.activityThisMonth)} | ${formatMoney(fundAvailable(item))} |`).join("\n") || "| No funds | $0.00 | $0.00 | $0.00 | $0.00 |"}

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

  elements.previousMonthButton.addEventListener("click", () => {
    state.month = shiftMonth(state.month, -1);
    render();
  });

  elements.nextMonthButton.addEventListener("click", () => {
    state.month = shiftMonth(state.month, 1);
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

  elements.addFundButton.addEventListener("click", () => {
    const firstCategory = state.categories.find((item) => item.group === "Savings") || state.categories[0];
    currentFunds().push(fund(makeId("fund"), "New Fund", firstCategory ? firstCategory.name : "", 0, 0, 0));
    render();
  });

  elements.fundsTable.addEventListener("change", (event) => {
    const field = event.target.dataset.fundField;
    if (!field) return;
    const item = currentFunds().find((candidate) => candidate.id === event.target.dataset.id);
    item[field] = ["openingBalance", "plannedThisMonth", "activityThisMonth"].includes(field) ? Number(event.target.value) : event.target.value;
    render();
  });

  elements.fundsTable.addEventListener("click", (event) => {
    const id = event.target.dataset.deleteFund;
    if (!id) return;
    state.monthlyFunds[state.month] = currentFunds().filter((item) => item.id !== id);
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
  elements.transactionTypeFilter.addEventListener("change", renderTransactions);
  elements.transactionSort.addEventListener("change", renderTransactions);

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
    elements.importSummary.textContent = `Imported ${newRows.length} new transaction(s). Skipped ${mappedRows.length - newRows.length} duplicate(s).`;
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

async function initializeApp() {
  bindEvents();
  await loadServerState();
  render();
}

initializeApp();
