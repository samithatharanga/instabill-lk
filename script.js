
document.addEventListener('DOMContentLoaded', () => {
    // InstaBill LK v5 Ultimate Enterprise POS - All Client-Side
    // Developed by: ST Imagix
    // Features: CRM, QR Code, Chart.js, Backup/Restore, LocalStorage Catalog, Dark UI,
    // Barcode Scanner, Thermal Printing, Bilingual Support, PWA Ready.

    const get = (id) => document.getElementById(id);

    // --- DOM ELEMENTS ---
    const businessName = get('business-name');
    const businessLogoUpload = get('business-logo-upload');
    const customerName = get('customer-name');
    const customerPhone = get('customer-phone');
    const receiptDate = get('receipt-date');
    const itemsList = get('items-list');
    const addItemBtn = get('add-item-btn');
    const discountInput = get('discount');
    const deliveryChargeInput = get('delivery-charge');
    const finalizeBtn = get('finalize-btn');
    const printReceiptBtn = get('print-receipt-btn');
    const whatsappBtn = get('whatsapp-btn');
    const templateToggle = get('template-toggle');
    const languageToggle = get('language-toggle');

    // --- PREVIEW ELEMENTS ---
    const businessNamePreview = get('business-name-preview');
    const logoPreview = get('logo-preview');
    const customerNamePreview = get('customer-name-preview');
    const customerPhonePreview = get('customer-phone-preview');
    const receiptDatePreview = get('receipt-date-preview');
    const receiptItemsBody = get('receipt-items-body');
    const subtotalAmount = get('subtotal-amount');
    const discountAmount = get('discount-amount');
    const deliveryAmount = get('delivery-amount');
    const grandTotalAmount = get('grand-total-amount');
    const qrCodeContainer = get('qr-code-container');

    // --- MODALS ---
    const productCatalogModal = get('product-catalog-modal');
    const salesDashboardModal = get('sales-dashboard-modal');
    const settingsModal = get('settings-modal');
    const barcodeScannerModal = get('barcode-scanner-modal');

    // --- MODAL TRIGGERS ---
    const openCatalogBtn = get('open-catalog-btn');
    const openDashboardBtn = get('open-dashboard-btn');
    const openSettingsBtn = get('open-settings-btn');
    const scanBarcodeBtn = get('scan-barcode-btn');

    // --- CATALOG & SALES ---
    let productCatalog = JSON.parse(localStorage.getItem('productCatalog')) || [];
    let customers = JSON.parse(localStorage.getItem('customers')) || [];
    let salesHistory = JSON.parse(localStorage.getItem('salesHistory')) || [];
    let qrCode = null;

    // --- INITIALIZATION ---
    receiptDate.valueAsDate = new Date();
    loadBusinessProfile();
    updatePreviews();
    renderProductCatalog();
    renderCustomers();
    setupModal(productCatalogModal, openCatalogBtn);
    setupModal(salesDashboardModal, openDashboardBtn, renderSalesDashboard);
    setupModal(settingsModal, openSettingsBtn);
    setupModal(barcodeScannerModal, scanBarcodeBtn, startBarcodeScanner);

    // --- EVENT LISTENERS ---
    businessName.addEventListener('input', () => {
        updatePreviews();
        saveBusinessProfile();
    });
    businessLogoUpload.addEventListener('change', handleLogoUpload);
    [customerName, customerPhone, receiptDate].forEach(el => el.addEventListener('input', updatePreviews));
    addItemBtn.addEventListener('click', addItem);
    finalizeBtn.addEventListener('click', downloadReceipt);
    printReceiptBtn.addEventListener('click', printReceipt);
    whatsappBtn.addEventListener('click', shareViaWhatsApp);
    templateToggle.addEventListener('change', switchTemplate);
    languageToggle.addEventListener('change', switchLanguage);

    get('add-product-form').addEventListener('submit', addProductToCatalog);
    get('backup-data-btn').addEventListener('click', backupData);
    get('restore-data-btn').addEventListener('click', () => get('restore-data-input').click());
    get('restore-data-input').addEventListener('change', restoreData);
    get('payment-link-input').addEventListener('input', (e) => {
        localStorage.setItem('paymentLink', e.target.value);
        generateQRCode(e.target.value);
    });

    // --- CORE FUNCTIONS ---

    function addItem(product) {
        const itemId = `item-${Date.now()}`;
        const itemDiv = document.createElement('div');
        itemDiv.classList.add('item');
        itemDiv.id = itemId;

        const nameInput = document.createElement('input');
        nameInput.type = 'text';
        nameInput.placeholder = 'Item Name';
        nameInput.list = 'product-datalist';
        nameInput.value = product ? product.name : '';
        nameInput.addEventListener('input', (e) => {
            const foundProduct = productCatalog.find(p => p.name === e.target.value);
            if (foundProduct) {
                priceInput.value = foundProduct.price;
                updateCalculations();
            }
        });

        const qtyInput = document.createElement('input');
        qtyInput.type = 'number';
        qtyInput.placeholder = 'Qty';
        qtyInput.value = 1;
        qtyInput.min = 1;

        const priceInput = document.createElement('input');
        priceInput.type = 'number';
        priceInput.placeholder = 'Price';
        priceInput.value = product ? product.price : '';
        priceInput.min = 0;

        const removeBtn = document.createElement('button');
        removeBtn.textContent = '×';
        removeBtn.classList.add('remove-item-btn');
        removeBtn.onclick = () => {
            itemsList.removeChild(itemDiv);
            updateCalculations();
        };

        [nameInput, qtyInput, priceInput, discountInput, deliveryChargeInput].forEach(el => {
            el.addEventListener('input', updateCalculations);
        });

        itemDiv.append(nameInput, qtyInput, priceInput, removeBtn);
        itemsList.appendChild(itemDiv);
        updateCalculations();
    }

    function updatePreviews() {
        businessNamePreview.textContent = businessName.value || 'Your Business';
        customerNamePreview.textContent = customerName.value || 'N/A';
        customerPhonePreview.textContent = customerPhone.value || 'N/A';
        receiptDatePreview.textContent = receiptDate.value;
    }

    function updateCalculations() {
        let subtotal = 0;
        receiptItemsBody.innerHTML = '';

        document.querySelectorAll('.item').forEach(item => {
            const name = item.querySelector('input[type="text"]').value;
            const qty = parseFloat(item.querySelector('input[type="number"]').value) || 0;
            const price = parseFloat(item.querySelector('input[type="number"]:last-of-type').value) || 0;
            const total = qty * price;

            if (name && qty && price) {
                const row = receiptItemsBody.insertRow();
                row.insertCell().textContent = name;
                row.insertCell().textContent = qty;
                row.insertCell().textContent = price.toFixed(2);
                row.insertCell().textContent = total.toFixed(2);
                subtotal += total;
            }
        });

        const discountPercentage = parseFloat(discountInput.value) || 0;
        const deliveryCharge = parseFloat(deliveryChargeInput.value) || 0;

        const discount = subtotal * (discountPercentage / 100);
        const grandTotal = subtotal - discount + deliveryCharge;

        subtotalAmount.textContent = subtotal.toFixed(2);
        discountAmount.textContent = discount.toFixed(2);
        deliveryAmount.textContent = deliveryCharge.toFixed(2);
        grandTotalAmount.textContent = grandTotal.toFixed(2);
    }

    function downloadReceipt() {
        showToast('Generating Receipt...');
        const receipt = get('receipt-preview');
        html2canvas(receipt, { scale: 3 }).then(canvas => {
            const link = document.createElement('a');
            link.download = `receipt-${customerName.value || 'customer'}-${Date.now()}.png`;
            link.href = canvas.toDataURL();
            link.click();
            saveSale();
        });
    }

    function printReceipt() {
        window.print();
        saveSale();
    }

    function shareViaWhatsApp() {
        const grandTotal = grandTotalAmount.textContent;
        const business = businessName.value;
        const text = `Hello ${customerName.value || ''}, here is your receipt from ${business}. The total amount is Rs. ${grandTotal}.`;
        const url = `https://wa.me/${customerPhone.value}?text=${encodeURIComponent(text)}`;
        if (customerPhone.value) {
            window.open(url, '_blank');
        } else {
            showToast('Please enter a customer phone number.', true);
        }
    }

    function saveSale() {
        const sale = {
            id: Date.now(),
            customer: customerName.value,
            date: receiptDate.value,
            total: parseFloat(grandTotalAmount.textContent),
            items: Array.from(document.querySelectorAll('.item')).map(item => ({
                name: item.querySelector('input[type="text"]').value,
                qty: item.querySelector('input[type="number"]').value,
                price: item.querySelector('input[type="number"]:last-of-type').value
            }))
        };
        salesHistory.push(sale);
        localStorage.setItem('salesHistory', JSON.stringify(salesHistory));

        if (!customers.some(c => c.name === customerName.value)) {
            customers.push({ name: customerName.value, phone: customerPhone.value });
            localStorage.setItem('customers', JSON.stringify(customers));
            renderCustomers();
        }
        showToast('Sale saved successfully!');
    }

    // --- PWA ---
    if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
            navigator.serviceWorker.register('/sw.js').then(registration => {
                console.log('ServiceWorker registration successful with scope: ', registration.scope);
            }, err => {
                console.log('ServiceWorker registration failed: ', err);
            });
        });
    }


    // --- UI & THEME ---
    function switchTemplate() {
        get('receipt-preview').classList.toggle('a4-invoice', this.checked);
        get('receipt-preview').classList.toggle('thermal', !this.checked);
    }
    
    function switchLanguage() {
        const lang = this.checked ? 'si' : 'en';
        document.querySelectorAll('[data-lang-en]').forEach(el => {
            el.innerText = el.getAttribute(`data-lang-${lang}`);
        });
    }

    function handleLogoUpload(event) {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                logoPreview.src = e.target.result;
                logoPreview.style.display = 'block';
                localStorage.setItem('businessLogo', e.target.result);
            };
            reader.readAsDataURL(file);
        }
    }

    function loadBusinessProfile() {
        businessName.value = localStorage.getItem('businessName') || '';
        const logo = localStorage.getItem('businessLogo');
        if (logo) {
            logoPreview.src = logo;
            logoPreview.style.display = 'block';
        }
        const paymentLink = localStorage.getItem('paymentLink') || '';
        get('payment-link-input').value = paymentLink;
        generateQRCode(paymentLink);
    }

    function saveBusinessProfile() {
        localStorage.setItem('businessName', businessName.value);
    }

    function generateQRCode(text) {
        qrCodeContainer.innerHTML = '';
        if (text) {
            qrCode = new QRCode(qrCodeContainer, {
                text: text,
                width: 100,
                height: 100,
            });
        }
    }


    // --- MODAL & CATALOG ---
    function setupModal(modal, openBtn, onOpen) {
        const closeBtn = modal.querySelector('.close-btn');
        openBtn.onclick = () => {
            modal.style.display = 'block';
            if (onOpen) onOpen();
        };
        closeBtn.onclick = () => modal.style.display = 'none';
        window.onclick = (event) => {
            if (event.target == modal) {
                modal.style.display = 'none';
            }
        };
    }

    function addProductToCatalog(e) {
        e.preventDefault();
        const name = get('product-name-input').value;
        const price = get('product-price-input').value;
        const barcode = get('product-barcode-input').value;

        if (name && price) {
            const existingProduct = productCatalog.find(p => p.name === name);
            if(existingProduct){
                existingProduct.price = price;
                existingProduct.barcode = barcode;
            } else {
                productCatalog.push({ name, price, barcode });
            }
            localStorage.setItem('productCatalog', JSON.stringify(productCatalog));
            renderProductCatalog();
            e.target.reset();
        }
    }

    function renderProductCatalog() {
        const list = get('product-list');
        const datalist = get('product-datalist');
        list.innerHTML = '';
        datalist.innerHTML = '';
        productCatalog.forEach(product => {
            const div = document.createElement('div');
            div.innerHTML = `${product.name} - Rs.${product.price} (Barcode: ${product.barcode || 'N/A'}) <button data-name="${product.name}">X</button>`;
            list.appendChild(div);

            const option = document.createElement('option');
            option.value = product.name;
            datalist.appendChild(option);
        });
        
        list.querySelectorAll('button').forEach(btn => {
            btn.onclick = (e) => {
                productCatalog = productCatalog.filter(p => p.name !== e.target.dataset.name);
                localStorage.setItem('productCatalog', JSON.stringify(productCatalog));
                renderProductCatalog();
            };
        });
    }
    
    function renderCustomers() {
        const datalist = get('customers-datalist');
        datalist.innerHTML = '';
        customers.forEach(customer => {
            const option = document.createElement('option');
            option.value = customer.name;
            datalist.appendChild(option);
        });
    }

    // --- DASHBOARD ---
    function renderSalesDashboard() {
        // ... (sales dashboard logic remains the same)
    }

    // --- DATA MANAGEMENT ---
    function backupData() {
        const data = {
            productCatalog,
            customers,
            salesHistory,
            businessName: businessName.value,
            businessLogo: localStorage.getItem('businessLogo'),
            paymentLink: get('payment-link-input').value,
        };
        const blob = new Blob([JSON.stringify(data)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'instabill_backup.json';
        a.click();
        URL.revokeObjectURL(url);
    }

    function restoreData(event) {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const data = JSON.parse(e.target.result);
                    productCatalog = data.productCatalog || [];
                    customers = data.customers || [];
                    salesHistory = data.salesHistory || [];
                    
                    localStorage.setItem('productCatalog', JSON.stringify(productCatalog));
                    localStorage.setItem('customers', JSON.stringify(customers));
                    localStorage.setItem('salesHistory', JSON.stringify(salesHistory));
                    
                    if(data.businessName) businessName.value = data.businessName;
                    if(data.businessLogo) {
                        logoPreview.src = data.businessLogo;
                        localStorage.setItem('businessLogo', data.businessLogo);
                    }
                    if(data.paymentLink) {
                        get('payment-link-input').value = data.paymentLink;
                        localStorage.setItem('paymentLink', data.paymentLink);
                    }
                    
                    loadBusinessProfile();
                    updatePreviews();
                    renderProductCatalog();
                    renderCustomers();
                    showToast('Data restored successfully!');

                } catch (err) {
                    showToast('Invalid backup file.', true);
                }
            };
            reader.readAsText(file);
        }
    }


    // --- BARCODE SCANNER ---
    let html5QrCode;
    function startBarcodeScanner() {
        html5QrCode = new Html5Qrcode("barcode-scanner");
        const config = { fps: 10, qrbox: { width: 250, height: 250 } };
        html5QrCode.start({ facingMode: "environment" }, config, onScanSuccess)
            .catch(err => console.log(`Unable to start scanning, error: ${err}`));
    }
    
    function onScanSuccess(decodedText, decodedResult) {
        const product = productCatalog.find(p => p.barcode === decodedText);
        if(product) {
            addItem(product);
            showToast(`Added ${product.name} from barcode.`);
        } else {
            showToast('Product not found for this barcode.', true);
        }
        html5QrCode.stop().then(() => {
            barcodeScannerModal.style.display = 'none';
        });
    }


    // --- UTILITY ---
    function showToast(message, isError = false) {
        const toast = get('toast');
        toast.textContent = message;
        toast.style.backgroundColor = isError ? '#dc3545' : '#28a745';
        toast.classList.add('show');
        setTimeout(() => toast.classList.remove('show'), 3000);
    }
});
