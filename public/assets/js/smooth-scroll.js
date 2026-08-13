// Smooth scroll for in-page anchors, offset by the fixed header height.
// CSS `scroll-behavior: smooth` handles most of this already; this exists so the
// landing position clears the fixed header and so the offset stays in sync with
// the --header-h token rather than being hard-coded.
(function () {
  'use strict';

  function headerOffset() {
    var raw = getComputedStyle(document.documentElement).getPropertyValue('--header-h');
    var px = parseFloat(raw);
    if (!px) return 0;
    // --header-h is authored in rem
    return raw.indexOf('rem') > -1
      ? px * parseFloat(getComputedStyle(document.documentElement).fontSize)
      : px;
  }

  document.addEventListener('click', function (event) {
    var anchor = event.target.closest('a[href^="#"]');
    if (!anchor) return;

    var hash = anchor.getAttribute('href');
    if (!hash || hash === '#') return;

    var target;
    try {
      target = document.querySelector(hash);
    } catch (err) {
      return; // not a valid selector — let the browser handle it
    }
    if (!target) return;

    event.preventDefault();

    var top = target.getBoundingClientRect().top + window.scrollY - headerOffset();
    var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    window.scrollTo({ top: top, behavior: reduced ? 'auto' : 'smooth' });

    // Keep the URL and focus in step, so the jump is not mouse-only.
    if (history.replaceState) history.replaceState(null, '', hash);
    target.setAttribute('tabindex', '-1');
    target.focus({ preventScroll: true });
  });
})();
