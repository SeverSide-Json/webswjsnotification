const SHEET_ID = '1Zebh-8FerNoGurfyqQP-pcSFFT_CXAcnh1I-GFHpv_c';
const SHEET_TITLE = 'Sheet3';
const SHEET_RANGE = 'A:F';
const POLL_INTERVAL = 1000; // 1 second

let currentEtag = null;

// Cập nhật hàm formatDate
function formatDate(dateValue) {
    if (dateValue instanceof Date) {
        // Nếu là đối tượng Date
        return `${dateValue.getDate().toString().padStart(2, '0')}/${(dateValue.getMonth() + 1).toString().padStart(2, '0')}/${dateValue.getFullYear()}`;
    } else if (typeof dateValue === 'string') {
        // Nếu là chuỗi, giả sử định dạng là 'YYYY-MM-DD'
        const [year, month, day] = dateValue.split('-');
        return `${day}/${month}/${year}`;
    } else {
        // Trường hợp không xác định, trả về chuỗi gốc hoặc thông báo lỗi
        return 'Invalid Date';
    }
}

// Cập nhật hàm fetchSheetData để xử lý lỗi tốt hơn
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
        return json.table.rows.map(row => 
            row.c.map(cell => cell ? cell.v : '')
        );
    })
    .catch(error => {
        console.error('Error fetching data:', error);
        // Thông báo lỗi cho người dùng
        const container = document.getElementById('dashboard-container');
        container.innerHTML = `<div class="error-message">Không thể tải dữ liệu. Vui lòng thử lại sau. Chi tiết lỗi: ${error.message}</div>`;
        throw error; // Ném lỗi để xử lý ở cấp cao hơn nếu cần
    });
}

// Cập nhật hàm createDashboardItem
function createDashboardItem(data) {
    const [stt, email, amount, time, date, userToken] = data;
    const container = document.createElement('div');
    container.className = 'dashboard-item';

    // Định dạng số tiền
    const formattedAmount = new Intl.NumberFormat('vi-VN').format(parseFloat(amount));

    // Định dạng ngày tháng
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

// Cập nhật hàm longPoll để xử lý lỗi tốt hơn
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
        // Có thể thêm logic để thử lại sau một khoảng thời gian
    }).finally(() => {
        setTimeout(longPoll, POLL_INTERVAL);
    });
}
