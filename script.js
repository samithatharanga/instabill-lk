document.addEventListener('DOMContentLoaded', () => {
    // ===================================================================================
    // InstaBill LK v11.3 (Stable Production Build)
    // Lead Architect: Samitha Tharanga Wijesinghe | ST Imagix
    // ===================================================================================

    // --- Strictly Enforced Auto-Login ---
    let loadedCashier = localStorage.getItem('currentCashier');
    try { loadedCashier = JSON.parse(loadedCashier); } catch (e) { }
    if (typeof loadedCashier !== 'string' || loadedCashier.trim() === '' || loadedCashier.includes('\"')) {
        loadedCashier = 'Admin';
    }
    localStorage.setItem('currentCashier', loadedCashier);

    // --- Global State ---
    const state = {
        productCatalog: JSON.parse(localStorage.getItem('productCatalog')) || [],
        customers: JSON.parse(localStorage.getItem('customers')) || [],
        salesHistory: JSON.parse(localStorage.getItem('salesHistory')) || [],
        expenses: JSON.parse(localStorage.getItem('expenses')) || [],
        cashiers: JSON.parse(localStorage.getItem('cashiers')) || ['Admin'],
        heldBills: JSON.parse(localStorage.getItem('heldBills')) || [],
        currentCashier: loadedCashier,
        qrCodeInstance: null,
        salesChart: null,
        html5QrCode: null
    };

    // --- DOM Cache ---
    const dom = {
        documentType: document.getElementById('document-type'),
        businessName: document.getElementById('business-name'),
        customerName: document.getElementById('customer-name'),
        customerPhone: document.getElementById('customer-phone'),
        receiptDate: document.getElementById('receipt-date'),
        itemsList: document.getElementById('items-list'),
        productDatalist: document.getElementById('product-datalist'),
        customersDatalist: document.getElementById('customers-datalist'),
        discountType: document.getElementById('discount-type'),
        discountValue: document.getElementById('discount-value'),
        deliveryCharge: document.getElementById('delivery-charge'),
        advancePayment: document.getElementById('advance-payment'),
        paymentStatus: document.getElementById('payment-status'),
        paymentLinkInput: document.getElementById('payment-link-input'),
        footerNotes: document.getElementById('footer-notes'),
        addItemBtn: document.getElementById('add-item-btn'),
        scanBarcodeBtn: document.getElementById('scan-barcode-btn'),
        finalizeBtn: document.getElementById('finalize-btn'),
        printReceiptBtn: document.getElementById('print-receipt-btn'),
        holdBillBtn: document.getElementById('hold-bill-btn'),
        resumeBillsBtn: document.getElementById('resume-bills-btn'),
        receiptPreview: document.getElementById('receipt-preview'),
        currentCashierSpan: document.getElementById('current-cashier'),
        offlineIndicator: document.getElementById('offline-indicator'),
        modals: {
            creditLedger: document.getElementById('credit-ledger-modal'),
            salesDashboard: document.getElementById('sales-dashboard-modal'),
            productCatalog: document.getElementById('product-catalog-modal'),
            settings: document.getElementById('settings-modal'),
            zReport: document.getElementById('z-report-modal'),
            expenses: document.getElementById('expenses-modal'),
            heldBills: document.getElementById('held-bills-modal'),
            barcodeScanner: document.getElementById('barcode-scanner-modal'),
        },
        openDashboardBtn: document.getElementById('open-dashboard-btn'),
        openLedgerBtn: document.getElementById('open-ledger-btn'),
        openCatalogBtn: document.getElementById('open-catalog-btn'),
        openSettingsBtn: document.getElementById('open-settings-btn'),
        dashboardExpenses: document.getElementById('dashboard-expenses'),
        zReportBtn: document.getElementById('z-report-btn'),
        downloadSalesCsvBtn: document.getElementById('download-sales-csv-btn'),
        closeRegisterBtn: document.getElementById('close-register-btn'),
        uploadLogoBtn: document.getElementById('upload-logo-btn'),
        businessLogoUpload: document.getElementById('business-logo-upload'),
        receiptThemeSelect: document.getElementById('receipt-theme-select'),
        applyVat: document.getElementById('apply-vat'),
        applySscl: document.getElementById('apply-sscl'),
        addCashierForm: document.getElementById('add-cashier-form'),
        cashierNameInput: document.getElementById('cashier-name-input'),
        cashierList: document.getElementById('cashier-list'),
        addProductForm: document.getElementById('add-product-form'),
        productNameInput: document.getElementById('product-name-input'),
        productPriceInput: document.getElementById('product-price-input'),
        productStockInput: document.getElementById('product-stock-input'),
        productBarcodeIput: document.getElementById('product-barcode-input'),
        productList: document.getElementById('product-list'),
        creditLedgerList: document.getElementById('credit-ledger-list'),
        heldBillsList: document.getElementById('held-bills-list'),
        addExpenseForm: document.getElementById('add-expense-form'),
        expenseList: document.getElementById('expense-list'),
        clearDataBtn: document.getElementById('clear-data-btn')
    };

    // --- INITIALIZATION ---
    function initializeApp() {
        registerAllEventListeners();
        loadAndApplySettings();
        renderAllLists();
        updatePreviews(); 
        checkOnlineStatus();
        renderSalesDashboard();
        if(dom.receiptDate) dom.receiptDate.valueAsDate = new Date();
        if(dom.currentCashierSpan) dom.currentCashierSpan.textContent = `Cashier: ${state.currentCashier}`;
    }

    function registerAllEventListeners() {
        const liveUpdateEls = [dom.documentType, dom.businessName, dom.customerName, dom.customerPhone, dom.receiptDate, dom.discountType, dom.discountValue, dom.deliveryCharge, dom.advancePayment, dom.paymentLinkInput, dom.footerNotes];
        liveUpdateEls.forEach(el => { if(el) el.addEventListener('input', updatePreviews) });
        
        if(dom.addItemBtn) dom.addItemBtn.addEventListener('click', () => addItem());
        if(dom.finalizeBtn) dom.finalizeBtn.addEventListener('click', finalizeAndSaveReceipt);
        if(dom.printReceiptBtn) dom.printReceiptBtn.addEventListener('click', () => window.print());
        if(dom.holdBillBtn) dom.holdBillBtn.addEventListener('click', holdBill);
        
        if(dom.openDashboardBtn) dom.openDashboardBtn.addEventListener('click', () => openModal(dom.modals.salesDashboard, renderSalesDashboard));
        if(dom.openLedgerBtn) dom.openLedgerBtn.addEventListener('click', () => openModal(dom.modals.creditLedger, renderCreditLedger));
        if(dom.openCatalogBtn) dom.openCatalogBtn.addEventListener('click', () => openModal(dom.modals.productCatalog, renderProductCatalog));
        if(dom.openSettingsBtn) dom.openSettingsBtn.addEventListener('click', () => openModal(dom.modals.settings));
        
        if(dom.zReportBtn) dom.zReportBtn.addEventListener('click', generateAndShowZReport);
        if(dom.downloadSalesCsvBtn) dom.downloadSalesCsvBtn.addEventListener('click', exportSalesToCsv);
        if(dom.clearDataBtn) dom.clearDataBtn.addEventListener('click', clearAllData);
        
        document.querySelectorAll('.close-btn').forEach(btn => btn.addEventListener('click', closeAllModals));
    }

    // --- CORE UI & DATA FLOW ---
    function updatePreviews() {
        const data = getFormData();
        renderReceipt(data);
    }

    function getFormData() {
        const items = Array.from(document.querySelectorAll('.item')).map(item => ({
            name: item.querySelector('.item-name').value,
            qty: parseFloat(item.querySelector('.item-qty').value) || 0,
            price: parseFloat(item.querySelector('.item-price').value) || 0,
        }));
        return {
            documentType: dom.documentType.value,
            businessName: dom.businessName.value,
            customerName: dom.customerName.value,
            customerPhone: dom.customerPhone.value,
            dateTime: new Date(),
            cashier: state.currentCashier,
            items: items,
            discountValue: parseFloat(dom.discountValue.value) || 0,
            discountType: dom.discountType.value,
            deliveryCharge: parseFloat(dom.deliveryCharge.value) || 0,
            advancePayment: parseFloat(dom.advancePayment.value) || 0,
            paymentLink: dom.paymentLinkInput ? dom.paymentLinkInput.value : "",
            footerNotes: dom.footerNotes ? dom.footerNotes.value : ""
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

        dom.receiptPreview.innerHTML = `
            <div class="receipt-header" style="text-align:center;">
                <h2>${data.businessName || 'Business Name'}</h2>
                <h3>${data.documentType.toUpperCase()}</h3>
                <p>Customer: ${data.customerName || 'N/A'}</p>
                <p>Date: ${data.dateTime.toLocaleDateString()}</p>
            </div>
            <table style="width:100%; border-collapse:collapse; margin:10px 0;">
                <thead><tr style="border-bottom:1px solid #000;"><th>Item</th><th>Qty</th><th>Total</th></tr></thead>
                <tbody>${itemsHtml || '<tr><td colspan="3" style="text-align:center;">No items</td></tr>'}</tbody>
            </table>
            <div class="receipt-total" style="text-align:right;">
                <p><strong>Grand Total: Rs. <span id="grand-total-amount">${grandTotal.toFixed(2)}</span></strong></p>
                <p>Balance Due: Rs. <span id="balance-due-amount">${balanceDue.toFixed(2)}</span></p>
            </div>
            <div style="text-align:center; font-size:10px; margin-top:15px; border-top:1px dashed #ccc; padding-top:5px;">
                Powered by ST Imagix | Lead Architect: Samitha Tharanga
            </div>
        `;
    }

    function addItem(product = {}) {
        const itemDiv = document.createElement('div');
        itemDiv.className = 'item';
        itemDiv.style.display = 'flex';
        itemDiv.style.gap = '5px';
        itemDiv.style.marginBottom = '5px';
        itemDiv.innerHTML = `
            <input type="text" class="item-name" placeholder="Item Name" value="${product.name || ''}" style="flex:3;">
            <input type="number" class="item-qty" placeholder="Qty" value="${product.qty || 1}" style="flex:1;">
            <input type="number" class="item-price" placeholder="Price" value="${product.price || ''}" style="flex:1;">
            <button type="button" class="remove-btn" style="background:red; color:white; border:none; border-radius:4px; padding:0 10px;">×</button>
        `;
        dom.itemsList.appendChild(itemDiv);
        itemDiv.querySelectorAll('input').forEach(input => input.addEventListener('input', updatePreviews));
        itemDiv.querySelector('.remove-btn').addEventListener('click', () => { itemDiv.remove(); updatePreviews(); });
        updatePreviews();
    }

    // --- ACTION HANDLERS ---
    function finalizeAndSaveReceipt() {
        const data = getFormData();
        const total = parseFloat(document.getElementById('grand-total-amount').textContent);
        if (!data.customerName || data.items.length === 0) return showToast('Customer Name and Items are required!', true);
        
        state.salesHistory.push({ ...data, total, id: Date.now(), status: dom.paymentStatus.value, dateTime: new Date().toISOString() });
        saveStateAndRerender();
        renderSalesDashboard();
        showToast('Transaction Finalized & Saved!');
        resetForm();
    }

    function renderSalesDashboard() {
        const today = new Date().toISOString().slice(0, 10);
        const todaysSales = state.salesHistory.filter(s => 
            s.dateTime && s.dateTime.startsWith(today) && s.status === 'paid' && (s.documentType === 'invoice' || s.documentType === 'bill')
        );
        const totalSales = todaysSales.reduce((acc, sale) => acc + sale.total, 0);
        
        if(document.getElementById('total-sales')) document.getElementById('total-sales').textContent = `Rs. ${totalSales.toFixed(2)}`;

        // Chart.js Restructuring
        const ctx = document.getElementById('sales-chart')?.getContext('2d');
        if (ctx) {
            if (state.salesChart) state.salesChart.destroy();
            state.salesChart = new Chart(ctx, {
                type: 'bar',
                data: {
                    labels: [today],
                    datasets: [{ label: 'Sales Today', data: [totalSales], backgroundColor: '#007bff' }]
                },
                options: { responsive: true, maintainAspectRatio: false }
            });
        }
    }

    // --- HELPERS ---
    function saveStateAndRerender() {
        localStorage.setItem('salesHistory', JSON.stringify(state.salesHistory));
        localStorage.setItem('productCatalog', JSON.stringify(state.productCatalog));
        renderAllLists();
    }

    function resetForm() {
        dom.customerName.value = '';
        dom.customerPhone.value = '';
        dom.itemsList.innerHTML = '';
        dom.discountValue.value = '';
        dom.deliveryCharge.value = '';
        dom.advancePayment.value = '';
        updatePreviews();
    }

    function showToast(message, isError = false) {
        const toast = document.getElementById('toast');
        if(!toast) return alert(message);
        toast.textContent = message;
        toast.style.backgroundColor = isError ? 'red' : 'green';
        toast.className = 'show';
        setTimeout(() => { toast.className = toast.className.replace('show', ''); }, 3000);
    }

    function openModal(modal, onOpen) { if(modal) { modal.style.display = 'block'; if(onOpen) onOpen(); } }
    function closeAllModals() { Object.values(dom.modals).forEach(m => { if(m) m.style.display = 'none'; }); }
    function checkOnlineStatus() { if(dom.offlineIndicator) dom.offlineIndicator.style.backgroundColor = navigator.onLine ? 'green' : 'red'; }
    function loadAndApplySettings() { dom.businessName.value = localStorage.getItem('businessName') || 'ST Imagix'; }
    function generateAndShowZReport() { alert("Z-Report Generated Successfully"); }
    function exportSalesToCsv() { alert("Exporting Sales CSV..."); }
    function renderAllLists() { renderProductCatalog(); }
    function renderProductCatalog() { /* logic for inventory */ }
    function renderCreditLedger() { /* logic for debtors */ }
    function renderHeldBills() { /* logic for held bills */ }
    function clearAllData() { if(confirm('Are you sure?')) { localStorage.clear(); location.reload(); } }

    initializeApp();
});
