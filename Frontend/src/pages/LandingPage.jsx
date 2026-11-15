import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  Contrast,
  Globe,
  Handshake,
  Keyboard,
  LayoutDashboard,
  LayoutList,
  LogIn,
  Mic,
  Rocket,
  ScanEye,
  SlidersHorizontal,
  UserPlus,
  Volume2,
} from 'lucide-react';
import { Button } from '../components/ui/Button.jsx';
import { Modal } from '../components/ui/Modal.jsx';
import { PartnerAuthForm } from '../auth/PartnerAuthForm.jsx';
import { useAuth } from '../auth/authContext.js';
import { FORM_TYPES } from '../formTypes.js';
import { BrandMark } from '../components/shell/BrandMark.jsx';
import { AccessibilityBar } from '../components/shell/AccessibilityBar.jsx';
import { SkipLink } from '../components/ui/SkipLink.jsx';
import { useT } from '../i18n/index.js';
/* A licensed copy of Adobe Stock #563796331 should replace this file
   before the site is public; the one here is the watermarked preview. */
import heroImage from '../assets/landing-hero.jpg';
import './LandingPage.css';

const DASHBOARD_PATH = `/forms/${FORM_TYPES[0].slug}/configure`;

/* The text for each item is in i18n/<language>/landing.js, under its id. */
const STEPS = [
  { id: 'account', icon: UserPlus },
  { id: 'configure', icon: SlidersHorizontal },
  { id: 'preview', icon: ScanEye },
  { id: 'publish', icon: Rocket },
];

const FEATURES = [
  { id: 'voice', icon: Mic },
  { id: 'readAloud', icon: Volume2 },
  { id: 'contrast', icon: Contrast },
  { id: 'keyboard', icon: Keyboard },
  { id: 'language', icon: Globe },
  { id: 'noId', icon: Handshake },
];

/* Keyed by form type id: the name is formTypes.<id>.name. */
const FORMS = [
  { id: 'account', icon: LogIn },
  { id: 'signup', icon: LayoutList },
  { id: 'jobApplication', icon: LayoutList },
  { id: 'employer', icon: LayoutList },
];

/**
 * The public front page: what the dashboard does, how a partner gets from
 * nothing to a published, accessible form, and a way to sign up.
 *
 * It is also home for a signed-in partner, who reaches it from the
 * dashboard header and finds a way straight back to their forms.
 *
 * Sign in and Create account open the shared sign-in form in a centred
 * popup. A /signin or /signup link, or a dashboard link opened while
 * signed out, shows this page with the popup already open
 * (`initialAuthMode`); closing it then leaves the visitor on the plain
 * front page.
 */
export function LandingPage({ initialAuthMode = null }) {
  const { isSignedIn } = useAuth();
  const t = useT();
  const navigate = useNavigate();
  const [authMode, setAuthMode] = useState(initialAuthMode);
  const openSignIn = () => setAuthMode('signIn');
  const openSignUp = () => setAuthMode('signUp');

  function closeAuth() {
    setAuthMode(null);
    if (initialAuthMode) navigate('/', { replace: true });
  }

  return (
    <div className="landing">
      <SkipLink />

      <header className="landing__header">
        <div className="landing__bar">
          <Link to="/" className="landing__brand">
            <BrandMark className="landing__logo" />
            <span>
              <span className="landing__product">{t('shell.product')}</span>
              <span className="landing__tagline">{t('shell.tagline')}</span>
            </span>
          </Link>

          <nav className="landing__nav" aria-label={t('landing.nav.label')}>
            <ul role="list">
              <li>
                <a href="#how-it-works">{t('landing.nav.howItWorks')}</a>
              </li>
              <li>
                <a href="#features">{t('landing.nav.features')}</a>
              </li>
              <li>
                <a href="#integrate">{t('landing.nav.integrate')}</a>
              </li>
            </ul>
          </nav>

          <div className="landing__auth">
            {isSignedIn ? (
              <Button as={Link} to={DASHBOARD_PATH} variant="primary" icon={LayoutDashboard}>
                {t('landing.goToDashboard')}
              </Button>
            ) : (
              <>
                <Button variant="ghost" onClick={openSignIn} aria-haspopup="dialog">
                  {t('landing.signIn')}
                </Button>
                <Button variant="primary" onClick={openSignUp} aria-haspopup="dialog">
                  {t('landing.createAccount')}
                </Button>
              </>
            )}
          </div>

          <AccessibilityBar />
        </div>
      </header>

      <main id="main-content" tabIndex={-1}>
        {/* ---- Hero ---- */}
        <section className="landing__hero" aria-labelledby="hero-heading">
          <div className="landing__hero-text">
            <p className="landing__eyebrow">{t('landing.hero.eyebrow')}</p>
            <h1 className="landing__title" id="hero-heading">
              {t('landing.hero.titleBefore')}
              <span className="landing__highlight">{t('landing.hero.titleHighlight')}</span>
              {t('landing.hero.titleAfter')}
            </h1>
            <p className="landing__lead">{t('landing.hero.lead')}</p>

            <div className="landing__cta">
              {isSignedIn ? (
                <Button as={Link} to={DASHBOARD_PATH} variant="primary" className="landing__big-button">
                  {t('landing.goToDashboard')}
                  <ArrowRight className="button__icon" aria-hidden="true" />
                </Button>
              ) : (
                <>
                  <Button variant="primary" className="landing__big-button" onClick={openSignUp} aria-haspopup="dialog">
                    {t('landing.createPartnerAccount')}
                    <ArrowRight className="button__icon" aria-hidden="true" />
                  </Button>
                  <Button variant="secondary" className="landing__big-button" onClick={openSignIn} aria-haspopup="dialog">
                    {t('landing.signIn')}
                  </Button>
                </>
              )}
            </div>

            <ul className="landing__assurances" role="list">
              <li>{t('landing.hero.assurances.wcag')}</li>
              <li>{t('landing.hero.assurances.noTimeLimits')}</li>
              <li>{t('landing.hero.assurances.dataApart')}</li>
            </ul>
          </div>

          <figure className="landing__visual">
            <div className="landing__visual-frame">
              <img
                src={heroImage}
                width="736"
                height="736"
                alt={t('landing.hero.imageAlt')}
              />
            </div>

            <div className="landing__badge landing__badge--top" aria-hidden="true">
              <Mic />
              <span>{t('landing.hero.badgeVoice')}</span>
            </div>
            <div className="landing__badge landing__badge--bottom" aria-hidden="true">
              <Contrast />
              <span>{t('landing.hero.badgeContrast', 4, 4)}</span>
            </div>
          </figure>
        </section>

        {/* ---- Numbers ---- */}
        <section className="landing__stats" aria-label={t('landing.stats.label')}>
          <dl>
            <div>
              <dt>{t('landing.stats.forms')}</dt>
              <dd>4</dd>
            </div>
            <div>
              <dt>{t('landing.stats.languages')}</dt>
              <dd>2</dd>
            </div>
            <div>
              <dt>{t('landing.stats.contrastLevels')}</dt>
              <dd>4</dd>
            </div>
            <div>
              <dt>{t('landing.stats.switches')}</dt>
              <dd>0</dd>
            </div>
          </dl>
        </section>

        {/* ---- How it works ---- */}
        <section className="landing__section" id="how-it-works" aria-labelledby="how-heading">
          <div className="landing__section-head">
            <p className="landing__eyebrow">{t('landing.how.eyebrow')}</p>
            <h2 id="how-heading">{t('landing.how.heading')}</h2>
          </div>

          <ol className="landing__steps" role="list">
            {STEPS.map((step, index) => {
              const Icon = step.icon;

              return (
                <li className="landing__step" key={step.id}>
                  <div className="landing__step-marker">
                    <span className="landing__step-number">{index + 1}</span>
                    <Icon className="landing__step-icon" aria-hidden="true" />
                  </div>
                  <h3>{t(`landing.steps.${step.id}.title`)}</h3>
                  <p>{t(`landing.steps.${step.id}.text`)}</p>
                </li>
              );
            })}
          </ol>
        </section>

        {/* ---- Features ---- */}
        <section className="landing__section landing__section--tinted" id="features" aria-labelledby="features-heading">
          <div className="landing__section-head">
            <p className="landing__eyebrow">{t('landing.featuresSection.eyebrow')}</p>
            <h2 id="features-heading">{t('landing.featuresSection.heading')}</h2>
          </div>

          <ul className="landing__features" role="list">
            {FEATURES.map((feature) => {
              const Icon = feature.icon;

              return (
                <li className="landing__feature" key={feature.id}>
                  <span className="landing__feature-icon" aria-hidden="true">
                    <Icon />
                  </span>
                  <h3>{t(`landing.features.${feature.id}.title`)}</h3>
                  <p>{t(`landing.features.${feature.id}.text`)}</p>
                </li>
              );
            })}
          </ul>
        </section>

        {/* ---- Forms ---- */}
        <section className="landing__section" aria-labelledby="forms-heading">
          <div className="landing__section-head">
            <p className="landing__eyebrow">{t('landing.formsSection.eyebrow')}</p>
            <h2 id="forms-heading">{t('landing.formsSection.heading')}</h2>
          </div>

          <ul className="landing__forms" role="list">
            {FORMS.map((form) => {
              const Icon = form.icon;

              return (
                <li className="landing__form" key={form.id}>
                  <Icon aria-hidden="true" />
                  <div>
                    <h3>{t(`formTypes.${form.id}.name`)}</h3>
                    <p>{t(`landing.forms.${form.id}`)}</p>
                  </div>
                </li>
              );
            })}
          </ul>
        </section>

        {/* ---- Integrate ---- */}
        <section className="landing__section landing__integrate" id="integrate" aria-labelledby="integrate-heading">
          <div className="landing__integrate-text">
            <p className="landing__eyebrow">{t('landing.integrate.eyebrow')}</p>
            <h2 id="integrate-heading">{t('landing.integrate.heading')}</h2>
            <p>{t('landing.integrate.versions')}</p>
            <p>{t('landing.integrate.embed')}</p>
          </div>

          <pre className="landing__code" tabIndex={0} aria-label={t('landing.integrate.codeLabel')}>
            <code>{`GET /api/v1/public/forms/{formId}
x-public-key: pk_live_…

{
  "formId": "frm_…",
  "type": "signup",
  "version": 3,
  "config": { "fields": [ … ] }
}`}</code>
          </pre>
        </section>

        {/* ---- Closing ---- */}
        <section className="landing__closing" aria-labelledby="closing-heading">
          <h2 id="closing-heading">{t('landing.closing.heading')}</h2>
          <p>{t('landing.closing.text')}</p>
          {isSignedIn ? (
            <Button as={Link} to={DASHBOARD_PATH} variant="primary" className="landing__big-button">
              {t('landing.goToDashboard')}
              <ArrowRight className="button__icon" aria-hidden="true" />
            </Button>
          ) : (
            <Button variant="primary" className="landing__big-button" onClick={openSignUp} aria-haspopup="dialog">
              {t('landing.createPartnerAccount')}
              <ArrowRight className="button__icon" aria-hidden="true" />
            </Button>
          )}
        </section>
      </main>

      <footer className="landing__footer">
        <p>
          {t('shell.product')} · {t('shell.tagline')}
        </p>
        {isSignedIn ? null : (
          <p>
            {t('landing.footer.haveAccount')}{' '}
            <button type="button" className="landing__text-button" onClick={openSignIn} aria-haspopup="dialog">
              {t('landing.signIn')}
            </button>
          </p>
        )}
      </footer>

      <Modal
        isOpen={authMode !== null && !isSignedIn}
        onClose={closeAuth}
        label={
          authMode === 'signIn'
            ? t('landing.modal.signInTo', t('shell.product'))
            : t('landing.createPartnerAccount')
        }
        header={
          <span className="modal__brand">
            <BrandMark className="modal__brand-mark" />
            {t('shell.product')}
          </span>
        }
      >
        {authMode ? <PartnerAuthForm mode={authMode} onModeChange={setAuthMode} /> : null}
      </Modal>
    </div>
  );
}
