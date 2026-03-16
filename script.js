document.addEventListener('DOMContentLoaded', () => {
    // ===================================================================================
    // InstaBill LK v11 (The Ultimate Retail & Data Sync Update) - DEBUGGED
    // Lead Architect: Gemini (SaaS Mode) for ST Imagix
    // ===================================================================================

    // --- Strictly Enforced Auto-Login & Cashier Bug Fix ---
    let loadedCashier = localStorage.getItem('currentCashier');
    try {
        // Attempt to parse, this will fix values like "\"Admin\""
        loadedCashier = JSON.parse(loadedCashier);
    } catch (e) { /* Not a JSON string, use as is */ }
    // Final cleanup if it's still weirdly formatted or null
    if (typeof loadedCashier !== 'string' || loadedCashier.trim() === '' || loadedCashier.includes('\"')) {
        loadedCashier = 'Admin';
    }
    localStorage.setItem('currentCashier', loadedCashier);

    // --- Global State & Centralized DOM Cache ---
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

    const dom = {
        // Forms & Inputs
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

        // Main Action Buttons
        addItemBtn: document.getElementById('add-item-btn'),
        scanBarcodeBtn: document.getElementById('scan-barcode-btn'),
        finalizeBtn: document.getElementById('finalize-btn'),
        printReceiptBtn: document.getElementById('print-receipt-btn'),
        holdBillBtn: document.getElementById('hold-bill-btn'),
        resumeBillsBtn: document.getElementById('resume-bills-btn'),

        // Previews & Indicators
        receiptPreview: document.getElementById('receipt-preview'),
        currentCashierSpan: document.getElementById('current-cashier'),
        offlineIndicator: document.getElementById('offline-indicator'),

        // All Modals
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

        // Modal Triggers
        openDashboardBtn: document.getElementById('open-dashboard-btn'),
        openLedgerBtn: document.getElementById('open-ledger-btn'),
        openCatalogBtn: document.getElementById('open-catalog-btn'),
        openSettingsBtn: document.getElementById('open-settings-btn'),
        dashboardExpenses: document.getElementById('dashboard-expenses'),

        // CSV & Data Buttons
        downloadSalesCsvBtn: document.getElementById('download-sales-csv-btn'),
        downloadDebtorsCsvBtn: document.getElementById('download-debtors-csv-btn'),
        closeRegisterBtn: document.getElementById('close-register-btn'),
        exportInventoryBtn: document.getElementById('export-inventory-btn'),
        importInventoryBtn: document.getElementById('import-inventory-btn'),
        importInventoryInput: document.getElementById('import-inventory-input'),
        
        // Settings Panel Elements
        uploadLogoBtn: document.getElementById('upload-logo-btn'),
        businessLogoUpload: document.getElementById('business-logo-upload'),
        receiptThemeSelect: document.getElementById('receipt-theme-select'),
        applyVat: document.getElementById('apply-vat'),
        applySscl: document.getElementById('apply-sscl'),
        addCashierForm: document.getElementById('add-cashier-form'),
        cashierNameInput: document.getElementById('cashier-name-input'),
        cashierList: document.getElementById('cashier-list'),
        backupDataBtn: document.getElementById('backup-data-btn'),
        restoreDataBtn: document.getElementById('restore-data-btn'),
        restoreDataInput: document.getElementById('restore-data-input'),
        clearDataBtn: document.getElementById('clear-data-btn'),
        addProductForm: document.getElementById('add-product-form'),
        productNameInput: document.getElementById('product-name-input'),
        productPriceInput: document.getElementById('product-price-input'),
        productStockInput: document.getElementById('product-stock-input'),
        productBarcodeIput: document.getElementById('product-barcode-input'),
        productList: document.getElementById('product-list'),
        creditLedgerList: document.getElementById('credit-ledger-list'),
        heldBillsList: document.getElementById('held-bills-list'),
        addExpenseForm: document.getElementById('add-expense-form'),
        expenseList: document.getElementById('expense-list')
    };

    // --- PRIMARY INITIALIZATION ---
    function initializeApp() {
        console.log("InstaBill LK v11 Initializing...");
        registerAllEventListeners();
        loadAndApplySettings();
        renderAllLists();
        updatePreviews(); // Initial render
        checkOnlineStatus();
        dom.receiptDate.valueAsDate = new Date();
        dom.currentCashierSpan.textContent = `Cashier: ${state.currentCashier}`;
        console.log("App Initialized Successfully. All systems nominal.");
    }

    // --- MASTER EVENT LISTENER REGISTRATION ---
    function registerAllEventListeners() {
        const liveUpdateEls = [dom.documentType, dom.businessName, dom.customerName, dom.customerPhone, dom.receiptDate, dom.discountType, dom.discountValue, dom.deliveryCharge, dom.advancePayment, dom.applyVat, dom.applySscl, dom.paymentLinkInput, dom.footerNotes];
        liveUpdateEls.forEach(el => el.addEventListener('input', updatePreviews));
        dom.itemsList.addEventListener('input', handleItemInput);
        dom.itemsList.addEventListener('click', handleItemClick);

        dom.addItemBtn.addEventListener('click', () => addItem());
        dom.finalizeBtn.addEventListener('click', finalizeAndSaveReceipt);
        dom.printReceiptBtn.addEventListener('click', printReceipt);
        dom.holdBillBtn.addEventListener('click', holdBill);
        dom.resumeBillsBtn.addEventListener('click', () => openModal(dom.modals.heldBills, renderHeldBills));
        
        dom.openDashboardBtn.addEventListener('click', () => openModal(dom.modals.salesDashboard, renderSalesDashboard));
        dom.openLedgerBtn.addEventListener('click', () => openModal(dom.modals.creditLedger, renderCreditLedger));
        dom.openCatalogBtn.addEventListener('click', () => openModal(dom.modals.productCatalog));
        dom.openSettingsBtn.addEventListener('click', () => openModal(dom.modals.settings));
        dom.scanBarcodeBtn.addEventListener('click', () => openModal(dom.modals.barcodeScanner, startBarcodeScanner));
        dom.dashboardExpenses.addEventListener('click', () => openModal(dom.modals.expenses, renderExpensesList));

        dom.downloadSalesCsvBtn.addEventListener('click', exportSalesToCsv);
        dom.downloadDebtorsCsvBtn.addEventListener('click', exportDebtorsToCsv);
        dom.closeRegisterBtn.addEventListener('click', closeRegister);
        dom.exportInventoryBtn.addEventListener('click', exportInventoryToCsv);
        dom.importInventoryBtn.addEventListener('click', () => dom.importInventoryInput.click());
        dom.importInventoryInput.addEventListener('change', importInventoryFromCsv);

        dom.uploadLogoBtn.addEventListener('click', () => dom.businessLogoUpload.click());
        dom.businessLogoUpload.addEventListener('change', handleLogoUpload);
        dom.receiptThemeSelect.addEventListener('change', e => applyReceiptTheme(e.target.value));
        dom.addCashierForm.addEventListener('submit', addCashier);
        dom.backupDataBtn.addEventListener('click', backupData);
        dom.restoreDataBtn.addEventListener('click', () => dom.restoreDataInput.click());
        dom.restoreDataInput.addEventListener('change', restoreData);
        dom.clearDataBtn.addEventListener('click', clearAllData);
        dom.addProductForm.addEventListener('submit', addProductToCatalog);
        dom.addExpenseForm.addEventListener('submit', addExpense);

        // Event delegation for dynamically created elements
        dom.productList.addEventListener('click', handleProductListActions);
        dom.creditLedgerList.addEventListener('click', handleLedgerActions);
        dom.heldBillsList.addEventListener('click', handleHeldBillActions);
        dom.cashierList.addEventListener('click', handleCashierListActions);
        
        // Universal modal closing
        Object.values(dom.modals).forEach(modal => {
            if (!modal) return;
            modal.addEventListener('click', (e) => {
                if (e.target.classList.contains('modal') || e.target.classList.contains('close-btn')) {
                    closeAllModals();
                }
            });
        });
    }

    // --- CORE UI & DATA FLOW ---
    function handleItemInput(e) {
        if (e.target.classList.contains('item-name')) {
            const product = state.productCatalog.find(p => p.name.toLowerCase() === e.target.value.toLowerCase());
            if (product) {
                const itemRow = e.target.closest('.item');
                itemRow.querySelector('.item-price').value = product.price;
            }
        }
        updatePreviews();
    }

    function handleItemClick(e) {
        if (e.target.classList.contains('remove-item-btn')) {
            e.target.closest('.item').remove();
            updatePreviews();
        }
    }

    function updatePreviews() {
        const data = getFormData();
        renderReceipt(data);
    }

    function getFormData() {
        const items = Array.from(dom.itemsList.querySelectorAll('.item')).map(item => ({
            name: item.querySelector('.item-name').value,
            qty: parseFloat(item.querySelector('.item-qty').value) || 0,
            price: parseFloat(item.querySelector('.item-price').value) || 0,
        }));
        return {
            documentType: dom.documentType.value,
            businessName: dom.businessName.value,
            logo: localStorage.getItem('businessLogo'),
            customerName: dom.customerName.value,
            customerPhone: dom.customerPhone.value,
            dateTime: new Date(), // V11 - Capture exact date and time
            cashier: state.currentCashier,
            items: items,
            discountValue: parseFloat(dom.discountValue.value) || 0,
            discountType: dom.discountType.value,
            deliveryCharge: parseFloat(dom.deliveryCharge.value) || 0,
            advancePayment: parseFloat(dom.advancePayment.value) || 0,
            applyVat: dom.applyVat.checked,
            applySscl: dom.applySscl.checked,
            paymentLink: dom.paymentLinkInput.value,
            footerNotes: dom.footerNotes.value
        };
    }

    function renderReceipt(data) {
        let itemsHtml = '';
        let subtotal = 0;
        data.items.forEach(item => {
            const total = item.qty * item.price;
            if (item.name && total > 0) {
                itemsHtml += `<tr><td>${item.name}</td><td>${item.qty}</td><td>${item.price.toFixed(2)}</td><td>${total.toFixed(2)}</td></tr>`;
                subtotal += total;
            }
        });

        const discount = data.discountType === 'percentage' ? subtotal * (data.discountValue / 100) : data.discountValue;
        const totalAfterDiscount = subtotal - discount;
        const vat = data.applyVat ? totalAfterDiscount * 0.18 : 0;
        const sscl = data.applySscl ? totalAfterDiscount * 0.025 : 0;
        const grandTotal = totalAfterDiscount + vat + sscl + data.deliveryCharge;
        const balanceDue = grandTotal - data.advancePayment;

        const logoEl = data.logo ? `<img id="logo-preview" src="${data.logo}" alt="Logo">` : '';
        const mainTitle = {
            'invoice': 'TAX INVOICE',
            'bill': 'BILL',
            'quotation': 'QUOTATION'
        }[data.documentType] || 'INVOICE';
        
        const footerNotesEl = data.footerNotes ? `<p class="receipt-footer-notes">${data.footerNotes}</p>` : '';
        const dateStr = data.dateTime.toLocaleDateString();
        const timeStr = data.dateTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }); // V11 - Time display

        dom.receiptPreview.innerHTML = `
            <div class="receipt-header">
                ${logoEl}
                <h2>${data.businessName || 'Your Business'}</h2>
                <h3>${mainTitle}</h3>
                <p>--------------------------------</p>
                <p><strong>Customer:</strong> ${data.customerName || 'N/A'}</p>
                <p><strong>Phone:</strong> ${data.customerPhone || 'N/A'}</p>
                <p><strong>Date:</strong> ${dateStr} | <strong>Time:</strong> ${timeStr}</p>
                <p><strong>Cashier:</strong> ${data.cashier}</p>
                <p>--------------------------------</p>
            </div>
            <div class="receipt-items"><table>
                <thead><tr><th>Item</th><th>Qty</th><th>Price</th><th>Total</th></tr></thead>
                <tbody>${itemsHtml}</tbody>
            </table></div>
            <p>--------------------------------</p>
            <div class="receipt-total">
                <p><strong>Subtotal:</strong> Rs. <span id="subtotal-amount">${subtotal.toFixed(2)}</span></p>
                <p><strong>Discount:</strong> Rs. <span id="discount-amount">-${discount.toFixed(2)}</span></p>
                <p style="display: ${data.applyVat ? 'block' : 'none'}"><strong>VAT (18%):</strong> Rs. <span id="vat-amount">${vat.toFixed(2)}</span></p>
                <p style="display: ${data.applySscl ? 'block' : 'none'}"><strong>SSCL (2.5%):</strong> Rs. <span id="sscl-amount">${sscl.toFixed(2)}</span></p>
                <p><strong>Delivery:</strong> Rs. <span id="delivery-amount">${data.deliveryCharge.toFixed(2)}</span></p>
                <p>--------------------------------</p>
                <p><strong>Grand Total:</strong> Rs. <span id="grand-total-amount">${grandTotal.toFixed(2)}</span></p>
                <p style="display: ${data.advancePayment > 0 ? 'block' : 'none'}"><strong>Advance Paid:</strong> Rs. <span id="advance-paid-amount">-${data.advancePayment.toFixed(2)}</span></p>
                <p><strong>Balance Due:</strong> Rs. <span id="balance-due-amount">${balanceDue.toFixed(2)}</span></p>
            </div>
            <div class="qr-code-container" id="qr-code-container"></div>
            ${footerNotesEl}
            <div class="receipt-branding" style="font-size: 11px; text-align: center; margin-top: 15px; border-top: 1px dashed #ccc; padding-top: 10px; color: #555; font-weight: bold;">Powered by ST Imagix <br> Developer: Samitha Tharanga | 071 012 2 520</div>
        `;

        const qrContainer = document.getElementById('qr-code-container');
        qrContainer.innerHTML = '';
        if (data.paymentLink) {
            state.qrCodeInstance = new QRCode(qrContainer, { text: data.paymentLink, width: 90, height: 90 });
        }
    }
    
    function addItem(product = {}) {
        const itemDiv = document.createElement('div');
        itemDiv.className = 'item';
        itemDiv.innerHTML = `
            <input type="text" class="item-name" placeholder="Item Name" list="product-datalist" value="${product.name || ''}">
            <input type="number" class="item-qty" placeholder="Qty" value="${product.qty || 1}" min="1">
            <input type="number" class="item-price" placeholder="Price" value="${product.price || ''}" min="0">
            <button type="button" class="remove-item-btn">×</button>
        `;
        dom.itemsList.appendChild(itemDiv);
        if(!product.name) itemDiv.querySelector('.item-name').focus();
        updatePreviews();
    }

    // --- ACTION HANDLERS ---
    function finalizeAndSaveReceipt() {
        const data = getFormData();
        // Convert date object to ISO string for storage
        const storableData = {...data, dateTime: data.dateTime.toISOString()};

        if (data.documentType === 'quotation') {
            showToast('Quotation generated. Use Print or Download.', false);
            html2canvas(dom.receiptPreview, {scale: 2.5}).then(canvas => {
                const link = document.createElement('a');
                link.download = `quotation-${data.customerName.replace(/\s+/g, '_')}-${Date.now()}.png`;
                link.href = canvas.toDataURL();
                link.click();
            });
            return; 
        }

        if (!data.customerName) { return showToast('Customer name is required for invoices!', true); }
        if (data.items.length === 0 || data.items.every(i => !i.name)) { return showToast('Cannot save an empty bill!', true); }
        const grandTotal = parseFloat(document.getElementById('grand-total-amount').textContent);

        let customer = state.customers.find(c => c.name === data.customerName);
        if (!customer) {
            customer = { name: data.customerName, phone: data.customerPhone, debt: 0, loyalty: 0 };
            state.customers.push(customer);
        } else {
            customer.phone = data.customerPhone;
        }

        const balanceDue = parseFloat(document.getElementById('balance-due-amount').textContent);
        if (dom.paymentStatus.value === 'credit') {
            customer.debt = (customer.debt || 0) + balanceDue;
            showToast(`Added Rs. ${balanceDue.toFixed(2)} to ${customer.name}'s credit.`);
        } else {
            customer.loyalty = (customer.loyalty || 0) + Math.floor(grandTotal / 100);
        }

        state.salesHistory.push({ ...storableData, total: grandTotal, balanceDue: balanceDue, id: Date.now(), status: dom.paymentStatus.value });
        saveStateAndRerender();
        showToast('Invoice Finalized & Saved!', false);
        html2canvas(dom.receiptPreview, {scale: 2.5}).then(canvas => {
            const link = document.createElement('a');
            link.download = `invoice-${data.customerName.replace(/\s+/g, '_')}-${Date.now()}.png`;
            link.href = canvas.toDataURL();
            link.click();
        });
        resetForm();
    }

    function printReceipt() {
        const printWindow = window.open('', '_blank');
        printWindow.document.write('<html><head><title>Print Receipt</title><link rel="stylesheet" href="style.css"></head><body>');
        printWindow.document.write('<div class="receipt-section">' + dom.receiptPreview.innerHTML + '</div>');
        printWindow.document.write('</body></html>');
        printWindow.document.close();
        printWindow.onload = function() { 
            printWindow.focus();
            printWindow.print();
            printWindow.close();
        };
    }

    function holdBill() {
        const data = getFormData();
        if (data.items.length === 0 || data.items.every(i => !i.name)) {
            return showToast('Cannot hold an empty bill.', true);
        }
        data.holdId = `hold-${Date.now()}`;
        state.heldBills.push({...data, dateTime: data.dateTime.toISOString()});
        saveStateAndRerender();
        showToast(`Bill for ${data.customerName || 'customer'} has been held.`);
        resetForm();
    }

    function resumeBill(holdId) {
        const billIndex = state.heldBills.findIndex(b => b.holdId === holdId);
        if (billIndex === -1) return;
        const bill = state.heldBills[billIndex];
        resetForm(); 
        dom.documentType.value = bill.documentType || 'invoice';
        dom.customerName.value = bill.customerName;
        dom.customerPhone.value = bill.customerPhone;
        dom.discountValue.value = bill.discountValue;
        dom.discountType.value = bill.discountType;
        dom.deliveryCharge.value = bill.deliveryCharge;
        dom.advancePayment.value = bill.advancePayment || '';
        dom.receiptDate.value = bill.dateTime.slice(0, 10);
        bill.items.forEach(item => addItem(item));
        state.heldBills.splice(billIndex, 1);
        saveStateAndRerender();
        closeAllModals();
        updatePreviews();
    }

    // --- CSV & DATA EXPORT/IMPORT ---
    function exportSalesToCsv() {
        const today = new Date().toISOString().slice(0, 10);
        const salesToExport = state.salesHistory.filter(sale => sale.dateTime.startsWith(today) && sale.documentType !== 'quotation');
        if (salesToExport.length === 0) { return showToast('No sales today to export.', true); }
        const headers = ['Receipt ID', 'Date', 'Time', 'Customer', 'Total', 'Status', 'Cashier'];
        const rows = salesToExport.map(s => {
            const d = new Date(s.dateTime);
            const time = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            return [s.id, d.toLocaleDateString(), time, `"${s.customerName}"`, s.total.toFixed(2), s.status, s.cashier].join(',');
        });
        downloadCsv([headers.join(','), ...rows].join('\n'), `daily_sales_${today}.csv`);
    }

    function exportDebtorsToCsv() {
        const debtors = state.customers.filter(c => c.debt && c.debt > 0);
        if (debtors.length === 0) { return showToast('No debtors to export.', true); }
        const headers = ['Customer Name', 'Phone', 'Outstanding Debt'];
        const rows = debtors.map(d => [`"${d.name}"`, d.phone || 'N/A', d.debt.toFixed(2)].join(','));
        downloadCsv([headers.join(','), ...rows].join('\n'), 'debtors_list.csv');
    }

    function exportInventoryToCsv() {
        if (state.productCatalog.length === 0) { return showToast('Inventory is empty.', true); }
        const headers = ['Name', 'Price', 'Stock', 'Barcode'];
        const rows = state.productCatalog.map(p => {
            const safeName = '"' + p.name.replace(/"/g, '""') + '"';
            return [safeName, p.price, p.stock || 0, p.barcode || ''].join(',');
        });
        downloadCsv([headers.join(','), ...rows].join('\n'), 'inventory_export.csv');
        showToast('Inventory exported.');
    }

    function importInventoryFromCsv(event) {
        const file = event.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = e => {
            const text = e.target.result;
            const rows = text.split('\n').slice(1); // Skip header row
            let updatedCount = 0, newCount = 0;
            const productMap = new Map(state.productCatalog.map(p => [p.name.toLowerCase(), p]));

            rows.forEach(row => {
                if (row.trim() === '') return;
                const [name, price, stock, barcode] = row.split(',').map(v => v.trim().replace(/^"|"$/g, ''));
                if (!name || isNaN(parseFloat(price))) {
                    console.warn('Skipping invalid CSV row:', row);
                    return;
                }

                const product = {
                    name: name,
                    price: parseFloat(price),
                    stock: parseInt(stock) || 0,
                    barcode: barcode || ''
                };

                if (productMap.has(name.toLowerCase())) {
                    Object.assign(productMap.get(name.toLowerCase()), product);
                    updatedCount++;
                } else {
                    productMap.set(name.toLowerCase(), product);
                    newCount++;
                }
            });

            state.productCatalog = Array.from(productMap.values());
            saveStateAndRerender();
            showToast(`Inventory Imported: ${newCount} new, ${updatedCount} updated.`);
        };
        reader.readAsText(file);
        event.target.value = ''; // Reset file input
    }

    function closeRegister() {
        if (!confirm('Are you sure you want to close the register? This will export today\'s summary and offer a final data backup.')) return;
        const today = new Date().toISOString().slice(0, 10);
        const todaysSales = state.salesHistory.filter(s => s.dateTime.startsWith(today) && s.documentType !== 'quotation');
        if (todaysSales.length === 0) {
            return showToast('No sales recorded today. Nothing to close.', true);
        }

        // 1. Export daily summary
        exportSalesToCsv();
        showToast('Daily summary has been exported.', false);

        // 2. Offer full data backup
        setTimeout(() => {
             if (confirm('Do you want to download a complete backup of all application data?')) {
                backupData();
            }
        }, 1000); // Delay to ensure first toast is seen
    }

    function downloadCsv(content, fileName) {
        const blob = new Blob(["\uFEFF" + content], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.setAttribute('download', fileName);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    // --- MODAL & DYNAMIC CLICK HANDLING ---
    function openModal(modal, onOpen) {
        if (!modal) return console.error("Attempted to open a null modal.");
        closeAllModals();
        modal.style.display = 'block';
        if (onOpen) onOpen();
    }

    function closeAllModals() {
        Object.values(dom.modals).forEach(modal => {
            if(modal) modal.style.display = 'none';
        });
        if (state.html5QrCode && state.html5QrCode.isScanning) {
            state.html5QrCode.stop().catch(err => console.error("Error stopping barcode scanner:", err));
        }
    }

    // --- RENDER FUNCTIONS FOR LISTS ---
    function renderAllLists() {
        renderProductCatalog();
        renderCustomerDatalist();
        renderCashiers();
    }

    function renderProductCatalog() {
        dom.productDatalist.innerHTML = state.productCatalog.map(p => `<option value="${p.name}"></option>`).join('');
        if (state.productCatalog.length === 0) {
            dom.productList.innerHTML = '<p>No products in inventory. Add one above or import a CSV file.</p>';
            return;
        }
        dom.productList.innerHTML = `<table>
            <thead><tr><th>Name</th><th>Price</th><th>Stock</th><th>Barcode</th><th>Actions</th></tr></thead>
            <tbody>${state.productCatalog.map(p => `
                <tr>
                    <td>${p.name}</td>
                    <td>Rs. ${p.price.toFixed(2)}</td>
                    <td>${p.stock || 0}</td>
                    <td>${p.barcode || 'N/A'}</td>
                    <td><button data-action="delete-product" data-name="${p.name}">X</button></td>
                </tr>
            `).join('')}</tbody>
        </table>`;
    }

    function renderCustomerDatalist() {
        dom.customersDatalist.innerHTML = state.customers.map(c => `<option value="${c.name}"></option>`).join('');
    }
    
    function renderCreditLedger() {
        const debtors = state.customers.filter(c => c.debt && c.debt > 0);
        if (debtors.length === 0) {
            dom.creditLedgerList.innerHTML = '<p>No outstanding debts. Everyone is settled up!</p>';
            return;
        }
        dom.creditLedgerList.innerHTML = `<table>
            <thead><tr><th>Customer</th><th>Phone</th><th>Outstanding Debt</th><th>Actions</th></tr></thead>
            <tbody>${debtors.map(c => `
                <tr>
                    <td>${c.name}</td>
                    <td>${c.phone || 'N/A'}</td>
                    <td>Rs. ${c.debt.toFixed(2)}</td>
                    <td class="ledger-actions">
                        <button class="settle-btn" data-action="settle-debt" data-name="${c.name}">✅ Settle</button>
                        <button class="remind-btn" data-action="remind-debt" data-name="${c.name}">💬 WhatsApp</button>
                    </td>
                </tr>`).join('')}</tbody>
        </table>`;
    }
    
    function renderHeldBills() {
        if (state.heldBills.length === 0) {
            dom.heldBillsList.innerHTML = '<p>No bills are currently on hold.</p>';
            return;
        }
        dom.heldBillsList.innerHTML = state.heldBills.map(bill => `
            <div class="held-bill-item">
                <span>${bill.customerName || 'N/A'} - ${bill.items.length} items</span>
                <button data-action="resume-bill" data-id="${bill.holdId}">Resume</button>
            </div>`).join('');
    }

    // --- DYNAMIC ACTION HANDLERS (EVENT DELEGATION) ---
    function handleProductListActions(e) {
        if (e.target.dataset.action === 'delete-product') {
            if (confirm(`Are you sure you want to delete ${e.target.dataset.name}?`)) {
                state.productCatalog = state.productCatalog.filter(p => p.name !== e.target.dataset.name);
                saveStateAndRerender();
            }
        }
    }

    function handleLedgerActions(e) {
        const action = e.target.dataset.action;
        const name = e.target.dataset.name;
        if (!action || !name) return;
        const customer = state.customers.find(c => c.name === name);
        if (!customer) return;

        if (action === 'settle-debt') {
            customer.debt = 0;
            showToast(`${name}'s debt has been settled.`);
            saveStateAndRerender();
            renderCreditLedger();
        }
        if (action === 'remind-debt') {
            if (!customer.phone) return showToast('No phone number for this customer.', true);
            const message = `ආයුබෝවන් ${name}, මෙය සුහද සිහිකැඳවීමකි. ඔබ අප ආයතනයට ගෙවීමට ඇති හිඟ මුදල රු. ${customer.debt.toFixed(2)} කි. කරුණාකර එය හැකි ඉක්මනින් පියවන්න. ස්තූතියි! - ${dom.businessName.value || 'InstaBill LK'}`;
            window.open(`https://wa.me/${customer.phone}?text=${encodeURIComponent(message)}`, '_blank');
        }
    }

    function handleHeldBillActions(e) {
        if (e.target.dataset.action === 'resume-bill') {
            resumeBill(e.target.dataset.id);
        }
    }
    
    function handleCashierListActions(e) {
        if (e.target.dataset.action === 'delete-cashier') {
            const cashierName = e.target.dataset.name;
            if (cashierName === 'Admin') {
                return showToast('Cannot delete the Admin user.', true);
            }
            if (confirm(`Are you sure you want to delete the cashier "${cashierName}"?`)) {
                state.cashiers = state.cashiers.filter(c => c !== cashierName);
                saveStateAndRerender();
                showToast(`Cashier '${cashierName}' deleted.`);
            }
        }
    }

    // --- HELPER & SETTINGS FUNCTIONS ---
    function saveStateAndRerender() {
        Object.keys(state).forEach(key => {
            if (typeof state[key] !== 'function' && !key.endsWith('Instance') && !key.endsWith('QrCode')) {
                localStorage.setItem(key, JSON.stringify(state[key]));
            }
        });
        localStorage.setItem('businessName', dom.businessName.value);
        localStorage.setItem('applyVat', dom.applyVat.checked);
        localStorage.setItem('applySscl', dom.applySscl.checked);
        localStorage.setItem('paymentLink', dom.paymentLinkInput.value);
        localStorage.setItem('footerNotes', dom.footerNotes.value);

        renderAllLists();
    }

    function loadAndApplySettings() {
        dom.businessName.value = localStorage.getItem('businessName') || 'ST Imagix';
        dom.applyVat.checked = JSON.parse(localStorage.getItem('applyVat')) || false;
        dom.applySscl.checked = JSON.parse(localStorage.getItem('applySscl')) || false;
        dom.paymentLinkInput.value = localStorage.getItem('paymentLink') || '';
        dom.footerNotes.value = localStorage.getItem('footerNotes') || 'Goods once sold will not be taken back.';
        const theme = localStorage.getItem('receiptTheme') || 'theme-classic';
        dom.receiptThemeSelect.value = theme;
        applyReceiptTheme(theme);
    }

    function applyReceiptTheme(theme) {
        dom.receiptPreview.className = 'receipt-preview ' + theme;
        localStorage.setItem('receiptTheme', theme);
    }

    function addProductToCatalog(e) {
        e.preventDefault();
        const name = dom.productNameInput.value.trim();
        const price = parseFloat(dom.productPriceInput.value);
        if (!name || isNaN(price)) return showToast('Product name and price are required.', true);
        const existing = state.productCatalog.find(p => p.name.toLowerCase() === name.toLowerCase());
        if (existing) {
            existing.price = price;
            showToast(`Product '${name}' updated.`);
        } else {
            state.productCatalog.push({ name, price, stock: dom.productStockInput.value || 0, barcode: dom.productBarcodeIput.value || '' });
            showToast(`Product '${name}' added.`);
        }
        saveStateAndRerender();
        dom.addProductForm.reset();
    }

    function addCashier(e) {
        e.preventDefault();
        const name = dom.cashierNameInput.value.trim();
        if (!name) return;
        if (!state.cashiers.includes(name)) {
            state.cashiers.push(name);
            saveStateAndRerender();
            showToast(`Cashier '${name}' added.`);
            dom.addCashierForm.reset();
        } else {
            showToast(`Cashier '${name}' already exists.`, true);
        }
    }

    function addExpense(e) {
        e.preventDefault();
        const descInput = document.getElementById('expense-desc-input');
        const amountInput = document.getElementById('expense-amount-input');
        const description = descInput.value.trim();
        const amount = parseFloat(amountInput.value);
        if (!description || isNaN(amount) || amount <= 0) {
            return showToast('Please enter a valid description and amount.', true);
        }
        state.expenses.push({ id: `exp-${Date.now()}`, date: new Date().toISOString().slice(0, 10), description, amount });
        saveStateAndRerender();
        showToast('Expense added successfully.');
        descInput.value = '';
        amountInput.value = '';
        renderExpensesList();
    }
    
    function handleLogoUpload(event) {
        const file = event.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (e) => {
            localStorage.setItem('businessLogo', e.target.result);
            updatePreviews();
        };
        reader.readAsDataURL(file);
    }
    
    function clearAllData() {
        if (confirm('DANGER! Are you sure you want to delete ALL data? This cannot be undone.')) {
            if (prompt('To confirm, type \'DELETE ALL\'') === 'DELETE ALL') {
                localStorage.clear();
                window.location.reload();
            }
        }
    }

    function backupData() {
        const backupState = { ...state };
        delete backupState.qrCodeInstance;
        delete backupState.salesChart;
        delete backupState.html5QrCode;
        const blob = new Blob([JSON.stringify(backupState)], { type: 'application/json' });
        const fileName = `instabill_backup_${new Date().toISOString().slice(0, 10)}.json`;
        downloadUrl(URL.createObjectURL(blob), fileName);
        showToast('Backup downloaded.');
    }

    function downloadUrl(url, fileName) {
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        URL.revokeObjectURL(url);
        document.body.removeChild(a);
    }

    function restoreData(event) {
        const file = event.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                if(!confirm('Restoring will overwrite current data. Proceed?')) return;
                const restoredData = JSON.parse(e.target.result);
                Object.keys(restoredData).forEach(key => {
                    if(state.hasOwnProperty(key)) {
                        state[key] = restoredData[key];
                    }
                });
                saveStateAndRerender();
                loadAndApplySettings();
                updatePreviews();
                showToast('Data restored successfully! The page will now reload.');
                setTimeout(() => window.location.reload(), 1500);
            } catch (err) {
                showToast('Invalid or corrupt backup file.', true);
                console.error("Restore failed:", err);
            }
        };
        reader.readAsText(file);
    }

    function resetForm() {
        dom.customerName.value = '';
        dom.customerPhone.value = '';
        dom.itemsList.innerHTML = '';
        dom.discountValue.value = '';
        dom.deliveryCharge.value = '';
        dom.advancePayment.value = '';
        dom.paymentStatus.value = 'paid';
        dom.documentType.value = 'invoice';
        dom.receiptDate.valueAsDate = new Date(); // Reset date to today
        updatePreviews();
    }

    function showToast(message, isError = false) {
        const toast = document.getElementById('toast');
        toast.textContent = message;
        toast.style.backgroundColor = isError ? 'var(--danger-color)' : 'var(--success-color)';
        toast.className = 'show';
        setTimeout(() => { toast.className = toast.className.replace('show', ''); }, 3000);
    }

    function checkOnlineStatus() {
        function updateStatus() {
            dom.offlineIndicator.style.backgroundColor = navigator.onLine ? 'var(--success-color)' : 'var(--danger-color)';
        }
        window.addEventListener('online', updateStatus);
        window.addEventListener('offline', updateStatus);
        updateStatus();
    }

    function startBarcodeScanner() {
        if (!state.html5QrCode) {
            state.html5QrCode = new Html5Qrcode("barcode-scanner");
        }
        state.html5QrCode.start(
            { facingMode: "environment" }, 
            { fps: 10, qrbox: { width: 250, height: 250 } }, 
            (decodedText, decodedResult) => {
                const product = state.productCatalog.find(p => p.barcode === decodedText);
                if (product) {
                    addItem(product);

                    showToast(`Added ${product.name} from barcode.`);
                } else {
                    showToast('Product not found for this barcode.', true);
                }
                closeAllModals();
            },
            (errorMessage) => {}
        ).catch(err => {
            showToast("Failed to start barcode scanner. Ensure camera permissions are enabled.", true);
            console.error("Scanner start error:", err);
        });
    }
    
    // --- DASHBOARD & REPORTING ---
    function renderSalesDashboard() {
        const today = new Date().toISOString().slice(0, 10);
        
        const todaysSales = state.salesHistory.filter(s => s.dateTime.startsWith(today) && s.status === 'paid' && s.documentType !== 'quotation');
        const todaysExpenses = state.expenses.filter(exp => exp.date === today);
        
        const totalSales = todaysSales.reduce((acc, sale) => acc + sale.total, 0);
        const totalExpenses = todaysExpenses.reduce((acc, exp) => acc + exp.amount, 0);
        const netProfit = totalSales - totalExpenses;

        document.getElementById('total-sales').textContent = `Rs. ${totalSales.toFixed(2)}`;
        document.getElementById('total-expenses').textContent = `Rs. ${totalExpenses.toFixed(2)}`;
        document.getElementById('net-profit').textContent = `Rs. ${netProfit.toFixed(2)}`;

        const salesByDay = {};
        for (let i = 6; i >= 0; i--) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            salesByDay[d.toISOString().slice(0, 10)] = 0;
        }

        state.salesHistory.forEach(sale => {
            const saleDate = sale.dateTime.slice(0,10);
            if (salesByDay.hasOwnProperty(saleDate) && sale.status === 'paid' && sale.documentType !== 'quotation') {
                salesByDay[saleDate] += sale.total;
            }
        });

        const chartLabels = Object.keys(salesByDay);
        const chartData = Object.values(salesByDay);

        const ctx = document.getElementById('sales-chart').getContext('2d');
        if (state.salesChart) state.salesChart.destroy();
        state.salesChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: chartLabels.map(label => new Date(label).toLocaleDateString('en-US', { day: 'numeric', month: 'short'})),
                datasets: [{
                    label: 'Daily Sales',
                    data: chartData,
                    backgroundColor: 'rgba(0, 123, 255, 0.7)',
                    borderColor: 'rgba(0, 123, 255, 1)',
                    borderWidth: 1,
                    borderRadius: 4
                }]
            },
            options: { responsive: true, maintainAspectRatio: false, scales: { y: { beginAtZero: true }, x: {} }, plugins: { legend: { display: false } } }
        });

        const salesHistoryList = document.getElementById('sales-history-list');
        const recentSales = [...state.salesHistory].filter(s => s.documentType !== 'quotation').reverse().slice(0, 20);
        if (recentSales.length === 0) {
            salesHistoryList.innerHTML = '<p>No recent transactions.</p>';
            return;
        }
        salesHistoryList.innerHTML = `<table>
            <thead><tr><th>Customer</th><th>Total</th><th>Status</th><th>Cashier</th></tr></thead>
            <tbody>${recentSales.map(s => `
                <tr>
                    <td>${s.customerName}</td>
                    <td>Rs. ${s.total.toFixed(2)}</td>
                    <td><span class="status-${s.status}">${s.status}</span></td>
                    <td>${s.cashier}</td>
                </tr>
            `).join('')}</tbody>
        </table>`;
    }

    function renderCashiers() {
        dom.cashierList.innerHTML = state.cashiers.map(cashier => `
            <div class="cashier-item">
                <span>${cashier}</span>
                ${cashier !== 'Admin' ? `<button data-action="delete-cashier" data-name="${cashier}">×</button>` : ''}
            </div>
        `).join('');

        const cashierFilterEl = document.getElementById('cashier-filter');
        if (cashierFilterEl) {
            const currentSelection = cashierFilterEl.value;
            cashierFilterEl.innerHTML = '<option value="all">All Cashiers</option>' + 
                state.cashiers.map(cashier => `<option value="${cashier}">${cashier}</option>`).join('');
            cashierFilterEl.value = currentSelection;
        }
    }

    function renderExpensesList(){
        if (!dom.expenseList) return;
        dom.expenseList.innerHTML = state.expenses.map(exp => `<div><span>${exp.date}: ${exp.description} - Rs.${exp.amount.toFixed(2)}</span></div>`).join('');
    }

    // --- START THE APPLICATION ---
    initializeApp();
});
