
QUnit.module('InstaBill Tests', {
  beforeEach: function() {
    // It's possible that the resetForm function or other parts of the script
    // aren't available globally. If so, you might need to expose them
    // for testing purposes, or reconsider the testing strategy.
    if (typeof resetForm === "function") {
        resetForm();
    }
    localStorage.clear();
    if (typeof initializeApp === "function") {
        initializeApp();
    }
  }
});

QUnit.test('addItem function', function(assert) {
  const itemsList = document.getElementById('items-list');
  assert.equal(itemsList.children.length, 0, 'Initially, there are no items');
  
  // Mock addItem if it's not globally accessible
  if (typeof addItem === "function") {
      addItem();
      assert.equal(itemsList.children.length, 1, 'addItem should add one item');
      addItem();
      assert.equal(itemsList.children.length, 2, 'addItem should add a second item');
  } else {
      assert.ok(false, "addItem function is not defined globally.");
  }
});

QUnit.test('getFormData function', function(assert) {
  if (typeof getFormData === "function" && typeof addItem === "function") {
    document.getElementById('customer-name').value = 'John Doe';
    document.getElementById('customer-phone').value = '1234567890';
    // Clear previous items and add a new one for a clean test
    document.getElementById('items-list').innerHTML = '';
    addItem({ name: 'Product 1', qty: 2, price: 100 });
    
    const formData = getFormData();
    
    assert.equal(formData.customerName, 'John Doe', 'Correct customer name');
    assert.equal(formData.customerPhone, '1234567890', 'Correct customer phone');
    assert.equal(formData.items.length, 1, 'Correct number of items');
    assert.equal(formData.items[0].name, 'Product 1', 'Correct item name');
    assert.equal(formData.items[0].qty, 2, 'Correct item quantity');
    assert.equal(formData.items[0].price, 100, 'Correct item price');
  } else {
    assert.ok(false, "getFormData or addItem function is not defined globally.");
  }
});

QUnit.test('calculations in renderReceipt', function(assert) {
    if (typeof renderReceipt === "function") {
        const data = {
            items: [{ name: 'Test Item', qty: 2, price: 50 }],
            discountType: 'percentage',
            discountValue: 10, // 10%
            deliveryCharge: 20,
            advancePayment: 30,
            applyVat: true,
            applySscl: false,
            dateTime: new Date(),
            businessName: 'Test Biz',
            customerName: 'Test Cust',
            paymentLink: ''
        };
        renderReceipt(data);
        const subtotal = parseFloat(document.getElementById('subtotal-amount').textContent);
        const discount = parseFloat(document.getElementById('discount-amount').textContent);
        const vat = parseFloat(document.getElementById('vat-amount').textContent);
        const grandTotal = parseFloat(document.getElementById('grand-total-amount').textContent);
        const balanceDue = parseFloat(document.getElementById('balance-due-amount').textContent);

        assert.equal(subtotal, 100.00, 'Subtotal is correct');
        assert.equal(discount, -10.00, 'Discount is correct');
        assert.equal(vat, 16.20, 'VAT is correct'); // (100 - 10) * 0.18 = 16.2
        assert.equal(grandTotal, 126.20, 'Grand total is correct'); // 90 + 16.2 + 20
        assert.equal(balanceDue, 96.20, 'Balance due is correct'); // 126.20 - 30
    } else {
        assert.ok(false, "renderReceipt is not defined globally.");
    }
});
