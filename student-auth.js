/**
 * Bhaskar Classes Barmer - Student Firebase Authentication Module
 */
import { 
  auth, 
  db,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  onSnapshot,
  serverTimestamp,
  googleProvider, 
  onAuthStateChanged,
  signInWithPopup, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  sendPasswordResetEmail, 
  signOut,
  updateProfile 
} from "./firebase-config.js";

document.addEventListener('DOMContentLoaded', () => {
  checkPendingOrderPrompt();
  initAuthUI();
  initFirebaseListener();
});

// Check if user arrived via a book order button click
function checkPendingOrderPrompt() {
  const params = new URLSearchParams(window.location.search);
  const action = params.get('action');
  const bookParam = params.get('book');
  const priceParam = params.get('price');
  
  let orderData = null;
  try {
    const raw = sessionStorage.getItem('pending_book_order') || localStorage.getItem('pending_book_order');
    if (raw) orderData = JSON.parse(raw);
  } catch (e) {}

  if (action === 'order' || orderData) {
    const bookName = (orderData && orderData.book) || bookParam || 'मंदार पब्लिकेशन पुस्तक';
    const bookPrice = (orderData && orderData.price) || priceParam || '';
    
    const banner = document.getElementById('orderPromptBanner');
    const bookNameEl = document.getElementById('orderPromptBookName');
    if (banner) banner.style.display = 'block';
    if (bookNameEl) {
      bookNameEl.innerHTML = `चयनित पुस्तक: <strong>${bookName}</strong> ${bookPrice ? `(₹${bookPrice})` : ''}`;
    }
  }
}

// Global flag to prevent multiple order executions on reactive snapshots
let orderHandled = false;
function handlePendingBookOrderExecution(user) {
  if (orderHandled) return;
  
  let orderData = null;
  try {
    const raw = sessionStorage.getItem('pending_book_order') || localStorage.getItem('pending_book_order');
    if (raw) orderData = JSON.parse(raw);
  } catch (e) {}

  if (!orderData) return;
  orderHandled = true;

  // Clear storage
  try {
    sessionStorage.removeItem('pending_book_order');
    localStorage.removeItem('pending_book_order');
  } catch (e) {}

  const studentName = user.displayName || (user.email ? user.email.split('@')[0] : 'विद्यार्थी');
  const studentEmail = user.email || '';
  const studentPhone = user.phoneNumber || '';
  const bookName = orderData.book || 'मंदार पब्लिकेशन पुस्तक';
  const bookPrice = orderData.price ? `₹${orderData.price}` : '';

  const waText = encodeURIComponent(
    `नमस्ते भास्कर क्लासेज,\n` +
    `मैं पंजीकृत विद्यार्थी हूँ: ${studentName}\n` +
    (studentPhone ? `मोबाइल: ${studentPhone}\n` : '') +
    `ईमेल: ${studentEmail}\n` +
    `पुस्तक: ${bookName} ${bookPrice ? `(${bookPrice})` : ''}\n` +
    `कृपया मेरा पुस्तक ऑर्डर स्वीकार करें एवं डिलीवरी प्रक्रिया बताएं।`
  );
  const waUrl = `https://wa.me/918949287751?text=${waText}`;

  // 1. Display prominent action banner at top of student dashboard
  const bannerContainer = document.getElementById('orderSuccessBannerContainer');
  if (bannerContainer) {
    bannerContainer.style.display = 'block';
    bannerContainer.innerHTML = `
      <div style="background: linear-gradient(135deg, #15803d 0%, #166534 100%); color: #ffffff; border-radius: 12px; padding: 1.25rem 1.5rem; box-shadow: 0 4px 15px rgba(21,128,61,0.25); text-align: center; margin-bottom: 1rem;">
        <div style="font-size: 1.15rem; font-weight: 800; margin-bottom: 0.35rem; display: flex; align-items: center; justify-content: center; gap: 8px;">
          <i class="fa-solid fa-circle-check" style="color: #4ade80;"></i> खाता प्रमाणित! आपका पुस्तक ऑर्डर तैयार है
        </div>
        <p style="font-size: 0.875rem; color: #dcfce7; margin-bottom: 1rem; line-height: 1.4;">
          <strong>${bookName} ${bookPrice ? `(${bookPrice})` : ''}</strong> का ऑर्डर अपने विद्यार्थी विवरण के साथ व्हाट्सएप पर भेजने हेतु नीचे क्लिक करें:
        </p>
        <a href="${waUrl}" target="_blank" class="btn" style="background-color: #25D366; color: #ffffff; font-weight: 800; font-size: 1rem; padding: 10px 24px; border-radius: 8px; display: inline-flex; align-items: center; gap: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.25); text-decoration: none;">
          <i class="fa-brands fa-whatsapp" style="font-size: 1.35rem;"></i> व्हाट्सएप पर ऑर्डर भेजें (8949287751) &rarr;
        </a>
      </div>
    `;
  }

  // 2. Automatically try opening WhatsApp in a new tab
  try {
    window.open(waUrl, '_blank');
  } catch (err) {
    console.warn('Auto window.open notice:', err);
  }
}

function showAlert(message, type = 'error') {
  const alertBox = document.getElementById('authAlertBox');
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
      return 'यह डोमेन Firebase Authentication के लिए अधिकृत नहीं है। Firebase Console में localhost जोड़ें।';
    case 'auth/network-request-failed':
      return 'नेटवर्क त्रुटि। कृपया अपना इंटरनेट कनेक्शन जांचें।';
    case 'auth/too-many-requests':
      return 'बहुत अधिक असफल प्रयास। कृपया थोड़ी देर बाद प्रयास करें या पासवर्ड रीसेट करें।';
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
  const logoutBtn = document.getElementById('studentLogoutBtn');
  const topNavLogoutBtn = document.getElementById('topNavLogoutBtn');
  const profileForm = document.getElementById('studentProfileForm');

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

  // Student Dashboard Internal Tab Switching
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
            city: '',
            deliveryAddress: '',
            hasTestSeriesAccess: false,
            hasEbooksAccess: false,
            bookOrders: [],
            createdAt: new Date().toISOString()
          });
        }
        showAlert('Google लॉगिन सफल! विद्यार्थी पोर्टल में आपका स्वागत है।', 'success');
      } catch (error) {
        console.error('Google Sign-In Error:', error);
        showAlert(getHindiErrorMessage(error.code), 'error');
      } finally {
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
        showAlert('लॉगिन सफल! भास्कर क्लासेज पोर्टल में आपका स्वागत है।', 'success');
      } catch (error) {
        console.error('Email Sign-In Error:', error);
        showAlert(getHindiErrorMessage(error.code), 'error');
      } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = '<span>लॉगिन करें</span> <i class="fa-solid fa-arrow-right"></i>';
      }
    });
  }

  // 3. Email Registration (Creates Firestore Document)
  if (emailRegisterForm) {
    emailRegisterForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      hideAlert();

      const nameInput = document.getElementById('regName');
      const emailInput = document.getElementById('regEmail');
      const phoneInput = document.getElementById('regPhone');
      const passInput = document.getElementById('regPassword');
      const goalSelect = document.getElementById('regGoal');
      const submitBtn = document.getElementById('emailRegisterSubmitBtn');

      if (!emailInput || !passInput) return;
      const name = nameInput ? nameInput.value.trim() : 'विद्यार्थी';
      const email = emailInput.value.trim();
      const phone = phoneInput ? phoneInput.value.trim() : '';
      const password = passInput.value;
      const goal = goalSelect ? goalSelect.value : 'RPSC वरिष्ठ अध्यापक (2nd Grade) हिंदी';

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

        // Create persistent student profile in Firestore
        const studentRef = doc(db, "students", user.uid);
        await setDoc(studentRef, {
          uid: user.uid,
          name: name,
          email: email,
          phone: phone,
          targetExam: goal,
          city: '',
          deliveryAddress: '',
          hasTestSeriesAccess: false,
          hasEbooksAccess: false,
          bookOrders: [],
          createdAt: new Date().toISOString()
        });

        showAlert('खाता सफलतापूर्वक बन गया! पोर्टल में आपका स्वागत है।', 'success');
      } catch (error) {
        console.error('Registration Error:', error);
        showAlert(getHindiErrorMessage(error.code), 'error');
      } finally {
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
        showAlert(`पासवर्ड रीसेट लिंक "${email}" पर भेज दिया गया है। कृपया अपना इनबॉक्स / स्पैम फोल्डर देखें।`, 'success');
      } catch (error) {
        console.error('Reset Password Error:', error);
        showAlert(getHindiErrorMessage(error.code), 'error');
      }
    });
  }

  // 5. Logout
  const handleLogout = async () => {
      if (confirm('क्या आप निश्चित रूप से विद्यार्थी पोर्टल से लॉगआउट करना चाहते हैं?')) {
        try {
          if (unsubscribeStudentDoc) {
            unsubscribeStudentDoc();
            unsubscribeStudentDoc = null;
          }
          await signOut(auth);
          showAlert('आप सफलतापूर्वक लॉगआउट हो चुके हैं।', 'info');
        } catch (error) {
          console.error('Logout error:', error);
        }
      }
    };
    if (logoutBtn) logoutBtn.addEventListener('click', handleLogout);
    if (topNavLogoutBtn) topNavLogoutBtn.addEventListener('click', handleLogout);;
  }

  // 6. Profile Form Update (Saves directly to Firestore)
  if (profileForm) {
    profileForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const user = auth.currentUser;
      if (!user) return;

      const saveBtn = document.getElementById('saveProfileBtn');
      const nameInput = document.getElementById('profName');
      const phoneInput = document.getElementById('profPhone');
      const goalSelect = document.getElementById('profGoal');
      const cityInput = document.getElementById('profCity');
      const addressInput = document.getElementById('profAddress');

      const newName = nameInput ? nameInput.value.trim() : '';
      const newPhone = phoneInput ? phoneInput.value.trim() : '';
      const newGoal = goalSelect ? goalSelect.value : '';
      const newCity = cityInput ? cityInput.value.trim() : '';
      const newAddress = addressInput ? addressInput.value.trim() : '';

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
          targetExam: newGoal,
          city: newCity,
          deliveryAddress: newAddress,
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

// Global listener unsubscribe handle
let unsubscribeStudentDoc = null;

function initFirebaseListener() {
  const loginView = document.getElementById('studentLoginView');
  const dashboardView = document.getElementById('studentDashboardView');

  onAuthStateChanged(auth, async (user) => {
    if (user) {
      // 1. Block Admin account on student portal if admin session exists
      if (sessionStorage.getItem('bhaskar_portal_mode') === 'admin') {
        if (dashboardView) dashboardView.style.display = 'none';
        if (loginView) loginView.style.display = 'block';
        return;
      }

      // Check admin status asynchronously in background
      try {
        const adminDocRef = doc(db, "admins", user.uid);
        const adminDocSnap = await getDoc(adminDocRef);
        if (adminDocSnap.exists()) {
          if (dashboardView) dashboardView.style.display = 'none';
          if (loginView) loginView.style.display = 'block';
          showAlert('यह अधिकृत एडमिन खाता है। कृपया <a href="admin.html" style="color: #0284C7; font-weight: 700; text-decoration: underline;">एडमिन पोर्टल</a> पर जाएँ।', 'info');
          return;
        }
      } catch (e) {
        console.warn("Admin check note (can be ignored if student):", e.message);
      }

      // 2. Immediately switch view to Student Dashboard (no blocking!)
      if (loginView) loginView.style.display = 'none';
      if (dashboardView) dashboardView.style.display = 'block';

      // Check and execute pending book order if student was redirected from order button
      handlePendingBookOrderExecution(user);

      // Initial fast render using user auth profile
      renderStudentDashboard(user, {
        name: user.displayName || user.email.split('@')[0],
        email: user.email,
        phone: user.phoneNumber || '',
        targetExam: 'RPSC वरिष्ठ अध्यापक (2nd Grade) हिंदी',
        city: '',
        deliveryAddress: '',
        hasTestSeriesAccess: false,
        hasEbooksAccess: false,
        bookOrders: []
      });

      // 3. Fetch or initialize Student Firestore document
      try {
        const studentRef = doc(db, "students", user.uid);
        const studentSnap = await getDoc(studentRef);

        if (!studentSnap.exists()) {
          await setDoc(studentRef, {
            uid: user.uid,
            name: user.displayName || user.email.split('@')[0],
            email: user.email,
            phone: user.phoneNumber || '',
            targetExam: 'RPSC वरिष्ठ अध्यापक (2nd Grade) हिंदी',
            city: '',
            deliveryAddress: '',
            hasTestSeriesAccess: false,
            hasEbooksAccess: false,
            bookOrders: [],
            createdAt: new Date().toISOString()
          });
        }

        // 4. Setup real-time listener for student data
        if (unsubscribeStudentDoc) unsubscribeStudentDoc();

        unsubscribeStudentDoc = onSnapshot(studentRef, (docSnap) => {
          if (!docSnap.exists()) return;
          const data = docSnap.data();
          renderStudentDashboard(user, data);
        }, (err) => {
          console.warn("Student snapshot listener notice:", err.message);
        });

      } catch (firestoreErr) {
        console.warn("Firestore access notice:", firestoreErr.message);
      }

    } else {
      // User is signed out
      if (unsubscribeStudentDoc) {
        unsubscribeStudentDoc();
        unsubscribeStudentDoc = null;
      }
      if (loginView) loginView.style.display = 'block';
      if (dashboardView) dashboardView.style.display = 'none';
    }
  });
}

function renderStudentDashboard(user, data) {
  const displayName = data.name || user.displayName || user.email.split('@')[0];
  const email = data.email || user.email || '';
  const phone = data.phone || '';
  const targetExam = data.targetExam || 'RPSC 2nd Grade हिंदी';
  const photoURL = user.photoURL;
  const uid = user.uid;

  // Header Elements
  const welcomeEl = document.getElementById('studentWelcomeName');
  const initialEl = document.getElementById('studentAvatarInitial');
  const goalEl = document.getElementById('studentGoalDisplay');
  const phoneEl = document.getElementById('studentDisplayPhone');
  const idEl = document.getElementById('studentDisplayId');

  if (welcomeEl) welcomeEl.innerText = displayName;
  if (goalEl) goalEl.innerText = `🎯 लक्ष्य: ${targetExam}`;
  if (phoneEl) {
    phoneEl.innerHTML = `<i class="fa-solid fa-envelope mr-1"></i> ${email} ${phone ? '• <i class="fa-solid fa-phone ml-1"></i> ' + phone : ''}`;
  }
  if (idEl) {
    idEl.innerHTML = '';
  }

  if (initialEl) {
    initialEl.innerHTML = '';
    initialEl.innerText = displayName.charAt(0).toUpperCase();
  }
  }

  // Profile form inputs
  const profName = document.getElementById('profName');
  const profPhone = document.getElementById('profPhone');
  const profGoal = document.getElementById('profGoal');
  const profCity = document.getElementById('profCity');
  const profAddress = document.getElementById('profAddress');

  if (profName && !profName.matches(':focus')) profName.value = displayName;
  if (profPhone && !profPhone.matches(':focus')) profPhone.value = phone;
  if (profGoal && !profGoal.matches(':focus')) profGoal.value = targetExam;
  if (profCity && !profCity.matches(':focus')) profCity.value = data.city || '';
  if (profAddress && !profAddress.matches(':focus')) profAddress.value = data.deliveryAddress || '';

  // KPI Metrics Update
  const kpiOrdersCount = document.getElementById('kpiBookOrdersCount');
  const kpiDelivery = document.getElementById('kpiDeliveryStatus');
  const kpiEbooks = document.getElementById('kpiEbooksStatus');
  const kpiTests = document.getElementById('kpiTestSeriesStatus');

  const orders = Array.isArray(data.bookOrders) ? data.bookOrders : [];
  if (kpiOrdersCount) kpiOrdersCount.innerText = `${orders.length} पुस्तकें`;

  if (kpiDelivery) {
    if (orders.length > 0) {
      const latestOrder = orders[orders.length - 1];
      kpiDelivery.innerText = latestOrder.status || 'ऑर्डर प्राप्त';
      kpiDelivery.style.color = latestOrder.status && latestOrder.status.includes('पूर्ण') ? 'var(--color-success)' : 'var(--color-accent)';
    } else {
      kpiDelivery.innerText = 'कोई ऑर्डर नहीं';
      kpiDelivery.style.color = 'var(--color-text-muted)';
    }
  }

  if (kpiEbooks) {
    kpiEbooks.innerText = data.hasEbooksAccess ? 'सक्रिय (Unlocked)' : 'लॉक्ड (Locked)';
    kpiEbooks.style.color = data.hasEbooksAccess ? 'var(--color-success)' : '#dc2626';
  }

  if (kpiTests) {
    kpiTests.innerText = data.hasTestSeriesAccess ? 'सक्रिय (Unlocked)' : 'लॉक्ड (Locked)';
    kpiTests.style.color = data.hasTestSeriesAccess ? 'var(--color-success)' : '#dc2626';
  }

  // Tab 1: Books & Delivery Tracking
  const booksContainer = document.getElementById('studentBooksContainer');
  if (booksContainer) {
    if (orders.length === 0) {
      booksContainer.innerHTML = `
        <div style="background-color: var(--color-bg-alt); border: 1px dashed var(--color-border); border-radius: var(--radius-card); padding: 2rem; text-align: center;">
          <i class="fa-solid fa-box-open" style="font-size: 2.5rem; color: #94A3B8; margin-bottom: 0.75rem;"></i>
          <h4 style="font-size: 1rem; font-weight: 700; color: var(--color-primary);">वर्तमान में कोई पुस्तक ऑर्डर दर्ज नहीं है</h4>
          <p style="font-size: 0.8125rem; color: var(--color-text-muted); margin-top: 0.25rem;">
            जब आप मंदार पब्लिकेशन की पुस्तकें ऑर्डर करेंगे, एडमिन यहाँ आपकी स्पीड पोस्ट ट्रैकिंग विवरण जोड़ देंगे।
          </p>
          <a href="index.html#books" class="btn btn-primary btn-sm" style="margin-top: 1rem;">
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
              <span>डाक ट्रैकिंग नंबर (Speed Post Tracking): <strong style="font-family: monospace; color: var(--color-primary); background: #e0f2fe; padding: 2px 6px; border-radius: 4px;">${order.trackingNo || 'प्रतीक्षारत (Pending)'}</strong></span>
              <span>डिलीवरी पता: <strong>${order.address || data.deliveryAddress || 'उपलब्ध नहीं'}</strong></span>
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

  // Tab 3: Test Series (if present)
  const testsLocked = document.getElementById('testsLockedBanner');
  const testsUnlocked = document.getElementById('testsUnlockedContent');
  const testsBadge = document.getElementById('testsAccessBadge');

  if (testsLocked) testsLocked.style.display = 'none';
  if (testsUnlocked) testsUnlocked.style.display = 'none';
  if (testsBadge) testsBadge.innerHTML = '';
}
