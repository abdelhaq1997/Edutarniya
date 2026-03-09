(function () {
  const APP_VERSION = 'pwa-v1.0.0';
  const INSTALL_BTN_ID = 'installPwaBtn';
  let deferredPrompt = null;

  function ensureInstallButton() {
    if (document.getElementById(INSTALL_BTN_ID)) return;
    const header = document.querySelector('.app-header');
    if (!header) return;

    const btn = document.createElement('button');
    btn.id = INSTALL_BTN_ID;
    btn.className = 'btn btn-info btn-sm no-print';
    btn.type = 'button';
    btn.textContent = '📲 تثبيت التطبيق';
    btn.style.display = 'none';
    btn.addEventListener('click', async () => {
      if (!deferredPrompt) return;
      deferredPrompt.prompt();
      await deferredPrompt.userChoice;
      deferredPrompt = null;
      btn.style.display = 'none';
    });

    const reportBtn = header.querySelector('.btn.btn-primary.btn-sm.no-print');
    if (reportBtn) {
      reportBtn.insertAdjacentElement('beforebegin', btn);
    } else {
      header.appendChild(btn);
    }
  }

  function showToast(message, type = 'info') {
    const container = document.getElementById('toastContainer');
    if (container && typeof window.showToast === 'function') {
      window.showToast(message, type);
      return;
    }
    console.log(message);
  }

  function updateOnlineState() {
    const syncIndicator = document.getElementById('syncIndicator');
    const syncStatus = document.getElementById('syncStatus');

    if (syncIndicator) {
      syncIndicator.innerHTML = navigator.onLine ? '🟢 متصل' : '🔴 بدون إنترنت';
    }
    if (syncStatus) {
      syncStatus.style.display = 'block';
      syncStatus.textContent = navigator.onLine ? 'تم استرجاع الاتصال' : 'أنت تعمل حاليا بدون إنترنت';
      syncStatus.style.color = navigator.onLine ? 'var(--success)' : 'var(--danger)';
    }
  }

  async function registerSW() {
    if (!('serviceWorker' in navigator)) return;
    try {
      const reg = await navigator.serviceWorker.register('./sw.js');
      console.log('SW registered', reg.scope);

      reg.addEventListener('updatefound', () => {
        const newWorker = reg.installing;
        if (!newWorker) return;
        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            showToast('يوجد تحديث جديد للتطبيق. أغلقه وافتحه من جديد.', 'info');
          }
        });
      });
    } catch (err) {
      console.error('SW registration failed', err);
    }
  }

  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    const btn = document.getElementById(INSTALL_BTN_ID);
    if (btn) btn.style.display = 'inline-flex';
  });

  window.addEventListener('appinstalled', () => {
    deferredPrompt = null;
    const btn = document.getElementById(INSTALL_BTN_ID);
    if (btn) btn.style.display = 'none';
    showToast('تم تثبيت التطبيق بنجاح', 'success');
  });

  window.addEventListener('online', updateOnlineState);
  window.addEventListener('offline', updateOnlineState);

  function initPWA() {
    ensureInstallButton();
    updateOnlineState();
    registerSW();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initPWA);
  } else {
    initPWA();
  }
})();
