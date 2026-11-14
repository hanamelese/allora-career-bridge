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

/**
 * <onboarding-form form-id="…" public-key="pk_live_…" form-version="3" lang="en">
 *
 * Shows one published version of a partner's form - the same renderer as
 * the dashboard preview - and tells the page what happens through DOM
 * events it can listen for:
 *
 *   onboarding-ready   { formId, version, type }
 *   onboarding-submit  { formId, version, type, submissionId, answers, files }
 *   onboarding-error   { code, message, issues? }
 *
 * When the learner sends the form, the answers an organisation can act on
 * are stored by this API first (`toStorableSubmission`: never private
 * support answers, the referral choice, ID numbers or file contents - a
 * file is stored as its name, size and type). Only once that has worked
 * does the form say "sent" and fire `onboarding-submit`, which carries
 * everything the learner gave, files included, for the page's own use.
 * A referral the learner confirms goes to this API to send the SMS.
 *
 * The Sign up / Sign in form (`type: 'account'`) is never stored here: it
 * holds a password, and signing in is the page's job.
 */
class OnboardingFormElement extends HTMLElement {
  static observedAttributes = ['form-id', 'public-key', 'form-version', 'lang'];

  connectedCallback() {
    if (!this.shadowRoot) {
      const shadow = this.attachShadow({ mode: 'open' });
      const style = document.createElement('style');
      style.textContent = `${HOST_CSS}\n${formCss}`;
      this.mountPoint = document.createElement('div');
      shadow.append(style, this.mountPoint);
    }

    this.root ??= createRoot(this.mountPoint);
    this.load();
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

    let published;
    try {
      published = await api.getForm(formId, version);
    } catch (error) {
      if (loadId !== this.loadId) return;
      this.message(error.message, true);
      this.emit('onboarding-error', { code: error.code, message: error.message });
      return;
    }

    /* A newer load (an attribute changed) has replaced this one. */
    if (loadId !== this.loadId || !this.root) return;

    const { config, referralPartners, organisationName } = published;
    const files = (data) =>
      Object.fromEntries(Object.entries(data).filter(([, value]) => value instanceof File));
    const answers = (data) =>
      Object.fromEntries(Object.entries(data).filter(([, value]) => !(value instanceof File)));

    this.root.render(
      <FormRenderer
        config={config}
        settings={{ language: lang }}
        referral={{
          partners: referralPartners ?? [],
          organisationName: organisationName ?? '',
          onSend: (request) => api.sendReferral(formId, request),
        }}
        onSubmit={(data, extra) => {
          const detail = {
            formId,
            version: published.version,
            type: published.type,
            ...(extra?.mode ? { mode: extra.mode } : {}),
            answers: answers(data),
            files: files(data),
          };

          if (published.type === 'account') {
            this.emit('onboarding-submit', detail);
            return undefined;
          }

          /* Returned to the form, which waits for it: "sent" is only shown
             once the answers are stored, and a failure lets the learner
             press Send again with nothing lost. */
          return api
            .sendSubmission(formId, {
              version: published.version,
              ...(lang === 'en' || lang === 'am' ? { language: lang } : {}),
              answers: toStorableSubmission(config, data),
            })
            .then(
              ({ submissionId }) => this.emit('onboarding-submit', { ...detail, submissionId }),
              (error) => {
                this.emit('onboarding-error', {
                  code: error.code ?? 'submission_failed',
                  message: error.message,
                  ...(error.issues ? { issues: error.issues } : {}),
                });
                throw error;
              },
            );
        }}
      />,
    );

    this.emit('onboarding-ready', { formId, version: published.version, type: published.type });
  }
}

if (!customElements.get('onboarding-form')) {
  customElements.define('onboarding-form', OnboardingFormElement);
}

window.OnboardingWidget = { version: WIDGET_VERSION };
