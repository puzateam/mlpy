// URL ของ Google Apps Script Web App ที่ deploy ไว้
const WEB_APP_URL = "https://script.google.com/macros/s/AKfycbxWvVANjIsOlsoP8nj81X1kcamdMQSPKOys9C0hiB4yaw7W-EBwkG3RYws83VAspliz/exec";

// --- ฟังก์ชันเกี่ยวกับอายุโรงเรียนและเดือน ---

/**
 * คำนวณและแสดงอายุของโรงเรียนในวงเล็บต่อท้าย element ที่มี id 'school-age-text'
 */
function calculateAndDisplaySchoolAge() {
    const foundingDate = new Date(1925, 10, 1); // วันที่ก่อตั้งโรงเรียน (ปี, เดือน (0-11), วัน) - 1 พฤศจิกายน 1925
    const today = new Date(); // วันที่ปัจจุบัน
    let age = today.getFullYear() - foundingDate.getFullYear(); // คำนวณอายุเบื้องต้นจากปี
    const monthDifference = today.getMonth() - foundingDate.getMonth(); // ผลต่างของเดือน
    const dayDifference = today.getDate() - foundingDate.getDate(); // ผลต่างของวัน

    // ถ้ายังไม่ถึงเดือนเกิด หรือถึงเดือนเกิดแล้วแต่ยังไม่ถึงวันเกิด ให้ลดอายุลง 1 ปี
    if (monthDifference < 0 || (monthDifference === 0 && dayDifference < 0)) {
        age--;
    }

    const schoolAgeTextElement = document.getElementById('school-age-text'); // หา element ที่จะแสดงอายุ
    if (schoolAgeTextElement) {
        schoolAgeTextElement.textContent = `(รวมอายุ ${age} ปี)`; // แสดงข้อความอายุ
    } else {
        // console.error("Element with id 'school-age-text' not found."); // แสดง error ถ้าหา element ไม่เจอ (ปิดไว้ก่อน)
    }
}

// อาร์เรย์ชื่อเดือนไทยแบบย่อ
const thaiShortMonths = ["ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.", "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."];

/**
 * แปลงหมายเลขเดือน (1-12) เป็นชื่อเดือนไทยแบบย่อ
 * @param {string|number} monthNumber - หมายเลขเดือน (เช่น "1" หรือ 1 สำหรับมกราคม)
 * @returns {string} ชื่อเดือนไทยแบบย่อ หรือตัวเลขเดือนถ้าไม่ถูกต้อง
 */
function getThaiShortMonth(monthNumber) {
    const index = parseInt(monthNumber) - 1; // ปรับ index เพราะเดือนใน JavaScript เริ่มที่ 0
    if (index >= 0 && index < 12) { // ตรวจสอบว่า index อยู่ในช่วงที่ถูกต้อง
        return thaiShortMonths[index];
    }
    return monthNumber.toString(); // ถ้าไม่ถูกต้อง คืนค่าเดิมเป็นสตริง
}

// --- DOM Elements ที่ใช้บ่อย (จะถูกกำหนดค่าใน DOMContentLoaded) ---
let loginModal, loginForm;
// loginLogoutButton และ roleSpecificMenuContainer จะถูกจัดการผ่าน mainNavUl โดยตรง

// --- ฟังก์ชันเกี่ยวกับ Login และ Session ---

/**
 * ดึงข้อมูลผู้ใช้ที่ล็อกอินจาก sessionStorage
 * @returns {object|null} ข้อมูลผู้ใช้ (username, role) หรือ null ถ้าไม่มี
 */
function getUserSession() {
    const sessionUser = sessionStorage.getItem('loggedInUser');
    return sessionUser ? JSON.parse(sessionUser) : null;
}

/**
 * เก็บข้อมูลผู้ใช้ที่ล็อกอินลงใน sessionStorage
 * @param {object} userData - ข้อมูลผู้ใช้ (เช่น { username: 'test', role: 'admin' })
 */
function setUserSession(userData) {
    sessionStorage.setItem('loggedInUser', JSON.stringify(userData));
}

/**
 * ล้างข้อมูลผู้ใช้ที่ล็อกอินออกจาก sessionStorage
 */
function clearUserSession() {
    sessionStorage.removeItem('loggedInUser');
}

/**
 * จัดการการ submit ฟอร์มล็อกอิน
 * @param {Event} event - อ็อบเจกต์ Event
 */
async function handleLoginSubmit(event) {
    event.preventDefault(); // ป้องกันการ submit ฟอร์มแบบปกติ (ไม่ให้หน้า refresh)
    const usernameInput = document.getElementById('username');
    const passwordInput = document.getElementById('password');
    const username = usernameInput.value.trim(); // ดึงค่า username และตัดช่องว่างหน้าหลัง
    const password = passwordInput.value; // ดึงค่า password

    // ตรวจสอบว่ากรอกข้อมูลครบถ้วนหรือไม่
    if (!username || !password) {
        Swal.fire({ icon: 'warning', title: 'ข้อมูลไม่ครบถ้วน', text: 'กรุณากรอกชื่อผู้ใช้และรหัสผ่านค่ะ'});
        return;
    }

    // แสดง loading dialog
    Swal.fire({ title: 'กำลังตรวจสอบ...', allowOutsideClick: false, didOpen: () => { Swal.showLoading(); }});

    try {
        // ส่ง request ไปยัง Google Apps Script เพื่อตรวจสอบการล็อกอิน
        const response = await fetch(WEB_APP_URL, {
            method: 'POST', // ใช้วิธี POST
            mode: 'cors', // อนุญาต Cross-Origin Resource Sharing
            credentials: 'omit', // ไม่ส่ง credentials (cookies, authorization headers)
            headers: { 'Content-Type': 'text/plain;charset=utf-8' }, // ระบุ content type เป็น text/plain เพื่อให้ Apps Script doGet/doPost แบบ text/plain รับได้ง่าย
            body: JSON.stringify({ action: "verifyLogin", username: username, password: password }) // ข้อมูลที่จะส่งไปในรูปแบบ JSON string
        });

        const result = await response.json(); // แปลง response เป็น JSON
        Swal.close(); // ปิด loading dialog

        if (result.success) { // ถ้าล็อกอินสำเร็จ
            setUserSession({ username: result.username, role: result.role }); // เก็บข้อมูล session
            Swal.fire({ icon: 'success', title: 'เข้าสู่ระบบสำเร็จ!', text: `ยินดีต้อนรับคุณ ${result.username}`, timer: 1500, showConfirmButton: false });
            loginModal.classList.add('hidden'); // ซ่อน modal ล็อกอิน
            loginForm.reset(); // รีเซ็ตฟอร์ม
            updateLoginUI(); // อัปเดต UI เมนู
            // ถ้าหน้า Smart School แสดงอยู่ ให้โหลดข้อมูลตารางใหม่ (เผื่อมีคอลัมน์ที่ขึ้นกับ login)
            if (document.getElementById('content-smart-school') && !document.getElementById('content-smart-school').classList.contains('hidden')) {
                fetchAndDisplayTableData('getSystemLinks', 'content-smart-school');
            }
        } else { // ถ้าล็อกอินไม่สำเร็จ
            Swal.fire({ icon: 'error', title: 'เข้าสู่ระบบไม่สำเร็จ', text: result.message || 'มีบางอย่างผิดพลาด กรุณาลองใหม่อีกครั้งค่ะ'});
        }
    } catch (error) { // กรณีเกิดข้อผิดพลาดในการเชื่อมต่อ
        Swal.close();
        console.error("Login error:", error);
        Swal.fire({ icon: 'error', title: 'เกิดข้อผิดพลาด', text: 'ไม่สามารถเชื่อมต่อกับระบบ Login ได้ กรุณาลองใหม่อีกครั้งค่ะ'});
    }
}

/**
 * จัดการการล็อกเอาท์
 */
function handleLogout() {
    clearUserSession(); // ล้างข้อมูล session
    Swal.fire({ icon: 'info', title: 'ออกจากระบบแล้ว', timer: 1500, showConfirmButton: false });
    updateLoginUI(); // อัปเดต UI เมนู
    // ถ้าหน้า Smart School แสดงอยู่ ให้โหลดข้อมูลตารางใหม่ (เพื่อให้คอลัมน์ลิงก์หายไปถ้าต้องซ่อน)
    if (document.getElementById('content-smart-school') && !document.getElementById('content-smart-school').classList.contains('hidden')) {
        fetchAndDisplayTableData('getSystemLinks', 'content-smart-school');
    }
}

/**
 * อัปเดต UI ของเมนู Login/Logout และเมนูตามสิทธิ์ผู้ใช้
 */
function updateLoginUI() {
    const user = getUserSession(); // ดึงข้อมูลผู้ใช้ปัจจุบัน
    // หา <ul> หลักใน <nav> ที่มีพื้นหลังสีขาว (เป็นที่สำหรับใส่เมนู Login/Logout)
    const mainWhiteNavUl = document.querySelector('header nav.bg-white ul');
    if (!mainWhiteNavUl) {
        console.error("Main navigation UL (with white background) not found for login UI update.");
        return;
    }

    // ลบเมนูที่เกี่ยวกับ role และ login/logout เก่าที่สร้างโดย JS ออกก่อน เพื่อไม่ให้ซ้ำซ้อน
    const existingGeneratedMenus = mainWhiteNavUl.querySelectorAll('.generated-menu-item');
    existingGeneratedMenus.forEach(item => item.remove());

    let menuItemsHtml = ''; // สร้าง HTML สำหรับเมนูที่จะเพิ่มใหม่

    if (user) { // ถ้ามีผู้ใช้ล็อกอินอยู่
        // สร้างเมนูตาม Role (เพิ่มก่อน Logout เพื่อให้อยู่ด้านซ้ายของ Logout)
        if (user.role === 'admin' || user.role === 'manager') {
            menuItemsHtml += `<li class="generated-menu-item"><a href="#" class="menu-item px-3 py-2 text-gray-700 hover:text-red-500">ลงทะเบียนรับหนังสือ</a></li>`;
        }
        if (user.role === 'manager') {
            menuItemsHtml += `<li class="generated-menu-item"><a href="#" class="menu-item px-3 py-2 text-gray-700 hover:text-red-500">จัดการระบบ</a></li>`;
        }
        // สร้างเมนู Logout
        menuItemsHtml += `<li class="generated-menu-item"><a href="#" id="perform-logout-action" class="menu-item px-3 py-2 text-gray-700 hover:text-red-500">Logout (${user.username})</a></li>`;
    } else { // ถ้าไม่มีผู้ใช้ล็อกอิน
        // สร้างเมนู Login
        menuItemsHtml += `<li class="generated-menu-item"><a href="#" id="perform-login-action" class="menu-item px-3 py-2 text-gray-700 hover:text-red-500">Login</a></li>`;
    }

    // เพิ่ม HTML ของเมนูใหม่เข้าไปใน <ul>
    mainWhiteNavUl.insertAdjacentHTML('beforeend', menuItemsHtml);

    // เพิ่ม Event Listener ใหม่ให้กับปุ่ม Login/Logout ที่เพิ่งสร้าง
    const loginButton = document.getElementById('perform-login-action');
    if (loginButton) {
        loginButton.addEventListener('click', (e) => {
            e.preventDefault(); // ป้องกันการเปลี่ยนหน้า (ถ้า href="#" อาจทำให้เพจเลื่อนขึ้น)
            openLoginModal(); // เปิด modal ล็อกอิน
        });
    }

    const logoutButton = document.getElementById('perform-logout-action');
    if (logoutButton) {
        logoutButton.addEventListener('click', (e) => {
            e.preventDefault(); // ป้องกันการเปลี่ยนหน้า
            handleLogout(); // เรียกฟังก์ชันล็อกเอาท์
        });
    }
}

/**
 * เปิด Modal สำหรับล็อกอิน
 */
function openLoginModal() {
    if (loginModal) {
        loginModal.classList.remove('hidden'); // แสดง modal
    } else {
        console.error("Login modal element not found.");
    }
}

// --- เมื่อเอกสาร HTML โหลดเสร็จสมบูรณ์ ---
document.addEventListener('DOMContentLoaded', function () {
    const homeLink = document.getElementById('home-link'); // ลิงก์หน้าหลัก
    const contentSections = document.querySelectorAll('.content-section'); // ทุก section ที่เป็นเนื้อหา
    const centerContentTitle = document.getElementById('center-content-title'); // element ที่แสดง title ของเนื้อหาปัจจุบัน
    const initialTitle = 'ยินดีต้อนรับสู่โรงเรียนชุมชนบ้านแม่หละป่าป๋วย'; // title เริ่มต้น
    const schoolInfoPrefix = 'Smart School Service - '; // prefix สำหรับ title เมื่อเลือกเมนูใน sidebar

    // กำหนดค่าให้กับ Global DOM Elements (loginModal, loginForm)
    loginModal = document.getElementById('loginModal');
    loginForm = document.getElementById('loginForm');
    // loginLogoutButton และ roleSpecificMenuContainer ไม่ได้ใช้เป็นตัวแปร global โดยตรงแล้ว
    // แต่จะถูกจัดการผ่าน mainWhiteNavUl ใน updateLoginUI
    const closeLoginModalButton = document.getElementById('closeLoginModalButton'); // ปุ่มปิด modal

    // Event Listeners สำหรับ Modal (ถ้า loginModal และ loginForm มีอยู่จริง)
    if (loginForm) {
        loginForm.addEventListener('submit', handleLoginSubmit); // เมื่อฟอร์ม login ถูก submit
    } else {
        console.error("Login form element not found.");
    }
    if (closeLoginModalButton) {
        closeLoginModalButton.addEventListener('click', () => { // เมื่อคลิกปุ่มปิด modal
            if(loginModal) loginModal.classList.add('hidden'); // ซ่อน modal
            if(loginForm) loginForm.reset(); // รีเซ็ตฟอร์ม
        });
    }
    if (loginModal) {
        loginModal.addEventListener('click', (event) => { // เมื่อคลิกพื้นที่นอก modal (ตัว modal เอง)
            if (event.target === loginModal) {
                loginModal.classList.add('hidden'); // ซ่อน modal
                if(loginForm) loginForm.reset(); // รีเซ็ตฟอร์ม
            }
        });
    }

    /**
     * ฟังก์ชันแสดงเนื้อหาตามเมนูที่เลือก (SPA-like behavior)
     * @param {string} targetId - ID ของ content-section ที่จะแสดง
     * @param {HTMLElement} linkElement - Element ของลิงก์ที่ถูกคลิก (ใช้สำหรับกำหนด title และ active state)
     */
    window.showContent = function(targetId, linkElement) {
        // ซ่อน content-section ทั้งหมดก่อน
        contentSections.forEach(section => {
            section.classList.add('hidden');
        });

        const targetSection = document.getElementById(targetId); // หา section เป้าหมาย
        if (targetSection) {
            targetSection.classList.remove('hidden'); // แสดง section ที่ต้องการ
        } else { // ถ้าไม่เจอ section เป้าหมาย ให้แสดง default
            document.getElementById('content-default').classList.remove('hidden');
            targetId = 'content-default'; // อัปเดต targetId เป็น default
            // console.warn(`Content section with id "${targetId}" not found. Showing default.`);
        }

        // อัปเดตข้อความ title ตรงกลาง
        let newTitleText = initialTitle;
        if (linkElement) { // ถ้ามีการส่ง linkElement มา (เช่น มาจากการคลิกเมนู)
            newTitleText = linkElement.textContent.trim(); // ใช้ text ของ linkElement เป็น title
            if (targetId === 'content-default') { // ถ้าเป็นหน้า default ให้ใช้ initialTitle
                newTitleText = initialTitle;
            } else if (linkElement.closest('.sidebar')) { // ถ้า linkElement อยู่ใน sidebar
                newTitleText = schoolInfoPrefix + newTitleText; // เพิ่ม prefix
            }
        }
        centerContentTitle.textContent = newTitleText;

        // จัดการ Active State ของเมนูใน Header และ Sidebar
        // ลบคลาส active ออกจากเมนูทั้งหมดก่อน
        document.querySelectorAll('header nav ul a.menu-item, #main-menu a').forEach(link => {
            link.classList.remove('active', 'text-red-500', 'font-semibold'); // คลาส active สำหรับ nav สีขาว
            if (link.closest('#main-menu')) { // ถ้าเป็นลิงก์ใน sidebar
                link.classList.add('text-gray-700'); // สีปกติของ sidebar
                link.classList.remove('text-red-600'); // ลบสี active ของ sidebar ออกก่อน
            } else if (link.closest('header nav ul')) { // ถ้าเป็นลิงก์ใน nav สีขาว
                link.classList.add('text-gray-700'); // สีปกติของ nav สีขาว
            }
        });

        // กำหนด active state ให้กับเมนูใน header (nav สีขาว)
        // ต้องมั่นใจว่า selector นี้ครอบคลุมลิงก์ทั้งหมดใน nav ที่มีพื้นหลังสีขาว รวมถึงลิงก์ที่สร้างจาก JS
        const activeHeaderLink = document.querySelector(`header nav.bg-white ul a[data-target="${targetId}"], header nav.bg-white ul a#home-link[data-target="${targetId}"], header nav.bg-white ul li.generated-menu-item a[data-target="${targetId}"]`);
        if (linkElement && linkElement.closest('header nav.bg-white ul')) { // ถ้า linkElement ที่คลิกอยู่ใน nav ขาว
             linkElement.classList.add('active', 'text-red-500', 'font-semibold');
             linkElement.classList.remove('text-gray-700');
        } else if (activeHeaderLink) { // กรณีโหลดหน้า default หรืออื่นๆ ที่ไม่ได้เกิดจากการคลิก linkElement โดยตรงใน nav ขาว
            activeHeaderLink.classList.add('active', 'text-red-500', 'font-semibold');
            activeHeaderLink.classList.remove('text-gray-700');
        }

        // กำหนด active state ให้กับเมนูใน sidebar
        const activeSidebarLink = document.querySelector(`#main-menu a[data-target="${targetId}"]`);
        if (activeSidebarLink) {
            activeSidebarLink.classList.add('active', 'text-red-600', 'font-semibold');
            activeSidebarLink.classList.remove('text-gray-700');
        }

        // เรียกฟังก์ชันโหลดข้อมูลตาม content ที่แสดง
        if (targetId === 'content-personnel') fetchPersonnelData();
        else if (targetId === 'content-students') fetchStudentSummaryData();
        else if (targetId === 'content-smart-school') fetchAndDisplayTableData('getSystemLinks', 'content-smart-school');
        else if (targetId === 'content-information-links') fetchAndDisplayTableData('getInformationLinks', 'content-information-links');
        else if (targetId === 'content-action-plan') displayPdf('content-action-plan', 'https://drive.google.com/file/d/1n3XtVetBdlzZqaDE8Hlm5xs9GGQg0sSH/preview');
        else if (targetId === 'content-operation-report') displayPdf('content-operation-report', 'https://drive.google.com/file/d/1jmBa9Heg4SH9apJlubVRLFfZBm42cZXw/preview');
    }

    // Event listener สำหรับเมนูหลักๆ ที่มี data-target (ใน header nav สีขาว และ sidebar)
    document.querySelectorAll('header nav.bg-white ul a[data-target], #main-menu a[data-target]').forEach(link => {
        link.addEventListener('click', function (event) {
            event.preventDefault(); // ป้องกันการ redirect ของลิงก์
            const targetId = this.dataset.target; // ดึง ID ของ content-section จาก attribute data-target
            window.showContent(targetId, this); // เรียกฟังก์ชันแสดงเนื้อหา
        });
    });

    // เพิ่ม event listener ให้กับ #home-link โดยเฉพาะ (ถ้ายังไม่มีจาก selector ด้านบน)
    if(homeLink) {
        homeLink.addEventListener('click', function (event) {
            event.preventDefault();
            const targetId = this.dataset.target;
            window.showContent(targetId, this);
        });
    }

    // แสดงเนื้อหาเริ่มต้น (หน้า Home)
    const defaultTarget = homeLink && homeLink.dataset.target ? homeLink.dataset.target : 'content-default';
    window.showContent(defaultTarget, homeLink); // เรียก showContent สำหรับ home link เมื่อโหลดหน้า

    updateLoginUI(); // ตรวจสอบสถานะ Login และอัปเดต UI เมนูเมื่อโหลดหน้า
    fetchVisitorStats(); // ดึงสถิติผู้เข้าชม
    calculateAndDisplaySchoolAge(); // คำนวณและแสดงอายุโรงเรียน
    fetchAndDisplayCalendarEvents(); // ดึงและแสดงกิจกรรมปฏิทิน
});

// --- ฟังก์ชันดึงข้อมูลต่างๆ (VisitorStats, Personnel, Students, PDF, Calendar) ---

/**
 * ฟังก์ชันดึงสถิติผู้เข้าชมจาก Google Apps Script และแสดงผล
 */
async function fetchVisitorStats() {
    const visitsTodayEl = document.getElementById('visits-today');
    const visitsMonthEl = document.getElementById('visits-this-month');
    const visitsTotalEl = document.getElementById('visits-total');
    try {
        // เพิ่ม timestamp เพื่อป้องกัน browser cache
        const response = await fetch(`${WEB_APP_URL}?action=logVisitAndGetCounts&timestamp=${new Date().getTime()}`);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const result = await response.json();

        if (result.error) { // ถ้า Apps Script ส่ง error กลับมา
            console.error("Error fetching visitor stats:", result.error, result.details || "");
            visitsTodayEl.textContent = "-"; visitsMonthEl.textContent = "-"; visitsTotalEl.textContent = "-"; return;
        }
        if (result.data) { // ถ้ามีข้อมูลสถิติ
            visitsTodayEl.textContent = `${result.data.today.toLocaleString()} คน`;
            visitsMonthEl.textContent = `${result.data.month.toLocaleString()} คน`;
            visitsTotalEl.textContent = `${result.data.total.toLocaleString()} คน`;
        } else { // ถ้าไม่มีข้อมูล (ไม่ควรเกิดถ้า script ทำงานถูกต้อง)
            visitsTodayEl.textContent = "N/A"; visitsMonthEl.textContent = "N/A"; visitsTotalEl.textContent = "N/A";
        }
    } catch (error) { // กรณีเกิดข้อผิดพลาดในการเชื่อมต่อ
        console.error("Failed to fetch visitor stats:", error);
        visitsTodayEl.textContent = "ข้อผิดพลาด"; visitsMonthEl.textContent = "ข้อผิดพลาด"; visitsTotalEl.textContent = "ข้อผิดพลาด";
    }
}

/**
 * ฟังก์ชันดึงข้อมูลบุคลากรจาก Google Apps Script และแสดงผลในรูปแบบตาราง
 */
async function fetchPersonnelData() {
    const personnelContentDiv = document.getElementById('content-personnel');
    personnelContentDiv.innerHTML = '<p class="text-gray-500 animate-pulse">กำลังโหลดข้อมูลบุคลากร...</p>'; // แสดงข้อความกำลังโหลด
    try {
        const response = await fetch(`${WEB_APP_URL}?action=getPersonnel&timestamp=${new Date().getTime()}`);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const result = await response.json();

        if (result.error) { // ถ้า Apps Script ส่ง error กลับมา
            personnelContentDiv.innerHTML = `<p class="text-red-500">เกิดข้อผิดพลาด: ${result.error} ${result.details || ''}</p><p class="text-sm text-gray-600">โปรดตรวจสอบฯ</p>`;
            console.error("Error fetching personnel:", result); return;
        }
        if (result.data && result.data.length > 0) { // ถ้ามีข้อมูลบุคลากร
            // สร้างตาราง HTML
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
            personnelContentDiv.innerHTML = html; // แสดงตาราง
        } else { // ถ้าไม่มีข้อมูล
            personnelContentDiv.innerHTML = '<p>ไม่พบข้อมูลบุคลากรฯ</p>';
        }
    } catch (error) { // กรณีเกิดข้อผิดพลาดในการเชื่อมต่อ
        personnelContentDiv.innerHTML = `<p class="text-red-500">การเชื่อมต่อล้มเหลว: ${error.message}</p><p class="text-sm text-gray-600">โปรดตรวจสอบฯ</p>`;
        console.error("Fetch error for personnel:", error);
    }
}

/**
 * ฟังก์ชันดึงข้อมูลสรุปจำนวนนักเรียนจาก Google Apps Script และแสดงผลในรูปแบบตาราง
 */
async function fetchStudentSummaryData() {
    const studentContentDiv = document.getElementById('content-students');
    studentContentDiv.innerHTML = '<p class="text-gray-500 animate-pulse">กำลังโหลดข้อมูลนักเรียน...</p>'; // แสดงข้อความกำลังโหลด
    try {
        const response = await fetch(`${WEB_APP_URL}?action=getStudentSummary&timestamp=${new Date().getTime()}`);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const result = await response.json();

        if (result.error) { // ถ้า Apps Script ส่ง error กลับมา
            studentContentDiv.innerHTML = `<p class="text-red-500">เกิดข้อผิดพลาด: ${result.error} ${result.details || ''}</p><p class="text-sm text-gray-600">โปรดตรวจสอบฯ</p>`;
            console.error("Error fetching student summary:", result); return;
        }
        if (result.data && result.data.length > 0) { // ถ้ามีข้อมูลนักเรียน
            // สร้างตาราง HTML
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
            // แถวสรุปรวม
            html += `<tr class="font-bold bg-yellow-50"><td class="px-4 py-2 whitespace-nowrap text-gray-900">รวมทุกระดับ</td>` +
                    `<td class="px-4 py-2 whitespace-nowrap text-gray-900 text-center">${totalBoys}</td>` +
                    `<td class="px-4 py-2 whitespace-nowrap text-gray-900 text-center">${totalGirls}</td>` +
                    `<td class="px-4 py-2 whitespace-nowrap text-gray-900 text-center">${grandTotalAll}</td></tr>`;
            html += '</tbody></table></div>';
            studentContentDiv.innerHTML = html; // แสดงตาราง
        } else { // ถ้าไม่มีข้อมูล
            studentContentDiv.innerHTML = '<p>ไม่พบข้อมูลนักเรียนฯ</p>';
        }
    } catch (error) { // กรณีเกิดข้อผิดพลาดในการเชื่อมต่อ
        studentContentDiv.innerHTML = `<p class="text-red-500">การเชื่อมต่อล้มเหลว: ${error.message}</p><p class="text-sm text-gray-600">โปรดตรวจสอบฯ</p>`;
        console.error("Fetch error for student summary:", error);
    }
}

/**
 * ฟังก์ชันแสดงไฟล์ PDF ใน iframe
 * @param {string} targetDivId - ID ของ div ที่จะใส่ iframe
 * @param {string} pdfUrl - URL ของไฟล์ PDF (ควรเป็น URL สำหรับ preview ของ Google Drive)
 */
function displayPdf(targetDivId, pdfUrl) {
    const contentDiv = document.getElementById(targetDivId);
    if (pdfUrl && pdfUrl.startsWith('https://drive.google.com/file/d/')) { // ตรวจสอบว่าเป็น URL Google Drive ที่ถูกต้อง
         contentDiv.innerHTML = `<iframe src="${pdfUrl}" class="pdf-embed-container" frameborder="0" allowfullscreen><p>เบราว์เซอร์ไม่รองรับ PDF <a href="${pdfUrl.replace('/preview', '/view')}" target="_blank">เปิดที่นี่</a>.</p></iframe>`;
    } else { // ถ้า URL ไม่ถูกต้องหรือไม่ใช่ Google Drive
         contentDiv.innerHTML = `<p class="text-gray-600 mt-4">ยังไม่มีไฟล์ หรือ URL ผิดพลาด</p><p class="text-sm text-gray-500">(ผู้ดูแลระบบ: ตรวจสอบ URL)</p>`;
    }
}

/**
 * ฟังก์ชันดึงและแสดงกิจกรรมจากปฏิทิน (Google Calendar ผ่าน Apps Script)
 */
async function fetchAndDisplayCalendarEvents() {
    const calendarContainer = document.getElementById('calendar-events-container'); // Container สำหรับแสดงปฏิทิน
    if (!calendarContainer) { console.error("Calendar container not found!"); return; }
    calendarContainer.innerHTML = '<p class="text-gray-500 animate-pulse">กำลังโหลดปฏิทิน...</p>'; // แสดงข้อความกำลังโหลด
    try {
        const response = await fetch(`${WEB_APP_URL}?action=getCalendarEvents&timestamp=${new Date().getTime()}`);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const result = await response.json();

        if (result.error) { // ถ้า Apps Script ส่ง error กลับมา
            console.error("Error fetching calendar:", result.error, result.details || "");
            calendarContainer.innerHTML = `<p class="text-red-500">โหลดปฏิทินไม่ได้: ${result.error}</p>`; return;
        }
        if (result.data && result.data.length > 0) { // ถ้ามีกิจกรรม
            let htmlContent = '';
            result.data.forEach((event, index) => {
                const day = event.day || '';
                const monthDisplay = event.month ? getThaiShortMonth(event.month) : ''; // แปลงเป็นเดือนไทยย่อ
                const year = event.year || '';
                const activity = event.activity || 'ไม่มีรายละเอียด';
                // กำหนดคลาสสำหรับรายการสุดท้าย ไม่ให้มีเส้นคั่นด้านล่าง
                const itemClass = (index === result.data.length - 1) ? 'mb-0 pb-0 border-none' : 'mb-3 pb-3 border-b border-dashed border-red-200';
                htmlContent += `<div class="${itemClass}"><p class="font-bold text-red-600">${day} ${monthDisplay} ${year}</p><p class="text-gray-700">${activity}</p></div>`;
            });
            calendarContainer.innerHTML = htmlContent; // แสดงกิจกรรม
        } else { // ถ้าไม่มีกิจกรรม
            calendarContainer.innerHTML = '<p class="text-gray-700">ไม่มีกิจกรรมเดือนนี้</p>';
        }
    } catch (error) { // กรณีเกิดข้อผิดพลาดในการเชื่อมต่อ
        console.error("Failed to fetch calendar:", error);
        calendarContainer.innerHTML = '<p class="text-red-500">เชื่อมต่อปฏิทินล้มเหลว</p>';
    }
}

 // --- Tab System for ONESQA Standards (มาตรฐานที่ 1, 2, 3) ---
        // เลือกปุ่ม Tab และ Panel ทั้งหมดของ ONESQA
        const onesqaTabButtons = document.querySelectorAll('#onesqaStandardsTabs .onesqa-tab-button');
        const onesqaTabPanels = document.querySelectorAll('#onesqaStandardsTabContent .onesqa-tab-panel');

        // กำหนดคลาส Tailwind สำหรับสไตล์ Active และ Inactive ของ Tab และ Panel
        const activeTabClasses = ['text-red-600', 'border-red-600', 'font-semibold', 'bg-gray-100', 'dark:bg-gray-700', 'dark:text-red-500', 'dark:border-red-500', 'relative', '-mb-px'];
        const inactiveTabClasses = ['text-gray-500', 'hover:text-gray-700', 'hover:border-gray-300', 'dark:text-gray-400', 'dark:hover:text-gray-300', 'border-transparent', 'bg-transparent'];

        const activePanelClasses = ['bg-gray-100', 'dark:bg-gray-700', 'border-t-0']; // พื้นหลังเข้มขึ้นสำหรับ panel active
        const inactivePanelClasses = ['bg-white', 'dark:bg-gray-800']; // พื้นหลังปกติสำหรับ panel inactive

        /**
         * อัปเดตสถานะของ Tab และ Panel ตามปุ่มที่ถูกเลือก
         * @param {HTMLElement} selectedButton - ปุ่ม Tab ที่ถูกคลิก
         */
        function updateOnesqaTabs(selectedButton) {
            onesqaTabButtons.forEach(button => {
                const targetPanelId = button.getAttribute('data-tabs-target'); // ID ของ Panel ที่เชื่อมกับปุ่มนี้
                const targetPanel = document.querySelector(targetPanelId);

                if (button === selectedButton) { // ถ้าเป็นปุ่มที่ถูกเลือก (active)
                    button.setAttribute('aria-selected', 'true'); // ตั้ง attribute สำหรับ accessibility
                    button.classList.remove(...inactiveTabClasses); // ลบคลาส inactive
                    button.classList.add(...activeTabClasses);     // เพิ่มคลาส active

                    if (targetPanel) {
                        targetPanel.classList.remove('hidden'); // แสดง Panel
                        targetPanel.classList.remove(...inactivePanelClasses);
                        targetPanel.classList.add(...activePanelClasses); // เพิ่มคลาสพื้นหลังเข้ม

                        // จัดการมุมโค้งของ Panel ให้ดูเหมือนแฟ้ม (tab เชื่อมกับ panel)
                        targetPanel.classList.remove('rounded-tl-lg', 'rounded-tr-lg'); // ลบมุมโค้งเดิม
                        if (button.parentElement.previousElementSibling === null) { // ถ้าเป็น tab แรกสุด
                           targetPanel.classList.add('rounded-tr-lg'); // ทำให้มุมขวาบนของ panel โค้ง
                        } else if (button.parentElement.nextElementSibling === null) { // ถ้าเป็น tab สุดท้าย
                           targetPanel.classList.add('rounded-tl-lg'); // ทำให้มุมซ้ายบนของ panel โค้ง
                        }
                    }
                } else { // ถ้าเป็นปุ่มอื่น (inactive)
                    button.setAttribute('aria-selected', 'false');
                    button.classList.remove(...activeTabClasses);
                    button.classList.add(...inactiveTabClasses);

                    if (targetPanel) {
                        targetPanel.classList.add('hidden'); // ซ่อน Panel
                        targetPanel.classList.remove(...activePanelClasses);
                        targetPanel.classList.add(...inactivePanelClasses); // เพิ่มคลาสพื้นหลังปกติ (ถ้ามีการสลับ)
                        targetPanel.classList.remove('rounded-tl-lg', 'rounded-tr-lg', 'border-t-0'); // ลบสไตล์ที่อาจค้างอยู่
                    }
                }
            });
        }

        // เพิ่ม Event Listener ให้กับทุกปุ่ม Tab
        onesqaTabButtons.forEach(button => {
            button.addEventListener('click', function() {
                updateOnesqaTabs(this); // เรียกฟังก์ชันอัปเดตเมื่อคลิก
            });
        });

        // ทำให้ Tab แรก Active และ Panel แรกมีพื้นหลังเข้มเมื่อโหลดหน้า
        if (onesqaTabButtons.length > 0) {
            updateOnesqaTabs(onesqaTabButtons[0]);
        }

/**
 * ฟังก์ชันดึงข้อมูลตาราง (Smart School, Information Links) จาก Google Apps Script
 * และแสดงผล โดยมีการตรวจสอบสถานะ Login สำหรับ Smart School
 * @param {string} actionName - ชื่อ action ที่จะส่งไปให้ Apps Script (เช่น 'getSystemLinks', 'getInformationLinks')
 * @param {string} targetDivId - ID ของ div ที่จะแสดงตาราง
 */
async function fetchAndDisplayTableData(actionName, targetDivId) {
    const contentDiv = document.getElementById(targetDivId);
    contentDiv.innerHTML = `<p class="text-gray-500 animate-pulse">กำลังโหลดข้อมูล...</p>`; // แสดงข้อความกำลังโหลด
    const userSession = getUserSession(); // ดึงข้อมูล session ของผู้ใช้

    try {
        const response = await fetch(`${WEB_APP_URL}?action=${actionName}&timestamp=${new Date().getTime()}`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const result = await response.json();
        if (result.error) { // ถ้า Apps Script ส่ง error กลับมา
            contentDiv.innerHTML = `<p class="text-red-500">เกิดข้อผิดพลาด: ${result.error} ${result.details || ''}</p>`;
            console.error(`Error fetching ${actionName}:`, result);
            return;
        }

        if (result.data && result.data.length > 0) { // ถ้ามีข้อมูล
            let html = '';
            html += '<div class="overflow-x-auto">';
            html += '<table class="link-table min-w-full text-sm data-table-theme">';
            html += '<thead><tr>';
            html += '<th scope="col" class="col-number px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">ลำดับ</th>';
            html += '<th scope="col" class="col-name px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ชื่อรายการ</th>';

            // เงื่อนไข: แสดงคอลัมน์ "ลิงก์" ถ้าผู้ใช้ล็อกอินอยู่ (สำหรับ Smart School)
            // หรือแสดงเสมอถ้าไม่ใช่ Smart School (เช่น Information Links)
            if (userSession || targetDivId !== 'content-smart-school') {
                 html += '<th scope="col" class="col-link px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">ลิงก์</th>';
            }
            html += '</tr></thead>';
            html += '<tbody class="bg-white divide-y divide-gray-200">';

            result.data.forEach(item => {
                html += '<tr>';
                html += `<td class="col-number px-4 py-2 text-center whitespace-nowrap align-middle">${item.number || '-'}</td>`;
                html += `<td class="col-name px-4 py-2 whitespace-nowrap align-middle">${item.name || '-'}</td>`;

                if (targetDivId === 'content-smart-school') { // ถ้าเป็นหน้า Smart School
                    if (userSession) { // และผู้ใช้ล็อกอินอยู่
                        // ตรวจสอบว่ามีลิงก์ที่ถูกต้องหรือไม่
                        const linkDestination = item.link && item.link.trim() !== "" && item.link.trim().toLowerCase() !== "n/a" && item.link.trim().toLowerCase() !== "-" ? item.link.trim() : "";
                        // กำหนด target="_blank" ถ้าเป็นลิงก์ภายนอก
                        const targetAttribute = linkDestination && (linkDestination.startsWith('http://') || linkDestination.startsWith('https://')) ? 'target="_blank" rel="noopener noreferrer"' : '';
                        let iconHtml = "<span class='text-gray-400'>-</span>"; // Icon เริ่มต้น (ขีดกลาง)
                        if (linkDestination) { // ถ้ามีลิงก์
                            iconHtml = `<img src='https://i.postimg.cc/25R6kGJx/ico1.png' border='0' alt='เปิดลิงก์ ${item.name || ''}' class='w-6 h-6 mx-auto'>`; // Icon รูปประตู
                        }
                        html += `<td class="col-link px-4 py-2 text-center whitespace-nowrap align-middle">`;
                        if (linkDestination) { // ถ้ามีลิงก์ ให้สร้าง <a> tag
                            html += `<a href="${linkDestination}" ${targetAttribute} class="inline-flex items-center justify-center p-1 rounded-md group focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500" title="เปิดลิงก์: ${item.name || ''}">${iconHtml}<span class="sr-only">เปิดลิงก์ ${item.name || ''}</span></a>`;
                        } else { // ถ้าไม่มีลิงก์ แสดง icon ขีดกลาง
                            html += iconHtml;
                        }
                        html += `</td>`;
                    }
                    // ไม่ต้องมี else ที่นี่ เพราะถ้าไม่ login คอลัมน์ "ลิงก์" จะไม่ถูกสร้างตั้งแต่แรก (ตามเงื่อนไข if ด้านบน)
                } else { // ถ้าเป็นหน้าอื่นที่ไม่ใช่ Smart School (เช่น Information Links) จะแสดงลิงก์เสมอ
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
            contentDiv.innerHTML = html; // แสดงตาราง
        } else { // ถ้าไม่มีข้อมูล หรือชีตว่าง
            contentDiv.innerHTML = `<p>ไม่พบข้อมูล หรือชีตอาจจะว่าง</p>`;
        }
    } catch (error) { // กรณีเกิดข้อผิดพลาดในการเชื่อมต่อ
        contentDiv.innerHTML = `<p class="text-red-500">การเชื่อมต่อล้มเหลว: ${error.message}</p>`;
        console.error(`Fetch error for ${actionName}:`, error);
    }
}
