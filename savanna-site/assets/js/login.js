// The sign-in page's side of the embedded Sign up / Sign in form.
//
// The form comes from Allora Accessibility Bridge's embed tag and draws everything a person sees,
// including its own link between "Sign in" and "Create an account". It checks no account itself:
// it hands what was typed to this page in an `onboarding-submit` event, and signing in (or up) is
// the page's job. This static demo has no accounts, so it:
//   - offers a Sign in | Create account switch above the form (it sets the form's `mode`), opens
//     the form in sign-up mode for /#create-account, and keeps the switch, heading, title and
//     address in step with the form's mode, including when its own link is used (`onboarding-mode`);
//   - removes the password from the submitted answers at once - it is never kept, logged or sent;
//   - says what happens, then opens the demo guide.
// If the form's script never loads, it says so in place of the form.

(function () {
  'use strict';

  var slot = document.querySelector('[data-onboarding-slot="login"]');
  if (!slot) return;

  var form = slot.querySelector('onboarding-form');
  var unavailable = slot.querySelector('[data-onboarding-unavailable]');
  var status = slot.querySelector('[data-login-status]');
  var title = document.querySelector('[data-login-title]');
  var lead = document.querySelector('[data-login-lead]');
  var modeSwitch = document.querySelector('[data-login-switch]');
  var modeButtons = modeSwitch ? modeSwitch.querySelectorAll('[data-login-mode]') : [];

  var COPY = {
    signIn: {
      title: 'Welcome back!',
      lead: 'Sign in to continue your learning.',
      page: 'Sign in | ALX Savanna',
      done: 'Signed in for the demo. Opening the demo guide…',
    },
    signUp: {
      title: 'Create your account',
      lead: 'Join ALX to start learning. It takes a minute.',
      page: 'Create account | ALX Savanna',
      done: 'Account created for the demo. Opening the demo guide…',
    },
  };

  function show(mode, moveFocus) {
    var copy = COPY[mode] || COPY.signIn;
    title.textContent = copy.title;
    lead.textContent = copy.lead;
    document.title = copy.page;
    window.history.replaceState(null, '', mode === 'signUp' ? '#create-account' : window.location.pathname);
    Array.prototype.forEach.call(modeButtons, function (button) {
      button.setAttribute('aria-pressed', String(button.getAttribute('data-login-mode') === (COPY[mode] ? mode : 'signIn')));
    });
    // The form starts afresh in the new mode, so focus goes to the page's new heading.
    if (moveFocus) title.focus();
  }

  // /#create-account opens straight into creating an account.
  if (window.location.hash === '#create-account' && form) form.setAttribute('mode', 'signUp');
  show(form && form.getAttribute('mode') === 'signUp' ? 'signUp' : 'signIn', false);

  // `load` waits for the async widget script to run, or to fail.
  window.addEventListener('load', function () {
    if (unavailable && !window.customElements.get('onboarding-form')) unavailable.hidden = false;
  });

  // The Sign in | Create account switch above the form. Focus stays on the button pressed.
  if (modeSwitch && form) {
    modeSwitch.hidden = false;
    Array.prototype.forEach.call(modeButtons, function (button) {
      button.addEventListener('click', function () {
        var mode = button.getAttribute('data-login-mode');
        if (button.getAttribute('aria-pressed') === 'true') return;
        form.setAttribute('mode', mode);
        if (status) status.textContent = '';
        show(mode, false);
      });
    });
  }

  slot.addEventListener('onboarding-mode', function (event) {
    show(event.detail && event.detail.mode, true);
  });

  // Heard on the way up from the form, before any listener further out, so nothing else on the
  // page ever sees the password.
  slot.addEventListener('onboarding-submit', function (event) {
    var detail = event.detail || {};
    if (detail.answers) delete detail.answers.password;
    if (detail.type !== 'account') return;

    if (status) status.textContent = (COPY[detail.mode] || COPY.signIn).done;
    window.setTimeout(function () {
      window.location.assign('guide/');
    }, 900);
  });
})();
