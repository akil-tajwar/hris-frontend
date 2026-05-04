'use client'

import type React from 'react'
import { useCallback, useEffect, useState, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
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
import { ArrowUpDown, Search, Calendar, Edit2, Trash2 } from 'lucide-react'
import { Popup } from '@/utils/popup'
import type { CreateHolidayType, GetHolidayType } from '@/utils/type'
import { useInitializeUser, userDataAtom } from '@/utils/user'
import { useAtom } from 'jotai'
import {
  useAddHoliday,
  useDeleteHoliday,
  useGetHolidays,
  useUpdateHoliday,
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
import { Textarea } from '@/components/ui/textarea'
import { formatDate } from '@/utils/conversions'

const Holidays = () => {
  useInitializeUser()
  const [userData] = useAtom(userDataAtom)

  const { data: holidays } = useGetHolidays()
  console.log('🚀 ~ Holidays ~ holidays:', holidays)

  const [error, setError] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [holidaysPerPage] = useState(10)
  const [sortColumn, setSortColumn] =
    useState<keyof GetHolidayType>('holidayName')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')
  const [searchTerm, setSearchTerm] = useState('')

  const [isPopupOpen, setIsPopupOpen] = useState(false)
  const [isEditMode, setIsEditMode] = useState(false)
  const [editingHolidayId, setEditingHolidayId] = useState<number | null>(null)

  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [deletingHolidayId, setDeletingHolidayId] = useState<number | null>(
    null
  )

  const getTodayDate = () => {
    const today = new Date()
    return today.toISOString().split('T')[0]
  }

  const [formData, setFormData] = useState<CreateHolidayType>({
    holidayName: '',
    startDate: getTodayDate(),
    endDate: getTodayDate(),
    noOfDays: 1,
    description: '',
    createdBy: userData?.userId || 0,
  })

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'noOfDays' ? Number(value) : value,
    }))
  }

  // Calculate number of days when dates change
  useEffect(() => {
    if (formData.startDate && formData.endDate) {
      const start = new Date(formData.startDate)
      const end = new Date(formData.endDate)
      const diffTime = end.getTime() - start.getTime()
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1 // +1 to include both start and end dates

      if (diffDays > 0) {
        setFormData((prev) => ({
          ...prev,
          noOfDays: diffDays,
        }))
      }
    }
  }, [formData.startDate, formData.endDate])

  const resetForm = useCallback(() => {
    setFormData({
      holidayName: '',
      startDate: getTodayDate(),
      endDate: getTodayDate(),
      noOfDays: 1,
      description: '',
      createdBy: userData?.userId || 0,
    })
    setEditingHolidayId(null)
    setIsEditMode(false)
    setIsPopupOpen(false)
    setError(null)
  }, [userData?.userId])

  const closePopup = useCallback(() => {
    setIsPopupOpen(false)
    setError(null)
    resetForm()
  }, [resetForm])

  const addMutation = useAddHoliday({
    onClose: closePopup,
    reset: resetForm,
  })

  const updateMutation = useUpdateHoliday({
    onClose: closePopup,
    reset: resetForm,
  })

  const deleteMutation = useDeleteHoliday({
    onClose: closePopup,
    reset: resetForm,
  })

  const handleSort = (column: keyof GetHolidayType) => {
    if (column === sortColumn) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortColumn(column)
      setSortDirection('asc')
    }
  }

  const filteredHolidays = useMemo(() => {
    if (!holidays?.data || !Array.isArray(holidays.data)) return []
    return holidays.data.filter((holiday) =>
      holiday.holidayName?.toLowerCase().includes(searchTerm.toLowerCase())
    )
  }, [holidays?.data, searchTerm])

  const sortedHolidays = useMemo(() => {
    if (!Array.isArray(filteredHolidays)) return []
    return [...filteredHolidays].sort((a, b) => {
      const aValue = a[sortColumn] ?? ''
      const bValue = b[sortColumn] ?? ''

      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sortDirection === 'asc'
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue)
      }

      return sortDirection === 'asc'
        ? aValue > bValue
          ? 1
          : -1
        : bValue > aValue
          ? 1
          : -1
    })
  }, [filteredHolidays, sortColumn, sortDirection])

  const paginatedHolidays = useMemo(() => {
    const startIndex = (currentPage - 1) * holidaysPerPage
    return sortedHolidays.slice(startIndex, startIndex + holidaysPerPage)
  }, [sortedHolidays, currentPage, holidaysPerPage])

  const totalPages = Math.ceil(sortedHolidays.length / holidaysPerPage)

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault()

      setError(null)

      try {
        const submitData: CreateHolidayType = {
          holidayName: formData.holidayName,
          startDate: formData.startDate,
          endDate: formData.endDate,
          noOfDays: formData.noOfDays,
          description: formData.description,
          createdBy: formData.createdBy,
        }

        if (isEditMode) {
          submitData.updatedBy = userData?.userId || 0
          submitData.updatedAt = Date.now()
        } else {
          submitData.createdBy = userData?.userId || 0
        }

        if (isEditMode && editingHolidayId) {
          updateMutation.mutate({
            id: editingHolidayId,
            data: submitData,
          })
          console.log('update', isEditMode, editingHolidayId)
        } else {
          addMutation.mutate(submitData)
          console.log('create')
        }
      } catch (err) {
        setError('Failed to save holiday')
        console.error(err)
      }
    },
    [
      formData,
      isEditMode,
      editingHolidayId,
      addMutation,
      updateMutation,
      userData,
    ]
  )

  useEffect(() => {
    if (addMutation.error || updateMutation.error) {
      setError('Error saving holiday')
    }
  }, [addMutation.error, updateMutation.error])

  const handleEditClick = (holiday: any) => {
    setFormData({
      holidayName: holiday.holidayName,
      startDate: holiday.startDate,
      endDate: holiday.endDate,
      noOfDays: holiday.noOfDays,
      description: holiday.description || '',
      createdBy: userData?.userId || 0,
    })
    setEditingHolidayId(holiday.holidayId)
    setIsEditMode(true)
    setIsPopupOpen(true)
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2 mb-4">
          <div className="bg-amber-100 p-2 rounded-md">
            <Calendar className="text-amber-600" />
          </div>
          <h2 className="text-lg font-semibold">Holidays</h2>
        </div>
        <div className="flex items-center gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search holidays..."
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
                onClick={() => handleSort('holidayName')}
                className="cursor-pointer"
              >
                Holiday Name <ArrowUpDown className="ml-2 h-4 w-4 inline" />
              </TableHead>
              <TableHead
                onClick={() => handleSort('startDate')}
                className="cursor-pointer"
              >
                Start Date <ArrowUpDown className="ml-2 h-4 w-4 inline" />
              </TableHead>
              <TableHead
                onClick={() => handleSort('endDate')}
                className="cursor-pointer"
              >
                End Date <ArrowUpDown className="ml-2 h-4 w-4 inline" />
              </TableHead>
              <TableHead
                onClick={() => handleSort('noOfDays')}
                className="cursor-pointer"
              >
                No. of Days <ArrowUpDown className="ml-2 h-4 w-4 inline" />
              </TableHead>
              <TableHead>Description</TableHead>
              <TableHead className="text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {!holidays || holidays.data === undefined ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-4">
                  Loading holidays...
                </TableCell>
              </TableRow>
            ) : !holidays.data || holidays.data.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-4">
                  No holidays found
                </TableCell>
              </TableRow>
            ) : paginatedHolidays.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-4">
                  No holidays match your search
                </TableCell>
              </TableRow>
            ) : (
              paginatedHolidays.map((holiday: any, index) => (
                <TableRow key={index}>
                  <TableCell>{index + 1}</TableCell>
                  <TableCell className="font-medium">
                    {holiday.holidayName}
                  </TableCell>
                  <TableCell>{formatDate(holiday.startDate)}</TableCell>
                  <TableCell>{formatDate(holiday.endDate)}</TableCell>
                  <TableCell>{holiday.noOfDays}</TableCell>
                  <TableCell>{holiday.description || '-'}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-amber-600 hover:text-amber-700"
                        onClick={() => handleEditClick(holiday)}
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-red-600 hover:text-red-700"
                        onClick={() => {
                          setDeletingHolidayId(holiday.holidayId)
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

      {sortedHolidays.length > 0 && (
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
        title={isEditMode ? 'Edit Holiday' : 'Add Holiday'}
        size="sm:max-w-md"
      >
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="grid gap-4">
            <div className="space-y-2">
              <Label htmlFor="holidayName">
                Holiday Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="holidayName"
                name="holidayName"
                value={formData.holidayName}
                onChange={handleInputChange}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="startDate">
                Start Date <span className="text-red-500">*</span>
              </Label>
              <Input
                id="startDate"
                name="startDate"
                type="date"
                value={formData.startDate}
                onChange={handleInputChange}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="endDate">
                End Date <span className="text-red-500">*</span>
              </Label>
              <Input
                id="endDate"
                name="endDate"
                type="date"
                value={formData.endDate}
                onChange={handleInputChange}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="noOfDays">
                Number of Days <span className="text-red-500">*</span>
              </Label>
              <Input
                id="noOfDays"
                name="noOfDays"
                type="number"
                min="1"
                value={formData.noOfDays}
                readOnly
                className="bg-gray-50 cursor-not-allowed"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                name="description"
                value={formData.description || ''}
                onChange={handleInputChange}
                rows={3}
              />
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
            <AlertDialogTitle>Delete Holiday</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this holiday? This action cannot
              be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex justify-end gap-2 mt-4">
            <AlertDialogCancel onClick={() => setIsDeleteDialogOpen(false)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (deletingHolidayId) {
                  deleteMutation.mutate({ id: deletingHolidayId })
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

export default Holidays
