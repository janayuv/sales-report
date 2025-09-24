import { createBrowserRouter, RouterProvider } from "react-router-dom";

import Page1 from "./components/Pages/Page1";
import Home from "./components/Pages/Home";
import Companies from "./components/Pages/Companies";
import RootLayout from "./components/Layout/RootLayout";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
export default function App() {
  const queryClient = new QueryClient();
  const router = createBrowserRouter([
    {
      path: "/",
      element: <RootLayout />,
      children: [
        {
          path: "/",
          element: <Home />,
        },
        {
          path: "/companies",
          element: <Companies />,
        },
        {
          path: "/page1",
          element: <Page1 />,
        },
      ],
    },
  ]);
  return (
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  );
}
