import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import InviteRegister from "./pages/InviteRegister";
import Dashboard from "./pages/Dashboard";
import Mine from "./pages/Mine";
import AgentCenter from "./pages/AgentCenter";
import Deposit from "./pages/Deposit";
import CommissionList from "./pages/CommissionList";
import Projects from "./pages/Projects";
import Charity from "./pages/Charity";
import AdminDashboard from "./pages/AdminDashboard";
import AdminPanel from "./pages/admin/AdminPanel";
import DepositManagement from "./pages/admin/DepositManagement";
import UserManagement from "./pages/admin/UserManagement";
import ProjectManagement from "./pages/admin/ProjectManagement";
import WithdrawalManagement from "./pages/admin/WithdrawalManagement";
import CharityManagement from "./pages/admin/CharityManagement";
import StatisticsReports from "./pages/admin/StatisticsReports";
import SystemSettings from "./pages/admin/SystemSettings";
import FundPoolMonitoring from "./pages/admin/FundPoolMonitoring";
import PermissionManagement from "./pages/admin/PermissionManagement";
import OperationLog from "./pages/admin/OperationLog";
import { useAuth } from "./_core/hooks/useAuth";
import { Loader2 } from "lucide-react";

function ProtectedRoute({ component: Component }: { component: React.ComponentType<any> }) {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="animate-spin" size={48} />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Login />;
  }

  return <Component />;
}

function Router() {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="animate-spin" size={48} />
      </div>
    );
  }

  return (
    <Switch>
      <Route path="/" component={isAuthenticated ? Dashboard : Home} />
       <Route path="/" component={Home} />
      <Route path="/login" component={Login} />
      <Route path="/register" component={Register} />
      <Route path="/invite-register" component={InviteRegister} />
      <Route path="/dashboard" component={() => <ProtectedRoute component={Dashboard} />} />
      <Route path="/mine" component={() => <ProtectedRoute component={Mine} />} />
      <Route path="/agent" component={() => <ProtectedRoute component={AgentCenter} />} />
      <Route path="/deposit" component={() => <ProtectedRoute component={Deposit} />} />
      <Route path="/commission" component={() => <ProtectedRoute component={CommissionList} />} />
      <Route path="/projects" component={() => <ProtectedRoute component={Projects} />} />
      <Route path="/charity" component={() => <ProtectedRoute component={Charity} />} />
      <Route path="/admin" component={() => <ProtectedRoute component={AdminPanel} />} />
      <Route path="/admin/deposits" component={() => <ProtectedRoute component={DepositManagement} />} />
      <Route path="/admin/users" component={() => <ProtectedRoute component={UserManagement} />} />
      <Route path="/admin/projects" component={() => <ProtectedRoute component={ProjectManagement} />} />
      <Route path="/admin/withdrawals" component={() => <ProtectedRoute component={WithdrawalManagement} />} />