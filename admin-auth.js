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
        // Immediate rejection & sign out
        await signOut(auth);
        localStorage.removeItem('bhaskar_admin_logged_in');
        if (loginView) loginView.style.display = 'block';
        if (setupView) setupView.style.display = 'none';
        if (dashboardView) dashboardView.style.display = 'none';
        showAdminAlert('अनाधिकृत प्रवेश! केवल अधिकृत एडमिन ही लॉगिन कर सकते हैं।', 'error');
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

  loadStudentsRealtime();
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
            <td colspan="7" style="text-align: center; color: #dc2626; padding: 1.5rem;">
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

function renderStudentsTable(students) {
  const tableBody = document.getElementById('adminStudentsTableBody');
  if (!tableBody) return;

  if (!students || students.length === 0) {
    tableBody.innerHTML = `
      <tr>
        <td colspan="7" style="text-align: center; padding: 2.5rem; color: var(--color-text-muted);">
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
    const date = student.createdAt ? new Date(student.createdAt).toLocaleDateString('hi-IN') : '--';
    const hasEbooks = !!student.hasEbooksAccess;
    const hasTests = !!student.hasTestSeriesAccess;

    // Latest book order details
    const orders = Array.isArray(student.bookOrders) && student.bookOrders.length > 0 ? student.bookOrders : [];
    const latestOrder = orders.length > 0 ? orders[0] : {
      orderId: 'BK-' + uid.substring(0, 4).toUpperCase(),
      bookTitle: 'राजस्थान राजनीतिक व्यवस्था / हिंदी साहित्य',
      status: 'ऑर्डर प्राप्त',
      trackingNo: '',
      address: student.deliveryAddress || student.city || 'बाड़मेर'
    };

    return `
      <tr id="row-student-${uid}">
        <td>
          <div style="font-weight: 700; color: var(--color-primary); font-size: 0.95rem;">${name}</div>
          <div style="font-size: 0.75rem; color: var(--color-text-muted); font-family: monospace;">${email}</div>
          <div style="font-size: 0.7rem; color: #64748B;">पंजीयन: ${date}</div>
        </td>
        <td>
          <div style="font-weight: 600; color: #334155; font-size: 0.85rem;"><i class="fa-solid fa-phone mr-1" style="color: var(--color-primary); font-size: 0.75rem;"></i> ${phone}</div>
          <span style="font-size: 0.72rem; color: #b45309; background: #fef3c7; padding: 0.15rem 0.4rem; border-radius: 4px; display: inline-block; margin-top: 0.2rem;">${goal}</span>
        </td>
        <td>
          <label style="display: inline-flex; align-items: center; gap: 6px; cursor: pointer;">
            <input type="checkbox" id="ebooks-${uid}" ${hasEbooks ? 'checked' : ''} style="width: 18px; height: 18px; accent-color: #10B981; cursor: pointer;">
            <span style="font-size: 0.8rem; font-weight: 600; color: ${hasEbooks ? '#059669' : '#94A3B8'};">${hasEbooks ? 'एक्सेस चालू' : 'बंद'}</span>
          </label>
        </td>
        <td>
          <label style="display: inline-flex; align-items: center; gap: 6px; cursor: pointer;">
            <input type="checkbox" id="tests-${uid}" ${hasTests ? 'checked' : ''} style="width: 18px; height: 18px; accent-color: #10B981; cursor: pointer;">
            <span style="font-size: 0.8rem; font-weight: 600; color: ${hasTests ? '#059669' : '#94A3B8'};">${hasTests ? 'एक्सेस चालू' : 'बंद'}</span>
          </label>
        </td>
        <td>
          <select id="delivery-status-${uid}" class="form-control" style="font-size: 0.78rem; padding: 4px 8px; height: auto;">
            <option value="कोई ऑर्डर नहीं" ${latestOrder.status === 'कोई ऑर्डर नहीं' ? 'selected' : ''}>कोई ऑर्डर नहीं</option>
            <option value="ऑर्डर प्राप्त (Pending)" ${latestOrder.status && latestOrder.status.includes('प्राप्त') ? 'selected' : ''}>ऑर्डर प्राप्त</option>
            <option value="पैकिंग प्रक्रिया में" ${latestOrder.status && latestOrder.status.includes('पैकिंग') ? 'selected' : ''}>पैकिंग प्रक्रिया में</option>
            <option value="स्पीड पोस्ट डिस्पैच पूर्ण" ${latestOrder.status && latestOrder.status.includes('डिस्पैच') ? 'selected' : ''}>स्पीड पोस्ट डिस्पैच पूर्ण</option>
            <option value="डिलीवर हो गया (Delivered)" ${latestOrder.status && latestOrder.status.includes('डिलीवर') ? 'selected' : ''}>डिलीवर हो गया</option>
          </select>
        </td>
        <td>
          <input type="text" id="tracking-${uid}" class="form-control" placeholder="उदा: RJ94287751IN" value="${latestOrder.trackingNo || ''}" style="font-size: 0.78rem; padding: 4px 8px; font-family: monospace; min-width: 120px;">
        </td>
        <td style="text-align: right;">
          <button type="button" onclick="window.saveStudentAdminChanges('${uid}')" class="btn btn-sm btn-primary" id="btn-save-${uid}" style="white-space: nowrap; font-size: 0.75rem;">
            <i class="fa-solid fa-floppy-disk mr-1"></i> अपडेट करें
          </button>
        </td>
      </tr>
    `;
  }).join('');
}

// Global update function callable from table action buttons
window.saveStudentAdminChanges = async function(uid) {
  const btn = document.getElementById(`btn-save-${uid}`);
  const ebooksCheckbox = document.getElementById(`ebooks-${uid}`);
  const testsCheckbox = document.getElementById(`tests-${uid}`);
  const statusSelect = document.getElementById(`delivery-status-${uid}`);
  const trackingInput = document.getElementById(`tracking-${uid}`);

  if (!btn) return;

  const originalHtml = btn.innerHTML;
  btn.disabled = true;
  btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i>';

  try {
    const hasEbooksAccess = ebooksCheckbox ? ebooksCheckbox.checked : false;
    const hasTestSeriesAccess = testsCheckbox ? testsCheckbox.checked : false;
    const deliveryStatus = statusSelect ? statusSelect.value : 'कोई ऑर्डर नहीं';
    const trackingNo = trackingInput ? trackingInput.value.trim() : '';

    const studentRef = doc(db, "students", uid);
    const studentSnap = await getDoc(studentRef);

    let bookOrders = [];
    if (studentSnap.exists() && Array.isArray(studentSnap.data().bookOrders)) {
      bookOrders = [...studentSnap.data().bookOrders];
    }

    if (deliveryStatus !== 'कोई ऑर्डर नहीं') {
      if (bookOrders.length === 0) {
        bookOrders.push({
          orderId: 'BK-' + uid.substring(0, 4).toUpperCase(),
          bookTitle: 'मंदार पब्लिकेशन हिंदी पुस्तक',
          status: deliveryStatus,
          trackingNo: trackingNo,
          updatedAt: new Date().toISOString()
        });
      } else {
        bookOrders[0].status = deliveryStatus;
        bookOrders[0].trackingNo = trackingNo;
        bookOrders[0].updatedAt = new Date().toISOString();
      }
    }

    await updateDoc(studentRef, {
      hasEbooksAccess,
      hasTestSeriesAccess,
      bookOrders,
      lastAdminUpdate: new Date().toISOString()
    });

    btn.style.backgroundColor = '#10B981';
    btn.innerHTML = '<i class="fa-solid fa-check"></i> अपडेट सफल!';
    setTimeout(() => {
      btn.style.backgroundColor = '';
      btn.innerHTML = originalHtml;
      btn.disabled = false;
    }, 2000);

  } catch (error) {
    console.error("Error updating student permissions:", error);
    alert('अपडेट करने में त्रुटि आई: ' + error.message);
    btn.disabled = false;
    btn.innerHTML = originalHtml;
  }
};
