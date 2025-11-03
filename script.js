// DOM Elements
const balance = document.getElementById('balance');
const moneyPlus = document.getElementById('money-plus');
const moneyMinus = document.getElementById('money-minus');
const list = document.getElementById('list');
const form = document.getElementById('form');
const textInput = document.getElementById('text');
const amountInput = document.getElementById('amount');
const categoryInput = document.getElementById('category');
const dateInput = document.getElementById('date');
const filterCategory = document.getElementById('filter-category');
const filterType = document.getElementById('filter-type');
const clearAllBtn = document.getElementById('clear-all');

// Initialize transactions from localStorage or empty array
let transactions = JSON.parse(localStorage.getItem('transactions')) || [];
let transactionIdCounter = JSON.parse(localStorage.getItem('transactionIdCounter')) || 1;

// Set today's date as default
dateInput.valueAsDate = new Date();

// Initialize app
function init() {
    list.innerHTML = '';
    displayTransactions();
    updateValues();
    updateChart();
}

// Display transactions based on filters
function displayTransactions() {
    const filteredTransactions = getFilteredTransactions();
    
    list.innerHTML = '';
    
    if (filteredTransactions.length === 0) {
        list.innerHTML = '<li style="text-align: center; color: #7f8c8d;">No transactions found</li>';
        return;
    }
    
    filteredTransactions.forEach(addTransactionDOM);
}

// Get filtered transactions
function getFilteredTransactions() {
    let filtered = [...transactions];
    
    // Filter by category
    if (filterCategory.value !== 'all') {
        filtered = filtered.filter(t => t.category === filterCategory.value);
    }
    
    // Filter by type
    if (filterType.value !== 'all') {
        if (filterType.value === 'income') {
            filtered = filtered.filter(t => t.amount > 0);
        } else if (filterType.value === 'expense') {
            filtered = filtered.filter(t => t.amount < 0);
        }
    }
    
    // Sort by date (newest first)
    filtered.sort((a, b) => new Date(b.date) - new Date(a.date));
    
    return filtered;
}

// Add transaction to DOM
function addTransactionDOM(transaction) {
    const sign = transaction.amount < 0 ? '-' : '+';
    const item = document.createElement('li');
    
    item.classList.add(transaction.amount < 0 ? 'minus' : 'plus');
    
    const formattedDate = new Date(transaction.date).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
    
    item.innerHTML = `
        <div class="transaction-info">
            <div class="transaction-text">${transaction.text}</div>
            <div class="transaction-meta">
                <span>${transaction.category}</span> • 
                <span>${formattedDate}</span>
            </div>
        </div>
        <span class="transaction-amount">${sign}₹${Math.abs(transaction.amount).toFixed(2)}</span>
        <button class="delete-btn" onclick="removeTransaction(${transaction.id})">Delete</button>
    `;
    
    list.appendChild(item);
}

// Update balance, income and expense
function updateValues() {
    const amounts = transactions.map(t => t.amount);
    
    const total = amounts.reduce((acc, item) => acc + item, 0).toFixed(2);
    const income = amounts
        .filter(item => item > 0)
        .reduce((acc, item) => acc + item, 0)
        .toFixed(2);
    const expense = (amounts
        .filter(item => item < 0)
        .reduce((acc, item) => acc + item, 0) * -1)
        .toFixed(2);
    
    balance.innerText = `₹${total}`;
    moneyPlus.innerText = `+₹${income}`;
    moneyMinus.innerText = `-₹${expense}`;

    // Change balance color based on value
    if (total >= 0) {
        balance.style.color = 'white';
    } else {
        balance.style.color = '#ffcccc';
    }
}

// Add transaction
function addTransaction(e) {
    e.preventDefault();
    
    if (textInput.value.trim() === '' || amountInput.value.trim() === '' || 
        categoryInput.value === '' || dateInput.value === '') {
        alert('Please fill in all fields');
        return;
    }
    
    const transaction = {
        id: transactionIdCounter++,
        text: textInput.value.trim(),
        amount: parseFloat(amountInput.value),
        category: categoryInput.value,
        date: dateInput.value
    };
    
    transactions.push(transaction);
    
    addTransactionDOM(transaction);
    updateValues();
    updateLocalStorage();
    updateChart();
    
    // Reset form
    textInput.value = '';
    amountInput.value = '';
    categoryInput.value = '';
    dateInput.valueAsDate = new Date();
    
    // Show success animation
    showNotification('Transaction added successfully!', 'success');
}

// Remove transaction
function removeTransaction(id) {
    if (confirm('Are you sure you want to delete this transaction?')) {
        transactions = transactions.filter(t => t.id !== id);
        updateLocalStorage();
        init();
        showNotification('Transaction deleted', 'info');
    }
}

// Clear all transactions
function clearAllTransactions() {
    if (confirm('Are you sure you want to delete ALL transactions? This action cannot be undone.')) {
        transactions = [];
        transactionIdCounter = 1;
        updateLocalStorage();
        init();
        showNotification('All transactions cleared', 'info');
    }
}

// Update localStorage
function updateLocalStorage() {
    localStorage.setItem('transactions', JSON.stringify(transactions));
    localStorage.setItem('transactionIdCounter', JSON.stringify(transactionIdCounter));
}

// Show notification
function showNotification(message, type) {
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 15px 20px;
        background: ${type === 'success' ? '#2ecc71' : '#3498db'};
        color: white;
        border-radius: 8px;
        box-shadow: 0 3px 10px rgba(0,0,0,0.2);
        z-index: 1000;
        animation: slideIn 0.3s ease;
    `;
    notification.textContent = message;
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// Update expense chart
function updateChart() {
    const ctx = document.getElementById('expense-chart');
    
    if (!ctx) return;
    
    // Get expense data by category
    const expensesByCategory = {};
    transactions
        .filter(t => t.amount < 0)
        .forEach(t => {
            if (!expensesByCategory[t.category]) {
                expensesByCategory[t.category] = 0;
            }
            expensesByCategory[t.category] += Math.abs(t.amount);
        });
    
    const categories = Object.keys(expensesByCategory);
    const amounts = Object.values(expensesByCategory);
    
    // Destroy existing chart if it exists
    if (window.expenseChart) {
        window.expenseChart.destroy();
    }
    
    // Create new chart
    if (categories.length > 0) {
        window.expenseChart = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: categories.map(cat => cat.charAt(0).toUpperCase() + cat.slice(1)),
                datasets: [{
                    data: amounts,
                    backgroundColor: [
                        '#FF6384',
                        '#36A2EB',
                        '#FFCE56',
                        '#4BC0C0',
                        '#9966FF',
                        '#FF9F40',
                        '#FF6384',
                        '#C9CBCF',
                        '#4BC0C0',
                        '#FF9F40'
                    ],
                    borderWidth: 2,
                    borderColor: '#fff'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            padding: 15,
                            font: {
                                size: 12
                            }
                        }
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const label = context.label || '';
                                const value = '$' + context.parsed.toFixed(2);
                                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                const percentage = ((context.parsed / total) * 100).toFixed(1);
                                return `${label}: ${value} (${percentage}%)`;
                            }
                        }
                    }
                }
            }
        });
    } else {
        ctx.getContext('2d').clearRect(0, 0, ctx.width, ctx.height);
        ctx.getContext('2d').font = '16px Arial';
        ctx.getContext('2d').fillStyle = '#7f8c8d';
        ctx.getContext('2d').textAlign = 'center';
        ctx.getContext('2d').fillText('No expense data available', ctx.width / 2, ctx.height / 2);
    }
}

// Event Listeners
form.addEventListener('submit', addTransaction);
filterCategory.addEventListener('change', displayTransactions);
filterType.addEventListener('change', displayTransactions);
clearAllBtn.addEventListener('click', clearAllTransactions);

// Add CSS animation for notifications
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes slideOut {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(100%);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);

// Initialize app on load
init();

// Add keyboard shortcuts
document.addEventListener('keydown', (e) => {
    // Ctrl/Cmd + N to focus on new transaction form
    if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
        e.preventDefault();
        textInput.focus();
    }
    
    // Escape to clear form
    if (e.key === 'Escape') {
        textInput.value = '';
        amountInput.value = '';
        categoryInput.value = '';
        dateInput.valueAsDate = new Date();
    }
});

// Export data functionality (optional)
function exportData() {
    const dataStr = JSON.stringify(transactions, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    const exportFileDefaultName = `expense_tracker_${new Date().toISOString().split('T')[0]}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
}

// Import data functionality (optional)
function importData(file) {
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const imported = JSON.parse(e.target.result);
            if (Array.isArray(imported)) {
                transactions = imported;
                updateLocalStorage();
                init();
                showNotification('Data imported successfully!', 'success');
            }
        } catch (error) {
            alert('Invalid file format');
        }
    };
    reader.readAsText(file);
}
