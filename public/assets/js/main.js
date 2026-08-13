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

  /* --- hero background video ---------------------------------------------- */

  // Two clips hard-cutting between each other once a second. Both keep playing
  // the whole time and only visibility swaps, so neither restarts mid-cut and
  // the two stay in sync with themselves across the whole loop.
  var heroClips = document.querySelectorAll('.hero__video');

  if (heroClips.length) {
    var reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (reducedMotion) {
      // Autoplaying background motion is exactly what this preference is for.
      // Hold on the first clip, paused, so the poster frame carries the hero.
      heroClips.forEach(function (clip, i) {
        clip.autoplay = false;
        clip.removeAttribute('autoplay');
        clip.pause();
        clip.classList.toggle('is-active', i === 0);
      });
    } else {
      heroClips.forEach(function (clip) {
        clip.muted = true;
        // Failure here just means the poster shows; nothing else breaks.
        var p = clip.play();
        if (p && typeof p.catch === 'function') p.catch(function () {});
      });

      var current = 0;
      var timer = null;

      var advance = function () {
        current = (current + 1) % heroClips.length;
        heroClips.forEach(function (clip, i) {
          clip.classList.toggle('is-active', i === current);
        });
      };

      var startCuts = function () {
        if (timer === null) timer = setInterval(advance, 1000);
      };

      var stopCuts = function () {
        if (timer !== null) {
          clearInterval(timer);
          timer = null;
        }
      };

      // No point cutting between hidden videos, and background timers get
      // throttled anyway, which would desync the cut from the visible frame.
      document.addEventListener('visibilitychange', function () {
        if (document.hidden) {
          stopCuts();
        } else {
          heroClips.forEach(function (clip) {
            var p = clip.play();
            if (p && typeof p.catch === 'function') p.catch(function () {});
          });
          startCuts();
        }
      });

      startCuts();
    }
  }

  /* --- founder video ------------------------------------------------------ */

  // owner_speech.mp4 is speech, so it must start WITH sound. That rules out
  // autoplay (browsers block unmuted autoplay), hence the explicit play button.
  // Every browser blocks autoplay WITH sound until the visitor has interacted
  // with the page. No site can override that. So: try unmuted first, fall back
  // to muted playback with a visible prompt, and unmute the moment any
  // interaction happens anywhere on the page.
  document.querySelectorAll('.video-portrait').forEach(function (wrap) {
    var video = wrap.querySelector('video');
    var button = wrap.querySelector('.video-portrait__play');
    if (!video) return;

    var label = button && button.querySelector('span');
    var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var started = false;

    var showPrompt = function (text) {
      if (!button) return;
      button.hidden = false;
      if (label) label.textContent = text;
    };

    var unmute = function () {
      if (!video.muted) return;
      video.muted = false;
      video.volume = 1;
      if (video.paused) video.play().catch(function () {});
      if (button) button.hidden = true;
    };

    // Attempt sound-on playback. Resolves only if the browser already trusts
    // this page (prior interaction, or a high media-engagement score).
    var startWithSound = function () {
      if (started) return;
      started = true;
      video.muted = false;
      video.controls = true;

      var attempt = video.play();
      if (!attempt || typeof attempt.catch !== 'function') return;

      attempt.catch(function () {
        // Refused. Run it muted so the visitor at least sees it moving, and
        // ask for the one interaction needed to turn sound on.
        video.muted = true;
        video.play().catch(function () {});
        showPrompt('Tap for sound');
      });
    };

    if (button) {
      button.addEventListener('click', function () {
        video.controls = true;
        started = true;
        unmute();
      });
    }

    // Any interaction anywhere satisfies the autoplay policy, so take the first
    // one and turn the sound on if the video is already rolling muted.
    ['pointerdown', 'keydown', 'touchstart'].forEach(function (evt) {
      document.addEventListener(evt, function handler() {
        document.removeEventListener(evt, handler);
        if (started && video.muted && !video.paused) unmute();
      }, { once: true, passive: true });
    });

    if (reduced) {
      // Respect the motion preference: wait for a deliberate click.
      showPrompt('Play with sound');
      return;
    }

    if (!('IntersectionObserver' in window)) {
      showPrompt('Play with sound');
      return;
    }

    // Fire when the player is meaningfully on screen, not merely one pixel in.
    var seen = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          seen.unobserve(entry.target);
          startWithSound();
        });
      },
      { threshold: 0.55 }
    );
    seen.observe(wrap);

    video.addEventListener('pause', function () {
      if (video.ended) showPrompt('Play again');
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
    if (!track) return;

    // Arrows are optional: auto-scroll still works without them.
    var prev = root.querySelector('[data-scroll="prev"]');
    var next = root.querySelector('[data-scroll="next"]');

    var step = function () {
      var card = track.querySelector('.review');
      // +1 for the 1px grid gap between cards.
      return card ? card.getBoundingClientRect().width + 1 : track.clientWidth * 0.8;
    };

    var atEnd = function () {
      // 2px of slack absorbs sub-pixel rounding at the track ends.
      return track.scrollLeft >= track.scrollWidth - track.clientWidth - 2;
    };

    var sync = function () {
      if (prev) prev.disabled = track.scrollLeft <= 2;
      if (next) next.disabled = atEnd();
    };

    if (prev) {
      prev.addEventListener('click', function () {
        track.scrollBy({ left: -step(), behavior: 'smooth' });
      });
    }

    if (next) {
      next.addEventListener('click', function () {
        track.scrollBy({ left: step(), behavior: 'smooth' });
      });
    }

    track.addEventListener('scroll', sync, { passive: true });
    window.addEventListener('resize', sync);
    sync();

    /* auto-scroll */

    // Advancing a whole card at a time keeps scroll-snap happy. A continuous
    // pixel crawl fights the snap points and judders.
    var AUTO_MS = 4000;
    var timer = null;
    var paused = false;

    var advance = function () {
      if (paused) return;
      if (atEnd()) {
        track.scrollTo({ left: 0, behavior: 'smooth' });
      } else {
        track.scrollBy({ left: step(), behavior: 'smooth' });
      }
    };

    var start = function () {
      if (timer === null) timer = setInterval(advance, AUTO_MS);
    };

    var stop = function () {
      if (timer !== null) {
        clearInterval(timer);
        timer = null;
      }
    };

    // Reading a review should never be interrupted by the carousel moving on,
    // so any sign of attention or manual control halts it.
    var hold = function () {
      paused = true;
      stop();
    };

    var release = function () {
      paused = false;
      start();
    };

    root.addEventListener('mouseenter', hold);
    root.addEventListener('mouseleave', release);
    root.addEventListener('focusin', hold);
    root.addEventListener('focusout', release);
    // Touch drag: hand control over and do not fight the user's finger.
    track.addEventListener('touchstart', hold, { passive: true });
    track.addEventListener('touchend', release, { passive: true });

    document.addEventListener('visibilitychange', function () {
      if (document.hidden) stop();
      else if (!paused) start();
    });

    if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) start();
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
