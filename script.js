/* =========================================================
   MONEYMATE
   JAVASCRIPT
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


const STORAGE_KEY =
    "moneymate_transactions_v1";


const THEME_KEY =
    "moneymate_theme_v1";


let transactions =
    loadTransactions();


let editingId = null;


let currentType =
    "expense";


let toastTimer = null;


/* =========================================================
   HELPERS
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
    ).format(Number(value) || 0);

}


function escapeHTML(value) {

    return String(value ?? "")
        .replace(
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
            date.getTimezoneOffset() * 60000
        );

    return adjusted
        .toISOString()
        .slice(0, 16);

}


function formatDate(value) {

    return new Date(value)
        .toLocaleDateString(
            "en-IN",
            {
                day: "2-digit",
                month: "short",
                year: "numeric"
            }
        );

}


function formatShortDate(value) {

    return new Date(value)
        .toLocaleDateString(
            "en-IN",
            {
                day: "2-digit",
                month: "short"
            }
        );

}


function showToast(message) {

    const toast =
        $("toast");

    toast.textContent =
        message;

    toast.classList.add("show");

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

}


/* =========================================================
   CATEGORY SETUP
========================================================= */

function populateCategories() {

    $("category").innerHTML =
        CATEGORIES
            .map(
                category => `
                    <option value="${escapeHTML(category)}">
                        ${escapeHTML(category)}
                    </option>
                `
            )
            .join("");


    $("categoryFilter").innerHTML =
        `
        <option value="all">
            All Categories
        </option>
        ` +

        CATEGORIES
            .map(
                category => `
                    <option value="${escapeHTML(category)}">
                        ${escapeHTML(category)}
                    </option>
                `
            )
            .join("");

}


/* =========================================================
   TRANSACTION TYPE
========================================================= */

function setType(type) {

    currentType =
        type;


    $("expenseTypeBtn")
        .classList
        .toggle(
            "active",
            type === "expense"
        );


    $("incomeTypeBtn")
        .classList
        .toggle(
            "active",
            type === "income"
        );


    $("category").disabled =
        type === "income";


    if (type === "income") {

        $("category").value =
            "📦 Other";

    }

}


/* =========================================================
   MODAL
========================================================= */

function openModal(id = null) {

    editingId =
        id;


    $("modalTitle").textContent =
        id
            ? "Edit Transaction"
            : "Add Transaction";


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
            transaction.note || "";

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
        .remove("hidden");


    setTimeout(
        () =>
            $("amount").focus(),
        50
    );

}


function closeModal() {

    $("transactionModal")
        .classList
        .add("hidden");


    editingId =
        null;

}


/* =========================================================
   MODAL EVENTS
========================================================= */

$("openAddBtn")
    .addEventListener(
        "click",
        () =>
            openModal()
    );


$("expenseTypeBtn")
    .addEventListener(
        "click",
        () =>
            setType("expense")
    );


$("incomeTypeBtn")
    .addEventListener(
        "click",
        () =>
            setType("income")
    );


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


/* =========================================================
   ADD / EDIT TRANSACTION
========================================================= */

$("transactionForm")
    .addEventListener(
        "submit",
        event => {

            event.preventDefault();


            const amount =
                Number(
                    $("amount").value
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
                        : $("category").value,

                date:
                    new Date(
                        $("dateTime").value
                    ).toISOString(),

                paymentMethod:
                    $("paymentMethod").value,

                note:
                    $("note").value.trim()

            };


            const wasEditing =
                Boolean(
                    editingId
                );


            if (wasEditing) {

                transactions =
                    transactions.map(
                        item =>
                            item.id === editingId
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
                (total, transaction) =>
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
                (total, transaction) =>
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


/* =========================================================
   MONTHLY EXPENSE
========================================================= */

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
            (total, transaction) =>
                total +
                Number(
                    transaction.amount
                ),
            0
        );

}


/* =========================================================
   TODAY'S EXPENSE
========================================================= */

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
            (total, transaction) =>
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


    $("totalBalance")
        .textContent =
        money(
            totals.balance
        );


    $("totalIncome")
        .textContent =
        money(
            totals.income
        );


    $("totalExpenses")
        .textContent =
        money(
            totals.expenses
        );


    $("monthExpenses")
        .textContent =
        money(
            getCurrentMonthExpense()
        );


    $("monthChange")
        .textContent =
        `Today: ${money(
            getTodayExpense()
        )}`;

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

        <div class="transaction-row">

            <div
                class="tx-icon
                ${
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

            </div>


            <div class="tx-method">

                ${escapeHTML(
                    transaction.paymentMethod ||
                    ""
                )}

            </div>


            <div
                class="tx-amount
                ${transaction.type}"
            >

                ${sign}${money(
                    transaction.amount
                )}

            </div>


            <div class="tx-actions">

                <button
                    class="icon-button"
                    title="Edit"
                    onclick="openModal('${transaction.id}')"
                >
                    ✎
                </button>


                <button
                    class="icon-button"
                    title="Delete"
                    onclick="deleteTransaction('${transaction.id}')"
                >
                    ×
                </button>

            </div>

        </div>

    `;

}


/* =========================================================
   RECENT TRANSACTIONS
========================================================= */

function renderRecentTransactions() {

    const list =
        [...transactions]

            .sort(
                (a, b) =>
                    new Date(b.date) -
                    new Date(a.date)
            )

            .slice(0, 7);


    if (!list.length) {

        $("recentTransactions")
            .innerHTML = `

                <div class="empty">

                    <strong>
                        No transactions yet
                    </strong>

                    Add your first income or
                    expense to start tracking.

                </div>

            `;

        return;

    }


    $("recentTransactions")
        .innerHTML =
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
   TRANSACTION HISTORY
========================================================= */

function renderHistory() {

    const search =
        $("searchInput")
            .value
            .trim()
            .toLowerCase();


    const type =
        $("typeFilter").value;


    const category =
        $("categoryFilter").value;


    const month =
        $("monthFilter").value;


    const sort =
        $("sortFilter").value;


    let list =
        transactions.filter(
            transaction => {

                const searchable =
                    `
                    ${transaction.name}
                    ${transaction.category}
                    ${transaction.paymentMethod}
                    ${transaction.note}
                    `.toLowerCase();


                const matchesSearch =
                    !search ||
                    searchable.includes(
                        search
                    );


                const matchesType =
                    type === "all" ||
                    transaction.type ===
                        type;


                const matchesCategory =
                    category === "all" ||
                    transaction.category ===
                        category;


                const matchesMonth =
                    !month ||
                    transaction.date.slice(
                        0,
                        7
                    ) === month;


                return (
                    matchesSearch &&
                    matchesType &&
                    matchesCategory &&
                    matchesMonth
                );

            }
        );


    list.sort(
        (a, b) => {

            switch (sort) {

                case "date-asc":

                    return (
                        new Date(a.date) -
                        new Date(b.date)
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
                        new Date(b.date) -
                        new Date(a.date)
                    );

            }

        }
    );


    if (!list.length) {

        $("historyTransactions")
            .innerHTML = `

                <div class="empty">

                    <strong>
                        No matching transactions
                    </strong>

                    Try changing your filters.

                </div>

            `;

        return;

    }


    $("historyTransactions")
        .innerHTML =
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
   DELETE TRANSACTION
========================================================= */

function deleteTransaction(id) {

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
   CATEGORY TOTALS
========================================================= */

function getCategoryTotals() {

    const totals = {};


    transactions

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

    const rows =
        getCategoryTotals();


    const total =
        rows.reduce(
            (sum, row) =>
                sum + row[1],
            0
        );


    if (!rows.length) {

        $("categoryBreakdown")
            .innerHTML = `

                <div class="empty">

                    No expense data yet.

                </div>

            `;

        return;

    }


    $("categoryBreakdown")
        .innerHTML =

        rows.map(
            ([category, amount]) => {

                const percentage =
                    total
                        ? (
                            amount /
                            total
                        ) * 100
                        : 0;


                return `

                    <div class="category-row clickable-category" onclick="openCategoryTransactions('${escapeHTML(category)}')">

                        <div class="category-icon">

                            ${category
                                .split(" ")[0]}

                        </div>


                        <div class="category-info">

                            <strong>
                                ${escapeHTML(
                                    category
                                )}
                            </strong>

                            <div
                                class="category-progress"
                            >

                                <span
                                    style="
                                        width:
                                        ${percentage}%
                                    "
                                ></span>

                            </div>

                        </div>


                        <b>
                            ${money(amount)}
                        </b>

                    </div>

                `;

            }
        ).join("");

}


/* =========================================================
   DAILY DATA
========================================================= */

function getDailyData(days = 7) {

    const result = [];


    const now =
        new Date();


    for (
        let i = days - 1;
        i >= 0;
        i--
    ) {

        const date =
            new Date(now);


        date.setHours(
            0,
            0,
            0,
            0
        );


        date.setDate(
            date.getDate() - i
        );


        const next =
            new Date(date);


        next.setDate(
            next.getDate() + 1
        );


        const value =
            transactions

                .filter(
                    transaction =>
                        transaction.type ===
                        "expense"
                )

                .filter(
                    transaction => {

                        const transactionDate =
                            new Date(
                                transaction.date
                            );


                        return (
                            transactionDate >=
                                date &&
                            transactionDate <
                                next
                        );

                    }
                )

                .reduce(
                    (sum, transaction) =>
                        sum +
                        Number(
                            transaction.amount
                        ),
                    0
                );


        result.push({

            label:
                date.toLocaleDateString(
                    "en-IN",
                    {
                        weekday: "short"
                    }
                ),

            value

        });

    }


    return result;

}


/* =========================================================
   MONTHLY DATA
========================================================= */

function getMonthlyData() {

    const result = [];


    const now =
        new Date();


    for (
        let i = 5;
        i >= 0;
        i--
    ) {

        const start =
            new Date(
                now.getFullYear(),
                now.getMonth() - i,
                1
            );


        const end =
            new Date(
                now.getFullYear(),
                now.getMonth() - i + 1,
                1
            );


        const value =
            transactions

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
                            date >= start &&
                            date < end
                        );

                    }
                )

                .reduce(
                    (sum, transaction) =>
                        sum +
                        Number(
                            transaction.amount
                        ),
                    0
                );


        result.push({

            label:
                start.toLocaleDateString(
                    "en-IN",
                    {
                        month: "short"
                    }
                ),

            value

        });

    }


    return result;

}


/* =========================================================
   CANVAS SETUP
========================================================= */

function setupCanvas(canvas) {

    const rect =
        canvas.getBoundingClientRect();


    const dpr =
        window.devicePixelRatio ||
        1;


    canvas.width =
        rect.width * dpr;


    canvas.height =
        rect.height * dpr;


    const context =
        canvas.getContext("2d");


    context.setTransform(
        dpr,
        0,
        0,
        dpr,
        0,
        0
    );


    return {

        ctx: context,

        width: rect.width,

        height: rect.height

    };

}


/* =========================================================
   COMPACT MONEY
========================================================= */

function compactMoney(value) {

    if (value >= 10000000) {

        return (
            "₹" +
            (
                value /
                10000000
            ).toFixed(1) +
            "Cr"
        );

    }


    if (value >= 100000) {

        return (
            "₹" +
            (
                value /
                100000
            ).toFixed(1) +
            "L"
        );

    }


    if (value >= 1000) {

        return (
            "₹" +
            (
                value /
                1000
            ).toFixed(1) +
            "K"
        );

    }


    return (
        "₹" +
        Math.round(value)
    );

}


/* =========================================================
   BAR CHART
========================================================= */

function drawBarChart(
    canvas,
    data
) {

    if (!canvas)
        return;


    const {

        ctx,
        width,
        height

    } =
        setupCanvas(canvas);


    ctx.clearRect(
        0,
        0,
        width,
        height
    );


    const max =
        Math.max(
            ...data.map(
                item =>
                    item.value
            ),
            1
        );


    const padding = {

        left: 42,

        right: 15,

        top: 20,

        bottom: 35

    };


    const innerWidth =
        width -
        padding.left -
        padding.right;


    const innerHeight =
        height -
        padding.top -
        padding.bottom;


    const styles =
        getComputedStyle(
            document.body
        );


    const border =
        styles.getPropertyValue(
            "--border"
        );


    const primary =
        styles.getPropertyValue(
            "--primary"
        );


    const muted =
        styles.getPropertyValue(
            "--muted"
        );


    const text =
        styles.getPropertyValue(
            "--text"
        );


    /* GRID */

    ctx.strokeStyle =
        border;


    ctx.lineWidth = 1;


    for (
        let i = 0;
        i < 4;
        i++
    ) {

        const y =
            padding.top +
            (
                innerHeight *
                i /
                3
            );


        ctx.beginPath();

        ctx.moveTo(
            padding.left,
            y
        );

        ctx.lineTo(
            width -
            padding.right,
            y
        );

        ctx.stroke();

    }


    /* BARS */

    const gap =
        Math.min(
            24,
            innerWidth /
                data.length *
                0.18
        );


    const barWidth =
        (
            innerWidth -
            gap *
            (data.length + 1)
        ) /
        data.length;


    data.forEach(
        (item, index) => {

            const barHeight =
                (
                    item.value /
                    max
                ) *
                innerHeight;


            const x =
                padding.left +
                gap +
                index *
                (
                    barWidth +
                    gap
                );


            const y =
                padding.top +
                innerHeight -
                barHeight;


            ctx.fillStyle =
                primary;


            ctx.beginPath();


            if (
                typeof ctx.roundRect ===
                "function"
            ) {

                ctx.roundRect(
                    x,
                    y,
                    barWidth,
                    barHeight,
                    7
                );

            }

            else {

                ctx.rect(
                    x,
                    y,
                    barWidth,
                    barHeight
                );

            }


            ctx.fill();


            /* LABEL */

            ctx.fillStyle =
                muted;


            ctx.font =
                "11px system-ui";


            ctx.textAlign =
                "center";


            ctx.fillText(
                item.label,
                x +
                    barWidth /
                    2,
                height -
                    12
            );


            /* VALUE */

            if (
                item.value > 0
            ) {

                ctx.fillStyle =
                    text;


                ctx.font =
                    "10px system-ui";


                ctx.fillText(
                    compactMoney(
                        item.value
                    ),
                    x +
                        barWidth /
                        2,
                    Math.max(
                        y - 7,
                        12
                    )
                );

            }

        }
    );

}


/* =========================================================
   CATEGORY CHART
========================================================= */

function drawCategoryChart(
    canvas
) {

    if (!canvas)
        return;


    const rows =
        getCategoryTotals()
            .slice(0, 8);


    const {

        ctx,
        width,
        height

    } =
        setupCanvas(canvas);


    ctx.clearRect(
        0,
        0,
        width,
        height
    );


    const styles =
        getComputedStyle(
            document.body
        );


    const background =
        styles.getPropertyValue(
            "--background"
        );


    const primary =
        styles.getPropertyValue(
            "--primary"
        );


    const text =
        styles.getPropertyValue(
            "--text"
        );


    const muted =
        styles.getPropertyValue(
            "--muted"
        );


    if (!rows.length) {

        ctx.fillStyle =
            muted;


        ctx.font =
            "14px system-ui";


        ctx.textAlign =
            "center";


        ctx.fillText(
            "No expense data yet",
            width / 2,
            height / 2
        );


        return;

    }


    const max =
        Math.max(
            ...rows.map(
                row =>
                    row[1]
            ),
            1
        );


    const left =
        Math.min(
            185,
            width * 0.38
        );


    const barHeight = 22;

    const gap = 17;


    rows.forEach(
        ([category, amount], index) => {

            const y =
                20 +
                index *
                (
                    barHeight +
                    gap
                );


            const availableWidth =
                width -
                left -
                25;


            const barWidth =
                (
                    amount /
                    max
                ) *
                availableWidth;


            /* BACKGROUND */

            ctx.fillStyle =
                background;


            ctx.fillRect(
                left,
                y,
                availableWidth,
                barHeight
            );


            /* BAR */

            ctx.fillStyle =
                primary;


            ctx.fillRect(
                left,
                y,
                barWidth,
                barHeight
            );


            /* CATEGORY */

            ctx.fillStyle =
                text;


            ctx.font =
                "11px system-ui";


            ctx.textAlign =
                "right";


            ctx.fillText(
                category,
                left - 10,
                y + 15
            );


            /* AMOUNT */

            ctx.textAlign =
                "left";


            ctx.fillText(
                compactMoney(
                    amount
                ),
                left +
                    barWidth +
                    7,
                y + 15
            );

        }
    );

}


/* =========================================================
   RENDER CHARTS
========================================================= */

function renderCharts() {

    drawBarChart(
        $("weeklyChart"),
        getDailyData()
    );


    drawBarChart(
        $("monthlyChart"),
        getMonthlyData()
    );


    drawCategoryChart(
        $("analyticsCategoryChart")
    );

}


/* =========================================================
   ANALYTICS
========================================================= */

function renderAnalytics() {

    const expenses =
        transactions.filter(
            transaction =>
                transaction.type ===
                "expense"
        );


    const categories =
        getCategoryTotals();


    const total =
        categories.reduce(
            (sum, row) =>
                sum + row[1],
            0
        );


    $("topCategory")
        .textContent =
        categories.length
            ? categories[0][0]
            : "—";


    const average =
        expenses.length
            ? total /
              expenses.length
            : 0;


    $("averageExpense")
        .textContent =
        money(
            average
        );


    const largest =
        Math.max(
            0,
            ...expenses.map(
                transaction =>
                    Number(
                        transaction.amount
                    )
            )
        );


    $("largestExpense")
        .textContent =
        money(
            largest
        );


    let days = 1;


    if (expenses.length) {

        const earliest =
            Math.min(
                ...expenses.map(
                    transaction =>
                        new Date(
                            transaction.date
                        ).getTime()
                )
            );


        days =
            Math.max(
                1,
                Math.ceil(
                    (
                        Date.now() -
                        earliest
                    ) /
                    86400000
                ) + 1
            );

    }


    $("dailyAverage")
        .textContent =
        money(
            total /
            days
        );

}


/* =========================================================
   PAGE NAVIGATION
========================================================= */

function showPage(page) {

    document
        .querySelectorAll(".page")
        .forEach(
            section => {

                section.classList.remove(
                    "active"
                );

            }
        );


    const selectedPage =
        $(page + "Page");


    if (selectedPage) {

        selectedPage.classList.add(
            "active"
        );

    }


    document
        .querySelectorAll(".nav-btn")
        .forEach(
            button => {

                button.classList.toggle(
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
            "Backup & Data"

    };


    $("pageTitle")
        .textContent =
        titles[page] ||
        "Dashboard";


    if (
        page ===
        "analytics"
    ) {

        setTimeout(
            renderCharts,
            30
        );

    }

}


/* NAV BUTTONS */

document
    .querySelectorAll(".nav-btn")
    .forEach(
        button => {

            button.addEventListener(
                "click",
                () =>
                    showPage(
                        button.dataset.page
                    )
            );

        }
    );


/* VIEW ALL */

document
    .querySelectorAll(
        "[data-page-link]"
    )
    .forEach(
        button => {

            button.addEventListener(
                "click",
                () =>
                    showPage(
                        button.dataset.pageLink
                    )
            );

        }
    );


/* =========================================================
   FILTER EVENTS
========================================================= */

[
    "searchInput",
    "typeFilter",
    "categoryFilter",
    "monthFilter",
    "sortFilter"

].forEach(
    id => {

        $(id)
            .addEventListener(
                "input",
                renderHistory
            );


        $(id)
            .addEventListener(
                "change",
                renderHistory
            );

    }
);


/* =========================================================
   FILE DOWNLOAD
========================================================= */

function downloadFile(
    filename,
    content,
    type
) {

    const blob =
        new Blob(
            [content],
            { type }
        );


    const url =
        URL.createObjectURL(
            blob
        );


    const link =
        document.createElement(
            "a"
        );


    link.href =
        url;


    link.download =
        filename;


    document.body.appendChild(
        link
    );


    link.click();


    link.remove();


    URL.revokeObjectURL(
        url
    );

}


/* =========================================================
   EXPORT JSON
========================================================= */

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
                `moneymate-backup-${
                    new Date()
                        .toISOString()
                        .slice(
                            0,
                            10
                        )
                }.json`;


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


/* =========================================================
   EXPORT CSV
========================================================= */

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


            const rows = [

                headers,

                ...transactions.map(
                    transaction => [

                        transaction.type,

                        transaction.amount,

                        transaction.name,

                        transaction.category,

                        `${formatDate(
                            transaction.date
                        )} ${new Date(
                            transaction.date
                        ).toLocaleTimeString(
                            "en-IN",
                            {
                                hour:
                                    "2-digit",

                                minute:
                                    "2-digit"
                            }
                        )}`,

                        transaction.paymentMethod,

                        transaction.note

                    ]
                )

            ];


            const csv =
                rows
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
                `moneymate-transactions-${
                    new Date()
                        .toISOString()
                        .slice(
                            0,
                            10
                        )
                }.csv`;


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


/* =========================================================
   IMPORT JSON
========================================================= */

$("importJsonBtn")
    .addEventListener(
        "click",
        () =>
            $("importFile").click()
    );


$("importFile")
    .addEventListener(
        "change",
        event => {

            const file =
                event.target.files[0];


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


                        if (!confirmed)
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


/* =========================================================
   CLEAR DATA
========================================================= */

$("clearDataBtn")
    .addEventListener(
        "click",
        () => {

            if (
                !transactions.length
            ) {

                showToast(
                    "There is no data to clear."
                );

                return;

            }


            const confirmed =
                confirm(
                    "Delete ALL transactions? This cannot be undone unless you have a backup."
                );


            if (!confirmed)
                return;


            transactions =
                [];


            saveTransactions();


            renderAll();


            showToast(
                "All data cleared."
            );

        }
    );


/* =========================================================
   DARK / LIGHT MODE
========================================================= */

function updateThemeButton() {

    const dark =
        document.body
            .classList
            .contains("dark");


    $("themeToggle")
        .textContent =
        dark
            ? "☀️ Light Mode"
            : "🌙 Dark Mode";

}


$("themeToggle")
    .addEventListener(
        "click",
        () => {

            document.body
                .classList
                .toggle("dark");


            const dark =
                document.body
                    .classList
                    .contains("dark");


            localStorage.setItem(
                THEME_KEY,
                dark
                    ? "dark"
                    : "light"
            );


            updateThemeButton();


            renderCharts();

        }
    );


/* LOAD SAVED THEME */

if (
    localStorage.getItem(
        THEME_KEY
    ) === "dark"
) {

    document.body
        .classList
        .add("dark");

}


updateThemeButton();


/* =========================================================
   TODAY
========================================================= */

$("todayText")
    .textContent =
    new Date()
        .toLocaleDateString(
            "en-IN",
            {
                weekday: "long",
                day: "numeric",
                month: "long",
                year: "numeric"
            }
        );


/* =========================================================
   INITIALIZE
========================================================= */

populateCategories();


renderAll();


/* =========================================================
   RENDER EVERYTHING
========================================================= */

function renderAll() {

    renderSummary();

    renderRecentTransactions();

    renderHistory();

    renderCategoryBreakdown();

    renderAnalytics();

    renderCharts();

}


/* =========================================================
   RESPONSIVE CHART REDRAW
========================================================= */

let resizeTimer;


window.addEventListener(
    "resize",
    () => {

        clearTimeout(
            resizeTimer
        );


        resizeTimer =
            setTimeout(
                renderCharts,
                100
            );

    }
);

/* ===== MONEY MATE COMPLETE ENHANCEMENTS ===== */
const ENHANCED_CATEGORIES = [
'🚗 Auto Morning','🍛 Lunch','☕ Snacks','🚗 Auto Evening','🍽️ Dinner','📚 Study','🏠 Home','📱 Phone Recharge','🏠 Home Rent','🔐 Home Security Money','⚡ Electricity Bill','🛒 Online Shopping','🍔 Food Delivery','🎬 Entertainment','🎮 Gaming','🧑‍⚕️ Health & Medicine','👕 Clothing','🎁 Gifts','✈️ Travel','💪 Fitness','🐶 Pets','💇 Personal Care','🎵 Subscriptions','📦 Other'];

function openCategoryTransactions(category){
 const cf=$("categoryFilter"); if(cf){cf.value=category;}
 showPage('transactions'); renderHistory();
 const title=document.querySelector('#transactionsPage .panel-header h2'); if(title) title.textContent='Transactions — '+category;
}

function enhanceCategoryLists(){
 if(!window.CATEGORIES) return;
 ENHANCED_CATEGORIES.forEach(c=>{if(!CATEGORIES.includes(c)) CATEGORIES.push(c);});
 populateCategories();
}

function addAdvancedFilters(){
 const box=document.querySelector('#transactionsPage .filters'); if(!box || document.getElementById('yearFilter')) return;
 box.insertAdjacentHTML('beforeend',`
 <select id="yearFilter"><option value="all">All Years</option></select>
 <input id="minAmountFilter" type="number" min="0" placeholder="Min Amount">
 <input id="maxAmountFilter" type="number" min="0" placeholder="Max Amount">
 <select id="paymentMethodFilter"><option value="all">All Payments</option><option>💵 Cash</option><option>📱 UPI</option><option>💳 Debit Card</option><option>💳 Credit Card</option><option>🏦 Net Banking</option></select>
 <input id="fromDateFilter" type="date"><input id="toDateFilter" type="date">
 `);
 ['yearFilter','minAmountFilter','maxAmountFilter','paymentMethodFilter','fromDateFilter','toDateFilter'].forEach(id=>$(id).addEventListener('input',renderHistory));
}

const _oldRenderHistory = renderHistory;
renderHistory = function(){
 const search=$("searchInput")?.value.trim().toLowerCase()||'';
 const type=$("typeFilter")?.value||'all', cat=$("categoryFilter")?.value||'all', month=$("monthFilter")?.value||'';
 const year=$("yearFilter")?.value||'all', min=Number($("minAmountFilter")?.value||0), max=Number($("maxAmountFilter")?.value||Infinity);
 const method=$("paymentMethodFilter")?.value||'all', from=$("fromDateFilter")?.value||'', to=$("toDateFilter")?.value||'', sort=$("sortFilter")?.value||'date-desc';
 let list=transactions.filter(t=>{
 const txt=`${t.name} ${t.category} ${t.paymentMethod} ${t.note}`.toLowerCase(); const d=(t.date||'').slice(0,10);
 return (!search||txt.includes(search))&&(type==='all'||t.type===type)&&(cat==='all'||t.category===cat)&&(!month||(t.date||'').slice(0,7)===month)&&(year==='all'||(t.date||'').slice(0,4)===year)&&Number(t.amount)>=min&&Number(t.amount)<=max&&(method==='all'||t.paymentMethod===method)&&(!from||d>=from)&&(!to||d<=to);
 });
 list.sort((a,b)=>sort==='date-asc'?new Date(a.date)-new Date(b.date):sort==='amount-desc'?b.amount-a.amount:sort==='amount-asc'?a.amount-b.amount:sort==='name-asc'?a.name.localeCompare(b.name):new Date(b.date)-new Date(a.date));
 $("historyTransactions").innerHTML=list.length?list.map(transactionHTML).join(''):'<div class="empty"><strong>No matching transactions</strong>Try changing your filters.</div>';
};

function populateYearFilter(){const y=$("yearFilter");if(!y)return;const cur=y.value;const years=[...new Set(transactions.map(t=>(t.date||'').slice(0,4)).filter(Boolean))].sort().reverse();y.innerHTML='<option value="all">All Years</option>'+years.map(v=>`<option value="${v}">${v}</option>`).join('');y.value=years.includes(cur)?cur:'all';}

function addFinancePages(){
 const main=document.querySelector('.main'); const nav=document.querySelector('.navigation'); if(!main||document.getElementById('categoriesPage'))return;
 nav.insertAdjacentHTML('beforeend','<button class="nav-btn" data-page="categories"><span>🏷️</span>Categories</button><button class="nav-btn" data-page="budget"><span>🎯</span>Budget & Goals</button><button class="nav-btn" data-page="reminders"><span>🔔</span>Reminders</button>');
 main.insertAdjacentHTML('beforeend',`
 <section class="page" id="categoriesPage"><section class="panel"><div class="panel-header"><div><h2>Category Spending</h2><p>Click a category to see all its payments.</p></div></div><div id="fullCategoryList" class="category-list"></div></section></section>
 <section class="page" id="budgetPage"><section class="panel"><h2>🎯 Monthly Budget</h2><div class="form-grid"><label>Monthly Budget<input id="monthlyBudgetInput" type="number" placeholder="10000"></label><label>&nbsp;<button class="primary-button" id="saveBudgetBtn">Save Budget</button></label></div><div id="budgetStatus" class="data-note"></div></section><section class="panel"><h2>🏷️ Category-wise Budgets</h2><div id="categoryBudgetList"></div></section><section class="panel"><h2>💰 Savings Goals</h2><div class="form-grid"><label>Goal Name<input id="goalName"></label><label>Target Amount<input id="goalTarget" type="number"></label><label>Saved Amount<input id="goalSaved" type="number"></label><label>&nbsp;<button class="primary-button" id="addGoalBtn">Add Goal</button></label></div><div id="goalsList"></div></section><section class="panel"><h2>🤖 Smart Spending Insights</h2><div id="insightsList"></div></section></section>
 <section class="page" id="remindersPage"><section class="panel"><h2>🔔 Payment Reminders</h2><div class="form-grid"><label>Reminder<input id="reminderName" placeholder="Electricity Bill"></label><label>Date<input id="reminderDate" type="date"></label><label>&nbsp;<button class="primary-button" id="addReminderBtn">Add Reminder</button></label></div><div id="remindersList"></div></section></section>`);
 document.querySelectorAll('.nav-btn').forEach(b=>b.addEventListener('click',()=>showPage(b.dataset.page)));
 document.getElementById('saveBudgetBtn').onclick=saveMonthlyBudget; document.getElementById('addGoalBtn').onclick=addGoal; document.getElementById('addReminderBtn').onclick=addReminder;
}
const getStore=(k,d)=>{try{return JSON.parse(localStorage.getItem(k))??d}catch{return d}}; const setStore=(k,v)=>localStorage.setItem(k,JSON.stringify(v));
function expensesThisMonth(){const m=new Date().toISOString().slice(0,7);return transactions.filter(t=>t.type==='expense'&&(t.date||'').slice(0,7)===m).reduce((s,t)=>s+Number(t.amount),0)}
function saveMonthlyBudget(){setStore('mmBudget',Number($("monthlyBudgetInput").value||0));renderFinance();showToast('Monthly budget saved');}
function renderFinance(){
 const budget=getStore('mmBudget',0), spent=expensesThisMonth(), remain=budget-spent, pct=budget?Math.round(spent/budget*100):0;
 if($("monthlyBudgetInput"))$("monthlyBudgetInput").value=budget||'';
 if($("budgetStatus"))$("budgetStatus").innerHTML=`<strong>Spent: ${money(spent)}</strong><br>Remaining: ${money(Math.max(0,remain))}<br>${budget?`Progress: ${pct}% ${pct>=100?'🚨 Budget exceeded!':pct>=80?'⚠️ You have spent 80% or more of your budget.':'✅ Budget looks healthy.'}`:'Set your monthly budget to track progress.'}`;
 const rows=getCategoryTotals(); if($("fullCategoryList"))$("fullCategoryList").innerHTML=rows.map(([c,a])=>`<button class="category-row" onclick="openCategoryTransactions('${c.replace(/'/g,"\\'")}')"><div class="category-icon">${c.split(' ')[0]}</div><div class="category-info"><strong>${c}</strong><div class="category-progress"><span style="width:${rows[0]?Math.round(a/rows[0][1]*100):0}%"></span></div></div><b>${money(a)}</b></button>`).join('')||'<div class="empty">No expenses yet.</div>';
 if($("categoryBudgetList"))$("categoryBudgetList").innerHTML=ENHANCED_CATEGORIES.map(c=>`<div class="category-row"><span>${c}</span><input type="number" placeholder="Budget" data-cat-budget="${c}"></div>`).join('');
 const goals=getStore('mmGoals',[]); if($("goalsList"))$("goalsList").innerHTML=goals.map(g=>{let p=Math.min(100,Math.round(g.saved/g.target*100)||0);return `<div class="data-note"><strong>🎯 ${g.name}</strong><br>${money(g.saved)} / ${money(g.target)} (${p}%)<div class="category-progress"><span style="width:${p}%"></span></div></div>`}).join('')||'<p class="muted">No savings goals yet.</p>';
 if($("insightsList")){const top=rows[0]; const prevM=new Date();prevM.setMonth(prevM.getMonth()-1);const pm=prevM.toISOString().slice(0,7);const prev=transactions.filter(t=>t.type==='expense'&&(t.date||'').slice(0,7)===pm).reduce((s,t)=>s+Number(t.amount),0);$("insightsList").innerHTML=`<div class="data-note">${top?`🔥 Most spent category: <strong>${top[0]}</strong> (${money(top[1])}).`:'Add expenses to get insights.'}<br>${prev?`📊 This month is ${spent>prev?'higher':'lower'} than last month by ${money(Math.abs(spent-prev))}.`:''}</div>`;}
 const rem=getStore('mmReminders',[]);if($("remindersList"))$("remindersList").innerHTML=rem.map(r=>`<div class="transaction-row"><div class="tx-icon">🔔</div><div><div class="tx-name">${r.name}</div><div class="tx-meta">${r.date}</div></div></div>`).join('')||'<div class="empty">No reminders yet.</div>';
}
function addGoal(){const n=$("goalName").value.trim(),t=Number($("goalTarget").value),s=Number($("goalSaved").value||0);if(!n||!t)return showToast('Enter goal name and target');const g=getStore('mmGoals',[]);g.push({name:n,target:t,saved:s});setStore('mmGoals',g);$("goalName").value=$("goalTarget").value=$("goalSaved").value='';renderFinance();}
function addReminder(){const n=$("reminderName").value.trim(),d=$("reminderDate").value;if(!n||!d)return showToast('Enter reminder and date');const r=getStore('mmReminders',[]);r.push({name:n,date:d});setStore('mmReminders',r);$("reminderName").value=$("reminderDate").value='';renderFinance();showToast('Reminder added');}
const _oldShowPage=showPage;showPage=function(page){_oldShowPage(page);if(['categories','budget','reminders'].includes(page))renderFinance();};
const _oldRenderAll=renderAll;renderAll=function(){_oldRenderAll();populateYearFilter();renderFinance();};
window.addEventListener('load',()=>{enhanceCategoryLists();addAdvancedFilters();addFinancePages();populateYearFilter();renderFinance();});
