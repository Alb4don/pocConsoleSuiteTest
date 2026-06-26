(async function storageEnum() {
  const sensitive = /token|jwt|auth|session|key|secret|password|email|cpf|user|id|api/i;

  console.group('%c[POC] Full Storage Enumeration', 'color:#f97316;font-weight:bold');

  console.group('[LS] localStorage (' + localStorage.length + ' keys)');
  Object.keys(localStorage).forEach(k => {
    const v = localStorage.getItem(k);
    const flag = sensitive.test(k) || sensitive.test(v || '') ? '⚠ SENSITIVE' : '';
    console.log(`${flag} ${k}:`, v?.slice(0, 120));
  });
  console.groupEnd();

  console.group('[SS] sessionStorage (' + sessionStorage.length + ' keys)');
  Object.keys(sessionStorage).forEach(k => {
    const v = sessionStorage.getItem(k);
    const flag = sensitive.test(k) || sensitive.test(v || '') ? '⚠ SENSITIVE' : '';
    console.log(`${flag} ${k}:`, v?.slice(0, 120));
  });
  console.groupEnd();

  try {
    const dbs = await indexedDB.databases();
    console.group('[IDB] IndexedDB databases');
    dbs.forEach(db => console.log('DB:', db.name, '| version:', db.version));
    console.groupEnd();
  } catch(e) { console.warn('[IDB] databases() not supported:', e.message); }

  if ('caches' in window) {
    try {
      const keys = await caches.keys();
      console.group('[SW] Cache Storage keys');
      keys.forEach(k => console.log('Cache:', k));
      if (keys.length > 0) console.warn('[INFO] Inspect caches for sensitive response payloads');
      console.groupEnd();
    } catch(e) { console.warn('[SW] Cache access denied'); }
  }

  console.groupEnd();
})();
