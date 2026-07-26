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
      <div className="relative h-screen overflow-hidden flex w-full bg-[#F9F9F9]">
          <Sidebar/>
          <div className="flex-1 flex flex-col min-w-0 overflow-hidden pt-16 md:pl-14 lg:p-8">
              <main className="w-full h-full overflow-hidden">
                  {children}
              </main>
          </div>
      </div>
    </UserProvider>
  )
}
