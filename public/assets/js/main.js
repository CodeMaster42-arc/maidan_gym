// Maidan Athletic Club — site behaviour.
// Every block below is a progressive enhancement: with JS off the page is still
// fully readable and navigable.
(function () {
  'use strict';

  /* --- mobile nav --------------------------------------------------------- */

  var toggle = document.querySelector('.nav-toggle');
  var nav = document.getElementById('site-nav');

  if (toggle && nav) {
    var setNav = function (open) {
      toggle.setAttribute('aria-expanded', String(open));
      toggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
      nav.dataset.open = String(open);
      // Only lock scroll on the breakpoint where the nav is a full-screen panel.
      document.body.style.overflow = open && window.innerWidth < 960 ? 'hidden' : '';
    };

    toggle.addEventListener('click', function () {
      setNav(toggle.getAttribute('aria-expanded') !== 'true');
    });

    nav.addEventListener('click', function (event) {
      if (event.target.closest('a')) setNav(false);
    });

    document.addEventListener('keydown', function (event) {
      if (event.key === 'Escape' && toggle.getAttribute('aria-expanded') === 'true') {
        setNav(false);
        toggle.focus();
      }
    });

    // Coming back over the desktop breakpoint must not leave scroll locked.
    window.addEventListener('resize', function () {
      if (window.innerWidth >= 960) setNav(false);
    });
  }

  /* --- scroll reveal ------------------------------------------------------ */

  var revealables = document.querySelectorAll('[data-reveal]');

  if (!('IntersectionObserver' in window)) {
    // No observer support: show everything immediately rather than hiding it.
    revealables.forEach(function (el) {
      el.classList.add('is-visible');
    });
  } else {
    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        });
      },
      { rootMargin: '0px 0px -12% 0px', threshold: 0.08 }
    );

    revealables.forEach(function (el) {
      observer.observe(el);
    });
  }

  /* --- founder video ------------------------------------------------------ */

  // owner_speech.mp4 is speech, so it must start WITH sound. That rules out
  // autoplay (browsers block unmuted autoplay), hence the explicit play button.
  document.querySelectorAll('.video-portrait').forEach(function (wrap) {
    var video = wrap.querySelector('video');
    var button = wrap.querySelector('.video-portrait__play');
    if (!video || !button) return;

    button.addEventListener('click', function () {
      video.controls = true;
      var played = video.play();
      if (played && typeof played.catch === 'function') {
        played.catch(function () {
          // Autoplay policy or codec refusal — leave native controls up so the
          // visitor can start it themselves.
          video.controls = true;
        });
      }
      button.hidden = true;
    });

    video.addEventListener('pause', function () {
      if (video.currentTime === 0 || video.ended) button.hidden = false;
    });
  });

  /* --- class card hover video --------------------------------------------- */

  // Wired ahead of real footage: a card only gains hover-video behaviour if a
  // <video> is actually present inside its media well.
  document.querySelectorAll('.class-card').forEach(function (card) {
    var video = card.querySelector('.class-card__media video');
    if (!video) return;

    video.muted = true;
    video.loop = true;
    video.playsInline = true;

    var start = function () {
      var played = video.play();
      if (played && typeof played.catch === 'function') played.catch(function () {});
    };
    var stop = function () {
      video.pause();
      video.currentTime = 0;
    };

    card.addEventListener('mouseenter', start);
    card.addEventListener('mouseleave', stop);
    card.addEventListener('focusin', start);
    card.addEventListener('focusout', stop);
  });

  /* --- reviews carousel --------------------------------------------------- */

  document.querySelectorAll('.reviews').forEach(function (root) {
    var track = root.querySelector('.reviews__track');
    var prev = root.querySelector('[data-scroll="prev"]');
    var next = root.querySelector('[data-scroll="next"]');
    if (!track || !prev || !next) return;

    var step = function () {
      var card = track.querySelector('.review');
      // +1 for the 1px grid gap between cards.
      return card ? card.getBoundingClientRect().width + 1 : track.clientWidth * 0.8;
    };

    var sync = function () {
      // 2px of slack absorbs sub-pixel rounding at the track ends.
      var max = track.scrollWidth - track.clientWidth - 2;
      prev.disabled = track.scrollLeft <= 2;
      next.disabled = track.scrollLeft >= max;
    };

    prev.addEventListener('click', function () {
      track.scrollBy({ left: -step(), behavior: 'smooth' });
    });

    next.addEventListener('click', function () {
      track.scrollBy({ left: step(), behavior: 'smooth' });
    });

    track.addEventListener('scroll', sync, { passive: true });
    window.addEventListener('resize', sync);
    sync();
  });

  /* --- FAQ: one panel open at a time -------------------------------------- */

  document.querySelectorAll('.faq').forEach(function (group) {
    var panels = group.querySelectorAll('details');
    panels.forEach(function (panel) {
      panel.addEventListener('toggle', function () {
        if (!panel.open) return;
        panels.forEach(function (other) {
          if (other !== panel) other.open = false;
        });
      });
    });
  });

  /* --- marquee: duplicate items so the loop has no gap -------------------- */

  document.querySelectorAll('.marquee__track').forEach(function (track) {
    // The keyframe translates by -50%, so the content must be exactly doubled.
    track.innerHTML += track.innerHTML;
  });
})();
