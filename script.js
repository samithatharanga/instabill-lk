document.addEventListener('DOMContentLoaded', () => {
    const customerNameInput = document.getElementById('customer-name');
    const receiptDateInput = document.getElementById('receipt-date');
    const addItemBtn = document.getElementById('add-item-btn');
    const itemsList = document.getElementById('items-list');
    const downloadBtn = document.getElementById('download-btn');
    const customerNamePreview = document.getElementById('customer-name-preview');
    const receiptDatePreview = document.getElementById('receipt-date-preview');
    const receiptItemsBody = document.getElementById('receipt-items-body');
    const totalAmount = document.getElementById('total-amount');

    const updatePreview = () => {
        customerNamePreview.textContent = customerNameInput.value;
        receiptDatePreview.textContent = receiptDateInput.value;

        receiptItemsBody.innerHTML = '';
        let currentTotal = 0;

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

            currentTotal += total;
        });

        totalAmount.textContent = currentTotal.toFixed(2);
    };

    const createItemInputs = () => {
        const itemDiv = document.createElement('div');
        itemDiv.classList.add('item');
        itemDiv.innerHTML = `
            <input type="text" class="item-name" placeholder="Item Name">
            <input type="number" class="item-qty" placeholder="Qty" min="1">
            <input type="number" class="item-price" placeholder="Price" min="0">
        `;
        itemsList.appendChild(itemDiv);

        itemDiv.querySelectorAll('input').forEach(input => {
            input.addEventListener('input', updatePreview);
        });
    };

    addItemBtn.addEventListener('click', createItemInputs);
    customerNameInput.addEventListener('input', updatePreview);
    receiptDateInput.addEventListener('input', updatePreview);

    downloadBtn.addEventListener('click', () => {
        const receiptPreview = document.getElementById('receipt-preview');
        html2canvas(receiptPreview).then(canvas => {
            const link = document.createElement('a');
            link.download = 'receipt.png';
            link.href = canvas.toDataURL('image/png');
            link.click();
        });
    });

    createItemInputs();
});
