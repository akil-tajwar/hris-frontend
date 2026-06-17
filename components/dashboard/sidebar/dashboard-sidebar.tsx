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

export function DashboardSidebar() {
  const pathname = usePathname()

  const navItems = [
    {
      title: 'Dashboard Overview',
      icon: Home,
      href: '/dashboard/dashboard-overview',
    },
    {
      title: 'Setup',
      icon: Settings,
      href: '/dashboard/setup',
      subItems: [
        {
          title: 'Tenants',
          href: '/dashboard/setup/tenants',
        },
        {
          title: 'Customers',
          href: '/dashboard/setup/customers',
        },
        {
          title: 'Register User',
          href: '/dashboard/setup/register-user',
        },
        {
          title: 'Departments',
          href: '/dashboard/setup/departments',
        },
        {
          title: 'Designations',
          href: '/dashboard/setup/designations',
        },
        {
          title: 'Companies',
          href: '/dashboard/setup/company',
        },
        {
          title: 'Business Units',
          href: '/dashboard/setup/business-units',
        },
        {
          title: 'Divisions',
          href: '/dashboard/setup/divisions',
        },
        {
          title: 'Work Stations',
          href: '/dashboard/setup/work-stations',
        },
        {
          title: 'Cost Centers',
          href: '/dashboard/setup/cost-centers',
        },
        {
          title: 'Employment Types',
          href: '/dashboard/setup/employee-types',
        },
        {
          title: 'Holidays',
          href: '/dashboard/setup/holidays',
        },
        {
          title: 'Holiday Calendars',
          href: '/dashboard/setup/holiday-calendars',
        },
        {
          title: 'Shift and Week Days',
          href: '/dashboard/setup/shift-and-week-days',
        },
        {
          title: 'Pending Tasks',
          href: '/dashboard/setup/pending-tasks',
        },
      ],
    },
    {
      title: 'Shift Management',
      icon: LucideAirVent,
      href: '/dashboard/shift-management',
      subItems: [
        {
          title: 'Employee Shift Allocations',  

          href: '/dashboard/employee-shift-allocations/employee-shift-allocations',
        },
      ]
    },
    {
      title: 'Employee Management',
      icon: UserCog,
      href: '/dashboard/employee-management',
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
        {
          title: 'Employee Leaves',
          href: '/dashboard/employee-management/employee-leaves',
        },
        {
          title: 'Employee Attendance',
          href: '/dashboard/employee-management/employee-attendances',
        },
        {
          title: 'Employee Lones',
          href: '/dashboard/employee-management/employee-lones',
        },
      ],
    },
    {
      title: 'Attendance Management',
      icon: ListChecks,
      href: '/dashboard/attendance-management',
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
      subItems: [
        {
          title: 'Asset Category',
          href: '/dashboard/asset-management/asset-category',
        },
        {
          title: 'Assets',
          href: '/dashboard/asset-management/assets',
        },
      ],
    },
    {
      title: 'Leave Management',
      icon: LucideAirVent,
      href: '/dashboard/leave-management',
      subItems: [
        {
          title: 'Leave Types',
          href: '/dashboard/leave-management/leave-types',
        },
        {
          title: 'Leave Policy',
          href: '/dashboard/leave-management/leave-policy',
        },
        {
          title: 'Employee Leave Assignments',
          href: '/dashboard/leave-management/employee-leave-assignments',
        },
      ],
    },
    {
      title: 'Salary Management',
      icon: DollarSign,
      href: '/dashboard/salary-management',
      subItems: [
        {
          title: 'Salary Components',
          href: '/dashboard/salary-management/salary-components',
        },
        {
          title: 'Salary Structures',
          href: '/dashboard/salary-management/salary-structures',
        },
        {
          title: 'Salary',
          href: '/dashboard/salary-management/salareis',
        },
      ],
    },
    {
      title: 'Reports',
      icon: FileChartColumn,
      href: '/dashboard/report',
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
      ],
    },
  ]

  // Check if the current path is in the submenu items
  const isSubItemActive = (item: any) => {
    if (!item.subItems) return false
    return item.subItems.some((subItem: any) => pathname === subItem.href)
  }

  // Check if the current path matches the main item or its sub-items
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
              {navItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  {!item.subItems ? (
                    // Regular menu item without submenu
                    <SidebarMenuButton
                      asChild
                      className={`hover:bg-slate-700 hover:text-white ${isItemActive(item) ? 'bg-blue-500 text-white !hover:bg-blue-500' : ''} `}
                    >
                      <Link href={item.href}>
                        <item.icon className="mr-2 w-4" />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  ) : (
                    // Menu item with submenu as accordion
                    <Collapsible
                      defaultOpen={isItemActive(item)}
                      className="w-full"
                    >
                      <CollapsibleTrigger className="w-full" asChild>
                        <SidebarMenuButton
                          className={`hover:bg-slate-700 hover:text-white ${isItemActive(item) ? 'bg-blue-500 text-white hover:bg-blue-500' : ''} `}
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
                                className={`text-white hover:bg-slate-700 hover:text-white ${pathname === subItem.href ? 'text-blue-300 hover:text-blue-300' : ''} `}
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
