import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider } from './auth/AuthProvider.jsx';
import { useAuth } from './auth/authContext.js';
import { AppShell } from './components/shell/AppShell.jsx';
import { SignInPage, SignUpPage } from './pages/AuthPage.jsx';
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
 * opened while signed out shows the sign-in in place, and the same link
 * once signed in.
 */
function DashboardRoutes() {
  const { isSignedIn } = useAuth();

  if (!isSignedIn) {
    return <SignInPage />;
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
        </Route>

        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}

/** Pages for someone not signed in; a signed-in partner goes to their forms. */
function PublicOnly({ children }) {
  const { isSignedIn } = useAuth();
  return isSignedIn ? <Navigate to={firstFormPath} replace /> : children;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Opened from a referral SMS by someone with no dashboard
              account, so it sits outside the sign-in. */}
          <Route path="referrals/:token" element={<ReferralPage />} />

          {/* The public front page, and the ways in. */}
          <Route
            index
            element={
              <PublicOnly>
                <LandingPage />
              </PublicOnly>
            }
          />
          <Route
            path="signin"
            element={
              <PublicOnly>
                <SignInPage />
              </PublicOnly>
            }
          />
          <Route
            path="signup"
            element={
              <PublicOnly>
                <SignUpPage />
              </PublicOnly>
            }
          />

          <Route path="*" element={<DashboardRoutes />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
