// Run before logout to take snapshot
window.__storageSnapshot = {
  ls: Object.fromEntries(Object.keys(localStorage).map(k => [k, localStorage.getItem(k)])),
  ss: Object.fromEntries(Object.keys(sessionStorage).map(k => [k, sessionStorage.getItem(k)])),
  ts: new Date().toISOString()
};
console.log('%c[SNAPSHOT TAKEN] Now logout, return to this tab, and run Step 2.', 'color:#22c55e;font-weight:bold');
console.log('Snapshot:', window.__storageSnapshot);

// Run after logout to detect survivors.
(function checkPersistence() {
  if (!window.__storageSnapshot) { console.error('Run Step 1 first (before logout)'); return; }

  const snap = window.__storageSnapshot;
  const survivors = { ls: [], ss: [] };

  Object.keys(snap.ls).forEach(k => {
    if (localStorage.getItem(k) !== null)
      survivors.ls.push({ key: k, before: snap.ls[k]?.slice(0,80), after: localStorage.getItem(k)?.slice(0,80) });
  });
  Object.keys(snap.ss).forEach(k => {
    if (sessionStorage.getItem(k) !== null)
      survivors.ss.push({ key: k });
  });

  console.group('%c[POC] Logout Persistence Delta', 'color:#f97316;font-weight:bold');
  console.log('Snapshot taken at:', snap.ts);

  if (survivors.ls.length) {
    console.error('[FINDING] localStorage keys survived logout:');
    survivors.ls.forEach(s => console.warn(' >', s.key, '| value unchanged:', s.before === s.after));
  } else console.log('[OK] localStorage cleared on logout');

  if (survivors.ss.length) {
    console.error('[FINDING] sessionStorage keys survived logout:');
    survivors.ss.forEach(s => console.warn(' >', s.key));
  } else console.log('[OK] sessionStorage cleared on logout');

  console.groupEnd();
  return survivors;
})();
