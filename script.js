document.addEventListener('DOMContentLoaded', () => {
    // ===================================================================================
    // InstaBill LK v12.0 - FINAL PRODUCTION BUILD (HTML-Matched)
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
        discountType: document.getElementById('discount-type'),
        discountValue: document.getElementById('discount-value'),
        deliveryCharge: document.getElementById('delivery-charge'),
        advancePayment: document.getElementById('advance-payment'),
        paymentStatus: document.getElementById('payment-status'),
        documentType: document.getElementById('document-type'),
        receiptDate: document.getElementById('receipt-date'),
        toast: document.getElementById('toast'),
        modals: {
            dashboard: document.getElementById('sales-dashboard-modal'),
            ledger: document.getElementById('credit-ledger-modal'),
            catalog: document.getElementById('product-catalog-modal'),
            settings: document.getElementById('settings-modal'),
            zReport: document.getElementById('z-report-modal'),
            expenses: document.getElementById('expenses-modal'),
            heldBills: document.getElementById('held-bills-modal'),
            barcodeScanner: document.getElementById('barcode-scanner-modal')
        }
    };

    // --- Primary Initialization ---
    function init() {
        setDefaultDate();
        registerAllEvents();
        populateCustomerDatalist();
        populateProductDatalist();
        renderProductList();
        renderCreditLedger();
        renderCashierList();
        renderSalesDashboard();
        loadSettings();
        updateCurrentCashierDisplay();
        updateReceipt();
    }

    function setDefaultDate() {
        if (dom.receiptDate) {
            dom.receiptDate.value = new Date().toISOString().slice(0, 10);
        }
    }

    function updateCurrentCashierDisplay() {
        const el = document.getElementById('current-cashier');
        if (el) el.textContent = '👤 ' + state.currentCashier;
    }

    function registerAllEvents() {
        // Core Buttons
        document.getElementById('add-item-btn').onclick = () => addItem();
        document.getElementById('finalize-btn').onclick = finalizeAndSave;
        document.getElementById('hold-bill-btn').onclick = holdBill;
        document.getElementById('resume-bills-btn').onclick = () => openModal(dom.modals.heldBills, renderHeldBills);
        document.getElementById('print-receipt-btn').onclick = printReceipt;

        // Barcode Scanner
        const scanBtn = document.getElementById('scan-barcode-btn');
        if (scanBtn) scanBtn.onclick = () => openModal(dom.modals.barcodeScanner, initBarcodeScanner);

        // Navigation Modals
        document.getElementById('open-dashboard-btn').onclick = () => openModal(dom.modals.dashboard, renderSalesDashboard);
        document.getElementById('open-ledger-btn').onclick = () => openModal(dom.modals.ledger, renderCreditLedger);
        document.getElementById('open-catalog-btn').onclick = () => openModal(dom.modals.catalog, renderProductList);
        document.getElementById('open-settings-btn').onclick = () => openModal(dom.modals.settings, renderCashierList);

        // Dashboard Buttons
        document.getElementById('z-report-btn').onclick = generateZReport;
        document.getElementById('download-sales-csv-btn').onclick = exportSalesCSV;
        const closeRegBtn = document.getElementById('close-register-btn');
        if (closeRegBtn) closeRegBtn.onclick = closeRegisterAndExport;
        const cashierFilter = document.getElementById('cashier-filter');
        if (cashierFilter) cashierFilter.onchange = renderSalesDashboard;

        // Z-Report Print
        const printZBtn = document.getElementById('print-z-report-btn');
        if (printZBtn) printZBtn.onclick = () => window.print();

        // Credit Ledger CSV
        const debtorsCSVBtn = document.getElementById('download-debtors-csv-btn');
        if (debtorsCSVBtn) debtorsCSVBtn.onclick = exportDebtorsCSV;

        // Settings Actions
        document.getElementById('upload-logo-btn').onclick = () => document.getElementById('business-logo-upload').click();
        document.getElementById('business-logo-upload').onchange = handleLogoUpload;
        document.getElementById('backup-data-btn').onclick = backupData;
        document.getElementById('restore-data-btn').onclick = () => document.getElementById('restore-data-input').click();
        document.getElementById('restore-data-input').onchange = restoreData;
        document.getElementById('clear-data-btn').onclick = clearAllData;

        // Receipt Theme Select
        const themeSelect = document.getElementById('receipt-theme-select');
        if (themeSelect) themeSelect.onchange = (e) => {
            dom.receiptPreview.className = e.target.value;
            localStorage.setItem('receiptTheme', e.target.value);
        };

        // VAT / SSCL toggles
        const vatCheck = document.getElementById('apply-vat');
        const ssclCheck = document.getElementById('apply-sscl');
        if (vatCheck) vatCheck.onchange = updateReceipt;
        if (ssclCheck) ssclCheck.onchange = updateReceipt;

        // Footer notes & payment link
        const footerNotes = document.getElementById('footer-notes');
        if (footerNotes) footerNotes.oninput = updateReceipt;
        const paymentLink = document.getElementById('payment-link-input');
        if (paymentLink) paymentLink.oninput = generateQRCode;

        // Inventory Form
        document.getElementById('add-product-form').onsubmit = handleAddProduct;
        const exportInvBtn = document.getElementById('export-inventory-btn');
        if (exportInvBtn) exportInvBtn.onclick = exportInventoryCSV;
        const importInvBtn = document.getElementById('import-inventory-btn');
        const importInvInput = document.getElementById('import-inventory-input');
        if (importInvBtn && importInvInput) {
            importInvBtn.onclick = () => importInvInput.click();
            importInvInput.onchange = importInventoryCSV;
        }

        // Cashier Management
        const addCashierForm = document.getElementById('add-cashier-form');
        if (addCashierForm) addCashierForm.onsubmit = handleAddCashier;

        // Expense Form
        const expenseForm = document.getElementById('add-expense-form');
        if (expenseForm) expenseForm.onsubmit = handleAddExpense;

        // Close Modals
        document.querySelectorAll('.close-btn').forEach(btn => {
            btn.onclick = () => Object.values(dom.modals).forEach(m => { if (m) m.style.display = 'none'; });
        });

        // Click outside modal to close
        window.onclick = (e) => {
            Object.values(dom.modals).forEach(m => {
                if (m && e.target === m) m.style.display = 'none';
            });
        };

        // Auto Updates on real-time fields
        const realTimeFields = [
            dom.businessName, dom.customerName, dom.customerPhone,
            dom.discountValue, dom.discountType, dom.deliveryCharge,
            dom.advancePayment, dom.documentType, dom.receiptDate
        ];
        realTimeFields.forEach(field => field?.addEventListener('input', updateReceipt));
    }

    // --- Core Functions ---
    function addItem(prod = {}) {
        const div = document.createElement('div');
        div.className = 'item bill-item-row';
        div.innerHTML = `
            <input type="text" class="in-name item-name" placeholder="Item Name" value="${prod.name || ''}" list="product-datalist" autocomplete="off">
            <input type="number" class="in-qty item-qty" placeholder="Qty" value="${prod.qty || 1}" min="1">
            <input type="number" class="in-price item-price" placeholder="Price (Rs.)" value="${prod.price || ''}" min="0" step="0.01">
            <button class="rm-btn remove-item-btn" title="Remove item">×</button>
        `;
        dom.itemsList.appendChild(div);

        // Auto-fill price from catalog when name is chosen
        const nameInput = div.querySelector('.in-name');
        const priceInput = div.querySelector('.in-price');
        nameInput.addEventListener('change', () => {
            const match = state.productCatalog.find(p => p.name.toLowerCase() === nameInput.value.toLowerCase());
            if (match && !priceInput.value) priceInput.value = match.price;
            updateReceipt();
        });

        div.querySelectorAll('input').forEach(i => i.oninput = updateReceipt);
        div.querySelector('.rm-btn').onclick = () => { div.remove(); updateReceipt(); };
        nameInput.focus();
        updateReceipt();
    }

    function updateReceipt() {
        const data = getItemsData();
        let subtotal = 0;

        let itemsHtml = data.map(i => {
            const total = i.qty * i.price;
            subtotal += total;
            return `<tr>
                <td>${i.name || 'Item'}</td>
                <td align="right">${i.qty}</td>
                <td align="right">Rs. ${i.price.toFixed(2)}</td>
                <td align="right">Rs. ${total.toFixed(2)}</td>
            </tr>`;
        }).join('');

        const discountRaw = parseFloat(dom.discountValue?.value) || 0;
        const discountType = dom.discountType?.value || 'flat';
        const discount = discountType === 'percentage' ? (subtotal * discountRaw / 100) : discountRaw;
        const delivery = parseFloat(dom.deliveryCharge?.value) || 0;
        const advance = parseFloat(dom.advancePayment?.value) || 0;

        const vatEnabled = document.getElementById('apply-vat')?.checked;
        const ssclEnabled = document.getElementById('apply-sscl')?.checked;
        const afterDiscount = subtotal - discount + delivery;
        const vat = vatEnabled ? afterDiscount * 0.18 : 0;
        const sscl = ssclEnabled ? afterDiscount * 0.025 : 0;
        const total = afterDiscount + vat + sscl;
        const balance = total - advance;

        const logo = localStorage.getItem('businessLogo');
        const logoHtml = logo ? `<img src="${logo}" style="max-height:70px; margin-bottom:10px; display:block; margin-left:auto; margin-right:auto;">` : '';
        const footerNotes = document.getElementById('footer-notes')?.value || '';
        const dateVal = dom.receiptDate?.value || new Date().toLocaleDateString();
        const docType = dom.documentType?.value || 'Invoice';

        dom.receiptPreview.innerHTML = `
            <div class="receipt-header" style="text-align:center;">
                ${logoHtml}
                <h2 style="margin:0; font-size:1.3em;">${dom.businessName?.value || 'ST Imagix'}</h2>
                <p style="text-transform:uppercase; font-weight:bold; margin:4px 0; letter-spacing:2px;">${docType}</p>
                <hr style="border:1px dashed #ccc;">
                <table width="100%" style="font-size:12px;">
                    <tr>
                        <td align="left">Customer: <strong>${dom.customerName?.value || 'N/A'}</strong></td>
                        <td align="right">Date: ${dateVal}</td>
                    </tr>
                    ${dom.customerPhone?.value ? `<tr><td colspan="2">Phone: ${dom.customerPhone.value}</td></tr>` : ''}
                </table>
            </div>
            <table width="100%" style="font-size:12px; border-collapse:collapse; margin-top:10px;">
                <thead>
                    <tr style="border-bottom:1px solid #333;">
                        <th align="left">Item</th>
                        <th align="right">Qty</th>
                        <th align="right">Price</th>
                        <th align="right">Total</th>
                    </tr>
                </thead>
                <tbody>${itemsHtml}</tbody>
            </table>
            <hr style="border:1px dashed #ccc;">
            <div align="right" style="font-size:13px;">
                <p>Subtotal: Rs. ${subtotal.toFixed(2)}</p>
                ${discount > 0 ? `<p>Discount: -Rs. ${discount.toFixed(2)}</p>` : ''}
                ${delivery > 0 ? `<p>Delivery: +Rs. ${delivery.toFixed(2)}</p>` : ''}
                ${vat > 0 ? `<p>VAT (18%): +Rs. ${vat.toFixed(2)}</p>` : ''}
                ${sscl > 0 ? `<p>SSCL (2.5%): +Rs. ${sscl.toFixed(2)}</p>` : ''}
                <p><strong style="font-size:1.1em;">Grand Total: Rs. <span id="final-tot-val">${total.toFixed(2)}</span></strong></p>
                ${advance > 0 ? `<p>Advance Paid: -Rs. ${advance.toFixed(2)}</p>` : ''}
                <p>Balance Due: Rs. ${balance.toFixed(2)}</p>
            </div>
            ${footerNotes ? `<div class="receipt-footer-notes"><hr style="border:1px dashed #ccc;">${footerNotes}</div>` : ''}
            <div id="qr-code-container" class="qr-code-container"></div>
            <div class="receipt-branding">Software by ST Imagix | 071 012 2 520</div>
        `;

        generateQRCode();
    }

    function generateQRCode() {
        const container = document.getElementById('qr-code-container');
        if (!container) return;
        const link = document.getElementById('payment-link-input')?.value;
        container.innerHTML = '';
        if (link && link.trim()) {
            try {
                new QRCode(container, { text: link.trim(), width: 80, height: 80 });
            } catch (e) { /* QRCode library may not be loaded */ }
        }
    }

    function getItemsData() {
        return Array.from(document.querySelectorAll('.bill-item-row')).map(row => ({
            name: row.querySelector('.in-name').value.trim(),
            qty: parseFloat(row.querySelector('.in-qty').value) || 0,
            price: parseFloat(row.querySelector('.in-price').value) || 0
        }));
    }

    async function finalizeAndSave() {
        const items = getItemsData().filter(i => i.name && i.qty > 0);
        const totalEl = document.getElementById('final-tot-val');
        const total = totalEl ? parseFloat(totalEl.textContent) : 0;

        if (!dom.customerName.value.trim()) return showToast("⚠️ Customer name required!");
        if (items.length === 0) return showToast("⚠️ Please add at least one item!");

        // Deduct Stock from Inventory
        items.forEach(soldItem => {
            const product = state.productCatalog.find(p => p.name.toLowerCase() === soldItem.name.toLowerCase());
            if (product) product.stock = Math.max(0, product.stock - soldItem.qty);
        });

        // Save customer if new
        if (!state.customers.includes(dom.customerName.value.trim())) {
            state.customers.push(dom.customerName.value.trim());
            localStorage.setItem('customers', JSON.stringify(state.customers));
        }

        const sale = {
            id: Date.now(),
            cashier: state.currentCashier,
            customerName: dom.customerName.value.trim(),
            customerPhone: dom.customerPhone?.value || '',
            total: total,
            status: dom.paymentStatus.value,
            dateTime: new Date().toISOString(),
            items: items
        };

        state.salesHistory.push(sale);
        saveToStorage();

        // Download as Image using html2canvas
        try {
            const canvas = await html2canvas(dom.receiptPreview, { useCORS: true, scale: 2 });
            const link = document.createElement('a');
            link.download = `Receipt-${sale.id}.png`;
            link.href = canvas.toDataURL('image/png');
            link.click();
            showToast("✅ Transaction Finalized & Receipt Downloaded!");
        } catch (err) {
            showToast("✅ Sale saved! (Image download failed)");
        }

        setTimeout(() => location.reload(), 1500);
    }

    function printReceipt() {
        const content = dom.receiptPreview.innerHTML;
        const win = window.open('', '_blank', 'width=400,height=600');
        win.document.write(`
            <html><head><title>Receipt</title>
            <style>
                body { font-family: 'Courier New', monospace; font-size: 13px; margin: 20px; color: #000; }
                table { width: 100%; border-collapse: collapse; }
                th, td { padding: 3px; }
                th:nth-child(2), td:nth-child(2),
                th:nth-child(3), td:nth-child(3),
                th:nth-child(4), td:nth-child(4) { text-align: right; }
                hr { border: 1px dashed #ccc; }
            </style></head><body>
            ${content}
            </body></html>
        `);
        win.document.close();
        win.focus();
        win.print();
        win.close();
    }

    // --- Hold Bill ---
    function holdBill() {
        const items = getItemsData().filter(i => i.name);
        if (items.length === 0) return showToast("⚠️ No items to hold!");
        const bill = {
            id: Date.now(),
            customer: dom.customerName.value || 'Walking Customer',
            items: items,
            date: new Date().toISOString()
        };
        state.heldBills.push(bill);
        saveToStorage();
        showToast("⏸️ Bill saved to Held Bills.");
        setTimeout(() => location.reload(), 1000);
    }

    function renderHeldBills() {
        const container = document.getElementById('held-bills-list');
        if (!container) return;
        if (state.heldBills.length === 0) {
            container.innerHTML = "<p style='padding:15px;'>No bills on hold.</p>";
            return;
        }
        container.innerHTML = state.heldBills.map(b => `
            <div class="held-bill-item" style="display:flex; justify-content:space-between; align-items:center; padding:12px; border-bottom:1px solid #eee;">
                <div>
                    <strong>${b.customer}</strong>
                    <br><small>${b.items.length} item(s) &nbsp;|&nbsp; ${new Date(b.date).toLocaleString()}</small>
                </div>
                <div style="display:flex;gap:8px;">
                    <button onclick="resumeBill(${b.id})" style="background:#007bff; color:white; border:none; padding:6px 12px; border-radius:4px; cursor:pointer;">Resume</button>
                    <button onclick="deleteHeldBill(${b.id})" style="background:#dc3545; color:white; border:none; padding:6px 12px; border-radius:4px; cursor:pointer;">Delete</button>
                </div>
            </div>
        `).join('');
    }

    window.resumeBill = (id) => {
        const billIndex = state.heldBills.findIndex(b => b.id === id);
        if (billIndex === -1) return;
        const bill = state.heldBills[billIndex];
        dom.customerName.value = bill.customer;
        dom.itemsList.innerHTML = '';
        bill.items.forEach(i => addItem(i));
        state.heldBills.splice(billIndex, 1);
        saveToStorage();
        Object.values(dom.modals).forEach(m => { if (m) m.style.display = 'none'; });
        updateReceipt();
        showToast("▶️ Bill Resumed!");
    };

    window.deleteHeldBill = (id) => {
        state.heldBills = state.heldBills.filter(b => b.id !== id);
        saveToStorage();
        renderHeldBills();
    };

    // --- Product Catalog / Inventory ---
    function handleAddProduct(e) {
        e.preventDefault();
        const name = document.getElementById('product-name-input').value.trim();
        const price = parseFloat(document.getElementById('product-price-input').value);
        const stock = parseInt(document.getElementById('product-stock-input').value) || 0;
        const barcode = document.getElementById('product-barcode-input')?.value.trim() || '';

        const existing = state.productCatalog.findIndex(p => p.name.toLowerCase() === name.toLowerCase());
        if (existing >= 0) {
            state.productCatalog[existing] = { ...state.productCatalog[existing], price, stock, barcode };
            showToast("✏️ Product Updated!");
        } else {
            state.productCatalog.push({ name, price, stock, barcode });
            showToast("➕ Product Added!");
        }
        saveToStorage();
        populateProductDatalist();
        renderProductList();
        e.target.reset();
    }

    function renderProductList() {
        const list = document.getElementById('product-list');
        if (!list) return;
        if (state.productCatalog.length === 0) {
            list.innerHTML = "<p style='padding:15px;'>No products in catalog. Add some above!</p>";
            return;
        }
        list.innerHTML = `<table width="100%">
            <thead>
                <tr style="background:#f4f4f4;">
                    <th>Product Name</th>
                    <th>Price (Rs.)</th>
                    <th>Stock</th>
                    <th>Barcode</th>
                    <th>Action</th>
                </tr>
            </thead>
            <tbody>
                ${state.productCatalog.map((p, idx) => `
                    <tr>
                        <td>${p.name}</td>
                        <td>${p.price.toFixed(2)}</td>
                        <td style="color:${p.stock <= 5 ? '#dc3545' : '#28a745'}; font-weight:bold;">${p.stock}</td>
                        <td>${p.barcode || '-'}</td>
                        <td><button onclick="deleteProduct(${idx})" style="background:#dc3545;color:white;border:none;padding:4px 8px;border-radius:3px;cursor:pointer;font-size:12px;">Delete</button></td>
                    </tr>
                `).join('')}
            </tbody>
        </table>`;
    }

    window.deleteProduct = (idx) => {
        if (confirm('Delete this product?')) {
            state.productCatalog.splice(idx, 1);
            saveToStorage();
            renderProductList();
            populateProductDatalist();
        }
    };

    function exportInventoryCSV() {
        let csv = "Name,Price,Stock,Barcode\n";
        state.productCatalog.forEach(p => csv += `"${p.name}",${p.price},${p.stock},"${p.barcode || ''}"\n`);
        downloadFile(csv, 'inventory.csv', 'text/csv');
    }

    function importInventoryCSV(e) {
        const reader = new FileReader();
        reader.onload = (ev) => {
            const lines = ev.target.result.split('\n').slice(1);
            lines.forEach(line => {
                const parts = line.split(',');
                if (parts[0]) {
                    const name = parts[0].replace(/"/g, '').trim();
                    const price = parseFloat(parts[1]) || 0;
                    const stock = parseInt(parts[2]) || 0;
                    const barcode = (parts[3] || '').replace(/"/g, '').trim();
                    const idx = state.productCatalog.findIndex(p => p.name.toLowerCase() === name.toLowerCase());
                    if (idx >= 0) state.productCatalog[idx] = { name, price, stock, barcode };
                    else state.productCatalog.push({ name, price, stock, barcode });
                }
            });
            saveToStorage();
            renderProductList();
            populateProductDatalist();
            showToast("📦 Inventory Imported!");
        };
        reader.readAsText(e.target.files[0]);
        e.target.value = '';
    }

    // --- Dashboard ---
    function renderSalesDashboard() {
        const today = new Date().toISOString().slice(0, 10);
        const cashierFilter = document.getElementById('cashier-filter')?.value || '';

        // Populate cashier filter
        const filterEl = document.getElementById('cashier-filter');
        if (filterEl && filterEl.options.length <= 1) {
            filterEl.innerHTML = `<option value="">All Cashiers</option>` +
                state.cashiers.map(c => `<option value="${c}">${c}</option>`).join('');
        }

        let sales = state.salesHistory.filter(s => s.dateTime.startsWith(today));
        if (cashierFilter) sales = sales.filter(s => s.cashier === cashierFilter);

        const paidSales = sales.filter(s => s.status === 'paid');
        const totalRevenue = paidSales.reduce((acc, s) => acc + s.total, 0);
        const todayExpenses = state.expenses.filter(ex => ex.date.startsWith(today)).reduce((acc, ex) => acc + ex.amount, 0);
        const netProfit = totalRevenue - todayExpenses;

        const totalSalesEl = document.getElementById('total-sales');
        const totalExpEl = document.getElementById('total-expenses');
        const netProfitEl = document.getElementById('net-profit');
        if (totalSalesEl) totalSalesEl.textContent = `Rs. ${totalRevenue.toFixed(2)}`;
        if (totalExpEl) totalExpEl.textContent = `Rs. ${todayExpenses.toFixed(2)}`;
        if (netProfitEl) netProfitEl.textContent = `Rs. ${netProfit.toFixed(2)}`;

        // Sales History Table
        const histList = document.getElementById('sales-history-list');
        if (histList) {
            if (state.salesHistory.length === 0) {
                histList.innerHTML = "<p style='padding:15px;'>No transactions yet.</p>";
            } else {
                const recent = [...state.salesHistory].reverse().slice(0, 50);
                histList.innerHTML = `<table width="100%">
                    <thead><tr><th>Date</th><th>Customer</th><th>Total</th><th>Status</th><th>Cashier</th></tr></thead>
                    <tbody>
                        ${recent.map(s => `
                            <tr>
                                <td>${s.dateTime.slice(0,10)}</td>
                                <td>${s.customerName}</td>
                                <td>Rs. ${s.total.toFixed(2)}</td>
                                <td class="status-${s.status}">${s.status.toUpperCase()}</td>
                                <td>${s.cashier || 'Admin'}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>`;
            }
        }

        // Sales Chart - last 7 days
        const ctx = document.getElementById('sales-chart')?.getContext('2d');
        if (!ctx) return;
        if (state.salesChart) state.salesChart.destroy();

        const last7 = [];
        for (let i = 6; i >= 0; i--) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            last7.push(d.toISOString().slice(0, 10));
        }

        const chartData = last7.map(date => {
            return state.salesHistory
                .filter(s => s.dateTime.startsWith(date) && s.status === 'paid')
                .reduce((acc, s) => acc + s.total, 0);
        });

        state.salesChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: last7.map(d => d.slice(5)),
                datasets: [{
                    label: 'Daily Sales (Rs.)',
                    data: chartData,
                    backgroundColor: '#007bff',
                    borderRadius: 4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } }
            }
        });
    }

    function generateZReport() {
        const today = new Date().toISOString().slice(0, 10);
        const sales = state.salesHistory.filter(s => s.dateTime.startsWith(today));
        const paid = sales.filter(s => s.status === 'paid');
        const credit = sales.filter(s => s.status === 'credit');
        const total = paid.reduce((acc, s) => acc + s.total, 0);
        const creditTotal = credit.reduce((acc, s) => acc + s.total, 0);

        document.getElementById('z-report-content').innerHTML = `
            <div style="text-align:center; font-family:monospace;">
                <h3>★ DAILY Z-REPORT ★</h3>
                <p>Business: ${dom.businessName?.value || 'ST Imagix'}</p>
                <p>Date: ${today} | Cashier: ${state.currentCashier}</p>
                <hr>
                <p>Cash/Paid Sales: Rs. ${total.toFixed(2)}</p>
                <p>Credit Sales: Rs. ${creditTotal.toFixed(2)}</p>
                <p><strong>Total Transactions: ${sales.length}</strong></p>
                <hr>
                <p style="font-size:12px;">Generated at: ${new Date().toLocaleTimeString()}</p>
            </div>`;
        dom.modals.zReport.style.display = 'block';
    }

    function closeRegisterAndExport() {
        generateZReport();
        exportSalesCSV();
    }

    // --- Credit Ledger ---
    function renderCreditLedger() {
        const list = document.getElementById('credit-ledger-list');
        if (!list) return;
        const creditSales = state.salesHistory.filter(s => s.status === 'credit');

        if (creditSales.length === 0) {
            list.innerHTML = "<p style='padding:15px;'>No credit sales found. 🎉</p>";
            return;
        }

        // Group by customer
        const grouped = {};
        creditSales.forEach(s => {
            if (!grouped[s.customerName]) grouped[s.customerName] = { total: 0, sales: [] };
            grouped[s.customerName].total += s.total;
            grouped[s.customerName].sales.push(s);
        });

        list.innerHTML = `<table width="100%">
            <thead><tr><th>Customer</th><th>Total Owed</th><th>Last Date</th><th>Actions</th></tr></thead>
            <tbody>
                ${Object.entries(grouped).map(([name, data]) => `
                    <tr>
                        <td><strong>${name}</strong></td>
                        <td style="color:#dc3545; font-weight:bold;">Rs. ${data.total.toFixed(2)}</td>
                        <td>${data.sales[data.sales.length - 1].dateTime.slice(0,10)}</td>
                        <td class="ledger-actions">
                            <button class="settle-btn" onclick="settleCreditCustomer('${name}')">Settle</button>
                        </td>
                    </tr>
                `).join('')}
            </tbody>
        </table>`;
    }

    window.settleCreditCustomer = (name) => {
        if (confirm(`Mark all credit for "${name}" as settled/paid?`)) {
            state.salesHistory.forEach(s => {
                if (s.customerName === name && s.status === 'credit') s.status = 'paid';
            });
            saveToStorage();
            renderCreditLedger();
            showToast(`✅ ${name}'s credit settled!`);
        }
    };

    function exportDebtorsCSV() {
        const creditSales = state.salesHistory.filter(s => s.status === 'credit');
        let csv = "Customer,Amount,Date\n";
        creditSales.forEach(s => csv += `"${s.customerName}",${s.total.toFixed(2)},${s.dateTime.slice(0,10)}\n`);
        downloadFile(csv, 'debtors_list.csv', 'text/csv');
    }

    // --- Expenses ---
    function handleAddExpense(e) {
        e.preventDefault();
        const desc = document.getElementById('expense-desc-input').value.trim();
        const amount = parseFloat(document.getElementById('expense-amount-input').value);
        state.expenses.push({ desc, amount, date: new Date().toISOString() });
        saveToStorage();
        renderExpenseList();
        e.target.reset();
        showToast("💸 Expense Added!");
    }

    function renderExpenseList() {
        const list = document.getElementById('expense-list');
        if (!list) return;
        const today = new Date().toISOString().slice(0, 10);
        const todayExpenses = state.expenses.filter(ex => ex.date.startsWith(today));
        if (todayExpenses.length === 0) {
            list.innerHTML = "<p style='padding:15px;'>No expenses today.</p>";
            return;
        }
        list.innerHTML = `<table width="100%">
            <thead><tr><th>Description</th><th>Amount</th></tr></thead>
            <tbody>
                ${todayExpenses.map(ex => `<tr><td>${ex.desc}</td><td>Rs. ${ex.amount.toFixed(2)}</td></tr>`).join('')}
            </tbody>
        </table>`;
    }

    // --- Cashier Management ---
    function handleAddCashier(e) {
        e.preventDefault();
        const name = document.getElementById('cashier-name-input').value.trim();
        if (!name || state.cashiers.includes(name)) return showToast("Cashier already exists or name is empty.");
        state.cashiers.push(name);
        localStorage.setItem('cashiers', JSON.stringify(state.cashiers));
        renderCashierList();
        e.target.reset();
        showToast(`👤 Cashier "${name}" added!`);
    }

    function renderCashierList() {
        const list = document.getElementById('cashier-list');
        if (!list) return;
        list.innerHTML = state.cashiers.map(c => `
            <div class="cashier-item" style="display:flex; justify-content:space-between; align-items:center; padding:8px; border-bottom:1px solid #eee;">
                <span>👤 ${c}</span>
                <button onclick="switchCashier('${c}')" style="background:${c === state.currentCashier ? '#28a745' : '#007bff'}; color:white; border:none; padding:4px 10px; border-radius:3px; cursor:pointer; font-size:12px;">
                    ${c === state.currentCashier ? 'Active ✓' : 'Switch'}
                </button>
            </div>
        `).join('');
    }

    window.switchCashier = (name) => {
        state.currentCashier = name;
        localStorage.setItem('currentCashier', name);
        updateCurrentCashierDisplay();
        renderCashierList();
        showToast(`Switched to cashier: ${name}`);
    };

    // --- Barcode Scanner ---
    let html5QrScanner = null;
    function initBarcodeScanner() {
        const scannerDiv = document.getElementById('barcode-scanner');
        if (!scannerDiv || typeof Html5QrcodeScanner === 'undefined') return;
        try {
            if (html5QrScanner) html5QrScanner.clear();
            html5QrScanner = new Html5QrcodeScanner("barcode-scanner", { fps: 10, qrbox: 200 });
            html5QrScanner.render((decodedText) => {
                const product = state.productCatalog.find(p => p.barcode === decodedText);
                if (product) {
                    addItem({ name: product.name, price: product.price, qty: 1 });
                    showToast(`📦 Added: ${product.name}`);
                } else {
                    showToast(`Barcode: ${decodedText} (not in catalog)`);
                }
                html5QrScanner.clear();
                dom.modals.barcodeScanner.style.display = 'none';
            });
        } catch (e) { console.warn('Barcode scanner init error:', e); }
    }

    // --- Helper Functions ---
    function populateCustomerDatalist() {
        const dl = document.getElementById('customers-datalist');
        if (!dl) return;
        dl.innerHTML = state.customers.map(c => `<option value="${c}">`).join('');
    }

    function populateProductDatalist() {
        const dl = document.getElementById('product-datalist');
        if (!dl) return;
        dl.innerHTML = state.productCatalog.map(p => `<option value="${p.name}">`).join('');
    }

    function handleLogoUpload(e) {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (event) => {
            localStorage.setItem('businessLogo', event.target.result);
            updateReceipt();
            showToast("🖼️ Logo uploaded!");
        };
        reader.readAsDataURL(file);
        e.target.value = '';
    }

    function saveToStorage() {
        localStorage.setItem('productCatalog', JSON.stringify(state.productCatalog));
        localStorage.setItem('salesHistory', JSON.stringify(state.salesHistory));
        localStorage.setItem('heldBills', JSON.stringify(state.heldBills));
        localStorage.setItem('expenses', JSON.stringify(state.expenses));
        localStorage.setItem('cashiers', JSON.stringify(state.cashiers));
    }

    function loadSettings() {
        const savedName = localStorage.getItem('businessName');
        if (savedName && dom.businessName) dom.businessName.value = savedName;

        dom.businessName?.addEventListener('change', () => {
            localStorage.setItem('businessName', dom.businessName.value);
        });

        const savedTheme = localStorage.getItem('receiptTheme') || 'theme-classic';
        dom.receiptPreview.className = savedTheme;
        const themeSelect = document.getElementById('receipt-theme-select');
        if (themeSelect) themeSelect.value = savedTheme;

        const footerNotes = localStorage.getItem('footerNotes') || '';
        const footerEl = document.getElementById('footer-notes');
        if (footerEl) {
            footerEl.value = footerNotes;
            footerEl.oninput = () => localStorage.setItem('footerNotes', footerEl.value);
        }

        const paymentLink = localStorage.getItem('paymentLink') || '';
        const paymentLinkEl = document.getElementById('payment-link-input');
        if (paymentLinkEl) {
            paymentLinkEl.value = paymentLink;
            paymentLinkEl.oninput = () => localStorage.setItem('paymentLink', paymentLinkEl.value);
        }
    }

    function openModal(modal, callback) {
        if (!modal) return;
        modal.style.display = 'block';
        if (callback) callback();
    }

    function showToast(msg) {
        if (!dom.toast) return;
        dom.toast.textContent = msg;
        dom.toast.className = 'show';
        setTimeout(() => { dom.toast.className = dom.toast.className.replace('show', ''); }, 3000);
    }

    function downloadFile(content, filename, mimeType) {
        const blob = new Blob([content], { type: mimeType });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = filename;
        a.click();
        URL.revokeObjectURL(a.href);
    }

    function backupData() {
        const data = JSON.stringify({
            productCatalog: state.productCatalog,
            customers: state.customers,
            salesHistory: state.salesHistory,
            expenses: state.expenses,
            heldBills: state.heldBills,
            cashiers: state.cashiers,
            businessLogo: localStorage.getItem('businessLogo'),
            businessName: localStorage.getItem('businessName'),
            footerNotes: localStorage.getItem('footerNotes')
        }, null, 2);
        downloadFile(data, `instabill-backup-${new Date().toISOString().slice(0,10)}.json`, 'application/json');
        showToast("💾 Backup Downloaded!");
    }

    function restoreData(e) {
        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const data = JSON.parse(event.target.result);
                if (data.productCatalog) localStorage.setItem('productCatalog', JSON.stringify(data.productCatalog));
                if (data.salesHistory) localStorage.setItem('salesHistory', JSON.stringify(data.salesHistory));
                if (data.expenses) localStorage.setItem('expenses', JSON.stringify(data.expenses));
                if (data.heldBills) localStorage.setItem('heldBills', JSON.stringify(data.heldBills));
                if (data.cashiers) localStorage.setItem('cashiers', JSON.stringify(data.cashiers));
                if (data.customers) localStorage.setItem('customers', JSON.stringify(data.customers));
                if (data.businessLogo) localStorage.setItem('businessLogo', data.businessLogo);
                if (data.businessName) localStorage.setItem('businessName', data.businessName);
                if (data.footerNotes) localStorage.setItem('footerNotes', data.footerNotes);
                showToast("✅ Data Restored!");
                setTimeout(() => location.reload(), 1000);
            } catch (err) {
                showToast("❌ Restore failed: Invalid backup file.");
            }
        };
        reader.readAsText(e.target.files[0]);
        e.target.value = '';
    }

    function clearAllData() {
        if (confirm("⚠️ DANGER: This will permanently delete ALL data. This cannot be undone. Continue?")) {
            localStorage.clear();
            showToast("🗑️ All data cleared.");
            setTimeout(() => location.reload(), 1000);
        }
    }

    function exportSalesCSV() {
        let csv = "Date,Customer,Phone,Items,Total,Status,Cashier\n";
        state.salesHistory.forEach(s => {
            const itemsSummary = s.items.map(i => `${i.name}(x${i.qty})`).join('; ');
            csv += `${s.dateTime.slice(0,10)},"${s.customerName}","${s.customerPhone || ''}","${itemsSummary}",${s.total.toFixed(2)},${s.status},${s.cashier || 'Admin'}\n`;
        });
        downloadFile(csv, `sales_history_${new Date().toISOString().slice(0,10)}.csv`, 'text/csv');
        showToast("📊 Sales CSV Downloaded!");
    }

    // --- Service Worker for Offline (PWA) ---
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('/sw.js').catch(() => {});
    }

    init();
});