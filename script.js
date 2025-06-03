// URL ของ Google Apps Script Web App ที่ deploy ไว้ (สำคัญมาก! ต้องเป็น URL ล่าสุด)
const WEB_APP_URL = "https://script.google.com/macros/s/AKfycby1gDrxtT4PtQkNQY3U5j2Kl9uCXohgaLbjPkL2ke5qtRmE0S4oLYxKV801bag01UF0/exec"; // << แก้ไขเป็น URL จริงของพี่

// --- ฟังก์ชันเกี่ยวกับอายุโรงเรียนและเดือน (เหมือนเดิม) ---
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
    }
}
const thaiShortMonths = ["ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.", "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."];
function getThaiShortMonth(monthNumber) {
    const index = parseInt(monthNumber) - 1;
    return (index >= 0 && index < 12) ? thaiShortMonths[index] : monthNumber.toString();
}

// --- DOM Elements ที่ใช้บ่อย ---
let loginModal, loginForm;
// START: DOM Elements สำหรับ Comment (จะถูกกำหนดค่าใน initializeCommentElements)
let commentsDisplayArea, commentFormArea, commentActionModal, commentActionForm,
    commentModalTitle, commentActionId, commentActionUserName, commentActionMessage,
    submitCommentActionButton, closeCommentActionModalButton, deleteCommentButton,
    commentApprovalSection, commentEmojiToggleButton, commentEmojiPickerContainer, commentEmojiPicker;
// END: DOM Elements สำหรับ Comment

let currentLoadedComments = []; // เก็บ comment ที่โหลดมาล่าสุด (สำหรับ edit/delete)

// --- ฟังก์ชันเกี่ยวกับ Login และ Session (เหมือนเดิม) ---
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
    const password = passwordInput.value;

    if (!username || !password) {
        Swal.fire({ icon: 'warning', title: 'ข้อมูลไม่ครบถ้วน', text: 'กรุณากรอกชื่อผู้ใช้และรหัสผ่านค่ะ'});
        return;
    }
    Swal.fire({ title: 'กำลังตรวจสอบ...', allowOutsideClick: false, didOpen: () => { Swal.showLoading(); }});
    try {
        const response = await fetch(WEB_APP_URL, {
            method: 'POST',
            mode: 'cors',
            headers: { 'Content-Type': 'text/plain;charset=utf-8' }, // Apps Script ชอบ text/plain สำหรับ e.postData.contents
            body: JSON.stringify({ action: "verifyLogin", username: username, password: password })
        });
        const result = await response.json();
        Swal.close();
        if (result.success) {
            setUserSession({ username: result.username, role: result.role });
            Swal.fire({ icon: 'success', title: 'เข้าสู่ระบบสำเร็จ!', text: `ยินดีต้อนรับคุณ ${result.username}`, timer: 1500, showConfirmButton: false });
            if(loginModal) loginModal.classList.add('hidden');
            if(loginForm) loginForm.reset();
            updateLoginUI();
            // ถ้าส่วน Smart School หรือ Comment แสดงอยู่ ให้โหลดข้อมูลใหม่
            if (document.getElementById('content-smart-school') && !document.getElementById('content-smart-school').classList.contains('hidden')) {
                fetchAndDisplayTableData('getSystemLinks', 'content-smart-school');
            }
            if (document.getElementById('content-comments') && !document.getElementById('content-comments').classList.contains('hidden')) {
                loadCommentsAndForm(); // โหลด comment ใหม่หลัง login
            }
        } else {
            Swal.fire({ icon: 'error', title: 'เข้าสู่ระบบไม่สำเร็จ', text: result.message || 'มีบางอย่างผิดพลาด'});
        }
    } catch (error) {
        Swal.close();
        console.error("Login error:", error);
        Swal.fire({ icon: 'error', title: 'เกิดข้อผิดพลาด', text: 'ไม่สามารถเชื่อมต่อกับระบบ Login ได้'});
    }
}
function handleLogout() {
    clearUserSession();
    Swal.fire({ icon: 'info', title: 'ออกจากระบบแล้ว', timer: 1500, showConfirmButton: false });
    updateLoginUI();
    if (document.getElementById('content-smart-school') && !document.getElementById('content-smart-school').classList.contains('hidden')) {
        fetchAndDisplayTableData('getSystemLinks', 'content-smart-school');
    }
    if (document.getElementById('content-comments') && !document.getElementById('content-comments').classList.contains('hidden')) {
        loadCommentsAndForm(); // โหลด comment ใหม่หลัง logout (จะเห็นเฉพาะ public)
    }
}
function updateLoginUI() {
    const user = getUserSession();
    const mainWhiteNavUl = document.querySelector('header nav.bg-white ul');
    if (!mainWhiteNavUl) return;

    mainWhiteNavUl.querySelectorAll('.generated-menu-item').forEach(item => item.remove());
    let menuItemsHtml = '';
    if (user) {
        if (user.role === 'admin' || user.role === 'manager') {
            menuItemsHtml += `<li class="generated-menu-item"><a href="#" data-target="content-admin-book" class="menu-item px-3 py-2 text-gray-700 hover:text-red-500">ลงทะเบียนรับหนังสือ</a></li>`; // สมมติมี data-target
        }
        if (user.role === 'manager') {
            menuItemsHtml += `<li class="generated-menu-item"><a href="#" data-target="content-admin-system" class="menu-item px-3 py-2 text-gray-700 hover:text-red-500">จัดการระบบ</a></li>`; // สมมติมี data-target
        }
        menuItemsHtml += `<li class="generated-menu-item"><a href="#" id="perform-logout-action" class="menu-item px-3 py-2 text-gray-700 hover:text-red-500">Logout (${user.username})</a></li>`;
    } else {
        menuItemsHtml += `<li class="generated-menu-item"><a href="#" id="perform-login-action" class="menu-item px-3 py-2 text-gray-700 hover:text-red-500">Login</a></li>`;
    }
    mainWhiteNavUl.insertAdjacentHTML('beforeend', menuItemsHtml);

    const loginButton = document.getElementById('perform-login-action');
    if (loginButton) loginButton.addEventListener('click', (e) => { e.preventDefault(); openLoginModal(); });
    const logoutButton = document.getElementById('perform-logout-action');
    if (logoutButton) logoutButton.addEventListener('click', (e) => { e.preventDefault(); handleLogout(); });

    // เพิ่มการผูก Event Listener ให้กับเมนูที่สร้างจาก JS ถ้ามี data-target
    mainWhiteNavUl.querySelectorAll('.generated-menu-item a[data-target]').forEach(link => {
        link.addEventListener('click', function (event) {
            event.preventDefault();
            const targetId = this.dataset.target;
            window.showContent(targetId, this);
        });
    });
}
function openLoginModal() {
    if (loginModal) loginModal.classList.remove('hidden');
}

// --- START: ฟังก์ชันเกี่ยวกับ Comment CRUD & Display ---
function initializeCommentElements() {
    commentsDisplayArea = document.getElementById('comments-display-area');
    commentFormArea = document.getElementById('comment-form-area');
    commentActionModal = document.getElementById('commentActionModal');
    commentActionForm = document.getElementById('commentActionForm');
    commentModalTitle = document.getElementById('commentModalTitle');
    commentActionId = document.getElementById('commentActionId');
    commentActionUserName = document.getElementById('commentActionUserName');
    commentActionMessage = document.getElementById('commentActionMessage');
    submitCommentActionButton = document.getElementById('submitCommentActionButton');
    closeCommentActionModalButton = document.getElementById('closeCommentActionModalButton');
    deleteCommentButton = document.getElementById('deleteCommentButton');
    commentApprovalSection = document.getElementById('commentApprovalSection');
    commentEmojiToggleButton = document.getElementById('commentEmojiToggleButton');
    commentEmojiPickerContainer = document.getElementById('commentEmojiPickerContainer');

    if (commentEmojiPickerContainer) {
        commentEmojiPicker = commentEmojiPickerContainer.querySelector('emoji-picker');
    }

    if (closeCommentActionModalButton) closeCommentActionModalButton.addEventListener('click', closeCommentActionModal);
    if (commentActionModal) commentActionModal.addEventListener('click', (event) => { if (event.target === commentActionModal) closeCommentActionModal(); });
    if (commentActionForm) commentActionForm.addEventListener('submit', handleSaveComment);
    if (deleteCommentButton) deleteCommentButton.addEventListener('click', handleDeleteComment);

    if (commentEmojiToggleButton && commentEmojiPicker && commentEmojiPickerContainer) {
        commentEmojiToggleButton.addEventListener('click', (e) => {
            e.stopPropagation();
            commentEmojiPickerContainer.classList.toggle('hidden');
            if (!commentEmojiPickerContainer.classList.contains('hidden')) {
                 commentEmojiPicker.style.width = '100%'; // Ensure picker uses full width of container
                 commentEmojiPicker.style.height = '250px'; // Adjust height as needed
            }
        });
        commentEmojiPicker.addEventListener('emoji-click', event => {
            const emoji = event.detail.unicode;
            const textarea = commentActionMessage;
            const start = textarea.selectionStart;
            const end = textarea.selectionEnd;
            textarea.value = textarea.value.substring(0, start) + emoji + textarea.value.substring(end);
            textarea.focus();
            textarea.selectionEnd = start + emoji.length;
            commentEmojiPickerContainer.classList.add('hidden'); // Hide after selection
        });
        document.addEventListener('click', (event) => {
            if (commentEmojiPickerContainer && !commentEmojiPickerContainer.classList.contains('hidden') &&
                !commentEmojiPickerContainer.contains(event.target) && event.target !== commentEmojiToggleButton) {
                commentEmojiPickerContainer.classList.add('hidden');
            }
        });
    } else {
        // console.warn("Emoji picker elements not fully initialized.");
    }
}

function openCommentActionModal(mode = 'new', commentData = null) {
    if (!commentActionModal || !commentActionForm) return;
    commentActionForm.reset();
    commentActionId.value = '';
    if(deleteCommentButton) deleteCommentButton.classList.add('hidden');
    if(commentApprovalSection) commentApprovalSection.classList.add('hidden');
    if(commentEmojiPickerContainer) commentEmojiPickerContainer.classList.add('hidden');


    const user = getUserSession();
    if (!user && mode !== 'new_public') { // ถ้าจะให้คนไม่ login ส่งได้ ต้องมี mode 'new_public'
                                       // แต่ตามโจทย์คือต้อง login ถึงจะทำอะไรได้
        Swal.fire('จำเป็นต้อง Login', 'กรุณาเข้าสู่ระบบก่อนดำเนินการ', 'warning');
        return;
    }


    if (mode === 'new') {
        commentModalTitle.textContent = 'เขียนข้อความใหม่';
        submitCommentActionButton.textContent = 'ส่งข้อความ';
        commentActionUserName.value = user ? user.username : ''; // ใส่ชื่อ user ที่ login ถ้ามี
        commentActionUserName.readOnly = !!user; // ถ้า login แล้ว ให้ชื่อ readOnly
        if (user) { // ผู้ใช้ที่ login ทุกคนสามารถตั้งสถานะอนุมัติได้
            commentApprovalSection.classList.remove('hidden');
            // Default ให้เป็น "อนุมัติให้แสดง" เลย เพราะผู้สร้างเป็นคนจัดการเอง
            const approveRadio = commentActionForm.querySelector('input[name="isApproved"][value="true"]');
            if(approveRadio) approveRadio.checked = true;
        }
    } else if (mode === 'edit' && commentData) {
        commentModalTitle.textContent = 'จัดการ/แก้ไขความคิดเห็น';
        submitCommentActionButton.textContent = 'บันทึกการเปลี่ยนแปลง';
        commentActionId.value = commentData.id;
        commentActionUserName.value = commentData.name;
        // แปลง <br> กลับเป็น \n สำหรับ textarea
        commentActionMessage.value = commentData.commentText.replace(/<br\s*\/?>/gi, "\n");

        if (user) { // ผู้ใช้ที่ login ทุกคนจัดการได้
            deleteCommentButton.classList.remove('hidden');
            commentApprovalSection.classList.remove('hidden');
            const approveValue = commentData.isApproved ? "true" : "false";
            const radioToCheck = commentActionForm.querySelector(`input[name="isApproved"][value="${approveValue}"]`);
            if(radioToCheck) radioToCheck.checked = true;
        }
        commentActionUserName.readOnly = false; // ให้แก้ไขชื่อได้
    } else {
        return;
    }

    commentActionModal.classList.remove('hidden');
    setTimeout(() => {
        commentActionModal.classList.remove('opacity-0');
        commentActionModal.querySelector('.bg-white').classList.remove('scale-95');
        commentActionModal.querySelector('.bg-white').classList.add('scale-100');
    }, 10);
}

function closeCommentActionModal() {
    if (!commentActionModal) return;
    commentActionModal.classList.add('opacity-0');
    commentActionModal.querySelector('.bg-white').classList.remove('scale-100');
    commentActionModal.querySelector('.bg-white').classList.add('scale-95');
    setTimeout(() => {
        commentActionModal.classList.add('hidden');
        if(commentEmojiPickerContainer) commentEmojiPickerContainer.classList.add('hidden');
    }, 300);
}

async function loadCommentsAndForm() {
    if (!commentsDisplayArea || !commentFormArea) {
        // console.error("Comment display or form area not found for loading.");
        if (document.getElementById('content-comments')) {
            document.getElementById('content-comments').innerHTML = '<p class="text-red-500 p-4">โครงสร้างหน้าสำหรับแสดงความคิดเห็นไม่ถูกต้อง (JS)</p>';
        }
        return;
    }
    commentsDisplayArea.innerHTML = '<p class="text-center text-gray-400 animate-pulse py-8 text-lg">กำลังโหลดข้อความ...</p>';
    commentFormArea.innerHTML = '';

    const user = getUserSession();

    if (user) {
        commentFormArea.innerHTML = `
            <div class="text-center mt-2 mb-6">
                <button onclick="openCommentActionModal('new')" class="bg-gradient-to-r from-red-500 to-yellow-500 hover:from-red-600 hover:to-yellow-600 text-white font-semibold py-3 px-8 rounded-full shadow-lg transform transition-all duration-150 ease-in-out hover:scale-105 focus:outline-none focus:ring-2 focus:ring-red-400 focus:ring-opacity-75">
                    <i class="fas fa-plus-circle mr-2"></i>เขียนข้อความใหม่ / จัดการข้อความ
                </button>
            </div>`;
    } else {
        commentFormArea.innerHTML = `
            <p class="text-center text-gray-600 bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                กรุณา <a href="#" onclick="event.preventDefault(); openLoginModal();" class="text-red-600 hover:underline font-semibold">เข้าสู่ระบบ</a> เพื่อแสดงความคิดเห็นหรือจัดการข้อความค่ะ
            </p>`;
    }

    try {
        const response = await fetch(`${WEB_APP_URL}?action=getCommentsForDisplay&loggedIn=${!!user}&cb=${new Date().getTime()}`);
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`API call failed: ${response.status}. Details: ${errorText}`);
        }
        const result = await response.json();

        if (result.error) {
            commentsDisplayArea.innerHTML = `<p class="text-center text-red-500 py-4">เกิดข้อผิดพลาดจากเซิร์ฟเวอร์: ${result.error} ${result.details || ''}</p>`;
            return;
        }

        currentLoadedComments = result.data || [];

        if (currentLoadedComments.length > 0) {
            let html = '<div class="space-y-5">'; // Reduced space-y
            currentLoadedComments.forEach(comment => {
                const formattedDate = comment.timestamp ? new Date(comment.timestamp).toLocaleString('th-TH', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'ไม่ระบุเวลา';
                const safeName = (comment.name || 'ผู้ไม่ประสงค์ออกนาม').replace(/</g, "&lt;").replace(/>/g, "&gt;");
                const safeCommentText = (comment.commentText || '').replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/\n/g, "<br>");
                
                const approvalClasses = comment.isApproved ? 'border-green-200 bg-green-50' : 'border-yellow-300 bg-yellow-50';
                const approvalText = comment.isApproved ? 'อนุมัติแล้ว' : 'รออนุมัติ';
                const approvalTextClass = comment.isApproved ? 'text-green-700 bg-green-100' : 'text-yellow-700 bg-yellow-100';
                const approvalBadge = user ? `<span class="text-xs font-medium px-2 py-0.5 rounded-full ${approvalTextClass}">${approvalText}</span>` : '';
                const manageButton = user ? `<div class="mt-2 text-right"><button onclick="editComment('${comment.id}')" class="text-xs text-blue-600 hover:text-blue-800 font-medium py-1 px-2 rounded hover:bg-blue-50 transition-colors">จัดการ/แก้ไข</button></div>` : '';

                html += `
                    <div class="p-4 rounded-lg shadow-md border ${user ? approvalClasses : 'border-gray-200'} bg-white" data-comment-id="${comment.id}">
                        <div class="flex justify-between items-start mb-1.5">
                            <p class="font-semibold text-gray-700 text-md">${safeName}</p>
                            <div class="text-right space-y-1">
                                <p class="text-xs text-gray-500">${formattedDate} น.</p>
                                ${approvalBadge}
                            </div>
                        </div>
                        <p class="text-gray-600 leading-relaxed text-sm">${safeCommentText}</p>
                        ${manageButton}
                    </div>
                `;
            });
            html += '</div>';
            commentsDisplayArea.innerHTML = html;
        } else {
            commentsDisplayArea.innerHTML = `
                <div class="text-center p-6 md:p-10 rounded-xl border-2 border-dashed border-gray-300 bg-gray-50">
                    <svg class="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                        <path vector-effect="non-scaling-stroke" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                    </svg>
                    <p class="mt-5 text-lg text-gray-500">ยังไม่มีข้อความในขณะนี้...</p>
                    ${user ? '<p class="mt-2 text-sm text-gray-400">คุณสามารถเป็นคนแรกที่เริ่มการสนทนาได้เลยค่ะ!</p>' : ''}
                </div>`;
        }
    } catch (error) {
        console.error("Error loading comments:", error);
        commentsDisplayArea.innerHTML = `<p class="text-center text-red-500 py-4">การเชื่อมต่อเพื่อโหลดความคิดเห็นล้มเหลว: ${error.message}. กรุณาลองอีกครั้ง</p>`;
    }
}

function editComment(commentId) {
    const commentData = currentLoadedComments.find(c => c.id === commentId);
    if (commentData) {
        openCommentActionModal('edit', commentData);
    } else {
        Swal.fire('ข้อผิดพลาด', 'ไม่พบข้อมูลความคิดเห็นที่ต้องการแก้ไข', 'error');
    }
}

async function handleSaveComment(event) {
    event.preventDefault();
    if (!commentActionForm) return;
    const user = getUserSession();
    if (!user) { Swal.fire('จำเป็นต้อง Login', 'กรุณาเข้าสู่ระบบก่อน', 'warning'); return; }

    const commentId = commentActionId.value;
    const name = commentActionUserName.value.trim();
    const message = commentActionMessage.value.trim();
    const isApprovedInput = commentActionForm.querySelector('input[name="isApproved"]:checked');
    const isApproved = isApprovedInput ? (isApprovedInput.value === 'true') : false; // Default to false if not found (should not happen if user is logged in)

    if (!name || !message) { Swal.fire('ข้อมูลไม่ครบ', 'กรุณากรอกชื่อและข้อความ', 'warning'); return; }

    submitCommentActionButton.disabled = true;
    submitCommentActionButton.innerHTML = `<span class="animate-spin inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2"></span>กำลังบันทึก...`;

    const payload = { id: commentId || null, name: name, commentText: message, isApproved: isApproved };
    try {
        const response = await fetch(WEB_APP_URL, {
            method: 'POST', mode: 'cors', cache: 'no-cache',
            headers: { 'Content-Type': 'text/plain;charset=utf-8' },
            body: JSON.stringify({ action: "submitOrUpdateComment", payload: payload, userSession: user })
        });
        const result = await response.json();
        if (result.success) {
            Swal.fire({ icon: 'success', title: 'สำเร็จ!', text: result.message, timer: 2000, showConfirmButton: false });
            closeCommentActionModal();
            loadCommentsAndForm();
        } else { Swal.fire('เกิดข้อผิดพลาด', result.message || 'ไม่สามารถบันทึกได้', 'error'); }
    } catch (error) {
        console.error("Error saving comment:", error);
        Swal.fire('เกิดข้อผิดพลาดในการเชื่อมต่อ', `ติดต่อเซิร์ฟเวอร์ไม่ได้: ${error.message}`, 'error');
    } finally {
        submitCommentActionButton.disabled = false;
        // Title และ Text ปุ่มจะถูก set ตอนเปิด Modal
    }
}

async function handleDeleteComment() {
    const commentId = commentActionId.value;
    if (!commentId) return;
    const user = getUserSession();
    if (!user) { Swal.fire('จำเป็นต้อง Login', 'กรุณาเข้าสู่ระบบก่อน', 'warning'); return; }

    Swal.fire({
        title: 'ยืนยันการลบ?', text: "ความคิดเห็นนี้จะถูกลบอย่างถาวร!", icon: 'warning',
        showCancelButton: true, confirmButtonColor: '#d33', cancelButtonColor: '#6b7280',
        confirmButtonText: 'ใช่, ลบเลย!', cancelButtonText: 'ยกเลิก'
    }).then(async (result) => {
        if (result.isConfirmed) {
            Swal.fire({ title: 'กำลังลบ...', allowOutsideClick: false, didOpen: () => Swal.showLoading() });
            try {
                const response = await fetch(WEB_APP_URL, {
                    method: 'POST', mode: 'cors', cache: 'no-cache',
                    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
                    body: JSON.stringify({ action: "deleteCommentById", payload: { commentId: commentId }, userSession: user })
                });
                const resData = await response.json();
                Swal.close();
                if (resData.success) {
                    Swal.fire('ลบแล้ว!', resData.message, 'success');
                    closeCommentActionModal();
                    loadCommentsAndForm();
                } else { Swal.fire('เกิดข้อผิดพลาด!', resData.message || 'ไม่สามารถลบได้', 'error'); }
            } catch (error) {
                Swal.close(); console.error("Error deleting comment:", error);
                Swal.fire('เกิดข้อผิดพลาดในการเชื่อมต่อ!', `ติดต่อเซิร์ฟเวอร์ไม่ได้: ${error.message}`, 'error');
            }
        }
    });
}
// --- END: ฟังก์ชันเกี่ยวกับ Comment CRUD & Display ---


// --- เมื่อเอกสาร HTML โหลดเสร็จสมบูรณ์ (Original DOMContentLoaded) ---
document.addEventListener('DOMContentLoaded', function () {
    const homeLink = document.getElementById('home-link');
    const contentSections = document.querySelectorAll('.content-section');
    const centerContentTitle = document.getElementById('center-content-title');
    const initialTitle = 'ยินดีต้อนรับสู่โรงเรียนชุมชนบ้านแม่หละป่าป๋วย';
    const schoolInfoPrefix = 'สารสนเทศของโรงเรียน - ';

    loginModal = document.getElementById('loginModal');
    loginForm = document.getElementById('loginForm');
    const closeLoginModalButton = document.getElementById('closeLoginModalButton');

    if (loginForm) loginForm.addEventListener('submit', handleLoginSubmit);
    if (closeLoginModalButton) closeLoginModalButton.addEventListener('click', () => { if(loginModal) loginModal.classList.add('hidden'); if(loginForm) loginForm.reset(); });
    if (loginModal) loginModal.addEventListener('click', (event) => { if (event.target === loginModal) { loginModal.classList.add('hidden'); if(loginForm) loginForm.reset(); } });

    // <<< START: เรียก initializeCommentElements() >>>
    initializeCommentElements();
    // <<< END: เรียก initializeCommentElements() >>>

    window.showContent = function(targetId, linkElement) {
        contentSections.forEach(section => section.classList.add('hidden'));
        const targetSection = document.getElementById(targetId);
        let newTitleText = initialTitle; // Default title

        if (targetSection) {
            targetSection.classList.remove('hidden');
        } else {
            const defaultSection = document.getElementById('content-default');
            if (defaultSection) defaultSection.classList.remove('hidden');
            targetId = 'content-default'; // Fallback to default
        }

        if (linkElement) {
            newTitleText = linkElement.textContent.trim();
            if (targetId === 'content-default') newTitleText = initialTitle;
            else if (linkElement.closest('.sidebar')) newTitleText = schoolInfoPrefix + newTitleText;
            // สำหรับ "ติดต่อเรา" ถ้าต้องการ title พิเศษ
            else if (targetId === 'content-comments') newTitleText = "ติดต่อเรา / ฝากข้อความถึงโรงเรียน";
        } else if (targetId === 'content-default') {
             newTitleText = initialTitle;
        }


        if(centerContentTitle) centerContentTitle.textContent = newTitleText;

        document.querySelectorAll('header nav ul a.menu-item, #main-menu a').forEach(link => {
            link.classList.remove('active', 'text-red-500', 'font-semibold');
            if (link.closest('#main-menu')) link.classList.add('text-gray-700');
            else if (link.closest('header nav ul')) link.classList.add('text-gray-700');
        });

        const activeHeaderLink = document.querySelector(`header nav.bg-white ul a[data-target="${targetId}"], header nav.bg-white ul a#home-link[data-target="${targetId}"], header nav.bg-white ul li.generated-menu-item a[data-target="${targetId}"]`);
        if (linkElement && linkElement.closest('header nav.bg-white ul')) {
             linkElement.classList.add('active', 'text-red-500', 'font-semibold');
             linkElement.classList.remove('text-gray-700');
        } else if (activeHeaderLink) {
            activeHeaderLink.classList.add('active', 'text-red-500', 'font-semibold');
            activeHeaderLink.classList.remove('text-gray-700');
        }

        const activeSidebarLink = document.querySelector(`#main-menu a[data-target="${targetId}"]`);
        if (activeSidebarLink) {
            activeSidebarLink.classList.add('active', 'text-red-600', 'font-semibold');
            activeSidebarLink.classList.remove('text-gray-700');
        }

        // <<< START: เรียก loadCommentsAndForm เมื่อ targetId คือ content-comments >>>
        if (targetId === 'content-comments') {
            loadCommentsAndForm();
        }
        // <<< END >>>
        else if (targetId === 'content-personnel') fetchPersonnelData();
        else if (targetId === 'content-students') fetchStudentSummaryData();
        else if (targetId === 'content-smart-school') fetchAndDisplayTableData('getSystemLinks', 'content-smart-school');
        else if (targetId === 'content-information-links') fetchAndDisplayTableData('getInformationLinks', 'content-information-links');
        else if (targetId === 'content-action-plan') displayPdf('content-action-plan', 'https://drive.google.com/file/d/1n3XtVetBdlzZqaDE8Hlm5xs9GGQg0sSH/preview');
        else if (targetId === 'content-operation-report') displayPdf('content-operation-report', 'https://drive.google.com/file/d/1jmBa9Heg4SH9apJlubVRLFfZBm42cZXw/preview');
    }

    document.querySelectorAll('header nav.bg-white ul a[data-target], #main-menu a[data-target]').forEach(link => {
        link.addEventListener('click', function (event) {
            event.preventDefault();
            const targetId = this.dataset.target;
            window.showContent(targetId, this);
        });
    });
    if(homeLink) { // Ensure homeLink exists
        homeLink.addEventListener('click', function (event) {
            event.preventDefault();
            const targetId = this.dataset.target;
            window.showContent(targetId, this);
        });
        // Show default content on page load
        const defaultTarget = homeLink.dataset.target || 'content-default';
        window.showContent(defaultTarget, homeLink);
    } else { // Fallback if home-link is not found (e.g. on other pages)
        if(document.getElementById('content-default')) { // Check if default content exists
             window.showContent('content-default', null);
        }
    }


    updateLoginUI();
    fetchVisitorStats(); // <<< ตรวจสอบการเรียกนี้ และ WEB_APP_URL ด้านบน
    calculateAndDisplaySchoolAge();
    fetchAndDisplayCalendarEvents();
});


// --- ฟังก์ชันดึงข้อมูลต่างๆ (VisitorStats, Personnel, Students, PDF, Calendar, TableData) ---
// (โค้ดส่วนนี้เหมือนเดิมจากที่พี่ให้มา หรือจากคำตอบก่อนหน้า)
// >>> START: ตรวจสอบ fetchVisitorStats <<<
async function fetchVisitorStats() {
    const visitsTodayEl = document.getElementById('visits-today');
    const visitsMonthEl = document.getElementById('visits-this-month');
    const visitsTotalEl = document.getElementById('visits-total');

    if (!visitsTodayEl || !visitsMonthEl || !visitsTotalEl) {
        // console.warn("Visitor stats display elements not all found.");
        return;
    }

    visitsTodayEl.textContent = "โหลด...";
    visitsMonthEl.textContent = "โหลด...";
    visitsTotalEl.textContent = "โหลด...";

    try {
        console.log("Attempting to fetch visitor stats from:", `${WEB_APP_URL}?action=logVisitAndGetCounts&cb=${new Date().getTime()}`);
        const response = await fetch(`${WEB_APP_URL}?action=logVisitAndGetCounts&cb=${new Date().getTime()}`); // cb for cache busting
        console.log("Visitor stats response status:", response.status);

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`HTTP error! status: ${response.status}, details: ${errorText}`);
        }
        const result = await response.json();
        console.log("Visitor stats raw result:", result);

        if (result.error) {
            console.error("Error from Apps Script (Visitor Stats):", result.error, result.details || "");
            visitsTodayEl.textContent = "-"; visitsMonthEl.textContent = "-"; visitsTotalEl.textContent = "-";
            return;
        }
        if (result.data) {
            visitsTodayEl.textContent = `${result.data.today.toLocaleString()} คน`;
            visitsMonthEl.textContent = `${result.data.month.toLocaleString()} คน`;
            visitsTotalEl.textContent = `${result.data.total.toLocaleString()} คน`;
        } else {
            console.warn("Visitor stats data object is missing in the response:", result);
            visitsTodayEl.textContent = "N/A"; visitsMonthEl.textContent = "N/A"; visitsTotalEl.textContent = "N/A";
        }
    } catch (error) {
        console.error("Failed to fetch visitor stats (catch block):", error);
        visitsTodayEl.textContent = "ผิดพลาด"; visitsMonthEl.textContent = "ผิดพลาด"; visitsTotalEl.textContent = "ผิดพลาด";
    }
}
// >>> END: ตรวจสอบ fetchVisitorStats <<<

async function fetchPersonnelData() {
    const personnelContentDiv = document.getElementById('content-personnel');
    if(!personnelContentDiv) return;
    personnelContentDiv.innerHTML = '<p class="text-gray-500 animate-pulse">กำลังโหลดข้อมูลบุคลากร...</p>';
    try {
        const response = await fetch(`${WEB_APP_URL}?action=getPersonnel&timestamp=${new Date().getTime()}`);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const result = await response.json();
        if (result.error) {
            personnelContentDiv.innerHTML = `<p class="text-red-500">เกิดข้อผิดพลาด: ${result.error} ${result.details || ''}</p>`; return;
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
        personnelContentDiv.innerHTML = `<p class="text-red-500">การเชื่อมต่อล้มเหลว: ${error.message}</p>`;
    }
}
async function fetchStudentSummaryData() {
    const studentContentDiv = document.getElementById('content-students');
    if(!studentContentDiv) return;
    studentContentDiv.innerHTML = '<p class="text-gray-500 animate-pulse">กำลังโหลดข้อมูลนักเรียน...</p>';
    try {
        const response = await fetch(`${WEB_APP_URL}?action=getStudentSummary&timestamp=${new Date().getTime()}`);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const result = await response.json();
        if (result.error) {
            studentContentDiv.innerHTML = `<p class="text-red-500">เกิดข้อผิดพลาด: ${result.error} ${result.details || ''}</p>`; return;
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
                        `<td class="px-4 py-2 whitespace-nowrap text-center">${sumPerLevel}</td></tr>`; // Use calculated sum
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
        studentContentDiv.innerHTML = `<p class="text-red-500">การเชื่อมต่อล้มเหลว: ${error.message}</p>`;
    }
}
function displayPdf(targetDivId, pdfUrl) {
    const contentDiv = document.getElementById(targetDivId);
    if(!contentDiv) return;
    if (pdfUrl && pdfUrl.startsWith('https://drive.google.com/file/d/')) {
         contentDiv.innerHTML = `<iframe src="${pdfUrl}" class="pdf-embed-container" frameborder="0" allowfullscreen><p>เบราว์เซอร์ไม่รองรับ PDF <a href="${pdfUrl.replace('/preview', '/view')}" target="_blank">เปิดที่นี่</a>.</p></iframe>`;
    } else {
         contentDiv.innerHTML = `<p class="text-gray-600 mt-4">ยังไม่มีไฟล์ หรือ URL ผิดพลาด</p>`;
    }
}
async function fetchAndDisplayCalendarEvents() {
    const calendarContainer = document.getElementById('calendar-events-container');
    if (!calendarContainer) return;
    calendarContainer.innerHTML = '<p class="text-gray-500 animate-pulse">กำลังโหลดปฏิทิน...</p>';
    try {
        const response = await fetch(`${WEB_APP_URL}?action=getCalendarEvents&timestamp=${new Date().getTime()}`);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const result = await response.json();
        if (result.error) {
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
        calendarContainer.innerHTML = '<p class="text-red-500">เชื่อมต่อปฏิทินล้มเหลว</p>';
    }
}
async function fetchAndDisplayTableData(actionName, targetDivId) {
    const contentDiv = document.getElementById(targetDivId);
    if(!contentDiv) return;
    contentDiv.innerHTML = `<p class="text-gray-500 animate-pulse">กำลังโหลดข้อมูล...</p>`;
    const userSession = getUserSession();

    try {
        const response = await fetch(`${WEB_APP_URL}?action=${actionName}&timestamp=${new Date().getTime()}`);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const result = await response.json();
        if (result.error) {
            contentDiv.innerHTML = `<p class="text-red-500">เกิดข้อผิดพลาด: ${result.error} ${result.details || ''}</p>`; return;
        }
        if (result.data && result.data.length > 0) {
            let html = '<div class="overflow-x-auto"><table class="link-table min-w-full text-sm data-table-theme"><thead><tr>' +
                       '<th scope="col" class="col-number px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">ลำดับ</th>' +
                       '<th scope="col" class="col-name px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ชื่อรายการ</th>';
            if (userSession || targetDivId !== 'content-smart-school') { // Smart school link column only for logged-in users
                 html += '<th scope="col" class="col-link px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">ลิงก์</th>';
            }
            html += '</tr></thead><tbody class="bg-white divide-y divide-gray-200">';
            result.data.forEach(item => {
                html += `<tr><td class="col-number px-4 py-2 text-center whitespace-nowrap align-middle">${item.number || '-'}</td>` +
                        `<td class="col-name px-4 py-2 whitespace-nowrap align-middle">${item.name || '-'}</td>`;
                if (targetDivId === 'content-smart-school') {
                    if (userSession) { // Only show link if user is logged in
                        const linkDest = item.link && item.link.trim() !== "" && !["n/a", "-"].includes(item.link.trim().toLowerCase()) ? item.link.trim() : "";
                        const targetAttr = linkDest && (linkDest.startsWith('http') || linkDest.startsWith('//')) ? 'target="_blank" rel="noopener noreferrer"' : '';
                        let iconHtml = "<span class='text-gray-400'>-</span>";
                        if (linkDest) iconHtml = `<img src='https://i.postimg.cc/25R6kGJx/ico1.png' border='0' alt='เปิดลิงก์' class='w-6 h-6 mx-auto'>`;
                        html += `<td class="col-link px-4 py-2 text-center whitespace-nowrap align-middle">${linkDest ? `<a href="${linkDest}" ${targetAttr} class="inline-block p-1" title="เปิด: ${item.name || ''}">${iconHtml}</a>` : iconHtml}</td>`;
                    }
                } else { // For other tables like 'information-links'
                    const linkDest = item.link && item.link.trim() !== "" && !["n/a", "-"].includes(item.link.trim().toLowerCase()) ? item.link.trim() : "";
                    const targetAttr = linkDest && (linkDest.startsWith('http') || linkDest.startsWith('//')) ? 'target="_blank" rel="noopener noreferrer"' : '';
                    let iconHtml = "<span class='text-gray-400'>-</span>";
                    if (linkDest) iconHtml = `<img src='https://i.postimg.cc/25R6kGJx/ico1.png' border='0' alt='เปิดลิงก์' class='w-6 h-6 mx-auto'>`;
                    html += `<td class="col-link px-4 py-2 text-center whitespace-nowrap align-middle">${linkDest ? `<a href="${linkDest}" ${targetAttr} class="inline-block p-1" title="เปิด: ${item.name || ''}">${iconHtml}</a>` : iconHtml}</td>`;
                }
                html += '</tr>';
            });
            html += '</tbody></table></div>';
            contentDiv.innerHTML = html;
        } else { contentDiv.innerHTML = `<p>ไม่พบข้อมูล</p>`; }
    } catch (error) {
        contentDiv.innerHTML = `<p class="text-red-500">การเชื่อมต่อล้มเหลว: ${error.message}</p>`;
    }
}
