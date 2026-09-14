/**
 * Bhaskar Classes Barmer - Student Unified Portal (Auth + Dashboard) Module
 */
import { 
  auth, 
  db,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  googleProvider,
  onSnapshot,
  onAuthStateChanged,
  signInWithPopup, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  sendPasswordResetEmail, 
  signOut,
  updateProfile 
} from "./firebase-config.js";

document.addEventListener('DOMContentLoaded', () => {
  initAuthUI();
  initDashboardTabs();
  initLogoutHandler();
  initProfileForm();
  initDashboardAuthListener();
});

// ================= AUTH UI & HELPERS =================
function showAlert(message, type = 'error') {
  const alertBox = document.getElementById('authAlertBox');
  if (!alertBox) return;

  alertBox.style.display = 'block';
  if (type === 'error') {
    alertBox.style.backgroundColor = '#FEE2E2';
    alertBox.style.color = '#B91C1C';
    alertBox.style.border = '1px solid #F87171';
    alertBox.innerHTML = '<i class="fa-solid fa-circle-exclamation mr-1"></i> ' + message;
  } else if (type === 'success') {
    alertBox.style.backgroundColor = '#DCFCE7';
    alertBox.style.color = '#15803D';
    alertBox.style.border = '1px solid #86EFAC';
    alertBox.innerHTML = '<i class="fa-solid fa-circle-check mr-1"></i> ' + message;
  } else {
    alertBox.style.backgroundColor = '#E0F2FE';
    alertBox.style.color = '#0284C7';
    alertBox.style.border = '1px solid #7DD3FC';
    alertBox.innerHTML = '<i class="fa-solid fa-circle-info mr-1"></i> ' + message;
  }
}

function hideAlert() {
  const alertBox = document.getElementById('authAlertBox');
  if (alertBox) alertBox.style.display = 'none';
}

function getHindiErrorMessage(errorCode) {
  switch (errorCode) {
    case 'auth/invalid-email':
      return 'कृपया एक मान्य ईमेल पता दर्ज करें।';
    case 'auth/user-disabled':
      return 'यह खाता अक्षम कर दिया गया है। सहायता हेतु हेल्पलाइन पर संपर्क करें।';
    case 'auth/user-not-found':
      return 'इस ईमेल से कोई खाता पंजीकृत नहीं है। कृपया नया रजिस्ट्रेशन करें।';
    case 'auth/wrong-password':
    case 'auth/invalid-credential':
      return 'अमान्य ईमेल या पासवर्ड। कृपया पुनः जांच कर प्रयास करें।';
    case 'auth/email-already-in-use':
      return 'यह ईमेल पहले से पंजीकृत है। कृपया लॉगिन करें या दूसरा ईमेल चुनें।';
    case 'auth/weak-password':
      return 'पासवर्ड कमजोर है। कृपया कम से कम 6 अक्षरों का सुरक्षित पासवर्ड दर्ज करें।';
    case 'auth/popup-closed-by-user':
      return 'Google लॉगिन पॉपअप बंद कर दिया गया। पुनः प्रयास करें।';
    case 'auth/cancelled-popup-request':
      return 'लॉगिन अनुरोध रद्द कर दिया गया।';
    case 'auth/popup-blocked':
      return 'ब्राउज़र ने लॉगिन पॉपअप को ब्लॉक कर दिया। कृपया पॉपअप की अनुमति दें।';
    case 'auth/unauthorized-domain':
      return 'यह डोमेन Firebase Authentication के लिए अधिकृत नहीं है।';
    case 'auth/network-request-failed':
      return 'नेटवर्क त्रुटि। कृपया अपना इंटरनेट कनेक्शन जांचें।';
    case 'auth/too-many-requests':
      return 'बहुत अधिक असफल प्रयास। कृपया थोड़ी देर बाद प्रयास करें।';
    default:
      return 'प्रमाणीकरण में त्रुटि आई। कृपया पुनः प्रयास करें। (' + errorCode + ')';
  }
}

function initAuthUI() {
  const tabBtnLogin = document.getElementById('tabBtnLogin');
  const tabBtnRegister = document.getElementById('tabBtnRegister');
  const emailLoginForm = document.getElementById('emailLoginForm');
  const emailRegisterForm = document.getElementById('emailRegisterForm');
  const googleSignInBtn = document.getElementById('googleSignInBtn');
  const forgotPasswordBtn = document.getElementById('forgotPasswordBtn');

  // Tab Switching (Login vs Register)
  if (tabBtnLogin && tabBtnRegister) {
    tabBtnLogin.addEventListener('click', () => {
      hideAlert();
      tabBtnLogin.style.background = '#FFFFFF';
      tabBtnLogin.style.color = '#1E2B58';
      tabBtnLogin.style.boxShadow = '0 1px 3px rgba(0,0,0,0.08)';

      tabBtnRegister.style.background = 'transparent';
      tabBtnRegister.style.color = '#64748B';
      tabBtnRegister.style.boxShadow = 'none';

      if (emailLoginForm) emailLoginForm.style.display = 'block';
      if (emailRegisterForm) emailRegisterForm.style.display = 'none';
    });

    tabBtnRegister.addEventListener('click', () => {
      hideAlert();
      tabBtnRegister.style.background = '#FFFFFF';
      tabBtnRegister.style.color = '#1E2B58';
      tabBtnRegister.style.boxShadow = '0 1px 3px rgba(0,0,0,0.08)';

      tabBtnLogin.style.background = 'transparent';
      tabBtnLogin.style.color = '#64748B';
      tabBtnLogin.style.boxShadow = 'none';

      if (emailLoginForm) emailLoginForm.style.display = 'none';
      if (emailRegisterForm) emailRegisterForm.style.display = 'block';
    });
  }

  // Password Visibility Toggles
  document.querySelectorAll('.toggle-pass-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const targetId = btn.getAttribute('data-target');
      const input = document.getElementById(targetId);
      if (!input) return;
      if (input.type === 'password') {
        input.type = 'text';
        btn.innerHTML = '<i class="fa-solid fa-eye-slash"></i>';
      } else {
        input.type = 'password';
        btn.innerHTML = '<i class="fa-solid fa-eye"></i>';
      }
    });
  });

  // 1. Google Sign-In
  if (googleSignInBtn) {
    googleSignInBtn.addEventListener('click', async () => {
      hideAlert();
      const originalText = googleSignInBtn.innerHTML;
      googleSignInBtn.disabled = true;
      googleSignInBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin mr-2"></i> Google से कनेक्ट हो रहा है...';

      try {
        const userCredential = await signInWithPopup(auth, googleProvider);
        const user = userCredential.user;

        // Check/Create student document in Firestore
        const studentRef = doc(db, "students", user.uid);
        const studentSnap = await getDoc(studentRef);

        if (!studentSnap.exists()) {
          await setDoc(studentRef, {
            uid: user.uid,
            name: user.displayName || 'विद्यार्थी',
            email: user.email,
            phone: user.phoneNumber || '',
            targetExam: 'RPSC वरिष्ठ अध्यापक (2nd Grade) हिंदी',
            hasTestSeriesAccess: false,
            hasEbooksAccess: false,
            bookOrders: [],
            createdAt: new Date().toISOString()
          });
        }
        // onAuthStateChanged will seamlessly switch view to dashboard!
      } catch (error) {
        console.error('Google Sign-In Error:', error);
        showAlert(getHindiErrorMessage(error.code), 'error');
        googleSignInBtn.disabled = false;
        googleSignInBtn.innerHTML = originalText;
      }
    });
  }

  // 2. Email Sign-In
  if (emailLoginForm) {
    emailLoginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      hideAlert();

      const emailInput = document.getElementById('loginEmail');
      const passInput = document.getElementById('loginPassword');
      const submitBtn = document.getElementById('emailLoginSubmitBtn');

      if (!emailInput || !passInput) return;
      const email = emailInput.value.trim();
      const password = passInput.value;

      submitBtn.disabled = true;
      submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin mr-2"></i> लॉगिन हो रहा है...';

      try {
        await signInWithEmailAndPassword(auth, email, password);
        // onAuthStateChanged will seamlessly switch view to dashboard!
      } catch (error) {
        console.error('Email Sign-In Error:', error);
        showAlert(getHindiErrorMessage(error.code), 'error');
        submitBtn.disabled = false;
        submitBtn.innerHTML = '<span>लॉगिन करें</span> <i class="fa-solid fa-arrow-right"></i>';
      }
    });
  }

  // 3. Email Registration
  if (emailRegisterForm) {
    emailRegisterForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      hideAlert();

      const nameInput = document.getElementById('regName');
      const emailInput = document.getElementById('regEmail');
      const phoneInput = document.getElementById('regPhone');
      const passInput = document.getElementById('regPassword');
      const submitBtn = document.getElementById('emailRegisterSubmitBtn');

      if (!emailInput || !passInput) return;
      const name = nameInput ? nameInput.value.trim() : 'विद्यार्थी';
      const email = emailInput.value.trim();
      const phone = phoneInput ? phoneInput.value.trim() : '';
      const password = passInput.value;

      if (password.length < 6) {
        showAlert('पासवर्ड कम से कम 6 अक्षरों का होना चाहिए।', 'error');
        return;
      }

      submitBtn.disabled = true;
      submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin mr-2"></i> खाता बनाया जा रहा है...';

      try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        if (name && user) {
          await updateProfile(user, { displayName: name });
        }

        const studentRef = doc(db, "students", user.uid);
        await setDoc(studentRef, {
          uid: user.uid,
          name: name,
          email: email,
          phone: phone,
          hasTestSeriesAccess: false,
          hasEbooksAccess: false,
          bookOrders: [],
          createdAt: new Date().toISOString()
        });
        // onAuthStateChanged will seamlessly switch view to dashboard!
      } catch (error) {
        console.error('Registration Error:', error);
        showAlert(getHindiErrorMessage(error.code), 'error');
        submitBtn.disabled = false;
        submitBtn.innerHTML = '<span>खाता बनाएं एवं लॉगिन करें</span> <i class="fa-solid fa-user-plus"></i>';
      }
    });
  }

  // 4. Forgot Password
  if (forgotPasswordBtn) {
    forgotPasswordBtn.addEventListener('click', async () => {
      const emailInput = document.getElementById('loginEmail');
      let email = emailInput ? emailInput.value.trim() : '';

      if (!email) {
        email = prompt('कृपया अपना पंजीकृत ईमेल आईडी दर्ज करें (पासवर्ड रीसेट लिंक हेतु):');
        if (!email) return;
        email = email.trim();
      }

      try {
        await sendPasswordResetEmail(auth, email);
        showAlert('पासवर्ड रीसेट लिंक "' + email + '" पर भेज दिया गया है। कृपया अपना इनबॉक्स / स्पैम फोल्डर देखें।', 'success');
      } catch (error) {
        console.error('Reset Password Error:', error);
        showAlert(getHindiErrorMessage(error.code), 'error');
      }
    });
  }
}

// 1. Dashboard Tab Switching
function initDashboardTabs() {
  document.querySelectorAll('[data-student-tab]').forEach(btn => {
    btn.addEventListener('click', () => {
      const targetId = btn.getAttribute('data-student-tab');
      document.querySelectorAll('#studentDashboardView .tab-panel').forEach(panel => panel.classList.remove('active'));
      document.querySelectorAll('[data-student-tab]').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const targetPanel = document.getElementById(targetId);
      if (targetPanel) targetPanel.classList.add('active');
    });
  });
}

// 2. Top Header Logout Button (Instant Seamless Logout, Zero Redirect Loop)
function initLogoutHandler() {
  const logoutBtn = document.getElementById('studentHeaderLogoutBtn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', async () => {
      try {
        logoutBtn.disabled = true;
        logoutBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin mr-1"></i> लॉगआउट...';
        if (unsubscribeStudentDoc) {
          unsubscribeStudentDoc();
          unsubscribeStudentDoc = null;
        }
        await signOut(auth);
        try {
          localStorage.removeItem('bhaskar_student_session');
        } catch (e) {}
        // onAuthStateChanged will smoothly switch view to login form!
      } catch (error) {
        console.error('Logout error:', error);
        alert('लॉगआउट में समस्या आई: ' + error.message);
      } finally {
        logoutBtn.disabled = false;
        logoutBtn.innerHTML = '<i class="fa-solid fa-right-from-bracket"></i> लॉगआउट';
      }
    });
  }
}

// 3. Profile Form Save
function initProfileForm() {
  const profileForm = document.getElementById('studentProfileForm');
  if (profileForm) {
    profileForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const user = auth.currentUser;
      if (!user) return;

      const saveBtn = document.getElementById('saveProfileBtn');
      const nameInput = document.getElementById('profName');
      const phoneInput = document.getElementById('profPhone');

      const newName = nameInput ? nameInput.value.trim() : '';
      const newPhone = phoneInput ? phoneInput.value.trim() : '';

      if (saveBtn) {
        saveBtn.disabled = true;
        saveBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin mr-1"></i> सुरक्षित हो रहा है...';
      }

      try {
        if (newName && user.displayName !== newName) {
          await updateProfile(user, { displayName: newName });
        }

        const studentRef = doc(db, "students", user.uid);
        await updateDoc(studentRef, {
          name: newName,
          phone: newPhone,
          updatedAt: new Date().toISOString()
        });

        alert('आपकी प्रोफ़ाइल Firestore में सफलतापूर्वक सुरक्षित हो गई!');
      } catch (error) {
        console.error('Profile update error:', error);
        alert('प्रोफ़ाइल अपडेट में त्रुटि आई: ' + error.message);
      } finally {
        if (saveBtn) {
          saveBtn.disabled = false;
          saveBtn.innerHTML = '<i class="fa-solid fa-floppy-disk mr-1"></i> प्रोफ़ाइल विवरण सुरक्षित करें';
        }
      }
    });
  }
}

// 4. Pending Book Order Notification & Execution
let orderHandled = false;
function handlePendingBookOrderExecution(user) {
  if (orderHandled) return;
  
  let orderData = null;

  // Check URL parameters first (?action=order&book=...&price=...)
  try {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('action') === 'order' || urlParams.get('book')) {
      orderData = {
        book: urlParams.get('book') || 'मंदार पब्लिकेशन पुस्तक',
        price: urlParams.get('price') || ''
      };
      // Clean URL without refresh
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  } catch (e) {}

  if (!orderData) {
    try {
      const raw = sessionStorage.getItem('pending_book_order') || localStorage.getItem('pending_book_order');
      if (raw) orderData = JSON.parse(raw);
    } catch (e) {}
  }

  if (!orderData) return;
  orderHandled = true;

  try {
    sessionStorage.removeItem('pending_book_order');
    localStorage.removeItem('pending_book_order');
  } catch (e) {}

  const studentName = user.displayName || (user.email ? user.email.split('@')[0] : 'विद्यार्थी');
  const studentEmail = user.email || '';
  const studentPhone = user.phoneNumber || '';
  const bookName = orderData.book || 'मंदार पब्लिकेशन पुस्तक';
  const bookPrice = orderData.price ? '₹' + orderData.price : '';

  const waText = encodeURIComponent(
    'नमस्ते भास्कर क्लासेज,\n' +
    'मैं पंजीकृत विद्यार्थी हूँ: ' + studentName + '\n' +
    (studentPhone ? 'मोबाइल: ' + studentPhone + '\n' : '') +
    'ईमेल: ' + studentEmail + '\n' +
    'पुस्तक: ' + bookName + (bookPrice ? ' (' + bookPrice + ')' : '') + '\n' +
    'कृपया मेरा पुस्तक ऑर्डर स्वीकार करें एवं डिलीवरी प्रक्रिया बताएं।'
  );
  const waUrl = 'https://wa.me/918949287751?text=' + waText;

  const bannerContainer = document.getElementById('orderSuccessBannerContainer');
  if (bannerContainer) {
    bannerContainer.style.display = 'block';
    bannerContainer.innerHTML = `
      <div id="orderSuccessBannerCard" style="background: linear-gradient(135deg, #15803d 0%, #166534 100%); color: #ffffff; border-radius: 12px; padding: 1.25rem 1.5rem; box-shadow: 0 4px 15px rgba(21,128,61,0.25); text-align: center; margin-bottom: 1rem; position: relative; transition: all 0.3s ease;">
        <button type="button" id="dismissOrderBannerBtn" aria-label="हटाएं" style="position: absolute; top: 10px; right: 12px; background: rgba(0,0,0,0.2); border: none; color: #ffffff; width: 28px; height: 28px; border-radius: 50%; display: flex; align-items: center; justify-content: center; cursor: pointer; font-size: 0.875rem;">
          <i class="fa-solid fa-xmark"></i>
        </button>
        <div style="font-size: 1.15rem; font-weight: 800; margin-bottom: 0.35rem; display: flex; align-items: center; justify-content: center; gap: 8px;">
          <i class="fa-solid fa-circle-check" style="color: #4ade80;"></i> खाता प्रमाणित! आपका पुस्तक ऑर्डर तैयार है
        </div>
        <p style="font-size: 0.875rem; color: #dcfce7; margin-bottom: 1rem; line-height: 1.4;">
          <strong>${bookName} ${bookPrice ? '(' + bookPrice + ')' : ''}</strong> का ऑर्डर अपने विद्यार्थी विवरण के साथ व्हाट्सएप पर भेजने हेतु नीचे क्लिक करें:
        </p>
        <a id="orderWhatsAppActionBtn" href="${waUrl}" target="_blank" class="btn" style="background-color: #25D366; color: #ffffff; font-weight: 800; font-size: 1rem; padding: 10px 24px; border-radius: 8px; display: inline-flex; align-items: center; gap: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.25); text-decoration: none;">
          <i class="fa-brands fa-whatsapp" style="font-size: 1.35rem;"></i> व्हाट्सएप पर ऑर्डर भेजें (8949287751) &rarr;
        </a>
      </div>
    `;

    // Remove banner on clicking the whatsapp order button
    const waBtn = document.getElementById('orderWhatsAppActionBtn');
    if (waBtn) {
      waBtn.addEventListener('click', () => {
        bannerContainer.style.display = 'none';
        bannerContainer.innerHTML = '';
      });
    }

    // Remove banner on clicking the close (x) button
    const closeBtn = document.getElementById('dismissOrderBannerBtn');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => {
        bannerContainer.style.display = 'none';
        bannerContainer.innerHTML = '';
      });
    }
  }

  try {
    window.open(waUrl, '_blank');
  } catch (err) {
    console.warn('Auto window.open notice:', err);
  }
}

// 5. Auth State Listener
let unsubscribeStudentDoc = null;

function initDashboardAuthListener() {
  onAuthStateChanged(auth, async (user) => {
    const loadingEl = document.getElementById('studentAuthLoading');
    const loginView = document.getElementById('studentLoginView');
    const dashboardView = document.getElementById('studentDashboardView');
    const logoutBtn = document.getElementById('studentHeaderLogoutBtn');
    const adminBanner = document.getElementById('adminModeBanner');

    // Hide loader immediately once Firebase has resolved auth state
    if (loadingEl) loadingEl.style.display = 'none';

    if (!user) {
      // User is not logged in -> Show login view seamlessly
      if (unsubscribeStudentDoc) {
        unsubscribeStudentDoc();
        unsubscribeStudentDoc = null;
      }
      try {
        localStorage.removeItem('bhaskar_student_session');
      } catch (e) {}

      if (logoutBtn) logoutBtn.style.display = 'none';
      if (adminBanner) adminBanner.style.display = 'none';
      if (dashboardView) dashboardView.style.display = 'none';
      if (loginView) loginView.style.display = 'block';
      return;
    }

    // User is logged in! -> Show dashboard view seamlessly
    try {
      localStorage.setItem('bhaskar_student_session', JSON.stringify({
        uid: user.uid,
        email: user.email || '',
        name: user.displayName || (user.email ? user.email.split('@')[0] : 'विद्यार्थी'),
        phone: user.phoneNumber || ''
      }));
    } catch (e) {}

    if (loginView) loginView.style.display = 'none';
    if (dashboardView) dashboardView.style.display = 'block';
    if (logoutBtn) logoutBtn.style.display = 'inline-flex';

    // Check if user is an authorized admin -> Show admin banner inside student view (NO auto-redirect)
    try {
      const adminDocRef = doc(db, "admins", user.uid);
      const adminDocSnap = await getDoc(adminDocRef);
      if (adminDocSnap.exists() && adminBanner) {
        adminBanner.style.display = 'flex';
      } else if (adminBanner) {
        adminBanner.style.display = 'none';
      }
    } catch (e) {
      if (adminBanner) adminBanner.style.display = 'none';
    }

    // Execute pending order if any
    handlePendingBookOrderExecution(user);

    // Initial render
    renderStudentDashboard(user, {
      name: user.displayName || user.email.split('@')[0],
      email: user.email,
      phone: user.phoneNumber || '',
      targetExam: 'RPSC वरिष्ठ अध्यापक (2nd Grade) हिंदी',
      hasTestSeriesAccess: false,
      hasEbooksAccess: false,
      bookOrders: []
    });

    // Real-time Firestore document listener
    try {
      const studentRef = doc(db, "students", user.uid);
      const studentSnap = await getDoc(studentRef);

      if (studentSnap.exists()) {
        renderStudentDashboard(user, studentSnap.data());
      }

      if (unsubscribeStudentDoc) unsubscribeStudentDoc();
      unsubscribeStudentDoc = onSnapshot(studentRef, (docSnap) => {
        if (!docSnap.exists()) return;
        renderStudentDashboard(user, docSnap.data());
      });
    } catch (err) {
      console.warn('Firestore snapshot error:', err);
    }
  });
}

// 6. Render Dashboard Data
function renderStudentDashboard(user, data) {
  const displayName = data.name || user.displayName || user.email.split('@')[0];
  const email = data.email || user.email || '';
  const phone = data.phone || '';
  const targetExam = data.targetExam || 'RPSC 2nd Grade हिंदी';

  // Header Elements
  const welcomeEl = document.getElementById('studentWelcomeName');
  const initialEl = document.getElementById('studentAvatarInitial');
  const phoneEl = document.getElementById('studentDisplayPhone');
  const idEl = document.getElementById('studentDisplayId');

  if (welcomeEl) welcomeEl.innerText = displayName;
  if (phoneEl) {
    phoneEl.innerHTML = `<i class="fa-solid fa-envelope mr-1"></i> ${email} ${phone ? '• <i class="fa-solid fa-phone ml-1"></i> ' + phone : ''}`;
  }
  if (idEl) idEl.innerHTML = '';

  // Avatar: Strictly text initial, NO image!
  if (initialEl) {
    initialEl.innerHTML = '';
    initialEl.innerText = displayName.charAt(0).toUpperCase();
  }

  // Profile form inputs
  const profName = document.getElementById('profName');
  const profPhone = document.getElementById('profPhone');

  if (profName && !profName.matches(':focus')) profName.value = displayName;
  if (profPhone && !profPhone.matches(':focus')) profPhone.value = phone;

  // Tab 1: Books & Delivery Tracking
  const booksContainer = document.getElementById('studentBooksContainer');
  const orders = Array.isArray(data.bookOrders) ? data.bookOrders : [];

  if (booksContainer) {
    if (orders.length === 0) {
      booksContainer.innerHTML = `
        <div style="background-color: var(--color-bg-alt); border: 1px dashed var(--color-border); border-radius: var(--radius-card); padding: 2rem; text-align: center;">
          <i class="fa-solid fa-box-open" style="font-size: 2.5rem; color: #94A3B8; margin-bottom: 0.75rem;"></i>
          <h4 style="font-size: 1rem; font-weight: 700; color: var(--color-primary);">वर्तमान में कोई पुस्तक ऑर्डर दर्ज नहीं है</h4>
          <a href="books.html" class="btn btn-primary btn-sm" style="margin-top: 1rem;">
            <i class="fa-solid fa-book"></i> पुस्तकें देखें
          </a>
        </div>
      `;
    } else {
      booksContainer.innerHTML = orders.map((order, idx) => {
        const isDelivered = order.status && (order.status.includes('डिस्पैच') || order.status.includes('डिलीवर'));
        const badgeBg = isDelivered ? 'var(--color-success-light)' : '#fff7ed';
        const badgeColor = isDelivered ? 'var(--color-success)' : 'var(--color-accent)';
        return `
          <div style="background-color: var(--color-bg-alt); border: 1px solid var(--color-border); border-radius: var(--radius-card); padding: 1.25rem;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem; flex-wrap: wrap; gap: 0.5rem;">
              <span style="font-size: 0.8125rem; font-weight: 700; color: var(--color-primary);">ऑर्डर आईडी: #${order.orderId || ('BK-' + (1000 + idx))}</span>
              <span style="font-size: 0.6875rem; font-weight: 700; color: ${badgeColor}; background-color: ${badgeBg}; padding: 0.25rem 0.65rem; border-radius: 4px;">
                <i class="fa-solid fa-truck-fast mr-1"></i> ${order.status || 'ऑर्डर प्राप्त'}
              </span>
            </div>
            <h3 style="font-size: 1.05rem; font-weight: 800; color: var(--color-primary);">${order.bookTitle || 'मंदार पब्लिकेशन हिंदी पुस्तक'}</h3>
            <p style="font-size: 0.8125rem; color: var(--color-text-muted); margin-top: 0.25rem;">
              डिलीवरी प्रकार: भारतीय डाक स्पीड पोस्ट
            </p>
            <div style="margin-top: 0.75rem; padding-top: 0.75rem; border-top: 1px solid var(--color-border); font-size: 0.8rem; color: #334155; display: flex; justify-content: space-between; flex-wrap: wrap; gap: 0.5rem;">
              <span>डाक ट्रैकिंग नंबर: <strong style="font-family: monospace; color: var(--color-primary); background: #e0f2fe; padding: 2px 6px; border-radius: 4px;">${order.trackingNo || 'प्रतीक्षारत (Pending)'}</strong></span>
              <span>डिलीवरी पता: <strong>${order.address || 'उपलब्ध नहीं'}</strong></span>
            </div>
          </div>
        `;
      }).join('');
    }
  }

  // Tab 2: E-Books View
  const ebooksLocked = document.getElementById('ebooksLockedBanner');
  const ebooksUnlocked = document.getElementById('ebooksUnlockedContent');
  const ebooksBadge = document.getElementById('ebooksAccessBadge');

  if (data.hasEbooksAccess) {
    if (ebooksLocked) ebooksLocked.style.display = 'none';
    if (ebooksUnlocked) ebooksUnlocked.style.display = 'flex';
    if (ebooksBadge) ebooksBadge.innerHTML = '<span style="background: var(--color-success-light); color: var(--color-success); font-size: 0.75rem; font-weight: 700; padding: 0.25rem 0.65rem; border-radius: 4px;"><i class="fa-solid fa-circle-check mr-1"></i> एडमिन द्वारा स्वीकृत</span>';
  } else {
    if (ebooksLocked) ebooksLocked.style.display = 'block';
    if (ebooksUnlocked) ebooksUnlocked.style.display = 'none';
    if (ebooksBadge) ebooksBadge.innerHTML = '';
  }
}
