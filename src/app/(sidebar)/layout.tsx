"use client";

import { Sidebar } from "@/components/sidebar/Sidebar";
import { UserProvider } from "@/context/UserContext";

export default function SidebarGroupLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <UserProvider>
      <div className="relative min-h-screen flex w-full bg-[#F9F9F9]">
          <Sidebar/>
          <div className="flex-1 flex flex-col min-w-0 pl-14 pt-16 lg:p-8">
              <main className="w-full h-full">
                  {children}
              </main>
          </div>
      </div>
    </UserProvider>
  )
}
