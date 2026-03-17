document.addEventListener('DOMContentLoaded', () => {
    // ===================================================================================
    // InstaBill LK v12.0 (FINAL COMPLETE PRODUCTION BUILD)
    // Lead Architect: Samitha Tharanga Wijesinghe | ST Imagix
    // ===================================================================================

    // --- State Management ---
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

    // --- Primary Initialization ---
    function init() {
        registerAllEvents();
        renderProductList();
        renderCreditLedger();
        renderCashierList();
        renderSalesDashboard();
        loadSettings();
        updateReceipt();
    }

    function registerAllEvents() {
        // Core Buttons
        document.getElementById('add-item-btn').onclick = () => addItem();
        document.getElementById('finalize-btn').onclick = finalizeAndSave;
        document.getElementById('hold-bill-btn').onclick = holdBill;
        document.getElementById('resume-bills-btn').onclick = () => openModal(dom.modals.heldBills, renderHeldBills);
        
        // Navigation Modals
        document.getElementById('open-dashboard-btn').onclick = () => openModal(dom.modals.dashboard, renderSalesDashboard);
        document.getElementById('open-ledger-btn').onclick = () => openModal(dom.modals.ledger, renderCreditLedger);
        document.getElementById('open-catalog-btn').onclick = () => openModal(dom.modals.catalog, renderProductList);
        document.getElementById('open-settings-btn').onclick = () => openModal(dom.modals.settings);

        // Settings Actions
        document.getElementById('upload-logo-btn').onclick = () => document.getElementById('business-logo-upload').click();
        document.getElementById('business-logo-upload').onchange = handleLogoUpload;
        document.getElementById('backup-data-btn').onclick = backupData;
        document.getElementById('restore-data-btn').onclick = () => document.getElementById('restore-data-input').click();
        document.getElementById('restore-data-input').onchange = restoreData;
        document.getElementById('clear-data-btn').onclick = clearAllData;

        // Inventory Form
        document.getElementById('add-product-form').onsubmit = handleAddProduct;

        // Dashboard Buttons
        document.getElementById('z-report-btn').onclick = generateZReport;
        document.getElementById('download-sales-csv-btn').onclick = exportSalesCSV;

        // Close Modals
        document.querySelectorAll('.close-btn').forEach(btn => {
            btn.onclick = () => Object.values(dom.modals).forEach(m => m.style.display = 'none');
        });

        // Auto Updates
        const realTimeFields = [dom.businessName, dom.customerName, dom.customerPhone, dom.discountValue, dom.deliveryCharge, dom.advancePayment, dom.documentType];
        realTimeFields.forEach(field => field?.addEventListener('input', updateReceipt));
    }

    // --- Core Functions ---
    function addItem(prod = {}) {
        const div = document.createElement('div');
        div.className = 'bill-item-row';
        div.style = "display:flex; gap:5px; margin-bottom:8px;";
        div.innerHTML = `
            <input type="text" class="in-name" placeholder="Item" value="${prod.name || ''}" style="flex:3;">
            <input type="number" class="in-qty" placeholder="Qty" value="${prod.qty || 1}" style="flex:1;">
            <input type="number" class="in-price" placeholder="Price" value="${prod.price || ''}" style="flex:1;">
            <button class="rm-btn" style="background:#ff4d4d; color:white; border:none; border-radius:4px; width:30px;">×</button>
        `;
        dom.itemsList.appendChild(div);
        div.querySelectorAll('input').forEach(i => i.oninput = updateReceipt);
        div.querySelector('.rm-btn').onclick = () => { div.remove(); updateReceipt(); };
        updateReceipt();
    }

    function updateReceipt() {
        const data = getItemsData();
        let subtotal = 0;
        let itemsHtml = data.map(i => {
            const total = i.qty * i.price;
            subtotal += total;
            return `<tr><td>${i.name || 'Item'}</td><td align="right">${i.qty}</td><td align="right">${total.toFixed(2)}</td></tr>`;
        }).join('');

        const discount = parseFloat(dom.discountValue.value) || 0;
        const delivery = parseFloat(dom.deliveryCharge.value) || 0;
        const advance = parseFloat(dom.advancePayment.value) || 0;
        const total = subtotal - discount + delivery;
        const balance = total - advance;

        const logo = localStorage.getItem('businessLogo');
        const logoHtml = logo ? `<img src="${logo}" style="max-height:60px; margin-bottom:10px;">` : '';

        dom.receiptPreview.innerHTML = `
            <div style="text-align:center;">
                ${logoHtml}
                <h2 style="margin:0;">${dom.businessName.value || 'ST Imagix'}</h2>
                <p style="text-transform:uppercase; font-weight:bold; margin:5px 0;">${dom.documentType.value}</p>
                <hr>
                <p align="left">Customer: ${dom.customerName.value || 'N/A'}<br>Date: ${new Date().toLocaleDateString()}</p>
            </div>
            <table width="100%" style="font-size:13px;">${itemsHtml}</table>
            <hr>
            <div align="right">
                <p>Subtotal: ${subtotal.toFixed(2)}</p>
                <p>Discount: -${discount.toFixed(2)}</p>
                <p><strong>Grand Total: Rs. <span id="final-tot-val">${total.toFixed(2)}</span></strong></p>
                <p>Balance Due: Rs. ${balance.toFixed(2)}</p>
            </div>
            <div style="text-align:center; font-size:10px; margin-top:20px; border-top:1px dashed #ccc; padding-top:5px;">
                Software by ST Imagix | 071 012 2 520
            </div>
        `;
    }

    function getItemsData() {
        return Array.from(document.querySelectorAll('.bill-item-row')).map(row => ({
            name: row.querySelector('.in-name').value,
            qty: parseFloat(row.querySelector('.in-qty').value) || 0,
            price: parseFloat(row.querySelector('.in-price').value) || 0
        }));
    }

    async function finalizeAndSave() {
        const items = getItemsData();
        const totalVal = document.getElementById('final-tot-val');
        const total = totalVal ? parseFloat(totalVal.textContent) : 0;

        if (!dom.customerName.value || items.length === 0) return alert("Please add customer name and items!");

        // Deduct Stock from Inventory
        items.forEach(soldItem => {
            const product = state.productCatalog.find(p => p.name.toLowerCase() === soldItem.name.toLowerCase());
            if (product) product.stock = Math.max(0, product.stock - soldItem.qty);
        });

        const sale = {
            id: Date.now(),
            customerName: dom.customerName.value,
            total: total,
            status: dom.paymentStatus.value,
            dateTime: new Date().toISOString(),
            items: items
        };

        state.salesHistory.push(sale);
        saveToStorage();

        // Download as Image
        const canvas = await html2canvas(dom.receiptPreview);
        const link = document.createElement('a');
        link.download = `Receipt-${sale.id}.png`;
        link.href = canvas.toDataURL();
        link.click();

        alert("Transaction Finalized and Receipt Downloaded!");
        location.reload();
    }

    // --- Feature Functions ---
    function holdBill() {
        const bill = { 
            id: Date.now(), 
            customer: dom.customerName.value || 'Walking Customer', 
            items: getItemsData(),
            date: new Date().toISOString()
        };
        state.heldBills.push(bill);
        saveToStorage();
        alert("Bill Saved to 'Held Bills'.");
        location.reload();
    }

    function renderHeldBills() {
        const container = document.getElementById('held-bills-list');
        if (state.heldBills.length === 0) return container.innerHTML = "<p>No bills on hold.</p>";
        container.innerHTML = state.heldBills.map(b => `
            <div style="display:flex; justify-content:space-between; padding:10px; border-bottom:1px solid #eee;">
                <span>${b.customer} (${b.items.length} items)</span>
                <button onclick="resumeBill(${b.id})" style="background:#007bff; color:white; border:none; padding:5px 10px; border-radius:4px;">Resume</button>
            </div>
        `).join('');
    }

    window.resumeBill = (id) => {
        const billIndex = state.heldBills.findIndex(b => b.id === id);
        const bill = state.heldBills[billIndex];
        dom.customerName.value = bill.customer;
        dom.itemsList.innerHTML = '';
        bill.items.forEach(i => addItem(i));
        state.heldBills.splice(billIndex, 1);
        saveToStorage();
        Object.values(dom.modals).forEach(m => m.style.display = 'none');
        updateReceipt();
    };

    function handleAddProduct(e) {
        e.preventDefault();
        const product = {
            name: document.getElementById('product-name-input').value,
            price: parseFloat(document.getElementById('product-price-input').value),
            stock: parseInt(document.getElementById('product-stock-input').value) || 0
        };
        state.productCatalog.push(product);
        saveToStorage();
        renderProductList();
        e.target.reset();
    }

    function renderProductList() {
        const list = document.getElementById('product-list');
        list.innerHTML = `<table width="100%">
            <tr style="background:#f4f4f4;"><th>Product</th><th>Price</th><th>Stock</th></tr>
            ${state.productCatalog.map(p => `<tr><td>${p.name}</td><td>${p.price.toFixed(2)}</td><td>${p.stock}</td></tr>`).join('')}
        </table>`;
    }

    function renderSalesDashboard() {
        const today = new Date().toISOString().slice(0, 10);
        const sales = state.salesHistory.filter(s => s.dateTime.startsWith(today) && s.status === 'paid');
        const total = sales.reduce((acc, s) => acc + s.total, 0);
        document.getElementById('total-sales').textContent = `Rs. ${total.toFixed(2)}`;

        const ctx = document.getElementById('sales-chart').getContext('2d');
        if (state.salesChart) state.salesChart.destroy();
        state.salesChart = new Chart(ctx, {
            type: 'bar',
            data: { labels: ['Today'], datasets: [{ label: 'Sales', data: [total], backgroundColor: '#007bff' }] },
            options: { responsive: true, maintainAspectRatio: false }
        });
    }

    function generateZReport() {
        const today = new Date().toISOString().slice(0, 10);
        const sales = state.salesHistory.filter(s => s.dateTime.startsWith(today));
        const total = sales.reduce((acc, s) => acc + s.total, 0);
        document.getElementById('z-report-content').innerHTML = `
            <div style="text-align:center; font-family:monospace;">
                <h3>DAILY Z-REPORT</h3>
                <p>Date: ${today}</p><hr>
                <p>Total Revenue: Rs. ${total.toFixed(2)}</p>
                <p>Transactions: ${sales.length}</p>
            </div>`;
        dom.modals.zReport.style.display = 'block';
    }

    // --- Helper Functions ---
    function handleLogoUpload(e) {
        const reader = new FileReader();
        reader.onload = (event) => {
            localStorage.setItem('businessLogo', event.target.result);
            updateReceipt();
        };
        reader.readAsDataURL(e.target.files[0]);
    }

    function saveToStorage() {
        localStorage.setItem('productCatalog', JSON.stringify(state.productCatalog));
        localStorage.setItem('salesHistory', JSON.stringify(state.salesHistory));
        localStorage.setItem('heldBills', JSON.stringify(state.heldBills));
    }

    function loadSettings() {
        dom.businessName.value = localStorage.getItem('businessName') || 'ST Imagix';
    }

    function openModal(modal, callback) {
        modal.style.display = 'block';
        if (callback) callback();
    }

    function backupData() {
        const data = JSON.stringify(state);
        const blob = new Blob([data], { type: 'application/json' });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = `backup-${new Date().toISOString().slice(0,10)}.json`;
        a.click();
    }

    function restoreData(e) {
        const reader = new FileReader();
        reader.onload = (event) => {
            const data = JSON.parse(event.target.result);
            Object.assign(state, data);
            saveToStorage();
            alert("Data Restored Successfully!");
            location.reload();
        };
        reader.readAsText(e.target.files[0]);
    }

    function clearAllData() {
        if (confirm("DANGER: This will delete ALL data forever. Continue?")) {
            localStorage.clear();
            location.reload();
        }
    }

    function renderCreditLedger() {
        const list = document.getElementById('credit-ledger-list');
        const creditSales = state.salesHistory.filter(s => s.status === 'credit');
        list.innerHTML = `<table width="100%">
            <tr><th>Customer</th><th>Amount</th><th>Date</th></tr>
            ${creditSales.map(s => `<tr><td>${s.customerName}</td><td>${s.total.toFixed(2)}</td><td>${s.dateTime.slice(0,10)}</td></tr>`).join('')}
        </table>`;
    }

    function renderCashierList() {
        document.getElementById('cashier-list').innerHTML = state.cashiers.map(c => `<div>👤 ${c}</div>`).join('');
    }

    function exportSalesCSV() {
        let csv = "Date,Customer,Total,Status\n";
        state.salesHistory.forEach(s => csv += `${s.dateTime.slice(0,10)},${s.customerName},${s.total.toFixed(2)},${s.status}\n`);
        const a = document.createElement('a');
        a.href = 'data:text/csv;charset=utf-8,' + encodeURI(csv);
        a.download = 'sales_history.csv';
        a.click();
    }

    init();
});