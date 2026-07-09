'use client'

import React from 'react'
import { useState, useMemo } from 'react'
import { useAtom } from 'jotai'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination'
import { ArrowUpDown, Search, ClipboardList, CheckCircle2 } from 'lucide-react'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  useGetPreboardingEmployeeChecklistsByUserId,
  useCompleteEmployeePreboardingChecklist,
} from '@/hooks/use-api'
import { useInitializeUser, userDataAtom } from '@/utils/user'
import type { GetEmployeePreboardingChecklistType } from '@/utils/type'
import { formatDate } from '@/utils/conversions'

type SortableColumn =
  | 'checklistDetailsName'
  | 'status'
  | 'isComplete'
  | 'deadlineDate'

interface GroupedPreboarding {
  preboardingId: number
  preboardingFullName: string
  tasks: GetEmployeePreboardingChecklistType[]
}

const ITEMS_PER_PAGE = 10

const PendingTasks = () => {
  useInitializeUser()
  const [userData] = useAtom(userDataAtom)
  const userId = userData?.userId ?? 0

  const [searchTerm, setSearchTerm] = useState('')
  const [currentPage, setCurrentPage] = useState(1)

  const [sortColumn, setSortColumn] = useState<SortableColumn>(
    'checklistDetailsName'
  )
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')

  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [pendingCompleteId, setPendingCompleteId] = useState<number | null>(
    null
  )

  const { data, isLoading } =
    useGetPreboardingEmployeeChecklistsByUserId(userId)

  const completeChecklistMutation = useCompleteEmployeePreboardingChecklist({
    onClose: () => {},
    reset: () => {},
  })

  const isCompleting = completeChecklistMutation.isPending

  const tasks = useMemo<GetEmployeePreboardingChecklistType[]>(
    () => (Array.isArray(data?.data) ? data.data : []),
    [data?.data]
  )

  const handleSort = (column: SortableColumn) => {
    if (column === sortColumn) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortColumn(column)
      setSortDirection('asc')
    }
  }

  // Group tasks by preboardingId
  const grouped = useMemo<GroupedPreboarding[]>(() => {
    const map = new Map<number, GroupedPreboarding>()
    tasks.forEach((task) => {
      const id = task.preboardingId
      if (!map.has(id)) {
        map.set(id, {
          preboardingId: id,
          preboardingFullName: task.preboardingFullName ?? '—',
          tasks: [],
        })
      }
      map.get(id)!.tasks.push(task)
    })
    return Array.from(map.values())
  }, [tasks])

  // Filter and sort within each group, then paginate across all tasks
  const filteredGroups = useMemo<GroupedPreboarding[]>(() => {
    return grouped
      .map((group) => {
        const filteredTasks = group.tasks
          .filter((t) =>
            t.checklistDetailsName
              ?.toLowerCase()
              .includes(searchTerm.toLowerCase())
          )
          .sort((a, b) => {
            const aVal = a[sortColumn] ?? ''
            const bVal = b[sortColumn] ?? ''
            if (typeof aVal === 'boolean' && typeof bVal === 'boolean') {
              return sortDirection === 'asc'
                ? Number(aVal) - Number(bVal)
                : Number(bVal) - Number(aVal)
            }
            const aStr = String(aVal).toLowerCase()
            const bStr = String(bVal).toLowerCase()
            return sortDirection === 'asc'
              ? aStr.localeCompare(bStr)
              : bStr.localeCompare(aStr)
          })
        return { ...group, tasks: filteredTasks }
      })
      .filter((group) => group.tasks.length > 0)
  }, [grouped, searchTerm, sortColumn, sortDirection])

  // Flatten for pagination count
  const totalTaskCount = useMemo(
    () => filteredGroups.reduce((acc, g) => acc + g.tasks.length, 0),
    [filteredGroups]
  )
  const totalPages = Math.ceil(totalTaskCount / ITEMS_PER_PAGE)

  // Paginate: slice across flattened tasks, then re-group for rendering
  const paginatedGroups = useMemo<GroupedPreboarding[]>(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE
    const end = start + ITEMS_PER_PAGE
    let count = 0
    const result: GroupedPreboarding[] = []

    for (const group of filteredGroups) {
      if (count >= end) break
      const groupStart = Math.max(0, start - count)
      const groupEnd = end - count
      const slicedTasks = group.tasks.slice(groupStart, groupEnd)
      if (slicedTasks.length > 0) {
        result.push({ ...group, tasks: slicedTasks })
      }
      count += group.tasks.length
    }
    return result
  }, [filteredGroups, currentPage])

  // Running serial number offset for current page
  const pageOffset = (currentPage - 1) * ITEMS_PER_PAGE

  const handleConfirmComplete = () => {
    if (pendingCompleteId) {
      completeChecklistMutation.mutate({
        employeePreboardingChecklistId: pendingCompleteId,
        completionDate: new Date(),
      })
    }
    setIsDialogOpen(false)
    setPendingCompleteId(null)
  }

  const SortableHeader = ({
    column,
    label,
  }: {
    column: SortableColumn
    label: string
  }) => (
    <TableHead
      className="cursor-pointer select-none"
      onClick={() => handleSort(column)}
    >
      {label} <ArrowUpDown className="ml-1 h-4 w-4 inline" />
    </TableHead>
  )

  const getDeadlineStatus = (
    deadlineDate: string | Date | null | undefined
  ) => {
    if (!deadlineDate) return 'none'
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const deadline = new Date(deadlineDate)
    deadline.setHours(0, 0, 0, 0)
    const diffDays =
      (deadline.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
    if (diffDays < 0) return 'overdue'
    if (diffDays === 1) return 'tomorrow'
    return 'none'
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <div className="bg-blue-100 p-2 rounded-md">
            <ClipboardList className="text-blue-600" />
          </div>
          <h2 className="text-lg font-semibold">Pending Tasks</h2>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search tasks..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value)
              setCurrentPage(1)
            }}
            className="pl-10 w-64"
          />
        </div>
      </div>

      {/* Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader className="bg-blue-100">
            <TableRow>
              <TableHead>Sl No.</TableHead>
              <SortableHeader column="checklistDetailsName" label="Task" />
              <SortableHeader column="deadlineDate" label="Deadline" />
              <SortableHeader column="isComplete" label="Status" />
              <TableHead className="text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-4">
                  Loading tasks...
                </TableCell>
              </TableRow>
            ) : tasks.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-4">
                  No tasks found
                </TableCell>
              </TableRow>
            ) : filteredGroups.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-4">
                  No tasks match your search
                </TableCell>
              </TableRow>
            ) : (
              (() => {
                let serialNo = pageOffset
                return paginatedGroups.map((group) => (
                  <React.Fragment key={group.preboardingId}>
                    {/* Group header row */}
                    <TableRow className="bg-blue-50 hover:bg-blue-50">
                      <TableCell
                        colSpan={5}
                        className="py-2 px-4 font-semibold text-sm text-blue-800"
                      >
                        {group.preboardingFullName}
                      </TableCell>
                    </TableRow>
                    {/* Task rows */}
                    {group.tasks.map((task) => {
                      serialNo += 1
                      return (
                        <TableRow
                          key={task.checklistDetailsId}
                          className={
                            task.isComplete
                              ? 'bg-green-50'
                              : getDeadlineStatus(task.deadlineDate) ===
                                  'overdue'
                                ? 'bg-red-50'
                                : getDeadlineStatus(task.deadlineDate) ===
                                    'tomorrow'
                                  ? 'bg-yellow-50'
                                  : undefined
                          }
                        >
                          <TableCell>{serialNo}</TableCell>
                          <TableCell
                            className={`font-medium ${task.isComplete ? 'line-through text-gray-400' : ''}`}
                          >
                            {task.checklistDetailsName}
                          </TableCell>
                          <TableCell>{formatDate(task.deadlineDate)}</TableCell>
                          <TableCell>
                            {task.isComplete ? (
                              <span className="inline-flex items-center gap-1 text-xs font-medium text-green-600">
                                <CheckCircle2 className="h-3.5 w-3.5" />
                                Completed
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1.5 text-xs font-medium text-amber-600">
                                <span className="h-2 w-2 rounded-full bg-amber-400 inline-block" />
                                Pending
                              </span>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            {task.isComplete ? (
                              <span className="text-gray-400 text-xs">—</span>
                            ) : (
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-7 text-xs border-green-500 text-green-600 hover:bg-green-50 hover:text-green-700 disabled:opacity-50"
                                disabled={
                                  isCompleting ||
                                  !task.employeePreboardingChecklistId
                                }
                                onClick={() => {
                                  if (task.employeePreboardingChecklistId) {
                                    setPendingCompleteId(
                                      task.employeePreboardingChecklistId
                                    )
                                    setIsDialogOpen(true)
                                  }
                                }}
                              >
                                Complete
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </React.Fragment>
                ))
              })()
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {totalTaskCount > 0 && (
        <div className="mt-4">
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                  className={
                    currentPage === 1 ? 'pointer-events-none opacity-50' : ''
                  }
                />
              </PaginationItem>
              {[...Array(totalPages)].map((_, index) => {
                if (
                  index === 0 ||
                  index === totalPages - 1 ||
                  (index >= currentPage - 2 && index <= currentPage + 2)
                ) {
                  return (
                    <PaginationItem key={`page-${index}`}>
                      <PaginationLink
                        onClick={() => setCurrentPage(index + 1)}
                        isActive={currentPage === index + 1}
                      >
                        {index + 1}
                      </PaginationLink>
                    </PaginationItem>
                  )
                } else if (
                  index === currentPage - 3 ||
                  index === currentPage + 3
                ) {
                  return (
                    <PaginationItem key={`ellipsis-${index}`}>
                      <PaginationLink>...</PaginationLink>
                    </PaginationItem>
                  )
                }
                return null
              })}
              <PaginationItem>
                <PaginationNext
                  onClick={() =>
                    setCurrentPage((p) => Math.min(p + 1, totalPages))
                  }
                  className={
                    currentPage === totalPages
                      ? 'pointer-events-none opacity-50'
                      : ''
                  }
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      )}

      {/* Confirm complete dialog */}
      <AlertDialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <AlertDialogContent className="bg-white">
          <AlertDialogHeader>
            <AlertDialogTitle>Mark as Complete</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to mark this task as complete? This action
              cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex justify-end gap-2 mt-4">
            <AlertDialogCancel
              onClick={() => {
                setIsDialogOpen(false)
                setPendingCompleteId(null)
              }}
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              disabled={isCompleting}
              className="bg-green-600 hover:bg-green-700 text-white"
              onClick={handleConfirmComplete}
            >
              {isCompleting ? 'Completing...' : 'Yes, Complete'}
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

export default PendingTasks
