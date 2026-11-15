import { createRoot } from 'react-dom/client';
import { FormRenderer } from '@onboarding/form-engine/react';
/* The form's styles go inside the element's shadow root, so the partner's
   own CSS cannot break the form and the form's cannot touch their page. */
import formCss from '@onboarding/form-engine/react/form-engine.css?inline';
import { toStorableSubmission } from '@onboarding/contracts/submissions.js';
import { createPublicApi } from './publicApi.js';

const WIDGET_VERSION = 'v1';

/* Where this script was loaded from is where the API is. Read now: once
   the script has run, `document.currentScript` is gone. */
const scriptSrc =
  document.currentScript?.src ??
  [...document.scripts].map((script) => script.src).find((src) => src.includes('onboarding-widget')) ??
  window.location.href;

const MESSAGES = {
  en: {
    loading: 'Loading the form…',
    missing: 'This form is missing its form-id or public-key, so it cannot load.',
  },
  am: {
    loading: 'ቅጹ በመጫን ላይ…',
    missing: 'ይህ ቅጽ form-id ወይም public-key ስለሌለው ሊጫን አይችልም።',
  },
};

const HOST_CSS = `
  :host { display: block; }
  :host([hidden]) { display: none; }
  .ow-message { margin: 0; padding: 1rem; font-family: system-ui, sans-serif; line-height: 1.5; color: #002b56; }
  .ow-message--error { border: 2px solid #9b1c1c; border-radius: 8px; background: #fdf2f2; }
`;

/* The form sizes its text in rem. A page that shrinks its root font (the
   Savanna portal sets 14px) would shrink the whole form with it, so the
   widget measures that and puts it back: --fe-root-fix (set in fitText)
   is folded into every text size, the A-/A/A+ setting included. It only
   ever enlarges, back to the reader's own browser default. */
const TEXT_FIX_CSS = `
  .fe-form { --fe-scale: var(--fe-root-fix, 1); }
  .fe-form[data-text-size='small'] { --fe-scale: calc(0.875 * var(--fe-root-fix, 1)); }
  .fe-form[data-text-size='large'] { --fe-scale: calc(1.25 * var(--fe-root-fix, 1)); }
`;

/**
 * <onboarding-form form-id="…" public-key="pk_live_…" form-version="3" lang="en">
 *
 * Shows one published version of a partner's form - the same renderer as
 * the dashboard preview - and tells the page what happens through DOM
 * events it can listen for:
 *
 *   onboarding-ready   { formId, version, type }
 *   onboarding-submit  { formId, version, type, mode?, answers, files, delivered, receiptId, waitUntil }
 *   onboarding-sent    { formId, version, type, receiptId }   the form now says "sent"
 *   onboarding-mode    { formId, mode }      a Sign up / Sign in form switched mode
 *   onboarding-error   { code, message, issues? }
 *
 * When the learner sends the form, the page receives every answer as JSON
 * in `onboarding-submit` (files as File objects), and can make the form
 * wait for its own save with `waitUntil` - see `submit()` below. If the
 * organisation also set a delivery address, the answers it can act on go
 * from this browser straight there first. This service never receives or
 * keeps a learner's answers. A referral the learner confirms goes to this
 * API to send the SMS.
 *
 * <onboarding-form mode="signUp|signIn"> opens a Sign up / Sign in form in
 * that mode; its own "Create an account" / "Sign in" link switches it. That
 * form is never delivered: it holds a password, and signing in is the
 * page's job.
 */
class OnboardingFormElement extends HTMLElement {
  static observedAttributes = ['form-id', 'public-key', 'form-version', 'lang', 'mode'];

  connectedCallback() {
    if (!this.shadowRoot) {
      const shadow = this.attachShadow({ mode: 'open' });
      const style = document.createElement('style');
      style.textContent = `${HOST_CSS}\n${formCss}\n${TEXT_FIX_CSS}`;
      this.mountPoint = document.createElement('div');
      shadow.append(style, this.mountPoint);
    }

    this.fitText();

    this.root ??= createRoot(this.mountPoint);
    this.load();
  }

  /** Undo a page's smaller root font size inside the form (see TEXT_FIX_CSS). */
  fitText() {
    const probe = document.createElement('span');
    probe.style.cssText = 'position:absolute;visibility:hidden;font-size:medium';
    this.shadowRoot.append(probe);
    const browserDefault = parseFloat(getComputedStyle(probe).fontSize);
    probe.remove();
    const pageRoot = parseFloat(getComputedStyle(document.documentElement).fontSize);
    const fix = pageRoot > 0 && browserDefault > pageRoot ? browserDefault / pageRoot : 1;
    this.mountPoint.style.setProperty('--fe-root-fix', String(Math.round(fix * 1000) / 1000));
  }

  disconnectedCallback() {
    this.root?.unmount();
    this.root = null;
  }

  attributeChangedCallback(_name, oldValue, newValue) {
    if (this.root && oldValue !== newValue) this.load();
  }

  emit(type, detail) {
    this.dispatchEvent(new CustomEvent(type, { detail, bubbles: true, composed: true }));
  }

  message(text, isError = false) {
    this.root?.render(
      <p className={`ow-message${isError ? ' ow-message--error' : ''}`} role={isError ? 'alert' : 'status'}>
        {text}
      </p>,
    );
  }

  async load() {
    const formId = this.getAttribute('form-id');
    const publicKey = this.getAttribute('public-key');
    const version = this.getAttribute('form-version');
    const lang = this.getAttribute('lang') ?? 'en';
    const copy = MESSAGES[lang] ?? MESSAGES.en;
    const loadId = (this.loadId = (this.loadId ?? 0) + 1);

    if (!formId || !publicKey) {
      this.message(copy.missing, true);
      this.emit('onboarding-error', { code: 'missing_attributes', message: copy.missing });
      return;
    }

    this.message(copy.loading);
    const api = createPublicApi({ scriptSrc, apiOrigin: this.getAttribute('api-origin'), publicKey });

    /* A mode switch (Sign in <-> Sign up) re-renders the same form without
       fetching it again. */
    const cacheKey = `${api.origin}|${publicKey}|${formId}|${version ?? ''}`;
    let published = this.cache?.key === cacheKey ? this.cache.published : null;
    try {
      published ??= await api.getForm(formId, version);
      this.cache = { key: cacheKey, published };
    } catch (error) {
      if (loadId !== this.loadId) return;
      this.message(error.message, true);
      this.emit('onboarding-error', { code: error.code, message: error.message });
      return;
    }

    /* A newer load (an attribute changed) has replaced this one. */
    if (loadId !== this.loadId || !this.root) return;

    const { referralPartners, organisationName, delivery = false } = published;
    /* A Sign up / Sign in form opens in the mode its `mode` attribute asks
       for, or else the one it was published with. */
    const mode = this.getAttribute('mode');
    const config =
      published.type === 'account' && (mode === 'signIn' || mode === 'signUp')
        ? { ...published.config, account: { ...published.config.account, mode } }
        : published.config;
    this.root.render(
      <FormRenderer
        /* A new mode, or a new lang attribute, starts the form afresh in it
           (answers so far come back from this tab's saved progress). */
        key={`${config.account?.mode ?? 'form'}|${lang}`}
        config={config}
        settings={{ language: lang }}
        voice={(text, language, options) => api.speech(formId, text, language, options)}
        referral={{
          partners: referralPartners ?? [],
          organisationName: organisationName ?? '',
          onSend: (request) => api.sendReferral(formId, request),
        }}
        onSwitchMode={
          published.type === 'account'
            ? (next) => {
                this.emit('onboarding-mode', { formId, mode: next });
                this.setAttribute('mode', next);
              }
            : undefined
        }
        onSubmit={(data, extra) => this.submit({ api, formId, published, config, lang, delivery, data, extra })}
      />,
    );

    this.emit('onboarding-ready', { formId, version: published.version, type: published.type });
  }

  /**
   * What happens when the learner sends the form. Returned to the form,
   * which waits for it: "sent" is shown only once everything here has
   * worked, and a failure lets the learner press Send again with nothing
   * lost.
   *
   * 1. Only if the organisation set a delivery address: the answers an
   *    organisation can act on go from this browser straight to it.
   * 2. Always: `onboarding-submit` hands the page every answer as plain
   *    JSON (`answers`) and the files as File objects (`files`). The page
   *    may call `event.detail.waitUntil(promise)` - for its own save - and
   *    the form waits for that too. A Sign up / Sign in page can resolve it
   *    with `{ errors: { email: '…' } }` or `{ message }` to show a problem.
   *
   * This service never receives the answers.
   */
  async submit({ api, formId, published, config, lang, delivery, data, extra }) {
    const files = Object.fromEntries(Object.entries(data).filter(([, value]) => value instanceof File));
    const answers = Object.fromEntries(Object.entries(data).filter(([, value]) => !(value instanceof File)));
    const isAccount = published.type === 'account';

    const fail = (error, code) => {
      this.emit('onboarding-error', {
        code: error?.code ?? code,
        message: error?.message ?? 'The answers could not be sent.',
        ...(error?.issues ? { issues: error.issues } : {}),
      });
      throw error instanceof Error ? error : new Error(String(error?.message ?? code));
    };

    /* 1. The organisation's own server, if it has one. Not repeated when
       the learner presses Send again only because the page's part failed. */
    let receiptId = null;
    if (!isAccount && delivery) {
      const storable = toStorableSubmission(config, data);
      const sameAnswers = JSON.stringify(storable);
      if (this.delivered?.answers === sameAnswers) {
        receiptId = this.delivered.receiptId;
      } else {
        try {
          ({ receiptId } = await api.deliver(formId, {
            version: published.version,
            type: published.type,
            language: lang === 'en' || lang === 'am' ? lang : undefined,
            answers: storable,
          }));
          this.delivered = { answers: sameAnswers, receiptId };
        } catch (error) {
          fail(error, 'delivery_failed');
        }
      }
    }

    /* 2. The page. */
    const waits = [];
    this.emit('onboarding-submit', {
      formId,
      version: published.version,
      type: published.type,
      ...(extra?.mode ? { mode: extra.mode } : {}),
      answers,
      files,
      delivered: Boolean(receiptId) || (!isAccount && delivery),
      receiptId,
      waitUntil(promise) {
        waits.push(Promise.resolve(promise));
      },
    });

    let results;
    try {
      results = await Promise.all(waits);
    } catch (error) {
      return fail(error, 'page_failed');
    }

    this.delivered = null;
    /* A sign-in page's answer about the details, if it gave one. */
    const problem = results.find((result) => result && (result.errors || result.message));
    if (!problem) {
      /* Everything worked: the form now says "sent". */
      this.emit('onboarding-sent', { formId, version: published.version, type: published.type, receiptId });
    }
    return problem ?? undefined;
  }
}

if (!customElements.get('onboarding-form')) {
  customElements.define('onboarding-form', OnboardingFormElement);
}

window.OnboardingWidget = { version: WIDGET_VERSION };
