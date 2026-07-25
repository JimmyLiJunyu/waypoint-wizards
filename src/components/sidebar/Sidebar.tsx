"use client";

import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useUser } from "@/context/UserContext";
import Link from "next/link";
import Image from "next/image";
import { Menu, X, LogOut, User } from "lucide-react";

const NAV_LINKS = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/account", label: "Account" },
  { href: "/socials", label: "Socials" },
  { href: "/feed", label: "Feed" },
  { href: "/messages", label: "Messages" },
];

export function Sidebar() {
  const [isOpen, setIsOpen] = useState(false);
  const [lastTripPath, setLastTripPath] = useState<string | null>(null);
  const { user, isLoading } = useUser();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    setLastTripPath(localStorage.getItem("lastTripPath"));
  }, [pathname]);

  const toggleSideBar = () => setIsOpen(!isOpen);
  const closeSideBar = () => setIsOpen(false);

  const handleLogout = async () => {
    try {
      const response = await fetch("/api/auth/logout", { method: "POST" });
      if (response.ok) {
        closeSideBar();
        router.refresh();
        router.push("/");
      }
    } catch (error) {
      console.error("An error occurred during logout: ", error);
    }
  };

  const profileHref = user ? `/users/${user.id}` : "#";
  const profileActive = pathname.startsWith("/users/");
  const tripActive = pathname.startsWith("/trip/") || pathname === "/new-trip";
  const tripHref = lastTripPath ?? "/new-trip";

  const linkClass = (active: boolean) =>
    `flex items-center px-3 py-2.5 rounded-lg text-sm font-semibold transition-colors ${
      active ? "bg-white text-red-500" : "text-white/80 hover:bg-red-600 hover:text-white"
    }`;

  return (
    <>
      <button
        onClick={toggleSideBar}
        className="fixed top-3 left-4 z-50 p-2 rounded-md border bg-background shadow-sm hover:bg-muted transition-colors"
        aria-label="Toggle Menu"
      >
        <Menu className="size-5 text-foreground" />
      </button>

      <div
        onClick={closeSideBar}
        className={`fixed inset-0 z-40 bg-black/40 backdrop-blur-sm transition-opacity duration-300 ${isOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}`}
      />

      <aside
        className={`fixed top-0 left-0 z-50 h-screen w-64 bg-red-500 border-r border-red-600 p-5 flex flex-col shadow-xl transition-transform duration-300 ease-in-out ${isOpen ? "translate-x-0" : "-translate-x-full"}`}
      >
        {/* Brand */}
        <div className="flex items-center justify-between pb-6 border-b border-red-400/50">
          <span className="font-bold text-2xl text-white tracking-tight">
            WayPoint Wizards
          </span>
          <button
            onClick={closeSideBar}
            className="p-1.5 rounded-full text-white/70 hover:bg-red-600 hover:text-white transition-colors"
          >
            <X className="size-5" />
          </button>
        </div>

        {/* Profile — fully clickable */}
        <div className="py-3 border-b border-red-400/50">
          {isLoading ? (
            <div className="text-white/60 text-sm px-3 py-2">Loading...</div>
          ) : (
            <Link
              href={profileHref}
              onClick={closeSideBar}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                profileActive
                  ? "bg-white text-red-500"
                  : "text-white/80 hover:bg-red-600 hover:text-white"
              }`}
            >
              <div className="relative size-9 shrink-0 rounded-full overflow-hidden bg-red-400 border border-white/20 flex items-center justify-center">
                {user?.imageUrl ? (
                  <Image src={user.imageUrl} alt="Avatar" fill className="object-cover object-center" />
                ) : (
                  <User className="size-4 text-white" />
                )}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-bold truncate">{user?.name || "Explorer"}</p>
                <p className={`text-xs truncate ${profileActive ? "text-red-400" : "text-white/60"}`}>
                  {user?.email}
                </p>
              </div>
            </Link>
          )}
        </div>

        {/* Nav */}
        <nav className="flex-1 flex flex-col gap-1 py-4">
          {/* Trip — dynamic link to last visited trip */}
          <Link
            href={tripHref}
            onClick={closeSideBar}
            className={linkClass(tripActive)}
          >
            Trip
          </Link>

          {NAV_LINKS.map(({ href, label }) => {
            const isActive = pathname === href || pathname.startsWith(href + "/");
            return (
              <Link
                key={href}
                href={href}
                onClick={closeSideBar}
                className={linkClass(isActive)}
              >
                {label}
              </Link>
            );
          })}
        </nav>

        {/* Logout */}
        <div className="pt-4 border-t border-red-400/50">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold text-white/80 hover:bg-red-700 hover:text-white transition-colors"
          >
            <LogOut className="size-4" />
            Logout
          </button>
        </div>
      </aside>
    </>
  );
}
