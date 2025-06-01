// URL ของ Google Apps Script Web App (สำคัญมาก: ตรวจสอบว่าเป็น URL ล่าสุดหลัง Deploy Apps Script ใหม่)
const WEB_APP_URL = "https://script.google.com/macros/s/AKfycbyH3XNcZJizkV9vBo2FRK7eITPB9VHI_ldx0Zy8xqNq_M_o9-2Dyk3FoE8NPWhv8WdH/exec"; 
                        
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
        console.error("Element with id 'school-age-text' not found.");
    }
}

document.addEventListener('DOMContentLoaded', function () {
    const homeLink = document.getElementById('home-link'); 
    const contentSections = document.querySelectorAll('.content-section'); 
    const centerContentTitle = document.getElementById('center-content-title'); 
    const initialTitle = centerContentTitle.textContent;  
    
    window.showContent = function(targetId, newTitle) {
        contentSections.forEach(section => {
            section.classList.add('hidden');
        });
        const targetSection = document.getElementById(targetId);
        if (targetSection) {
            targetSection.classList.remove('hidden');
        }
        if (newTitle) {
            centerContentTitle.textContent = newTitle;
        } else {
             centerContentTitle.textContent = initialTitle; 
        }

        document.querySelectorAll('.menu-item, .sidebar-item a').forEach(link => {
            link.classList.remove('active');
        });

        const clickedLink = document.querySelector(`a[data-target="${targetId}"]`);
        if (clickedLink) {
            if (clickedLink.closest('#main-menu')) { 
                clickedLink.classList.add('active');
            } else if (clickedLink.closest('nav')) { 
                clickedLink.classList.add('active'); 
            }
        }

        if (targetId === 'content-personnel') {
            fetchPersonnelData();
        } else if (targetId === 'content-students') { 
            fetchStudentSummaryData();
        } else if (targetId === 'content-smart-school') {
            fetchAndDisplayTableData('getSystemLinks', 'content-smart-school', 'Smart School Service');
        } else if (targetId === 'content-information-links') {
            fetchAndDisplayTableData('getInformationLinks', 'content-information-links', 'สารสนเทศ');
        } else if (targetId === 'content-action-plan') {
            displayPdf('content-action-plan', 'URL_PDF_แผนปฏิบัติการ.pdf', 'แผนปฏิบัติการประจำปี'); 
        } else if (targetId === 'content-operation-report') {
            displayPdf('content-operation-report', 'URL_PDF_รายงานผล.pdf', 'รายงานผลการดำเนินงาน');
        }
    }

    document.querySelectorAll('nav a[data-target], #main-menu a[data-target]').forEach(link => {
        link.addEventListener('click', function (event) {
            event.preventDefault(); 
            const targetId = this.dataset.target; 
            const newTitleText = this.textContent.trim();
            window.showContent(targetId, newTitleText); 
        });
    });
    
    homeLink.addEventListener('click', function (event) {
        event.preventDefault(); 
        window.showContent('content-default', initialTitle); 
        document.querySelectorAll('.menu-item, .sidebar-item a').forEach(link => link.classList.remove('active'));
        document.getElementById('home-link').classList.add('active'); 
    });

    window.showContent('content-default', initialTitle);
    document.getElementById('home-link').classList.add('active');

    fetchVisitorStats(); 
    calculateAndDisplaySchoolAge();
});

async function fetchVisitorStats() {
    const visitsTodayEl = document.getElementById('visits-today');
    const visitsMonthEl = document.getElementById('visits-this-month');
    const visitsTotalEl = document.getElementById('visits-total');
    try {
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

async function fetchPersonnelData() {
    const personnelContentDiv = document.getElementById('content-personnel');
    personnelContentDiv.innerHTML = '<p class="text-gray-500 animate-pulse">กำลังโหลดข้อมูลบุคลากร...</p>'; 
    try {
        // <<<<< แก้ไขตรงนี้: เปลี่ยน ×tamp เป็น ×tamp >>>>>
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
            let html = '<h3 class="text-xl font-bold text-red-600 mb-4">ข้อมูลบุคลากร</h3>';
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
            personnelContentDiv.innerHTML = '<h3 class="text-xl font-bold text-red-600 mb-4">ข้อมูลบุคลากร</h3><p>ไม่พบข้อมูลบุคลากร หรือ Sheet อาจจะว่าง</p>';
        }
    } catch (error) { 
        personnelContentDiv.innerHTML = `<p class="text-red-500">การเชื่อมต่อล้มเหลว: ${error.message}</p><p class="text-sm text-gray-600">โปรดตรวจสอบการเชื่อมต่ออินเทอร์เน็ต และ Web App URL</p>`;
        console.error("Fetch error for personnel:", error);
    }
}

async function fetchStudentSummaryData() {
    const studentContentDiv = document.getElementById('content-students');
    studentContentDiv.innerHTML = '<p class="text-gray-500 animate-pulse">กำลังโหลดข้อมูลนักเรียน...</p>'; 
    try {
        // <<<<< แก้ไขตรงนี้: เปลี่ยน ×tamp เป็น ×tamp >>>>>
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
            let html = '<h3 class="text-xl font-bold text-red-600 mb-4">ข้อมูลนักเรียน (สรุป)</h3>';
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
            studentContentDiv.innerHTML = '<h3 class="text-xl font-bold text-red-600 mb-4">ข้อมูลนักเรียน (สรุป)</h3><p>ไม่พบข้อมูลนักเรียน หรือ Sheet อาจจะว่าง</p>';
        }
    } catch (error) { 
        studentContentDiv.innerHTML = `<p class="text-red-500">การเชื่อมต่อล้มเหลว: ${error.message}</p><p class="text-sm text-gray-600">โปรดตรวจสอบการเชื่อมต่ออินเทอร์เน็ต และ Web App URL</p>`;
        console.error("Fetch error for student summary:", error);
    }
}

async function fetchAndDisplayTableData(actionName, targetDivId, tableTitle) {
    const contentDiv = document.getElementById(targetDivId);
    contentDiv.innerHTML = `<p class="text-gray-500 animate-pulse">กำลังโหลดข้อมูล ${tableTitle}...</p>`;
    try {
        // <<<<< แก้ไขตรงนี้: เปลี่ยน ×tamp เป็น ×tamp >>>>>
        const response = await fetch(`${WEB_APP_URL}?action=${actionName}&timestamp=${new Date().getTime()}`); 
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const result = await response.json();
        if (result.error) {
            contentDiv.innerHTML = `<p class="text-red-500">เกิดข้อผิดพลาดในการโหลดข้อมูล ${tableTitle}: ${result.error} ${result.details || ''}</p>`;
            console.error(`Error fetching ${actionName}:`, result);
            return;
        }
        if (result.data && result.data.length > 0) {
            let html = `<h3 class="text-xl font-bold text-red-600 mb-4">${tableTitle}</h3>`;
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
                const linkText = linkDestination !== "#" ? "เปิดลิงก์" : "ไม่มีลิงก์";
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
            contentDiv.innerHTML = `<h3 class="text-xl font-bold text-red-600 mb-4">${tableTitle}</h3><p>ไม่พบข้อมูล ${tableTitle} หรือชีตอาจจะว่าง</p>`;
        }
    } catch (error) {
        contentDiv.innerHTML = `<p class="text-red-500">การเชื่อมต่อล้มเหลวขณะโหลดข้อมูล ${tableTitle}: ${error.message}</p>`;
        console.error(`Fetch error for ${actionName}:`, error);
    }
}

function displayPdf(targetDivId, pdfUrl, pdfTitle) {
    const contentDiv = document.getElementById(targetDivId);
    if (pdfUrl && pdfUrl !== 'URL_PDF_แผนปฏิบัติการ.pdf' && pdfUrl !== 'URL_PDF_รายงานผล.pdf' && pdfUrl.toLowerCase().endsWith('.pdf')) {
         contentDiv.innerHTML = `
            <iframe src="${pdfUrl}" class="pdf-embed-container" frameborder="0">
                <p>เบราว์เซอร์ของคุณไม่รองรับการแสดง PDF โดยตรง คุณสามารถ <a href="${pdfUrl}" target="_blank">ดาวน์โหลดไฟล์ PDF ที่นี่</a></p>
            </iframe>`;
    } else {
         contentDiv.innerHTML = `
            <p class="text-gray-600">ยังไม่มีไฟล์ ${pdfTitle} ให้แสดงในขณะนี้</p>
            <p class="text-sm text-gray-500">(ผู้ดูแลระบบ: โปรดอัปเดต URL ของไฟล์ PDF ในโค้ด JavaScript ส่วนฟังก์ชัน displayPdf)</p>`;
    }
}
