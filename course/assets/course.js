/* Sparkcue course: progress, day-by-day unlocking, copy buttons, email sign-up. Works without storage too. */
(function () {
  var KEY = 'sparkcue-course';
  function load() { try { return JSON.parse(localStorage.getItem(KEY)) || {}; } catch (e) { return {}; } }
  function save(s) { try { localStorage.setItem(KEY, JSON.stringify(s)); } catch (e) {} }
  var s = load();
  if (!s.start) { s.start = new Date().toISOString().slice(0, 10); s.done = s.done || []; save(s); }
  s.done = s.done || [];
  var day = Math.floor((Date.now() - Date.parse(s.start)) / 864e5) + 1;   // day 1 = the first visit
  var total = Number(document.body.getAttribute('data-core-total') || 7);

  // course home: progress bar, done / locked states
  var bar = document.querySelector('.progress i');
  if (bar) bar.style.width = Math.round(100 * Math.min(s.done.length, total) / total) + '%';
  var count = document.getElementById('done-count');
  if (count) count.textContent = Math.min(s.done.length, total) + ' of ' + total;
  document.querySelectorAll('.lessons li[data-n]').forEach(function (li) {
    var n = Number(li.getAttribute('data-n')), st = li.querySelector('.st');
    if (s.done.indexOf(n) >= 0) { li.classList.add('done'); if (st) st.textContent = 'Done ✓'; }
    else if (n > day && n > s.done.length + 1) { li.classList.add('locked'); if (st) st.textContent = n === day + 1 ? 'Unlocks tomorrow' : 'Day ' + n; }
    else if (st) st.textContent = 'Start →';
  });
  var cert = document.getElementById('cert-link');
  if (cert && s.done.length >= total) cert.classList.remove('hidden');

  // lesson page: mark done
  var n = Number(document.body.getAttribute('data-lesson') || 0);
  var doneBtn = document.getElementById('mark-done');
  function paintDone() {
    if (!doneBtn) return;
    var d = s.done.indexOf(n) >= 0;
    doneBtn.textContent = d ? 'Done ✓' : 'I did it! Mark as done';
    doneBtn.classList.toggle('primary', !d);
  }
  if (doneBtn && n) {
    paintDone();
    var live = document.createElement('p'); live.className = 'note'; live.setAttribute('aria-live', 'polite');
    doneBtn.parentNode.appendChild(live);
    doneBtn.addEventListener('click', function () {
      var was = s.done.indexOf(n) >= 0;
      if (!was) s.done.push(n); else s.done = s.done.filter(function (x) { return x !== n; });
      save(s); paintDone();
      live.textContent = was ? '' : (n >= total ? 'You finished the course! Grab your certificate from the course page.'
        : 'Nice work! Day ' + (n + 1) + ' unlocks tomorrow' + (s.email ? ', and it lands in your inbox.' : '.'));
    });
  }

  // copy buttons
  document.querySelectorAll('[data-copy]').forEach(function (b) {
    b.addEventListener('click', function () {
      var txt = document.getElementById(b.getAttribute('data-copy')).innerText;
      function ok() { var t = b.textContent; b.textContent = 'Copied ✓'; b.setAttribute('aria-live', 'polite'); setTimeout(function () { b.textContent = t; }, 1500); }
      if (navigator.clipboard) navigator.clipboard.writeText(txt).then(ok, function () {});
      else { var r = document.createRange(); r.selectNode(document.getElementById(b.getAttribute('data-copy'))); getSelection().removeAllRanges(); getSelection().addRange(r); document.execCommand('copy'); ok(); }
    });
  });

  // email sign-up (Kit form). The form is only shown when the bot has a Kit form id.
  document.querySelectorAll('form[data-kit]').forEach(function (f) {
    f.addEventListener('submit', function (e) {
      e.preventDefault();
      var msg = f.parentNode.querySelector('.note'), btn = f.querySelector('button');
      msg.setAttribute('aria-live', 'polite');
      btn.disabled = true; msg.textContent = 'Sending…';
      var data = new FormData(f);
      fetch('https://app.kit.com/forms/' + f.getAttribute('data-kit') + '/subscriptions', { method: 'POST', body: data, headers: { Accept: 'application/json' } })
        .then(function (r) { if (!r.ok) throw new Error(r.status); return r.json().catch(function () { return {}; }); })
        .then(function () { msg.innerHTML = '<span class="ok">You\'re in! Confirm the email Kit just sent you, and Bit\'s lessons start landing tomorrow morning.</span>'; f.classList.add('hidden'); s.email = true; save(s); })
        .catch(function () { msg.textContent = 'Something went wrong. Please try again in a minute.'; btn.disabled = false; });
    });
  });
  // slide deck: tap / swipe / arrow keys, story-style progress bars
  document.querySelectorAll('.deck').forEach(function (d) {
    var imgs = d.querySelectorAll('img'), bars = d.querySelectorAll('.bars i'), cnt = d.querySelector('.count span'), i = 0;
    function show(k) {
      i = Math.max(0, Math.min(imgs.length - 1, k));
      imgs.forEach(function (im, j) { im.hidden = j !== i; });
      bars.forEach(function (b, j) { b.classList.toggle('on', j <= i); });
      if (cnt) cnt.textContent = i + 1;
    }
    d.querySelector('.next').addEventListener('click', function () { show(i + 1); });
    d.querySelector('.prev').addEventListener('click', function () { show(i - 1); });
    d.addEventListener('keydown', function (e) { if (e.key === 'ArrowRight') show(i + 1); if (e.key === 'ArrowLeft') show(i - 1); });
    var x0 = null;
    d.addEventListener('touchstart', function (e) { x0 = e.touches[0].clientX; }, { passive: true });
    d.addEventListener('touchend', function (e) { if (x0 === null) return; var dx = e.changedTouches[0].clientX - x0; if (Math.abs(dx) > 40) show(i + (dx < 0 ? 1 : -1)); x0 = null; });
    show(0);
  });
})();
