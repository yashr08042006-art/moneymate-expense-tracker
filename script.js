/* =========================================================
   MONEYMATE — EXPENSE TRACKER
   COMPLETE UPDATED SCRIPT
========================================================= */


/* =========================================================
   CONFIGURATION
========================================================= */

const CATEGORIES = [

    // Existing Categories
    "🚗 Auto — Morning",
    "🍛 Lunch",
    "☕ Snacks",
    "🚗 Auto — Evening",
    "🍽️ Mess",
    "🍽️ Dinner",
    "📚 Study",
    "🏠 Home",
    "📱 Phone Recharge",
    "🏠 Home Rent",
    "🔐 Home Security Money",
    "⚡ Electricity Bill",

    // New Categories
    "🛒 Online Shopping",
    "🍔 Food Delivery",
    "🎬 Entertainment",
    "🎮 Gaming",
    "🧑‍⚕️ Health & Medicine",
    "👕 Clothing",
    "🎁 Gifts",
    "✈️ Travel",
    "💪 Fitness",
    "🐶 Pets",
    "💇 Personal Care",
    "🎵 Subscriptions",
    "🛒 Grocery",
    "💵 Cash",

    // Other
    "📦 Other"

];


/*
    IMPORTANT:
    CATEGORIES is now the single source of truth.
    Do NOT create another category list.
*/

const ENHANCED_CATEGORIES = [
    ...CATEGORIES
];


const STORAGE_KEY =
    "moneymate_transactions_v1";

const THEME_KEY =
    "moneymate_theme_v1";

const BUDGET_KEY =
    "moneymate_budget_v1";

const CATEGORY_BUDGET_KEY =
    "moneymate_category_budgets_v1";

const GOALS_KEY =
    "moneymate_goals_v1";

const REMINDERS_KEY =
    "moneymate_reminders_v1";

const AUTO_BACKUP_KEY =
    "moneymate_auto_backup_v1";


let transactions =
    loadTransactions();

let editingId =
    null;

let currentType =
    "expense";

let toastTimer =
    null;


/* =========================================================
   HELPER
========================================================= */

const $ = id =>
    document.getElementById(id);


function money(value) {

    return new Intl.NumberFormat(
        "en-IN",
        {
            style: "currency",
            currency: "INR",
            maximumFractionDigits: 2
        }
    ).format(
        Number(value) || 0
    );

}


function compactMoney(value) {

    value =
        Number(value) || 0;

    if (value >= 10000000) {

        return (
            "₹" +
            (value / 10000000)
                .toFixed(1) +
            "Cr"
        );

    }

    if (value >= 100000) {

        return (
            "₹" +
            (value / 100000)
                .toFixed(1) +
            "L"
        );

    }

    if (value >= 1000) {

        return (
            "₹" +
            (value / 1000)
                .toFixed(1) +
            "K"
        );

    }

    return "₹" + Math.round(value);

}


function escapeHTML(value) {

    return String(
        value ?? ""
    ).replace(
        /[&<>"']/g,
        character => {

            const map = {

                "&": "&amp;",
                "<": "&lt;",
                ">": "&gt;",
                '"': "&quot;",
                "'": "&#039;"

            };

            return map[character];

        }
    );

}


function createId() {

    if (
        window.crypto &&
        crypto.randomUUID
    ) {

        return crypto.randomUUID();

    }

    return (
        Date.now().toString(36) +
        Math.random()
            .toString(36)
            .slice(2)
    );

}


function localDateTime(date) {

    const adjusted =
        new Date(
            date.getTime() -
            date.getTimezoneOffset() *
            60000
        );

    return adjusted
        .toISOString()
        .slice(0, 16);

}


function formatDate(value) {

    const date =
        new Date(value);

    if (
        Number.isNaN(
            date.getTime()
        )
    ) {

        return "Unknown date";

    }

    return date.toLocaleDateString(
        "en-IN",
        {
            day: "2-digit",
            month: "short",
            year: "numeric"
        }
    );

}


function formatShortDate(value) {

    const date =
        new Date(value);

    if (
        Number.isNaN(
            date.getTime()
        )
    ) {

        return "";

    }

    return date.toLocaleDateString(
        "en-IN",
        {
            day: "2-digit",
            month: "short"
        }
    );

}


function formatTime(value) {

    const date =
        new Date(value);

    return date.toLocaleTimeString(
        "en-IN",
        {
            hour: "2-digit",
            minute: "2-digit"
        }
    );

}


function showToast(message) {

    const toast =
        $("toast");

    if (!toast)
        return;

    toast.textContent =
        message;

    toast.classList.add(
        "show"
    );

    clearTimeout(
        toastTimer
    );

    toastTimer =
        setTimeout(
            () => {

                toast.classList.remove(
                    "show"
                );

            },
            2400
        );

}


/* =========================================================
   LOCAL STORAGE
========================================================= */

function loadTransactions() {

    try {

        const saved =
            localStorage.getItem(
                STORAGE_KEY
            );

        const data =
            JSON.parse(
                saved || "[]"
            );

        return Array.isArray(data)
            ? data
            : [];

    }

    catch {

        return [];

    }

}


function saveTransactions() {

    localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(
            transactions
        )
    );

    /*
        Automatic local backup.
        This does NOT replace normal
        Export JSON backup.
    */

    try {

        localStorage.setItem(
            AUTO_BACKUP_KEY,
            JSON.stringify({

                version: 1,

                savedAt:
                    new Date()
                        .toISOString(),

                transactions:
                    transactions

            })
        );

    }

    catch {

        console.warn(
            "Automatic backup could not be created."
        );

    }

    updateAutoBackupStatus();

}


function loadJSON(
    key,
    fallback
) {

    try {

        const saved =
            localStorage.getItem(
                key
            );

        if (!saved)
            return fallback;

        return JSON.parse(
            saved
        );

    }

    catch {

        return fallback;

    }

}


function saveJSON(
    key,
    value
) {

    localStorage.setItem(
        key,
        JSON.stringify(value)
    );

}


/* =========================================================
   AUTOMATIC BACKUP STATUS
========================================================= */

function updateAutoBackupStatus() {

    const element =
        $("autoBackupStatus");

    if (!element)
        return;

    const backup =
        loadJSON(
            AUTO_BACKUP_KEY,
            null
        );

    if (
        !backup ||
        !backup.savedAt
    ) {

        element.innerHTML =
            "🔄 Automatic backup: <strong>Not created yet</strong>";

        return;

    }

    const date =
        new Date(
            backup.savedAt
        );

    element.innerHTML =
        `🔄 Automatic backup: <strong>${formatDate(
            date
        )} ${formatTime(
            date
        )}</strong>`;

}


/* =========================================================
   CATEGORY SETUP
========================================================= */

function populateCategories() {

    const categorySelect =
        $("category");

    const categoryFilter =
        $("categoryFilter");


    if (categorySelect) {

        categorySelect.innerHTML =
            CATEGORIES
                .map(
                    category => `
                        <option value="${escapeHTML(
                            category
                        )}">
                            ${escapeHTML(
                                category
                            )}
                        </option>
                    `
                )
                .join("");

    }


    if (categoryFilter) {

        categoryFilter.innerHTML =
            `
            <option value="all">
                All Categories
            </option>
            ` +

            CATEGORIES
                .map(
                    category => `
                        <option value="${escapeHTML(
                            category
                        )}">
                            ${escapeHTML(
                                category
                            )}
                        </option>
                    `
                )
                .join("");

    }

}


/* =========================================================
   TRANSACTION TYPE
========================================================= */

function setType(type) {

    currentType =
        type;


    if ($("expenseTypeBtn")) {

        $("expenseTypeBtn")
            .classList
            .toggle(
                "active",
                type === "expense"
            );

    }


    if ($("incomeTypeBtn")) {

        $("incomeTypeBtn")
            .classList
            .toggle(
                "active",
                type === "income"
            );

    }


    if ($("category")) {

        $("category").disabled =
            type === "income";

    }


    if (
        type === "income" &&
        $("category")
    ) {

        $("category").value =
            "📦 Other";

    }

}


/* =========================================================
   MODAL
========================================================= */

function openModal(
    id = null
) {

    editingId =
        id;


    if ($("modalTitle")) {

        $("modalTitle").textContent =
            id
                ? "Edit Transaction"
                : "Add Transaction";

    }


    if (id) {

        const transaction =
            transactions.find(
                item =>
                    item.id === id
            );


        if (!transaction)
            return;


        setType(
            transaction.type
        );


        $("amount").value =
            transaction.amount;


        $("transactionName").value =
            transaction.name;


        $("category").value =
            transaction.category;


        $("dateTime").value =
            localDateTime(
                new Date(
                    transaction.date
                )
            );


        $("paymentMethod").value =
            transaction.paymentMethod ||
            "Other";


        $("note").value =
            transaction.note ||
            "";

    }

    else {

        $("transactionForm")
            .reset();


        setType(
            "expense"
        );


        $("dateTime").value =
            localDateTime(
                new Date()
            );


        $("paymentMethod").value =
            "UPI";

    }


    $("transactionModal")
        .classList
        .remove(
            "hidden"
        );


    setTimeout(
        () => {

            if ($("amount"))
                $("amount").focus();

        },
        50
    );

}


function closeModal() {

    if ($("transactionModal")) {

        $("transactionModal")
            .classList
            .add(
                "hidden"
            );

    }

    editingId =
        null;

}


/* =========================================================
   ADD / EDIT TRANSACTION
========================================================= */

if ($("openAddBtn")) {

    $("openAddBtn")
        .addEventListener(
            "click",
            () =>
                openModal()
        );

}


if ($("expenseTypeBtn")) {

    $("expenseTypeBtn")
        .addEventListener(
            "click",
            () =>
                setType(
                    "expense"
                )
        );

}


if ($("incomeTypeBtn")) {

    $("incomeTypeBtn")
        .addEventListener(
            "click",
            () =>
                setType(
                    "income"
                )
        );

}


document
    .querySelectorAll(
        "[data-close-modal]"
    )
    .forEach(
        element => {

            element.addEventListener(
                "click",
                closeModal
            );

        }
    );


if ($("transactionForm")) {

    $("transactionForm")
        .addEventListener(
            "submit",
            event => {

                event.preventDefault();


                const amount =
                    Number(
                        $("amount")
                            .value
                    );


                if (
                    !amount ||
                    amount <= 0
                ) {

                    showToast(
                        "Please enter a valid amount."
                    );

                    return;

                }


                const name =
                    $("transactionName")
                        .value
                        .trim();


                if (!name) {

                    showToast(
                        "Please enter a transaction name."
                    );

                    return;

                }


                const dateValue =
                    $("dateTime")
                        .value;


                const date =
                    dateValue
                        ? new Date(
                            dateValue
                        ).toISOString()
                        : new Date()
                            .toISOString();


                const transaction = {

                    id:
                        editingId ||
                        createId(),

                    type:
                        currentType,

                    amount:
                        amount,

                    name:
                        name,

                    category:
                        currentType === "income"
                            ? "📦 Other"
                            : $("category")
                                .value,

                    date:
                        date,

                    paymentMethod:
                        $("paymentMethod")
                            .value,

                    note:
                        $("note")
                            .value
                            .trim()

                };


                const wasEditing =
                    Boolean(
                        editingId
                    );


                if (wasEditing) {

                    transactions =
                        transactions.map(
                            item =>
                                item.id ===
                                editingId
                                    ? transaction
                                    : item
                        );

                }

                else {

                    transactions.push(
                        transaction
                    );

                }


                saveTransactions();

                closeModal();

                renderAll();

                showToast(
                    wasEditing
                        ? "Transaction updated."
                        : "Transaction saved."
                );

            }
        );

}


/* =========================================================
   TOTALS
========================================================= */

function calculateTotals() {

    const income =
        transactions
            .filter(
                transaction =>
                    transaction.type ===
                    "income"
            )
            .reduce(
                (
                    total,
                    transaction
                ) =>
                    total +
                    Number(
                        transaction.amount
                    ),
                0
            );


    const expenses =
        transactions
            .filter(
                transaction =>
                    transaction.type ===
                    "expense"
            )
            .reduce(
                (
                    total,
                    transaction
                ) =>
                    total +
                    Number(
                        transaction.amount
                    ),
                0
            );


    return {

        income,

        expenses,

        balance:
            income -
            expenses

    };

}


function getCurrentMonthExpense() {

    const now =
        new Date();

    const year =
        now.getFullYear();

    const month =
        now.getMonth();


    return transactions

        .filter(
            transaction =>
                transaction.type ===
                "expense"
        )

        .filter(
            transaction => {

                const date =
                    new Date(
                        transaction.date
                    );

                return (
                    date.getFullYear() ===
                    year &&

                    date.getMonth() ===
                    month
                );

            }
        )

        .reduce(
            (
                total,
                transaction
            ) =>
                total +
                Number(
                    transaction.amount
                ),
            0
        );

}


function getTodayExpense() {

    const today =
        new Date()
            .toDateString();


    return transactions

        .filter(
            transaction =>
                transaction.type ===
                "expense"
        )

        .filter(
            transaction =>
                new Date(
                    transaction.date
                ).toDateString() ===
                today
        )

        .reduce(
            (
                total,
                transaction
            ) =>
                total +
                Number(
                    transaction.amount
                ),
            0
        );

}


/* =========================================================
   SUMMARY
========================================================= */

function renderSummary() {

    const totals =
        calculateTotals();


    if ($("totalBalance")) {

        $("totalBalance")
            .textContent =
            money(
                totals.balance
            );

    }


    if ($("totalIncome")) {

        $("totalIncome")
            .textContent =
            money(
                totals.income
            );

    }


    if ($("totalExpenses")) {

        $("totalExpenses")
            .textContent =
            money(
                totals.expenses
            );

    }


    if ($("monthExpenses")) {

        $("monthExpenses")
            .textContent =
            money(
                getCurrentMonthExpense()
            );

    }


    if ($("monthChange")) {

        $("monthChange")
            .textContent =
            `Today: ${money(
                getTodayExpense()
            )}`;

    }

}


/* =========================================================
   TRANSACTION HTML
========================================================= */

function transactionHTML(
    transaction
) {

    const sign =
        transaction.type ===
        "expense"
            ? "−"
            : "+";


    return `

        <div
            class="transaction-row"
            data-transaction-id="${escapeHTML(
                transaction.id
            )}"
        >

            <div
                class="tx-icon ${
                    transaction.type ===
                    "income"
                        ? "income"
                        : ""
                }"
            >
                ${
                    transaction.type ===
                    "income"
                        ? "↗"
                        : "↘"
                }
            </div>


            <div>

                <div class="tx-name">
                    ${escapeHTML(
                        transaction.name
                    )}
                </div>

                <div class="tx-meta">

                    ${escapeHTML(
                        transaction.category
                    )}

                    ·

                    ${escapeHTML(
                        transaction.paymentMethod ||
                        "Other"
                    )}

                    ${
                        transaction.note
                            ? `
                                ·
                                ${escapeHTML(
                                    transaction.note
                                )}
                              `
                            : ""
                    }

                </div>

            </div>


            <div class="tx-date">

                ${formatShortDate(
                    transaction.date
                )}

                <br>

                ${formatTime(
                    transaction.date
                )}

            </div>


            <div
                class="tx-amount ${
                    transaction.type ===
                    "income"
                        ? "income"
                        : "expense"
                }"
            >

                ${sign}
                ${money(
                    transaction.amount
                )}

            </div>


            <div class="tx-actions">

                <button
                    class="icon-button edit-btn"
                    data-id="${escapeHTML(
                        transaction.id
                    )}"
                    title="Edit"
                >
                    ✏️
                </button>

                <button
                    class="icon-button delete-btn"
                    data-id="${escapeHTML(
                        transaction.id
                    )}"
                    title="Delete"
                >
                    🗑️
                </button>

            </div>

        </div>

    `;

}


/* =========================================================
   RENDER RECENT TRANSACTIONS
========================================================= */

function renderRecentTransactions() {

    const container =
        $("recentTransactions");

    if (!container)
        return;


    const list =
        [...transactions]
            .sort(
                (a, b) =>
                    new Date(b.date) -
                    new Date(a.date)
            )
            .slice(
                0,
                8
            );


    if (!list.length) {

        container.innerHTML = `

            <div class="empty">

                <strong>
                    No transactions yet
                </strong>

                Add your first transaction.

            </div>

        `;

        return;

    }


    container.innerHTML =
        list
            .map(
                transaction =>
                    transactionHTML(
                        transaction
                    )
            )
            .join("");

}


/* =========================================================
   TRANSACTION FILTERS
========================================================= */

function renderHistoryTransactions() {

    const container =
        $("historyTransactions");

    if (!container)
        return;


    const search =
        (
            $("searchInput")
                ?.value ||
            ""
        )
            .trim()
            .toLowerCase();


    const type =
        $("typeFilter")
            ?.value ||
        "all";


    const category =
        $("categoryFilter")
            ?.value ||
        "all";


    const month =
        $("monthFilter")
            ?.value ||
        "";


    const year =
        $("yearFilter")
            ?.value ||
        "all";


    const min =
        Number(
            $("minAmount")
                ?.value
        ) || 0;


    const maxInput =
        $("maxAmount")
            ?.value;


    const max =
        maxInput === ""
            ? Infinity
            : Number(
                maxInput
            );


    const method =
        $("paymentFilter")
            ?.value ||
        "all";


    const from =
        $("fromDate")
            ?.value ||
        "";


    const to =
        $("toDate")
            ?.value ||
        "";


    const sort =
        $("sortFilter")
            ?.value ||
        "date-desc";


    let list =
        [...transactions]
            .filter(
                transaction => {

                    const text = `

                        ${transaction.name}

                        ${transaction.category}

                        ${transaction.paymentMethod}

                        ${transaction.note}

                    `
                        .toLowerCase();


                    const date =
                        (
                            transaction.date ||
                            ""
                        ).slice(
                            0,
                            10
                        );


                    return (

                        (
                            !search ||
                            text.includes(
                                search
                            )
                        ) &&

                        (
                            type === "all" ||
                            transaction.type ===
                            type
                        ) &&

                        (
                            category === "all" ||
                            transaction.category ===
                            category
                        ) &&

                        (
                            !month ||
                            (
                                transaction.date ||
                                ""
                            ).slice(
                                0,
                                7
                            ) === month
                        ) &&

                        (
                            year === "all" ||
                            (
                                transaction.date ||
                                ""
                            ).slice(
                                0,
                                4
                            ) === year
                        ) &&

                        Number(
                            transaction.amount
                        ) >= min &&

                        Number(
                            transaction.amount
                        ) <= max &&

                        (
                            method === "all" ||
                            transaction.paymentMethod ===
                            method
                        ) &&

                        (
                            !from ||
                            date >= from
                        ) &&

                        (
                            !to ||
                            date <= to
                        )

                    );

                }
            );


    list.sort(
        (
            a,
            b
        ) => {

            switch (sort) {

                case "date-asc":

                    return (
                        new Date(
                            a.date
                        ) -
                        new Date(
                            b.date
                        )
                    );


                case "amount-desc":

                    return (
                        b.amount -
                        a.amount
                    );


                case "amount-asc":

                    return (
                        a.amount -
                        b.amount
                    );


                case "name-asc":

                    return a.name
                        .localeCompare(
                            b.name
                        );


                default:

                    return (
                        new Date(
                            b.date
                        ) -
                        new Date(
                            a.date
                        )
                    );

            }

        }
    );


    if (!list.length) {

        container.innerHTML = `

            <div class="empty">

                <strong>
                    No matching transactions
                </strong>

                Try changing your filters.

            </div>

        `;

        return;

    }


    container.innerHTML =
        list
            .map(
                transaction =>
                    transactionHTML(
                        transaction
                    )
            )
            .join("");

}


/* =========================================================
   CATEGORY TOTALS
========================================================= */

function getCategoryTotals(
    source = transactions
) {

    const totals = {};


    source

        .filter(
            transaction =>
                transaction.type ===
                "expense"
        )

        .forEach(
            transaction => {

                const category =
                    transaction.category;


                totals[category] =
                    (
                        totals[category] ||
                        0
                    ) +
                    Number(
                        transaction.amount
                    );

            }
        );


    return Object.entries(
        totals
    )
        .sort(
            (a, b) =>
                b[1] -
                a[1]
        );

}


/* =========================================================
   CATEGORY BREAKDOWN
========================================================= */

function renderCategoryBreakdown() {

    const container =
        $("categoryBreakdown");

    if (!container)
        return;


    const rows =
        getCategoryTotals();


    const total =
        rows.reduce(
            (
                sum,
                row
            ) =>
                sum +
                row[1],
            0
        );


    if (!rows.length) {

        container.innerHTML = `

            <div class="empty">

                No expense data yet.

            </div>

        `;

        return;

    }


    container.innerHTML =
        rows
            .map(
                (
                    [
                        category,
                        amount
                    ]
                ) => {

                    const percentage =
                        total
                            ? (
                                amount /
                                total
                            ) *
                            100
                            : 0;


                    return `

                        <div
                            class="category-row clickable-category"
                            data-category="${escapeHTML(
                                category
                            )}"
                        >

                            <div
                                class="category-icon"
                            >
                                ${escapeHTML(
                                    category
                                        .split(" ")[0]
                                )}
                            </div>


                            <div
                                class="category-info"
                            >

                                <strong>
                                    ${escapeHTML(
                                        category
                                    )}
                                </strong>

                                <div
                                    class="category-progress"
                                >

                                    <span
                                        style="width:${percentage}%"
                                    ></span>

                                </div>

                            </div>


                            <strong>
                                ${money(
                                    amount
                                )}
                            </strong>

                        </div>

                    `;

                }
            )
            .join("");

}


/* =========================================================
   DELETE TRANSACTION
========================================================= */

function deleteTransaction(
    id
) {

    const transaction =
        transactions.find(
            item =>
                item.id === id
        );


    if (!transaction)
        return;


    const confirmed =
        confirm(
            `Delete "${transaction.name}" (${money(
                transaction.amount
            )})?`
        );


    if (!confirmed)
        return;


    transactions =
        transactions.filter(
            item =>
                item.id !== id
        );


    saveTransactions();

    renderAll();

    showToast(
        "Transaction deleted."
    );

}


/* =========================================================
   EVENT DELEGATION
========================================================= */

document.addEventListener(
    "click",
    event => {

        const editButton =
            event.target.closest(
                ".edit-btn"
            );


        if (editButton) {

            openModal(
                editButton.dataset.id
            );

            return;

        }


        const deleteButton =
            event.target.closest(
                ".delete-btn"
            );


        if (deleteButton) {

            deleteTransaction(
                deleteButton.dataset.id
            );

            return;

        }


        const categoryCard =
            event.target.closest(
                ".clickable-category"
            );


        if (categoryCard) {

            const category =
                categoryCard.dataset.category;

            showPage(
                "transactions"
            );

            setTimeout(
                () => {

                    if ($("categoryFilter")) {

                        $("categoryFilter")
                            .value =
                            category;

                    }

                    renderHistoryTransactions();

                },
                20
            );

        }

    }
);


/* =========================================================
   YEAR FILTER
========================================================= */

function populateYearFilter() {

    const yearSelect =
        $("yearFilter");

    if (!yearSelect)
        return;


    const current =
        yearSelect.value;


    const years =
        [
            ...new Set(
                transactions
                    .map(
                        transaction =>
                            (
                                transaction.date ||
                                ""
                            ).slice(
                                0,
                                4
                            )
                    )
                    .filter(
                        Boolean
                    )
            )
        ]
            .sort()
            .reverse();


    yearSelect.innerHTML =
        `
        <option value="all">
            All Years
        </option>
        ` +

        years
            .map(
                year => `
                    <option value="${year}">
                        ${year}
                    </option>
                `
            )
            .join("");


    if (
        years.includes(
            current
        )
    ) {

        yearSelect.value =
            current;

    }

}


/* =========================================================
   PAGE NAVIGATION
========================================================= */

function showPage(
    page
) {

    document
        .querySelectorAll(
            ".page"
        )
        .forEach(
            section => {

                section.classList
                    .remove(
                        "active"
                    );

            }
        );


    const selected =
        $(
            page +
            "Page"
        );


    if (selected) {

        selected.classList
            .add(
                "active"
            );

    }


    document
        .querySelectorAll(
            ".nav-btn"
        )
        .forEach(
            button => {

                button.classList
                    .toggle(
                        "active",
                        button.dataset.page ===
                        page
                    );

            }
        );


    const titles = {

        dashboard:
            "Dashboard",

        transactions:
            "Transactions",

        analytics:
            "Analytics",

        backup:
            "Backup & Data",

        categories:
            "Categories",

        budget:
            "Budget & Goals",

        reminders:
            "Reminders",

        activity:
            "Spending Activity"

    };


    if ($("pageTitle")) {

        $("pageTitle")
            .textContent =
            titles[page] ||
            "MoneyMate";

    }


    if (
        page ===
        "transactions"
    ) {

        renderHistoryTransactions();

    }


    if (
        page ===
        "categories"
    ) {

        renderFullCategories();

    }


    if (
        page ===
        "budget"
    ) {

        renderBudgets();

    }


    if (
        page ===
        "activity"
    ) {

        renderSpendingActivity();

    }

}


document
    .addEventListener(
        "click",
        event => {

            const nav =
                event.target.closest(
                    ".nav-btn"
                );


            if (
                nav &&
                nav.dataset.page
            ) {

                showPage(
                    nav.dataset.page
                );

            }


            const pageLink =
                event.target.closest(
                    "[data-page-link]"
                );


            if (
                pageLink &&
                pageLink.dataset.pageLink
            ) {

                showPage(
                    pageLink.dataset.pageLink
                );

            }

        }
    );


/* =========================================================
   ADD EXTRA FINANCE PAGES
========================================================= */

function addFinancePages() {

    const main =
        document.querySelector(
            ".main"
        );

    const nav =
        document.querySelector(
            ".navigation"
        );


    if (
        !main ||
        !nav
    )
        return;


    /*
        Do not add twice.
    */

    if (
        $("categoriesPage")
    )
        return;


    nav.insertAdjacentHTML(
        "beforeend",
        `

        <button
            class="nav-btn"
            data-page="categories"
        >
            <span>🏷️</span>
            Categories
        </button>


        <button
            class="nav-btn"
            data-page="budget"
        >
            <span>🎯</span>
            Budget & Goals
        </button>


        <button
            class="nav-btn"
            data-page="reminders"
        >
            <span>🔔</span>
            Reminders
        </button>


        <button
            class="nav-btn"
            data-page="activity"
        >
            <span>📊</span>
            Spending Activity
        </button>

        `

    );


    main.insertAdjacentHTML(
        "beforeend",
        `

        <!-- =================================================
             CATEGORIES
        ================================================= -->

        <section
            class="page"
            id="categoriesPage"
        >

            <section class="panel">

                <div class="panel-header">

                    <div>

                        <h2>
                            Category Spending
                        </h2>

                        <p>
                            Click a category to see all its payments.
                        </p>

                    </div>

                </div>


                <div
                    id="fullCategoryList"
                    class="category-list"
                ></div>

            </section>

        </section>


        <!-- =================================================
             BUDGET
        ================================================= -->

        <section
            class="page"
            id="budgetPage"
        >

            <section class="panel">

                <div class="panel-header">

                    <div>

                        <h2>
                            🎯 Monthly Budget
                        </h2>

                        <p>
                            Track your monthly spending.
                        </p>

                    </div>

                </div>


                <div class="form-grid">

                    <label>

                        Monthly Budget

                        <input
                            id="monthlyBudgetInput"
                            type="number"
                            min="0"
                            placeholder="10000"
                        >

                    </label>


                    <label>

                        &nbsp;

                        <button
                            class="primary-button"
                            id="saveBudgetBtn"
                            type="button"
                        >
                            Save Budget
                        </button>

                    </label>

                </div>


                <div
                    id="budgetStatus"
                    class="data-note"
                ></div>

            </section>


            <section class="panel">

                <div class="panel-header">

                    <div>

                        <h2>
                            🏷️ Category-wise Budgets
                        </h2>

                        <p>
                            Set a separate budget for every category.
                        </p>

                    </div>

                </div>


                <div
                    id="categoryBudgetList"
                ></div>

            </section>


            <section class="panel">

                <div class="panel-header">

                    <div>

                        <h2>
                            💰 Savings Goals
                        </h2>

                    </div>

                </div>


                <div class="form-grid">

                    <label>

                        Goal Name

                        <input
                            id="goalName"
                            type="text"
                            placeholder="New Laptop"
                        >

                    </label>


                    <label>

                        Target Amount

                        <input
                            id="goalTarget"
                            type="number"
                            min="0"
                        >

                    </label>


                    <label>

                        Saved Amount

                        <input
                            id="goalSaved"
                            type="number"
                            min="0"
                        >

                    </label>


                    <label>

                        &nbsp;

                        <button
                            id="saveGoalBtn"
                            class="primary-button"
                            type="button"
                        >
                            Add Goal
                        </button>

                    </label>

                </div>


                <div
                    id="goalsList"
                ></div>

            </section>

        </section>


        <!-- =================================================
             REMINDERS
        ================================================= -->

        <section
            class="page"
            id="remindersPage"
        >

            <section class="panel">

                <div class="panel-header">

                    <div>

                        <h2>
                            🔔 Reminders
                        </h2>

                        <p>
                            Keep track of upcoming payments.
                        </p>

                    </div>

                </div>


                <div class="form-grid">

                    <label>

                        Reminder Name

                        <input
                            id="reminderName"
                            type="text"
                            placeholder="Electricity Bill"
                        >

                    </label>


                    <label>

                        Date

                        <input
                            id="reminderDate"
                            type="date"
                        >

                    </label>


                    <label>

                        Amount

                        <input
                            id="reminderAmount"
                            type="number"
                            min="0"
                        >

                    </label>


                    <label>

                        &nbsp;

                        <button
                            id="saveReminderBtn"
                            class="primary-button"
                            type="button"
                        >
                            Add Reminder
                        </button>

                    </label>

                </div>


                <div
                    id="remindersList"
                ></div>

            </section>

        </section>


        <!-- =================================================
             SPENDING ACTIVITY
        ================================================= -->

        <section
            class="page"
            id="activityPage"
        >

            <section class="panel">

                <div class="panel-header">

                    <div>

                        <h2>
                            📊 Spending Activity
                        </h2>

                        <p>
                            Review your spending like a digital wellbeing activity history.
                        </p>

                    </div>


                    <select
                        id="activityPeriod"
                    >

                        <option value="this-week">
                            This Week
                        </option>

                        <option value="previous-week">
                            Previous Week
                        </option>

                        <option value="2-weeks-ago">
                            2 Weeks Ago
                        </option>

                        <option value="3-weeks-ago">
                            3 Weeks Ago
                        </option>

                        <option value="4-weeks-ago">
                            4 Weeks Ago
                        </option>

                        <option value="this-month">
                            This Month
                        </option>

                        <option value="previous-month">
                            Previous Month
                        </option>

                    </select>

                </div>


                <div
                    id="activitySummary"
                    class="analytics-stat-grid"
                ></div>


                <div
                    id="activityChart"
                    class="activity-chart"
                ></div>


                <div
                    id="activityCategories"
                ></div>


                <div
                    id="activityTransactions"
                ></div>

            </section>

        </section>

        `

    );


    /*
        Apply event listeners after HTML exists.
    */

    if ($("saveBudgetBtn")) {

        $("saveBudgetBtn")
            .addEventListener(
                "click",
                saveMonthlyBudget
            );

    }


    if ($("saveGoalBtn")) {

        $("saveGoalBtn")
            .addEventListener(
                "click",
                saveGoal
            );

    }


    if ($("saveReminderBtn")) {

        $("saveReminderBtn")
            .addEventListener(
                "click",
                saveReminder
            );

    }


    if ($("activityPeriod")) {

        $("activityPeriod")
            .addEventListener(
                "change",
                renderSpendingActivity
            );

    }


    renderFullCategories();

    renderBudgets();

    renderReminders();

}


/* =========================================================
   FULL CATEGORY PAGE
========================================================= */

function renderFullCategories() {

    const container =
        $("fullCategoryList");

    if (!container)
        return;


    const totals =
        getCategoryTotals();


    const total =
        totals.reduce(
            (
                sum,
                item
            ) =>
                sum +
                item[1],
            0
        );


    if (!totals.length) {

        container.innerHTML = `

            <div class="empty">

                No spending recorded yet.

            </div>

        `;

        return;

    }


    container.innerHTML =
        totals
            .map(
                (
                    [
                        category,
                        amount
                    ]
                ) => {

                    const percent =
                        total
                            ? (
                                amount /
                                total
                            ) *
                            100
                            : 0;


                    return `

                        <div
                            class="category-row clickable-category"
                            data-category="${escapeHTML(
                                category
                            )}"
                        >

                            <div class="category-icon">
                                ${escapeHTML(
                                    category
                                        .split(" ")[0]
                                )}
                            </div>


                            <div
                                class="category-info"
                            >

                                <strong>
                                    ${escapeHTML(
                                        category
                                    )}
                                </strong>

                                <div
                                    class="category-progress"
                                >

                                    <span
                                        style="width:${percent}%"
                                    ></span>

                                </div>

                            </div>


                            <strong>
                                ${money(
                                    amount
                                )}
                            </strong>

                        </div>

                    `;

                }
            )
            .join("");

}


/* =========================================================
   MONTHLY BUDGET
========================================================= */

function getMonthlyBudget() {

    return Number(
        localStorage.getItem(
            BUDGET_KEY
        )
    ) || 0;

}


function saveMonthlyBudget() {

    const amount =
        Number(
            $("monthlyBudgetInput")
                ?.value
        );


    if (
        Number.isNaN(amount) ||
        amount < 0
    ) {

        showToast(
            "Enter a valid budget."
        );

        return;

    }


    localStorage.setItem(
        BUDGET_KEY,
        String(amount)
    );


    renderBudgets();

    showToast(
        "Monthly budget saved."
    );

}


function renderBudgets() {

    const monthlyBudget =
        getMonthlyBudget();


    const monthlySpent =
        getCurrentMonthExpense();


    const remaining =
        monthlyBudget -
        monthlySpent;


    const percentage =
        monthlyBudget > 0
            ? (
                monthlySpent /
                monthlyBudget
            ) *
            100
            : 0;


    if ($("monthlyBudgetInput")) {

        $("monthlyBudgetInput")
            .value =
            monthlyBudget ||
            "";

    }


    if ($("budgetStatus")) {

        let message = "";

        if (!monthlyBudget) {

            message =
                "Set a monthly budget to start tracking.";

        }

        else if (
            percentage >= 100
        ) {

            message =
                `🚨 Budget exceeded by ${money(
                    Math.abs(
                        remaining
                    )
                )}.`;

        }

        else if (
            percentage >= 80
        ) {

            message =
                `⚠️ You have used ${percentage.toFixed(
                    0
                )}% of your monthly budget. Remaining: ${money(
                    remaining
                )}.`;

        }

        else {

            message =
                `💰 Spent ${money(
                    monthlySpent
                )} of ${money(
                    monthlyBudget
                )}. Remaining: ${money(
                    remaining
                )}.`;

        }


        $("budgetStatus")
            .innerHTML =
            message;

    }


    renderCategoryBudgets();

    renderGoals();

}


/* =========================================================
   CATEGORY BUDGETS
========================================================= */

function getCategoryBudgets() {

    return loadJSON(
        CATEGORY_BUDGET_KEY,
        {}
    );

}


function saveCategoryBudget(
    category,
    value
) {

    const budgets =
        getCategoryBudgets();


    budgets[category] =
        Number(value) || 0;


    saveJSON(
        CATEGORY_BUDGET_KEY,
        budgets
    );

}


function renderCategoryBudgets() {

    const container =
        $("categoryBudgetList");

    if (!container)
        return;


    const budgets =
        getCategoryBudgets();


    container.innerHTML =
        CATEGORIES
            .map(
                category => {

                    const budget =
                        Number(
                            budgets[
                                category
                            ]
                        ) || 0;


                    const spent =
                        getCategoryTotals()
                            .find(
                                row =>
                                    row[0] ===
                                    category
                            )?.[1] ||
                        0;


                    const percentage =
                        budget > 0
                            ? (
                                spent /
                                budget
                            ) *
                            100
                            : 0;


                    let status = "";

                    if (
                        budget > 0 &&
                        percentage >= 100
                    ) {

                        status =
                            `<small class="budget-warning">
                                🚨 Exceeded
                            </small>`;

                    }

                    else if (
                        budget > 0 &&
                        percentage >= 80
                    ) {

                        status =
                            `<small class="budget-warning">
                                ⚠️ ${percentage.toFixed(
                                    0
                                )}% used
                            </small>`;

                    }


                    return `

                        <div
                            class="category-budget-row"
                        >

                            <div
                                class="category-budget-name"
                            >
                                ${escapeHTML(
                                    category
                                )}
                            </div>


                            <input
                                type="number"
                                min="0"
                                placeholder="Budget"
                                value="${budget || ""}"
                                data-budget-category="${escapeHTML(
                                    category
                                )}"
                            >


                            <div
                                class="category-budget-info"
                            >

                                ${money(
                                    spent
                                )}
                                spent

                                ${status}

                            </div>

                        </div>

                    `;

                }
            )
            .join("");


    container
        .querySelectorAll(
            "[data-budget-category]"
        )
        .forEach(
            input => {

                input.addEventListener(
                    "change",
                    () => {

                        saveCategoryBudget(
                            input.dataset
                                .budgetCategory,
                            input.value
                        );

                        renderCategoryBudgets();

                        showToast(
                            "Category budget saved."
                        );

                    }
                );

            }
        );

}


/* =========================================================
   SAVINGS GOALS
========================================================= */

function getGoals() {

    return loadJSON(
        GOALS_KEY,
        []
    );

}


function saveGoal() {

    const name =
        $("goalName")
            ?.value
            .trim();


    const target =
        Number(
            $("goalTarget")
                ?.value
        );


    const saved =
        Number(
            $("goalSaved")
                ?.value
        );


    if (
        !name ||
        target <= 0
    ) {

        showToast(
            "Enter a goal name and target."
        );

        return;

    }


    const goals =
        getGoals();


    goals.push({

        id:
            createId(),

        name:
            name,

        target:
            target,

        saved:
            Math.max(
                0,
                saved || 0
            )

    });


    saveJSON(
        GOALS_KEY,
        goals
    );


    $("goalName").value =
        "";

    $("goalTarget").value =
        "";

    $("goalSaved").value =
        "";


    renderGoals();

    showToast(
        "Savings goal added."
    );

}


function deleteGoal(id) {

    const goals =
        getGoals()
            .filter(
                goal =>
                    goal.id !== id
            );


    saveJSON(
        GOALS_KEY,
        goals
    );


    renderGoals();

}


function renderGoals() {

    const container =
        $("goalsList");

    if (!container)
        return;


    const goals =
        getGoals();


    if (!goals.length) {

        container.innerHTML = `

            <div class="empty">
                No savings goals yet.
            </div>

        `;

        return;

    }


    container.innerHTML =
        goals
            .map(
                goal => {

                    const progress =
                        goal.target > 0
                            ? Math.min(
                                100,
                                (
                                    goal.saved /
                                    goal.target
                                ) *
                                100
                            )
                            : 0;


                    return `

                        <div
                            class="goal-card"
                        >

                            <div
                                class="goal-header"
                            >

                                <strong>
                                    ${escapeHTML(
                                        goal.name
                                    )}
                                </strong>

                                <button
                                    class="icon-button"
                                    data-delete-goal="${escapeHTML(
                                        goal.id
                                    )}"
                                >
                                    🗑️
                                </button>

                            </div>


                            <div
                                class="goal-money"
                            >

                                ${money(
                                    goal.saved
                                )}
                                /
                                ${money(
                                    goal.target
                                )}

                            </div>


                            <div
                                class="category-progress"
                            >

                                <span
                                    style="width:${progress}%"
                                ></span>

                            </div>


                            <small>
                                ${progress.toFixed(
                                    0
                                )}% completed
                            </small>

                        </div>

                    `;

                }
            )
            .join("");


    container
        .querySelectorAll(
            "[data-delete-goal]"
        )
        .forEach(
            button => {

                button.addEventListener(
                    "click",
                    () =>
                        deleteGoal(
                            button.dataset
                                .deleteGoal
                        )
                );

            }
        );

}


/* =========================================================
   REMINDERS
========================================================= */

function getReminders() {

    return loadJSON(
        REMINDERS_KEY,
        []
    );

}


function saveReminder() {

    const name =
        $("reminderName")
            ?.value
            .trim();


    const date =
        $("reminderDate")
            ?.value;


    const amount =
        Number(
            $("reminderAmount")
                ?.value
        ) || 0;


    if (
        !name ||
        !date
    ) {

        showToast(
            "Enter reminder name and date."
        );

        return;

    }


    const reminders =
        getReminders();


    reminders.push({

        id:
            createId(),

        name:
            name,

        date:
            date,

        amount:
            amount

    });


    reminders.sort(
        (
            a,
            b
        ) =>
            a.date.localeCompare(
                b.date
            )
    );


    saveJSON(
        REMINDERS_KEY,
        reminders
    );


    $("reminderName").value =
        "";

    $("reminderDate").value =
        "";

    $("reminderAmount").value =
        "";


    renderReminders();

    showToast(
        "Reminder added."
    );

}


function deleteReminder(
    id
) {

    const reminders =
        getReminders()
            .filter(
                reminder =>
                    reminder.id !== id
            );


    saveJSON(
        REMINDERS_KEY,
        reminders
    );


    renderReminders();

}


function renderReminders() {

    const container =
        $("remindersList");

    if (!container)
        return;


    const reminders =
        getReminders();


    if (!reminders.length) {

        container.innerHTML = `

            <div class="empty">

                No reminders yet.

            </div>

        `;

        return;

    }


    const today =
        new Date()
            .toISOString()
            .slice(
                0,
                10
            );


    container.innerHTML =
        reminders
            .map(
                reminder => {

                    const overdue =
                        reminder.date <
                        today;


                    return `

                        <div
                            class="transaction-row"
                        >

                            <div
                                class="tx-icon"
                            >
                                🔔
                            </div>


                            <div>

                                <div
                                    class="tx-name"
                                >
                                    ${escapeHTML(
                                        reminder.name
                                    )}
                                </div>

                                <div
                                    class="tx-meta"
                                >
                                    ${formatDate(
                                        reminder.date
                                    )}
                                </div>

                            </div>


                            <div>

                                ${
                                    reminder.amount
                                        ? money(
                                            reminder.amount
                                        )
                                        : ""
                                }

                            </div>


                            <div>

                                ${
                                    overdue
                                        ? "🔴 Overdue"
                                        : "🟢 Upcoming"
                                }

                            </div>


                            <button
                                class="icon-button"
                                data-delete-reminder="${escapeHTML(
                                    reminder.id
                                )}"
                            >
                                🗑️
                            </button>

                        </div>

                    `;

                }
            )
            .join("");


    container
        .querySelectorAll(
            "[data-delete-reminder]"
        )
        .forEach(
            button => {

                button.addEventListener(
                    "click",
                    () =>
                        deleteReminder(
                            button.dataset
                                .deleteReminder
                        )
                );

            }
        );

}


/* =========================================================
   SPENDING ACTIVITY
========================================================= */

function startOfDay(
    date
) {

    const d =
        new Date(date);

    d.setHours(
        0,
        0,
        0,
        0
    );

    return d;

}


function getWeekStart(
    date
) {

    const d =
        startOfDay(
            date
        );


    const day =
        d.getDay();


    /*
        Monday = first day.
    */

    const difference =
        day === 0
            ? 6
            : day - 1;


    d.setDate(
        d.getDate() -
        difference
    );


    return d;

}


function getActivityRange(
    period
) {

    const now =
        new Date();


    let start;
    let end;


    if (
        period ===
        "this-week"
    ) {

        start =
            getWeekStart(
                now
            );

        end =
            new Date(
                start
            );

        end.setDate(
            end.getDate() +
            6
        );

    }


    else if (
        period ===
        "previous-week"
    ) {

        start =
            getWeekStart(
                now
            );

        start.setDate(
            start.getDate() -
            7
        );

        end =
            new Date(
                start
            );

        end.setDate(
            end.getDate() +
            6
        );

    }


    else if (
        period ===
        "2-weeks-ago"
    ) {

        start =
            getWeekStart(
                now
            );

        start.setDate(
            start.getDate() -
            14
        );

        end =
            new Date(
                start
            );

        end.setDate(
            end.getDate() +
            6
        );

    }


    else if (
        period ===
        "3-weeks-ago"
    ) {

        start =
            getWeekStart(
                now
            );

        start.setDate(
            start.getDate() -
            21
        );

        end =
            new Date(
                start
            );

        end.setDate(
            end.getDate() +
            6
        );

    }


    else if (
        period ===
        "4-weeks-ago"
    ) {

        start =
            getWeekStart(
                now
            );

        start.setDate(
            start.getDate() -
            28
        );

        end =
            new Date(
                start
            );

        end.setDate(
            end.getDate() +
            6
        );

    }


    else if (
        period ===
        "this-month"
    ) {

        start =
            new Date(
                now.getFullYear(),
                now.getMonth(),
                1
            );

        end =
            new Date(
                now.getFullYear(),
                now.getMonth() + 1,
                0
            );

    }


    else if (
        period ===
        "previous-month"
    ) {

        start =
            new Date(
                now.getFullYear(),
                now.getMonth() - 1,
                1
            );

        end =
            new Date(
                now.getFullYear(),
                now.getMonth(),
                0
            );

    }


    else {

        start =
            getWeekStart(
                now
            );

        end =
            new Date(
                start
            );

        end.setDate(
            end.getDate() +
            6
        );

    }


    end.setHours(
        23,
        59,
        59,
        999
    );


    return {
        start,
        end
    };

}


function getActivityTransactions(
    period
) {

    const range =
        getActivityRange(
            period
        );


    return transactions
        .filter(
            transaction => {

                if (
                    transaction.type !==
                    "expense"
                )
                    return false;


                const date =
                    new Date(
                        transaction.date
                    );


                return (
                    date >=
                    range.start &&
                    date <=
                    range.end
                );

            }
        )
        .sort(
            (
                a,
                b
            ) =>
                new Date(b.date) -
                new Date(a.date)
        );

}


function renderSpendingActivity() {

    const period =
        $("activityPeriod")
            ?.value ||
        "this-week";


    const list =
        getActivityTransactions(
            period
        );


    const total =
        list.reduce(
            (
                sum,
                transaction
            ) =>
                sum +
                Number(
                    transaction.amount
                ),
            0
        );


    const transactionCount =
        list.length;


    const average =
        transactionCount
            ? total /
              transactionCount
            : 0;


    const categoryTotals = {};


    list.forEach(
        transaction => {

            categoryTotals[
                transaction.category
            ] =
                (
                    categoryTotals[
                        transaction.category
                    ] ||
                    0
                ) +
                Number(
                    transaction.amount
                );

        }
    );


    const categoryRows =
        Object.entries(
            categoryTotals
        )
            .sort(
                (
                    a,
                    b
                ) =>
                    b[1] -
                    a[1]
            );


    const highestCategory =
        categoryRows.length
            ? categoryRows[0]
            : null;


    const daily = [];


    const range =
        getActivityRange(
            period
        );


    const cursor =
        new Date(
            range.start
        );


    while (
        cursor <=
        range.end
    ) {

        const dateKey =
            cursor
                .toISOString()
                .slice(
                    0,
                    10
                );


        const amount =
            list
                .filter(
                    transaction =>
                        transaction.date
                            .slice(
                                0,
                                10
                            ) ===
                        dateKey
                )
                .reduce(
                    (
                        sum,
                        transaction
                    ) =>
                        sum +
                        Number(
                            transaction.amount
                        ),
                    0
                );


        daily.push({

            date:
                new Date(
                    cursor
                ),

            amount:
                amount

        });


        cursor.setDate(
            cursor.getDate() +
            1
        );

    }


    const highestDay =
        daily.reduce(
            (
                highest,
                item
            ) =>
                item.amount >
                highest.amount
                    ? item
                    : highest,
            {
                amount: 0
            }
        );


    if ($("activitySummary")) {

        $("activitySummary")
            .innerHTML = `

                <div class="mini-card">

                    <span>
                        Total Spending
                    </span>

                    <strong>
                        ${money(
                            total
                        )}
                    </strong>

                </div>


                <div class="mini-card">

                    <span>
                        Transactions
                    </span>

                    <strong>
                        ${transactionCount}
                    </strong>

                </div>


                <div class="mini-card">

                    <span>
                        Highest Day
                    </span>

                    <strong>
                        ${
                            highestDay.amount
                                ? money(
                                    highestDay.amount
                                )
                                : "₹0"
                        }
                    </strong>

                </div>


                <div class="mini-card">

                    <span>
                        Top Category
                    </span>

                    <strong>
                        ${
                            highestCategory
                                ? escapeHTML(
                                    highestCategory[0]
                                )
                                : "—"
                        }
                    </strong>

                </div>

            `;

    }


    renderActivityBars(
        daily
    );


    if ($("activityCategories")) {

        $("activityCategories")
            .innerHTML = `

                <section class="panel activity-inner-panel">

                    <div class="panel-header">

                        <div>

                            <h3>
                                Category Breakdown
                            </h3>

                            <p>
                                Spending during this period
                            </p>

                        </div>

                    </div>


                    ${
                        categoryRows.length
                            ? categoryRows
                                .map(
                                    (
                                        [
                                            category,
                                            amount
                                        ]
                                    ) => `

                                        <div
                                            class="activity-category-row"
                                        >

                                            <span>
                                                ${escapeHTML(
                                                    category
                                                )}
                                            </span>

                                            <strong>
                                                ${money(
                                                    amount
                                                )}
                                            </strong>

                                        </div>

                                    `
                                )
                                .join("")
                            : `
                                <div class="empty">
                                    No spending during this period.
                                </div>
                            `
                    }

                </section>

            `;

    }


    if ($("activityTransactions")) {

        $("activityTransactions")
            .innerHTML = `

                <section class="panel activity-inner-panel">

                    <div class="panel-header">

                        <div>

                            <h3>
                                Transactions
                            </h3>

                            <p>
                                ${transactionCount}
                                transaction${
                                    transactionCount === 1
                                        ? ""
                                        : "s"
                                }
                            </p>

                        </div>

                    </div>


                    ${
                        list.length
                            ? list
                                .map(
                                    transactionHTML
                                )
                                .join("")
                            : `
                                <div class="empty">
                                    No transactions during this period.
                                </div>
                            `
                    }

                </section>

            `;

    }

}


function renderActivityBars(
    daily
) {

    const container =
        $("activityChart");

    if (!container)
        return;


    const max =
        Math.max(
            1,
            ...daily.map(
                item =>
                    item.amount
            )
        );


    container.innerHTML =
        daily
            .map(
                item => {

                    const percent =
                        (
                            item.amount /
                            max
                        ) *
                        100;


                    const label =
                        item.date.toLocaleDateString(
                            "en-IN",
                            {
                                weekday:
                                    "short"
                            }
                        );


                    return `

                        <div
                            class="activity-day"
                        >

                            <div
                                class="activity-day-label"
                            >
                                ${label}
                            </div>


                            <div
                                class="activity-bar-track"
                            >

                                <span
                                    class="activity-bar"
                                    style="width:${percent}%"
                                ></span>

                            </div>


                            <strong>
                                ${money(
                                    item.amount
                                )}
                            </strong>

                        </div>

                    `;

                }
            )
            .join("");

}


/* =========================================================
   EXPORT / IMPORT
========================================================= */

function downloadFile(
    filename,
    content,
    type
) {

    const blob =
        new Blob(
            [
                content
            ],
            {
                type
            }
        );


    const url =
        URL.createObjectURL(
            blob
        );


    const anchor =
        document.createElement(
            "a"
        );


    anchor.href =
        url;

    anchor.download =
        filename;


    document.body.appendChild(
        anchor
    );


    anchor.click();


    anchor.remove();


    URL.revokeObjectURL(
        url
    );

}


/* JSON EXPORT */

if ($("exportJsonBtn")) {

    $("exportJsonBtn")
        .addEventListener(
            "click",
            () => {

                const json =
                    JSON.stringify(
                        transactions,
                        null,
                        2
                    );


                const filename =
                    `moneymate-backup-${new Date()
                        .toISOString()
                        .slice(
                            0,
                            10
                        )}.json`;


                downloadFile(
                    filename,
                    json,
                    "application/json"
                );


                showToast(
                    "JSON backup exported."
                );

            }
        );

}


/* CSV EXPORT */

if ($("exportCsvBtn")) {

    $("exportCsvBtn")
        .addEventListener(
            "click",
            () => {

                const headers = [

                    "Type",
                    "Amount",
                    "Name",
                    "Category",
                    "Date",
                    "Payment Method",
                    "Note"

                ];


                const rows =
                    transactions.map(
                        transaction => [

                            transaction.type,

                            transaction.amount,

                            transaction.name,

                            transaction.category,

                            transaction.date,

                            transaction.paymentMethod,

                            transaction.note || ""

                        ]
                    );


                const csv =
                    [
                        headers,
                        ...rows
                    ]
                        .map(
                            row =>
                                row
                                    .map(
                                        value =>
                                            `"${String(
                                                value ??
                                                ""
                                            ).replace(
                                                /"/g,
                                                '""'
                                            )}"`
                                    )
                                    .join(",")
                        )
                        .join("\n");


                const filename =
                    `moneymate-transactions-${new Date()
                        .toISOString()
                        .slice(
                            0,
                            10
                        )}.csv`;


                downloadFile(
                    filename,
                    csv,
                    "text/csv;charset=utf-8"
                );


                showToast(
                    "CSV exported."
                );

            }
        );

}


/* JSON IMPORT */

if ($("importJsonBtn")) {

    $("importJsonBtn")
        .addEventListener(
            "click",
            () =>
                $("importFile")
                    ?.click()
        );

}


if ($("importFile")) {

    $("importFile")
        .addEventListener(
            "change",
            event => {

                const file =
                    event.target
                        .files[0];


                if (!file)
                    return;


                const reader =
                    new FileReader();


                reader.onload =
                    () => {

                        try {

                            const data =
                                JSON.parse(
                                    reader.result
                                );


                            if (
                                !Array.isArray(
                                    data
                                )
                            ) {

                                throw new Error(
                                    "Invalid backup"
                                );

                            }


                            const confirmed =
                                confirm(
                                    `Import ${data.length} transactions? This will replace your current data.`
                                );


                            if (
                                !confirmed
                            )
                                return;


                            transactions =
                                data

                                    .filter(
                                        transaction =>

                                            transaction &&
                                            transaction.id &&
                                            transaction.type &&
                                            Number(
                                                transaction.amount
                                            ) > 0 &&
                                            transaction.name
                                    )

                                    .map(
                                        transaction => ({

                                            ...transaction,

                                            amount:
                                                Number(
                                                    transaction.amount
                                                )

                                        })
                                    );


                            saveTransactions();

                            renderAll();

                            showToast(
                                "Backup imported successfully."
                            );

                        }

                        catch {

                            showToast(
                                "Invalid JSON backup."
                            );

                        }


                        event.target.value =
                            "";

                    };


                reader.readAsText(
                    file
                );

            }
        );

}


/* CLEAR DATA */

if ($("clearDataBtn")) {

    $("clearDataBtn")
        .addEventListener(
            "click",
            () => {

                const confirmed =
                    confirm(
                        "Are you sure you want to delete ALL transactions?"
                    );


                if (!confirmed)
                    return;


                transactions =
                    [];


                saveTransactions();

                renderAll();

                showToast(
                    "All transaction data cleared."
                );

            }
        );

}


/* =========================================================
   THEME
========================================================= */

function applyTheme(
    theme
) {

    if (
        theme ===
        "light"
    ) {

        document.body
            .classList
            .add(
                "light-mode"
            );

    }

    else {

        document.body
            .classList
            .remove(
                "light-mode"
            );

    }


    if ($("themeToggle")) {

        $("themeToggle")
            .textContent =
            theme === "light"
                ? "🌙 Dark Mode"
                : "☀️ Light Mode";

    }

}


function initTheme() {

    const theme =
        localStorage.getItem(
            THEME_KEY
        ) ||
        "dark";


    applyTheme(
        theme
    );

}


if ($("themeToggle")) {

    $("themeToggle")
        .addEventListener(
            "click",
            () => {

                const light =
                    document.body
                        .classList
                        .contains(
                            "light-mode"
                        );


                const next =
                    light
                        ? "dark"
                        : "light";


                localStorage.setItem(
                    THEME_KEY,
                    next
                );


                applyTheme(
                    next
                );

            }
        );

}


/* =========================================================
   RENDER ALL
========================================================= */

function renderAll() {

    renderSummary();

    renderRecentTransactions();

    renderHistoryTransactions();

    renderCategoryBreakdown();

    populateYearFilter();

    renderAnalytics();

    renderFullCategories();

    renderBudgets();

    renderReminders();

    renderSpendingActivity();

    updateAutoBackupStatus();

}


/* =========================================================
   INITIALIZATION
========================================================= */

function initializeMoneyMate() {

    populateCategories();

    addFinancePages();

    initTheme();

    renderAll();

}


/* =========================================================
   START
========================================================= */

if (
    document.readyState ===
    "loading"
) {

    document.addEventListener(
        "DOMContentLoaded",
        initializeMoneyMate
    );

}

else {

    initializeMoneyMate();

               }
