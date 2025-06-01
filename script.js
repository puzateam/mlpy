// URL ของ Google Apps Script Web App (สำคัญมาก: ตรวจสอบว่าเป็น URL ล่าสุดหลัง Deploy Apps Script ใหม่)
const WEB_APP_URL = "https://script.google.com/macros/s/AKfycbx8_EwD9mFtTngc-oZMld6BYrFGdUrym5qCWCL7PGVTuhULVt-nbCzWKEzPZLBVCEOP/exec"; 
                        
// ฟังก์ชันสำหรับคำนวณและแสดงอายุโรงเรียน
function calculateAndDisplaySchoolAge() {
    const foundingDate = new Date(1925, 10, 1); // เดือนใน JavaScript เริ่มจาก 0 (ม.ค.) ถึง 11 (ธ.ค.) -> พ.ย. คือ 10
    const today = new Date();
    let age = today.getFullYear() - foundingDate.getFullYear();
    const monthDifference = today.getMonth() - foundingDate.getMonth();
    const dayDifference = today.getDate() - foundingDate.getDate();

    // ตรวจสอบถ้ายังไม่ถึงวันครบรอบวันเกิดของปีปัจจุบัน
    if (monthDifference < 0 || (monthDifference === 0 && dayDifference < 0)) {
        age--;
    }
    const schoolAgeTextElement = document.getElementById('school-age-text');
    if (schoolAgeTextElement) {
        schoolAgeTextElement.textContent = `(รวมอายุ ${age} ปี)`;
    } else {
        console.error("Element with id 'school-age-text' not found."); // แจ้งเตือนถ้าหา element ไม่เจอ
    }
}

// Event Listener รอให้ DOM โหลดเสร็จก่อนเริ่มทำงานกับ elements ต่างๆ
document.addEventListener('DOMContentLoaded', function () {
    const homeLink = document.getElementById('home-link'); // ลิงก์ 'หน้าหลัก'
    const contentSections = document.querySelectorAll('.content-section'); // ทุกส่วนของเนื้อหาที่สลับการแสดงผล
    const centerContentTitle = document.getElementById('center-content-title'); // หัวข้อหลักตรงกลาง
    const initialTitle = centerContentTitle.textContent;  // เก็บหัวข้อเริ่มต้นไว้

    // ฟังก์ชันหลักสำหรับแสดงเนื้อหาและเปลี่ยนหัวข้อ
    window.showContent = function(targetId, newTitle) {
        // ซ่อนทุกส่วนเนื้อหาก่อน
        contentSections.forEach(section => {
            section.classList.add('hidden');
        });

        // แสดงส่วนเนื้อหาที่ต้องการ
        const targetSection = document.getElementById(targetId);
        if (targetSection) {
            targetSection.classList.remove('hidden');
        }

        // เปลี่ยนหัวข้อหลักตรงกลาง
        if (newTitle) {
            centerContentTitle.textContent = newTitle;
        } else {
             centerContentTitle.textContent = initialTitle; // ถ้าไม่มี newTitle ให้ใช้หัวข้อเริ่มต้น
        }

        // ล้าง active class จากเมนูทั้งหมด (ทั้งใน header และ sidebar)
        document.querySelectorAll('.menu-item, .sidebar-item a').forEach(link => {
            link.classList.remove('active');
        });

        // เพิ่ม active class ให้กับลิงก์เมนูที่ถูกคลิก (ตรวจสอบทั้ง header และ sidebar)
        const clickedHeaderLink = document.querySelector(`nav a[data-target="${targetId}"]`);
        if (clickedHeaderLink) {
            clickedHeaderLink.classList.add('active');
        }
        const clickedSidebarLink = document.querySelector(`#main-menu a[data-target="${targetId}"]`);
        if (clickedSidebarLink) {
            clickedSidebarLink.classList.add('active');
        }
        
        // ถ้าเป็นหน้าหลัก (content-default) ให้แน่ใจว่าลิงก์ "หน้าหลัก" ใน header active
        if (targetId === 'content-default' && homeLink) {
            homeLink.classList.add('active');
        }


        // โหลดข้อมูลตาม targetId ที่ถูกเลือก
        if (targetId === 'content-personnel') {
            fetchPersonnelData();
        } else if (targetId === 'content-students') { 
            fetchStudentSummaryData();
        } else if (targetId === 'content-smart-school') {
            fetchAndDisplayTableData('getSystemLinks', 'content-smart-school', 'Smart School Service');
        } else if (targetId === 'content-information-links') {
            fetchAndDisplayTableData('getInformationLinks', 'content-information-links', 'สารสนเทศอื่นๆ'); // เปลี่ยนชื่อหัวข้อให้สื่อความหมาย
        } else if (targetId === 'content-action-plan') {
            // แทนที่ 'URL_PDF_แผนปฏิบัติการ.pdf' ด้วย URL จริงของไฟล์ PDF
            displayPdf('content-action-plan', 'https://drive.google.com/file/d/1n3XtVetBdlzZqaDE8Hlm5xs9GGQg0sSH/preview', 'แผนปฏิบัติการประจำปี'); 
        } else if (targetId === 'content-operation-report') {
            // แทนที่ 'URL_PDF_รายงานผล.pdf' ด้วย URL จริงของไฟล์ PDF
            displayPdf('content-operation-report', 'https://drive.google.com/file/d/1jmBa9Heg4SH9apJlubVRLFfZBm42cZXw/preview', 'รายงานผลการดำเนินงาน');
        }
    }

    // Event listeners สำหรับเมนูทั้งหมดที่มี data-target (ทั้งใน header และ sidebar)
    document.querySelectorAll('nav a[data-target], #main-menu a[data-target]').forEach(link => {
        link.addEventListener('click', function (event) {
            event.preventDefault(); 
            const targetId = this.dataset.target; 
            const newTitleText = this.textContent.trim(); // .trim() เพื่อตัดช่องว่างที่ไม่จำเป็น
            window.showContent(targetId, newTitleText); 
        });
    });
    
    // Event listener สำหรับลิงก์ 'หน้าหลัก' โดยเฉพาะ
    homeLink.addEventListener('click', function (event) {
        event.preventDefault(); 
        window.showContent('content-default', initialTitle); 
        // ล้าง active class จากทุกเมนูแล้วให้ homeLink active
        document.querySelectorAll('.menu-item, .sidebar-item a').forEach(link => link.classList.remove('active'));
        homeLink.classList.add('active'); 
    });

    // แสดงเนื้อหาเริ่มต้นเมื่อหน้าเว็บโหลด และตั้งค่า active ให้เมนูหน้าหลัก
    window.showContent('content-default', initialTitle);
    if (homeLink) homeLink.classList.add('active');

    // เรียกฟังก์ชันที่ทำงานเมื่อโหลดหน้าเว็บ
    fetchVisitorStats(); 
    calculateAndDisplaySchoolAge();
});

// ฟังก์ชันสำหรับดึงและแสดงสถิติผู้เข้าชม
async function fetchVisitorStats() {
    const visitsTodayEl = document.getElementById('visits-today');
    const visitsMonthEl = document.getElementById('visits-this-month');
    const visitsTotalEl = document.getElementById('visits-total');
    try {
                                                                        //&timestampดูให้ดีตรงนี้ Ai มองผิดตลอด
        const response = await fetch(`${WEB_APP_URL}?action=logVisitAndGetCounts&timestamp=${new Date().getTime()}`); 
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

// ฟังก์ชันสำหรับดึงและแสดงข้อมูลบุคลากร
async function fetchPersonnelData() {
    const personnelContentDiv = document.getElementById('content-personnel');
    personnelContentDiv.innerHTML = '<p class="text-gray-500 animate-pulse">กำลังโหลดข้อมูลบุคลากร...</p>'; 
    try {
                                                                        //&timestampดูให้ดีตรงนี้ Ai มองผิดตลอด
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
            let html = ''; // เริ่มต้นด้วย string ว่าง
            // html += '<h3 class="text-xl font-bold text-red-600 mb-4">ข้อมูลบุคลากร</h3>'; // หัวข้อนี้จะถูกตั้งโดย showContent แล้ว
            html += '<div class="overflow-x-auto">'; 
            html += '<table class="min-w-full divide-y divide-gray-200 text-sm">';
            html += '<thead class="bg-gray-50"><tr>';
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
            personnelContentDiv.innerHTML = '<p>ไม่พบข้อมูลบุคลากร หรือ Sheet อาจจะว่าง</p>'; // เอา h3 ออก เพราะ newTitle จะจัดการ
        }
    } catch (error) { 
        personnelContentDiv.innerHTML = `<p class="text-red-500">การเชื่อมต่อล้มเหลว: ${error.message}</p><p class="text-sm text-gray-600">โปรดตรวจสอบการเชื่อมต่ออินเทอร์เน็ต และ Web App URL</p>`;
        console.error("Fetch error for personnel:", error);
    }
}

// ฟังก์ชันสำหรับดึงและแสดงข้อมูลสรุปนักเรียน
async function fetchStudentSummaryData() {
    const studentContentDiv = document.getElementById('content-students');
    studentContentDiv.innerHTML = '<p class="text-gray-500 animate-pulse">กำลังโหลดข้อมูลนักเรียน...</p>'; 
    try {
                                                                        //&timestampดูให้ดีตรงนี้ Ai มองผิดตลอด
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
            let html = ''; // เริ่มต้นด้วย string ว่าง
            // html += '<h3 class="text-xl font-bold text-red-600 mb-4">ข้อมูลนักเรียน (สรุป)</h3>'; // หัวข้อนี้จะถูกตั้งโดย showContent แล้ว
            html += '<div class="overflow-x-auto">'; 
            html += '<table class="min-w-full divide-y divide-gray-200 text-sm">';
            html += '<thead class="bg-gray-50"><tr>';
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
            studentContentDiv.innerHTML = '<p>ไม่พบข้อมูลนักเรียน หรือ Sheet อาจจะว่าง</p>'; // เอา h3 ออก
        }
    } catch (error) { 
        studentContentDiv.innerHTML = `<p class="text-red-500">การเชื่อมต่อล้มเหลว: ${error.message}</p><p class="text-sm text-gray-600">โปรดตรวจสอบการเชื่อมต่ออินเทอร์เน็ต และ Web App URL</p>`;
        console.error("Fetch error for student summary:", error);
    }
}

// ฟังก์ชันสำหรับดึงและแสดงข้อมูลตารางลิงก์ (Smart School, สารสนเทศอื่นๆ)
async function fetchAndDisplayTableData(actionName, targetDivId, tableTitleFromMenu) {
    const contentDiv = document.getElementById(targetDivId);
    contentDiv.innerHTML = '<p class="text-gray-500 animate-pulse">กำลังโหลดข้อมูล...</p>'; 

    // contentDiv.innerHTML = `<p class="text-gray-500 animate-pulse">กำลังโหลดข้อมูล ${tableTitleFromMenu}...</p>`; // หัวข้อจะถูกตั้งโดย showContent

    try {
                                                                        //&timestampดูให้ดีตรงนี้ Ai มองผิดตลอด
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
            let html = ''; // เริ่มต้นด้วย string ว่าง
            // html += `<h3 class="text-xl font-bold text-red-600 mb-4">${tableTitleFromMenu}</h3>`; // หัวข้อนี้จะถูกตั้งโดย showContent แล้ว
            html += '<div class="overflow-x-auto">';
            html += '<table class="link-table min-w-full text-sm">'; 
            html += '<thead class="bg-gray-100"><tr>';
            html += '<th scope="col" class="col-number px-4 py-2 text-center text-xs font-medium text-gray-600 uppercase tracking-wider">ลำดับ</th>';
            html += '<th scope="col" class="col-name px-4 py-2 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">ชื่อรายการ</th>';
            html += '<th scope="col" class="col-link px-4 py-2 text-center text-xs font-medium text-gray-600 uppercase tracking-wider">ลิงก์</th>';
            html += '</tr></thead>';
            html += '<tbody class="bg-white divide-y divide-gray-200">';
            result.data.forEach(item => {
                const linkDestination = item.link && item.link.trim() !== "" ? item.link.trim() : "#";
                const linkText = linkDestination !== "#" ? "<img src='https://i.postimg.cc/25R6kGJx/ico1.png' border='0' alt='ico1'/>" : "ไม่มีลิงก์";
                const targetAttribute = linkDestination !== "#" && (linkDestination.startsWith('http://') || linkDestination.startsWith('https://')) ? 'target="_blank" rel="noopener noreferrer"' : '';
                html += '<tr>';
                html += `<td class="col-number px-4 py-2 text-center whitespace-nowrap">${item.number || '-'}</td>`;
                html += `<td class="col-name px-4 py-2 whitespace-nowrap">${item.name || '-'}</td>`;
                html += `<td class="col-link px-4 py-2 text-center whitespace-nowrap">`;
                html += `<a href="${linkDestination}" ${targetAttribute} class="text-blue-600 hover:text-blue-800 hover:underline">${linkText}</a>`;
                html += `</td>`;
                html += '</tr>';
            });
            html += '</tbody></table>';
            html += '</div>';
            contentDiv.innerHTML = html;
        } else {
            contentDiv.innerHTML = `<p>ไม่พบข้อมูล หรือชีตอาจจะว่าง</p>`; // เอา h3 ออก
        }
    } catch (error) {
        contentDiv.innerHTML = `<p class="text-red-500">การเชื่อมต่อล้มเหลวขณะโหลดข้อมูล: ${error.message}</p>`;
        console.error(`Fetch error for ${actionName}:`, error);
    }
}

// ฟังก์ชันสำหรับแสดง PDF
function displayPdf(targetDivId, pdfUrl) { // ลบ pdfTitleFromMenu ออกถ้าไม่ใช้แล้ว
    const contentDiv = document.getElementById(targetDivId);
    // contentDiv.innerHTML = ''; // ล้างเนื้อหาเก่า (หัวข้อจะถูกตั้งโดย showContent)

    if (pdfUrl && pdfUrl.startsWith('https://drive.google.com/file/d/')) {
         contentDiv.innerHTML = `
            <iframe src="${pdfUrl}" class="pdf-embed-container" frameborder="0" allowfullscreen>
                <p>เบราว์เซอร์ของคุณไม่รองรับการแสดง PDF โดยตรง คุณสามารถ <a href="${pdfUrl.replace('/preview', '/view')}" target="_blank" rel="noopener noreferrer">เปิดหรือดาวน์โหลดไฟล์ PDF ที่นี่</a>.</p>
            </iframe>`; // เพิ่ม allowfullscreen
    } else {
         contentDiv.innerHTML = `
            <p class="text-gray-600 mt-4">ยังไม่มีไฟล์ให้แสดงในขณะนี้ หรือ URL ของ PDF ไม่ถูกต้อง</p>
            <p class="text-sm text-gray-500">(ผู้ดูแลระบบ: โปรดตรวจสอบ URL ของไฟล์ PDF ในโค้ด JavaScript และตรวจสอบการตั้งค่าการแชร์ไฟล์บน Google Drive)</p>`;
    }
}
