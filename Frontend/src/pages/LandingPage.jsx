import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  Contrast,
  Globe,
  Handshake,
  Keyboard,
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
import { SkipLink } from '../components/ui/SkipLink.jsx';
/* A licensed copy of Adobe Stock #563796331 should replace this file
   before the site is public; the one here is the watermarked preview. */
import heroImage from '../assets/landing-hero.jpg';
import './LandingPage.css';

const STEPS = [
  {
    icon: UserPlus,
    title: 'Create your partner account',
    text: 'Sign up with your organisation’s name. You get your own copy of every form and your own keys, kept apart from every other partner.',
  },
  {
    icon: SlidersHorizontal,
    title: 'Configure your forms',
    text: 'Choose which questions to ask, reword them, add your own, and list the referral partners learners can be sent to.',
  },
  {
    icon: ScanEye,
    title: 'Preview exactly what people see',
    text: 'Try the real form with voice, keyboard, contrast levels, larger text and Amharic before anyone else does.',
  },
  {
    icon: Rocket,
    title: 'Publish and embed',
    text: 'Publish a version and place it on your site with your public key. Published versions never change under you.',
  },
];

const FEATURES = [
  {
    icon: Mic,
    title: 'Answer by speaking',
    text: 'Spoken answers are typed into the field or matched to a choice. A guess is always confirmed first.',
  },
  {
    icon: Volume2,
    title: 'Read aloud',
    text: 'Every question, and every answer given, can be heard, in English or Amharic.',
  },
  {
    icon: Contrast,
    title: 'Contrast and text size',
    text: 'Four contrast levels from WCAG AA to yellow on black, and three text sizes, chosen by the learner.',
  },
  {
    icon: Keyboard,
    title: 'Keyboard and screen readers',
    text: 'Every control is reachable by Tab, named for NVDA and other screen readers, with a focus ring you can always see.',
  },
  {
    icon: Globe,
    title: 'Amharic and English',
    text: 'Learners switch language at any point, and simple words make every question easier to follow.',
  },
  {
    icon: Handshake,
    title: 'A way through without ID',
    text: 'A learner with no document can ask one of your referral partners for help, by text message, at the end of the form.',
  },
];

const FORMS = [
  { icon: LogIn, name: 'Sign up / Sign in', text: 'An accessible sign-in for your own site, with Google, LinkedIn and more.' },
  { icon: LayoutList, name: 'Learner Registration & Profile', text: 'Who the learner is, their background, and private support requests.' },
  { icon: LayoutList, name: 'Job Application', text: 'Applications with voice answers and private interview accommodations.' },
  { icon: LayoutList, name: 'Employer & Workplace Accessibility', text: 'Organisation details and the accommodations a workplace offers.' },
];

/**
 * The public front page: what the dashboard does, how a partner gets from
 * nothing to a published, accessible form, and a way to sign up.
 */
export function LandingPage() {
  /* Sign in and Create account open the shared sign-in form in a popup,
     so nobody has to leave this page to start. /signin and /signup still
     work as pages for links and bookmarks. */
  const [authMode, setAuthMode] = useState(null);
  const openSignIn = () => setAuthMode('signIn');
  const openSignUp = () => setAuthMode('signUp');

  return (
    <div className="landing">
      <SkipLink />

      <header className="landing__header">
        <div className="landing__bar">
          <Link to="/" className="landing__brand">
            <span className="landing__logo" aria-hidden="true">
              AO
            </span>
            <span>
              <span className="landing__product">Partner Dashboard</span>
              <span className="landing__tagline">Accessible Onboarding</span>
            </span>
          </Link>

          <nav className="landing__nav" aria-label="Main">
            <ul role="list">
              <li>
                <a href="#how-it-works">How it works</a>
              </li>
              <li>
                <a href="#features">Features</a>
              </li>
              <li>
                <a href="#integrate">Integrate</a>
              </li>
            </ul>
          </nav>

          <div className="landing__auth">
            <Button variant="ghost" onClick={openSignIn} aria-haspopup="dialog">
              Sign in
            </Button>
            <Button variant="primary" onClick={openSignUp} aria-haspopup="dialog">
              Create account
            </Button>
          </div>
        </div>
      </header>

      <main id="main-content" tabIndex={-1}>
        {/* ---- Hero ---- */}
        <section className="landing__hero" aria-labelledby="hero-heading">
          <div className="landing__hero-text">
            <p className="landing__eyebrow">For training providers, employers and NGOs</p>
            <h1 className="landing__title" id="hero-heading">
              Forms that <span className="landing__highlight">everyone</span> can fill in.
            </h1>
            <p className="landing__lead">
              Build sign-up, registration and job application forms that work by voice, by keyboard
              and with a screen reader, in Amharic or English. Accessibility is built in, so it is
              never a setting someone forgets to switch on.
            </p>

            <div className="landing__cta">
              <Button variant="primary" className="landing__big-button" onClick={openSignUp} aria-haspopup="dialog">
                Create a partner account
                <ArrowRight className="button__icon" aria-hidden="true" />
              </Button>
              <Button variant="secondary" className="landing__big-button" onClick={openSignIn} aria-haspopup="dialog">
                Sign in
              </Button>
            </div>

            <ul className="landing__assurances" role="list">
              <li>WCAG 2.2 AA in every form</li>
              <li>No time limits</li>
              <li>Your data kept apart</li>
            </ul>
          </div>

          <figure className="landing__visual">
            <div className="landing__visual-frame">
              <img
                src={heroImage}
                width="736"
                height="736"
                alt="A woman in a wheelchair uses a tablet beside screens showing accessibility symbols: an eye for low vision, a wheelchair, and a speaker for sound."
              />
            </div>

            <div className="landing__badge landing__badge--top" aria-hidden="true">
              <Mic />
              <span>“I have a passport”</span>
            </div>
            <div className="landing__badge landing__badge--bottom" aria-hidden="true">
              <Contrast />
              <span>Contrast level 4 of 4</span>
            </div>
          </figure>
        </section>

        {/* ---- Numbers ---- */}
        <section className="landing__stats" aria-label="At a glance">
          <dl>
            <div>
              <dt>Ready-made forms</dt>
              <dd>4</dd>
            </div>
            <div>
              <dt>Languages</dt>
              <dd>2</dd>
            </div>
            <div>
              <dt>Contrast levels</dt>
              <dd>4</dd>
            </div>
            <div>
              <dt>Accessibility switches to forget</dt>
              <dd>0</dd>
            </div>
          </dl>
        </section>

        {/* ---- How it works ---- */}
        <section className="landing__section" id="how-it-works" aria-labelledby="how-heading">
          <div className="landing__section-head">
            <p className="landing__eyebrow">How it works</p>
            <h2 id="how-heading">From sign-up to a published form in four steps</h2>
          </div>

          <ol className="landing__steps" role="list">
            {STEPS.map((step, index) => {
              const Icon = step.icon;

              return (
                <li className="landing__step" key={step.title}>
                  <div className="landing__step-marker">
                    <span className="landing__step-number">{index + 1}</span>
                    <Icon className="landing__step-icon" aria-hidden="true" />
                  </div>
                  <h3>{step.title}</h3>
                  <p>{step.text}</p>
                </li>
              );
            })}
          </ol>
        </section>

        {/* ---- Features ---- */}
        <section className="landing__section landing__section--tinted" id="features" aria-labelledby="features-heading">
          <div className="landing__section-head">
            <p className="landing__eyebrow">What people filling in your forms get</p>
            <h2 id="features-heading">Built for disabled learners, better for everyone</h2>
          </div>

          <ul className="landing__features" role="list">
            {FEATURES.map((feature) => {
              const Icon = feature.icon;

              return (
                <li className="landing__feature" key={feature.title}>
                  <span className="landing__feature-icon" aria-hidden="true">
                    <Icon />
                  </span>
                  <h3>{feature.title}</h3>
                  <p>{feature.text}</p>
                </li>
              );
            })}
          </ul>
        </section>

        {/* ---- Forms ---- */}
        <section className="landing__section" aria-labelledby="forms-heading">
          <div className="landing__section-head">
            <p className="landing__eyebrow">Included</p>
            <h2 id="forms-heading">Four forms, ready to configure</h2>
          </div>

          <ul className="landing__forms" role="list">
            {FORMS.map((form) => {
              const Icon = form.icon;

              return (
                <li className="landing__form" key={form.name}>
                  <Icon aria-hidden="true" />
                  <div>
                    <h3>{form.name}</h3>
                    <p>{form.text}</p>
                  </div>
                </li>
              );
            })}
          </ul>
        </section>

        {/* ---- Integrate ---- */}
        <section className="landing__section landing__integrate" id="integrate" aria-labelledby="integrate-heading">
          <div className="landing__integrate-text">
            <p className="landing__eyebrow">Integrate</p>
            <h2 id="integrate-heading">One public key, one published version</h2>
            <p>
              Each published form has a fixed version number, so a site pinned to it keeps getting
              exactly what was published. Your public key only reads your own published forms; your
              secret key never leaves the server.
            </p>
            <p>
              Each form’s Embed tag page gives you a two-line tag to paste into your site; the form then
              hands each submission, with any files, to your page’s own code. The published
              configuration is also available directly from the public API:
            </p>
          </div>

          <pre className="landing__code" tabIndex={0} aria-label="Example request for a published form">
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
          <h2 id="closing-heading">Ready to make your forms work for everyone?</h2>
          <p>It takes a minute to create an account, and your forms are ready to configure straight away.</p>
          <Button variant="primary" className="landing__big-button" onClick={openSignUp} aria-haspopup="dialog">
            Create a partner account
            <ArrowRight className="button__icon" aria-hidden="true" />
          </Button>
        </section>
      </main>

      <footer className="landing__footer">
        <p>Partner Dashboard · Accessible Onboarding</p>
        <p>
          Already have an account?{' '}
          <button type="button" className="landing__text-button" onClick={openSignIn} aria-haspopup="dialog">
            Sign in
          </button>
        </p>
      </footer>

      <Modal
        isOpen={authMode !== null}
        onClose={() => setAuthMode(null)}
        label={authMode === 'signIn' ? 'Sign in to the Partner Dashboard' : 'Create a partner account'}
      >
        {authMode ? <PartnerAuthForm mode={authMode} onModeChange={setAuthMode} /> : null}
      </Modal>
    </div>
  );
}
