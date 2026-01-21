import { useState, useEffect } from "react";
import LoginForm from "@/components/auth/LoginForm";
import Sidebar from "@/components/layout/Sidebar";
import Header from "@/components/layout/Header";
import { useAuth } from "@/hooks/useAuth";
import { useLocation } from "wouter";
import ApprovalPending from "@/pages/ApprovalPending";

// Role-based route access configuration
const roleAccess: Record<string, string[]> = {
  admin: ["*"],
  manager: ["/", "/profile", "/pos", "/sales-history", "/customers", "/stock", "/purchase-orders", "/accounts-receivable", "/accounts-payable", "/cash-reconciliation", "/expenses", "/suppliers", "/pricing", "/financial-reports", "/tanks", "/pumps", "/daily-reports", "/aging-reports", "/general-ledger", "/customer-activity", "/settings"],
  cashier: ["/", "/profile", "/pos", "/sales-history", "/customers"]
};

interface AuthGuardProps {
  children: React.ReactNode;
}

export default function AuthGuard({ children }: AuthGuardProps) {
  const { user, isLoading, isAuthenticated } = useAuth();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [location, setLocation] = useLocation();

  useEffect(() => {
    if (!isLoading && isAuthenticated && user) {
      const allowedRoutes = roleAccess[user.role as keyof typeof roleAccess] || [];
      const currentPath = location.split("/")[1];
      const isAllowed = allowedRoutes.includes("*") || 
                        allowedRoutes.includes(location) || 
                        allowedRoutes.some(route => location.startsWith(route) && route !== "/");
      
      if (!isAllowed && location !== "/" && location !== "/profile" && location !== "/login" && location !== "/signup") {
        setLocation("/");
      }
    }
  }, [isLoading, isAuthenticated, location, setLocation, user]);

  // Check if current route is public
  const isPublicRoute = ['/login', '/signup', '/approval-pending'].includes(location);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-center">
          <div className="text-lg font-medium text-gray-600">Loading...</div>
        </div>
      </div>
    );
  }

  if (!user && !isPublicRoute) {
    return <LoginForm />;
  }

  if (user && !user.isActive && user.role !== 'admin' && !isPublicRoute) {
    return <ApprovalPending userEmail={user.username} userName={user.fullName} />;
  }

  if (isPublicRoute) {
    return <>{children}</>;
  }

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <div className={`transition-all duration-300 ease-in-out flex-shrink-0 ${sidebarCollapsed ? 'w-16' : 'w-64'}`}>
        <Sidebar
          isCollapsed={sidebarCollapsed}
          onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        />
      </div>
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto bg-background p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}