"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Menu,
  X,
  LayoutDashboard,
  Compass,
  LogOut,
  Settings,
} from "lucide-react";

export function Sidebar() {
  const [isOpen, setIsOpen] = useState(false);

  const toggleSideBar = () => setIsOpen(!isOpen);
  const closeSideBar = () => setIsOpen(false);

  const handleLogout = async () => {
    console.log("Logging out."); // TODO: API call to prisma for logout
    closeSideBar();
  };

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
        className={`fixed top-0 left-0 z-50 h-screen w-64 bg-red-500 border-r p-5 flex flex-col shadow-xl transition-transform duration-300 ease-in-out ${isOpen ? "translate-x-0" : "-translate-x-full"}`}
      >
        <div className="flex items-center justify-between pb-6 border-b">
          <span className="font-bold text-2xl text-gray-300 track-tight ">
            WayPoint Wizards
          </span>
          <button
            onClick={closeSideBar}
            className="p-1.5 rounded-full hover:bg-muted hover:text-black transition-colors text-gray-300"
          >
            <X className="size-5" />
          </button>
        </div>

        <nav className="flex-1 flex flex-col gap-1.5 py-6">
          <Link
            href="/new-trip"
            onClick={closeSideBar}
            className="flex items-center gap-3 px-3 py-2.5 rounded-md text-sm  font-bold text-gray-300 hover:bg-muted hover:underline hover:text-foreground transition-colors"
          >
            Plan a New Trip
          </Link>
        </nav>

        <div className="pt-4 border-t">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3  py-2.5 rounded-md text-sm font-bold text-gray-300 hover:bg-destructive/10 hover:underline transition-colors"
          >
            <LogOut className="size-4" />
            Logout
          </button>
        </div>
      </aside>
    </>
  );
}
