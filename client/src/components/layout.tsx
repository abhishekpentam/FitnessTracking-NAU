import { Link, useLocation, Redirect } from "wouter";
import { Home, PlusCircle, Target, LogOut, Activity, Clock, BarChart3 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";

export default function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const queryClient = useQueryClient();
  
  const { data: user, isLoading } = useQuery({
    queryKey: ["auth"],
    queryFn: () => api.auth.me(),
    retry: false,
  });

  const handleLogout = async () => {
    await api.auth.logout();
    queryClient.clear();
    window.location.href = "/auth";
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    return <Redirect to="/auth" />;
  }

  const navItems = [
    { href: "/", icon: Home, label: "Home" },
    { href: "/activity", icon: Activity, label: "Activity" },
    { href: "/log", icon: PlusCircle, label: "Log" },
    { href: "/history", icon: Clock, label: "History" },
    { href: "/goals", icon: Target, label: "Goals" },
    { href: "/reports", icon: BarChart3, label: "Reports" },
  ];

  return (
    <div className="flex min-h-screen bg-background font-sans text-foreground selection:bg-primary/20">
      {/* Desktop Navigation Sidebar */}
      <aside className="hidden w-64 flex-col border-r border-border bg-card p-6 sm:flex sticky top-0 h-screen">
        <div className="mb-8 flex items-center gap-2">
            <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center">
                <div className="h-4 w-4 rounded-full bg-primary" />
            </div>
            <span className="text-xl font-bold text-foreground tracking-tight">FitTrack Pro</span>
        </div>
        <nav className="flex flex-1 flex-col gap-2">
          {navItems.map((item) => {
            const isActive = location === item.href;
            return (
              <Link key={item.href} href={item.href}>
                <button
                  className={cn(
                    "flex w-full items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition-all hover:bg-muted text-left",
                    isActive ? "bg-primary/10 text-primary" : "text-muted-foreground"
                  )}
                >
                  <item.icon className={cn("h-5 w-5", isActive && "fill-primary/20")} />
                  {item.label}
                </button>
              </Link>
            );
          })}
        </nav>
        
        <div className="border-t border-border pt-4 mt-auto">
          <button 
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium text-muted-foreground transition-all hover:bg-muted hover:text-foreground text-left"
          >
            <LogOut className="h-5 w-5" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 bg-background pb-24 sm:pb-0">
        <div className="mx-auto max-w-md min-h-screen sm:border-x sm:border-border sm:shadow-sm">
          {children}
        </div>
      </main>

      {/* Bottom Navigation (Mobile Only) */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-background/80 backdrop-blur-lg sm:hidden">
        <div className="flex h-16 items-center justify-around px-4">
          {navItems.map((item) => {
            const isActive = location === item.href;
            return (
              <Link key={item.href} href={item.href}>
                <button className="flex flex-col items-center justify-center gap-1 p-2 transition-colors active:scale-95">
                  <item.icon
                    className={cn(
                      "h-6 w-6 transition-colors",
                      isActive ? "text-primary fill-primary/20" : "text-muted-foreground"
                    )}
                  />
                  <span
                    className={cn(
                      "text-[10px] font-medium",
                      isActive ? "text-primary" : "text-muted-foreground"
                    )}
                  >
                    {item.label}
                  </span>
                </button>
              </Link>
            );
          })}
          <button 
            onClick={handleLogout}
            className="flex flex-col items-center justify-center gap-1 p-2 transition-colors active:scale-95"
          >
            <LogOut className="h-6 w-6 text-muted-foreground" />
            <span className="text-[10px] font-medium text-muted-foreground">Logout</span>
          </button>
        </div>
      </nav>
    </div>
  );
}
