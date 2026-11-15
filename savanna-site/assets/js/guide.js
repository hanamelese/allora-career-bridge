// The guide's "Create an account" buttons: open ALX's published sign-up form in a dialog.
//
// The dialog is a native <dialog> opened with showModal(), so the page behind is blurred and inert,
// Escape closes it and focus returns to the button that opened it. The form inside is the Bridge's
// embed tag in sign-up mode. As on the sign-in page, this demo has no accounts: the password is
// removed from the answers as soon as the page receives them, and nothing is sent or kept.

(function () {
  'use strict';

  var dialog = document.querySelector('[data-guide-signup]');
  if (!dialog || typeof dialog.showModal !== 'function') return;

  var slot = dialog.querySelector('[data-guide-signup-slot]');
  var status = dialog.querySelector('[data-guide-signup-status]');
  var unavailable = dialog.querySelector('[data-onboarding-unavailable]');

  Array.prototype.forEach.call(document.querySelectorAll('[data-guide-signup-open]'), function (button) {
    button.hidden = false;
    button.addEventListener('click', function () {
      dialog.showModal();
    });
  });

  dialog.querySelector('[data-guide-signup-close]').addEventListener('click', function () {
    dialog.close();
  });

  // A click on the blurred page around the dialog (the dialog element itself, not its content) closes it.
  dialog.addEventListener('click', function (event) {
    if (event.target === dialog) dialog.close();
  });

  window.addEventListener('load', function () {
    if (unavailable && !window.customElements.get('onboarding-form')) unavailable.hidden = false;
  });

  // The form's own "Sign in" link may switch it; this dialog is for creating an account, so the
  // heading says which one is showing.
  slot.addEventListener('onboarding-mode', function (event) {
    var signIn = event.detail && event.detail.mode === 'signIn';
    dialog.querySelector('#guide-signup-title').textContent = signIn ? 'Sign in' : 'Create your account';
    if (status) status.textContent = '';
  });

  // Heard on the way up from the form, so nothing else on the page ever sees the password.
  slot.addEventListener('onboarding-submit', function (event) {
    var detail = event.detail || {};
    if (detail.answers) delete detail.answers.password;
    if (detail.type !== 'account') return;
    if (status) {
      status.textContent =
        detail.mode === 'signIn'
          ? 'Signed in for the demo. Nothing was sent or kept.'
          : 'Account created for the demo. Nothing was sent or kept.';
    }
  });

})();
