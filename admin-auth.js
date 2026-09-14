/**
 * Bhaskar Classes Barmer - Admin Firebase Authentication Module
 */
import { 
  auth, 
  db,
  doc,
  getDoc,
  collection,
  getDocs,
  updateDoc,
  onSnapshot,
  onAuthStateChanged,
  signInWithEmailAndPassword, 
  signOut 
} from "./firebase-config.js";

/**
 * Check if the user is an authorized admin.
 * Pure dynamic Firestore verification — ZERO IDs, credentials, or emails in client code!
 */
async function verifyAdminRole(user) {
  if (!user || !user.uid) return false;

  try {
    const adminDocRef = doc(db, "admins", user.uid);
    const adminDocSnap = await getDoc(adminDocRef);
    return adminDocSnap.exists();
  } catch (err) {
    console.error("Firestore Admin Verification Error:", err.message);
    return false;
  }
}

document.addEventListener('DOMContentLoaded', () => {
  initAdminAuthUI();
  initAdminFirebaseListener();
});

function showAdminAlert(message, type = 'error') {
  const alertBox = document.getElementById('adminAuthAlertBox');
  if (!alertBox) return;

  alertBox.style.display = 'block';
  if (type === 'error') {
    alertBox.style.backgroundColor = '#FEE2E2';
    alertBox.style.color = '#B91C1C';
    alertBox.style.border = '1px solid #F87171';
    alertBox.innerHTML = `<i class="fa-solid fa-circle-exclamation mr-1"></i> ${message}`;
  } else if (type === 'success') {
    alertBox.style.backgroundColor = '#DCFCE7';
    alertBox.style.color = '#15803D';
    alertBox.style.border = '1px solid #86EFAC';
    alertBox.innerHTML = `<i class="fa-solid fa-circle-check mr-1"></i> ${message}`;
  } else {
    alertBox.style.backgroundColor = '#E0F2FE';
    alertBox.style.color = '#0284C7';
    alertBox.style.border = '1px solid #7DD3FC';
    alertBox.innerHTML = `<i class="fa-solid fa-circle-info mr-1"></i> ${message}`;
  }
}

function hideAdminAlert() {
  const alertBox = document.getElementById('adminAuthAlertBox');
  if (alertBox) alertBox.style.display = 'none';
}

function getAdminHindiErrorMessage(errorCode) {
  switch (errorCode) {
    case 'auth/invalid-email':
      return 'कृपया एक मान्य एडमिन ईमेल आईडी दर्ज करें।';
    case 'auth/user-not-found':
      return 'यह एडमिन आईडी Firebase में पंजीकृत नहीं है। कृपया Firebase Console में यूज़र जोड़ें।';
    case 'auth/wrong-password':
    case 'auth/invalid-credential':
      return 'अमान्य एडमिन आईडी या पासवर्ड। कृपया पुनः जांचकर प्रयास करें।';
    case 'auth/user-disabled':
      return 'यह एडमिन खाता अक्षम कर दिया गया है।';
    case 'auth/too-many-requests':
      return 'बहुत अधिक असफल प्रयास। कृपया कुछ देर प्रतीक्षा करें।';
    case 'auth/network-request-failed':
      return 'इंटरनेट कनेक्शन में समस्या है। कृपया नेटवर्क जांचें।';
    default:
      return 'लॉगिन में त्रुटि आई: ' + errorCode;
  }
}

function initAdminAuthUI() {
  const loginForm = document.getElementById('adminLoginForm');
  const logoutBtn = document.getElementById('adminLogoutBtn');
  const resetPassBtn = document.getElementById('adminResetPasswordBtn');
  const togglePassBtn = document.getElementById('toggleAdminPassBtn');

  // Password Visibility Toggle
  if (togglePassBtn) {
    togglePassBtn.addEventListener('click', () => {
      const passInput = document.getElementById('adminPass');
      if (!passInput) return;
      if (passInput.type === 'password') {
        passInput.type = 'text';
        togglePassBtn.innerHTML = '<i class="fa-solid fa-eye-slash"></i>';
      } else {
        passInput.type = 'password';
        togglePassBtn.innerHTML = '<i class="fa-solid fa-eye"></i>';
      }
    });
  }

  // Admin Firebase Login Form
  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      hideAdminAlert();

      const emailInput = document.getElementById('adminEmail');
      const passInput = document.getElementById('adminPass');
      const submitBtn = document.getElementById('adminLoginSubmitBtn');

      if (!emailInput || !passInput) return;
      const email = emailInput.value.trim();
      const password = passInput.value;

      if (!email || !password) {
        showAdminAlert('कृपया एडमिन आईडी एवं पासवर्ड दोनों दर्ज करें।', 'error');
        return;
      }

      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin mr-2"></i> सत्यापन जारी है...';
      }

      try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const loggedUser = userCredential.user;

        const isAdmin = await verifyAdminRole(loggedUser);
        if (!isAdmin) {
          // Immediately sign out unauthorized user
          await signOut(auth);
          localStorage.removeItem('bhaskar_admin_logged_in');
          showAdminAlert('अनाधिकृत प्रवेश! आपके पास एडमिन अधिकार नहीं हैं।', 'error');
          return;
        }

        showAdminAlert('सत्यापन सफल! एडमिन पैनल खुल रहा है...', 'success');
      } catch (error) {
        console.error('Admin Auth Error:', error);
        showAdminAlert(getAdminHindiErrorMessage(error.code), 'error');
      } finally {
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.innerHTML = '<i class="fa-solid fa-shield-halved"></i> एडमिन लॉगिन करें';
        }
      }
    });
  }


  // Logout
  if (logoutBtn) {
    logoutBtn.addEventListener('click', async () => {
      if (confirm('क्या आप एडमिन पैनल से लॉगआउट करना चाहते हैं?')) {
        try {
          await signOut(auth);
          localStorage.removeItem('bhaskar_admin_logged_in');
          showAdminAlert('आप सफलतापूर्वक लॉगआउट हो चुके हैं।', 'info');
        } catch (error) {
          console.error('Logout error:', error);
        }
      }
    });
  }
}

function initAdminFirebaseListener() {
  const loginView = document.getElementById('adminLoginView');
  const setupView = document.getElementById('adminSetupView');
  const dashboardView = document.getElementById('adminDashboardView');
  const adminActiveBadge = document.getElementById('adminCurrentEmailBadge');

  if (setupView) setupView.style.display = 'none';

  onAuthStateChanged(auth, async (user) => {
    if (user) {
      // Keep dashboard strictly hidden while verifying
      if (dashboardView) dashboardView.style.display = 'none';

      // Check if user is an authorized admin via Firestore
      const isAdmin = await verifyAdminRole(user);

      if (!isAdmin) {
        // Keep student session intact in Firebase! Do NOT signOut(auth)!
        localStorage.removeItem('bhaskar_admin_logged_in');
        sessionStorage.removeItem('bhaskar_portal_mode');
        if (loginView) loginView.style.display = 'block';
        if (setupView) setupView.style.display = 'none';
        if (dashboardView) dashboardView.style.display = 'none';
        const studentIdentifier = user.displayName || user.email || 'विद्यार्थी';
        showAdminAlert(`आप वर्तमान में विद्यार्थी खाते (${studentIdentifier}) से लॉगिन हैं। एडमिन पैनल खोलने हेतु कृपया अधिकृत एडमिन ईमेल से लॉगिन करें।`, 'info');
        return;
      }

      // ONLY reveal dashboard AFTER verification is 100% successful
      localStorage.setItem('bhaskar_admin_logged_in', 'true');
      sessionStorage.setItem('bhaskar_portal_mode', 'admin');
      if (loginView) loginView.style.display = 'none';
      if (setupView) setupView.style.display = 'none';
      if (dashboardView) dashboardView.style.display = 'block';

      if (adminActiveBadge) {
        adminActiveBadge.innerText = 'प्रशासक (Admin)';
      }

      // Initialize Realtime Students Management
      initStudentsManagement();
    } else {
      // Admin is signed out
      localStorage.removeItem('bhaskar_admin_logged_in');
      sessionStorage.removeItem('bhaskar_portal_mode');
      if (unsubscribeStudents) {
        unsubscribeStudents();
        unsubscribeStudents = null;
      }
      if (loginView) loginView.style.display = 'block';
      if (setupView) setupView.style.display = 'none';
      if (dashboardView) dashboardView.style.display = 'none';
    }
  });
}

/**
 * Real-time Firestore Student Management for Admin
 */
let unsubscribeStudents = null;
let unsubscribeInquiries = null;
let studentsListCache = [];

function initStudentsManagement() {
  const refreshBtn = document.getElementById('adminRefreshStudentsBtn');
  if (refreshBtn) {
    refreshBtn.onclick = () => loadStudentsRealtime();
  }

  // Bind admin tabs in admin.html
  document.querySelectorAll('[data-admin-tab]').forEach(btn => {
    btn.onclick = () => {
      const targetId = btn.getAttribute('data-admin-tab');
      document.querySelectorAll('#adminDashboardView .tab-panel').forEach(p => p.classList.remove('active'));
      document.querySelectorAll('[data-admin-tab]').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const panel = document.getElementById(targetId);
      if (panel) panel.classList.add('active');
    };
  });

  // Modal Form Submission
  const manageModalForm = document.getElementById('adminManageStudentForm');
  if (manageModalForm) {
    manageModalForm.onsubmit = handleSaveStudentFromModal;
  }

  loadStudentsRealtime();
  loadInquiriesRealtime();
}

function loadStudentsRealtime() {
  const tableBody = document.getElementById('adminStudentsTableBody');
  const countBadge = document.getElementById('adminFirestoreStudentsCount');

  try {
    const studentsCol = collection(db, "students");

    if (unsubscribeStudents) unsubscribeStudents();

    unsubscribeStudents = onSnapshot(studentsCol, (snapshot) => {
      studentsListCache = [];
      snapshot.forEach(doc => {
        studentsListCache.push({ id: doc.id, ...doc.data() });
      });

      if (countBadge) {
        countBadge.innerText = studentsListCache.length;
      }

      renderStudentsTable(studentsListCache);
    }, (error) => {
      console.error("Students snapshot error:", error);
      if (tableBody) {
        tableBody.innerHTML = `
          <tr>
            <td colspan="6" style="text-align: center; color: #dc2626; padding: 1.5rem;">
              <i class="fa-solid fa-circle-exclamation mr-1"></i> Firestore से छात्रों का डेटा लोड करने में त्रुटि आई: ${error.message}
            </td>
          </tr>
        `;
      }
    });
  } catch (err) {
    console.error("Error setting up students listener:", err);
  }
}

// Real-time listener for Firestore inquiries (Website leads)
function loadInquiriesRealtime() {
  const inquiryTbody = document.getElementById('adminInquiryTableBody');
  const countBadge = document.getElementById('adminInquiryCount');

  try {
    const inquiriesCol = collection(db, "inquiries");
    if (unsubscribeInquiries) unsubscribeInquiries();

    unsubscribeInquiries = onSnapshot(inquiriesCol, (snapshot) => {
      const inquiriesList = [];
      snapshot.forEach(doc => {
        inquiriesList.push({ id: doc.id, ...doc.data() });
      });

      // Sort newest first
      inquiriesList.sort((a, b) => {
        const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return timeB - timeA;
      });

      if (countBadge) {
        countBadge.innerText = inquiriesList.length;
      }

      if (inquiryTbody) {
        if (inquiriesList.length === 0) {
          inquiryTbody.innerHTML = `
            <tr>
              <td colspan="6" style="text-align: center; padding: 2rem; color: var(--color-text-muted);">
                वर्तमान में कोई नई पूछताछ नहीं है।
              </td>
            </tr>
          `;
          return;
        }

        inquiryTbody.innerHTML = inquiriesList.map(lead => {
          const dateStr = lead.date || (lead.createdAt ? new Date(lead.createdAt).toLocaleDateString('hi-IN') : 'आज');
          const cleanPhone = (lead.phone || '').replace(/\D/g, '');
          return `
            <tr>
              <td>
                <div style="font-weight: 700; color: var(--color-primary);">${lead.name || 'अज्ञात'}</div>
                ${lead.message ? `<div style="font-size: 0.75rem; color: #64748b;">"${lead.message}"</div>` : ''}
              </td>
              <td>
                <strong style="color: #334155;">${lead.phone || '--'}</strong>
              </td>
              <td>
                <span style="font-size: 0.8rem; background: #FEF3C7; color: #92400E; padding: 2px 6px; border-radius: 4px; font-weight: 600;">
                  ${lead.course || 'सामान्य पूछताछ'}
                </span>
              </td>
              <td>${lead.city || 'बाड़मेर'}</td>
              <td>${dateStr}</td>
              <td style="text-align: right;">
                <a href="https://wa.me/91${cleanPhone}?text=नमस्ते%20${encodeURIComponent(lead.name || '')},%20भास्कर%20क्लासेज%20बाड़मेर%20से%20संपर्क%20कर%20रहे%20हैं।" target="_blank" class="btn btn-sm btn-outline" style="color: #16a34a; border-color: #bbf7d0;">
                  <i class="fa-brands fa-whatsapp"></i> चैट
                </a>
                <a href="tel:${cleanPhone}" class="btn btn-sm btn-outline" style="margin-left: 0.25rem;">
                  <i class="fa-solid fa-phone"></i> कॉल
                </a>
              </td>
            </tr>
          `;
        }).join('');
      }
    }, (err) => {
      console.warn("Inquiries snapshot note:", err.message);
    });
  } catch (e) {
    console.warn("Could not set up inquiries listener:", e);
  }
}

function renderStudentsTable(students) {
  const tableBody = document.getElementById('adminStudentsTableBody');
  if (!tableBody) return;

  if (!students || students.length === 0) {
    tableBody.innerHTML = `
      <tr>
        <td colspan="6" style="text-align: center; padding: 2.5rem; color: var(--color-text-muted);">
          <i class="fa-solid fa-user-clock" style="font-size: 2rem; margin-bottom: 0.5rem; display: block; color: #94A3B8;"></i>
          अभी तक कोई विद्यार्थी पंजीकृत नहीं हुआ है। जब छात्र रजिस्ट्रेशन करेंगे, वे यहाँ स्वतः दिखाई देंगे।
        </td>
      </tr>
    `;
    return;
  }

  tableBody.innerHTML = students.map((student) => {
    const uid = student.id || student.uid;
    const name = student.name || 'नाम दर्ज नहीं';
    const email = student.email || '--';
    const phone = student.phone || 'उपलब्ध नहीं';
    const goal = student.targetExam || '2nd Grade हिंदी';
    const hasEbooks = !!student.hasEbooksAccess;
    const hasTests = !!student.hasTestSeriesAccess;

    // Latest book order details
    const orders = Array.isArray(student.bookOrders) && student.bookOrders.length > 0 ? student.bookOrders : [];
    const latestOrder = orders.length > 0 ? orders[orders.length - 1] : {
      bookTitle: 'कोई पुस्तक नहीं',
      status: 'कोई ऑर्डर नहीं',
      trackingNo: ''
    };

    const isDelivered = latestOrder.status && (latestOrder.status.includes('डिस्पैच') || latestOrder.status.includes('डिलीवर'));
    const badgeBg = isDelivered ? '#DCFCE7' : (latestOrder.status === 'कोई ऑर्डर नहीं' ? '#F1F5F9' : '#FEF3C7');
    const badgeColor = isDelivered ? '#15803D' : (latestOrder.status === 'कोई ऑर्डर नहीं' ? '#64748B' : '#B45309');

    return `
      <tr id="row-student-${uid}">
        <td>
          <div style="font-weight: 700; color: var(--color-primary); font-size: 0.95rem;">${name}</div>
          <div style="font-size: 0.75rem; color: var(--color-text-muted); font-family: monospace;">${email}</div>
          <div style="font-size: 0.7rem; color: #64748B;">UID: <code>${uid.substring(0, 8)}</code></div>
        </td>
        <td>
          <div style="font-weight: 600; color: #334155; font-size: 0.85rem;"><i class="fa-solid fa-phone mr-1" style="color: var(--color-primary); font-size: 0.75rem;"></i> ${phone}</div>
          <span style="font-size: 0.72rem; color: #b45309; background: #fef3c7; padding: 0.15rem 0.4rem; border-radius: 4px; display: inline-block; margin-top: 0.2rem;">${goal}</span>
        </td>
        <td>
          <div style="font-weight: 600; color: #1e293b; font-size: 0.85rem;">${latestOrder.bookTitle || 'कोई पुस्तक नहीं'}</div>
          ${latestOrder.trackingNo ? `<div style="font-size: 0.72rem; color: #0284c7; font-family: monospace;">ट्रैकिंग: <strong>${latestOrder.trackingNo}</strong></div>` : ''}
        </td>
        <td>
          <span style="font-size: 0.78rem; font-weight: 700; background: ${badgeBg}; color: ${badgeColor}; padding: 0.2rem 0.6rem; border-radius: 4px; display: inline-block;">
            <i class="fa-solid ${isDelivered ? 'fa-check' : 'fa-clock'} mr-1"></i> ${latestOrder.status || 'कोई ऑर्डर नहीं'}
          </span>
        </td>
        <td>
          <div style="display: flex; flex-direction: column; gap: 4px;">
            <span style="font-size: 0.75rem; font-weight: 600; color: ${hasEbooks ? '#059669' : '#94A3B8'};">
              <i class="fa-solid ${hasEbooks ? 'fa-circle-check' : 'fa-circle-xmark'} mr-1"></i> ई-नोट्स: ${hasEbooks ? 'सक्रिय' : 'बंद'}
            </span>
            <span style="font-size: 0.75rem; font-weight: 600; color: ${hasTests ? '#059669' : '#94A3B8'};">
              <i class="fa-solid ${hasTests ? 'fa-circle-check' : 'fa-circle-xmark'} mr-1"></i> टेस्ट: ${hasTests ? 'सक्रिय' : 'बंद'}
            </span>
          </div>
        </td>
        <td style="text-align: right;">
          <button type="button" onclick="window.openManageStudentModal('${uid}')" class="btn btn-sm btn-primary" style="white-space: nowrap; font-size: 0.78rem; font-weight: 600;">
            <i class="fa-solid fa-pen-to-square mr-1"></i> पुस्तक व ई-बुक्स प्रबंधित करें
          </button>
        </td>
      </tr>
    `;
  }).join('');
}

// Global modal open helper
window.openManageStudentModal = function(uid) {
  const student = studentsListCache.find(s => (s.id || s.uid) === uid);
  if (!student) {
    alert('विद्यार्थी का डेटा नहीं मिला।');
    return;
  }

  const modal = document.getElementById('adminManageStudentModal');
  const uidBadge = document.getElementById('modalStudentUidBadge');
  const subTitle = document.getElementById('modalStudentSubTitle');
  const studentIdInput = document.getElementById('modalStudentId');
  const bookSelect = document.getElementById('modalBookSelect');
  const deliveryStatusSelect = document.getElementById('modalDeliveryStatus');
  const trackingInput = document.getElementById('modalTrackingNo');
  const addressInput = document.getElementById('modalDeliveryAddress');
  const ebooksToggle = document.getElementById('modalEbooksToggle');
  const testsToggle = document.getElementById('modalTestsToggle');

  if (!modal) return;

  studentIdInput.value = uid;
  uidBadge.innerText = `UID: ${uid.substring(0, 8).toUpperCase()}`;
  subTitle.innerText = `${student.name || 'विद्यार्थी'} • ${student.email || ''} • मोबाइल: ${student.phone || 'उपलब्ध नहीं'}`;

  // Populate orders
  const orders = Array.isArray(student.bookOrders) && student.bookOrders.length > 0 ? student.bookOrders : [];
  const latestOrder = orders.length > 0 ? orders[orders.length - 1] : {};

  // Book Selection
  if (bookSelect) {
    if (latestOrder.bookTitle) {
      // Find matching option or set value
      let matched = false;
      for (let opt of bookSelect.options) {
        if (opt.value.includes(latestOrder.bookTitle) || latestOrder.bookTitle.includes(opt.value)) {
          bookSelect.value = opt.value;
          matched = true;
          break;
        }
      }
      if (!matched) {
        bookSelect.value = latestOrder.bookTitle;
      }
    } else {
      bookSelect.value = 'कोई पुस्तक नहीं';
    }
  }

  // Delivery Status
  if (deliveryStatusSelect) {
    if (latestOrder.status) {
      let matched = false;
      for (let opt of deliveryStatusSelect.options) {
        if (opt.value.includes(latestOrder.status) || latestOrder.status.includes(opt.value)) {
          deliveryStatusSelect.value = opt.value;
          matched = true;
          break;
        }
      }
      if (!matched) {
        deliveryStatusSelect.value = 'ऑर्डर प्राप्त (Pending)';
      }
    } else {
      deliveryStatusSelect.value = 'कोई ऑर्डर नहीं';
    }
  }

  if (trackingInput) trackingInput.value = latestOrder.trackingNo || '';
  if (addressInput) addressInput.value = latestOrder.address || student.deliveryAddress || student.city || '';
  if (ebooksToggle) ebooksToggle.checked = !!student.hasEbooksAccess;
  if (testsToggle) testsToggle.checked = !!student.hasTestSeriesAccess;

  modal.style.display = 'block';
  document.body.style.overflow = 'hidden';
};

window.closeManageStudentModal = function() {
  const modal = document.getElementById('adminManageStudentModal');
  if (modal) modal.style.display = 'none';
  document.body.style.overflow = '';
};

// Handle form submit from modal
async function handleSaveStudentFromModal(e) {
  e.preventDefault();
  const uid = document.getElementById('modalStudentId').value;
  const bookSelect = document.getElementById('modalBookSelect');
  const deliveryStatusSelect = document.getElementById('modalDeliveryStatus');
  const trackingInput = document.getElementById('modalTrackingNo');
  const addressInput = document.getElementById('modalDeliveryAddress');
  const ebooksToggle = document.getElementById('modalEbooksToggle');
  const testsToggle = document.getElementById('modalTestsToggle');
  const saveBtn = document.getElementById('modalSaveStudentBtn');

  if (!uid) return;

  const originalBtnHtml = saveBtn.innerHTML;
  saveBtn.disabled = true;
  saveBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin mr-1"></i> Firestore में सहेजा जा रहा है...';

  try {
    const selectedBook = bookSelect ? bookSelect.value : 'कोई पुस्तक नहीं';
    const selectedStatus = deliveryStatusSelect ? deliveryStatusSelect.value : 'कोई ऑर्डर नहीं';
    const trackingNo = trackingInput ? trackingInput.value.trim() : '';
    const deliveryAddress = addressInput ? addressInput.value.trim() : '';
    const hasEbooksAccess = ebooksToggle ? ebooksToggle.checked : false;
    const hasTestSeriesAccess = testsToggle ? testsToggle.checked : false;

    const studentRef = doc(db, "students", uid);
    const studentSnap = await getDoc(studentRef);

    let bookOrders = [];
    if (studentSnap.exists() && Array.isArray(studentSnap.data().bookOrders)) {
      bookOrders = [...studentSnap.data().bookOrders];
    }

    if (selectedBook !== 'कोई पुस्तक नहीं' || selectedStatus !== 'कोई ऑर्डर नहीं' || trackingNo) {
      const orderEntry = {
        orderId: 'BK-' + uid.substring(0, 4).toUpperCase() + '-' + Math.floor(100 + Math.random() * 900),
        bookTitle: selectedBook !== 'कोई पुस्तक नहीं' ? selectedBook : 'मंदार पब्लिकेशन हिंदी पुस्तक',
        status: selectedStatus !== 'कोई ऑर्डर नहीं' ? selectedStatus : 'ऑर्डर प्राप्त',
        trackingNo: trackingNo,
        address: deliveryAddress,
        updatedAt: new Date().toISOString()
      };

      if (bookOrders.length === 0) {
        bookOrders.push(orderEntry);
      } else {
        // Update the active order
        bookOrders[bookOrders.length - 1] = {
          ...bookOrders[bookOrders.length - 1],
          ...orderEntry
        };
      }
    }

    const updatePayload = {
      hasEbooksAccess,
      hasTestSeriesAccess,
      bookOrders,
      deliveryAddress,
      lastAdminUpdate: new Date().toISOString()
    };

    await updateDoc(studentRef, updatePayload);

    alert('विद्यार्थी का डेटा एवं अनुमतियां Firestore में सफलतापूर्वक अपडेट हो गईं!');
    window.closeManageStudentModal();

  } catch (error) {
    console.error("Error updating student via modal:", error);
    alert('त्रुटि आई: ' + error.message);
  } finally {
    saveBtn.disabled = false;
    saveBtn.innerHTML = originalBtnHtml;
  }
}

