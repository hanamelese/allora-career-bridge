// "Full view" for the embedded forms: opens the form's own card as a large pop-up over a blurred
// page, and back again.
//
// The card is restyled where it is rather than moved into a <dialog>: moving the <onboarding-form>
// element would restart it, and the learner would lose the question they were on. While it is open:
//   - the card is announced as a modal dialog, named by its existing heading;
//   - everything else on the page is `inert`, so Tab, a screen reader and the mouse stay inside;
//   - Escape, the Close button or a click on the blurred page closes it, and focus returns to
//     the Full view button.
//
// Markup: a <button data-full-view-open="ID" hidden> before the card, and the card with id="ID".
// The button stays hidden if this script does not run, so nothing is offered that cannot work.

(function () {
  'use strict';

  var EXPAND_ICON =
    '<svg aria-hidden="true" focusable="false" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7"/></svg>';
  var CLOSE_ICON =
    '<svg aria-hidden="true" focusable="false" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18M6 6l12 12"/></svg>';

  var openState = null;

  var FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

  /* The last control a keyboard can reach in the card, looking inside the form's shadow root too. */
  function lastFocusable(root) {
    var found = null;
    (function walk(node) {
      var children = node.shadowRoot ? node.shadowRoot.children : node.children;
      for (var i = 0; i < children.length; i++) {
        var child = children[i];
        if (child.hasAttribute('data-full-view-edge')) continue;
        if (child.matches(FOCUSABLE) && child.getClientRects().length) found = child;
        walk(child);
      }
    })(root);
    return found;
  }

  /* Invisible stops at both ends of the card: reaching one sends focus round to the other end, so
     Tab and Shift+Tab go round inside the pop-up instead of out to the browser. */
  function edge(onFocus) {
    var stop = document.createElement('span');
    stop.tabIndex = 0;
    stop.setAttribute('data-full-view-edge', '');
    stop.className = 'full-view-edge';
    stop.addEventListener('focus', onFocus);
    return stop;
  }

  /* Everything outside the card's own branch of the page, made inert. Only what this script made
     inert is restored afterwards. */
  function makeRestInert(card) {
    var changed = [];
    var node = card;
    while (node && node !== document.body) {
      var parent = node.parentElement;
      if (!parent) break;
      for (var i = 0; i < parent.children.length; i++) {
        var sibling = parent.children[i];
        if (sibling === node || sibling.inert || sibling.tagName === 'SCRIPT' || sibling.tagName === 'STYLE') continue;
        sibling.inert = true;
        changed.push(sibling);
      }
      node = parent;
    }
    return changed;
  }

  function close() {
    if (!openState) return;
    var state = openState;
    openState = null;

    state.card.classList.remove('is-full-view');
    state.card.removeAttribute('role');
    state.card.removeAttribute('aria-modal');
    state.closeButton.remove();
    state.edges.forEach(function (stop) {
      stop.remove();
    });
    state.backdrop.remove();
    state.inert.forEach(function (element) {
      element.inert = false;
    });
    document.documentElement.classList.remove('full-view-open');
    document.removeEventListener('keydown', onKeyDown);
    state.opener.setAttribute('aria-expanded', 'false');
    state.opener.focus();
  }

  function onKeyDown(event) {
    // A panel inside the form that handles Escape itself (its settings) stops it first.
    if (event.key === 'Escape' && !event.defaultPrevented) {
      event.preventDefault();
      close();
    }
  }

  function open(opener, card) {
    if (openState) return;

    var backdrop = document.createElement('div');
    backdrop.className = 'full-view-backdrop';
    backdrop.addEventListener('click', close);

    var closeButton = document.createElement('button');
    closeButton.type = 'button';
    closeButton.className = 'full-view-close';
    closeButton.innerHTML = CLOSE_ICON + '<span>Close full view</span>';
    closeButton.addEventListener('click', close);

    var startEdge = edge(function () {
      (lastFocusable(card) || closeButton).focus();
    });
    var endEdge = edge(function () {
      closeButton.focus();
    });

    openState = {
      opener: opener,
      card: card,
      backdrop: backdrop,
      closeButton: closeButton,
      edges: [startEdge, endEdge],
      inert: makeRestInert(card),
    };

    document.body.append(backdrop);
    card.prepend(startEdge, closeButton);
    card.append(endEdge);
    card.setAttribute('role', 'dialog');
    card.setAttribute('aria-modal', 'true');
    card.classList.add('is-full-view');
    document.documentElement.classList.add('full-view-open');
    document.addEventListener('keydown', onKeyDown);
    opener.setAttribute('aria-expanded', 'true');
    closeButton.focus();
  }

  var openers = document.querySelectorAll('[data-full-view-open]');
  Array.prototype.forEach.call(openers, function (opener) {
    var card = document.getElementById(opener.getAttribute('data-full-view-open'));
    if (!card) return;
    opener.innerHTML = EXPAND_ICON + '<span>Full view</span>';
    opener.setAttribute('aria-expanded', 'false');
    opener.hidden = false;
    opener.addEventListener('click', function () {
      open(opener, card);
    });
  });
})();
