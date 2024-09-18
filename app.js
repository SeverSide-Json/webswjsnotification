       const API_KEY = 'AIzaSyDqRZQ5Ms9oosYxJk_2kVSM7Hj_ObcQdoU'; // Thay thế bằng API key của bạn
        const SHEET_ID = '1Zebh-8FerNoGurfyqQP-pcSFFT_CXAcnh1I-GFHpv_c';
        const SHEET_TITLE = 'Sheet3';
        const SHEET_RANGE = 'A:I';
        const POLL_INTERVAL = 1000; // 1 giây

        let currentEtag = null;

        function fetchSheetData() {
            const FULL_URL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?sheet=${SHEET_TITLE}&range=${SHEET_RANGE}`;
            
            fetch(FULL_URL, {
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
            })
            .then(data => {
                if (data !== null) {
                    console.log("Data changed, updating dashboard");
                    updateDashboard(data);
                } else {
                    console.log("No changes detected");
                }
            })
            .catch(error => {
                console.error('Error fetching data:', error);
            })
            .finally(() => {
                setTimeout(fetchSheetData, POLL_INTERVAL);
            });
        }

        function updateDashboard(data) {
            const dashboard = document.getElementById('dashboard');
            dashboard.innerHTML = '';
            data.forEach((row, index) => {
                if (index === 0) return; // Skip header row
                dashboard.appendChild(createDashboardItem(row));
            });
        }

        function createDashboardItem(row) {
            const [stt, email, amount, time, date, userToken, , , status] = row;
            const container = document.createElement('div');
            container.className = 'dashboard-item';
            
            const formattedAmount = new Intl.NumberFormat('vi-VN').format(parseFloat(amount));
            const formattedDate = formatDate(date);

            container.innerHTML = `
                <div class="item-header">
                    <span class="item-id">ID: ${stt}</span>
                    <span class="item-date">${formattedDate}</span>
                </div>
                <div class="item-info">
                    <div>Email: ${email}</div>
                    <div>Số tiền: ${formattedAmount} VNĐ</div>
                    <div>Thời gian: ${time}</div>
                    <div>Trạng thái: ${status || 'Chưa xử lý'}</div>
                </div>
                <div>
                    <button class="action-button" onclick="handleAction(${stt}, 'Done')">Chấp nhận</button>
                    <button class="action-button" onclick="handleAction(${stt}, 'Rejected')">Từ chối</button>
                </div>
            `;

            return container;
        }

        function handleAction(row, status) {
            const url = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/${SHEET_TITLE}!I${row}:I${row}?valueInputOption=RAW&key=${API_KEY}`;

            fetch(url, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    values: [[status]]
                })
            })
            .then(response => response.json())
            .then(data => {
                alert(`Đã cập nhật trạng thái thành ${status}`);
                currentEtag = null; // Reset ETag to force refresh
            })
            .catch(error => {
                console.error('Error:', error);
                alert('Có lỗi xảy ra khi cập nhật dữ liệu');
            });
        }

        function formatDate(dateValue) {
            if (dateValue instanceof Date) {
                return `${dateValue.getDate().toString().padStart(2, '0')}/${(dateValue.getMonth() + 1).toString().padStart(2, '0')}/${dateValue.getFullYear()}`;
            } else if (typeof dateValue === 'string') {
                if (dateValue.startsWith('Date(')) {
                    const parts = dateValue.slice(5, -1).split(',');
                    const year = parseInt(parts[0]);
                    const month = parseInt(parts[1]);
                    const day = parseInt(parts[2]);
                    return `${day.toString().padStart(2, '0')}/${month.toString().padStart(2, '0')}/${year}`;
                }
                const [year, month, day] = dateValue.split('-');
                return `${day}/${month}/${year}`;
            } else {
                return 'Invalid Date';
            }
        }

        // Start polling when the page loads
        document.addEventListener('DOMContentLoaded', fetchSheetData);
