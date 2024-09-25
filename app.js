const SHEET_ID = '1Zebh-8FerNoGurfyqQP-pcSFFT_CXAcnh1I-GFHpv_c';
const SHEET_TITLE = 'Sheet3';
const SHEET_RANGE = 'A:I';
const POLL_INTERVAL = 1000; // 1 second
const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbyUHh84KAvV27u15X8rwGHq36PM-x6Dy5hgPLAEwKqIyg8kC5IQ3NJVVc05p_hp0XE5aQ/exec'

let currentEtag = null;

function fetchSheetData() {
    const FULL_URL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?sheet=${SHEET_TITLE}&range=${SHEET_RANGE}`;
    
    return fetch(FULL_URL, {
        headers: currentEtag ? { 'If-None-Match': currentEtag } : {}
    })
    .then(response => {
        if (response.status === 304) {
            return null;
        }
        currentEtag = response.headers.get('ETag');
        return response.text();
    })
    .then(text => {
        if (text === null) return null;
        const json = JSON.parse(text.substr(47).slice(0, -2));
        return json.table.rows.map(row => 
            row.c.map(cell => cell ? cell.v : '')
        );
    });
}

function updateDashboard(data) {
    const container = document.getElementById('dashboard-container');
    container.innerHTML = '';
    data.forEach((item, index) => {
        if (item[8] === 'pending') {
            const dashboardItem = createDashboardItem(item, index);
            container.appendChild(dashboardItem);
        }
    });
}

function longPoll() {
    fetchSheetData().then(data => {
        if (data !== null) {
            console.log("Data changed, updating dashboard");
            updateDashboard(data);
        } else {
            console.log("No changes detected");
        }
    }).catch(error => {
        console.error('Error fetching data:', error);
    }).finally(() => {
        setTimeout(longPoll, POLL_INTERVAL);
    });
}

// Cập nhật hàm formatDate trong app.js
function formatDate(dateValue) {
    if (dateValue instanceof Date) {
        // Nếu là đối tượng Date
        return `${dateValue.getDate().toString().padStart(2, '0')}/${(dateValue.getMonth() + 1).toString().padStart(2, '0')}/${dateValue.getFullYear()}`;
    } else if (typeof dateValue === 'string') {
        // Nếu là chuỗi, kiểm tra xem có phải là chuỗi Date không
        if (dateValue.startsWith('Date(')) {
            // Xử lý chuỗi Date(2024,8,18)
            const parts = dateValue.slice(5, -1).split(',');
            const year = parseInt(parts[0]);
            const month = parseInt(parts[1]);
            const day = parseInt(parts[2]);
            return `${day.toString().padStart(2, '0')}/${(month + 1).toString().padStart(2, '0')}/${year}`;
        }
        // Nếu là chuỗi ngày tháng thông thường
        const [year, month, day] = dateValue.split('-');
        return `${day}/${month}/${year}`;
    } else {
        // Trường hợp không xác định, trả về chuỗi gốc hoặc thông báo lỗi
        return 'Invalid Date';
    }
}

// Cập nhật hàm createDashboardItem để sử dụng hàm formatDate mới
// ... (các phần khác của mã giữ nguyên)

function createDashboardItem(data, index) {
    const [stt, email, amount, time, date, userToken, orderId] = data;
    const container = document.createElement('div');
    container.className = 'dashboard-item';
    container.id = `item-${index}`;

    const formattedAmount = new Intl.NumberFormat('vi-VN').format(parseFloat(amount));
    const formattedDate = formatDate(date);

    container.innerHTML = `
        <div class="item-header">
            <span class="item-id">ID: ${stt}</span>
            <span class="item-date">${formattedDate}</span>
        </div>
        <div class="item-body">
            <div class="item-info">
                <div class="item-email">${email}</div>
                <div class="item-amount">Số tiền: ${formattedAmount} VNĐ</div>
                <div class="item-time">Thời gian: ${time}</div>
            </div>
        </div>
        <div class="item-footer">
            <div class="item-unique-id" title="Nhấp để sao chép">
                ID Game: <span class="copyable-id">${orderId || 'Không có'}</span>
            </div>
            <div class="action-buttons">
                <button class="action-button confirm-button">Chấp nhận</button>
                <button class="action-button reject-button">Từ chối</button>
            </div>
        </div>
    `;

    container.querySelector('.confirm-button').addEventListener('click', () => showConfirmationPopup(data, 'confirm', index));
    container.querySelector('.reject-button').addEventListener('click', () => showConfirmationPopup(data, 'reject', index));
    
    const copyableId = container.querySelector('.copyable-id');
    if (orderId) {
        copyableId.addEventListener('click', () => copyToClipboard(orderId));
    } else {
        copyableId.style.cursor = 'default';
        copyableId.style.textDecoration = 'none';
        copyableId.style.color = 'inherit';
    }

    return container;
}

function showConfirmationPopup(data, action, index) {
    const popup = document.createElement('div');
    popup.className = 'confirmation-popup';
    const message = action === 'confirm' ? 'Đồng ý xác nhận?' : 'Đồng ý từ chối?';
    
    popup.innerHTML = `
        <div class="popup-content">
            <p>${message}</p>
            <button class="popup-button confirm">Đồng ý</button>
            <button class="popup-button cancel">Hủy</button>
        </div>
    `;
    
    document.body.appendChild(popup);
    
    popup.querySelector('.confirm').addEventListener('click', () => {
        handleAction(data, action, index);
        popup.remove();
    });
    
    popup.querySelector('.cancel').addEventListener('click', () => {
        popup.remove();
    });
}



function copyToClipboard(text) {
    navigator.clipboard.writeText(text).then(() => {
        showCopyFeedback(`Đã sao chép: ${text}`);
    }).catch(err => {
        console.error('Không thể sao chép: ', err);
        showCopyFeedback('Không thể sao chép, vui lòng thử lại', true);
    });
}

// ... (các hàm khác giữ nguyên)
function showCopyFeedback(message, isError = false) {
    const feedback = document.createElement('div');
    feedback.textContent = message;
    feedback.style.position = 'fixed';
    feedback.style.bottom = '20px';
    feedback.style.left = '50%';
    feedback.style.transform = 'translateX(-50%)';
    feedback.style.padding = '10px 20px';
    feedback.style.backgroundColor = isError ? '#ff6b6b' : '#51cf66';
    feedback.style.color = 'white';
    feedback.style.borderRadius = '5px';
    feedback.style.zIndex = '1000';
    feedback.style.maxWidth = '80%';
    feedback.style.wordBreak = 'break-all';
    feedback.style.boxShadow = '0 2px 10px rgba(0,0,0,0.2)';
    feedback.style.fontSize = '14px';
    feedback.style.textAlign = 'center';
    feedback.style.transition = 'opacity 0.3s ease-in-out';

    document.body.appendChild(feedback);

    // Đảm bảo feedback hiển thị đúng trên mobile
    const updatePosition = () => {
        const viewportHeight = window.innerHeight;
        if (viewportHeight < 600) { // Giả sử đây là kích thước của màn hình mobile
            feedback.style.bottom = '10px';
            feedback.style.fontSize = '12px';
            feedback.style.padding = '8px 16px';
        } else {
            feedback.style.bottom = '20px';
            feedback.style.fontSize = '14px';
            feedback.style.padding = '10px 20px';
        }
    };

    updatePosition();
    window.addEventListener('resize', updatePosition);

    // Animation khi ẩn feedback
    setTimeout(() => {
        feedback.style.opacity = '0';
    }, 700);

    setTimeout(() => {
        feedback.remove();
        window.removeEventListener('resize', updatePosition);
    }, 1000);
}
// ... (phần còn lại của mã giữ nguyên)

function handleAction(data, action, index) {
    const [stt] = data;
    const statusI = action === 'confirm' ? 'Done' : 'No';

    // Ẩn item ngay lập tức
    const item = document.getElementById(`item-${index}`);
    if (item) {
        item.style.opacity = '0';
        item.style.transition = 'opacity 0.3s ease';
        setTimeout(() => {
            item.remove();
        }, 300);
    }

    fetch(SCRIPT_URL, {
        method: 'POST',
        mode: 'no-cors',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
            action: 'updateStatus',
            stt: stt,
            status: statusI
        }),
    })
    .then(() => {
        console.log(`${action} action processed for ID: ${stt}`);
        // Không cần gọi longPoll() ở đây nữa vì item đã được ẩn
    })
    .catch(error => {
        console.error('Error processing action:', error);
    });
}


document.addEventListener('DOMContentLoaded', () => {
    longPoll(); // Start long polling
});

function toggleTheme() {
    const body = document.body;
    body.classList.toggle('dark-mode');
    const isDarkMode = body.classList.contains('dark-mode');
    localStorage.setItem('darkMode', isDarkMode);
    updateThemeToggleButton(isDarkMode);
}

function updateThemeToggleButton(isDarkMode) {
    const themeToggle = document.querySelector('.theme-toggle');
    if (isDarkMode) {
        themeToggle.textContent = '☀️';  // Sun emoji
        themeToggle.title = 'Chuyển sang chế độ sáng';
    } else {
        themeToggle.textContent = '🌙';  // Moon emoji
        themeToggle.title = 'Chuyển sang chế độ tối';
    }
}

function initTheme() {
    const darkModeStored = localStorage.getItem('darkMode');
    if (darkModeStored === 'true') {
        document.body.classList.add('dark-mode');
    }
    updateThemeToggleButton(darkModeStored === 'true');
}

document.addEventListener('DOMContentLoaded', () => {
    const themeToggle = document.createElement('button');
    themeToggle.className = 'theme-toggle';
    themeToggle.textContent = '🌙';  // Default to moon emoji
    themeToggle.title = 'Chuyển sang chế độ tối';
    themeToggle.addEventListener('click', toggleTheme);
    document.body.appendChild(themeToggle);

    initTheme();
});
