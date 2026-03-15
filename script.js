document.addEventListener('DOMContentLoaded', () => {
    // Form Inputs
    const businessNameInput = document.getElementById('business-name');
    const businessLogoUpload = document.getElementById('business-logo-upload');
    const customerNameInput = document.getElementById('customer-name');
    const customerPhoneInput = document.getElementById('customer-phone');
    const receiptDateInput = document.getElementById('receipt-date');
    const addItemBtn = document.getElementById('add-item-btn');
    const itemsList = document.getElementById('items-list');
    const discountInput = document.getElementById('discount');
    const deliveryChargeInput = document.getElementById('delivery-charge');

    // Action Buttons
    const finalizeBtn = document.getElementById('finalize-btn');
    const whatsappBtn = document.getElementById('whatsapp-btn');

    // Receipt Preview Elements
    const logoPreview = document.getElementById('logo-preview');
    const businessNamePreview = document.getElementById('business-name-preview');
    const customerNamePreview = document.getElementById('customer-name-preview');
    const customerPhonePreview = document.getElementById('customer-phone-preview');
    const receiptDatePreview = document.getElementById('receipt-date-preview');
    const receiptItemsBody = document.getElementById('receipt-items-body');
    const subtotalAmount = document.getElementById('subtotal-amount');
    const discountAmount = document.getElementById('discount-amount');
    const deliveryAmount = document.getElementById('delivery-amount');
    const grandTotalAmount = document.getElementById('grand-total-amount');
    const qrCodeContainer = document.getElementById('qr-code-container');

    // Modals
    const productCatalogModal = document.getElementById('product-catalog-modal');
    const salesDashboardModal = document.getElementById('sales-dashboard-modal');
    const settingsModal = document.getElementById('settings-modal');

    // Modal Triggers
    const openCatalogBtn = document.getElementById('open-catalog-btn');
    const openDashboardBtn = document.getElementById('open-dashboard-btn');
    const openSettingsBtn = document.getElementById('open-settings-btn');

    // Settings
    const paymentLinkInput = document.getElementById('payment-link-input');
    const backupDataBtn = document.getElementById('backup-data-btn');
    const restoreDataBtn = document.getElementById('restore-data-btn');
    const restoreDataInput = document.getElementById('restore-data-input');

    let salesChart;
    let qrcode;

    // --- Data Management ---
    const getFromStorage = (key) => JSON.parse(localStorage.getItem(key)) || [];
    const saveToStorage = (key, data) => localStorage.setItem(key, JSON.stringify(data));

    // --- Business Profile (Auto-Save) ---
    const loadBusinessProfile = () => {
        const savedBusinessName = localStorage.getItem('businessName');
        const savedBusinessLogo = localStorage.getItem('businessLogo');
        const savedPaymentLink = localStorage.getItem('paymentLink');

        if (savedBusinessName) {
            businessNameInput.value = savedBusinessName;
            businessNamePreview.textContent = savedBusinessName;
        }
        if (savedBusinessLogo) {
            logoPreview.src = savedBusinessLogo;
            logoPreview.style.display = 'block';
        }
        if (savedPaymentLink) {
            paymentLinkInput.value = savedPaymentLink;
            generateQRCode(savedPaymentLink);
        }
        updatePreview();
    };

    businessNameInput.addEventListener('input', () => {
        localStorage.setItem('businessName', businessNameInput.value);
        updatePreview();
    });

    businessLogoUpload.addEventListener('change', (event) => {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                const logoDataUrl = e.target.result;
                localStorage.setItem('businessLogo', logoDataUrl);
                logoPreview.src = logoDataUrl;
                logoPreview.style.display = 'block';
                updatePreview();
            };
            reader.readAsDataURL(file);
        }
    });

    // --- Customer CRM ---
    const loadCustomers = () => {
        const customers = getFromStorage('customers');
        const datalist = document.getElementById('customers-datalist');
        datalist.innerHTML = '';
        customers.forEach(customer => {
            const option = document.createElement('option');
            option.value = customer.name;
            datalist.appendChild(option);
        });
    };

    customerNameInput.addEventListener('input', () => {
        const customers = getFromStorage('customers');
        const selectedCustomer = customers.find(c => c.name === customerNameInput.value);
        if (selectedCustomer) {
            customerPhoneInput.value = selectedCustomer.phone;
        }
        updatePreview();
    });

    const saveCustomer = (name, phone) => {
        if (!name) return;
        const customers = getFromStorage('customers');
        const existingCustomerIndex = customers.findIndex(c => c.name === name);
        if (existingCustomerIndex > -1) {
            customers[existingCustomerIndex].phone = phone;
        } else {
            customers.push({ name, phone });
        }
        saveToStorage('customers', customers);
        loadCustomers();
    };

    // --- Main Update Function ---
    const updatePreview = () => {
        // Business & Customer Info
        businessNamePreview.textContent = businessNameInput.value.toUpperCase();
        customerNamePreview.textContent = customerNameInput.value;
        customerPhonePreview.textContent = customerPhoneInput.value;
        receiptDatePreview.textContent = receiptDateInput.value;

        // Items
        receiptItemsBody.innerHTML = '';
        let currentSubtotal = 0;
        const items = itemsList.querySelectorAll('.item');

        items.forEach(item => {
            const name = item.querySelector('.item-name').value;
            const qty = parseFloat(item.querySelector('.item-qty').value) || 0;
            const price = parseFloat(item.querySelector('.item-price').value) || 0;
            const total = qty * price;

            if (name) {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${name}</td>
                    <td>${qty}</td>
                    <td>${price.toFixed(2)}</td>
                    <td>${total.toFixed(2)}</td>
                `;
                receiptItemsBody.appendChild(row);
            }
            currentSubtotal += total;
        });

        // Calculations
        const discountPercentage = parseFloat(discountInput.value) || 0;
        const delivery = parseFloat(deliveryChargeInput.value) || 0;
        const discountValue = (currentSubtotal * discountPercentage) / 100;
        const grandTotal = currentSubtotal - discountValue + delivery;

        // Update Receipt UI
        subtotalAmount.textContent = currentSubtotal.toFixed(2);
        discountAmount.textContent = discountValue.toFixed(2);
        deliveryAmount.textContent = delivery.toFixed(2);
        grandTotalAmount.textContent = grandTotal.toFixed(2);
    };

    const createItemInputs = () => {
        const itemDiv = document.createElement('div');
        itemDiv.classList.add('item');
        itemDiv.innerHTML = `
            <input type="text" class="item-name" placeholder="Item Name" list="product-datalist">
            <input type="number" class="item-qty" placeholder="Qty" min="1">
            <input type="number" class="item-price" placeholder="Price" min="0">
            <button class="remove-item-btn">X</button>
        `;
        itemsList.appendChild(itemDiv);

        itemDiv.querySelectorAll('input').forEach(input => {
            input.addEventListener('input', updatePreview);
        });

        itemDiv.querySelector('.remove-item-btn').addEventListener('click', () => {
            itemDiv.remove();
            updatePreview();
        });
    };

    // --- Event Listeners ---
    addItemBtn.addEventListener('click', createItemInputs);
    customerPhoneInput.addEventListener('input', updatePreview);
    receiptDateInput.addEventListener('input', updatePreview);
    discountInput.addEventListener('input', updatePreview);
    deliveryChargeInput.addEventListener('input', updatePreview);

    finalizeBtn.addEventListener('click', () => {
        saveCustomer(customerNameInput.value, customerPhoneInput.value);
        const receiptPreview = document.getElementById('receipt-preview');
        html2canvas(receiptPreview, { scale: 3 }).then(canvas => {
            const link = document.createElement('a');
            link.download = `receipt-${customerNameInput.value || 'customer'}.png`;
            link.href = canvas.toDataURL('image/png');
            link.click();
        });
        saveSale();
    });

    whatsappBtn.addEventListener('click', () => {
        let message = `*--- ${businessNameInput.value || 'Receipt'} ---*\n\n`;
        message += `*Customer:* ${customerNameInput.value}\n`;
        if (customerPhoneInput.value) message += `*Phone:* ${customerPhoneInput.value}\n`;
        message += `*Date:* ${receiptDateInput.value}\n\n`;
        message += '*Items:*\n';

        const items = itemsList.querySelectorAll('.item');
        items.forEach(item => {
            const name = item.querySelector('.item-name').value;
            const qty = item.querySelector('.item-qty').value;
            const price = parseFloat(item.querySelector('.item-price').value).toFixed(2);
            if (name) {
                message += `- ${name} (Qty: ${qty}, Price: ${price})\n`;
            }
        });

        message += `\n*Subtotal:* Rs. ${subtotalAmount.textContent}\n`;
        message += `*Discount:* Rs. ${discountAmount.textContent}\n`;
        message += `*Delivery:* Rs. ${deliveryAmount.textContent}\n`;
        message += `*Grand Total:* Rs. ${grandTotalAmount.textContent}\n\n`;
        message += `_Thank you for your business!_`;

        const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
        window.open(whatsappUrl, '_blank');
    });

    // --- QR Code ---
    const generateQRCode = (text) => {
        if (!text) {
            qrCodeContainer.innerHTML = '';
            return;
        }
        if (qrcode) {
            qrcode.clear();
            qrcode.makeCode(text);
        } else {
            qrcode = new QRCode(qrCodeContainer, {
                text: text,
                width: 128,
                height: 128,
            });
        }
    };

    paymentLinkInput.addEventListener('input', (e) => {
        const link = e.target.value;
        localStorage.setItem('paymentLink', link);
        generateQRCode(link);
    });

    // --- Sales Dashboard ---
    const saveSale = () => {
        const sale = {
            date: new Date().toISOString(),
            customer: customerNameInput.value,
            total: parseFloat(grandTotalAmount.textContent),
        };
        const salesHistory = getFromStorage('salesHistory');
        salesHistory.push(sale);
        saveToStorage('salesHistory', salesHistory);
    };

    const loadSalesDashboard = () => {
        const salesHistory = getFromStorage('salesHistory');
        const salesHistoryList = document.getElementById('sales-history-list');
        salesHistoryList.innerHTML = '';

        let todaySales = 0;
        const today = new Date().toLocaleDateString();

        salesHistory.forEach(sale => {
            const saleDate = new Date(sale.date);
            if (saleDate.toLocaleDateString() === today) {
                todaySales += sale.total;
            }
            const saleItem = document.createElement('div');
            saleItem.innerHTML = `<p>${saleDate.toLocaleString()}: ${sale.customer} - Rs. ${sale.total.toFixed(2)}</p>`;
            salesHistoryList.prepend(saleItem);
        });

        document.getElementById('today-sales').textContent = `Rs. ${todaySales.toFixed(2)}`;
        updateSalesChart(salesHistory);
    };

    const updateSalesChart = (salesHistory) => {
        const last7Days = Array(7).fill(0).map((_, i) => {
            const d = new Date();
            d.setDate(d.getDate() - i);
            return d.toLocaleDateString();
        }).reverse();

        const salesData = last7Days.map(day => {
            return salesHistory
                .filter(sale => new Date(sale.date).toLocaleDateString() === day)
                .reduce((acc, sale) => acc + sale.total, 0);
        });

        const ctx = document.getElementById('sales-chart').getContext('2d');
        if (salesChart) {
            salesChart.destroy();
        }
        salesChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: last7Days,
                datasets: [{
                    label: 'Sales Revenue (Rs.)',
                    data: salesData,
                    backgroundColor: 'rgba(54, 162, 235, 0.6)',
                    borderColor: 'rgba(54, 162, 235, 1)',
                    borderWidth: 1
                }]
            },
            options: {
                scales: {
                    y: {
                        beginAtZero: true
                    }
                }
            }
        });
    };

    // --- Backup & Restore ---
    backupDataBtn.addEventListener('click', () => {
        const data = JSON.stringify(localStorage);
        const blob = new Blob([data], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'instabill_backup.json';
        link.click();
        URL.revokeObjectURL(url);
    });

    restoreDataBtn.addEventListener('click', () => restoreDataInput.click());

    restoreDataInput.addEventListener('change', (event) => {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const data = JSON.parse(e.target.result);
                    Object.keys(data).forEach(key => {
                        localStorage.setItem(key, data[key]);
                    });
                    showToast('Data restored successfully!');
                    // Reload everything
                    loadBusinessProfile();
                    loadCustomers();
                    loadProductCatalog();
                    loadSalesDashboard();
                } catch (error) {
                    showToast('Error restoring data. Invalid file format.', true);
                }
            };
            reader.readAsText(file);
        }
    });

    // --- Modals Logic ---
    const setupModals = () => {
        const modals = document.querySelectorAll('.modal');
        const closeBtns = document.querySelectorAll('.close-btn');

        const openModal = (modal) => modal.style.display = 'block';
        const closeModal = (modal) => modal.style.display = 'none';

        openCatalogBtn.onclick = () => openModal(productCatalogModal);
        openDashboardBtn.onclick = () => {
            loadSalesDashboard();
            openModal(salesDashboardModal);
        };
        openSettingsBtn.onclick = () => openModal(settingsModal);

        closeBtns.forEach(btn => {
            btn.onclick = () => modals.forEach(closeModal);
        });

        window.onclick = (event) => {
            modals.forEach(modal => {
                if (event.target == modal) {
                    closeModal(modal);
                }
            });
        };
    };

    // --- Product Catalog ---
    const loadProductCatalog = () => {
        const products = getFromStorage('products');
        const productList = document.getElementById('product-list');
        const productDatalist = document.getElementById('product-datalist');
        productList.innerHTML = '';
        productDatalist.innerHTML = '';

        products.forEach(product => {
            // Add to list in modal
            const productItem = document.createElement('div');
            productItem.innerHTML = `<p>${product.name} - Rs. ${product.price}</p>`;
            productList.appendChild(productItem);

            // Add to datalist for form
            const option = document.createElement('option');
            option.value = product.name;
            productDatalist.appendChild(option);
        });
    };

    document.getElementById('add-product-form').addEventListener('submit', (e) => {
        e.preventDefault();
        const nameInput = document.getElementById('product-name-input');
        const priceInput = document.getElementById('product-price-input');
        const products = getFromStorage('products');
        products.push({ name: nameInput.value, price: parseFloat(priceInput.value) });
        saveToStorage('products', products);
        loadProductCatalog();
        nameInput.value = '';
        priceInput.value = '';
    });

    // --- Toast Notification ---
    const showToast = (message, isError = false) => {
        const toast = document.getElementById('toast');
        toast.textContent = message;
        toast.className = 'show';
        toast.style.backgroundColor = isError ? '#dc3545' : '#28a745';
        setTimeout(() => { toast.className = toast.className.replace('show', ''); }, 3000);
    };

    // --- Initial Setup ---
    createItemInputs();
    loadBusinessProfile();
    loadCustomers();
    loadProductCatalog();
    setupModals();
    receiptDateInput.valueAsDate = new Date();
    updatePreview();
});