/* Moto Naranja — landing page behaviour
   Everything here is optional progressive enhancement: the page reads fine without it. */
(function () {
  'use strict';

  document.documentElement.classList.add('js');

  /* ---- Business settings: change these when the real numbers are known ---- */
  var WA_NUMBER = '34600000000';            // WhatsApp number, digits only, with country code
  var EMAIL = 'hola@motonaranja.com';
  var RATES = {                             // per day: [1-2 days, 3-6 days, 7+ days], deposit
    'City 50':     { tiers: [25, 22, 19], deposit: 150 },
    'Cruiser 125': { tiers: [35, 31, 27], deposit: 200 },
    'E-Volt':      { tiers: [30, 27, 24], deposit: 150 }
  };

  /* ---- Nav ---- */
  var nav = document.querySelector('.nav');
  var toggle = document.querySelector('.nav__toggle');
  var menu = document.getElementById('nav-menu');

  function setMenu(open) {
    document.body.classList.toggle('menu-open', open);
    toggle.setAttribute('aria-expanded', String(open));
    toggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
  }

  if (toggle && menu) {
    toggle.addEventListener('click', function () {
      setMenu(!document.body.classList.contains('menu-open'));
    });
    menu.addEventListener('click', function (e) {
      if (e.target.closest('a')) setMenu(false);
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && document.body.classList.contains('menu-open')) setMenu(false);
    });
  }

  function onScroll() {
    nav.classList.toggle('is-scrolled', window.scrollY > 8);
  }
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });

  /* ---- Scroll reveal ---- */
  var revealEls = document.querySelectorAll('[data-reveal]');
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('in');
          io.unobserve(entry.target);
        }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.1 });
    revealEls.forEach(function (el) { io.observe(el); });
  } else {
    revealEls.forEach(function (el) { el.classList.add('in'); });
  }

  /* ---- FAQ: keep one answer open at a time ---- */
  var faqItems = document.querySelectorAll('.faq__list details');
  faqItems.forEach(function (item) {
    item.addEventListener('toggle', function () {
      if (!item.open) return;
      faqItems.forEach(function (other) {
        if (other !== item && other.open) other.open = false;
      });
    });
  });

  /* ---- "Book this one" links preselect the model ---- */
  var modelSelect = document.getElementById('f-model');
  document.querySelectorAll('[data-model]').forEach(function (link) {
    link.addEventListener('click', function () {
      if (modelSelect) {
        modelSelect.value = link.getAttribute('data-model');
        modelSelect.dispatchEvent(new Event('change'));
      }
    });
  });

  /* ---- Booking form: live estimate + WhatsApp hand-off ---- */
  var form = document.getElementById('booking');
  if (!form) return;

  var nameInput = form.querySelector('[name="fullname"]');
  var phoneInput = form.querySelector('[name="phone"]');
  var pickup = form.querySelector('[name="pickup"]');
  var dropoff = form.querySelector('[name="dropoff"]');
  var notes = form.querySelector('[name="notes"]');
  var estDetail = document.getElementById('est-detail');
  var estTotal = document.getElementById('est-total');
  var mailLink = document.getElementById('mail-link');
  var errorBox = document.getElementById('form-error');

  function isoToday() {
    var d = new Date();
    var m = String(d.getMonth() + 1).padStart(2, '0');
    var day = String(d.getDate()).padStart(2, '0');
    return d.getFullYear() + '-' + m + '-' + day;
  }

  function parseDate(value) {
    if (!value) return null;
    var parts = value.split('-');
    return new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
  }

  function formatDate(date) {
    return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  }

  function rentalDays() {
    var a = parseDate(pickup.value);
    var b = parseDate(dropoff.value);
    if (!a || !b) return 0;
    var diff = Math.round((b - a) / 86400000);
    if (diff < 0) return -1;
    return Math.max(1, diff);
  }

  function quote() {
    var model = RATES[modelSelect.value] || RATES['City 50'];
    var days = rentalDays();
    if (days <= 0) return null;
    var rate = days >= 7 ? model.tiers[2] : days >= 3 ? model.tiers[1] : model.tiers[0];
    return { days: days, rate: rate, total: days * rate, deposit: model.deposit };
  }

  function updateEstimate() {
    var days = rentalDays();
    if (days === -1) {
      dropoff.setCustomValidity('The return date must be on or after the pick-up date.');
    } else {
      dropoff.setCustomValidity('');
    }
    var q = quote();
    if (!q) {
      estDetail.textContent = days === -1 ? 'Return date must be after pick-up' : 'Pick your dates to see a price';
      estTotal.textContent = '€ —';
    } else {
      estDetail.textContent = q.days + (q.days === 1 ? ' day' : ' days') + ' × €' + q.rate + ' · plus €' + q.deposit + ' refundable deposit';
      estTotal.textContent = '€' + q.total;
    }
    updateMailLink();
  }

  function buildMessage() {
    var q = quote();
    var a = parseDate(pickup.value);
    var b = parseDate(dropoff.value);
    var lines = ['Hola Moto Naranja! I would like to book a ' + modelSelect.value + '.'];
    if (a && b) {
      lines.push('Dates: ' + formatDate(a) + ' to ' + formatDate(b) + (q ? ' (' + q.days + (q.days === 1 ? ' day' : ' days') + ', approx. €' + q.total + ')' : ''));
    }
    if (nameInput.value.trim()) lines.push('Name: ' + nameInput.value.trim());
    if (phoneInput.value.trim()) lines.push('Phone: ' + phoneInput.value.trim());
    if (notes.value.trim()) lines.push('Notes: ' + notes.value.trim());
    return lines.join('\n');
  }

  function updateMailLink() {
    if (!mailLink) return;
    mailLink.href = 'mailto:' + EMAIL + '?subject=' + encodeURIComponent('Moped booking: ' + modelSelect.value) + '&body=' + encodeURIComponent(buildMessage());
  }

  pickup.min = isoToday();
  dropoff.min = isoToday();
  pickup.addEventListener('change', function () {
    dropoff.min = pickup.value || isoToday();
    if (dropoff.value && dropoff.value < pickup.value) dropoff.value = pickup.value;
    updateEstimate();
  });
  [modelSelect, dropoff].forEach(function (el) { el.addEventListener('change', updateEstimate); });
  [nameInput, phoneInput, notes].forEach(function (el) { el.addEventListener('input', updateMailLink); });
  updateEstimate();

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    updateEstimate();
    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }
    errorBox.hidden = true;
    var url = 'https://wa.me/' + WA_NUMBER + '?text=' + encodeURIComponent(buildMessage());
    var win = window.open(url, '_blank', 'noopener');
    if (!win) {
      errorBox.textContent = 'Your browser blocked the WhatsApp window. Use the email link instead, or write to us directly.';
      errorBox.hidden = false;
    }
  });

  /* ---- Footer year ---- */
  var year = document.getElementById('year');
  if (year) year.textContent = String(new Date().getFullYear());
})();
