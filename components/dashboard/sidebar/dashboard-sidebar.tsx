'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'
import {
  Briefcase,
  ChevronDown,
  DollarSign,
  FileChartColumn,
  Home,
  ListChecks,
  LucideAirVent,
  Settings,
  UserCog,
} from 'lucide-react'

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarRail,
} from '@/components/ui/sidebar'
import { tokenAtom, useInitializeUser, userDataAtom } from '@/utils/user'
import { useAtom } from 'jotai'

export function DashboardSidebar() {
  useInitializeUser()
  const [userData] = useAtom(userDataAtom)
  const [token] = useAtom(tokenAtom)
  const pathname = usePathname()

  const isAdminOrHR = userData?.roleId === 1 || userData?.roleId === 2
  const isUser = userData?.roleId === 4

  const navItems = [
    {
      title: 'Dashboard Overview',
      icon: Home,
      href: '/dashboard/dashboard-overview',
      roles: [1, 2],
    },
    {
      title: 'Setup',
      icon: Settings,
      href: '/dashboard/setup',
      roles: [1, 2],
      subItems: [
        { title: 'Companies', href: '/dashboard/setup/company' },
        // { title: 'Register User', href: '/dashboard/setup/register-user' },
        { title: 'Departments', href: '/dashboard/setup/departments' },
        { title: 'Designations', href: '/dashboard/setup/designations' },
        { title: 'Business Units', href: '/dashboard/setup/business-units' },
        { title: 'Divisions', href: '/dashboard/setup/divisions' },
        { title: 'Employment Types', href: '/dashboard/setup/employee-types' },
        {
          title: 'Holiday Calendars',
          href: '/dashboard/setup/holiday-calendars',
        },
        { title: 'Holidays', href: '/dashboard/setup/holidays' },
        { title: 'Pending Tasks', href: '/dashboard/setup/pending-tasks' },
      ],
    },
    {
      title: 'Shift Management',
      icon: LucideAirVent,
      href: '/dashboard/shift-management',
      roles: [1, 2],
      subItems: [
        {
          title: 'Shift and Week Days',
          href: '/dashboard/shift-management/shift-and-week-days',
        },
        {
          title: 'Employee Shift Allocations',
          href: '/dashboard/shift-management/employee-shift-allocations',
        },
      ],
    },
    {
      title: 'Employee Management',
      icon: UserCog,
      href: '/dashboard/employee-management',
      roles: [1, 2],
      subItems: [
        {
          title: 'Checklists',
          href: '/dashboard/employee-management/checklists',
        },
        {
          title: 'Employee Preboardings',
          href: '/dashboard/employee-management/employee-preboardings',
        },
        {
          title: 'Create Employee',
          href: '/dashboard/employee-management/create-employee',
        },
        {
          title: 'Employees',
          href: '/dashboard/employee-management/employees',
        },
        // {
        //   title: 'Employee Leaves',
        //   href: '/dashboard/employee-management/employee-leaves',
        // },
        // {
        //   title: 'Employee Attendance',
        //   href: '/dashboard/employee-management/employee-attendances',
        // },
        // {
        //   title: 'Employee Lones',
        //   href: '/dashboard/employee-management/employee-lones',
        // },
      ],
    },
    {
      title: 'Attendance Management',
      icon: ListChecks,
      href: '/dashboard/attendance-management',
      roles: [1, 2],
      subItems: [
        {
          title: 'Attendance Policies',
          href: '/dashboard/attendance-management/attendance-policies',
        },
        {
          title: 'Attendance Processing',
          href: '/dashboard/attendance-management/attendance-processing',
        },
        {
          title: 'Manual Attendance Entry',
          href: '/dashboard/attendance-management/manual-attendance-entry',
        },
      ],
    },
    {
      title: 'Asset Management',
      icon: Briefcase,
      href: '/dashboard/asset-management',
      roles: [1, 2],
      subItems: [
        {
          title: 'Asset Category',
          href: '/dashboard/asset-management/asset-category',
        },
        { title: 'Assets', href: '/dashboard/asset-management/assets' },
      ],
    },
    {
      title: 'Leave Management',
      icon: LucideAirVent,
      href: '/dashboard/leave-management',
      roles: [1, 2, 4],
      subItems: [
        {
          title: 'Leave Types',
          href: '/dashboard/leave-management/leave-types',
          roles: [1, 2],
        },
        {
          title: 'Leave Policy',
          href: '/dashboard/leave-management/leave-policy',
          roles: [1, 2],
        },
        {
          title: 'Employee Leave Assignments',
          href: '/dashboard/leave-management/employee-leave-assignments',
          roles: [1, 2],
        },
        {
          title: 'Leave Apply',
          href: '/dashboard/leave-management/leave-apply',
          roles: [1, 2, 4],
        },
        {
          title: 'Approve Leaves',
          href: '/dashboard/leave-management/approve-leaves',
          roles: [1, 2],
        },
      ],
    },
    {
      title: 'Salary Management',
      icon: DollarSign,
      href: '/dashboard/salary-management',
      roles: [1, 2],
      subItems: [
        {
          title: 'Salary Components',
          href: '/dashboard/salary-management/salary-components',
        },
        {
          title: 'Salary Structures',
          href: '/dashboard/salary-management/salary-structures',
        },
        { title: 'Salary', href: '/dashboard/salary-management/salareis' },
      ],
    },
    {
      title: 'Reports',
      icon: FileChartColumn,
      href: '/dashboard/report',
      roles: [1, 2],
      subItems: [
        {
          title: 'Activity Report',
          href: '/dashboard/report/employee-activity-report',
        },
        {
          title: 'Daily Attendance Report',
          href: '/dashboard/report/attendance-report',
        },
        {
          title: 'Attendance Report Summary',
          href: '/dashboard/report/attendance-report-summary',
        },
        {
          title: 'Leave Balance Summary Report',
          href: '/dashboard/report/leave-balance-summary-report',
        },
        {
          title: 'Leave Ledger Report',
          href: '/dashboard/report/leave-ledger-report',
        },
      ],
    },
  ]

  const roleId = userData?.roleId

  const filteredNavItems = navItems
    .filter((item) => item.roles.includes(roleId!))
    .map((item) => ({
      ...item,
      subItems: item.subItems?.filter(
        (sub) => !('roles' in sub) || (sub as any).roles.includes(roleId!)
      ),
    }))

  const isSubItemActive = (item: any) => {
    if (!item.subItems) return false
    return item.subItems.some((subItem: any) => pathname === subItem.href)
  }

  const isItemActive = (item: any) => {
    return pathname.startsWith(item.href) || isSubItemActive(item)
  }

  return (
    <Sidebar className="text-white">
      <SidebarHeader className="border-b mt-16 bg-slate-800">
        <div className="p-2">
          <h1 className="text-xl font-bold">My Dashboard</h1>
        </div>
      </SidebarHeader>
      <SidebarContent className="bg-slate-800">
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {filteredNavItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  {!item.subItems || item.subItems.length === 0 ? (
                    <SidebarMenuButton
                      asChild
                      className={`hover:bg-slate-700 hover:text-white ${isItemActive(item) ? 'bg-blue-500 text-white !hover:bg-blue-500' : ''}`}
                    >
                      <Link href={item.href}>
                        <item.icon className="mr-2 w-4" />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  ) : (
                    <Collapsible
                      defaultOpen={isItemActive(item)}
                      className="w-full"
                    >
                      <CollapsibleTrigger className="w-full" asChild>
                        <SidebarMenuButton
                          className={`hover:bg-slate-700 hover:text-white ${isItemActive(item) ? 'bg-blue-500 text-white hover:bg-blue-500' : ''}`}
                        >
                          <item.icon className="mr-2 w-4" />
                          <span>{item.title}</span>
                          <ChevronDown className="ml-auto w-4 transition-transform duration-200 group-data-[state=open]/collapsible:rotate-180" />
                        </SidebarMenuButton>
                      </CollapsibleTrigger>
                      <CollapsibleContent>
                        <SidebarMenuSub>
                          {item.subItems.map((subItem) => (
                            <SidebarMenuSubItem key={subItem.title}>
                              <SidebarMenuSubButton
                                asChild
                                className={`text-white hover:bg-slate-700 hover:text-white ${pathname === subItem.href ? 'text-blue-300 hover:text-blue-300' : ''}`}
                              >
                                <Link
                                  className="h-auto mt-2"
                                  href={subItem.href}
                                >
                                  {subItem.title}
                                </Link>
                              </SidebarMenuSubButton>
                            </SidebarMenuSubItem>
                          ))}
                        </SidebarMenuSub>
                      </CollapsibleContent>
                    </Collapsible>
                  )}
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarRail />
    </Sidebar>
  )
}
