// URL ของ Google Apps Script Web App
const WEB_APP_URL = "https://script.google.com/macros/s/AKfycbx8_EwD9mFtTngc-oZMld6BYrFGdUrym5qCWCL7PGVTuhULVt-nbCzWKEzPZLBVCEOP/exec";

// ฟังก์ชันสำหรับคำนวณและแสดงอายุโรงเรียน
function calculateAndDisplaySchoolAge() {
    const foundingDate = new Date(1925, 10, 1); // เดือนใน JavaScript เริ่มจาก 0 (ม.ค.) ถึง 11 (ธ.ค.) -> พ.ย. คือ 10
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
    const initialTitle = 'ยินดีต้อนรับสู่โรงเรียนชุมชนบ้านแม่หละป่าป๋วย';
    const schoolInfoPrefix = 'สารสนเทศของโรงเรียน - ';

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

        const activeHeaderLink = document.querySelector(`header nav a[data-target="${targetId}"]`);
        if (activeHeaderLink) {
            activeHeaderLink.classList.add('active', 'text-yellow-200', 'font-semibold');
        }

        const activeSidebarLink = document.querySelector(`#main-menu a[data-target="${targetId}"]`);
        if (activeSidebarLink) {
            activeSidebarLink.classList.add('active', 'text-red-600', 'font-semibold');
            activeSidebarLink.classList.remove('text-gray-700');
        }

        if (targetId === 'content-personnel') {
            fetchPersonnelData();
        } else if (targetId === 'content-students') {
            fetchStudentSummaryData();
        } else if (targetId === 'content-smart-school') {
            fetchAndDisplayTableData('getSystemLinks', 'content-smart-school');
        } else if (targetId === 'content-information-links') {
            fetchAndDisplayTableData('getInformationLinks', 'content-information-links');
        } else if (targetId === 'content-action-plan') {
            displayPdf('content-action-plan', 'https://drive.google.com/file/d/1n3XtVetBdlzZqaDE8Hlm5xs9GGQg0sSH/preview');
        } else if (targetId === 'content-operation-report') {
            displayPdf('content-operation-report', 'https://drive.google.com/file/d/1jmBa9Heg4SH9apJlubVRLFfZBm42cZXw/preview');
        }
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

    fetchVisitorStats();
    calculateAndDisplaySchoolAge();
});

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

async function fetchPersonnelData() {
    const personnelContentDiv = document.getElementById('content-personnel');
    personnelContentDiv.innerHTML = '<p class="text-gray-500 animate-pulse">กำลังโหลดข้อมูลบุคลากร...</p>';
    try {
        const response = await fetch(`${WEB_APP_URL}?action=getPersonnel×tamp=${new Date().getTime()}`);
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
            html += '<table class="min-w-full divide-y divide-gray-200 text-sm data-table-theme">'; // Added data-table-theme
            html += '<thead><tr>'; // Removed bg-gray-50
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

async function fetchStudentSummaryData() {
    const studentContentDiv = document.getElementById('content-students');
    studentContentDiv.innerHTML = '<p class="text-gray-500 animate-pulse">กำลังโหลดข้อมูลนักเรียน...</p>';
    try {
        const response = await fetch(`${WEB_APP_URL}?action=getStudentSummary×tamp=${new Date().getTime()}`);
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
            html += '<table class="min-w-full divide-y divide-gray-200 text-sm data-table-theme">'; // Added data-table-theme
            html += '<thead><tr>'; // Removed bg-gray-50
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

async function fetchAndDisplayTableData(actionName, targetDivId) {
    const contentDiv = document.getElementById(targetDivId);
    contentDiv.innerHTML = `<p class="text-gray-500 animate-pulse">กำลังโหลดข้อมูล...</p>`;

    try {
        const response = await fetch(`${WEB_APP_URL}?action=${actionName}×tamp=${new Date().getTime()}`);
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
            html += '<table class="link-table min-w-full text-sm data-table-theme">'; // Added data-table-theme
            html += '<thead><tr>'; // Removed bg-gray-100
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
