document.addEventListener('DOMContentLoaded', () => {
    // --- Basic Setup ---
    const API_URL = 'http://localhost:5000/api';

    // --- State Variables ---
    let fetchedProducts = [];
    let notificationsLog = [];

    // --- Element Selectors ---
    const mainTitle = document.getElementById('main-title');
    const navLinks = document.querySelectorAll('.nav-link');
    const contentSections = document.querySelectorAll('.content-section');
    const darkModeCheckbox = document.getElementById('dark-mode-checkbox');
    
    const addProductForm = document.getElementById('add-product-form');
    const productsTableBody = document.querySelector('#products-table tbody');
    const filterProductName = document.getElementById('filter-product-name');
    const filterProductCategory = document.getElementById('filter-product-category');

    const createOrderForm = document.getElementById('create-order-form');
    const orderProductIdSelect = document.getElementById('order-product-id');
    const ordersTableBody = document.querySelector('#orders-table tbody');
    const filterOrderStatus = document.getElementById('filter-order-status');
    const filterOrderProduct = document.getElementById('filter-order-product');

    const salesReportBtn = document.getElementById('sales-report-btn');
    const lowStockReportBtn = document.getElementById('low-stock-report-btn');
    const reportResultsDiv = document.getElementById('report-results');
    
    const notificationArea = document.getElementById('notification-area');
    const notificationBell = document.getElementById('notification-icon-container');
    const notificationBadge = document.getElementById('notification-badge');
    const notificationCenterOverlay = document.getElementById('notification-center-overlay');
    const notificationList = document.getElementById('notification-list');
    
    const historyModalOverlay = document.getElementById('history-modal-overlay');
    const historyModalTitle = document.getElementById('history-modal-title');
    const historyList = document.getElementById('history-list');

    // --- Navigation Logic ---
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const targetId = link.getAttribute('data-target');
            
            contentSections.forEach(section => section.classList.remove('active'));
            document.getElementById(targetId).classList.add('active');

            navLinks.forEach(nav => nav.classList.remove('active'));
            link.classList.add('active');

            mainTitle.textContent = link.querySelector('span').textContent;
        });
    });

    // --- Dark Mode Logic ---
    const setTheme = (theme) => {
        document.body.classList.toggle('dark-mode', theme === 'dark');
        darkModeCheckbox.checked = theme === 'dark';
        localStorage.setItem('theme', theme);
    };

    darkModeCheckbox.addEventListener('change', () => {
        setTheme(darkModeCheckbox.checked ? 'dark' : 'light');
    });

    const savedTheme = localStorage.getItem('theme') || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    setTheme(savedTheme);

    // --- Filter Handlers ---
    function applyProductFilters() {
        const params = new URLSearchParams();
        if (filterProductName.value) params.append('name', filterProductName.value);
        if (filterProductCategory.value) params.append('category', filterProductCategory.value);
        fetchProducts(params.toString());
    }

    function applyOrderFilters() {
        const params = new URLSearchParams();
        if (filterOrderStatus.value) params.append('status', filterOrderStatus.value);
        if (filterOrderProduct.value) params.append('productName', filterOrderProduct.value);
        fetchOrders(params.toString());
    }

    // --- Core Data Functions ---
    async function fetchProducts(query = '') {
        try {
            const res = await fetch(`${API_URL}/products?${query}`);
            const { data } = await res.json();
            fetchedProducts = data;

            productsTableBody.innerHTML = '';
            orderProductIdSelect.innerHTML = '<option value="">انتخاب کالا</option>';
            
            data.forEach(product => {
                const row = document.createElement('tr');
            row.innerHTML = `
                <td>${product.name}</td>
                <td>${product.stock}</td>
                <td>${product.price.toLocaleString()}</td>
                <td>${product.category}</td>
                <td>
                    <button onclick="showHistory('${product._id}')" title="نمایش تاریخچه">📜</button>
                    <button onclick="showAddStockPrompt('${product._id}')" title="افزایش موجودی" class="success">+</button>
                </td>
            `;
                productsTableBody.appendChild(row);

                const option = document.createElement('option');
                option.value = product._id;
                option.textContent = `${product.name} (موجودی: ${product.stock})`;
                orderProductIdSelect.appendChild(option);
            });
        } catch (err) {
            console.error('Error fetching products:', err);
        }
    }

    async function fetchOrders(query = '') {
        try {
            const res = await fetch(`${API_URL}/orders?${query}`);
            const { data } = await res.json();
            ordersTableBody.innerHTML = '';
            
            data.forEach(order => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${order.product.name}</td>
                    <td>${order.quantity}</td>
                    <td>${order.totalPrice.toLocaleString()}</td>
                    <td>${new Date(order.orderDate).toLocaleDateString('fa-IR')}</td>
                    <td>${order.status}</td>
                    <td>
                        ${order.status === 'در انتظار' ? `
                            <button onclick="updateStatus('${order._id}', 'ارسال شده')">ارسال</button>
                            <button onclick="updateStatus('${order._id}', 'لغو شده')" class="danger">لغو</button>
                        ` : ''}
                    </td>
                `;
                ordersTableBody.appendChild(row);
            });
        } catch (err) {
            console.error('Error fetching orders:', err);
        }
    }

    // --- UI Helper Functions ---
    window.showHistory = (productId) => {
            const product = fetchedProducts.find(p => p._id === productId);
            if (!product || !product.history || product.history.length === 0) {
                alert('تاریخچه‌ای برای این کالا ثبت نشده است.');
                return;
            }
            historyModalTitle.textContent = `تاریخچه کالای: ${product.name}`;
            historyList.innerHTML = '';
            product.history
                    .slice()
                    .reverse()
                    .forEach(entry => {
                        const entryType = entry.type.trim();
                        const typeClass = entryType === 'ورود' ? 'in' : 'out';

                        const li = document.createElement('li');
                        li.className = 'history-item';
                        
                        li.innerHTML = `
                            <span class="history-type ${typeClass}">${entryType}</span>
                            <span class="history-date">${new Date(entry.date).toLocaleString('fa-IR')}</span>
                            <span class="history-quantity">تعداد: ${entry.quantity}</span>
                        `;

                        historyList.appendChild(li);
                    });
            document.getElementById('history-modal-overlay').style.display = 'flex';
        };

    window.showAddStockPrompt = (productId) => {
        const quantityStr = prompt("تعداد مورد نظر برای افزایش را وارد کنید:", "10");

        if (quantityStr === null || quantityStr.trim() === "") {
            return; // کاربر کنسل کرده است
        }

        const quantity = parseInt(quantityStr, 10);

        if (isNaN(quantity) || quantity <= 0) {
            alert("لطفاً یک عدد صحیح و مثبت وارد کنید.");
            return;
        }

        // ارسال درخواست به API
        fetch(`${API_URL}/products/${productId}/add-stock`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ quantity: quantity }),
        })
        .then(res => {
            if (!res.ok) {
                throw new Error('خطا در افزایش موجودی');
            }
            return res.json();
        })
        .then(() => {
            console.log('موجودی با موفقیت افزایش یافت');
            fetchProducts(); // رفرش کردن جدول کالاها
        })
        .catch(err => {
            alert(err.message);
        });
    };


    function updateNotificationUI() {
        notificationList.innerHTML = '';
        if (notificationsLog.length === 0) {
            notificationList.innerHTML = '<li>هیچ اطلاعیه‌ای وجود ندارد.</li>';
        } else {
            notificationsLog.forEach(notif => {
                const li = document.createElement('li');
                li.textContent = `${new Date(notif.timestamp).toLocaleTimeString('fa-IR')} - ${notif.message}`;
                if (notif.unread) li.classList.add('unread');
                notificationList.appendChild(li);
            });
        }
        const unreadCount = notificationsLog.filter(n => n.unread).length;
        notificationBadge.style.display = unreadCount > 0 ? 'block' : 'none';
        notificationBadge.textContent = unreadCount;
    }

    function showNotification(message) {
        notificationsLog.unshift({ message, unread: true, timestamp: new Date() });
        const notificationPopup = document.createElement('div');
        notificationPopup.className = 'notification';
        notificationPopup.textContent = message;
        notificationArea.appendChild(notificationPopup);
        setTimeout(() => notificationPopup.remove(), 5000);
        updateNotificationUI();
    }

    async function checkAndNotifyLowStock() {
    try {
        const res = await fetch(`${API_URL}/products/low-stock`);
        const { data } = await res.json();
        
        // اگر کالای کم‌موجودی وجود داشت، بدون هیچ شرط اضافه‌ای نوتیفیکیشن را نشان بده
        if (data && data.length > 0) {
            const message = `هشدار موجودی کم: ${data.map(p => p.name).join(', ')}`;
            showNotification(message);
        }
    } catch (err) {
        console.error('Error in checkAndNotifyLowStock:', err);
    }
}
    
    // --- Event Listeners ---
    addProductForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const newProduct = { name: document.getElementById('product-name').value, stock: document.getElementById('product-stock').value, price: document.getElementById('product-price').value, category: document.getElementById('product-category').value };
        await fetch(`${API_URL}/products`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(newProduct) });
        addProductForm.reset();
        fetchProducts();
        fetchOrders();
    });

    createOrderForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const newOrder = { productId: orderProductIdSelect.value, quantity: document.getElementById('order-quantity').value };
        const res = await fetch(`${API_URL}/orders`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(newOrder) });
        if(!res.ok) { alert(`خطا: ${(await res.json()).error}`); return; }
        createOrderForm.reset();
        fetchProducts();
        fetchOrders();
    });

    window.updateStatus = async (orderId, status) => {
        await fetch(`${API_URL}/orders/${orderId}/status`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status }) });
        fetchProducts();
        fetchOrders();
    };
    
    filterProductName.addEventListener('input', applyProductFilters);
    filterProductCategory.addEventListener('input', applyProductFilters);
    filterOrderProduct.addEventListener('input', applyOrderFilters);
    filterOrderStatus.addEventListener('change', applyOrderFilters);

    lowStockReportBtn.addEventListener('click', async () => {
        const res = await fetch(`${API_URL}/products/low-stock`);
        const { data } = await res.json();
        reportResultsDiv.innerHTML = '<h3>گزارش کالاهای کم موجودی</h3>';
        if (data.length === 0) {
            reportResultsDiv.innerHTML += '<p>هیچ کالایی با موجودی کم یافت نشد.</p>';
            return;
        }
        const list = document.createElement('ul');
        data.forEach(p => {
            const item = document.createElement('li');
            item.textContent = `${p.name} - موجودی: ${p.stock}`;
            list.appendChild(item);
        });
        reportResultsDiv.appendChild(list);
    });

    salesReportBtn.addEventListener('click', async () => {
        try {
            const res = await fetch(`${API_URL}/orders/sales-report`);
            const { data } = await res.json();
            reportResultsDiv.innerHTML = '<h3>گزارش فروش روزانه با جزئیات</h3>';
            if (data.length === 0) {
                reportResultsDiv.innerHTML += '<p>گزارش فروشی یافت نشد.</p>'; return;
            }
            data.forEach(dailyReport => {
                const dayContainer = document.createElement('div');
                dayContainer.className = 'report-day-container';
                const summary = document.createElement('p');
                summary.innerHTML = `<strong>تاریخ: ${new Date(dailyReport._id).toLocaleDateString('fa-IR')}</strong> - فروش کل روز: ${dailyReport.totalSales.toLocaleString()} تومان`;
                dayContainer.appendChild(summary);
                const itemsList = document.createElement('ul');
                dailyReport.itemsSold.forEach(item => {
                    const listItem = document.createElement('li');
                    listItem.textContent = `کالا: ${item.name} - تعداد: ${item.quantity}`;
                    itemsList.appendChild(listItem);
                });
                dayContainer.appendChild(itemsList);
                reportResultsDiv.appendChild(dayContainer);
            });
        } catch (err) {
            console.error('Error fetching sales report:', err);
            reportResultsDiv.innerHTML = '<p>خطا در دریافت گزارش فروش.</p>';
        }
    });

    notificationBell.addEventListener('click', () => {
        document.getElementById('notification-center-overlay').style.display = 'flex';
        notificationsLog.forEach(n => n.unread = false);
        updateNotificationUI();
    });

    document.querySelectorAll('.close-modal-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.target.closest('.modal-overlay').style.display = 'none';
        });
    });

    document.querySelectorAll('.modal-overlay').forEach(overlay => {
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) {
                overlay.style.display = 'none';
            }
        });
    });

    // --- Initial Load ---
    fetchProducts();
    fetchOrders();
    setInterval(checkAndNotifyLowStock, 60000); // هر ۱ دقیقه
    checkAndNotifyLowStock();
    updateNotificationUI();
});
