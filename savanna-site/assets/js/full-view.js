// "Full view" for the embedded forms: a pop-up window over the blurred page, with the form shown
// inside it at its normal size, as in Allora Accessibility Bridge's own preview.
//
// The form's card is never moved into the window: moving the <onboarding-form> element would
// restart it, and the learner would lose the question they were on. Instead the window is drawn
// over the page and the card is pinned in the middle of the window's body, at the width it had on
// the page, scrolling there. While it is open:
//   - the window is a modal dialog named by its header, and owns the card (aria-owns), so a screen
//     reader meets the form inside the dialog;
//   - everything else on the page is `inert`; Tab and Shift+Tab go round the close button and the
//     form only;
//   - Escape, the close button or a click on the blurred page closes it, and focus returns to the
//     Full view button.
//
// Markup: a <button data-full-view-open="ID" hidden> before the card, and the card with id="ID".
// The button stays hidden if this script does not run, so nothing is offered that cannot work.

(function () {
  'use strict';

  var EXPAND_ICON =
    '<svg aria-hidden="true" focusable="false" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7"/></svg>';
  var CLOSE_ICON =
    '<svg aria-hidden="true" focusable="false" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18M6 6l12 12"/></svg>';
  var FOCUSABLE =
    'a[href], button:not([disabled]), input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

  var openState = null;
  var counter = 0;

  /* The controls a keyboard can reach in the card, looking inside the form's shadow root too. */
  function focusables(root) {
    var found = [];
    (function walk(node) {
      var children = node.shadowRoot ? node.shadowRoot.children : node.children;
      for (var i = 0; i < children.length; i++) {
        var child = children[i];
        if (child.hasAttribute('data-full-view-edge')) continue;
        if (child.matches(FOCUSABLE) && child.getClientRects().length) found.push(child);
        walk(child);
      }
    })(root);
    return found;
  }

  /* An invisible focus stop: reaching it sends focus on round the loop. */
  function edge(onFocus) {
    var stop = document.createElement('span');
    stop.tabIndex = 0;
    stop.setAttribute('data-full-view-edge', '');
    stop.className = 'full-view-edge';
    stop.addEventListener('focus', onFocus);
    return stop;
  }

  /* Everything outside the card's own branch of the page, made inert. Only what this script made
     inert is restored afterwards. The window and backdrop are added after this, so stay usable. */
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

  /* The window is named after the form: the heading the card is labelled by, else a heading in the
     card, else the page's own heading ("Full view · Register with ALX"). */
  function cardName(card) {
    var labelled = card.getAttribute('aria-labelledby');
    var heading =
      (labelled && document.getElementById(labelled)) ||
      card.querySelector('h1, h2, h3') ||
      document.querySelector('main h1, h1');
    var text = heading ? heading.textContent : '';
    return text.replace(/\s+/g, ' ').trim();
  }

  /* Pins the card in the middle of the window's body, at its page width or narrower if needed. */
  function place() {
    if (!openState) return;
    var area = openState.body.getBoundingClientRect();
    var gutter = area.width < 480 ? 8 : 24;
    var width = Math.min(openState.width, area.width - gutter * 2);
    var card = openState.card;
    card.style.left = Math.round(area.left + (area.width - width) / 2) + 'px';
    card.style.top = Math.round(area.top + gutter) + 'px';
    card.style.width = Math.round(width) + 'px';
    card.style.maxHeight = Math.round(area.height - gutter * 2) + 'px';
  }

  function close() {
    if (!openState) return;
    var state = openState;
    openState = null;

    var card = state.card;
    card.classList.remove('is-full-view');
    ['left', 'top', 'width', 'maxHeight'].forEach(function (property) {
      card.style[property] = '';
    });
    if (state.addedId) card.removeAttribute('id');
    state.cardEdge.remove();
    state.win.remove();
    state.backdrop.remove();
    state.inert.forEach(function (element) {
      element.inert = false;
    });
    document.documentElement.classList.remove('full-view-open');
    document.removeEventListener('keydown', onKeyDown);
    window.removeEventListener('resize', place);
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
    counter += 1;

    // Measured before anything changes: the size the form has on the page.
    var width = card.getBoundingClientRect().width;
    var addedId = !card.id;
    if (addedId) card.id = 'full-view-card-' + counter;
    var titleId = 'full-view-title-' + counter;

    var backdrop = document.createElement('div');
    backdrop.className = 'full-view-backdrop';
    backdrop.addEventListener('click', close);

    var win = document.createElement('div');
    win.className = 'full-view-window';
    win.setAttribute('role', 'dialog');
    win.setAttribute('aria-modal', 'true');
    win.setAttribute('aria-labelledby', titleId);
    win.setAttribute('aria-owns', card.id);

    var header = document.createElement('div');
    header.className = 'full-view-window__top';
    var title = document.createElement('h2');
    title.className = 'full-view-window__title';
    title.id = titleId;
    title.innerHTML = '<strong>Full view</strong>';
    var name = cardName(card);
    if (name) {
      var nameSpan = document.createElement('span');
      nameSpan.className = 'full-view-window__name';
      nameSpan.textContent = ' · ' + name;
      title.append(nameSpan);
    }
    var closeButton = document.createElement('button');
    closeButton.type = 'button';
    closeButton.className = 'full-view-close';
    closeButton.setAttribute('aria-label', 'Close full view');
    closeButton.innerHTML = CLOSE_ICON;
    closeButton.addEventListener('click', close);
    header.append(title, closeButton);

    var body = document.createElement('div');
    body.className = 'full-view-window__body';

    // The loop: [start] close [after close] -> the form -> [card end] -> close.
    var startEdge = edge(function () {
      var all = focusables(card);
      (all[all.length - 1] || closeButton).focus();
    });
    var afterClose = edge(function () {
      (focusables(card)[0] || closeButton).focus();
    });
    var cardEdge = edge(function () {
      closeButton.focus();
    });

    win.append(startEdge, header, afterClose, body);

    openState = {
      opener: opener,
      card: card,
      width: width,
      addedId: addedId,
      backdrop: backdrop,
      win: win,
      body: body,
      cardEdge: cardEdge,
      inert: makeRestInert(card),
    };

    document.body.append(backdrop, win);
    card.append(cardEdge);
    card.classList.add('is-full-view');
    document.documentElement.classList.add('full-view-open');
    place();
    document.addEventListener('keydown', onKeyDown);
    window.addEventListener('resize', place);
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
