import { lazy, Suspense, type ReactNode } from "react";
import { createBrowserRouter, Navigate } from "react-router-dom";

import PageLoader from "./pages/loading/PageLoader";

const LandingPage = lazy(() => import("./pages/home/LandingPage"));
const Login = lazy(() => import("./pages/auth/Login"));
const Register = lazy(() => import("./pages/auth/Register"));
const NotFound = lazy(() => import("./pages/not-found/NotFound"));
const DashboardHome = lazy(() => import("./pages/student/DashboardHome"));
const LearningHub = lazy(() => import("./pages/student/LearningHub"));
const Marketplace = lazy(() => import("./pages/student/Marketplace"));
const Wallet = lazy(() => import("./pages/student/Wallet"));
const StudentDashboardLayout = lazy(
  () => import("./layouts/StudentDashboardLayout"),
);

const withLoader = (content: ReactNode) => (
  <Suspense fallback={<PageLoader />}>{content}</Suspense>
);

export const router = createBrowserRouter([
  {
    path: "/",
    element: <Navigate to="/home" replace />,
  },
  {
    path: "/home",
    element: withLoader(<LandingPage />),
  },
  {
    path: "/auth/login",
    element: withLoader(<Login />),
  },
  {
    path: "/auth/register",
    element: withLoader(<Register />),
  },
  {
    path: "/loading",
    element: <PageLoader />,
  },
  {
    path: "/dashboard",
    element: withLoader(<StudentDashboardLayout />),
    children: [
      {
        index: true,
        element: withLoader(<DashboardHome />),
      },
      {
        path: "learning",
        element: withLoader(<LearningHub />),
      },
      {
        path: "marketplace",
        element: withLoader(<Marketplace />),
      },
      {
        path: "wallet",
        element: withLoader(<Wallet />),
      },
    ],
  },
  {
    path: "*",
    element: withLoader(<NotFound />),
  },
]);
