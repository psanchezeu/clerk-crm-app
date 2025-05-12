"use client"

import { UserButton } from "@clerk/nextjs"
import { ModeToggle } from "@/components/mode-toggle"
import { useSidebar } from "@/context/sidebar-context"
import { cn } from "@/lib/utils"

export function Header() {
  const { isCollapsed } = useSidebar()
  
  return (
    <div className="border-b sticky top-0 z-10 bg-background">
      <div className="flex h-16 items-center px-4 transition-all duration-300">
        <div className="ml-auto flex items-center space-x-4">
          <ModeToggle />
          <UserButton afterSignOutUrl="/" />
        </div>
      </div>
    </div>
  )
}
