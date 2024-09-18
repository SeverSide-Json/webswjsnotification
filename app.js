// Các hằng số
const SHEET_ID = '1Zebh-8FerNoGurfyqQP-pcSFFT_CXAcnh1I-GFHpv_c';
const SHEET_TITLE = 'Sheet3';
const SHEET_RANGE = 'A:I';
const API_KEY = 'YOUR_API_KEY'; // Thay thế bằng API key của bạn
const POLL_INTERVAL = 1000; // 5 giây

// Lưu ý: Interval 1 giây có thể gây ra nhiều requests. Hãy theo dõi giới hạn API và điều chỉnh nếu cần.
// Cân nhắc sử dụng một giá trị lớn hơn trong môi trường sản xuất, ví dụ 5000 (5 giây) hoặc 10000 (10 giây).

let currentEtag = null;
let consecutiveErrors = 0;
const MAX_CONSECUTIVE_ERRORS = 5;

// Hàm để lấy dữ liệu từ Google Sheets
function fetchSheetData() {
    const FULL_URL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?sheet=${SHEET_TITLE}&range=${SHEET_RANGE}`;
    
    return fetch(FULL_URL, {
        headers: currentEtag ? { 'If-None-Match': currentEtag } : {}
    })
    .then(response => {
        if (response.status === 304) {
            return null;
        }
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        currentEtag = response.headers.get('ETag');
        return response.text();
    })
    .then(text => {
        if (text === null) return null;
        const json = JSON.parse(text.substr(47).slice(0, -2));
        consecutiveErrors = 0; // Reset error counter on successful fetch
        return json.table.rows.map(row => 
            row.c.map(cell => cell ? cell.v : '')
        );
    })
    .catch(error => {
        console.error('Error fetching data:', error);
        consecutiveErrors++;
        if (consecutiveErrors >= MAX_CONSECUTIVE_ERRORS) {
            console.error(`Max consecutive errors (${MAX_CONSECUTIVE_ERRORS}) reached. Stopping polling.`);
            throw new Error('Max consecutive errors reached');
        }
        return null;
    });
}

// ... (các hàm khác giữ nguyên)
// Hàm để cập nhật Google Sheets qua API
async function updateGoogleSheet(row, status) {
    const range = `${SHEET_TITLE}!I${row}`;
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/${range}?valueInputOption=RAW&key=${API_KEY}`;

    const response = await fetch(url, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            values: [[status]]
        })
    });

    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
}

// Hàm xử lý hành động khi nhấn nút
async function handleAction(data, action) {
    const [stt, email, amount, time, date, userToken] = data;
    let status;

    if (action === 'confirm') {
        status = 'Done';
    } else if (action === 'reject') {
        status = 'Rejected';
    } else {
        console.error('Invalid action');
        return;
    }

    try {
        await updateGoogleSheet(stt, status);
        console.log(`Action ${action} processed for ${email} with amount ${amount}`);
        alert(`Đã ${action === 'confirm' ? 'chấp nhận' : 'từ chối'} yêu cầu cho ${email}`);
        // Cập nhật UI nếu cần
        updateDashboard(); // Gọi hàm này để cập nhật dashboard ngay lập tức
    } catch (error) {
        console.error('Error updating Google Sheets:', error);
        alert('Có lỗi xảy ra khi cập nhật dữ liệu. Vui lòng thử lại.');
    }
}

// Hàm tạo item cho dashboard
function createDashboardItem(data) {
    const [stt, email, amount, time, date, userToken] = data;
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
            </div>
        </div>
        <div class="item-footer">
            <button class="action-button confirm-button">Chấp nhận</button>
            <button class="action-button reject-button">Từ chối</button>
        </div>
    `;

    container.querySelector('.confirm-button').addEventListener('click', () => handleAction(data, 'confirm'));
    container.querySelector('.reject-button').addEventListener('click', () => handleAction(data, 'reject'));

    return container;
}

// Hàm cập nhật dashboard
function updateDashboard(data) {
    const container = document.getElementById('dashboard-container');
    container.innerHTML = '';
    data.forEach(item => {
        container.appendChild(createDashboardItem(item));
    });
}

// Hàm long polling
function longPoll() {
    fetchSheetData().then(data => {
        if (data !== null) {
            console.log("Data changed, updating dashboard");
            updateDashboard(data);
        } else {
            console.log("No changes detected");
        }
    }).catch(error => {
        console.error('Error in long polling:', error);
        if (error.message === 'Max consecutive errors reached') {
            alert('Đã xảy ra lỗi kết nối liên tục. Vui lòng kiểm tra kết nối mạng và tải lại trang.');
            return; // Stop polling
        }
    }).finally(() => {
        setTimeout(longPoll, POLL_INTERVAL);
    });
}


// Hàm formatDate (giữ nguyên như trước)
function formatDate(dateValue) {
    if (dateValue instanceof Date) {
        return `${dateValue.getDate().toString().padStart(2, '0')}/${(dateValue.getMonth() + 1).toString().padStart(2, '0')}/${dateValue.getFullYear()}`;
    } else if (typeof dateValue === 'string') {
        if (dateValue.startsWith('Date(')) {
            const parts = dateValue.slice(5, -1).split(',');
            const year = parseInt(parts[0]);
            const month = parseInt(parts[1]);
            const day = parseInt(parts[2]);
            return `${day.toString().padStart(2, '0')}/${(month + 1).toString().padStart(2, '0')}/${year}`;
        }
        const [year, month, day] = dateValue.split('-');
        return `${day}/${month}/${year}`;
    } else {
        return 'Invalid Date';
    }
}

// Khởi động ứng dụng
document.addEventListener('DOMContentLoaded', () => {
    longPoll(); // Bắt đầu long polling
});
