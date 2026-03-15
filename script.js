document.addEventListener('DOMContentLoaded', () => {
    // InstaBill LK v9 - Strictly Corrected for Frictionless Start
    // The "Login as Cashier" modal and its related logic have been completely removed.
    // The system now automatically logs in as 'Admin' on startup.

    // --- ENFORCE AUTO-LOGIN ---
    // This is the only line needed to ensure a silent, automatic login.
    localStorage.setItem('currentCashier', 'Admin');

    const get = (id) => document.getElementById(id);

    // --- DOM ELEMENTS (v9 Update) ---
    const businessName = get('business-name');
    // business-logo-upload is handled differently in v8 logic
    const customerName = get('customer-name');
    const customerPhone = get('customer-phone');
    const receiptDate = get('receipt-date');
    const itemsList = get('items-list');
    const addItemBtn = get('add-item-btn');
    const discountValue = get('discount-value');
    const discountType = get('discount-type');
    const deliveryChargeInput = get('delivery-charge');
    const paymentStatus = get('payment-status');
    const finalizeBtn = get('finalize-btn');
    const printReceiptBtn = get('print-receipt-btn');
    const holdBillBtn = get('hold-bill-btn');
    const receiptPreview = get('receipt-preview');

    // --- MODALS (v9 Update) ---
    const productCatalogModal = get('product-catalog-modal');
    const salesDashboardModal = get('sales-dashboard-modal');
    const settingsModal = get('settings-modal');
    const barcodeScannerModal = get('barcode-scanner-modal');
    const creditLedgerModal = get('credit-ledger-modal');
    const zReportModal = get('z-report-modal');
    const expensesModal = get('expenses-modal');
    const heldBillsModal = get('held-bills-modal');


    // --- MODAL TRIGGERS (v9 Update)---
    const openCatalogBtn = get('open-catalog-btn');
    const openDashboardBtn = get('open-dashboard-btn');
    const openSettingsBtn = get('open-settings-btn');
    const scanBarcodeBtn = get('scan-barcode-btn');
    const openLedgerBtn = get('open-ledger-btn');


    // --- STATE MANAGEMENT ---
    let productCatalog = JSON.parse(localStorage.getItem('productCatalog')) || [];
    let customers = JSON.parse(localStorage.getItem('customers')) || [];
    let salesHistory = JSON.parse(localStorage.getItem('salesHistory')) || [];
    let expenses = JSON.parse(localStorage.getItem('expenses')) || [];
    let cashiers = JSON.parse(localStorage.getItem('cashiers')) || ['Owner'];
    let heldBills = JSON.parse(localStorage.getItem('heldBills')) || [];
    let currentCashier = localStorage.getItem('currentCashier') || 'Admin'; // Fallback, but set above
    let qrCode = null;


    // --- INITIALIZATION ---
    function initializeApp() {
        receiptDate.valueAsDate = new Date();
        loadBusinessProfile();
        updatePreviews();
        renderProductCatalog();
        renderCustomers();
        renderCashiers();
        updateCurrentCashierUI();

        // Modal Setup
        setupModal(productCatalogModal, openCatalogBtn);
        setupModal(salesDashboardModal, openDashboardBtn, renderSalesDashboard);
        setupModal(settingsModal, openSettingsBtn);
        setupModal(barcodeScannerModal, scanBarcodeBtn, startBarcodeScanner);
        setupModal(creditLedgerModal, openLedgerBtn, renderCreditLedger);
        setupModal(zReportModal, get('z-report-btn'));
        setupModal(expensesModal, document.querySelector('.dashboard-card.expenses')); // Can be triggered from dashboard
        setupModal(heldBillsModal, get('resume-bills-btn'), renderHeldBills);


        addEventListeners();
        checkOnlineStatus();
    }

     function addEventListeners() {
        // Main Form
        businessName.addEventListener('input', () => {
            updatePreviews();
            saveBusinessProfile();
        });
        [customerName, customerPhone, receiptDate].forEach(el => el.addEventListener('input', updatePreviews));
        addItemBtn.addEventListener('click', () => addItem());

        // Calculations
        [discountValue, discountType, deliveryChargeInput].forEach(el => el.addEventListener('input', updateCalculations));

        // Actions
        finalizeBtn.addEventListener('click', finalizeAndSaveReceipt);
        printReceiptBtn.addEventListener('click', printReceipt);
        holdBillBtn.addEventListener('click', holdBill);


        // Product Catalog
        get('add-product-form').addEventListener('submit', addProductToCatalog);
        get('product-list').addEventListener('click', handleProductListActions);


        // Settings
        get('add-cashier-form').addEventListener('submit', addCashier);
        get('cashier-list').addEventListener('click', handleCashierListActions);
        get('apply-vat').addEventListener('change', updateCalculations);
        get('apply-sscl').addEventListener('change', updateCalculations);
        get('receipt-theme-select').addEventListener('change', (e) => applyReceiptTheme(e.target.value));
        get('payment-link-input').addEventListener('input', (e) => {
            localStorage.setItem('paymentLink', e.target.value);
            updatePreviews(); // Regenerate QR code
        });
        get('backup-data-btn').addEventListener('click', backupData);
        get('restore-data-btn').addEventListener('click', () => get('restore-data-input').click());
        get('restore-data-input').addEventListener('change', restoreData);

        // Credit Ledger
        get('credit-ledger-list').addEventListener('click', handleLedgerActions);


        // Event listeners for dynamic elements
        itemsList.addEventListener('input', updateCalculations);
        itemsList.addEventListener('click', (e) => {
            if (e.target.classList.contains('remove-item-btn')) {
                e.target.closest('.item').remove();
                updateCalculations();
            }
        });

        // Other Modals
        get('z-report-btn').addEventListener('click', generateZReport);
        get('print-z-report-btn').addEventListener('click', () => printZReport());
    }

    // ... The rest of the script.js from v9 would follow ...
    // Crucially, there is no code that references `login-overlay` anymore.
    // All functions for items, previews, calculations, modals, PWA, etc., remain.

    // --- CORE FUNCTIONS from v9 (abridged for clarity) ---

    function updatePreviews() {
        const business = localStorage.getItem('businessName') || 'ST Imagix';
        const logoUrl = localStorage.getItem('businessLogo') || 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTbIsh_qisgC9Gu1yaHa4zrFSuobx5KocQuOA&s';
        const customer = customerName.value || 'N/A';
        const phone = customerPhone.value || 'N/A';
        const date = receiptDate.value;
        const cashier = currentCashier;

        // Simplified innerHTML generation for receipt preview
        receiptPreview.innerHTML = `
            <div class="receipt-header">
                <img id="logo-preview" src="${logoUrl}" alt="Business Logo" style="${logoUrl ? 'display: block;' : 'display: none;'}">
                <h2 id="business-name-preview">${business}</h2>
                <p class="line-break">--------------------------------</p>
                <p><strong>Customer:</strong> <span id="customer-name-preview">${customer}</span></p>
                <p><strong>Phone:</strong> <span id="customer-phone-preview">${phone}</span></p>
                <p><strong>Date:</strong> <span id="receipt-date-preview">${date}</span></p>
                <p><strong>Cashier:</strong> <span id="cashier-name-preview">${cashier}</span></p>
                <p class="line-break">--------------------------------</p>
            </div>
            <div class="receipt-items">
                <table>
                    <thead><tr><th>Item</th><th>Qty</th><th>Price</th><th>Total</th></tr></thead>
                    <tbody id="receipt-items-body"></tbody>
                </table>
            </div>
            <p class="line-break">--------------------------------</p>
            <div class="receipt-total">
                <p><strong>Subtotal:</strong> Rs. <span id="subtotal-amount">0.00</span></p>
                <p><strong>Discount:</strong> Rs. <span id="discount-amount">0.00</span></p>
                <p id="vat-row" class="tax-row" style="display: none;"><strong>VAT (18%):</strong> Rs. <span id="vat-amount">0.00</span></p>
                <p id="sscl-row" class="tax-row" style="display: none;"><strong>SSCL (2.5%):</strong> Rs. <span id="sscl-amount">0.00</span></p>
                <p><strong>Delivery:</strong> Rs. <span id="delivery-amount">0.00</span></p>
                <p class="line-break">--------------------------------</p>
                <p><strong>Grand Total:</strong> Rs. <span id="grand-total-amount">0.00</span></p>
            </div>
            <div class="loyalty-section" style="display: none;">
                <p class="line-break">--------------------------------</p>
                <p><strong>Loyalty Points:</strong> <span id="loyalty-points-preview">0</span></p>
            </div>
            <div class="qr-code-container" id="qr-code-container"></div>
            <div class="watermark"><p>InstaBill LK v9</p></div>
        `;
        // Regenerate QR if payment link exists
        const paymentLink = localStorage.getItem('paymentLink');
        if (paymentLink) {
             if (qrCode) qrCode.clear();
             qrCode = new QRCode(get('qr-code-container'), { text: paymentLink, width: 90, height: 90 });
        }

        updateCalculations(); // Recalculate everything after updating the DOM
    }


    function updateCalculations() {
        let subtotal = 0;
        const receiptItemsBody = get('receipt-items-body');
        if (!receiptItemsBody) return;
        receiptItemsBody.innerHTML = '';

        document.querySelectorAll('#items-list .item').forEach(item => {
            const name = item.querySelector('input[type="text"]').value;
            const qty = parseFloat(item.querySelector('input[type="number"].qty').value) || 0;
            const price = parseFloat(item.querySelector('input[type="number"].price').value) || 0;
            const total = qty * price;

            if (name && qty > 0 && price > 0) {
                const row = receiptItemsBody.insertRow();
                row.insertCell(0).textContent = name;
                row.insertCell(1).textContent = qty;
                row.insertCell(2).textContent = price.toFixed(2);
                row.insertCell(3).textContent = total.toFixed(2);
                subtotal += total;
            }
        });

        const discountAmt = parseFloat(discountValue.value) || 0;
        const discountIsPercentage = discountType.value === 'percentage';
        const finalDiscount = discountIsPercentage ? subtotal * (discountAmt / 100) : discountAmt;

        const delivery = parseFloat(deliveryChargeInput.value) || 0;

        let totalAfterDiscount = subtotal - finalDiscount;
        let vat = 0;
        let sscl = 0;

        if (get('apply-vat').checked) {
            vat = totalAfterDiscount * 0.18;
            get('vat-row').style.display = 'block';
        } else {
             get('vat-row').style.display = 'none';
        }
        if (get('apply-sscl').checked) {
            sscl = totalAfterDiscount * 0.025;
            get('sscl-row').style.display = 'block';
        } else {
            get('sscl-row').style.display = 'none';
        }

        const grandTotal = totalAfterDiscount + vat + sscl + delivery;

        get('subtotal-amount').textContent = subtotal.toFixed(2);
        get('discount-amount').textContent = `-${finalDiscount.toFixed(2)}`;
        get('vat-amount').textContent = vat.toFixed(2);
        get('sscl-amount').textContent = sscl.toFixed(2);
        get('delivery-amount').textContent = delivery.toFixed(2);
        get('grand-total-amount').textContent = grandTotal.toFixed(2);
    }

    function finalizeAndSaveReceipt() {
        const customer = customerName.value;
        const phone = customerPhone.value;
        const grandTotal = parseFloat(get('grand-total-amount').textContent);
        const status = paymentStatus.value;

        if (!customer) {
            showToast('Customer name is required to finalize!', true);
            return;
        }

         // Update or create customer
        let customerRecord = customers.find(c => c.name === customer);
        if (!customerRecord) {
            customerRecord = { name: customer, phone: phone, debt: 0, loyalty: 0 };
            customers.push(customerRecord);
        } else {
            customerRecord.phone = phone; // Update phone if changed
        }


        if (status === 'credit') {
            customerRecord.debt = (customerRecord.debt || 0) + grandTotal;
            showToast(`Added Rs. ${grandTotal.toFixed(2)} to ${customer}'s credit.`);
        } else {
             // For 'paid' status, award loyalty points
            customerRecord.loyalty = (customerRecord.loyalty || 0) + Math.floor(grandTotal / 100); // 1 point per 100
        }


        // Save the receipt
        const receipt = {
            id: Date.now(),
            customerName: customer,
            cashier: currentCashier,
            date: receiptDate.value,
            total: grandTotal,
            status: status,
            items: Array.from(document.querySelectorAll('#items-list .item')).map(item => ({
                name: item.querySelector('input[type="text"]').value,
                qty: parseFloat(item.querySelector('input[type="number"].qty').value),
                price: parseFloat(item.querySelector('input[type="number"].price').value)
            }))
        };
        salesHistory.push(receipt);

        // Save all data
        localStorage.setItem('salesHistory', JSON.stringify(salesHistory));
        localStorage.setItem('customers', JSON.stringify(customers));
        renderCustomers(); // Update datalist

        downloadReceipt(); // Trigger download after saving
        resetForm();
    }
     function resetForm() {
        customerName.value = '';
        customerPhone.value = '';
        itemsList.innerHTML = '';
        discountValue.value = '';
        deliveryChargeInput.value = '';
        updatePreviews();
    }


    function setupModal(modal, openBtn, onOpen) {
        if (!modal || !openBtn) return;
        const closeBtn = modal.querySelector('.close-btn');
        openBtn.onclick = () => {
            modal.style.display = 'block';
            if (onOpen) onOpen();
        };
        if(closeBtn) closeBtn.onclick = () => modal.style.display = 'none';
        window.onclick = (event) => {
            if (event.target == modal) {
                modal.style.display = 'none';
            }
        };
    }

     function updateCurrentCashierUI() {
        get('current-cashier').textContent = `Cashier: ${currentCashier}`;
    }


    function renderCreditLedger() {
        const ledgerList = get('credit-ledger-list');
        const debtors = customers.filter(c => c.debt && c.debt > 0);

        if (debtors.length === 0) {
            ledgerList.innerHTML = '<p>No outstanding debts. Everyone is settled up!</p>';
            return;
        }

        let tableHTML = '<table><tr><th>Customer</th><th>Phone</th><th>Outstanding Debt</th><th>Actions</th></tr>';
        debtors.forEach(customer => {
            tableHTML += `
                <tr>
                    <td>${customer.name}</td>
                    <td>${customer.phone || 'N/A'}</td>
                    <td>Rs. ${customer.debt.toFixed(2)}</td>
                    <td class="ledger-actions">
                        <button class="settle-btn" data-customer="${customer.name}">✅ Settle</button>
                        <button class="remind-btn" data-customer="${customer.name}" data-phone="${customer.phone}" data-debt="${customer.debt}">💬 WhatsApp</button>
                    </td>
                </tr>
            `;
        });
        tableHTML += '</table>';
        ledgerList.innerHTML = tableHTML;
    }

    function handleLedgerActions(e) {
        const customerName = e.target.dataset.customer;
        if (!customerName) return;

        const customer = customers.find(c => c.name === customerName);
        if (!customer) return;

        if (e.target.classList.contains('settle-btn')) {
            customer.debt = 0;
            localStorage.setItem('customers', JSON.stringify(customers));
            renderCreditLedger();
            showToast(`${customerName}'s debt has been settled.`);
        }

        if (e.target.classList.contains('remind-btn')) {
            const phone = e.target.dataset.phone;
            const debt = e.target.dataset.debt;
            if (!phone || phone === 'N/A') {
                showToast('No phone number for this customer.', true);
                return;
            }
            const message = `ආයුබෝවන් ${customerName}, මෙය සුහද සිහිකැඳවීමකි. ඔබ අප ආයතනයට ගෙවීමට ඇති හිඟ මුදල රු. ${parseFloat(debt).toFixed(2)} කි. කරුණාකර එය හැකි ඉක්මනින් පියවන්න. ස්තූතියි! - ${localStorage.getItem('businessName') || 'ST Imagix'}`;
            const whatsappUrl = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
            window.open(whatsappUrl, '_blank');
        }
    }
    function loadBusinessProfile() {
        const savedName = localStorage.getItem('businessName');
        const savedLogo = localStorage.getItem('businessLogo');

        // Set default ST Imagix branding if nothing is saved
        businessName.value = savedName || "ST Imagix";
        // The logo URL is now referenced directly in updatePreviews, ensuring it falls back correctly.

        // Other settings
         const paymentLink = localStorage.getItem('paymentLink') || '';
        get('payment-link-input').value = paymentLink;

        const vat = JSON.parse(localStorage.getItem('applyVat')) || false;
        const sscl = JSON.parse(localStorage.getItem('applySscl')) || false;
        get('apply-vat').checked = vat;
        get('apply-sscl').checked = sscl;

        const theme = localStorage.getItem('receiptTheme') || 'theme-classic';
        applyReceiptTheme(theme);
        get('receipt-theme-select').value = theme;
    }
    // All other helper functions (showToast, backupData, restoreData, etc.) would be here.
    // The key is the complete removal of any logic touching 'login-overlay'.
     function showToast(message, isError = false) {
        const toast = get('toast');
        toast.textContent = message;
        toast.style.backgroundColor = isError ? 'var(--danger-color)' : 'var(--success-color)';
        toast.className = "show";
        setTimeout(function(){ toast.className = toast.className.replace("show", ""); }, 3000);
    }
     function checkOnlineStatus() {
        const offlineIndicator = get('offline-indicator');
        function updateStatus() {
            if (navigator.onLine) {
                offlineIndicator.classList.add('online');
                offlineIndicator.title = 'Online';
            } else {
                offlineIndicator.classList.remove('online');
                 offlineIndicator.title = 'Offline';
            }
        }
        window.addEventListener('online', updateStatus);
        window.addEventListener('offline', updateStatus);
        updateStatus();
    }
     function printReceipt() {
        const printContent = receiptPreview.innerHTML;
        const originalContent = document.body.innerHTML;
        document.body.innerHTML = printContent;
        window.print();
        document.body.innerHTML = originalContent;
        // Re-initialize listeners since the body was replaced
        initializeApp();
    }
    function downloadReceipt() {
        html2canvas(receiptPreview, { scale: 2.5 }).then(canvas => {
            const link = document.createElement('a');
            link.download = `receipt-${Date.now()}.png`;
            link.href = canvas.toDataURL();
            link.click();
        });
    }

    // --- PWA Service Worker Registration ---
    if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
            navigator.serviceWorker.register('/sw.js').then(registration => {
                console.log('PWA ServiceWorker registration successful');
            }).catch(err => {
                console.log('PWA ServiceWorker registration failed: ', err);
            });
        });
    }


    // --- Final App Start ---
    initializeApp();

});
// Note: This is a simplified representation. A full script.js would include
// all the functions for dashboard, settings, product management, etc.
// The critical change is the removal of the login modal logic and the forced auto-login.
