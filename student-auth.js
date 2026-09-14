/**
 * Bhaskar Classes Barmer - Student Authentication Module (Login / Sign-Up)
 */
import { 
  auth, 
  db,
  doc,
  getDoc,
  setDoc,
  googleProvider, 
  onAuthStateChanged,
  signInWithPopup, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  sendPasswordResetEmail, 
  updateProfile 
} from "./firebase-config.js";

document.addEventListener('DOMContentLoaded', () => {
  checkPendingOrderPrompt();
  initAuthUI();
  initLoginAuthStateListener();
});

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
      bookNameEl.innerHTML = 'चयनित पुस्तक: <strong>' + bookName + '</strong> ' + (bookPrice ? '(₹' + bookPrice + ')' : '');
    }
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

        // Redirect to student.html
        window.location.href = 'student.html';
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
        window.location.href = 'student.html';
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

        const studentRef = doc(db, "students", user.uid);
        await setDoc(studentRef, {
          uid: user.uid,
          name: name,
          email: email,
          phone: phone,
          targetExam: goal,
          hasTestSeriesAccess: false,
          hasEbooksAccess: false,
          bookOrders: [],
          createdAt: new Date().toISOString()
        });

        window.location.href = 'student.html';
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

// 5. Auth State: If already logged in, redirect to student.html!
function initLoginAuthStateListener() {
  onAuthStateChanged(auth, (user) => {
    if (user) {
      // User is already logged in, send them straight to their student dashboard!
      try {
        localStorage.setItem('bhaskar_student_session', JSON.stringify({
          uid: user.uid,
          email: user.email || '',
          name: user.displayName || (user.email ? user.email.split('@')[0] : 'विद्यार्थी'),
          phone: user.phoneNumber || ''
        }));
      } catch (e) {}
      window.location.href = 'student.html';
    }
  });
}
