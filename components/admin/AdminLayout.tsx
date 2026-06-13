"use client";

import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Box,
  Tag,
  IndianRupee,
  LogOut,
  Menu,
  X,
  Ticket,
} from "lucide-react";
import toast from "react-hot-toast";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [authenticated, setAuthenticated] = useState<boolean | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  // Load sidebar state from localStorage on mount
  useEffect(() => {
    const syncSidebarState = () => {
      const savedSidebarState = localStorage.getItem("adminSidebarOpen");

      if (window.innerWidth < 768) {
        setSidebarOpen(false);
        return;
      }

      if (savedSidebarState !== null) {
        setSidebarOpen(savedSidebarState === "true");
        return;
      }

      setSidebarOpen(true);
    };

    syncSidebarState();
    window.addEventListener("resize", syncSidebarState);

    return () => {
      window.removeEventListener("resize", syncSidebarState);
    };
  }, []);

  // Save sidebar state to localStorage when it changes
  useEffect(() => {
    if (window.innerWidth >= 768) {
      localStorage.setItem("adminSidebarOpen", sidebarOpen.toString());
    }
  }, [sidebarOpen]);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const response = await fetch("/api/admin/auth/check");
      const data = await response.json();
      setAuthenticated(data.authenticated);
      
      if (!data.authenticated && pathname !== "/admin/login") {
        router.push("/admin/login");
      }
    } catch (error) {
      setAuthenticated(false);
      if (pathname !== "/admin/login") {
        router.push("/admin/login");
      }
    }
  };

  const handleLogout = async () => {
    try {
      const response = await fetch("/api/admin/auth/logout", {
        method: "POST",
      });
      
      if (response.ok) {
        toast.success("Logged out successfully");
        router.push("/admin/login");
        router.refresh();
      }
    } catch (error) {
      toast.error("Logout failed");
    }
  };

  // Show loading only briefly, then show sidebar
  if (authenticated === null && pathname !== "/admin/login") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-600">Loading...</div>
      </div>
    );
  }

  // Only hide sidebar on login page
  if (pathname === "/admin/login") {
    return <>{children}</>;
  }

  // For all other admin pages, show sidebar even if auth check is pending
  // This ensures sidebar is always visible

  const navItems = [
    { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
    { href: "/admin/products", label: "Products", icon: Package },
    { href: "/admin/orders", label: "Orders", icon: ShoppingCart },
    { href: "/admin/inventory", label: "Inventory", icon: Box },
    { href: "/admin/prices", label: "Prices", icon: IndianRupee },
    { href: "/admin/coupons", label: "Coupons", icon: Ticket },
    { href: "/admin/categories", label: "Categories", icon: Tag },
    { href: "/admin/sizes", label: "Size Charts", icon: Tag },
  ];


  const renderNavLinks = (variant: "sidebar" | "pill") =>
    navItems.map((item) => {
      const Icon = item.icon;
      const isActive = pathname === item.href;
      if (variant === "sidebar") {
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={() => {
              // Close sidebar on mobile when link is clicked
              if (window.innerWidth < 768) {
                setSidebarOpen(false);
              }
            }}
            className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
              isActive
                ? "bg-blue-100 text-blue-700"
                : "text-gray-700 hover:bg-gray-100"
            }`}
          >
            <Icon className="w-5 h-5" />
            <span className="font-medium">{item.label}</span>
          </Link>
        );
      }
      return (
        <Link
          key={item.href}
          href={item.href}
          className={`flex items-center gap-2 px-4 py-2 rounded-full border text-sm whitespace-nowrap transition ${
            isActive
              ? "border-blue-600 bg-blue-50 text-blue-700"
              : "border-transparent bg-gray-100 text-gray-600"
          }`}
        >
          <Icon className="w-4 h-4" />
          {item.label}
        </Link>
      );
    });

  return (
    <div className="min-h-screen bg-gray-50 overflow-x-hidden">
      {/* Sidebar — above mobile overlay */}
      <aside 
        className={`bg-white shadow-xl w-[min(18rem,85vw)] md:w-64 flex-shrink-0 h-screen fixed left-0 top-0 z-50 transition-transform duration-300 ease-in-out ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        } md:translate-x-0`}
      >
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-between p-4 border-b">
            <h1 className="text-xl font-bold text-gray-900">Admin Panel</h1>
            <button
              onClick={() => setSidebarOpen(false)}
              className="md:hidden p-2 hover:bg-gray-100 rounded-lg transition-colors"
              aria-label="Close sidebar"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
            {renderNavLinks("sidebar")}
          </nav>

          <div className="p-4 border-t">
            <button
              onClick={handleLogout}
              className="flex items-center space-x-3 w-full px-4 py-3 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors"
            >
              <LogOut className="w-5 h-5" />
              <span className="font-medium">Logout</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Backdrop — below sidebar, above page content */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 md:ml-64">
        {/* Top bar */}
        <header className="bg-white shadow-sm border-b sticky top-0 z-30">
          <div className="px-3 sm:px-4 py-3 sm:py-4">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex items-center gap-3">
                {/* Hamburger menu - visible on all screen sizes for sidebar toggle */}
                <button
                  onClick={() => setSidebarOpen(!sidebarOpen)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  aria-label="Toggle sidebar"
                >
                  <Menu className="w-5 h-5" />
                </button>
                <div>
                  <p className="text-xs uppercase tracking-wide text-gray-500">
                    magi.cofresin
                  </p>
                  <h2 className="text-lg font-semibold text-gray-900">
                    {navItems.find((item) => item.href === pathname)?.label ||
                      "Admin"}
                  </h2>
                </div>
              </div>
              <div className="hidden md:flex items-center gap-3 text-sm text-gray-500">
                Secure Admin Console
              </div>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-3 sm:p-4 lg:p-6 overflow-x-hidden overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}

