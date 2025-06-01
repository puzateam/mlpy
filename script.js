// URL ของ Google Apps Script Web App ที่ deploy ไว้
const WEB_APP_URL = "https://script.google.com/macros/s/AKfycbwhebb9_B8capBfAY51Ojt9putofpwP32bmXXv8llJ3og4c7a3quxLdBsnKb64uAfTo/exec";

// ฟังก์ชันสำหรับคำนวณและแสดงอายุโรงเรียน
function calculateAndDisplaySchoolAge() {
    const foundingDate = new Date(1925, 10, 1); // วันที่ก่อตั้งโรงเรียน: ปี 1925, เดือนพฤศจิกายน (index 10), วันที่ 1
    const today = new Date(); // วันที่ปัจจุบัน
    let age = today.getFullYear() - foundingDate.getFullYear(); // คำนวณอายุเบื้องต้นจากปี
    const monthDifference = today.getMonth() - foundingDate.getMonth(); // ผลต่างของเดือน
    const dayDifference = today.getDate() - foundingDate.getDate(); // ผลต่างของวัน

    // ปรับอายุถ้ายังไม่ถึงวันเกิดในปีปัจจุบัน
    if (monthDifference < 0 || (monthDifference === 0 && dayDifference < 0)) {
        age--;
    }
    // หมายเหตุ: ใน HTML ที่ให้มา ไม่มี element ที่มี id="school-age-text" 
    // หากต้องการให้ฟังก์ชันนี้ทำงาน ต้องเพิ่ม <span id="school-age-text"></span> ใน HTML ณ จุดที่ต้องการแสดงอายุ
    const schoolAgeTextElement = document.getElementById('school-age-text');
    if (schoolAgeTextElement) {
        schoolAgeTextElement.textContent = `(รวมอายุ ${age} ปี)`; // แสดงผลอายุ
    } else {
        console.error("Element with id 'school-age-text' not found. School age cannot be displayed by this function.");
    }
}

// ฟังก์ชันสำหรับแปลงเลขเดือน (1-12) เป็นชื่อเดือนไทยแบบย่อ
const thaiShortMonths = ["ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.", "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."];
function getThaiShortMonth(monthNumber) {
    const index = parseInt(monthNumber) - 1; // เดือน 1 (ม.ค.) คือ index 0 ใน array
    if (index >= 0 && index < 12) {
        return thaiShortMonths[index];
    }
    return monthNumber.toString(); // คืนค่าเดิมถ้าไม่ถูกต้อง (เช่น ไม่ใช่ตัวเลข 1-12)
}


// เมื่อเอกสาร HTML โหลดเสร็จสมบูรณ์
document.addEventListener('DOMContentLoaded', function () {
    const homeLink = document.getElementById('home-link'); // ลิงก์ "หน้าหลัก" ใน header
    const contentSections = document.querySelectorAll('.content-section'); // ทุก element ที่มีคลาส 'content-section'
    const centerContentTitle = document.getElementById('center-content-title'); // หัวข้อหลักตรงกลาง
    const initialTitle = 'ยินดีต้อนรับสู่โรงเรียนชุมชนบ้านแม่หละป่าป๋วย'; // หัวข้อเริ่มต้น
    const schoolInfoPrefix = 'สารสนเทศของโรงเรียน - '; // คำนำหน้าหัวข้อสำหรับเมนูใน sidebar

    // ฟังก์ชันสำหรับแสดงเนื้อหาตาม targetId และอัปเดต UI
    window.showContent = function(targetId, linkElement) {
        // ซ่อนทุก .content-section ก่อน
        contentSections.forEach(section => {
            section.classList.add('hidden');
        });

        const targetSection = document.getElementById(targetId); // element ของเนื้อหาเป้าหมาย
        if (targetSection) {
            targetSection.classList.remove('hidden'); // แสดงเนื้อหาเป้าหมาย
        } else {
            // ถ้าไม่พบ targetId ให้แสดงเนื้อหา default
            document.getElementById('content-default').classList.remove('hidden');
            targetId = 'content-default'; // อัปเดต targetId เป็น default
            console.warn(`Content section with id "${targetId}" not found. Showing default.`);
        }

        // อัปเดตหัวข้อหลักตรงกลาง (centerContentTitle)
        let newTitleText = initialTitle;
        if (linkElement) { // ถ้ามีการส่ง linkElement มาด้วย (เช่น ผู้ใช้คลิกที่ลิงก์)
            newTitleText = linkElement.textContent.trim(); // ใช้ข้อความของลิงก์เป็นหัวข้อ
            if (targetId === 'content-default') {
                newTitleText = initialTitle; // ถ้าเป็นหน้า default ให้ใช้หัวข้อเริ่มต้น
            } else if (linkElement.closest('.sidebar')) { // ถ้าลิงก์อยู่ใน sidebar
                newTitleText = schoolInfoPrefix + newTitleText; // เพิ่ม prefix
            }
        }
        centerContentTitle.textContent = newTitleText;

        // ลบคลาส active ออกจากทุกเมนู (ทั้ง header และ sidebar)
        document.querySelectorAll('.menu-item, .sidebar-item a').forEach(link => {
            link.classList.remove('active', 'text-yellow-200', 'text-red-600', 'font-semibold');
            if (link.closest('.sidebar-item')) { // ถ้าเป็นลิงก์ใน sidebar ให้กลับไปใช้สีเทาเริ่มต้น
                link.classList.add('text-gray-700');
            }
        });

        // เพิ่มคลาส active ให้กับลิงก์ที่ถูกคลิกใน header (ถ้ามี)
        const activeHeaderLink = document.querySelector(`header nav a[data-target="${targetId}"]`);
        if (activeHeaderLink) {
            activeHeaderLink.classList.add('active', 'text-yellow-200', 'font-semibold');
        }

        // เพิ่มคลาส active ให้กับลิงก์ที่ถูกคลิกใน sidebar (ถ้ามี)
        const activeSidebarLink = document.querySelector(`#main-menu a[data-target="${targetId}"]`);
        if (activeSidebarLink) {
            activeSidebarLink.classList.add('active', 'text-red-600', 'font-semibold');
            activeSidebarLink.classList.remove('text-gray-700'); // ลบสีเทาออก
        }

        // โหลดข้อมูลเพิ่มเติมตาม targetId ที่แสดง
        if (targetId === 'content-personnel') {
            fetchPersonnelData(); // โหลดข้อมูลบุคลากร
        } else if (targetId === 'content-students') {
            fetchStudentSummaryData(); // โหลดข้อมูลนักเรียน
        } else if (targetId === 'content-smart-school') {
            fetchAndDisplayTableData('getSystemLinks', 'content-smart-school'); // โหลดลิงก์ Smart School
        } else if (targetId === 'content-information-links') {
            fetchAndDisplayTableData('getInformationLinks', 'content-information-links'); // โหลดสารสนเทศอื่นๆ
        } else if (targetId === 'content-action-plan') {
            displayPdf('content-action-plan', 'https://drive.google.com/file/d/1n3XtVetBdlzZqaDE8Hlm5xs9GGQg0sSH/preview'); // แสดง PDF แผนปฏิบัติการ
        } else if (targetId === 'content-operation-report') {
            displayPdf('content-operation-report', 'https://drive.google.com/file/d/1jmBa9Heg4SH9apJlubVRLFfZBm42cZXw/preview'); // แสดง PDF รายงานผล
        }
    }

    // เพิ่ม event listener ให้กับทุกลิงก์ที่มี data-target (ทั้งใน header และ sidebar)
    document.querySelectorAll('nav a[data-target], #main-menu a[data-target]').forEach(link => {
        link.addEventListener('click', function (event) {
            event.preventDefault(); // ป้องกันการเปลี่ยนหน้าตามปกติของลิงก์ <a>
            const targetId = this.dataset.target; // ดึงค่า data-target
            window.showContent(targetId, this); // เรียกฟังก์ชัน showContent
        });
    });

    // แสดงเนื้อหาเริ่มต้นเมื่อโหลดหน้าเว็บครั้งแรก (ปกติคือ หน้าหลัก)
    const defaultTarget = homeLink && homeLink.dataset.target ? homeLink.dataset.target : 'content-default';
    window.showContent(defaultTarget, homeLink);

    // เรียกฟังก์ชันเพื่อดึงข้อมูลต่างๆ เมื่อหน้าเว็บโหลดเสร็จ
    fetchVisitorStats();
    calculateAndDisplaySchoolAge();
    fetchAndDisplayCalendarEvents(); // เรียกฟังก์ชันดึงข้อมูลปฏิทินกิจกรรม
});

// ฟังก์ชันสำหรับดึงข้อมูลสถิติผู้เข้าชมจาก Google Apps Script
async function fetchVisitorStats() {
    const visitsTodayEl = document.getElementById('visits-today');
    const visitsMonthEl = document.getElementById('visits-this-month');
    const visitsTotalEl = document.getElementById('visits-total');
    try {
        const response = await fetch(`${WEB_APP_URL}?action=logVisitAndGetCounts×tamp=${new Date().getTime()}`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const result = await response.json();
        if (result.error) {
            console.error("Error fetching visitor stats:", result.error, result.details || "");
            visitsTodayEl.textContent = "-";
            visitsMonthEl.textContent = "-";
            visitsTotalEl.textContent = "-";
            return;
        }
        if (result.data) {
            visitsTodayEl.textContent = `${result.data.today.toLocaleString()} คน`;
            visitsMonthEl.textContent = `${result.data.month.toLocaleString()} คน`;
            visitsTotalEl.textContent = `${result.data.total.toLocaleString()} คน`;
        } else {
            visitsTodayEl.textContent = "N/A";
            visitsMonthEl.textContent = "N/A";
            visitsTotalEl.textContent = "N/A";
        }
    } catch (error) {
        console.error("Failed to fetch visitor stats:", error);
        visitsTodayEl.textContent = "ข้อผิดพลาด";
        visitsMonthEl.textContent = "ข้อผิดพลาด";
        visitsTotalEl.textContent = "ข้อผิดพลาด";
    }
}

// ฟังก์ชันสำหรับดึงข้อมูลบุคลากรจาก Google Apps Script
async function fetchPersonnelData() {
    const personnelContentDiv = document.getElementById('content-personnel');
    personnelContentDiv.innerHTML = '<p class="text-gray-500 animate-pulse">กำลังโหลดข้อมูลบุคลากร...</p>';
    try {
        const response = await fetch(`${WEB_APP_URL}?action=getPersonnel&timestamp=${new Date().getTime()}`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const result = await response.json();
        if (result.error) {
            personnelContentDiv.innerHTML = `<p class="text-red-500">เกิดข้อผิดพลาด: ${result.error} ${result.details || ''}</p><p class="text-sm text-gray-600">โปรดตรวจสอบการตั้งค่า Google Sheet และการ Deploy Apps Script</p>`;
            console.error("Error fetching personnel:", result);
            return;
        }
        if (result.data && result.data.length > 0) {
            let html = '';
            html += '<div class="overflow-x-auto">';
            html += '<table class="min-w-full divide-y divide-gray-200 text-sm data-table-theme">';
            html += '<thead><tr>';
            html += '<th scope="col" class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ชื่อ-นามสกุล</th>';
            html += '<th scope="col" class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ตำแหน่ง</th>';
            html += '<th scope="col" class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">วิทยฐานะ</th>';
            html += '<th scope="col" class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">วันที่มาอยู่ รร.นี้</th>';
            html += '<th scope="col" class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">วิชาเอก</th>';
            html += '<th scope="col" class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">อีเมลล์</th>';
            html += '</tr></thead>';
            html += '<tbody class="bg-white divide-y divide-gray-200">';
            result.data.forEach(person => {
                html += '<tr>';
                html += `<td class="px-4 py-2 whitespace-nowrap">${person['ชื่อ-นามสกุล'] || '-'}</td>`;
                html += `<td class="px-4 py-2 text-left whitespace-nowrap">${person['ตำแหน่ง'] || '-'}</td>`;
                html += `<td class="px-4 py-2 text-left whitespace-nowrap">${person['วิทยฐานะ'] || '-'}</td>`;
                const dateDisplayValue = person['วันที่มาอยู่โรงเรียนนี้'];
                html += `<td class="px-4 py-2 text-left whitespace-nowrap">${dateDisplayValue || '-'}</td>`;
                html += `<td class="px-4 py-2 text-left whitespace-nowrap">${person['วิชาเอก'] || '-'}</td>`;
                html += `<td class="px-4 py-2 text-left whitespace-nowrap">${person['อีเมลล์'] || '-'}</td>`;
                html += '</tr>';
            });
            html += '</tbody></table>';
            html += '</div>';
            personnelContentDiv.innerHTML = html;
        } else {
            personnelContentDiv.innerHTML = '<p>ไม่พบข้อมูลบุคลากร หรือ Sheet อาจจะว่าง</p>';
        }
    } catch (error) {
        personnelContentDiv.innerHTML = `<p class="text-red-500">การเชื่อมต่อล้มเหลว: ${error.message}</p><p class="text-sm text-gray-600">โปรดตรวจสอบการเชื่อมต่ออินเทอร์เน็ต และ Web App URL</p>`;
        console.error("Fetch error for personnel:", error);
    }
}

// ฟังก์ชันสำหรับดึงข้อมูลสรุปจำนวนนักเรียนจาก Google Apps Script
async function fetchStudentSummaryData() {
    const studentContentDiv = document.getElementById('content-students');
    studentContentDiv.innerHTML = '<p class="text-gray-500 animate-pulse">กำลังโหลดข้อมูลนักเรียน...</p>';
    try {
        const response = await fetch(`${WEB_APP_URL}?action=getStudentSummary&timestamp=${new Date().getTime()}`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const result = await response.json();
        if (result.error) {
            studentContentDiv.innerHTML = `<p class="text-red-500">เกิดข้อผิดพลาด: ${result.error} ${result.details || ''}</p><p class="text-sm text-gray-600">โปรดตรวจสอบการตั้งค่า Google Sheet และการ Deploy Apps Script</p>`;
            console.error("Error fetching student summary:", result);
            return;
        }
        if (result.data && result.data.length > 0) {
            let html = '';
            html += '<div class="overflow-x-auto">';
            html += '<table class="min-w-full divide-y divide-gray-200 text-sm data-table-theme">';
            html += '<thead><tr>';
            html += '<th scope="col" class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ระดับชั้น</th>';
            html += '<th scope="col" class="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">ชาย</th>';
            html += '<th scope="col" class="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">หญิง</th>';
            html += '<th scope="col" class="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">รวม</th>';
            html += '</tr></thead>';
            html += '<tbody class="bg-white divide-y divide-gray-200">';
            let totalBoys = 0;
            let totalGirls = 0;
            let grandTotalAll = 0;
            result.data.forEach(level => {
                const boys = parseInt(level['จำนวนนักเรียนชาย']) || 0;
                const girls = parseInt(level['จำนวนนักเรียนหญิง']) || 0;
                const sumPerLevel = boys + girls;
                html += '<tr>';
                html += `<td class="px-4 py-2 whitespace-nowrap">${level['ระดับชั้น'] || '-'}</td>`;
                html += `<td class="px-4 py-2 whitespace-nowrap text-center">${level['จำนวนนักเรียนชาย'] || '0'}</td>`;
                html += `<td class="px-4 py-2 whitespace-nowrap text-center">${level['จำนวนนักเรียนหญิง'] || '0'}</td>`;
                html += `<td class="px-4 py-2 whitespace-nowrap text-center">${level['รวม'] || sumPerLevel}</td>`;
                html += '</tr>';
                totalBoys += boys;
                totalGirls += girls;
                grandTotalAll += sumPerLevel;
            });
            html += `<tr class="font-bold bg-yellow-50"><td class="px-4 py-2 whitespace-nowrap text-gray-900">รวมทุกระดับ</td><td class="px-4 py-2 whitespace-nowrap text-gray-900 text-center">${totalBoys}</td><td class="px-4 py-2 whitespace-nowrap text-gray-900 text-center">${totalGirls}</td><td class="px-4 py-2 whitespace-nowrap text-gray-900 text-center">${grandTotalAll}</td></tr>`;
            html += '</tbody></table>';
            html += '</div>';
            studentContentDiv.innerHTML = html;
        } else {
            studentContentDiv.innerHTML = '<p>ไม่พบข้อมูลนักเรียน หรือ Sheet อาจจะว่าง</p>';
        }
    } catch (error) {
        studentContentDiv.innerHTML = `<p class="text-red-500">การเชื่อมต่อล้มเหลว: ${error.message}</p><p class="text-sm text-gray-600">โปรดตรวจสอบการเชื่อมต่ออินเทอร์เน็ต และ Web App URL</p>`;
        console.error("Fetch error for student summary:", error);
    }
}

// ฟังก์ชันสำหรับดึงข้อมูลและแสดงผลในรูปแบบตาราง (ใช้สำหรับ Smart School Links และ Information Links)
async function fetchAndDisplayTableData(actionName, targetDivId) {
    const contentDiv = document.getElementById(targetDivId);
    contentDiv.innerHTML = `<p class="text-gray-500 animate-pulse">กำลังโหลดข้อมูล...</p>`;

    try {
        const response = await fetch(`${WEB_APP_URL}?action=${actionName}&timestamp=${new Date().getTime()}`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const result = await response.json();
        if (result.error) {
            contentDiv.innerHTML = `<p class="text-red-500">เกิดข้อผิดพลาดในการโหลดข้อมูล: ${result.error} ${result.details || ''}</p>`;
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
            html += '<th scope="col" class="col-link px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">ลิงก์</th>';
            html += '</tr></thead>';
            html += '<tbody class="bg-white divide-y divide-gray-200">';

            result.data.forEach(item => {
                const linkDestination = item.link && item.link.trim() !== "" && item.link.trim().toLowerCase() !== "n/a" && item.link.trim().toLowerCase() !== "-" ? item.link.trim() : "";
                const targetAttribute = linkDestination && (linkDestination.startsWith('http://') || linkDestination.startsWith('https://')) ? 'target="_blank" rel="noopener noreferrer"' : '';

                let iconHtml = "<span class='text-gray-400'>-</span>";
                if (linkDestination) {
                    iconHtml = `<img src='https://i.postimg.cc/25R6kGJx/ico1.png' border='0' alt='เปิดลิงก์ ${item.name || ''}' class='w-6 h-6 mx-auto'>`;
                }

                html += '<tr>';
                html += `<td class="col-number px-4 py-2 text-center whitespace-nowrap align-middle">${item.number || '-'}</td>`;
                html += `<td class="col-name px-4 py-2 whitespace-nowrap align-middle">${item.name || '-'}</td>`;
                html += `<td class="col-link px-4 py-2 text-center whitespace-nowrap align-middle">`;

                if (linkDestination) {
                    html += `<a href="${linkDestination}" ${targetAttribute} class="inline-flex items-center justify-center p-1 rounded-md group focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500" title="เปิดลิงก์: ${item.name || ''}">`;
                    html += iconHtml;
                    html += `<span class="sr-only">เปิดลิงก์ ${item.name || ''}</span>`;
                    html += `</a>`;
                } else {
                    html += iconHtml;
                }
                html += `</td>`;
                html += '</tr>';
            });
            html += '</tbody></table>';
            html += '</div>';
            contentDiv.innerHTML = html;
        } else {
            contentDiv.innerHTML = `<p>ไม่พบข้อมูล หรือชีตอาจจะว่าง</p>`;
        }
    } catch (error) {
        contentDiv.innerHTML = `<p class="text-red-500">การเชื่อมต่อล้มเหลวขณะโหลดข้อมูล: ${error.message}</p>`;
        console.error(`Fetch error for ${actionName}:`, error);
    }
}

// ฟังก์ชันสำหรับแสดงไฟล์ PDF ใน iframe
function displayPdf(targetDivId, pdfUrl) {
    const contentDiv = document.getElementById(targetDivId);
    if (pdfUrl && pdfUrl.startsWith('https://drive.google.com/file/d/')) {
         contentDiv.innerHTML = `
            <iframe src="${pdfUrl}" class="pdf-embed-container" frameborder="0" allowfullscreen>
                <p>เบราว์เซอร์ของคุณไม่รองรับการแสดง PDF โดยตรง คุณสามารถ <a href="${pdfUrl.replace('/preview', '/view')}" target="_blank" rel="noopener noreferrer">เปิดหรือดาวน์โหลดไฟล์ PDF ที่นี่</a>.</p>
            </iframe>`;
    } else {
         contentDiv.innerHTML = `
            <p class="text-gray-600 mt-4">ยังไม่มีไฟล์ให้แสดงในขณะนี้ หรือ URL ของ PDF ไม่ถูกต้อง</p>
            <p class="text-sm text-gray-500">(ผู้ดูแลระบบ: โปรดตรวจสอบ URL ของไฟล์ PDF ในโค้ด JavaScript และตรวจสอบการตั้งค่าการแชร์ไฟล์บน Google Drive)</p>`;
    }
}

// ฟังก์ชันสำหรับดึงและแสดงผลปฏิทินกิจกรรมจาก Google Apps Script
async function fetchAndDisplayCalendarEvents() {
    const calendarContainer = document.getElementById('calendar-events-container'); // หา container ที่จะใส่ข้อมูลปฏิทิน
    if (!calendarContainer) { // ถ้าไม่พบ container ให้หยุดทำงานและแสดง error
        console.error("Calendar container with id 'calendar-events-container' not found!");
        return;
    }
    // แสดงข้อความ "กำลังโหลด..." ขณะดึงข้อมูล
    calendarContainer.innerHTML = '<p class="text-gray-500 animate-pulse">กำลังโหลดปฏิทินกิจกรรม...</p>';

    try {
        // เรียก Apps Script action 'getCalendarEvents'
        const response = await fetch(`${WEB_APP_URL}?action=getCalendarEvents&timestamp=${new Date().getTime()}`);
        if (!response.ok) { // ตรวจสอบว่า request สำเร็จหรือไม่
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const result = await response.json(); // แปลง response เป็น JSON

        if (result.error) { // ถ้า Apps Script ส่ง error กลับมา
            console.error("Error fetching calendar events:", result.error, result.details || "");
            calendarContainer.innerHTML = `<p class="text-red-500">ไม่สามารถโหลดปฏิทินได้: ${result.error}</p>`;
            return;
        }

        if (result.data && result.data.length > 0) { // ถ้ามีข้อมูลกิจกรรม
            let htmlContent = ''; // เตรียมตัวแปรสำหรับเก็บ HTML ที่จะสร้าง
            result.data.forEach((event, index) => { // วนลูปสร้าง HTML สำหรับแต่ละกิจกรรม
                // ดึงข้อมูลจาก event object, ถ้าไม่มีให้เป็นค่าว่าง
                const day = event.day || '';
                const monthDisplay = event.month ? getThaiShortMonth(event.month) : ''; // แปลงเลขเดือนเป็นชื่อย่อไทย
                const year = event.year || '';
                const activity = event.activity || 'ไม่มีรายละเอียดกิจกรรม';
                
                // กำหนด class สำหรับการเว้นระยะห่างและเส้นคั่น
                // รายการสุดท้ายจะไม่มี่เส้นคั่นล่างและ margin-bottom
                const itemClass = (index === result.data.length - 1) 
                                ? 'mb-0 pb-0 border-none' 
                                : 'mb-3 pb-3 border-b border-dashed border-red-200';

                htmlContent += `
                    <div class="${itemClass}">
                        <p class="font-bold text-red-600">${day} ${monthDisplay} ${year}</p>
                        <p class="text-gray-700">${activity}</p>
                    </div>
                `;
            });
            calendarContainer.innerHTML = htmlContent; // แสดง HTML ที่สร้างขึ้นใน container
        } else { // ถ้าไม่มีกิจกรรมสำหรับเดือนนี้
            calendarContainer.innerHTML = '<p class="text-gray-700">ไม่มีกิจกรรมสำหรับเดือนนี้</p>';
        }

    } catch (error) { // จัดการ error ที่เกิดจากการ fetch (เช่น network error)
        console.error("Failed to fetch calendar events:", error);
        calendarContainer.innerHTML = '<p class="text-red-500">เกิดข้อผิดพลาดในการเชื่อมต่อเพื่อโหลดปฏิทิน</p>';
    }
}
