'use client'

import type React from 'react'
import { useCallback, useEffect, useState, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
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
import { ArrowUpDown, Search, Clock, Edit2, Trash2 } from 'lucide-react'
import { Popup } from '@/utils/popup'
import type {
  CreateOfficeTimingType,
  GetOfficeTimingType,
} from '@/utils/type'
import { useInitializeUser, userDataAtom } from '@/utils/user'
import { useAtom } from 'jotai'
import {
  useAddOfficeTimingWeekend,
  useDeleteOfficeTimingWeekend,
  useGetOfficeTimingWeekends,
  useUpdateOfficeTimingWeekend,
  useGetWeekends,
} from '@/hooks/use-api'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { formatTime } from '@/utils/conversions'

const OfficeTimingAndWeekends = () => {
  useInitializeUser()
  const [userData] = useAtom(userDataAtom)

  const { data: officeTimings } = useGetOfficeTimingWeekends()
  const { data: weekends } = useGetWeekends()
  console.log('🚀 ~ OfficeTimingAndWeekends ~ officeTimings:', officeTimings)
  console.log('🚀 ~ OfficeTimingAndWeekends ~ weekends:', weekends)

  const [error, setError] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [timingsPerPage] = useState(10)
  const [sortColumn, setSortColumn] =
    useState<keyof GetOfficeTimingType>('startTime')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')
  const [searchTerm, setSearchTerm] = useState('')

  const [isPopupOpen, setIsPopupOpen] = useState(false)
  const [isEditMode, setIsEditMode] = useState(false)
  const [editingTimingId, setEditingTimingId] = useState<number | null>(null)

  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [deletingTimingId, setDeletingTimingId] = useState<number | null>(null)

  const [selectedWeekendIds, setSelectedWeekendIds] = useState<number[]>([])

  const [formData, setFormData] = useState<CreateOfficeTimingType>({
    startTime: '09:00',
    endTime: '17:00',
    weekendIds: [],
    createdBy: userData?.userId || 0,
  })

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleWeekendToggle = (weekendId: number) => {
    setSelectedWeekendIds((prev) =>
      prev.includes(weekendId)
        ? prev.filter((id) => id !== weekendId)
        : [...prev, weekendId]
    )
  }

  const resetForm = useCallback(() => {
    setFormData({
      startTime: '09:00',
      endTime: '17:00',
      weekendIds: [],
      createdBy: userData?.userId || 0,
    })
    setSelectedWeekendIds([])
    setEditingTimingId(null)
    setIsEditMode(false)
    setIsPopupOpen(false)
    setError(null)
  }, [userData?.userId])

  const closePopup = useCallback(() => {
    setIsPopupOpen(false)
    setError(null)
    resetForm()
  }, [resetForm])

  const addMutation = useAddOfficeTimingWeekend({
    onClose: closePopup,
    reset: resetForm,
  })

  const updateMutation = useUpdateOfficeTimingWeekend({
    onClose: closePopup,
    reset: resetForm,
  })

  const deleteMutation = useDeleteOfficeTimingWeekend({
    onClose: closePopup,
    reset: resetForm,
  })

  const handleSort = (column: keyof GetOfficeTimingType) => {
    if (column === sortColumn) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortColumn(column)
      setSortDirection('asc')
    }
  }

  const filteredTimings = useMemo(() => {
    if (!officeTimings?.data) return []
    return officeTimings.data?.filter(
      (timing) =>
        timing.startTime?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        timing.endTime?.toLowerCase().includes(searchTerm.toLowerCase())
    )
  }, [officeTimings?.data, searchTerm])

  const sortedTimings = useMemo(() => {
    return [...filteredTimings].sort((a, b) => {
      const aValue = a[sortColumn] ?? ''
      const bValue = b[sortColumn] ?? ''

      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sortDirection === 'asc'
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue)
      }

      return 0
    })
  }, [filteredTimings, sortColumn, sortDirection])

  const paginatedTimings = useMemo(() => {
    const startIndex = (currentPage - 1) * timingsPerPage
    return sortedTimings.slice(startIndex, startIndex + timingsPerPage)
  }, [sortedTimings, currentPage, timingsPerPage])

  const totalPages = Math.ceil(sortedTimings.length / timingsPerPage)

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault()

      setError(null)

      // Validate weekend selection
      if (selectedWeekendIds.length === 0) {
        setError('Please select at least one weekend day')
        return
      }

      try {
        console.log(
          'Submit form - isEditMode:',
          isEditMode,
          'editingTimingId:',
          editingTimingId
        )

        if (isEditMode && editingTimingId) {
          // For update, send updatedBy
          const updateData: any = {
            startTime: formData.startTime,
            endTime: formData.endTime,
            weekendIds: selectedWeekendIds,
            updatedBy: userData?.userId || 0,
          }

          console.log('Calling UPDATE mutation with data:', updateData)
          updateMutation.mutate({
            id: editingTimingId,
            data: updateData,
          })
          console.log('update', isEditMode, editingTimingId)
        } else {
          // For create, send createdBy
          const createData: CreateOfficeTimingType = {
            startTime: formData.startTime,
            endTime: formData.endTime,
            weekendIds: selectedWeekendIds,
            createdBy: userData?.userId || 0,
          }

          console.log('Calling CREATE mutation with data:', createData)
          addMutation.mutate(createData)
          console.log('create')
        }
      } catch (err) {
        setError('Failed to save office timing')
        console.error(err)
      }
    },
    [
      formData,
      selectedWeekendIds,
      isEditMode,
      editingTimingId,
      addMutation,
      updateMutation,
      userData,
    ]
  )

  useEffect(() => {
    if (addMutation.error || updateMutation.error) {
      setError('Error saving office timing')
    }
  }, [addMutation.error, updateMutation.error])

  // Set default weekends (Friday and Saturday) when weekends data is loaded
  useEffect(() => {
    if (
      weekends?.data &&
      selectedWeekendIds.length === 0 &&
      !isEditMode &&
      isPopupOpen
    ) {
      const fridayWeekend = weekends.data.find(
        (w) => w.day?.toLowerCase() === 'friday'
      )
      const saturdayWeekend = weekends.data.find(
        (w) => w.day?.toLowerCase() === 'saturday'
      )

      const defaultWeekendIds: number[] = []
      if (fridayWeekend?.weekendId !== undefined) {
        defaultWeekendIds.push(fridayWeekend.weekendId)
      }
      if (saturdayWeekend?.weekendId !== undefined) {
        defaultWeekendIds.push(saturdayWeekend.weekendId)
      }

      if (defaultWeekendIds.length > 0) {
        setSelectedWeekendIds(defaultWeekendIds)
      }
    }
  }, [weekends?.data, isEditMode, selectedWeekendIds.length, isPopupOpen])

  const handleEditClick = (timing: any) => {
    console.log('Edit clicked for timing:', timing)
    console.log(
      'Setting isEditMode to true and editingTimingId to:',
      timing.officeTimingId
    )

    setIsEditMode(true)
    setEditingTimingId(timing.officeTimingId || null)
    setSelectedWeekendIds(timing.weekendIds || [])
    setFormData({
      startTime: timing.startTime,
      endTime: timing.endTime,
      weekendIds: timing.weekendIds || [],
      createdBy: userData?.userId || 0,
    })
    setIsPopupOpen(true)
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2 mb-4">
          <div className="bg-amber-100 p-2 rounded-md">
            <Clock className="text-amber-600" />
          </div>
          <h2 className="text-lg font-semibold">Office Timing & Weekends</h2>
        </div>
        <div className="flex items-center gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search timings..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-64"
            />
          </div>
          <Button
            className="bg-amber-400 hover:bg-amber-500 text-black"
            onClick={() => setIsPopupOpen(true)}
          >
            Add
          </Button>
        </div>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader className="bg-amber-100">
            <TableRow>
              <TableHead>Sl No.</TableHead>
              <TableHead
                onClick={() => handleSort('startTime')}
                className="cursor-pointer"
              >
                Start Time <ArrowUpDown className="ml-2 h-4 w-4 inline" />
              </TableHead>
              <TableHead
                onClick={() => handleSort('endTime')}
                className="cursor-pointer"
              >
                End Time <ArrowUpDown className="ml-2 h-4 w-4 inline" />
              </TableHead>
              <TableHead>Weekends</TableHead>
              <TableHead className="text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {!officeTimings || officeTimings.data === undefined ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-4">
                  Loading office timings...
                </TableCell>
              </TableRow>
            ) : !officeTimings.data || officeTimings.data.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-4">
                  No office timings found
                </TableCell>
              </TableRow>
            ) : paginatedTimings.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-4">
                  No office timings match your search
                </TableCell>
              </TableRow>
            ) : (
              paginatedTimings.map((timing, index) => (
                <TableRow key={index}>
                  <TableCell>{index + 1}</TableCell>
                  <TableCell className="font-medium">
                    {formatTime(timing.startTime)}
                  </TableCell>
                  <TableCell className="font-medium">
                    {formatTime(timing.endTime)}
                  </TableCell>
                  <TableCell className="font-medium">
                    {timing.weekends?.join(', ') || 'N/A'}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-amber-600 hover:text-amber-700"
                        onClick={() => handleEditClick(timing)}
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-red-600 hover:text-red-700"
                        onClick={() => {
                          console.log(
                            'Delete button clicked for timing:',
                            timing
                          )
                          console.log('Using timing ID:', timing.officeTimingId)
                          setDeletingTimingId(timing.officeTimingId || null)
                          setIsDeleteDialogOpen(true)
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {sortedTimings.length > 0 && (
        <div className="mt-4">
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  onClick={() =>
                    setCurrentPage((prev) => Math.max(prev - 1, 1))
                  }
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
                    setCurrentPage((prev) => Math.min(prev + 1, totalPages))
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

      <Popup
        isOpen={isPopupOpen}
        onClose={closePopup}
        title={isEditMode ? 'Edit Office Timing' : 'Add Office Timing'}
        size="sm:max-w-md"
      >
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="grid gap-4">
            <div className="space-y-2">
              <Label htmlFor="startTime">
                Start Time <span className="text-red-500">*</span>
              </Label>
              <Input
                id="startTime"
                name="startTime"
                type="time"
                value={formData.startTime}
                onChange={handleInputChange}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="endTime">
                End Time <span className="text-red-500">*</span>
              </Label>
              <Input
                id="endTime"
                name="endTime"
                type="time"
                value={formData.endTime}
                onChange={handleInputChange}
                required
              />
            </div>

            {/* Weekends Section */}
            <div>
              <h3 className="text-md font-semibold mb-4">Weekends</h3>
              <div className="space-y-3">
                <Label>
                  Select Weekend Days <span className="text-red-500">*</span>
                </Label>
                <div className="grid gap-3 md:grid-cols-3">
                  {weekends?.data?.map((weekend) => (
                    <div
                      key={weekend.weekendId}
                      className="flex items-center space-x-2"
                    >
                      <Checkbox
                        id={`weekend-${weekend.weekendId}`}
                        checked={
                          weekend.weekendId !== undefined &&
                          selectedWeekendIds.includes(weekend.weekendId)
                        }
                        onCheckedChange={() =>
                          weekend.weekendId !== undefined &&
                          handleWeekendToggle(weekend.weekendId)
                        }
                      />
                      <label
                        htmlFor={`weekend-${weekend.weekendId}`}
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                      >
                        {weekend.day}
                      </label>
                    </div>
                  ))}
                </div>
                {selectedWeekendIds.length > 0 && (
                  <p className="text-xs text-green-600">
                    ✓ {selectedWeekendIds.length} weekend(s) selected
                  </p>
                )}
              </div>
            </div>
          </div>

          {error && (
            <div className="text-sm text-red-600 bg-red-50 p-2 rounded">
              {error}
            </div>
          )}

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={closePopup}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={addMutation.isPending || updateMutation.isPending}
            >
              {addMutation.isPending || updateMutation.isPending
                ? 'Saving...'
                : 'Save'}
            </Button>
          </div>
        </form>
      </Popup>

      <AlertDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
      >
        <AlertDialogContent className="bg-white">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Office Timing</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this office timing? This action
              cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex justify-end gap-2 mt-4">
            <AlertDialogCancel onClick={() => setIsDeleteDialogOpen(false)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (deletingTimingId) {
                  console.log('Deleting timing with ID:', deletingTimingId)
                  deleteMutation.mutate({ id: deletingTimingId })
                } else {
                  console.error('No timing ID to delete')
                }
                setIsDeleteDialogOpen(false)
              }}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Delete
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

export default OfficeTimingAndWeekends
