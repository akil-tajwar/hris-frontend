'use client'

import { useCallback, useMemo, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Table, TableBody, TableCell, TableHead,
  TableHeader, TableRow,
} from '@/components/ui/table'
import {
  Pagination, PaginationContent, PaginationItem,
  PaginationLink, PaginationNext, PaginationPrevious,
} from '@/components/ui/pagination'
import {
  Select, SelectContent, SelectItem,
  SelectTrigger, SelectValue,
} from '@/components/ui/select'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription,
  AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { ArrowUpDown, CalendarDays, Edit2, Search, Trash2 } from 'lucide-react'
import { Popup } from '@/utils/popup'
import { useInitializeUser, userDataAtom } from '@/utils/user'
import { useAtom } from 'jotai'
import {
  useAddHolidayCalendar,
  useDeleteHolidayCalendar,
  useGetHolidayCalendars,
  useUpdateHolidayCalendar,
} from '@/hooks/use-api'
import { useGetCompanies } from '@/hooks/use-api'
import type { CreateHolidayCalendarType, GetHolidayCalendarType } from '@/utils/type'
import { useRouter } from 'next/navigation'

const HolidayCalendars = () => {
  useInitializeUser()
  const [userData] = useAtom(userDataAtom)
  const router = useRouter()

  const { data: calendars } = useGetHolidayCalendars()
  const { data: companies } = useGetCompanies()

  const [searchTerm, setSearchTerm] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const perPage = 10
  const [sortColumn, setSortColumn] = useState<keyof GetHolidayCalendarType>('year')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc')

  const [isPopupOpen, setIsPopupOpen] = useState(false)
  const [isEditMode, setIsEditMode] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [deletingId, setDeletingId] = useState<number | null>(null)

  const currentYear = new Date().getFullYear()

  const [formData, setFormData] = useState<CreateHolidayCalendarType>({
    companyId: 0,
    year: currentYear,
    name: '',
    isActive: true,
  })

  const resetForm = useCallback(() => {
    setFormData({ companyId: 0, year: currentYear, name: '', isActive: true })
    setEditingId(null)
    setIsEditMode(false)
    setIsPopupOpen(false)
  }, [currentYear])

  const closePopup = useCallback(() => {
    setIsPopupOpen(false)
    resetForm()
  }, [resetForm])

  const addMutation = useAddHolidayCalendar({ onClose: closePopup, reset: resetForm })
  const updateMutation = useUpdateHolidayCalendar({ onClose: closePopup, reset: resetForm })
  const deleteMutation = useDeleteHolidayCalendar({ onClose: closePopup, reset: resetForm })

  const handleSort = (col: keyof GetHolidayCalendarType) => {
    if (col === sortColumn) setSortDirection(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortColumn(col); setSortDirection('asc') }
  }

  const calendarList: GetHolidayCalendarType[] = useMemo(() => {
    if (!calendars?.data || !Array.isArray(calendars.data)) return []
    return calendars.data
  }, [calendars?.data])

  const filtered = useMemo(() =>
    calendarList.filter(c =>
      c.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      String(c.year).includes(searchTerm)
    ), [calendarList, searchTerm])

  const sorted = useMemo(() => [...filtered].sort((a, b) => {
    const av = a[sortColumn] ?? ''
    const bv = b[sortColumn] ?? ''
    if (typeof av === 'string' && typeof bv === 'string')
      return sortDirection === 'asc' ? av.localeCompare(bv) : bv.localeCompare(av)
    return sortDirection === 'asc' ? (av > bv ? 1 : -1) : (bv > av ? 1 : -1)
  }), [filtered, sortColumn, sortDirection])

  const totalPages = Math.ceil(sorted.length / perPage)
  const paginated = useMemo(() =>
    sorted.slice((currentPage - 1) * perPage, currentPage * perPage),
    [sorted, currentPage])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.companyId) return

    const payload = {
      ...formData,
      name: formData.name || `Holiday Calendar ${formData.year}`,
    }

    if (isEditMode && editingId) {
      updateMutation.mutate({ id: editingId, data: payload })
    } else {
      addMutation.mutate(payload)
    }
  }

  const handleEditClick = (cal: GetHolidayCalendarType) => {
    setFormData({
      companyId: cal.companyId,
      year: cal.year,
      name: cal.name || '',
      isActive: cal.isActive ?? true,
    })
    setEditingId(cal.id)
    setIsEditMode(true)
    setIsPopupOpen(true)
  }

  const companyName = (id: number) =>
    companies?.data?.find((c: any) => c.companyId === id)?.companyName || '-'

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <div className="bg-blue-100 p-2 rounded-md">
            <CalendarDays className="text-blue-600" />
          </div>
          <h2 className="text-lg font-semibold">Holiday Calendars</h2>
        </div>
        <div className="flex items-center gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search calendars..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="pl-10 w-64"
            />
          </div>
          <Button
            className="bg-blue-400 hover:bg-blue-500 text-black"
            onClick={() => setIsPopupOpen(true)}
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
              <TableHead className="cursor-pointer" onClick={() => handleSort('name')}>
                Calendar Name <ArrowUpDown className="ml-1 h-4 w-4 inline" />
              </TableHead>
              <TableHead className="cursor-pointer" onClick={() => handleSort('year')}>
                Year <ArrowUpDown className="ml-1 h-4 w-4 inline" />
              </TableHead>
              <TableHead>Company</TableHead>
              <TableHead className="cursor-pointer" onClick={() => handleSort('isActive')}>
                Status <ArrowUpDown className="ml-1 h-4 w-4 inline" />
              </TableHead>
              <TableHead className="text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginated.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                  No calendars found
                </TableCell>
              </TableRow>
            ) : (
              paginated.map((cal, idx) => (
                <TableRow key={cal.id}>
                  <TableCell>{(currentPage - 1) * perPage + idx + 1}</TableCell>
                  <TableCell className="font-medium">{cal.name || '-'}</TableCell>
                  <TableCell>{cal.year}</TableCell>
                  <TableCell>{companyName(cal.companyId)}</TableCell>
                  <TableCell>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      cal.isActive
                        ? 'bg-green-100 text-green-700'
                        : 'bg-gray-100 text-gray-600'
                    }`}>
                      {cal.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-blue-600 border-blue-200 hover:bg-blue-50"
                        onClick={() => router.push(`/holidays?calendarId=${cal.id}`)}
                      >
                        View Holidays
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-blue-600 hover:text-blue-700"
                        onClick={() => handleEditClick(cal)}
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-red-600 hover:text-red-700"
                        onClick={() => { setDeletingId(cal.id); setIsDeleteDialogOpen(true) }}
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
      {sorted.length > perPage && (
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                onClick={() => setCurrentPage(p => Math.max(p - 1, 1))}
                className={currentPage === 1 ? 'pointer-events-none opacity-50' : ''}
              />
            </PaginationItem>
            {[...Array(totalPages)].map((_, i) => (
              <PaginationItem key={i}>
                <PaginationLink onClick={() => setCurrentPage(i + 1)} isActive={currentPage === i + 1}>
                  {i + 1}
                </PaginationLink>
              </PaginationItem>
            ))}
            <PaginationItem>
              <PaginationNext
                onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))}
                className={currentPage === totalPages ? 'pointer-events-none opacity-50' : ''}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      )}

      {/* Create/Edit Popup */}
      <Popup
        isOpen={isPopupOpen}
        onClose={closePopup}
        title={isEditMode ? 'Edit Holiday Calendar' : 'Add Holiday Calendar'}
        size="sm:max-w-md"
      >
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          {/* Company */}
          <div className="space-y-2">
            <Label>Company <span className="text-red-500">*</span></Label>
            <Select
              value={formData.companyId ? String(formData.companyId) : ''}
              onValueChange={v => setFormData(p => ({ ...p, companyId: Number(v) }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select company" />
              </SelectTrigger>
              <SelectContent>
                {companies?.data?.map((c: any) => (
                  <SelectItem key={c.companyId} value={String(c.companyId)}>
                    {c.companyName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Year */}
          <div className="space-y-2">
            <Label>Year <span className="text-red-500">*</span></Label>
            <Input
              type="number"
              min="2000"
              max="2100"
              value={formData.year}
              onChange={e => setFormData(p => ({ ...p, year: Number(e.target.value) }))}
              required
            />
          </div>

          {/* Name */}
          <div className="space-y-2">
            <Label>Calendar Name</Label>
            <Input
              placeholder={`Holiday Calendar ${formData.year}`}
              value={formData.name || ''}
              onChange={e => setFormData(p => ({ ...p, name: e.target.value }))}
            />
          </div>

          {/* Status */}
          <div className="space-y-2">
            <Label>Status</Label>
            <Select
              value={formData.isActive ? 'true' : 'false'}
              onValueChange={v => setFormData(p => ({ ...p, isActive: v === 'true' }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="true">Active</SelectItem>
                <SelectItem value="false">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={closePopup}>Cancel</Button>
            <Button
              type="submit"
              disabled={addMutation.isPending || updateMutation.isPending || !formData.companyId}
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
            <AlertDialogTitle>Delete Holiday Calendar</AlertDialogTitle>
            <AlertDialogDescription>
              এই calendar delete করলে এর সব holidays ও delete হয়ে যাবে। নিশ্চিত?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex justify-end gap-2 mt-4">
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700 text-white"
              onClick={() => {
                if (deletingId) deleteMutation.mutate({ id: deletingId })
                setIsDeleteDialogOpen(false)
              }}
            >
              Delete
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

export default HolidayCalendars