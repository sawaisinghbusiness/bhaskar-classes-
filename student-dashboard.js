/**
 * Bhaskar Classes Barmer - Student Dashboard Module
 */
import { 
  auth, 
  db,
  doc,
  getDoc,
  updateDoc,
  onSnapshot,
  onAuthStateChanged,
  signOut,
  updateProfile 
} from "./firebase-config.js";

document.addEventListener('DOMContentLoaded', () => {
  initDashboardTabs();
  initDashboardAuthListener();
  initLogoutHandler();
  initProfileForm();
});

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

// 2. Top Header Logout Button
function initLogoutHandler() {
  const logoutBtn = document.getElementById('studentHeaderLogoutBtn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', async () => {
      if (confirm('क्या आप निश्चित रूप से विद्यार्थी पोर्टल से लॉगआउट करना चाहते हैं?')) {
        try {
          if (unsubscribeStudentDoc) {
            unsubscribeStudentDoc();
            unsubscribeStudentDoc = null;
          }
          await signOut(auth);
          try {
            localStorage.removeItem('bhaskar_student_session');
          } catch (e) {}
          window.location.href = 'student-login.html';
        } catch (error) {
          console.error('Logout error:', error);
          alert('लॉगआउट में समस्या आई: ' + error.message);
        }
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
      const goalSelect = document.getElementById('profGoal');

      const newName = nameInput ? nameInput.value.trim() : '';
      const newPhone = phoneInput ? phoneInput.value.trim() : '';
      const newGoal = goalSelect ? goalSelect.value : '';

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
  try {
    const raw = sessionStorage.getItem('pending_book_order') || localStorage.getItem('pending_book_order');
    if (raw) orderData = JSON.parse(raw);
  } catch (e) {}

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
      <div style="background: linear-gradient(135deg, #15803d 0%, #166534 100%); color: #ffffff; border-radius: 12px; padding: 1.25rem 1.5rem; box-shadow: 0 4px 15px rgba(21,128,61,0.25); text-align: center; margin-bottom: 1rem;">
        <div style="font-size: 1.15rem; font-weight: 800; margin-bottom: 0.35rem; display: flex; align-items: center; justify-content: center; gap: 8px;">
          <i class="fa-solid fa-circle-check" style="color: #4ade80;"></i> खाता प्रमाणित! आपका पुस्तक ऑर्डर तैयार है
        </div>
        <p style="font-size: 0.875rem; color: #dcfce7; margin-bottom: 1rem; line-height: 1.4;">
          <strong>${bookName} ${bookPrice ? '(' + bookPrice + ')' : ''}</strong> का ऑर्डर अपने विद्यार्थी विवरण के साथ व्हाट्सएप पर भेजने हेतु नीचे क्लिक करें:
        </p>
        <a href="${waUrl}" target="_blank" class="btn" style="background-color: #25D366; color: #ffffff; font-weight: 800; font-size: 1rem; padding: 10px 24px; border-radius: 8px; display: inline-flex; align-items: center; gap: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.25); text-decoration: none;">
          <i class="fa-brands fa-whatsapp" style="font-size: 1.35rem;"></i> व्हाट्सएप पर ऑर्डर भेजें (8949287751) &rarr;
        </a>
      </div>
    `;
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
    if (!user) {
      // User is not logged in -> redirect to student-login.html!
      if (unsubscribeStudentDoc) {
        unsubscribeStudentDoc();
        unsubscribeStudentDoc = null;
      }
      try {
        localStorage.removeItem('bhaskar_student_session');
      } catch (e) {}
      window.location.href = 'student-login.html';
      return;
    }

    // User is logged in!
    try {
      localStorage.setItem('bhaskar_student_session', JSON.stringify({
        uid: user.uid,
        email: user.email || '',
        name: user.displayName || (user.email ? user.email.split('@')[0] : 'विद्यार्थी'),
        phone: user.phoneNumber || ''
      }));
    } catch (e) {}

    // Check admin redirection
    try {
      const adminDocRef = doc(db, "admins", user.uid);
      const adminDocSnap = await getDoc(adminDocRef);
      if (adminDocSnap.exists()) {
        window.location.href = 'admin.html';
        return;
      }
    } catch (e) {}

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
  const goalEl = document.getElementById('studentGoalDisplay');
  const phoneEl = document.getElementById('studentDisplayPhone');
  const idEl = document.getElementById('studentDisplayId');

  if (welcomeEl) welcomeEl.innerText = displayName;
  if (goalEl) goalEl.innerText = `🎯 लक्ष्य: ${targetExam}`;
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
  const profGoal = document.getElementById('profGoal');

  if (profName && !profName.matches(':focus')) profName.value = displayName;
  if (profPhone && !profPhone.matches(':focus')) profPhone.value = phone;
  if (profGoal && !profGoal.matches(':focus')) profGoal.value = targetExam;

  // Tab 1: Books & Delivery Tracking
  const booksContainer = document.getElementById('studentBooksContainer');
  const orders = Array.isArray(data.bookOrders) ? data.bookOrders : [];

  if (booksContainer) {
    if (orders.length === 0) {
      booksContainer.innerHTML = `
        <div style="background-color: var(--color-bg-alt); border: 1px dashed var(--color-border); border-radius: var(--radius-card); padding: 2rem; text-align: center;">
          <i class="fa-solid fa-box-open" style="font-size: 2.5rem; color: #94A3B8; margin-bottom: 0.75rem;"></i>
          <h4 style="font-size: 1rem; font-weight: 700; color: var(--color-primary);">वर्तमान में कोई पुस्तक ऑर्डर दर्ज नहीं है</h4>
          <p style="font-size: 0.8125rem; color: var(--color-text-muted); margin-top: 0.25rem;">
            जब आप मंदार पब्लिकेशन की पुस्तकें ऑर्डर करेंगे, एडमिन यहाँ आपकी स्पीड पोस्ट ट्रैकिंग विवरण जोड़ देंगे।
          </p>
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
