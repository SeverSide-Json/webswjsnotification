const SHEET_ID = '1Zebh-8FerNoGurfyqQP-pcSFFT_CXAcnh1I-GFHpv_c';
const SHEET_TITLE = 'Sheet3';
const SHEET_RANGE = 'A:F';
const POLL_INTERVAL = 1000; // 1 second

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

function createDashboardItem(data) {
    const [stt, email, amount, time, date, userToken] = data;
    const container = document.createElement('div');
    container.className = 'dashboard-item';
    container.innerHTML = `
        <div class="item-header">
            <span class="item-id">ID: ${stt}</span>
            <span class="item-date">${date}</span>
        </div>
        <div class="item-body">
            <div class="item-info">
                <div class="item-email">${email}</div>
                <div class="item-amount">Amount: $${amount}</div>
                <div class="item-time">Time: ${time}</div>
            </div>
        </div>
        <div class="item-footer">
            <button class="action-button confirm-button">Approve</button>
            <button class="action-button reject-button">Reject</button>
        </div>
    `;

    container.querySelector('.confirm-button').addEventListener('click', () => handleAction(data, 'confirm'));
    container.querySelector('.reject-button').addEventListener('click', () => handleAction(data, 'reject'));

    return container;
}

function handleAction(data, action) {
    const [stt, email, amount] = data;
    const statusI = action === 'confirm' ? 'Done' : 'No';
    const statusH = action === 'confirm' ? 'Approved' : 'Rejected';

    fetch(SCRIPT_URL, {
        method: 'POST',
        mode: 'no-cors',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
            action: 'dashboard',
            email, 
            amount, 
            statusI, 
            statusH 
        }),
    })
    .then(() => {
        console.log(`${action} action processed for ${email} with amount ${amount}`);
        loadDashboard();
    })
    .catch(error => {
        console.error('Error processing action:', error);
    });
}

document.addEventListener('DOMContentLoaded', () => {
    longPoll(); // Start long polling
});
