'use client'

import React from 'react'
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
import {
  ArrowUpDown,
  Search,
  Bell,
  Edit2,
  Trash2,
  FileText,
} from 'lucide-react'
import { Popup } from '@/utils/popup'
import type { CreateNoticeType, GetNoticeType } from '@/utils/type'
import { useInitializeUser, userDataAtom } from '@/utils/user'
import { useAtom } from 'jotai'
import {
  useAddNotice,
  useDeleteNotice,
  useGetNotice,
  useUpdateNotice,
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

const DEFAULT_FORM: CreateNoticeType = {
  title: '',
  description: '',
  pdfUrl: '',
  noticeDate: new Date(),
  tenantId: 0,
  createdBy: 0,
}

const formatDateForInput = (date: Date | string | undefined) => {
  if (!date) return ''
  const d = new Date(date)
  if (Number.isNaN(d.getTime())) return ''
  return d.toISOString().split('T')[0]
}

// Extend GetNoticeType but keep noticeId optional
interface NoticeItem extends GetNoticeType {
  noticeId?: number
  tenantId: number
  createdBy: number
  updatedBy?: number
}

const Notice = () => {
  useInitializeUser()
  const [userData] = useAtom(userDataAtom)

  const { data: notices } = useGetNotice()
  console.log('🚀 ~ Notice ~ notices:', notices)

  const [error, setError] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [noticesPerPage] = useState(10)
  const [sortColumn, setSortColumn] =
    useState<keyof GetNoticeType>('noticeDate')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc')
  const [searchTerm, setSearchTerm] = useState('')

  const [isPopupOpen, setIsPopupOpen] = useState(false)
  const [isEditMode, setIsEditMode] = useState(false)
  const [editingNoticeId, setEditingNoticeId] = useState<number | null>(null)

  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [deletingNoticeId, setDeletingNoticeId] = useState<number | null>(null)

  const [formData, setFormData] = useState<CreateNoticeType>({
    ...DEFAULT_FORM,
    createdBy: userData?.userId || 0,
  })

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'noticeDate' ? new Date(value) : value,
    }))
  }

  const [pdfFile, setPdfFile] = useState<File | null>(null)
  const [pdfPreviewName, setPdfPreviewName] = useState<string | null>(null)

  const handlePdfChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null
    setPdfFile(file)
    setPdfPreviewName(file ? file.name : null)
  }

  const resetForm = useCallback(() => {
    setFormData({
      ...DEFAULT_FORM,
      createdBy: userData?.userId || 0,
    })
    setPdfFile(null)
    setPdfPreviewName(null)
    setEditingNoticeId(null)
    setIsEditMode(false)
    setIsPopupOpen(false)
    setError(null)
  }, [userData?.userId])

  const closePopup = useCallback(() => {
    setIsPopupOpen(false)
    setError(null)
    resetForm()
  }, [resetForm])

  const addMutation = useAddNotice({ onClose: closePopup, reset: resetForm })
  const updateMutation = useUpdateNotice({
    onClose: closePopup,
    reset: resetForm,
  })
  const deleteMutation = useDeleteNotice({
    onClose: closePopup,
    reset: resetForm,
  })

  const handleSort = (column: keyof GetNoticeType) => {
    if (column === sortColumn) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortColumn(column)
      setSortDirection('asc')
    }
  }

  // Type guard to check if notice has noticeId
  const hasNoticeId = (
    notice: any
  ): notice is NoticeItem & { noticeId: number } => {
    return notice && typeof notice.noticeId === 'number'
  }

  const filteredNotices = useMemo(() => {
    if (!notices?.data || !Array.isArray(notices.data)) return []
    return notices.data.filter((notice: any) =>
      notice.title?.toLowerCase().includes(searchTerm.toLowerCase())
    )
  }, [notices?.data, searchTerm])

  const sortedNotices = useMemo(() => {
    if (!Array.isArray(filteredNotices)) return []
    return [...filteredNotices].sort((a: any, b: any) => {
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
  }, [filteredNotices, sortColumn, sortDirection])

  const paginatedNotices = useMemo(() => {
    const startIndex = (currentPage - 1) * noticesPerPage
    return sortedNotices.slice(startIndex, startIndex + noticesPerPage)
  }, [sortedNotices, currentPage, noticesPerPage])

  const totalPages = Math.ceil(sortedNotices.length / noticesPerPage)

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault()
      setError(null)
      try {
        const submitData = new FormData()
        submitData.append('tenantId', String(userData?.tenantId))
        submitData.append('title', formData.title)
        submitData.append('description', formData.description || '')
        submitData.append(
          'noticeDate',
          formData.noticeDate
            ? new Date(formData.noticeDate).toISOString()
            : new Date().toISOString()
        )
        if (isEditMode) {
          submitData.append('updatedBy', String(userData?.userId || 0))
        } else {
          submitData.append('createdBy', String(userData?.userId || 0))
        }
        if (pdfFile) {
          submitData.append('pdfUrl', pdfFile)
        }

        if (isEditMode && editingNoticeId) {
          updateMutation.mutate({ id: editingNoticeId, formData: submitData })
        } else {
          addMutation.mutate(submitData)
        }
      } catch (err) {
        setError('Failed to save notice')
        console.error(err)
      }
    },
    [
      formData,
      isEditMode,
      editingNoticeId,
      pdfFile,
      addMutation,
      updateMutation,
      userData,
    ]
  )

  useEffect(() => {
    if (addMutation.error || updateMutation.error) {
      setError('Error saving notice')
    }
  }, [addMutation.error, updateMutation.error])

  const handleEditClick = (notice: any) => {
    setFormData({
      title: notice.title,
      description: notice.description || '',
      pdfUrl: notice.pdfUrl || '',
      noticeDate: notice.noticeDate ? new Date(notice.noticeDate) : new Date(),
      tenantId: notice.tenantId,
      createdBy: notice.createdBy || 0,
      updatedBy: userData?.userId || 0,
    })
    setPdfPreviewName(notice.pdfUrl ? notice.pdfUrl.split('/').pop() : null)
    setEditingNoticeId(notice.noticeId || null)
    setIsEditMode(true)
    setIsPopupOpen(true)
  }

  const handleDeleteClick = (noticeId: number | undefined) => {
    if (noticeId) {
      setDeletingNoticeId(noticeId)
      setIsDeleteDialogOpen(true)
    }
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2 mb-4">
          <div className="bg-blue-100 p-2 rounded-md">
            <Bell className="text-blue-600" />
          </div>
          <h2 className="text-lg font-semibold">Notices</h2>
        </div>
        <div className="flex items-center gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search notices..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
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

      <div className="rounded-md border">
        <Table>
          <TableHeader className="bg-blue-100">
            <TableRow>
              <TableHead>Sl No.</TableHead>
              <TableHead
                onClick={() => handleSort('title')}
                className="cursor-pointer"
              >
                Title <ArrowUpDown className="ml-2 h-4 w-4 inline" />
              </TableHead>
              <TableHead
                onClick={() => handleSort('noticeDate')}
                className="cursor-pointer"
              >
                Notice Date <ArrowUpDown className="ml-2 h-4 w-4 inline" />
              </TableHead>
              <TableHead>Description</TableHead>
              <TableHead>PDF</TableHead>
              <TableHead className="text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {!notices || notices.data === undefined ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-4">
                  Loading notices...
                </TableCell>
              </TableRow>
            ) : !notices.data || notices.data.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-4">
                  No notices found
                </TableCell>
              </TableRow>
            ) : paginatedNotices.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-4">
                  No notices match your search
                </TableCell>
              </TableRow>
            ) : (
              paginatedNotices.map((notice: any, index: number) => (
                <TableRow key={notice.noticeId || `notice-${index}`}>
                  <TableCell>
                    {(currentPage - 1) * noticesPerPage + index + 1}
                  </TableCell>
                  <TableCell className="font-medium">{notice.title}</TableCell>
                  <TableCell>
                    {notice.noticeDate
                      ? new Date(notice.noticeDate).toLocaleDateString()
                      : '—'}
                  </TableCell>
                  <TableCell className="max-w-[240px] truncate">
                    {notice.description || '—'}
                  </TableCell>
                  <TableCell>
                    {notice.pdfUrl ? (
                      <a
                        href={notice.pdfUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-blue-600 hover:underline"
                      >
                        <FileText className="h-4 w-4" />
                        View
                      </a>
                    ) : (
                      '—'
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-blue-600 hover:text-blue-700"
                        onClick={() => handleEditClick(notice)}
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-red-600 hover:text-red-700"
                        onClick={() => handleDeleteClick(notice.noticeId)}
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

      {sortedNotices.length > 0 && (
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
        title={isEditMode ? 'Edit Notice' : 'Add Notice'}
        size="sm:max-w-2xl"
      >
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          {/* ── Section: Basic Info ── */}
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">
            Basic Information
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="title">
                Title <span className="text-red-500">*</span>
              </Label>
              <Input
                id="title"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="noticeDate">
                Notice Date <span className="text-red-500">*</span>
              </Label>
              <Input
                id="noticeDate"
                name="noticeDate"
                type="date"
                value={formatDateForInput(formData.noticeDate)}
                onChange={handleInputChange}
                required
              />
            </div>

            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="description">Description</Label>
              <textarea
                id="description"
                name="description"
                value={formData.description ?? ''}
                onChange={handleInputChange}
                rows={3}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring resize-none"
              />
            </div>
          </div>

          {/* ── Section: Attachment ── */}
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 pt-2">
            Attachment
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="pdfUrl">PDF</Label>
              <Input
                id="pdfUrl"
                name="pdfUrl"
                type="file"
                accept="application/pdf"
                onChange={handlePdfChange}
                className="cursor-pointer"
              />
              {(pdfPreviewName || formData.pdfUrl) && (
                <div className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
                  <FileText className="h-4 w-4" />
                  {pdfPreviewName || formData.pdfUrl}
                </div>
              )}
            </div>
          </div>

          {error && (
            <div className="text-sm text-red-600 bg-red-50 p-2 rounded">
              {error}
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2">
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
            <AlertDialogTitle>Delete Notice</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this notice? This action cannot be
              undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex justify-end gap-2 mt-4">
            <AlertDialogCancel onClick={() => setIsDeleteDialogOpen(false)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (deletingNoticeId) {
                  deleteMutation.mutate({ id: deletingNoticeId })
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

export default Notice
