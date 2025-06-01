// URL ของ Google Apps Script Web App ที่ deploy ไว้
const WEB_APP_URL = "https://script.google.com/macros/s/AKfycbx8_EwD9mFtTngc-oZMld6BYrFGdUrym5qCWCL7PGVTuhULVt-nbCzWKEzPZLBVCEOP/exec";

// ฟังก์ชันสำหรับคำนวณและแสดงอายุโรงเรียน
function calculateAndDisplaySchoolAge() {
    const foundingDate = new Date(1925, 10, 1); // วันที่ก่อตั้งโรงเรียน: ปี 1925, เดือนพฤศจิกายน (index 10), วันที่ 1
                                                // เดือนใน JavaScript เริ่มจาก 0 (มกราคม) ถึง 11 (ธันวาคม)
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
    // ปัจจุบันอายุโรงเรียนถูก hardcode ไว้ในส่วน content-history
    const schoolAgeTextElement = document.getElementById('school-age-text');
    if (schoolAgeTextElement) {
        schoolAgeTextElement.textContent = `(รวมอายุ ${age} ปี)`; // แสดงผลอายุ
    } else {
        console.error("Element with id 'school-age-text' not found. School age cannot be displayed by this function.");
    }
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

    // เรียกฟังก์ชันเพื่อดึงข้อมูลสถิติผู้เข้าชมและคำนวณอายุโรงเรียน
    fetchVisitorStats();
    calculateAndDisplaySchoolAge();
});

// ฟังก์ชันสำหรับดึงข้อมูลสถิติผู้เข้าชมจาก Google Apps Script
async function fetchVisitorStats() {
    const visitsTodayEl = document.getElementById('visits-today');
    const visitsMonthEl = document.getElementById('visits-this-month');
    const visitsTotalEl = document.getElementById('visits-total');
    try {
        // ส่ง request ไปยัง Web App URL พร้อม action และ &timestamp (เพื่อป้องกัน cache)AI (ชอบเปลี่ยนเป็น xtamp ดูให้ดี)
        const response = await fetch(`${WEB_APP_URL}?action=logVisitAndGetCounts&timestamp=${new Date().getTime()}`);
        if (!response.ok) { // ตรวจสอบว่า request สำเร็จหรือไม่
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const result = await response.json(); // แปลง response เป็น JSON
        if (result.error) { // ตรวจสอบว่ามี error จาก Apps Script หรือไม่
            console.error("Error fetching visitor stats:", result.error, result.details || "");
            visitsTodayEl.textContent = "-";
            visitsMonthEl.textContent = "-";
            visitsTotalEl.textContent = "-";
            return;
        }
        if (result.data) { // ถ้ามีข้อมูลสถิติ
            visitsTodayEl.textContent = `${result.data.today.toLocaleString()} คน`;
            visitsMonthEl.textContent = `${result.data.month.toLocaleString()} คน`;
            visitsTotalEl.textContent = `${result.data.total.toLocaleString()} คน`;
        } else {
            visitsTodayEl.textContent = "N/A"; // ไม่พบข้อมูล
            visitsMonthEl.textContent = "N/A";
            visitsTotalEl.textContent = "N/A";
        }
    } catch (error) {
        console.error("Failed to fetch visitor stats:", error);
        visitsTodayEl.textContent = "ข้อผิดพลาด"; // แสดงข้อความเมื่อเกิด error ในการ fetch
        visitsMonthEl.textContent = "ข้อผิดพลาด";
        visitsTotalEl.textContent = "ข้อผิดพลาด";
    }
}

// ฟังก์ชันสำหรับดึงข้อมูลบุคลากรจาก Google Apps Script
async function fetchPersonnelData() {
    const personnelContentDiv = document.getElementById('content-personnel');
    personnelContentDiv.innerHTML = '<p class="text-gray-500 animate-pulse">กำลังโหลดข้อมูลบุคลากร...</p>'; // แสดงข้อความกำลังโหลด
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
        if (result.data && result.data.length > 0) { // ถ้ามีข้อมูลบุคลากร
            let html = '';
            html += '<div class="overflow-x-auto">'; // ทำให้ตาราง scroll แนวนอนได้ถ้าเนื้อหาเกิน
            html += '<table class="min-w-full divide-y divide-gray-200 text-sm data-table-theme">'; // เพิ่มคลาส data-table-theme สำหรับสไตล์
            html += '<thead><tr>'; // ส่วนหัวของตาราง
            html += '<th scope="col" class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ชื่อ-นามสกุล</th>';
            html += '<th scope="col" class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ตำแหน่ง</th>';
            html += '<th scope="col" class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">วิทยฐานะ</th>';
            html += '<th scope="col" class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">วันที่มาอยู่ รร.นี้</th>';
            html += '<th scope="col" class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">วิชาเอก</th>';
            html += '<th scope="col" class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">อีเมลล์</th>';
            html += '</tr></thead>';
            html += '<tbody class="bg-white divide-y divide-gray-200">'; // ส่วนเนื้อหาของตาราง
            result.data.forEach(person => { // วนลูปแสดงข้อมูลแต่ละคน
                html += '<tr>';
                html += `<td class="px-4 py-2 whitespace-nowrap">${person['ชื่อ-นามสกุล'] || '-'}</td>`;
                html += `<td class="px-4 py-2 text-left whitespace-nowrap">${person['ตำแหน่ง'] || '-'}</td>`;
                html += `<td class="px-4 py-2 text-left whitespace-nowrap">${person['วิทยฐานะ'] || '-'}</td>`;
                const dateDisplayValue = person['วันที่มาอยู่โรงเรียนนี้']; // ดึงค่าวันที่ (Apps Script ส่งมาเป็น display value)
                html += `<td class="px-4 py-2 text-left whitespace-nowrap">${dateDisplayValue || '-'}</td>`;
                html += `<td class="px-4 py-2 text-left whitespace-nowrap">${person['วิชาเอก'] || '-'}</td>`;
                html += `<td class="px-4 py-2 text-left whitespace-nowrap">${person['อีเมลล์'] || '-'}</td>`;
                html += '</tr>';
            });
            html += '</tbody></table>';
            html += '</div>';
            personnelContentDiv.innerHTML = html; // แสดงตารางใน div
        } else {
            personnelContentDiv.innerHTML = '<p>ไม่พบข้อมูลบุคลากร หรือ Sheet อาจจะว่าง</p>'; // กรณีไม่พบข้อมูล
        }
    } catch (error) {
        personnelContentDiv.innerHTML = `<p class="text-red-500">การเชื่อมต่อล้มเหลว: ${error.message}</p><p class="text-sm text-gray-600">โปรดตรวจสอบการเชื่อมต่ออินเทอร์เน็ต และ Web App URL</p>`;
        console.error("Fetch error for personnel:", error);
    }
}

// ฟังก์ชันสำหรับดึงข้อมูลสรุปจำนวนนักเรียนจาก Google Apps Script
async function fetchStudentSummaryData() {
    const studentContentDiv = document.getElementById('content-students');
    studentContentDiv.innerHTML = '<p class="text-gray-500 animate-pulse">กำลังโหลดข้อมูลนักเรียน...</p>'; // แสดงข้อความกำลังโหลด
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
        if (result.data && result.data.length > 0) { // ถ้ามีข้อมูลนักเรียน
            let html = '';
            html += '<div class="overflow-x-auto">';
            html += '<table class="min-w-full divide-y divide-gray-200 text-sm data-table-theme">'; // เพิ่มคลาส data-table-theme
            html += '<thead><tr>';
            html += '<th scope="col" class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ระดับชั้น</th>';
            html += '<th scope="col" class="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">ชาย</th>';
            html += '<th scope="col" class="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">หญิง</th>';
            html += '<th scope="col" class="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">รวม</th>';
            html += '</tr></thead>';
            html += '<tbody class="bg-white divide-y divide-gray-200">';
            let totalBoys = 0; // ตัวแปรสำหรับรวมจำนวนนักเรียนชายทั้งหมด
            let totalGirls = 0; // ตัวแปรสำหรับรวมจำนวนนักเรียนหญิงทั้งหมด
            let grandTotalAll = 0; // ตัวแปรสำหรับรวมจำนวนนักเรียนทั้งหมดทุกระดับชั้น
            result.data.forEach(level => { // วนลูปแสดงข้อมูลแต่ละระดับชั้น
                const boys = parseInt(level['จำนวนนักเรียนชาย']) || 0; // แปลงเป็นตัวเลข หรือ 0 ถ้าไม่มีค่า
                const girls = parseInt(level['จำนวนนักเรียนหญิง']) || 0; // แปลงเป็นตัวเลข หรือ 0 ถ้าไม่มีค่า
                const sumPerLevel = boys + girls; // รวมชายหญิงในระดับชั้นนั้น
                html += '<tr>';
                html += `<td class="px-4 py-2 whitespace-nowrap">${level['ระดับชั้น'] || '-'}</td>`;
                html += `<td class="px-4 py-2 whitespace-nowrap text-center">${level['จำนวนนักเรียนชาย'] || '0'}</td>`;
                html += `<td class="px-4 py-2 whitespace-nowrap text-center">${level['จำนวนนักเรียนหญิง'] || '0'}</td>`;
                html += `<td class="px-4 py-2 whitespace-nowrap text-center">${level['รวม'] || sumPerLevel}</td>`; // ใช้ค่า "รวม" จาก sheet ถ้ามี, หรือคำนวณใหม่
                html += '</tr>';
                totalBoys += boys; // เพิ่มยอดรวมชาย
                totalGirls += girls; // เพิ่มยอดรวมหญิง
                grandTotalAll += sumPerLevel; // เพิ่มยอดรวมทั้งหมด
            });
            // เพิ่มแถวสรุปรวมทุกระดับ
            html += `<tr class="font-bold bg-yellow-50"><td class="px-4 py-2 whitespace-nowrap text-gray-900">รวมทุกระดับ</td><td class="px-4 py-2 whitespace-nowrap text-gray-900 text-center">${totalBoys}</td><td class="px-4 py-2 whitespace-nowrap text-gray-900 text-center">${totalGirls}</td><td class="px-4 py-2 whitespace-nowrap text-gray-900 text-center">${grandTotalAll}</td></tr>`;
            html += '</tbody></table>';
            html += '</div>';
            studentContentDiv.innerHTML = html; // แสดงตารางใน div
        } else {
            studentContentDiv.innerHTML = '<p>ไม่พบข้อมูลนักเรียน หรือ Sheet อาจจะว่าง</p>'; // กรณีไม่พบข้อมูล
        }
    } catch (error) {
        studentContentDiv.innerHTML = `<p class="text-red-500">การเชื่อมต่อล้มเหลว: ${error.message}</p><p class="text-sm text-gray-600">โปรดตรวจสอบการเชื่อมต่ออินเทอร์เน็ต และ Web App URL</p>`;
        console.error("Fetch error for student summary:", error);
    }
}

// ฟังก์ชันสำหรับดึงข้อมูลและแสดงผลในรูปแบบตาราง (ใช้สำหรับ Smart School Links และ Information Links)
async function fetchAndDisplayTableData(actionName, targetDivId) {
    const contentDiv = document.getElementById(targetDivId);
    contentDiv.innerHTML = `<p class="text-gray-500 animate-pulse">กำลังโหลดข้อมูล...</p>`; // แสดงข้อความกำลังโหลด

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

        if (result.data && result.data.length > 0) { // ถ้ามีข้อมูล
            let html = '';
            html += '<div class="overflow-x-auto">';
            html += '<table class="link-table min-w-full text-sm data-table-theme">'; // ใช้คลาส link-table และ data-table-theme
            html += '<thead><tr>';
            html += '<th scope="col" class="col-number px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">ลำดับ</th>';
            html += '<th scope="col" class="col-name px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ชื่อรายการ</th>';
            html += '<th scope="col" class="col-link px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">ลิงก์</th>';
            html += '</tr></thead>';
            html += '<tbody class="bg-white divide-y divide-gray-200">';

            result.data.forEach(item => { // วนลูปแสดงข้อมูลแต่ละรายการ
                // ตรวจสอบว่ามีลิงก์ที่ถูกต้องหรือไม่ (ไม่ว่าง, ไม่ใช่ "n/a", ไม่ใช่ "-")
                const linkDestination = item.link && item.link.trim() !== "" && item.link.trim().toLowerCase() !== "n/a" && item.link.trim().toLowerCase() !== "-" ? item.link.trim() : "";
                // กำหนด target="_blank" สำหรับลิงก์ภายนอก
                const targetAttribute = linkDestination && (linkDestination.startsWith('http://') || linkDestination.startsWith('https://')) ? 'target="_blank" rel="noopener noreferrer"' : '';

                // กำหนดไอคอน (ถ้ามีลิงก์ ให้แสดงไอคอน, ถ้าไม่มี ให้แสดง "-")
                let iconHtml = "<span class='text-gray-400'>-</span>"; // ไอคอนเริ่มต้น
                if (linkDestination) { // ถ้ามีลิงก์
                    iconHtml = `<img src='https://i.postimg.cc/25R6kGJx/ico1.png' border='0' alt='เปิดลิงก์ ${item.name || ''}' class='w-6 h-6 mx-auto'>`; // ไอคอนลิงก์
                }

                html += '<tr>';
                html += `<td class="col-number px-4 py-2 text-center whitespace-nowrap align-middle">${item.number || '-'}</td>`; // คอลัมน์ลำดับ
                html += `<td class="col-name px-4 py-2 whitespace-nowrap align-middle">${item.name || '-'}</td>`; // คอลัมน์ชื่อรายการ
                html += `<td class="col-link px-4 py-2 text-center whitespace-nowrap align-middle">`; // คอลัมน์ลิงก์

                if (linkDestination) { // ถ้ามีลิงก์ที่ถูกต้อง
                    html += `<a href="${linkDestination}" ${targetAttribute} class="inline-flex items-center justify-center p-1 rounded-md group focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500" title="เปิดลิงก์: ${item.name || ''}">`;
                    html += iconHtml; // แสดงไอคอน
                    html += `<span class="sr-only">เปิดลิงก์ ${item.name || ''}</span>`; // ข้อความสำหรับ screen reader
                    html += `</a>`;
                } else {
                    html += iconHtml; // แสดง "-" หรือไอคอนตามที่กำหนดไว้ถ้าไม่มีลิงก์
                }
                html += `</td>`;
                html += '</tr>';
            });
            html += '</tbody></table>';
            html += '</div>';
            contentDiv.innerHTML = html; // แสดงตาราง
        } else {
            contentDiv.innerHTML = `<p>ไม่พบข้อมูล หรือชีตอาจจะว่าง</p>`; // กรณีไม่พบข้อมูล
        }
    } catch (error) {
        contentDiv.innerHTML = `<p class="text-red-500">การเชื่อมต่อล้มเหลวขณะโหลดข้อมูล: ${error.message}</p>`;
        console.error(`Fetch error for ${actionName}:`, error);
    }
}

// ฟังก์ชันสำหรับแสดงไฟล์ PDF ใน iframe
function displayPdf(targetDivId, pdfUrl) {
    const contentDiv = document.getElementById(targetDivId);
    if (pdfUrl && pdfUrl.startsWith('https://drive.google.com/file/d/')) { // ตรวจสอบว่า URL เป็นของ Google Drive file preview
         contentDiv.innerHTML = `
            <iframe src="${pdfUrl}" class="pdf-embed-container" frameborder="0" allowfullscreen>
                <p>เบราว์เซอร์ของคุณไม่รองรับการแสดง PDF โดยตรง คุณสามารถ <a href="${pdfUrl.replace('/preview', '/view')}" target="_blank" rel="noopener noreferrer">เปิดหรือดาวน์โหลดไฟล์ PDF ที่นี่</a>.</p>
            </iframe>`;
    } else { // กรณี URL ไม่ถูกต้อง หรือยังไม่มีไฟล์
         contentDiv.innerHTML = `
            <p class="text-gray-600 mt-4">ยังไม่มีไฟล์ให้แสดงในขณะนี้ หรือ URL ของ PDF ไม่ถูกต้อง</p>
            <p class="text-sm text-gray-500">(ผู้ดูแลระบบ: โปรดตรวจสอบ URL ของไฟล์ PDF ในโค้ด JavaScript และตรวจสอบการตั้งค่าการแชร์ไฟล์บน Google Drive)</p>`;
    }
}
