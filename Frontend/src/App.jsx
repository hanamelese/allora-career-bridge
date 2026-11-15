import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider } from './auth/AuthProvider.jsx';
import { DisplayProvider } from './display/DisplayProvider.jsx';
import { useAuth } from './auth/authContext.js';
import { AppShell } from './components/shell/AppShell.jsx';
import { LandingPage } from './pages/LandingPage.jsx';
import { FormWorkspace } from './pages/FormWorkspace.jsx';
import { ConfigurePage } from './pages/ConfigurePage.jsx';
import { PreviewPage } from './pages/PreviewPage.jsx';
import { PublishPage } from './pages/PublishPage.jsx';
import { EmbedPage } from './pages/EmbedPage.jsx';
import { NotFoundPage } from './pages/NotFoundPage.jsx';
import { OrganisationPage } from './pages/OrganisationPage.jsx';
import { ReferralPage } from './pages/ReferralPage.jsx';
import { FORM_TYPES } from './formTypes.js';

const firstFormPath = `/forms/${FORM_TYPES[0].slug}/configure`;

/**
 * Routes are the dashboard's state: a partner can bookmark or share a link
 * to one form and one step of the workflow.
 *
 * Everything sits behind a sign-in, because these are a partner's own form
 * configurations and the API scopes every query to them. A deep link
 * opened while signed out shows the front page with the sign-in popup
 * open, and the same link once signed in.
 */
function DashboardRoutes() {
  const { isSignedIn } = useAuth();

  if (!isSignedIn) {
    return <LandingPage initialAuthMode="signIn" />;
  }

  return (
    <Routes>
      <Route element={<AppShell />}>
        <Route index element={<Navigate to={firstFormPath} replace />} />

        <Route path="organisation" element={<OrganisationPage />} />

        <Route path="forms/:formSlug" element={<FormWorkspace />}>
          <Route index element={<Navigate to="configure" replace />} />
          <Route path="configure" element={<ConfigurePage />} />
          <Route path="preview" element={<PreviewPage />} />
          <Route path="publish" element={<PublishPage />} />
          <Route path="embed" element={<EmbedPage />} />
          {/* The Submissions view is no longer offered here (its data and
              API are unchanged pending the privacy review); an old link
              lands on Configure. */}
          <Route path="submissions" element={<Navigate to="../configure" replace />} />
        </Route>

        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}

/** The ways in, for someone not signed in; a signed-in partner goes to their forms. */
function PublicOnly({ children }) {
  const { isSignedIn } = useAuth();
  return isSignedIn ? <Navigate to={firstFormPath} replace /> : children;
}

export default function App() {
  return (
    <DisplayProvider>
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Opened from a referral SMS by someone with no dashboard
              account, so it sits outside the sign-in. */}
          <Route path="referrals/:token" element={<ReferralPage />} />

          {/* The front page - also home for a signed-in partner - and the
              ways in, which open it with the sign-in popup showing. */}
          <Route index element={<LandingPage />} />
          <Route
            path="signin"
            element={
              <PublicOnly>
                <LandingPage key="signIn" initialAuthMode="signIn" />
              </PublicOnly>
            }
          />
          <Route
            path="signup"
            element={
              <PublicOnly>
                <LandingPage key="signUp" initialAuthMode="signUp" />
              </PublicOnly>
            }
          />

          <Route path="*" element={<DashboardRoutes />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
    </DisplayProvider>
  );
}
