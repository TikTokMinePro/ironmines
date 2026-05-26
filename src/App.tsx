import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute, AdminRoute } from "@/components/ProtectedRoute";
import { lazy, Suspense } from "react";
import { LoadingScreen } from "@/components/LoadingScreen";
import { Navigate } from "react-router-dom";

const Login = lazy(() => import("./pages/Login"));
const NotFound = lazy(() => import("./pages/NotFound"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));

const AppLayout = lazy(() => import("./layouts/AppLayout"));
const Dashboard = lazy(() => import("./pages/app/Dashboard"));
const Products = lazy(() => import("./pages/app/Products"));
const Videos = lazy(() => import("./pages/app/Videos"));
const Creators = lazy(() => import("./pages/app/Creators"));
const Influencer = lazy(() => import("./pages/app/Influencer"));
const Creatives = lazy(() => import("./pages/app/Creatives"));
const CalculatorPage = lazy(() => import("./pages/app/CalculatorPage"));
const Settings = lazy(() => import("./pages/app/Settings"));
const ProductDetail = lazy(() => import("./pages/app/ProductDetail"));

const AdminLayout = lazy(() => import("./layouts/AdminLayout"));
const AdminUsers = lazy(() => import("./pages/admin/AdminUsers"));
const AdminSubscriptions = lazy(() => import("./pages/admin/AdminSubscriptions"));
const AdminSales = lazy(() => import("./pages/admin/AdminSales"));
const AdminPaymentGateway = lazy(() => import("./pages/admin/AdminPaymentGateway"));
const AdminEmailTemplates = lazy(() => import("./pages/admin/AdminEmailTemplates"));
const AdminData = lazy(() => import("./pages/admin/AdminData"));
const AdminAI = lazy(() => import("./pages/admin/AdminAI"));
const AdminMonitorApis = lazy(() => import("./pages/admin/AdminMonitorApis"));
const AdminInfluencer = lazy(() => import("./pages/admin/AdminInfluencer"));
const AdminCoupons = lazy(() => import("./pages/admin/AdminCoupons"));
const AdminDiagnostics = lazy(() => import("./pages/admin/AdminDiagnostics"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5min default
      gcTime: 30 * 60 * 1000, // 30min cache
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Suspense fallback={<LoadingScreen />}>
            <Routes>
              {/* "/" is served as the static landing page (public/landing.html) via Vercel.
                  In local dev, redirect straight to login so the app remains navigable. */}
              <Route path="/" element={<Navigate to="/login" replace />} />
              <Route path="/login" element={<Login />} />
              <Route path="/reset-password" element={<ResetPassword />} />

              <Route path="/app" element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
                <Route index element={<Dashboard />} />
                <Route path="dashboard" element={<Dashboard />} />
                <Route path="produtos" element={<Products />} />
                <Route path="produtos/:id" element={<ProductDetail />} />
                <Route path="videos" element={<Videos />} />
                <Route path="criadores" element={<Creators />} />
                <Route path="influencer" element={<Influencer />} />
                <Route path="criativos" element={<Creatives />} />
                <Route path="calculadora" element={<CalculatorPage />} />
                <Route path="configuracoes" element={<Settings />} />
              </Route>

              <Route path="/admin" element={<AdminRoute><AdminLayout /></AdminRoute>}>
                <Route index element={<AdminUsers />} />
                <Route path="usuarios" element={<AdminUsers />} />
                <Route path="assinaturas" element={<AdminSubscriptions />} />
                <Route path="vendas" element={<AdminSales />} />
                <Route path="gateway" element={<AdminPaymentGateway />} />
                <Route path="emails" element={<AdminEmailTemplates />} />
                <Route path="dados" element={<AdminData />} />
                <Route path="ia" element={<AdminAI />} />
                <Route path="monitor-apis" element={<AdminMonitorApis />} />
                <Route path="influencer" element={<AdminInfluencer />} />
                <Route path="cupons" element={<AdminCoupons />} />
                <Route path="diagnosticos" element={<AdminDiagnostics />} />
              </Route>

              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
