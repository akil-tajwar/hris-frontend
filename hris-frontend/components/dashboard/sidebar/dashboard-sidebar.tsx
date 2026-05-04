'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'
import {
  ChevronDown,
  DollarSign,
  FileChartColumn,
  Home,
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
          title: 'Departments',
          href: '/dashboard/setup/departments',
        },
        {
          title: 'Designations',
          href: '/dashboard/setup/designations',
        },
        {
          title: 'Employee Types',
          href: '/dashboard/setup/employee-types',
        },
        {
          title: 'Holidays',
          href: '/dashboard/setup/holidays',
        },
        {
          title: 'Leave Types',
          href: '/dashboard/setup/leave-types',
        },
        {
          title: 'Office Timing & Weekends',
          href: '/dashboard/setup/office-timing-and-weekends',
        },
        {
          title: 'Other Salary Components',
          href: '/dashboard/setup/other-salary-components',
        },
      ],
    },
    {
      title: 'Employee Management',
      icon: UserCog,
      href: '/dashboard/employee-management',
      subItems: [
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
      title: 'Salary Management',
      icon: DollarSign,
      href: '/dashboard/salary-management',
      subItems: [
        {
          title: 'Employee Other Salary Components',
          href: '/dashboard/salary-management/employee-other-salary-components',
        },
        {
          title: 'Salary',
          href: '/dashboard/salary-management/salary',
        }
      ],
    },
    {
      title: 'Reports',
      icon: FileChartColumn,
      href: '/dashboard/report',
      subItems: [
        {
          title: 'Salary Report',
          href: '/dashboard/report/salary-report',
        },
        {
          title: 'Attendance Report',
          href: '/dashboard/report/attendance-report',
        },
        {
          title: 'Lone Report',
          href: '/dashboard/report/lone-report',
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
    <Sidebar>
      <SidebarHeader className="border-b mt-16">
        <div className="p-2">
          <h1 className="text-xl font-bold">My Dashboard</h1>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  {!item.subItems ? (
                    // Regular menu item without submenu
                    <SidebarMenuButton
                      asChild
                      className={`${isItemActive(item) ? 'bg-yellow-400 text-black hover:bg-yellow-400' : ''}  `}
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
                          className={`${isItemActive(item) ? 'bg-yellow-400 text-black hover:bg-yellow-400' : ''}  `}
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
                                className={`${pathname === subItem.href ? 'bg-gray-100 text-black' : ''}`}
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
