'use client'

import type React from 'react'
import { useCallback, useState, useMemo, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ArrowUpDown, Search, Calendar, Edit2, Trash2 } from 'lucide-react'
import { Popup } from '@/utils/popup'
import type { CreateNewHolidayType, GetNewHolidayType, GetHolidayCalendarType } from '@/utils/type'
import { useInitializeUser } from '@/utils/user'
import {
  useGetNewHolidays,
  useAddNewHolidayRange,
  useUpdateNewHoliday,
  useDeleteNewHoliday,
  useGetHolidayCalendars,
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

const HOLIDAY_TYPES = ['PUBLIC', 'RELIGIOUS', 'NATIONAL', 'COMPANY', 'OPTIONAL']

const Holidays = () => {
  useInitializeUser()

  const searchParams = useSearchParams()
  const calendarIdFromUrl = Number(searchParams.get('calendarId') ?? 0)

  // যদি URL এ calendarId থাকে, dropdown দেখাব না
  const showCalendarDropdown = calendarIdFromUrl === 0

  // ── Calendar list (dropdown এর জন্য) ──
  const { data: calendarsRes } = useGetHolidayCalendars()
  const calendarList: GetHolidayCalendarType[] = useMemo(() => {
    const raw = calendarsRes?.data
    if (!raw || !Array.isArray(raw)) return []
    return raw
  }, [calendarsRes?.data])

  const [selectedCalendarId, setSelectedCalendarId] = useState<number>(0)

  useEffect(() => {
    if (calendarIdFromUrl > 0) {
      // URL থেকে আসলে সেটাই use করো
      setSelectedCalendarId(calendarIdFromUrl)
    } else if (calendarList.length > 0 && selectedCalendarId === 0) {
      // না হলে প্রথম calendar auto-select
      setSelectedCalendarId(calendarList[0].id)
    }
  }, [calendarIdFromUrl, calendarList, selectedCalendarId])

  // Selected calendar এর label
  const selectedCalendarLabel = useMemo(() => {
    const cal = calendarList.find((c) => c.id === selectedCalendarId)
    if (!cal) return ''
    return cal.name ? `${cal.name} (${cal.year})` : `Calendar ${cal.year}`
  }, [calendarList, selectedCalendarId])

  // ── Holidays ──
  const { data: holidays } = useGetNewHolidays(selectedCalendarId)

  const [error, setError] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [holidaysPerPage] = useState(10)
  const [sortColumn, setSortColumn] = useState<keyof GetNewHolidayType>('title')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')
  const [searchTerm, setSearchTerm] = useState('')

  const [isPopupOpen, setIsPopupOpen] = useState(false)
  const [isEditMode, setIsEditMode] = useState(false)
  const [editingHolidayId, setEditingHolidayId] = useState<number | null>(null)

  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [deletingHolidayId, setDeletingHolidayId] = useState<number | null>(null)

  const getTodayDate = () => new Date().toISOString().split('T')[0]

  const [formData, setFormData] = useState<CreateNewHolidayType>({
    calendarId: selectedCalendarId,
    title: '',
    startDate: getTodayDate(),
    endDate: getTodayDate(),
    type: 'PUBLIC',
    isRecurring: false,
    isOptional: false,
    description: '',
  })

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const resetForm = useCallback(() => {
    setFormData({
      calendarId: selectedCalendarId,
      title: '',
      startDate: getTodayDate(),
      endDate: getTodayDate(),
      type: 'PUBLIC',
      isRecurring: false,
      isOptional: false,
      description: '',
    })
    setEditingHolidayId(null)
    setIsEditMode(false)
    setIsPopupOpen(false)
    setError(null)
  }, [selectedCalendarId])

  const closePopup = useCallback(() => {
    setIsPopupOpen(false)
    setError(null)
    resetForm()
  }, [resetForm])

  const addMutation = useAddNewHolidayRange({ onClose: closePopup, reset: resetForm })
  const updateMutation = useUpdateNewHoliday({ onClose: closePopup, reset: resetForm })
  const deleteMutation = useDeleteNewHoliday({ onClose: closePopup, reset: resetForm })

  const handleSort = (column: keyof GetNewHolidayType) => {
    if (column === sortColumn) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortColumn(column)
      setSortDirection('asc')
    }
  }

  // Client-side filter by selectedCalendarId
  const holidayList: GetNewHolidayType[] = useMemo(() => {
    const raw = holidays?.data
    if (!raw || !Array.isArray(raw)) return []
    if (selectedCalendarId > 0) {
      return raw.filter((h) => h.calendarId === selectedCalendarId)
    }
    return raw
  }, [holidays?.data, selectedCalendarId])

  const filteredHolidays = useMemo(() => {
    return holidayList.filter((h) =>
      h.title?.toLowerCase().includes(searchTerm.toLowerCase())
    )
  }, [holidayList, searchTerm])

  const sortedHolidays = useMemo(() => {
    return [...filteredHolidays].sort((a, b) => {
      const aValue = a[sortColumn] ?? ''
      const bValue = b[sortColumn] ?? ''
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sortDirection === 'asc'
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue)
      }
      return sortDirection === 'asc'
        ? aValue > bValue ? 1 : -1
        : bValue > aValue ? 1 : -1
    })
  }, [filteredHolidays, sortColumn, sortDirection])

  const totalPages = Math.ceil(sortedHolidays.length / holidaysPerPage)

  const paginatedHolidays = useMemo(() => {
    const startIndex = (currentPage - 1) * holidaysPerPage
    return sortedHolidays.slice(startIndex, startIndex + holidaysPerPage)
  }, [sortedHolidays, currentPage, holidaysPerPage])

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault()
      setError(null)
      try {
        if (isEditMode && editingHolidayId) {
          updateMutation.mutate({
            id: editingHolidayId,
            data: {
              title: formData.title,
              type: formData.type,
              isRecurring: formData.isRecurring,
              isOptional: formData.isOptional,
              description: formData.description,
            },
          })
        } else {
          addMutation.mutate({
            ...formData,
            calendarId: selectedCalendarId,
          })
        }
      } catch (err) {
        setError('Failed to save holiday')
        console.error(err)
      }
    },
    [formData, isEditMode, editingHolidayId, addMutation, updateMutation, selectedCalendarId]
  )

  const handleEditClick = (holiday: GetNewHolidayType) => {
    setFormData({
      calendarId: holiday.calendarId,
      title: holiday.title,
      startDate: holiday.date?.split(' ')[0]?.split('T')[0] ?? getTodayDate(),
      endDate: holiday.date?.split(' ')[0]?.split('T')[0] ?? getTodayDate(),
      type: holiday.type,
      isRecurring: holiday.isRecurring ?? false,
      isOptional: holiday.isOptional ?? false,
      description: holiday.description ?? '',
    })
    setEditingHolidayId(holiday.id)
    setIsEditMode(true)
    setIsPopupOpen(true)
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2 mb-4">
          <div className="bg-blue-100 p-2 rounded-md">
            <Calendar className="text-blue-600" />
          </div>
          <div>
            <h2 className="text-lg font-semibold">Holidays</h2>
            {selectedCalendarLabel && (
              <p className="text-sm text-gray-500">{selectedCalendarLabel}</p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-4">
          {/* Calendar dropdown — শুধু URL এ calendarId না থাকলে দেখাবে */}
          {showCalendarDropdown && (
            <Select
              value={selectedCalendarId > 0 ? String(selectedCalendarId) : ''}
              onValueChange={(val) => {
                setSelectedCalendarId(Number(val))
                setCurrentPage(1)
              }}
            >
              <SelectTrigger className="w-52">
                <SelectValue placeholder="Select calendar..." />
              </SelectTrigger>
              <SelectContent>
                {calendarList.map((cal) => (
                  <SelectItem key={cal.id} value={String(cal.id)}>
                    {cal.name ? `${cal.name} (${cal.year})` : `Calendar ${cal.year}`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

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
            className="bg-blue-400 hover:bg-blue-500 text-black"
            onClick={() => {
              setFormData((prev) => ({ ...prev, calendarId: selectedCalendarId }))
              setIsPopupOpen(true)
            }}
            disabled={selectedCalendarId === 0}
          >
            Add
          </Button>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader className="bg-blue-100">
            <TableRow>
              <TableHead>Sl No.</TableHead>
              <TableHead onClick={() => handleSort('title')} className="cursor-pointer">
                Holiday Name <ArrowUpDown className="ml-2 h-4 w-4 inline" />
              </TableHead>
              <TableHead onClick={() => handleSort('date')} className="cursor-pointer">
                Date <ArrowUpDown className="ml-2 h-4 w-4 inline" />
              </TableHead>
              <TableHead onClick={() => handleSort('type')} className="cursor-pointer">
                Type <ArrowUpDown className="ml-2 h-4 w-4 inline" />
              </TableHead>
              <TableHead>Recurring</TableHead>
              <TableHead>Optional</TableHead>
              <TableHead>Description</TableHead>
              <TableHead className="text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {selectedCalendarId === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-4 text-gray-400">
                  Please select a calendar to view holidays
                </TableCell>
              </TableRow>
            ) : holidays === undefined ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-4">
                  Loading holidays...
                </TableCell>
              </TableRow>
            ) : holidayList.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-4">
                  No holidays found for {selectedCalendarLabel}
                </TableCell>
              </TableRow>
            ) : paginatedHolidays.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-4">
                  No holidays match your search
                </TableCell>
              </TableRow>
            ) : (
              paginatedHolidays.map((holiday, index) => (
                <TableRow key={holiday.id}>
                  <TableCell>
                    {(currentPage - 1) * holidaysPerPage + index + 1}
                  </TableCell>
                  <TableCell className="font-medium">{holiday.title}</TableCell>
                  <TableCell>
                    {holiday.date ? formatDate(new Date(holiday.date)) : '-'}
                  </TableCell>
                  <TableCell>{holiday.type}</TableCell>
                  <TableCell>{holiday.isRecurring ? 'Yes' : 'No'}</TableCell>
                  <TableCell>{holiday.isOptional ? 'Yes' : 'No'}</TableCell>
                  <TableCell>{holiday.description || '-'}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-blue-600 hover:text-blue-700"
                        onClick={() => handleEditClick(holiday)}
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-red-600 hover:text-red-700"
                        onClick={() => {
                          setDeletingHolidayId(holiday.id)
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

      {/* Pagination */}
      {sortedHolidays.length > 0 && (
        <div className="mt-4">
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                  className={currentPage === 1 ? 'pointer-events-none opacity-50' : ''}
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
                } else if (index === currentPage - 3 || index === currentPage + 3) {
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
                  onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                  className={currentPage === totalPages ? 'pointer-events-none opacity-50' : ''}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      )}

      {/* Add/Edit Popup */}
      <Popup
        isOpen={isPopupOpen}
        onClose={closePopup}
        title={isEditMode ? 'Edit Holiday' : 'Add Holiday'}
        size="sm:max-w-md"
      >
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="grid gap-4">
            <div className="space-y-2">
              <Label htmlFor="title">
                Holiday Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="title"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                required
              />
            </div>

            {isEditMode ? (
              <div className="space-y-2">
                <Label htmlFor="startDate">
                  Date <span className="text-red-500">*</span>
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
            ) : (
              <>
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
              </>
            )}

            <div className="space-y-2">
              <Label htmlFor="type">
                Type <span className="text-red-500">*</span>
              </Label>
              <Select
                value={formData.type}
                onValueChange={(val) =>
                  setFormData((prev) => ({ ...prev, type: val }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  {HOLIDAY_TYPES.map((t) => (
                    <SelectItem key={t} value={t}>
                      {t}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex gap-6">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.isRecurring ?? false}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, isRecurring: e.target.checked }))
                  }
                />
                <span className="text-sm">Recurring (yearly)</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.isOptional ?? false}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, isOptional: e.target.checked }))
                  }
                />
                <span className="text-sm">Optional</span>
              </label>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                name="description"
                value={formData.description ?? ''}
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
              {addMutation.isPending || updateMutation.isPending ? 'Saving...' : 'Save'}
            </Button>
          </div>
        </form>
      </Popup>

      {/* Delete Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent className="bg-white">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Holiday</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this holiday? This action cannot be undone.
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


