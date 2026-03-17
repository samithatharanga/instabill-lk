document.addEventListener('DOMContentLoaded', () => {
    // ===================================================================================
    // InstaBill LK v11.8 (FINAL PRODUCTION READY - ERROR FREE)
    // Lead Architect: Samitha Tharanga Wijesinghe | ST Imagix
    // ===================================================================================

    const state = {
        productCatalog: JSON.parse(localStorage.getItem('productCatalog')) || [],
        customers: JSON.parse(localStorage.getItem('customers')) || [],
        salesHistory: JSON.parse(localStorage.getItem('salesHistory')) || [],
        expenses: JSON.parse(localStorage.getItem('expenses')) || [],
        currentCashier: localStorage.getItem('currentCashier') || 'Admin',
        salesChart: null
    };

    const dom = {
        documentType: document.getElementById('document-type'),
        businessName: document.getElementById('business-name'),
        customerName: document.getElementById('customer-name'),
        customerPhone: document.getElementById('customer-phone'),
        receiptDate: document.getElementById('receipt-date'),
        itemsList: document.getElementById('items-list'),
        discountType: document.getElementById('discount-type'),
        discountValue: document.getElementById('discount-value'),
        deliveryCharge: document.getElementById('delivery-charge'),
        advancePayment: document.getElementById('advance-payment'),
        paymentStatus: document.getElementById('payment-status'),
        addItemBtn: document.getElementById('add-item-btn'),
        finalizeBtn: document.getElementById('finalize-btn'),
        printReceiptBtn: document.getElementById('print-receipt-btn'),
        receiptPreview: document.getElementById('receipt-preview'),
        currentCashierSpan: document.getElementById('current-cashier'),
        offlineIndicator: document.getElementById('offline-indicator'),
        modals: {
            salesDashboard: document.getElementById('sales-dashboard-modal'),
            creditLedger: document.getElementById('credit-ledger-modal'),
            productCatalog: document.getElementById('product-catalog-modal'),
            settings: document.getElementById('settings-modal'),
            zReport: document.getElementById('z-report-modal')
        },
        openDashboardBtn: document.getElementById('open-dashboard-btn'),
        openLedgerBtn: document.getElementById('open-ledger-btn'),
        openCatalogBtn: document.getElementById('open-catalog-btn'),
        openSettingsBtn: document.getElementById('open-settings-btn'),
        zReportBtn: document.getElementById('z-report-btn'),
        totalSales: document.getElementById('total-sales'),
        totalExpenses: document.getElementById('total-expenses'),
        netProfit: document.getElementById('net-profit')
    };

    function initializeApp() {
        registerEventListeners();
        loadSettings();
        updatePreviews();
        renderSalesDashboard();
        if (dom.receiptDate) dom.receiptDate.valueAsDate = new Date();
        if (dom.currentCashierSpan) dom.currentCashierSpan.textContent = `Cashier: ${state.currentCashier}`;
        checkOnlineStatus();
    }

    function registerEventListeners() {
        const inputs = [dom.documentType, dom.businessName, dom.customerName, dom.customerPhone, dom.discountValue, dom.deliveryCharge, dom.advancePayment, dom.discountType];
        inputs.forEach(el => { if(el) el.addEventListener('input', updatePreviews); });

        if (dom.addItemBtn) dom.addItemBtn.addEventListener('click', addItem);
        if (dom.finalizeBtn) dom.finalizeBtn.addEventListener('click', finalizeAndSaveReceipt);
        if (dom.printReceiptBtn) dom.printReceiptBtn.addEventListener('click', () => window.print());

        if (dom.openDashboardBtn) dom.openDashboardBtn.addEventListener('click', () => openModal(dom.modals.salesDashboard, renderSalesDashboard));
        if (dom.openLedgerBtn) dom.openLedgerBtn.addEventListener('click', () => openModal(dom.modals.creditLedger));
        if (dom.openCatalogBtn) dom.openCatalogBtn.addEventListener('click', () => openModal(dom.modals.productCatalog));
        if (dom.openSettingsBtn) dom.openSettingsBtn.addEventListener('click', () => openModal(dom.modals.settings));
        
        if (dom.zReportBtn) dom.zReportBtn.addEventListener('click', generateZReport);

        document.querySelectorAll('.close-btn').forEach(btn => {
            btn.addEventListener('click', closeModals);
        });
    }

    function openModal(modal, callback) {
        if (modal) {
            modal.style.display = 'block';
            if (callback) callback();
        }
    }

    function closeModals() {
        Object.values(dom.modals).forEach(m => { if(m) m.style.display = 'none'; });
    }

    function getFormData() {
        const itemRows = document.querySelectorAll('.bill-item-row');
        const items = Array.from(itemRows).map(row => ({
            name: row.querySelector('.item-input-name').value,
            qty: parseFloat(row.querySelector('.item-input-qty').value) || 0,
            price: parseFloat(row.querySelector('.item-input-price').value) || 0
        }));

        return {
            documentType: dom.documentType ? dom.documentType.value : 'bill',
            businessName: dom.businessName ? dom.businessName.value : 'ST Imagix',
            customerName: dom.customerName ? dom.customerName.value : '',
            customerPhone: dom.customerPhone ? dom.customerPhone.value : '',
            items: items,
            discountValue: dom.discountValue ? parseFloat(dom.discountValue.value) || 0 : 0,
            discountType: dom.discountType ? dom.discountType.value : 'percentage',
            deliveryCharge: dom.deliveryCharge ? parseFloat(dom.deliveryCharge.value) || 0 : 0,
            advancePayment: dom.advancePayment ? parseFloat(dom.advancePayment.value) || 0 : 0,
            dateTime: new Date(),
            cashier: state.currentCashier
        };
    }

    function renderReceipt(data) {
        let subtotal = 0;
        let itemsHtml = data.items.map(item => {
            const total = item.qty * item.price;
            subtotal += total;
            return `<tr><td>${item.name || 'Item'}</td><td>${item.qty}</td><td>${total.toFixed(2)}</td></tr>`;
        }).join('');

        const discount = data.discountType === 'percentage' ? subtotal * (data.discountValue / 100) : data.discountValue;
        const grandTotal = subtotal - discount + data.deliveryCharge;
        const balanceDue = grandTotal - data.advancePayment;

        if (dom.receiptPreview) {
            dom.receiptPreview.innerHTML = `
                <div style="text-align:center; padding-bottom:10px; border-bottom:1px dashed #000;">
                    <h2 style="margin:5px 0;">${data.businessName}</h2>
                    <p style="text-transform:uppercase; font-weight:bold; margin:2px 0;">${data.documentType}</p>
                    <p style="font-size:12px; margin:2px 0;">Customer: ${data.customerName || 'N/A'}</p>
                    <p style="font-size:12px; margin:2px 0;">Date: ${data.dateTime.toLocaleDateString()}</p>
                </div>
                <table style="width:100%; border-collapse:collapse; margin-top:10px; font-size:13px;">
                    <thead><tr style="border-bottom:1px solid #000; text-align:left;"><th>Item</th><th>Qty</th><th>Total</th></tr></thead>
                    <tbody>${itemsHtml || '<tr><td colspan="3" style="text-align:center;">No items added</td></tr>'}</tbody>
                </table>
                <div style="margin-top:10px; border-top:1px solid #000; padding-top:5px; text-align:right; font-size:14px;">
                    <p style="margin:2px 0;">Subtotal: ${subtotal.toFixed(2)}</p>
                    <p style="margin:2px 0; font-size:16px;"><strong>Total: Rs. <span id="final-amount-val">${grandTotal.toFixed(2)}</span></strong></p>
                    <p style="margin:2px 0;">Balance Due: Rs. ${balanceDue.toFixed(2)}</p>
                </div>
                <div style="text-align:center; font-size:10px; margin-top:20px; border-top:1px dashed #ccc; padding-top:5px;">
                    Powered by ST Imagix | 071 012 2 520
                </div>
            `;
        }
    }

    function updatePreviews() {
        renderReceipt(getFormData());
    }

    function addItem() {
        const div = document.createElement('div');
        div.className = 'bill-item-row';
        div.style.display = 'flex';
        div.style.gap = '5px';
        div.style.marginBottom = '8px';
        div.innerHTML = `
            <input type="text" class="item-input-name" placeholder="Item Name" style="flex:3; padding:8px; border:1px solid #ccc; border-radius:4px;">
            <input type="number" class="item-input-qty" placeholder="Qty" value="1" style="flex:1; padding:8px; border:1px solid #ccc; border-radius:4px;">
            <input type="number" class="item-input-price" placeholder="Price" style="flex:1; padding:8px; border:1px solid #ccc; border-radius:4px;">
            <button class="item-remove-btn" style="background:#ff4d4d; color:#fff; border:none; padding:8px 12px; border-radius:4px; cursor:pointer;">×</button>
        `;
        dom.itemsList.appendChild(div);
        div.querySelectorAll('input').forEach(i => i.addEventListener('input', updatePreviews));
        div.querySelector('.item-remove-btn').addEventListener('click', () => { div.remove(); updatePreviews(); });
        updatePreviews();
    }

    function finalizeAndSaveReceipt() {
        const data = getFormData();
        const finalValEl = document.getElementById('final-amount-val');
        const total = finalValEl ? parseFloat(finalValEl.textContent) : 0;

        if (!data.customerName || data.items.length === 0) {
            alert("Please provide Customer Name and at least one item.");
            return;
        }

        const transaction = { 
            ...data, 
            total, 
            id: Date.now(), 
            status: dom.paymentStatus ? dom.paymentStatus.value : 'paid',
            dateTime: new Date().toISOString() 
        };
        
        state.salesHistory.push(transaction);
        localStorage.setItem('salesHistory', JSON.stringify(state.salesHistory));
        alert("Success! Transaction Saved.");
        location.reload();
    }

    function renderSalesDashboard() {
        const today = new Date().toISOString().slice(0, 10);
        const todaysTransactions = state.salesHistory.filter(s => 
            s.dateTime && s.dateTime.startsWith(today) && s.status === 'paid' && s.documentType !== 'quotation'
        );
        
        const salesTotal = todaysTransactions.reduce((acc, s) => acc + s.total, 0);
        const expensesTotal = state.expenses.filter(e => e.date === today).reduce((acc, e) => acc + e.amount, 0);

        if (dom.totalSales) dom.totalSales.textContent = `Rs. ${salesTotal.toFixed(2)}`;
        if (dom.totalExpenses) dom.totalExpenses.textContent = `Rs. ${expensesTotal.toFixed(2)}`;
        if (dom.netProfit) dom.netProfit.textContent = `Rs. ${(salesTotal - expensesTotal).toFixed(2)}`;

        const chartCanvas = document.getElementById('sales-chart');
        if (chartCanvas && typeof Chart !== 'undefined') {
            if (state.salesChart) state.salesChart.destroy();
            state.salesChart = new Chart(chartCanvas, {
                type: 'bar',
                data: {
                    labels: [today],
                    datasets: [{ label: 'Sales Today', data: [salesTotal], backgroundColor: '#007bff' }]
                },
                options: { responsive: true, maintainAspectRatio: false }
            });
        }
    }

    function generateZReport() {
        const today = new Date().toISOString().slice(0, 10);
        const sales = state.salesHistory.filter(s => s.dateTime.startsWith(today));
        const total = sales.reduce((acc, s) => acc + s.total, 0);
        const contentArea = document.getElementById('z-report-content');
        if(contentArea) {
            contentArea.innerHTML = `<div style="text-align:center;"><h3>Z-REPORT</h3><p>Date: ${today}</p><hr><p>Total Sales: Rs. ${total.toFixed(2)}</p><p>Transactions: ${sales.length}</p></div>`;
            openModal(dom.modals.zReport);
        }
    }

    function loadSettings() {
        if (dom.businessName) dom.businessName.value = localStorage.getItem('businessName') || 'ST Imagix';
    }

    function checkOnlineStatus() {
        if (dom.offlineIndicator) dom.offlineIndicator.style.backgroundColor = navigator.onLine ? '#28a745' : '#dc3545';
    }

    initializeApp();
});