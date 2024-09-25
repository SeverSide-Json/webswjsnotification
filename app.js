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
            // No changes, continue polling
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
    data.forEach(item => {
        container.appendChild(createDashboardItem(item));
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

function createDashboardItem(data) {
    const [stt, email, amount, time, date, userToken, id] = data;
    const container = document.createElement('div');
    container.className = 'dashboard-item';

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
                <div class="item-unique-id" title="Nhấp để sao chép">
                    Mã đơn hàng: <span class="copyable-id">${id}</span>
                </div>
            </div>
        </div>
        <div class="item-footer">
            <button class="action-button confirm-button">Chấp nhận</button>
            <button class="action-button reject-button">Từ chối</button>
        </div>
    `;

    container.querySelector('.confirm-button').addEventListener('click', () => handleAction(data, 'confirm'));
    container.querySelector('.reject-button').addEventListener('click', () => handleAction(data, 'reject'));
    container.querySelector('.copyable-id').addEventListener('click', (e) => copyToClipboard(e.target.textContent));

    return container;
}

function copyToClipboard(text) {
    navigator.clipboard.writeText(text).then(() => {
        showCopyFeedback('Đã sao chép mã đơn hàng!');
    }).catch(err => {
        console.error('Không thể sao chép: ', err);
        showCopyFeedback('Không thể sao chép, vui lòng thử lại', true);
    });
}

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

    document.body.appendChild(feedback);

    setTimeout(() => {
        feedback.remove();
    }, 2000);
}

// ... (phần còn lại của mã giữ nguyên)

function handleAction(data, action) {
    const [stt] = data;  // Lấy STT từ dữ liệu
    const statusI = action === 'confirm' ? 'Done' : 'No';  // Xác định trạng thái mới

    // Gửi yêu cầu POST đến Google Apps Script để cập nhật trạng thái
    fetch(SCRIPT_URL, {
        method: 'POST',
        mode: 'no-cors',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
            action: 'updateStatus',  // Hành động update status
            stt: stt,                // STT của dòng cần cập nhật
            status: statusI          // Trạng thái mới: 'Done' hoặc 'No'
        }),
    })
    .then(() => {
        console.log(`${action} action processed for ID: ${stt}`);
        loadDashboard();  // Cập nhật lại dashboard sau khi xử lý
    })
    .catch(error => {
        console.error('Error processing action:', error);
    });
}


document.addEventListener('DOMContentLoaded', () => {
    longPoll(); // Start long polling
});
