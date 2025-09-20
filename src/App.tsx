import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./hooks/useAuth";
import ConectaBoiDashboard from "./pages/ConectaBoiDashboard";
import Dashboard from "./pages/Dashboard";
import Analytics from "./pages/Analytics";
import Reports from "./pages/Reports";
import Team from "./pages/Team";
import Settings from "./pages/Settings";
import Alerts from "./pages/Alerts";
import Optimizations from "./pages/Optimizations";
import SignUp from "./pages/SignUp";
import SignIn from "./pages/SignIn";
import UserProfile from "./pages/UserProfile";
import InvitePage from "./pages/InvitePage";
import FeedReading from "./pages/FeedReading";
import Logistics from "./pages/Logistics";
import CsvUpload from "./pages/CsvUpload";
import ETLOperations from "./pages/ETLOperations";
import MetricsDashboard from "./pages/MetricsDashboard";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<ConectaBoiDashboard />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/analytics" element={<Analytics />} />
            <Route path="/desvios" element={<Analytics />} />
            <Route path="/logistica" element={<Logistics />} />
            <Route path="/alerts" element={<Alerts />} />
            <Route path="/optimizations" element={<Optimizations />} />
            <Route path="/reports" element={<Reports />} />
            <Route path="/team" element={<Team />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/signup" element={<SignUp />} />
            <Route path="/signin" element={<SignIn />} />
            <Route path="/user-profile" element={<UserProfile />} />
            <Route path="/feed-reading" element={<FeedReading />} />
            <Route path="/csv-upload" element={<CsvUpload />} />
            <Route path="/etl-operations" element={<ETLOperations />} />
            <Route path="/metrics-dashboard" element={<MetricsDashboard />} />
            <Route path="/invite/:token" element={<InvitePage />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
