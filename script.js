
// This is the complete, corrected function. 
// Replace the old renderSalesDashboard function entirely with this one.
function renderSalesDashboard() {
    const today = new Date().toISOString().slice(0, 10);

    // Correctly filter for today's paid invoices
    const todaysSales = state.salesHistory.filter(s => s.dateTime.startsWith(today) && s.status === 'paid' && s.documentType === 'invoice');
    const todaysExpenses = state.expenses.filter(exp => exp.date === today);

    const totalSales = todaysSales.reduce((acc, sale) => acc + sale.total, 0);
    const totalExpenses = todaysExpenses.reduce((acc, exp) => acc + exp.amount, 0);
    const netProfit = totalSales - totalExpenses;

    // Update the DOM with calculated totals
    document.getElementById('total-sales').textContent = `Rs. ${totalSales.toFixed(2)}`;
    document.getElementById('total-expenses').textContent = `Rs. ${totalExpenses.toFixed(2)}`;
    document.getElementById('net-profit').textContent = `Rs. ${netProfit.toFixed(2)}`;

    // --- Chart Logic (Last 7 Days) ---
    const salesByDay = {};
    for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        salesByDay[d.toISOString().slice(0, 10)] = 0;
    }

    state.salesHistory.forEach(sale => {
        const saleDate = sale.dateTime.slice(0, 10);
        if (salesByDay.hasOwnProperty(saleDate) && sale.status === 'paid' && sale.documentType === 'invoice') {
            salesByDay[saleDate] += sale.total;
        }
    });

    const chartLabels = Object.keys(salesByDay);
    const chartData = Object.values(salesByDay);

    const ctx = document.getElementById('sales-chart').getContext('2d');
    if (state.salesChart) {
        state.salesChart.destroy(); // Destroy old chart instance to prevent conflicts
    }
    state.salesChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: chartLabels.map(label => new Date(label).toLocaleDateString('en-US', { day: 'numeric', month: 'short' })),
            datasets: [{
                label: 'Daily Sales',
                data: chartData,
                backgroundColor: 'rgba(0, 123, 255, 0.7)',
                borderColor: 'rgba(0, 123, 255, 1)',
                borderWidth: 1,
                borderRadius: 4
            }]
        },
        options: { 
            responsive: true, 
            maintainAspectRatio: false, 
            scales: { y: { beginAtZero: true } },
            plugins: { legend: { display: false } } 
        }
    });

    // --- Recent Sales History List ---
    const salesHistoryList = document.getElementById('sales-history-list');
    // Filter out quotations and show most recent first
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
