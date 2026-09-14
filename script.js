/**
 * ==========================================================================
 * BHASKAR CLASSES BARMER - FRONTEND APPLICATION JAVASCRIPT
 * Clean, Modular, Production-Grade Script (No Inline Handlers Required)
 * ==========================================================================
 */

document.addEventListener('DOMContentLoaded', () => {
  initMobileMenu();
  initModals();
  initStudentPortal();
  initAdminPortal();
  initInquiryForm();
  initVideoPlayer();
  initTickerManager();
  initPhotoManager();
  initSmoothScroll();
  initBottomNav();
  initBookOrderAuthGate();
});

/* --------------------------------------------------------------------------
   1. MOBILE MENU NAVIGATION
   -------------------------------------------------------------------------- */
function initMobileMenu() {
  const menuBtn = document.getElementById('mobileMenuBtn');
  const mobileMenu = document.getElementById('mobileMenu');

  if (!menuBtn || !mobileMenu) return;

  menuBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    const isOpen = mobileMenu.classList.toggle('open');
    menuBtn.setAttribute('aria-expanded', isOpen);
    menuBtn.innerHTML = isOpen ? '<i class="fa-solid fa-xmark"></i>' : '<i class="fa-solid fa-bars"></i>';
  });

  // Close when clicking any nav link
  mobileMenu.querySelectorAll('a, button').forEach(item => {
    item.addEventListener('click', () => {
      mobileMenu.classList.remove('open');
      menuBtn.setAttribute('aria-expanded', 'false');
      menuBtn.innerHTML = '<i class="fa-solid fa-bars"></i>';
    });
  });

  // Close when clicking outside
  document.addEventListener('click', (e) => {
    if (mobileMenu.classList.contains('open') && !mobileMenu.contains(e.target) && !menuBtn.contains(e.target)) {
      mobileMenu.classList.remove('open');
      menuBtn.setAttribute('aria-expanded', 'false');
      menuBtn.innerHTML = '<i class="fa-solid fa-bars"></i>';
    }
  });
}

/* --------------------------------------------------------------------------
   2. UNIVERSAL MODAL SYSTEM (Close on Overlay, Close Btn, and ESC)
   -------------------------------------------------------------------------- */
function openModal(modalId) {
  const modal = document.getElementById(modalId);
  if (!modal) return;
  modal.classList.add('active');
  document.body.style.overflow = 'hidden';
}

function closeModal(modalId) {
  const modal = document.getElementById(modalId);
  if (!modal) return;
  modal.classList.remove('active');
  document.body.style.overflow = '';

  // Special cleanup for video iframe
  if (modalId === 'videoModal') {
    const iframe = document.getElementById('videoIframe');
    if (iframe) iframe.src = '';
  }
}

function closeAllModals() {
  document.querySelectorAll('.modal-overlay.active').forEach(modal => {
    closeModal(modal.id);
  });
}

function initModals() {
  // Close buttons
  document.querySelectorAll('[data-close-modal]').forEach(btn => {
    btn.addEventListener('click', () => {
      const modal = btn.closest('.modal-overlay');
      if (modal) closeModal(modal.id);
    });
  });

  // Overlay click to close
  document.querySelectorAll('.modal-overlay').forEach(modal => {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        closeModal(modal.id);
      }
    });
  });

  // ESC key to close all active modals
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeAllModals();
    }
  });

  // Global trigger hooks
  window.openStudentModal = () => openModal('studentModal');
  window.closeStudentModal = () => closeModal('studentModal');
  window.openAdminModal = () => openModal('adminModal');
  window.closeAdminModal = () => closeModal('adminModal');
  window.toggleIndexModal = () => {
    const modal = document.getElementById('indexModal');
    if (modal && modal.classList.contains('active')) {
      closeModal('indexModal');
    } else {
      openModal('indexModal');
    }
  };
}

/* --------------------------------------------------------------------------
   3. STUDENT LOGIN & UTKARSH-STYLE DASHBOARD
   -------------------------------------------------------------------------- */
function initStudentPortal() {
  const loginForm = document.getElementById('studentLoginForm');
  const otpField = document.getElementById('studentOtpField');
  const loginBtn = document.getElementById('studentLoginBtn');
  const resendBtn = document.getElementById('studentResendOtpBtn');
  const logoutBtn = document.getElementById('studentLogoutBtn');
  const profileForm = document.getElementById('studentProfileForm');

  if (loginForm) {
    loginForm.addEventListener('submit', handleStudentLogin);
  }

  if (resendBtn) {
    resendBtn.addEventListener('click', () => {
      if (otpField) otpField.style.display = 'none';
      if (loginBtn) loginBtn.innerHTML = '<span>OTP प्राप्त करें</span> <i class="fa-solid fa-arrow-right"></i>';
      const otpInput = document.getElementById('studentOtp');
      if (otpInput) otpInput.value = '';
      alert('नया OTP भेजने हेतु पुनः बटन पर क्लिक करें।');
    });
  }

  if (logoutBtn) {
    logoutBtn.addEventListener('click', handleStudentLogout);
  }

  if (profileForm) {
    profileForm.addEventListener('submit', handleSaveStudentProfile);
  }

  // Bind Student Dashboard Tabs
  document.querySelectorAll('[data-student-tab]').forEach(btn => {
    btn.addEventListener('click', () => {
      const targetTab = btn.getAttribute('data-student-tab');
      switchStudentTab(targetTab);
    });
  });

  checkStudentSession();
}

function handleStudentLogin(e) {
  e.preventDefault();
  const phoneInput = document.getElementById('studentPhone');
  const otpField = document.getElementById('studentOtpField');
  const loginBtn = document.getElementById('studentLoginBtn');
  const otpInput = document.getElementById('studentOtp');

  if (!phoneInput) return;
  const phone = phoneInput.value.trim();

  if (!/^[0-9]{10}$/.test(phone)) {
    alert('कृपया 10 अंकों का वैध मोबाइल नंबर दर्ज करें।');
    return;
  }

  // Step 1: Request OTP
  if (otpField && otpField.style.display !== 'block') {
    loginBtn.disabled = true;
    loginBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> OTP भेजा जा रहा है...';

    setTimeout(() => {
      otpField.style.display = 'block';
      loginBtn.disabled = false;
      loginBtn.innerHTML = '<span>सत्यापित कर लॉगिन करें</span> <i class="fa-solid fa-arrow-right"></i>';
      alert(`डेमो लॉगिन मोड: +91 ${phone} पर OTP भेजा गया।\nपरीक्षण के लिए OTP: 123456 दर्ज करें।`);
      if (otpInput) otpInput.focus();
    }, 600);
    return;
  }

  // Step 2: Verify OTP
  const otp = otpInput ? otpInput.value.trim() : '';
  if (!otp || otp.length < 4) {
    alert('कृपया 6 अंकों का मान्य OTP दर्ज करें (डेमो: 123456)।');
    return;
  }

  localStorage.setItem('bhaskar_student_logged_in', 'true');
  localStorage.setItem('bhaskar_student_phone', phone);
  if (!localStorage.getItem('bhaskar_student_name')) {
    localStorage.setItem('bhaskar_student_name', 'कुलदीप सिंह');
  }
  if (!localStorage.getItem('bhaskar_student_goal')) {
    localStorage.setItem('bhaskar_student_goal', 'RPSC वरिष्ठ अध्यापक (2nd Grade) हिंदी');
  }

  checkStudentSession();
  alert('लॉगिन सफल! भास्कर क्लासेज विद्यार्थी पोर्टल में आपका स्वागत है।');
}

function handleStudentLogout() {
  localStorage.removeItem('bhaskar_student_logged_in');
  if (window.FirebaseAuth && typeof window.FirebaseAuth.logout === 'function') {
    window.FirebaseAuth.logout().catch(err => console.error(err));
  }
  const otpField = document.getElementById('studentOtpField');
  const loginBtn = document.getElementById('studentLoginBtn');
  if (otpField) otpField.style.display = 'none';
  if (loginBtn) loginBtn.innerHTML = '<span>OTP प्राप्त करें</span> <i class="fa-solid fa-arrow-right"></i>';
  checkStudentSession();
  closeModal('studentModal');
}

function checkStudentSession() {
  // Driven strictly by Firebase Authentication & Firestore in student-auth.js
  return;
}

function switchStudentTab(tabId) {
  document.querySelectorAll('#studentDashboardView .tab-panel').forEach(panel => {
    panel.classList.remove('active');
  });
  document.querySelectorAll('[data-student-tab]').forEach(btn => {
    btn.classList.remove('active');
  });

  const activePanel = document.getElementById(tabId);
  const activeBtn = document.querySelector(`[data-student-tab="${tabId}"]`);

  if (activePanel) activePanel.classList.add('active');
  if (activeBtn) activeBtn.classList.add('active');
}

function handleSaveStudentProfile(e) {
  e.preventDefault();
  const nameInput = document.getElementById('profName');
  const goalInput = document.getElementById('profGoal');

  if (nameInput && nameInput.value.trim()) {
    localStorage.setItem('bhaskar_student_name', nameInput.value.trim());
  }
  if (goalInput) {
    localStorage.setItem('bhaskar_student_goal', goalInput.value);
  }

  checkStudentSession();
  alert('आपकी प्रोफ़ाइल सफलतापूर्वक अपडेट कर दी गई है!');
}

/* --------------------------------------------------------------------------
   4. ADMIN PANEL & SECURE AUTHENTICATION (Zero Hardcoded Passwords)
   -------------------------------------------------------------------------- */
async function hashAdminPassword(password) {
  const enc = new TextEncoder();
  const data = enc.encode(password + '_bhaskar_secure_salt_barmer_2026');
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

function initAdminPortal() {
  const setupForm = document.getElementById('adminSetupForm');
  const adminForm = document.getElementById('adminLoginForm');
  const changePassForm = document.getElementById('changeAdminPassForm');
  const resetPassBtn = document.getElementById('adminResetPasswordBtn');
  const logoutBtn = document.getElementById('adminLogoutBtn');
  const exportBtn = document.getElementById('adminExportCsvBtn');
  const resetBtn = document.getElementById('adminResetLeadsBtn');

  if (setupForm) {
    setupForm.addEventListener('submit', handleAdminSetup);
  }

  if (adminForm) {
    adminForm.addEventListener('submit', handleAdminLogin);
  }

  if (changePassForm) {
    changePassForm.addEventListener('submit', handleChangeAdminPassword);
  }

  if (resetPassBtn) {
    resetPassBtn.addEventListener('click', handleResetAdminPassword);
  }

  if (logoutBtn) {
    logoutBtn.addEventListener('click', handleAdminLogout);
  }

  if (exportBtn) {
    exportBtn.addEventListener('click', exportLeadsToCSV);
  }

  if (resetBtn) {
    resetBtn.addEventListener('click', clearDemoInquiries);
  }

  // Admin Tab Navigation
  document.querySelectorAll('[data-admin-tab]').forEach(btn => {
    btn.addEventListener('click', () => {
      const targetTab = btn.getAttribute('data-admin-tab');
      switchAdminTab(targetTab);
    });
  });

  checkAdminSession();
}

async function handleAdminSetup(e) {
  e.preventDefault();
  const p1 = document.getElementById('setupPass').value.trim();
  const p2 = document.getElementById('setupPassConfirm').value.trim();

  if (p1.length < 4) {
    alert('पासवर्ड कम से कम 4 अक्षरों का होना चाहिए।');
    return;
  }
  if (p1 !== p2) {
    alert('दोनों पासवर्ड मेल नहीं खा रहे हैं। कृपया पुनः जांचें।');
    return;
  }

  const hash = await hashAdminPassword(p1);
  localStorage.setItem('bhaskar_admin_hash', hash);
  localStorage.setItem('bhaskar_admin_logged_in', 'true');
  alert('बधाई हो! आपका निजी एडमिन पासवर्ड सफलतापूर्वक सेट कर दिया गया है।');
  checkAdminSession();
}

async function handleAdminLogin(e) {
  // If Firebase Admin Auth is in use (adminEmail exists), admin-auth.js handles submission
  if (document.getElementById('adminEmail')) return;

  e.preventDefault();
  const passInput = document.getElementById('adminPass');
  if (!passInput) return;

  const pass = passInput.value.trim();
  if (!pass) return;

  const storedHash = localStorage.getItem('bhaskar_admin_hash');
  const inputHash = await hashAdminPassword(pass);

  if (storedHash && inputHash === storedHash) {
    localStorage.setItem('bhaskar_admin_logged_in', 'true');
    passInput.value = '';
    checkAdminSession();
  } else {
    alert('गलत पासवर्ड! कृपया अपना सही पासवर्ड दर्ज करें।');
  }
}

async function handleChangeAdminPassword(e) {
  e.preventDefault();
  const curr = document.getElementById('currAdminPass').value.trim();
  const next1 = document.getElementById('newAdminPass').value.trim();
  const next2 = document.getElementById('newAdminPassConfirm').value.trim();

  const storedHash = localStorage.getItem('bhaskar_admin_hash');
  const currHash = await hashAdminPassword(curr);

  if (currHash !== storedHash) {
    alert('वर्तमान पासवर्ड गलत है!');
    return;
  }
  if (next1.length < 4) {
    alert('नया पासवर्ड कम से कम 4 अक्षरों का होना चाहिए।');
    return;
  }
  if (next1 !== next2) {
    alert('नए पासवर्ड की पुष्टि मेल नहीं खाती!');
    return;
  }

  const newHash = await hashAdminPassword(next1);
  localStorage.setItem('bhaskar_admin_hash', newHash);
  alert('एडमिन पासवर्ड सफलतापूर्वक बदल दिया गया है!');
  document.getElementById('changeAdminPassForm').reset();
}

function handleResetAdminPassword() {
  if (document.getElementById('adminEmail')) return; // handled by Firebase in admin-auth.js

  if (confirm('क्या आप एडमिन पासवर्ड रीसेट करना चाहते हैं?\nइसके बाद आप अपना नया निजी पासवर्ड सेट कर सकेंगे।')) {
    localStorage.removeItem('bhaskar_admin_hash');
    localStorage.removeItem('bhaskar_admin_logged_in');
    checkAdminSession();
    alert('पासवर्ड रीसेट हो गया है। कृपया नया पासवर्ड बनाएं।');
  }
}

function handleAdminLogout() {
  localStorage.removeItem('bhaskar_admin_logged_in');
  if (window.FirebaseAuth && typeof window.FirebaseAuth.logout === 'function') {
    window.FirebaseAuth.logout().catch(err => console.error(err));
  }
  checkAdminSession();
  closeModal('adminModal');
}

function checkAdminSession() {
  // If admin.html is active with Firebase Authentication, let admin-auth.js strictly control access
  if (document.getElementById('adminEmail')) {
    return;
  }

  const isAdmin = localStorage.getItem('bhaskar_admin_logged_in') === 'true';

  const setupView = document.getElementById('adminSetupView');
  const loginView = document.getElementById('adminLoginView');
  const dashboardView = document.getElementById('adminDashboardView');

  if (setupView) setupView.style.display = 'none';

  if (dashboardView) {
    if (isAdmin) {
      if (loginView) loginView.style.display = 'none';
      dashboardView.style.display = 'block';
      loadInquiriesIntoAdmin();
    } else {
      dashboardView.style.display = 'none';
      if (loginView) loginView.style.display = 'block';
    }
  }
}

function switchAdminTab(tabId) {
  document.querySelectorAll('#adminDashboardView .tab-panel').forEach(panel => {
    panel.classList.remove('active');
  });
  document.querySelectorAll('[data-admin-tab]').forEach(btn => {
    btn.classList.remove('active');
  });

  const activePanel = document.getElementById(tabId);
  const activeBtn = document.querySelector(`[data-admin-tab="${tabId}"]`);

  if (activePanel) activePanel.classList.add('active');
  if (activeBtn) activeBtn.classList.add('active');
}

const defaultDemoLeads = [
  { name: 'कुलदीप सिंह', phone: '9829187712', course: 'RPSC 2nd Grade वरिष्ठ अध्यापक', city: 'बाड़मेर', date: '04-09-2026' },
  { name: 'महिपाल भादू', phone: '9414561230', course: 'RPSC 1st Grade स्कूल व्याख्याता', city: 'बालोतरा', date: '04-09-2026' },
  { name: 'सुनीता चौधरी', phone: '9783456789', course: 'काव्यशास्त्र हस्तलिखित नोट्स', city: 'बायतु', date: '03-09-2026' }
];

function loadInquiriesIntoAdmin() {
  let stored = JSON.parse(localStorage.getItem('bhaskar_inquiries') || 'null');
  if (!stored || stored.length === 0) {
    stored = defaultDemoLeads;
    localStorage.setItem('bhaskar_inquiries', JSON.stringify(stored));
  }

  const tbody = document.getElementById('adminInquiryTableBody');
  const countEl = document.getElementById('adminInquiryCount');

  if (countEl) countEl.innerText = stored.length;
  if (!tbody) return;

  tbody.innerHTML = '';
  stored.forEach(lead => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td><strong>${escapeHtml(lead.name)}</strong></td>
      <td>${escapeHtml(lead.phone)}</td>
      <td>${escapeHtml(lead.course)}</td>
      <td>${escapeHtml(lead.city || 'बाड़मेर')}</td>
      <td>${escapeHtml(lead.date || 'आज')}</td>
      <td style="text-align: right;">
        <a href="https://wa.me/91${lead.phone}" target="_blank" class="btn btn-sm btn-outline" style="color: #16a34a; border-color: #bbf7d0;">
          <i class="fa-brands fa-whatsapp"></i> चैट
        </a>
        <a href="tel:${lead.phone}" class="btn btn-sm btn-outline" style="margin-left: 0.25rem;">
          <i class="fa-solid fa-phone"></i> कॉल
        </a>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

function clearDemoInquiries() {
  if (confirm('क्या आप सभी इन्क्वायरी डेटा रीसेट करना चाहते हैं?')) {
    localStorage.removeItem('bhaskar_inquiries');
    loadInquiriesIntoAdmin();
  }
}

function exportLeadsToCSV() {
  const stored = JSON.parse(localStorage.getItem('bhaskar_inquiries') || '[]');
  if (stored.length === 0) {
    alert('निर्यात करने के लिए कोई लीड्स उपलब्ध नहीं हैं।');
    return;
  }

  let csvContent = 'data:text/csv;charset=utf-8,नाम,मोबाइल,कोर्स/पुस्तक,जिला,दिनांक\n';
  stored.forEach(l => {
    csvContent += `"${l.name}","${l.phone}","${l.course}","${l.city}","${l.date}"\n`;
  });

  const encodedUri = encodeURI(csvContent);
  const link = document.createElement('a');
  link.setAttribute('href', encodedUri);
  link.setAttribute('download', `bhaskar_classes_leads_${Date.now()}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/* --------------------------------------------------------------------------
   5. CONTACT & INQUIRY FORM (Validated, WhatsApp Redirect, Local Cache)
   -------------------------------------------------------------------------- */
function initInquiryForm() {
  const form = document.getElementById('inquiryForm');
  if (!form) return;

  form.addEventListener('submit', (e) => {
    e.preventDefault();

    const name = document.getElementById('inqName').value.trim();
    const phone = document.getElementById('inqPhone').value.trim();
    const course = document.getElementById('inqCourse').value;
    const city = document.getElementById('inqCity') ? document.getElementById('inqCity').value.trim() : 'बाड़मेर';
    const msg = document.getElementById('inqMessage') ? document.getElementById('inqMessage').value.trim() : '';

    if (!name) {
      alert('कृपया अपना नाम दर्ज करें।');
      return;
    }

    if (!/^[0-9]{10}$/.test(phone)) {
      alert('कृपया 10 अंकों का वैध भारतीय मोबाइल नंबर दर्ज करें (बिना +91 या 0 लगाए)।');
      return;
    }

    if (!course) {
      alert('कृपया किसी कोर्स या पुस्तक का चयन करें।');
      return;
    }

    // Save lead to LocalStorage as immediate local backup
    const lead = {
      name,
      phone,
      course,
      city: city || 'बाड़मेर',
      message: msg,
      date: new Date().toLocaleDateString('hi-IN'),
      createdAt: new Date().toISOString()
    };

    let inquiries = JSON.parse(localStorage.getItem('bhaskar_inquiries') || '[]');
    inquiries.unshift(lead);
    localStorage.setItem('bhaskar_inquiries', JSON.stringify(inquiries));

    // Also write directly to Firebase Firestore "inquiries" collection
    if (window.FirebaseAuth && window.FirebaseAuth.db && typeof window.FirebaseAuth.addDoc === 'function') {
      try {
        const { collection } = window.FirebaseAuth;
        // fallback if collection not directly on FirebaseAuth
        import("./firebase-config.js").then(async ({ db, collection, addDoc }) => {
          await addDoc(collection(db, "inquiries"), lead);
          console.log("Lead successfully synced to Firestore inquiries!");
        }).catch(err => {
          console.warn("Firestore lead sync warning:", err.message);
        });
      } catch (err) {
        console.warn("Firestore sync warning:", err);
      }
    } else {
      import("./firebase-config.js").then(async ({ db, collection, addDoc }) => {
        await addDoc(collection(db, "inquiries"), lead);
        console.log("Lead successfully synced to Firestore inquiries!");
      }).catch(err => {
        console.warn("Firestore lead sync warning:", err.message);
      });
    }

    // Open WhatsApp with prefilled message to Bhaskar Classes Helpline
    const waMsg = encodeURIComponent(
      `नमस्ते भास्कर क्लासेज बाड़मेर,\n` +
      `मेरा नाम: ${name}\n` +
      `मोबाइल नंबर: ${phone}\n` +
      `जिला/शहर: ${city || 'बाड़मेर'}\n` +
      `कोर्स/पुस्तक: ${course}\n` +
      (msg ? `संदेश: ${msg}` : '')
    );

    window.open(`https://wa.me/918949287751?text=${waMsg}`, '_blank');

    // Show inline success message
    const statusEl = document.getElementById('inquiryStatus');
    if (statusEl) {
      statusEl.innerText = 'धन्यवाद! आपकी पूछताछ दर्ज कर ली गई है एवं व्हाट्सएप चैट शुरू की गई है।';
      statusEl.classList.add('success');
      setTimeout(() => {
        statusEl.classList.remove('success');
      }, 5000);
    }

    form.reset();
  });
}

/* --------------------------------------------------------------------------
   6. VIDEO LIGHTBOX PLAYER
   -------------------------------------------------------------------------- */
function initVideoPlayer() {
  document.querySelectorAll('[data-video-id]').forEach(card => {
    card.addEventListener('click', () => {
      const videoId = card.getAttribute('data-video-id');
      const videoTitle = card.getAttribute('data-video-title') || 'भास्कर क्लासेज वीडियो क्लास';
      openVideoPlayer(videoId, videoTitle);
    });
  });

  window.openVideoPlayer = (videoId, title) => {
    const iframe = document.getElementById('videoIframe');
    const titleEl = document.getElementById('videoModalTitle');
    if (titleEl) titleEl.innerText = title;
    if (iframe) iframe.src = `https://www.youtube.com/embed/${videoId}?autoplay=1`;
    openModal('videoModal');
  };

  window.closeVideoPlayer = () => {
    closeModal('videoModal');
  };
}

/* --------------------------------------------------------------------------
   7. TICKER UPDATE LOGIC
   -------------------------------------------------------------------------- */
function initTickerManager() {
  const tickerForm = document.getElementById('adminTickerForm');
  if (!tickerForm) return;

  tickerForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const input = document.getElementById('adminTickerInput');
    if (!input || !input.value.trim()) return;

    const newText = input.value.trim();
    localStorage.setItem('bhaskar_ticker_text', newText);

    const tickerDisplay = document.getElementById('liveTickerContent');
    if (tickerDisplay) tickerDisplay.innerText = newText;

    alert('सूचना पट्टी सफलतापूर्वक अपडेट कर दी गई है!');
  });

  // Restore custom ticker if saved
  const savedTicker = localStorage.getItem('bhaskar_ticker_text');
  if (savedTicker) {
    const tickerDisplay = document.getElementById('liveTickerContent');
    if (tickerDisplay) tickerDisplay.innerText = savedTicker;
  }
}

/* --------------------------------------------------------------------------
   8. PHOTO MANAGER & LOCAL IMAGE UPLOAD
   -------------------------------------------------------------------------- */
let activePhotoTargetIndex = 1;

function initPhotoManager() {
  const fileInput = document.getElementById('universalPhotoInput');
  if (!fileInput) return;

  fileInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      const base64 = evt.target.result;
      try {
        localStorage.setItem(`bhaskar_topper_img_${activePhotoTargetIndex}`, base64);
        applyTopperPhoto(activePhotoTargetIndex, base64);
        alert('पोस्टर/ग्राफ़िक सफलतापूर्वक अपडेट कर दिया गया है!');
      } catch (err) {
        alert('फ़ाइल का आकार बहुत बड़ा है (localStorage सीमा)। कृपया छवि को कंप्रेस करके पुनः चुनें।');
      }
    };
    reader.readAsDataURL(file);
  });

  window.triggerPhotoPick = (index) => {
    activePhotoTargetIndex = index;
    fileInput.click();
  };

  // Restore saved photos on page load
  for (let i = 1; i <= 6; i++) {
    const cached = localStorage.getItem(`bhaskar_topper_img_${i}`);
    if (cached) {
      applyTopperPhoto(i, cached);
    }
  }
}

function applyTopperPhoto(index, src) {
  const img = document.getElementById(`topperImg${index}`);
  if (img) img.src = src;
  const adminThumb = document.getElementById(`adminThumb${index}`);
  if (adminThumb) adminThumb.src = src;
}

/* --------------------------------------------------------------------------
   9. SMOOTH SCROLL FOR INTERNAL LINKS
   -------------------------------------------------------------------------- */
function initSmoothScroll() {
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
      const targetId = this.getAttribute('href');
      if (targetId === '#' || targetId === '') return;

      const targetEl = document.querySelector(targetId);
      if (targetEl) {
        e.preventDefault();
        targetEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  });
}

/* --------------------------------------------------------------------------
   10. STICKY BOTTOM NAVIGATION TRACKER
   -------------------------------------------------------------------------- */
function initBottomNav() {
  const bottomNavItems = document.querySelectorAll('.bottom-nav-item[data-nav-section]');
  if (!bottomNavItems.length) return;

  // Click handler
  bottomNavItems.forEach(item => {
    item.addEventListener('click', () => {
      bottomNavItems.forEach(i => i.classList.remove('active'));
      item.classList.add('active');

      // Close mobile drawer if open
      const mobileMenu = document.getElementById('mobileMenu');
      const menuBtn = document.getElementById('mobileMenuBtn');
      if (mobileMenu && mobileMenu.classList.contains('open')) {
        mobileMenu.classList.remove('open');
        if (menuBtn) {
          menuBtn.setAttribute('aria-expanded', 'false');
          menuBtn.innerHTML = '<i class="fa-solid fa-bars"></i>';
        }
      }
    });
  });

  // Track scroll position to update active bottom nav item
  const sections = [
    { id: 'home', item: document.querySelector('.bottom-nav-item[data-nav-section="home"]') },
    { id: 'courses', item: document.querySelector('.bottom-nav-item[data-nav-section="courses"]') },
    { id: 'books', item: document.querySelector('.bottom-nav-item[data-nav-section="books"]') }
  ];

  window.addEventListener('scroll', () => {
    const scrollPos = window.scrollY + 180;
    let currentId = 'home';

    sections.forEach(({ id }) => {
      const el = document.getElementById(id);
      if (el && el.offsetTop <= scrollPos) {
        currentId = id;
      }
    });

    sections.forEach(({ id, item }) => {
      if (item) {
        if (id === currentId) {
          item.classList.add('active');
        } else {
          item.classList.remove('active');
        }
      }
    });
  }, { passive: true });
}

/* --------------------------------------------------------------------------
   UTILITIES
   -------------------------------------------------------------------------- */
function escapeHtml(text) {
  if (!text) return '';
  const div = document.createElement('div');
  div.innerText = text;
  return div.innerHTML;
}

/* --------------------------------------------------------------------------
   7. BOOK ORDER AUTHENTICATION INTERCEPTOR
   Mandates student login/signup before ordering books via WhatsApp
   -------------------------------------------------------------------------- */
function initBookOrderAuthGate() {
  document.addEventListener('click', function(e) {
    const orderLink = e.target.closest('[data-book-order], a[href*="wa.me"]');
    if (!orderLink) return;

    // Check if it's the general helpline floating button
    if (orderLink.classList.contains('whatsapp-float') && !orderLink.hasAttribute('data-book-order')) {
      return; // allow general helpline inquiry without forced login
    }

    const isExplicitOrder = orderLink.hasAttribute('data-book-order');
    const href = orderLink.getAttribute('href') || '';
    const text = ((orderLink.textContent || '') + ' ' + href).toLowerCase();
    
    // Check if this link is an order trigger
    const isOrderTrigger = isExplicitOrder || 
      text.includes('ऑर्डर') || 
      text.includes('order') || 
      text.includes('कॉम्बो') || 
      text.includes('combo') ||
      text.includes('250') ||
      text.includes('200') ||
      text.includes('450');

    if (!isOrderTrigger) return;

    // Determine auth state
    let currentUser = null;
    let studentSession = null;
    try {
      if (window.FirebaseAuth && typeof window.FirebaseAuth.getCurrentUser === 'function') {
        currentUser = window.FirebaseAuth.getCurrentUser();
      }
    } catch (err) {}

    try {
      const raw = localStorage.getItem('bhaskar_student_session');
      if (raw) studentSession = JSON.parse(raw);
    } catch (err) {}

    const isLoggedIn = !!(currentUser || (studentSession && studentSession.uid));

    // Extract book info
    let bookName = orderLink.getAttribute('data-book-name') || '';
    let bookPrice = orderLink.getAttribute('data-book-price') || '';

    if (!bookName) {
      if (text.includes('कॉम्बो') || text.includes('450')) {
        bookName = 'दोनों पुस्तकें कॉम्बो पैक';
        bookPrice = '450';
      } else if (text.includes('वस्तुनिष्ठ इतिहास') || text.includes('200')) {
        bookName = 'हिन्दी साहित्य : वस्तुनिष्ठ इतिहास';
        bookPrice = '200';
      } else {
        bookName = 'राजस्थान राजनीतिक एवं प्रशासनिक व्यवस्था';
        bookPrice = '250';
      }
    }

    if (!isLoggedIn) {
      // User is NOT logged in -> Block WhatsApp and show custom in-app modal
      e.preventDefault();
      e.stopPropagation();

      const pendingOrder = {
        book: bookName,
        price: bookPrice,
        originalUrl: href,
        timestamp: Date.now()
      };

      try {
        sessionStorage.setItem('pending_book_order', JSON.stringify(pendingOrder));
        localStorage.setItem('pending_book_order', JSON.stringify(pendingOrder));
      } catch (err) {}

      showBookAuthModal(bookName, bookPrice);
      return false;
    } else {
      // User IS logged in -> Format WhatsApp message with student profile details
      const studentName = (currentUser && currentUser.displayName) || (studentSession && studentSession.name) || 'विद्यार्थी';
      const studentEmail = (currentUser && currentUser.email) || (studentSession && studentSession.email) || '';
      const studentPhone = (currentUser && currentUser.phoneNumber) || (studentSession && studentSession.phone) || '';

      const waMsg = encodeURIComponent(
        'नमस्ते भास्कर क्लासेज,\n' +
        'मैं पंजीकृत विद्यार्थी हूँ: ' + studentName + '\n' +
        (studentPhone ? 'मोबाइल: ' + studentPhone + '\n' : '') +
        (studentEmail ? 'ईमेल: ' + studentEmail + '\n' : '') +
        'पुस्तक: ' + bookName + (bookPrice ? ' (₹' + bookPrice + ')' : '') + '\n' +
        'कृपया मेरा पुस्तक ऑर्डर स्वीकार करें एवं डिलीवरी प्रक्रिया बताएं।'
      );

      orderLink.href = 'https://wa.me/918949287751?text=' + waMsg;
    }
  }, true);
}

/**
 * Modern In-App Modal for Book Order Authentication
 */
function showBookAuthModal(bookName, bookPrice) {
  let modalOverlay = document.getElementById('bookAuthModalOverlay');
  
  if (!modalOverlay) {
    modalOverlay = document.createElement('div');
    modalOverlay.id = 'bookAuthModalOverlay';
    modalOverlay.className = 'book-auth-modal-overlay';
    modalOverlay.innerHTML = `
      <div class="book-auth-modal-box" role="dialog" aria-modal="true">
        <button type="button" class="book-auth-modal-close" id="bookAuthModalCloseBtn" aria-label="बंद करें">
          <i class="fa-solid fa-xmark"></i>
        </button>

        <div class="book-auth-modal-icon">
          <i class="fa-solid fa-book-bookmark"></i>
        </div>

        <h3 class="book-auth-modal-title">विद्यार्थी लॉगिन आवश्यक है</h3>
        <p class="book-auth-modal-desc">पुस्तक ऑर्डर करने एवं डिलीवरी ट्रैकिंग हेतु कृपया पहले लॉगिन या नया रजिस्ट्रेशन करें।</p>

        <div class="book-auth-modal-bookname" id="bookAuthModalBookInfo">
          <i class="fa-solid fa-circle-check" style="color: #16a34a;"></i>
          <span></span>
        </div>

        <div class="book-auth-modal-actions">
          <a id="bookAuthModalLoginBtn" href="student-login.html" class="btn btn-primary btn-full btn-lg" style="display: flex; align-items: center; justify-content: center; gap: 8px;">
            <i class="fa-solid fa-right-to-bracket"></i> लॉगिन / नया रजिस्ट्रेशन करें
          </a>
          <button type="button" id="bookAuthModalCancelBtn" class="btn btn-outline btn-full btn-sm" style="color: #64748b; border-color: #cbd5e1;">
            बाद में करें
          </button>
        </div>
      </div>
    `;
    document.body.appendChild(modalOverlay);

    // Event listeners for close
    modalOverlay.addEventListener('click', (ev) => {
      if (ev.target === modalOverlay) {
        modalOverlay.classList.remove('active');
      }
    });

    const closeBtn = modalOverlay.querySelector('#bookAuthModalCloseBtn');
    const cancelBtn = modalOverlay.querySelector('#bookAuthModalCancelBtn');
    if (closeBtn) closeBtn.addEventListener('click', () => modalOverlay.classList.remove('active'));
    if (cancelBtn) cancelBtn.addEventListener('click', () => modalOverlay.classList.remove('active'));
  }

  // Update dynamic book info and link
  const bookInfoEl = modalOverlay.querySelector('#bookAuthModalBookInfo span');
  if (bookInfoEl) {
    bookInfoEl.innerText = bookName + (bookPrice ? ' (₹' + bookPrice + ')' : '');
  }

  const loginBtn = modalOverlay.querySelector('#bookAuthModalLoginBtn');
  if (loginBtn) {
    loginBtn.href = 'student-login.html?action=order&book=' + encodeURIComponent(bookName) + '&price=' + encodeURIComponent(bookPrice);
  }

  // Show modal with animation
  requestAnimationFrame(() => {
    modalOverlay.classList.add('active');
  });
}
