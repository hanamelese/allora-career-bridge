// The Register and Job application pages: the page's side of an embedded onboarding form.
//
// The form itself comes from the Accessible Onboarding System's embed tag and draws everything a
// learner sees, including its own loading and error messages. This only does what a host page
// does around it:
//   - if the form's script never loaded (the onboarding service is down or unreachable), say so
//     in place of the form, instead of leaving an empty card;
//   - once the form has been sent (`onboarding-submit`), show the page's own "What next?" links.

(function () {
  'use strict';

  document.querySelectorAll('[data-onboarding-slot]').forEach(function (slot) {
    var unavailable = slot.querySelector('[data-onboarding-unavailable]');
    var next = document.querySelector('[data-onboarding-after="' + slot.getAttribute('data-onboarding-slot') + '"]');

    // `load` waits for the async widget script to run, or to fail.
    window.addEventListener('load', function () {
      if (unavailable && !window.customElements.get('onboarding-form')) unavailable.hidden = false;
    });

    // The form's events bubble out of it, so the slot hears them.
    slot.addEventListener('onboarding-submit', function () {
      if (next) next.hidden = false;
    });
  });
})();
