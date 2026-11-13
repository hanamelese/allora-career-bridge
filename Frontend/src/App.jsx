import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider } from './auth/AuthProvider.jsx';
import { useAuth } from './auth/authContext.js';
import { AppShell } from './components/shell/AppShell.jsx';
import { SignInPage } from './pages/SignInPage.jsx';
import { FormWorkspace } from './pages/FormWorkspace.jsx';
import { ConfigurePage } from './pages/ConfigurePage.jsx';
import { PreviewPage } from './pages/PreviewPage.jsx';
import { PublishPage } from './pages/PublishPage.jsx';
import { NotFoundPage } from './pages/NotFoundPage.jsx';
import { FORM_TYPES } from './formTypes.js';

const firstFormPath = `/forms/${FORM_TYPES[0].slug}/configure`;

/**
 * Routes are the dashboard's state: a partner can bookmark or share a link
 * to one form and one step of the workflow.
 *
 * Everything sits behind a sign-in, because these are a partner's own form
 * configurations and the API scopes every query to them.
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

        <Route path="forms/:formSlug" element={<FormWorkspace />}>
          <Route index element={<Navigate to="configure" replace />} />
          <Route path="configure" element={<ConfigurePage />} />
          <Route path="preview" element={<PreviewPage />} />
          <Route path="publish" element={<PublishPage />} />
        </Route>

        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <DashboardRoutes />
      </BrowserRouter>
    </AuthProvider>
  );
}
