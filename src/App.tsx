import { createBrowserRouter, RouterProvider } from 'react-router-dom';

import Page1 from './components/Pages/Page1';
import Home from './components/Pages/Home';
import Companies from './components/Pages/Companies';
import Customers from './components/Pages/Customers';
import ImportReport from './components/Pages/ImportReport';
import RootLayout from './components/Layout/RootLayout';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SelectedCompanyProvider } from './contexts/SelectedCompanyContext';
import { Toaster } from './components/ui/toaster';
import { ErrorBoundary } from './components/ErrorBoundary';
export default function App() {
  const queryClient = new QueryClient();
  const router = createBrowserRouter([
    {
      path: '/',
      element: <RootLayout />,
      children: [
        {
          path: '/',
          element: <Home />,
        },
        {
          path: '/companies',
          element: <Companies />,
        },
        {
          path: '/customers',
          element: <Customers />,
        },
        {
          path: '/import-report',
          element: <ImportReport />,
        },
        {
          path: '/page1',
          element: <Page1 />,
        },
      ],
    },
  ]);
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <SelectedCompanyProvider>
          <RouterProvider router={router} />
          <Toaster />
        </SelectedCompanyProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}
