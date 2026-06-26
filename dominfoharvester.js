(function domHarvest() {
  const findings = [];

  const walker = document.createTreeWalker(document.documentElement, NodeFilter.SHOW_COMMENT);
  let node;
  while ((node = walker.nextNode())) {
    const txt = node.textContent.trim();
    if (txt.length > 3) findings.push({ type: 'HTML Comment', value: txt.slice(0, 200) });
  }

  document.querySelectorAll('meta').forEach(m => {
    const n = m.name || m.property || '';
    const c = m.content || '';
    if (['generator','version','author','build'].some(k => n.toLowerCase().includes(k)))
      findings.push({ type: 'Meta Disclosure', name: n, value: c });
  });

  document.querySelectorAll('script[src]').forEach(s => {
    const src = s.src;
    if (/localhost|staging|dev.|internal|admin|vd+.d+/.test(src))
      findings.push({ type: 'Sensitive Script Src', value: src });
  });

  const patterns = [
    { label: 'API Key', re: /['"]([A-Za-z0-9_-]{20,})['"]/ },
    { label: 'Internal URL', re: /https?://(localhost|192.168|10.|172.(1[6-9]|2d|3[01]))/ },
    { label: 'Debug/Test flag', re: /debugs*[:=]s*true|test_mode|isDevs*=/ },
  ];
  document.querySelectorAll('script:not([src])').forEach(s => {
    patterns.forEach(p => {
      const m = s.textContent.match(p.re);
      if (m) findings.push({ type: p.label, value: m[0].slice(0, 120) });
    });
  });

  console.group('%c[POC] DOM Information Harvester', 'color:#f97316;font-weight:bold');
  if (findings.length === 0) console.log('No obvious disclosures found');
  findings.forEach(f => console.warn(JSON.stringify(f)));
  console.groupEnd();
  return findings;
})();
