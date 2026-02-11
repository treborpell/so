
"use client"

import { 
  LayoutDashboard, 
  CheckSquare, 
  TrendingUp, 
  Sparkles,
  LogOut,
  LogIn,
  BrainCircuit,
  ClipboardList,
  Upload
} from "lucide-react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarSeparator,
} from "@/components/ui/sidebar"
import { useUser } from "@/firebase/auth/use-user"
import { useAuth } from "@/firebase/provider"
import { signOut } from "firebase/auth"

const mainNav = [
  { name: "My Dashboard", href: "/", icon: LayoutDashboard },
  { name: "SO Program Log", href: "/sessions", icon: ClipboardList },
  { name: "Assignments", href: "/assignments", icon: CheckSquare },
]

const toolsNav = [
  { name: "Import Data", href: "/import", icon: Upload },
  { name: "Wellness Trends", href: "/reports", icon: TrendingUp },
  { name: "Growth Insights", href: "/summaries", icon: Sparkles },
]

export function AppSidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const { user } = useUser()
  const auth = useAuth()

  const handleSignOut = async () => {
    await signOut(auth)
    router.push("/login")
  }

  return (
    <Sidebar className="border-r border-border/50">
      <SidebarHeader className="px-6 py-8">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-primary flex items-center justify-center shadow-lg shadow-primary/20">
            <BrainCircuit className="h-6 w-6 text-primary-foreground" />
          </div>
          <div>
            <h1 className="font-headline font-bold text-lg tracking-tight">Mindful</h1>
            <p className="text-xs text-muted-foreground font-medium">SO Program Tracker</p>
          </div>
        </div>
      </SidebarHeader>
      
      <SidebarContent className="px-3">
        <SidebarGroup>
          <SidebarGroupLabel className="px-4 text-[10px] uppercase tracking-widest font-bold text-muted-foreground/70">My Journey</SidebarGroupLabel>
          <SidebarMenu>
            {mainNav.map((item) => (
              <SidebarMenuItem key={item.name}>
                <SidebarMenuButton asChild isActive={pathname === item.href} tooltip={item.name}>
                  <Link href={item.href} className="flex items-center gap-3 px-4 py-2.5">
                    <item.icon className="h-5 w-5" />
                    <span className="font-medium">{item.name}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroup>

        <SidebarSeparator className="my-2" />

        <SidebarGroup>
          <SidebarGroupLabel className="px-4 text-[10px] uppercase tracking-widest font-bold text-muted-foreground/70">Growth & Tools</SidebarGroupLabel>
          <SidebarMenu>
            {toolsNav.map((item) => (
              <SidebarMenuItem key={item.name}>
                <SidebarMenuButton asChild isActive={pathname === item.href} tooltip={item.name}>
                  <Link href={item.href} className="flex items-center gap-3 px-4 py-2.5">
                    <item.icon className="h-5 w-5" />
                    <span className="font-medium">{item.name}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-4">
        <SidebarMenu>
          {user ? (
            <SidebarMenuItem>
              <SidebarMenuButton 
                onClick={handleSignOut}
                className="text-muted-foreground hover:text-destructive w-full"
              >
                <LogOut className="h-5 w-5" />
                <span className="font-medium">Sign Out</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ) : (
            <SidebarMenuItem>
              <SidebarMenuButton asChild className="text-primary font-bold">
                <Link href="/login">
                  <LogIn className="h-5 w-5" />
                  <span>Sign In</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          )}
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  )
}
