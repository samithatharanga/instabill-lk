document.addEventListener('DOMContentLoaded', () => {
    // ===================================================================================
    // InstaBill LK v11.9 (THE COMPLETE RESTORATION)
    // Developed by Samitha Tharanga Wijesinghe | ST Imagix
    // ===================================================================================

    // --- State & Storage ---
    const state = {
        productCatalog: JSON.parse(localStorage.getItem('productCatalog')) || [],
        customers: JSON.parse(localStorage.getItem('customers')) || [],
        salesHistory: JSON.parse(localStorage.getItem('salesHistory')) || [],
        expenses: JSON.parse(localStorage.getItem('expenses')) || [],
        heldBills: JSON.parse(localStorage.getItem('heldBills')) || [],
        cashiers: JSON.parse(localStorage.getItem('cashiers')) || ['Admin'],
        currentCashier: localStorage.getItem('currentCashier') || 'Admin',
        salesChart: null
    };

    // --- DOM Elements ---
    const dom = {
        itemsList: document.getElementById('items-list'),
        receiptPreview: document.getElementById('receipt-preview'),
        businessName: document.getElementById('business-name'),
        customerName: document.getElementById('customer-name'),
        customerPhone: document.getElementById('customer-phone'),
        discountValue: document.getElementById('discount-value'),
        deliveryCharge: document.getElementById('delivery-charge'),
        advancePayment: document.getElementById('advance-payment'),
        paymentStatus: document.getElementById('payment-status'),
        documentType: document.getElementById('document-type'),
        modals: {
            dashboard: document.getElementById('sales-dashboard-modal'),
            ledger: document.getElementById('credit-ledger-modal'),
            catalog: document.getElementById('product-catalog-modal'),
            settings: document.getElementById('settings-modal'),
            zReport: document.getElementById('z-report-modal'),
            expenses: document.getElementById('expenses-modal'),
            heldBills: document.getElementById('held-bills-modal')
        }
    };

    // --- Initialization ---
    function init() {
        registerEvents();
        renderSalesDashboard();
        renderProductList();
        renderCreditLedger();
        renderCashierList();
        loadLogo();
    }

    function registerEvents() {
        // Form Buttons
        document.getElementById('add-item-btn').onclick = () => addItem();
        document.getElementById('finalize-btn').onclick = finalizeAndSave;
        document.getElementById('hold-bill-btn').onclick = holdBill;
        document.getElementById('resume-bills-btn').onclick = () => { dom.modals.heldBills.style.display = 'block'; renderHeldBills(); };
        
        // Modal Open Buttons
        document.getElementById('open-dashboard-btn').onclick = () => { dom.modals.dashboard.style.display = 'block'; renderSalesDashboard(); };
        document.getElementById('open-ledger-btn').onclick = () => { dom.modals.ledger.style.display = 'block'; renderCreditLedger(); };
        document.getElementById('open-catalog-btn').onclick = () => dom.modals.catalog.style.display = 'block';
        document.getElementById('open-settings-btn').onclick = () => dom.modals.settings.style.display = 'block';

        // Data & Settings
        document.getElementById('backup-data-btn').onclick = backupData;
        document.getElementById('restore-data-btn').onclick = () => document.getElementById('restore-data-input').click();
        document.getElementById('restore-data-input').onchange = restoreData;
        document.getElementById('clear-data-btn').onclick = clearAllData;
        document.getElementById('upload-logo-btn').onclick = () => document.getElementById('business-logo-upload').click();
        document.getElementById('business-logo-upload').onchange = saveLogo;

        // Inventory
        document.getElementById('add-product-form').onsubmit = addProduct;
        document.getElementById('export-inventory-btn').onclick = exportInventory;

        // Dashboard
        document.getElementById('z-report-btn').onclick = generateZReport;
        document.getElementById('download-sales-csv-btn').onclick = exportSalesCSV;

        // Global Modal Close
        document.querySelectorAll('.close-btn').forEach(btn => {
            btn.onclick = () => Object.values(dom.modals).forEach(m => m.style.display = 'none');
        });

        // Real-time Preview
        const inputs = [dom.businessName, dom.customerName, dom.customerPhone, dom.discountValue, dom.deliveryCharge, dom.advancePayment, dom.documentType];
        inputs.forEach(el => el && el.addEventListener('input', updateReceipt));
    }

    // --- Core Functions ---
    function addItem(prod = {}) {
        const div = document.createElement('div');
        div.className = 'bill-item-row';
        div.style = "display:flex; gap:5px; margin-bottom:5px;";
        div.innerHTML = `
            <input type="text" class="in-name" placeholder="Item" value="${prod.name || ''}" style="flex:3;">
            <input type="number" class="in-qty" placeholder="Qty" value="${prod.qty || 1}" style="flex:1;">
            <input type="number" class="in-price" placeholder="Price" value="${prod.price || ''}" style="flex:1;">
            <button class="remove-btn" style="background:red; color:#fff; border:none; border-radius:4px; padding:5px 10px;">×</button>
        `;
        dom.itemsList.appendChild(div);
        div.querySelectorAll('input').forEach(i => i.oninput = updateReceipt);
        div.querySelector('.remove-btn').onclick = () => { div.remove(); updateReceipt(); };
        updateReceipt();
    }

    function updateReceipt() {
        const data = getFormData();
        let subtotal = 0;
        let itemsHTML = data.items.map(i => {
            const total = i.qty * i.price;
            subtotal += total;
            return `<tr><td>${i.name}</td><td align="right">${i.qty}</td><td align="right">${total.toFixed(2)}</td></tr>`;
        }).join('');

        const discount = (parseFloat(dom.discountValue.value) || 0);
        const total = subtotal - discount + (parseFloat(dom.deliveryCharge.value) || 0);
        const due = total - (parseFloat(dom.advancePayment.value) || 0);

        const logoHTML = localStorage.getItem('businessLogo') ? `<img src="${localStorage.getItem('businessLogo')}" style="max-height:60px; margin-bottom:10px;">` : '';

        dom.receiptPreview.innerHTML = `
            <div style="text-align:center;">
                ${logoHTML}
                <h2>${dom.businessName.value || 'Business Name'}</h2>
                <p style="text-transform:uppercase;">${dom.documentType.value}</p>
                <hr>
                <p align="left">Customer: ${dom.customerName.value || 'N/A'}<br>Date: ${new Date().toLocaleDateString()}</p>
            </div>
            <table width="100%">${itemsHTML}</table>
            <hr>
            <div align="right">
                <p>Total: <strong>Rs. <span id="final-tot">${total.toFixed(2)}</span></strong></p>
                <p>Balance Due: Rs. ${due.toFixed(2)}</p>
            </div>
            <div style="text-align:center; font-size:10px; margin-top:20px;">Powered by ST Imagix</div>
        `;
    }

    function getFormData() {
        return {
            items: Array.from(document.querySelectorAll('.bill-item-row')).map(row => ({
                name: row.querySelector('.in-name').value,
                qty: parseFloat(row.querySelector('.in-qty').value) || 0,
                price: parseFloat(row.querySelector('.in-price').value) || 0
            }))
        };
    }

    async function finalizeAndSave() {
        const data = getFormData();
        const total = parseFloat(document.getElementById('final-tot').textContent);
        if (!dom.customerName.value || data.items.length === 0) return alert("Fill Name and Items!");

        const sale = {
            id: Date.now(),
            customerName: dom.customerName.value,
            customerPhone: dom.customerPhone.value,
            total: total,
            status: dom.paymentStatus.value,
            documentType: dom.documentType.value,
            dateTime: new Date().toISOString(),
            items: data.items
        };

        state.salesHistory.push(sale);
        localStorage.setItem('salesHistory', JSON.stringify(state.salesHistory));

        // Auto Download Bill as Image
        const canvas = await html2canvas(dom.receiptPreview);
        const link = document.createElement('a');
        link.download = `bill-${sale.id}.png`;
        link.href = canvas.toDataURL();
        link.click();

        alert("Saved & Bill Downloaded!");
        location.reload();
    }

    // --- Features Section ---
    function holdBill() {
        const bill = { id: Date.now(), customer: dom.customerName.value, items: getFormData().items };
        state.heldBills.push(bill);
        localStorage.setItem('heldBills', JSON.stringify(state.heldBills));
        alert("Bill Held!");
        location.reload();
    }

    function renderHeldBills() {
        const list = document.getElementById('held-bills-list');
        list.innerHTML = state.heldBills.map(b => `<div>${b.customer} <button onclick="resumeBill(${b.id})">Resume</button></div>`).join('');
    }

    function backupData() {
        const blob = new Blob([JSON.stringify(state)], { type: 'application/json' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `instabill_backup_${new Date().toISOString().slice(0,10)}.json`;
        link.click();
    }

    function restoreData(e) {
        const reader = new FileReader();
        reader.onload = (event) => {
            const data = JSON.parse(event.target.result);
            Object.assign(state, data);
            localStorage.setItem('productCatalog', JSON.stringify(state.productCatalog));
            localStorage.setItem('salesHistory', JSON.stringify(state.salesHistory));
            alert("Data Restored!");
            location.reload();
        };
        reader.readAsText(e.target.files[0]);
    }

    function clearAllData() {
        if(confirm("Delete EVERYTHING?")) { localStorage.clear(); location.reload(); }
    }

    function saveLogo(e) {
        const reader = new FileReader();
        reader.onload = (event) => {
            localStorage.setItem('businessLogo', event.target.result);
            updateReceipt();
        };
        reader.readAsDataURL(e.target.files[0]);
    }

    function loadLogo() { if(localStorage.getItem('businessLogo')) updateReceipt(); }

    function addProduct(e) {
        e.preventDefault();
        const prod = {
            name: document.getElementById('product-name-input').value,
            price: parseFloat(document.getElementById('product-price-input').value),
            stock: parseInt(document.getElementById('product-stock-input').value) || 0
        };
        state.productCatalog.push(prod);
        localStorage.setItem('productCatalog', JSON.stringify(state.productCatalog));
        renderProductList();
        e.target.reset();
    }

    function renderProductList() {
        const list = document.getElementById('product-list');
        list.innerHTML = `<table>${state.productCatalog.map(p => `<tr><td>${p.name}</td><td>${p.price}</td><td>${p.stock}</td></tr>`).join('')}</table>`;
    }

    function renderCreditLedger() {
        const list = document.getElementById('credit-ledger-list');
        const debtors = state.salesHistory.filter(s => s.status === 'credit');
        list.innerHTML = `<table>${debtors.map(d => `<tr><td>${d.customerName}</td><td>${d.total}</td></tr>`).join('')}</table>`;
    }

    function exportSalesCSV() {
        let csv = "Date,Customer,Total,Status\n";
        state.salesHistory.forEach(s => csv += `${s.dateTime.slice(0,10)},${s.customerName},${s.total},${s.status}\n`);
        const link = document.createElement('a');
        link.href = 'data:text/csv;charset=utf-8,' + encodeURI(csv);
        link.download = 'sales_history.csv';
        link.click();
    }

    function generateZReport() {
        const today = new Date().toISOString().slice(0,10);
        const sales = state.salesHistory.filter(s => s.dateTime.startsWith(today));
        const total = sales.reduce((acc, s) => acc + s.total, 0);
        document.getElementById('z-report-content').innerHTML = `<h3>Daily Z-Report</h3><hr><p>Total Sales: Rs. ${total.toFixed(2)}</p><p>Bills: ${sales.length}</p>`;
        dom.modals.zReport.style.display = 'block';
    }

    function renderSalesDashboard() {
        const today = new Date().toISOString().slice(0,10);
        const todaysSales = state.salesHistory.filter(s => s.dateTime.startsWith(today) && s.status === 'paid');
        const total = todaysSales.reduce((acc, s) => acc + s.total, 0);
        document.getElementById('total-sales').textContent = `Rs. ${total.toFixed(2)}`;
        
        const ctx = document.getElementById('sales-chart').getContext('2d');
        if(state.salesChart) state.salesChart.destroy();
        state.salesChart = new Chart(ctx, {
            type: 'bar',
            data: { labels: [today], datasets: [{ label: 'Sales', data: [total], backgroundColor: '#007bff' }] },
            options: { responsive: true, maintainAspectRatio: false }
        });
    }

    function renderCashierList() {
        const list = document.getElementById('cashier-list');
        list.innerHTML = state.cashiers.map(c => `<div>${c}</div>`).join('');
    }

    init();
});