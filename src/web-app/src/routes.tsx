import { lazy, Suspense, type ReactNode } from "react";
import {
  createBrowserRouter,
  Navigate,
  RouterProvider,
} from "react-router-dom";
import PageLoader from "./pages/loading/PageLoader";

const LandingPage = lazy(() => import("./pages/home/LandingPage"));
const Login = lazy(() => import("./pages/auth/Login"));
const Register = lazy(() => import("./pages/auth/Register"));
const NotFound = lazy(() => import("./pages/not-found/NotFound"));
const DashboardHome = lazy(() => import("./pages/student/DashboardHome"));
const LearningHub = lazy(() => import("./pages/student/LearningHub"));
const Marketplace = lazy(() => import("./pages/student/Marketplace"));
const Wallet = lazy(() => import("./pages/student/Wallet"));
const StudentProfile = lazy(() => import("./pages/student/StudentProfile"));
const StudentDashboardLayout = lazy(
  () => import("./layouts/StudentDashboardLayout"),
);
const TeacherDashboardLayout = lazy(
  () => import("./layouts/TeacherDashboardLayout"),
);
const TeacherDashboardHome = lazy(
  () => import("./pages/teacher/TeacherDashboardHome"),
);
const ContentManager = lazy(() => import("./pages/teacher/ContentManager"));
const TeacherWallet = lazy(() => import("./pages/teacher/TeacherWallet"));
const TeacherProfile = lazy(() => import("./pages/teacher/TeacherProfile"));
const TeacherStatistics = lazy(
  () => import("./pages/teacher/TeacherStatistics"),
);
const FlashcardDetail = lazy(() => import("./pages/student/FlashcardDetail"));
const QuizDetail = lazy(() => import("./pages/student/QuizDetail"));
const AdminDashboardLayout = lazy(
  () => import("./layouts/AdminDashboardLayout"),
);
const AdminDashboardHome = lazy(
  () => import("./pages/admin/AdminDashboardHome"),
);
const AdminUsers = lazy(() => import("./pages/admin/AdminUsers"));
const AdminContentModeration = lazy(
  () => import("./pages/admin/AdminContentModeration"),
);
const AdminSystemConfig = lazy(
  () => import("./pages/admin/AdminSystemConfig"),
);

const withLoader = (content: ReactNode) => (
  <Suspense fallback={<PageLoader />}>{content}</Suspense>
);

const router = createBrowserRouter([
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
  // Redirect /dashboard cũ về /student/dashboard để backward-compat
  {
    path: "/dashboard",
    element: <Navigate to="/student/dashboard" replace />,
  },
  {
    path: "/student/dashboard",
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
        path: "flashcard/:id",
        element: withLoader(<FlashcardDetail />),
      },
      {
        path: "quiz/:id",
        element: withLoader(<QuizDetail />),
      },
      {
        path: "marketplace",
        element: withLoader(<Marketplace />),
      },
      {
        path: "wallet",
        element: withLoader(<Wallet />),
      },
      {
        path: "profile",
        element: withLoader(<StudentProfile />),
      },
    ],
  },
  {
    path: "/teacher/dashboard",
    element: withLoader(<TeacherDashboardLayout />),
    children: [
      {
        index: true,
        element: withLoader(<TeacherDashboardHome />),
      },
      {
        path: "content",
        element: withLoader(<ContentManager />),
      },
      {
        path: "wallet",
        element: withLoader(<TeacherWallet />),
      },
      {
        path: "statistics",
        element: withLoader(<TeacherStatistics />),
      },
      {
        path: "profile",
        element: withLoader(<TeacherProfile />),
      },
    ],
  },
  {
    path: "/admin/dashboard",
    element: withLoader(<AdminDashboardLayout />),
    children: [
      {
        index: true,
        element: withLoader(<AdminDashboardHome />),
      },
      {
        path: "users",
        element: withLoader(<AdminUsers />),
      },
      {
        path: "moderation",
        element: withLoader(<AdminContentModeration />),
      },
      {
        path: "config",
        element: withLoader(<AdminSystemConfig />),
      },
    ],
  },
  {
    path: "*",
    element: withLoader(<NotFound />),
  },
]);

export default function AppRouter() {
  return <RouterProvider router={router} />;
}
