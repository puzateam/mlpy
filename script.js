// URL ของ Google Apps Script Web App ที่ deploy ไว้
const WEB_APP_URL = "https://script.google.com/macros/s/AKfycbx7COpl7wBfRS6DvxWq8382X8PExJmKciOpluJY4l78ob5biIXlQ4HkYfyG8UDzbeU4/exec";

// --- ฟังก์ชันเกี่ยวกับอายุโรงเรียนและเดือน ---
function calculateAndDisplaySchoolAge() {
    const foundingDate = new Date(1925, 10, 1); 
    const today = new Date(); 
    let age = today.getFullYear() - foundingDate.getFullYear(); 
    const monthDifference = today.getMonth() - foundingDate.getMonth(); 
    const dayDifference = today.getDate() - foundingDate.getDate(); 
    if (monthDifference < 0 || (monthDifference === 0 && dayDifference < 0)) {
        age--;
    }
    const schoolAgeTextElement = document.getElementById('school-age-text');
    if (schoolAgeTextElement) {
        schoolAgeTextElement.textContent = `(รวมอายุ ${age} ปี)`; 
    } else {
        // Comment นี้ถูกเพิ่มเข้ามาเพื่อแก้ปัญหา console error 'school-age-text' not found
        // console.error("Element with id 'school-age-text' not found. School age cannot be displayed by this function.");
    }
}
const thaiShortMonths = ["ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.", "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."];
function getThaiShortMonth(monthNumber) {
    const index = parseInt(monthNumber) - 1; 
    if (index >= 0 && index < 12) {
        return thaiShortMonths[index];
    }
    return monthNumber.toString(); 
}

// --- DOM Elements ที่ใช้บ่อย ---
let loginModal, loginForm, loginLogoutButton, roleSpecificMenuContainer;

// --- ฟังก์ชันเกี่ยวกับ Login และ Session ---
function getUserSession() {
    const sessionUser = sessionStorage.getItem('loggedInUser');
    return sessionUser ? JSON.parse(sessionUser) : null;
}

function setUserSession(userData) {
    sessionStorage.setItem('loggedInUser', JSON.stringify(userData));
}

function clearUserSession() {
    sessionStorage.removeItem('loggedInUser');
}

async function handleLoginSubmit(event) {
    event.preventDefault();
    const usernameInput = document.getElementById('username');
    const passwordInput = document.getElementById('password');
    const username = usernameInput.value.trim();
    const password = passwordInput.value; // ไม่ trim password

    if (!username || !password) {
        Swal.fire({
            icon: 'warning',
            title: 'ข้อมูลไม่ครบถ้วน',
            text: 'กรุณากรอกชื่อผู้ใช้และรหัสผ่านค่ะ',
        });
        return;
    }

    Swal.fire({
        title: 'กำลังตรวจสอบ...',
        allowOutsideClick: false,
        didOpen: () => {
            Swal.showLoading();
        }
    });

    try {
        const response = await fetch(WEB_APP_URL, {
            method: 'POST',
            mode: 'cors', //สำคัญมากสำหรับการ POST ข้ามโดเมนไปยัง Apps Script
            credentials: 'omit', // หรือ 'include' หากมีการจัดการ credentials
            headers: {
                'Content-Type': 'text/plain;charset=utf-8', // Apps Script จะรับ JSON string ผ่าน e.postData.contents
            },
            body: JSON.stringify({ action: "verifyLogin", username: username, password: password })
        });

        const result = await response.json();
        Swal.close();

        if (result.success) {
            setUserSession({ username: result.username, role: result.role });
            Swal.fire({
                icon: 'success',
                title: 'เข้าสู่ระบบสำเร็จ!',
                text: `ยินดีต้อนรับคุณ ${result.username}`,
                timer: 1500,
                showConfirmButton: false
            });
            loginModal.classList.add('hidden');
            loginForm.reset();
            updateLoginUI();
            // หากกำลังดู Smart School Service ให้โหลดใหม่
            if (document.getElementById('content-smart-school') && !document.getElementById('content-smart-school').classList.contains('hidden')) {
                fetchAndDisplayTableData('getSystemLinks', 'content-smart-school');
            }
        } else {
            Swal.fire({
                icon: 'error',
                title: 'เข้าสู่ระบบไม่สำเร็จ',
                text: result.message || 'มีบางอย่างผิดพลาด กรุณาลองใหม่อีกครั้งค่ะ',
            });
        }
    } catch (error) {
        Swal.close();
        console.error("Login error:", error);
        Swal.fire({
            icon: 'error',
            title: 'เกิดข้อผิดพลาด',
            text: 'ไม่สามารถเชื่อมต่อกับระบบ Login ได้ กรุณาลองใหม่อีกครั้งค่ะ',
        });
    }
}

function handleLogout() {
    clearUserSession();
    Swal.fire({
        icon: 'info',
        title: 'ออกจากระบบแล้ว',
        timer: 1500,
        showConfirmButton: false
    });
    updateLoginUI();
    // หากกำลังดู Smart School Service ให้โหลดใหม่
    if (document.getElementById('content-smart-school') && !document.getElementById('content-smart-school').classList.contains('hidden')) {
        fetchAndDisplayTableData('getSystemLinks', 'content-smart-school');
    }
}

function updateLoginUI() {
    const user = getUserSession();
    roleSpecificMenuContainer.innerHTML = ''; // ล้างเมนูพิเศษเดิม

    if (user) {
        loginLogoutButton.textContent = `Logout (${user.username})`;
        loginLogoutButton.removeEventListener('click', openLoginModal);
        loginLogoutButton.addEventListener('click', handleLogout);

        // เพิ่มเมนูตาม Role
        if (user.role === 'admin' || user.role === 'manager') {
            const regBookLink = document.createElement('li');
            regBookLink.innerHTML = `<a href="#" class="menu-item px-3 py-1 hover:text-yellow-200">ลงทะเบียนรับหนังสือ</a>`;
            // placeholder link, พี่สามารถเปลี่ยน href ได้ตามต้องการ
            roleSpecificMenuContainer.appendChild(regBookLink);
        }
        if (user.role === 'manager') {
            const manageSystemLink = document.createElement('li');
            manageSystemLink.innerHTML = `<a href="#" class="menu-item px-3 py-1 hover:text-yellow-200">จัดการระบบ</a>`;
            // placeholder link
            roleSpecificMenuContainer.appendChild(manageSystemLink);
        }

    } else {
        loginLogoutButton.textContent = 'Login';
        loginLogoutButton.removeEventListener('click', handleLogout);
        loginLogoutButton.addEventListener('click', openLoginModal);
    }
}

function openLoginModal() {
    loginModal.classList.remove('hidden');
}

// --- เมื่อเอกสาร HTML โหลดเสร็จสมบูรณ์ ---
document.addEventListener('DOMContentLoaded', function () {
    const homeLink = document.getElementById('home-link'); 
    const contentSections = document.querySelectorAll('.content-section'); 
    const centerContentTitle = document.getElementById('center-content-title'); 
    const initialTitle = 'ยินดีต้อนรับสู่โรงเรียนชุมชนบ้านแม่หละป่าป๋วย'; 
    const schoolInfoPrefix = 'สารสนเทศของโรงเรียน - '; 

    // กำหนดค่าให้กับ Global DOM Elements
    loginModal = document.getElementById('loginModal');
    loginForm = document.getElementById('loginForm');
    loginLogoutButton = document.getElementById('login-logout-button');
    roleSpecificMenuContainer = document.getElementById('role-specific-menu-container');
    const closeLoginModalButton = document.getElementById('closeLoginModalButton');

    // Event Listeners สำหรับ Modal
    loginForm.addEventListener('submit', handleLoginSubmit);
    closeLoginModalButton.addEventListener('click', () => {
        loginModal.classList.add('hidden');
        loginForm.reset();
    });
    // ปิด Modal เมื่อคลิกนอก Modal
    loginModal.addEventListener('click', (event) => {
        if (event.target === loginModal) {
            loginModal.classList.add('hidden');
            loginForm.reset();
        }
    });

    // ฟังก์ชันแสดงเนื้อหา (มีการปรับปรุงให้เรียก fetchAndDisplayTableData เมื่อแสดง content-smart-school)
    window.showContent = function(targetId, linkElement) {
        contentSections.forEach(section => {
            section.classList.add('hidden');
        });
        const targetSection = document.getElementById(targetId); 
        if (targetSection) {
            targetSection.classList.remove('hidden'); 
        } else {
            document.getElementById('content-default').classList.remove('hidden');
            targetId = 'content-default'; 
            console.warn(`Content section with id "${targetId}" not found. Showing default.`);
        }
        let newTitleText = initialTitle;
        if (linkElement) { 
            newTitleText = linkElement.textContent.trim(); 
            if (targetId === 'content-default') {
                newTitleText = initialTitle; 
            } else if (linkElement.closest('.sidebar')) { 
                newTitleText = schoolInfoPrefix + newTitleText; 
            }
        }
        centerContentTitle.textContent = newTitleText;
        document.querySelectorAll('.menu-item, .sidebar-item a').forEach(link => {
            link.classList.remove('active', 'text-yellow-200', 'text-red-600', 'font-semibold');
            if (link.closest('.sidebar-item')) { 
                link.classList.add('text-gray-700');
            }
        });
        const activeHeaderLink = document.querySelector(`header nav a[data-target="${targetId}"], header nav div a[data-target="${targetId}"]`); // เพิ่มการค้นหาใน div ด้วย
        if (activeHeaderLink) {
            activeHeaderLink.classList.add('active', 'text-yellow-200', 'font-semibold');
        }
        const activeSidebarLink = document.querySelector(`#main-menu a[data-target="${targetId}"]`);
        if (activeSidebarLink) {
            activeSidebarLink.classList.add('active', 'text-red-600', 'font-semibold');
            activeSidebarLink.classList.remove('text-gray-700'); 
        }

        if (targetId === 'content-personnel') fetchPersonnelData(); 
        else if (targetId === 'content-students') fetchStudentSummaryData(); 
        else if (targetId === 'content-smart-school') fetchAndDisplayTableData('getSystemLinks', 'content-smart-school'); 
        else if (targetId === 'content-information-links') fetchAndDisplayTableData('getInformationLinks', 'content-information-links'); 
        else if (targetId === 'content-action-plan') displayPdf('content-action-plan', 'https://drive.google.com/file/d/1n3XtVetBdlzZqaDE8Hlm5xs9GGQg0sSH/preview'); 
        else if (targetId === 'content-operation-report') displayPdf('content-operation-report', 'https://drive.google.com/file/d/1jmBa9Heg4SH9apJlubVRLFfZBm42cZXw/preview'); 
    }

    document.querySelectorAll('nav a[data-target], #main-menu a[data-target]').forEach(link => {
        link.addEventListener('click', function (event) {
            event.preventDefault(); 
            const targetId = this.dataset.target; 
            window.showContent(targetId, this); 
        });
    });

    const defaultTarget = homeLink && homeLink.dataset.target ? homeLink.dataset.target : 'content-default';
    window.showContent(defaultTarget, homeLink);

    updateLoginUI(); // ตรวจสอบสถานะ Login เมื่อโหลดหน้า
    fetchVisitorStats();
    calculateAndDisplaySchoolAge();
    fetchAndDisplayCalendarEvents(); 
});

// --- ฟังก์ชันดึงข้อมูลต่างๆ (VisitorStats, Personnel, Students, PDF, Calendar) ---
async function fetchVisitorStats() {
    // ... (โค้ดเดิม ไม่เปลี่ยนแปลง)
    const visitsTodayEl = document.getElementById('visits-today');
    const visitsMonthEl = document.getElementById('visits-this-month');
    const visitsTotalEl = document.getElementById('visits-total');
    try {
        const response = await fetch(`${WEB_APP_URL}?action=logVisitAndGetCounts&timestamp=${new Date().getTime()}`);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const result = await response.json();
        if (result.error) {
            console.error("Error fetching visitor stats:", result.error, result.details || "");
            visitsTodayEl.textContent = "-"; visitsMonthEl.textContent = "-"; visitsTotalEl.textContent = "-"; return;
        }
        if (result.data) {
            visitsTodayEl.textContent = `${result.data.today.toLocaleString()} คน`;
            visitsMonthEl.textContent = `${result.data.month.toLocaleString()} คน`;
            visitsTotalEl.textContent = `${result.data.total.toLocaleString()} คน`;
        } else {
            visitsTodayEl.textContent = "N/A"; visitsMonthEl.textContent = "N/A"; visitsTotalEl.textContent = "N/A";
        }
    } catch (error) {
        console.error("Failed to fetch visitor stats:", error);
        visitsTodayEl.textContent = "ข้อผิดพลาด"; visitsMonthEl.textContent = "ข้อผิดพลาด"; visitsTotalEl.textContent = "ข้อผิดพลาด";
    }
}
async function fetchPersonnelData() {
    // ... (โค้ดเดิม ไม่เปลี่ยนแปลง)
    const personnelContentDiv = document.getElementById('content-personnel');
    personnelContentDiv.innerHTML = '<p class="text-gray-500 animate-pulse">กำลังโหลดข้อมูลบุคลากร...</p>';
    try {
        const response = await fetch(`${WEB_APP_URL}?action=getPersonnel&timestamp=${new Date().getTime()}`);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const result = await response.json();
        if (result.error) {
            personnelContentDiv.innerHTML = `<p class="text-red-500">เกิดข้อผิดพลาด: ${result.error} ${result.details || ''}</p><p class="text-sm text-gray-600">โปรดตรวจสอบฯ</p>`;
            console.error("Error fetching personnel:", result); return;
        }
        if (result.data && result.data.length > 0) {
            let html = '<div class="overflow-x-auto"><table class="min-w-full divide-y divide-gray-200 text-sm data-table-theme"><thead><tr>' +
                       '<th scope="col" class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ชื่อ-นามสกุล</th>' +
                       '<th scope="col" class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ตำแหน่ง</th>' +
                       '<th scope="col" class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">วิทยฐานะ</th>' +
                       '<th scope="col" class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">วันที่มาอยู่ รร.นี้</th>' +
                       '<th scope="col" class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">วิชาเอก</th>' +
                       '<th scope="col" class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">อีเมลล์</th>' +
                       '</tr></thead><tbody class="bg-white divide-y divide-gray-200">';
            result.data.forEach(person => {
                html += `<tr><td class="px-4 py-2 whitespace-nowrap">${person['ชื่อ-นามสกุล'] || '-'}</td>` +
                        `<td class="px-4 py-2 text-left whitespace-nowrap">${person['ตำแหน่ง'] || '-'}</td>` +
                        `<td class="px-4 py-2 text-left whitespace-nowrap">${person['วิทยฐานะ'] || '-'}</td>` +
                        `<td class="px-4 py-2 text-left whitespace-nowrap">${person['วันที่มาอยู่โรงเรียนนี้'] || '-'}</td>` +
                        `<td class="px-4 py-2 text-left whitespace-nowrap">${person['วิชาเอก'] || '-'}</td>` +
                        `<td class="px-4 py-2 text-left whitespace-nowrap">${person['อีเมลล์'] || '-'}</td></tr>`;
            });
            html += '</tbody></table></div>';
            personnelContentDiv.innerHTML = html;
        } else { personnelContentDiv.innerHTML = '<p>ไม่พบข้อมูลบุคลากรฯ</p>'; }
    } catch (error) {
        personnelContentDiv.innerHTML = `<p class="text-red-500">การเชื่อมต่อล้มเหลว: ${error.message}</p><p class="text-sm text-gray-600">โปรดตรวจสอบฯ</p>`;
        console.error("Fetch error for personnel:", error);
    }
}
async function fetchStudentSummaryData() {
    // ... (โค้ดเดิม ไม่เปลี่ยนแปลง)
    const studentContentDiv = document.getElementById('content-students');
    studentContentDiv.innerHTML = '<p class="text-gray-500 animate-pulse">กำลังโหลดข้อมูลนักเรียน...</p>';
    try {
        const response = await fetch(`${WEB_APP_URL}?action=getStudentSummary&timestamp=${new Date().getTime()}`);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const result = await response.json();
        if (result.error) {
            studentContentDiv.innerHTML = `<p class="text-red-500">เกิดข้อผิดพลาด: ${result.error} ${result.details || ''}</p><p class="text-sm text-gray-600">โปรดตรวจสอบฯ</p>`;
            console.error("Error fetching student summary:", result); return;
        }
        if (result.data && result.data.length > 0) {
            let html = '<div class="overflow-x-auto"><table class="min-w-full divide-y divide-gray-200 text-sm data-table-theme"><thead><tr>' +
                       '<th scope="col" class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ระดับชั้น</th>' +
                       '<th scope="col" class="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">ชาย</th>' +
                       '<th scope="col" class="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">หญิง</th>' +
                       '<th scope="col" class="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">รวม</th>' +
                       '</tr></thead><tbody class="bg-white divide-y divide-gray-200">';
            let totalBoys = 0, totalGirls = 0, grandTotalAll = 0;
            result.data.forEach(level => {
                const boys = parseInt(level['จำนวนนักเรียนชาย']) || 0;
                const girls = parseInt(level['จำนวนนักเรียนหญิง']) || 0;
                const sumPerLevel = boys + girls;
                html += `<tr><td class="px-4 py-2 whitespace-nowrap">${level['ระดับชั้น'] || '-'}</td>` +
                        `<td class="px-4 py-2 whitespace-nowrap text-center">${level['จำนวนนักเรียนชาย'] || '0'}</td>` +
                        `<td class="px-4 py-2 whitespace-nowrap text-center">${level['จำนวนนักเรียนหญิง'] || '0'}</td>` +
                        `<td class="px-4 py-2 whitespace-nowrap text-center">${level['รวม'] || sumPerLevel}</td></tr>`;
                totalBoys += boys; totalGirls += girls; grandTotalAll += sumPerLevel;
            });
            html += `<tr class="font-bold bg-yellow-50"><td class="px-4 py-2 whitespace-nowrap text-gray-900">รวมทุกระดับ</td>` +
                    `<td class="px-4 py-2 whitespace-nowrap text-gray-900 text-center">${totalBoys}</td>` +
                    `<td class="px-4 py-2 whitespace-nowrap text-gray-900 text-center">${totalGirls}</td>` +
                    `<td class="px-4 py-2 whitespace-nowrap text-gray-900 text-center">${grandTotalAll}</td></tr>`;
            html += '</tbody></table></div>';
            studentContentDiv.innerHTML = html;
        } else { studentContentDiv.innerHTML = '<p>ไม่พบข้อมูลนักเรียนฯ</p>'; }
    } catch (error) {
        studentContentDiv.innerHTML = `<p class="text-red-500">การเชื่อมต่อล้มเหลว: ${error.message}</p><p class="text-sm text-gray-600">โปรดตรวจสอบฯ</p>`;
        console.error("Fetch error for student summary:", error);
    }
}
function displayPdf(targetDivId, pdfUrl) {
    // ... (โค้ดเดิม ไม่เปลี่ยนแปลง)
    const contentDiv = document.getElementById(targetDivId);
    if (pdfUrl && pdfUrl.startsWith('https://drive.google.com/file/d/')) {
         contentDiv.innerHTML = `<iframe src="${pdfUrl}" class="pdf-embed-container" frameborder="0" allowfullscreen><p>เบราว์เซอร์ไม่รองรับ PDF <a href="${pdfUrl.replace('/preview', '/view')}" target="_blank">เปิดที่นี่</a>.</p></iframe>`;
    } else {
         contentDiv.innerHTML = `<p class="text-gray-600 mt-4">ยังไม่มีไฟล์ หรือ URL ผิดพลาด</p><p class="text-sm text-gray-500">(ผู้ดูแลระบบ: ตรวจสอบ URL)</p>`;
    }
}
async function fetchAndDisplayCalendarEvents() {
    // ... (โค้ดเดิม ไม่เปลี่ยนแปลง)
    const calendarContainer = document.getElementById('calendar-events-container'); 
    if (!calendarContainer) { console.error("Calendar container not found!"); return; }
    calendarContainer.innerHTML = '<p class="text-gray-500 animate-pulse">กำลังโหลดปฏิทิน...</p>';
    try {
        const response = await fetch(`${WEB_APP_URL}?action=getCalendarEvents&timestamp=${new Date().getTime()}`);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const result = await response.json();
        if (result.error) {
            console.error("Error fetching calendar:", result.error, result.details || "");
            calendarContainer.innerHTML = `<p class="text-red-500">โหลดปฏิทินไม่ได้: ${result.error}</p>`; return;
        }
        if (result.data && result.data.length > 0) {
            let htmlContent = ''; 
            result.data.forEach((event, index) => { 
                const day = event.day || '';
                const monthDisplay = event.month ? getThaiShortMonth(event.month) : ''; 
                const year = event.year || '';
                const activity = event.activity || 'ไม่มีรายละเอียด';
                const itemClass = (index === result.data.length - 1) ? 'mb-0 pb-0 border-none' : 'mb-3 pb-3 border-b border-dashed border-red-200';
                htmlContent += `<div class="${itemClass}"><p class="font-bold text-red-600">${day} ${monthDisplay} ${year}</p><p class="text-gray-700">${activity}</p></div>`;
            });
            calendarContainer.innerHTML = htmlContent; 
        } else { calendarContainer.innerHTML = '<p class="text-gray-700">ไม่มีกิจกรรมเดือนนี้</p>'; }
    } catch (error) { 
        console.error("Failed to fetch calendar:", error);
        calendarContainer.innerHTML = '<p class="text-red-500">เชื่อมต่อปฏิทินล้มเหลว</p>';
    }
}

// ฟังก์ชันดึงข้อมูลตาราง (Smart School, Information Links) - **ปรับปรุงให้เช็ค Login**
async function fetchAndDisplayTableData(actionName, targetDivId) {
    const contentDiv = document.getElementById(targetDivId);
    contentDiv.innerHTML = `<p class="text-gray-500 animate-pulse">กำลังโหลดข้อมูล...</p>`;
    const userSession = getUserSession(); // ดึงข้อมูล session ของผู้ใช้

    try {
        const response = await fetch(`${WEB_APP_URL}?action=${actionName}&timestamp=${new Date().getTime()}`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const result = await response.json();
        if (result.error) {
            contentDiv.innerHTML = `<p class="text-red-500">เกิดข้อผิดพลาด: ${result.error} ${result.details || ''}</p>`;
            console.error(`Error fetching ${actionName}:`, result);
            return;
        }

        if (result.data && result.data.length > 0) {
            let html = '';
            html += '<div class="overflow-x-auto">';
            html += '<table class="link-table min-w-full text-sm data-table-theme">';
            html += '<thead><tr>';
            html += '<th scope="col" class="col-number px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">ลำดับ</th>';
            html += '<th scope="col" class="col-name px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ชื่อรายการ</th>';
            // แสดงหัวตาราง "ลิงก์" ถ้า Login แล้ว หรือถ้าเป็นส่วนอื่นที่ไม่ใช่ Smart School Service
            if (userSession || targetDivId !== 'content-smart-school') {
                 html += '<th scope="col" class="col-link px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">ลิงก์</th>';
            }
            html += '</tr></thead>';
            html += '<tbody class="bg-white divide-y divide-gray-200">';

            result.data.forEach(item => {
                html += '<tr>';
                html += `<td class="col-number px-4 py-2 text-center whitespace-nowrap align-middle">${item.number || '-'}</td>`;
                html += `<td class="col-name px-4 py-2 whitespace-nowrap align-middle">${item.name || '-'}</td>`;

                // ควบคุมการแสดงคอลัมน์ "ลิงก์" สำหรับ Smart School Service
                if (targetDivId === 'content-smart-school') {
                    if (userSession) { // ถ้า Login แล้ว (ทุก Role ดูลิงก์ได้ใน Smart School)
                        const linkDestination = item.link && item.link.trim() !== "" && item.link.trim().toLowerCase() !== "n/a" && item.link.trim().toLowerCase() !== "-" ? item.link.trim() : "";
                        const targetAttribute = linkDestination && (linkDestination.startsWith('http://') || linkDestination.startsWith('https://')) ? 'target="_blank" rel="noopener noreferrer"' : '';
                        let iconHtml = "<span class='text-gray-400'>-</span>";
                        if (linkDestination) {
                            iconHtml = `<img src='https://i.postimg.cc/25R6kGJx/ico1.png' border='0' alt='เปิดลิงก์ ${item.name || ''}' class='w-6 h-6 mx-auto'>`;
                        }
                        html += `<td class="col-link px-4 py-2 text-center whitespace-nowrap align-middle">`;
                        if (linkDestination) {
                            html += `<a href="${linkDestination}" ${targetAttribute} class="inline-flex items-center justify-center p-1 rounded-md group focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500" title="เปิดลิงก์: ${item.name || ''}">${iconHtml}<span class="sr-only">เปิดลิงก์ ${item.name || ''}</span></a>`;
                        } else {
                            html += iconHtml;
                        }
                        html += `</td>`;
                    } else {
                        // ไม่ต้องแสดงคอลัมน์ลิงก์ถ้ายังไม่ Login และเป็น Smart School (หัวตารางก็ไม่แสดงแล้ว)
                    }
                } else { // สำหรับส่วนอื่นๆ ที่ไม่ใช่ Smart School (เช่น Information Links) ให้แสดงลิงก์ตามปกติ
                    const linkDestination = item.link && item.link.trim() !== "" && item.link.trim().toLowerCase() !== "n/a" && item.link.trim().toLowerCase() !== "-" ? item.link.trim() : "";
                    const targetAttribute = linkDestination && (linkDestination.startsWith('http://') || linkDestination.startsWith('https://')) ? 'target="_blank" rel="noopener noreferrer"' : '';
                    let iconHtml = "<span class='text-gray-400'>-</span>";
                    if (linkDestination) {
                        iconHtml = `<img src='https://i.postimg.cc/25R6kGJx/ico1.png' border='0' alt='เปิดลิงก์ ${item.name || ''}' class='w-6 h-6 mx-auto'>`;
                    }
                    html += `<td class="col-link px-4 py-2 text-center whitespace-nowrap align-middle">`;
                    if (linkDestination) {
                        html += `<a href="${linkDestination}" ${targetAttribute} class="inline-flex items-center justify-center p-1 rounded-md group focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500" title="เปิดลิงก์: ${item.name || ''}">${iconHtml}<span class="sr-only">เปิดลิงก์ ${item.name || ''}</span></a>`;
                    } else {
                        html += iconHtml;
                    }
                    html += `</td>`;
                }
                html += '</tr>';
            });
            html += '</tbody></table>';
            html += '</div>';
            contentDiv.innerHTML = html;
        } else {
            contentDiv.innerHTML = `<p>ไม่พบข้อมูล หรือชีตอาจจะว่าง</p>`;
        }
    } catch (error) {
        contentDiv.innerHTML = `<p class="text-red-500">การเชื่อมต่อล้มเหลว: ${error.message}</p>`;
        console.error(`Fetch error for ${actionName}:`, error);
    }
}
