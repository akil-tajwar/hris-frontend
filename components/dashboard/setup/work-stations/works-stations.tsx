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
import { ArrowUpDown, Search, Monitor, Edit2, Trash2 } from 'lucide-react'
import { Popup } from '@/utils/popup'
import type { CreateWorkStationType, GetWorkStationType } from '@/utils/type'
import { useInitializeUser, userDataAtom } from '@/utils/user'
import { useAtom } from 'jotai'
import {
  useAddWorkStation,
  useDeleteWorkStation,
  useGetWorkStations,
  useUpdateWorkStation,
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

const WorkStations = () => {
  useInitializeUser()
  const [userData] = useAtom(userDataAtom)

  const { data: workStations } = useGetWorkStations()

  const [error, setError] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [workStationsPerPage] = useState(10)
  const [sortColumn, setSortColumn] =
    useState<keyof GetWorkStationType>('workStationName')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')
  const [searchTerm, setSearchTerm] = useState('')

  const [isPopupOpen, setIsPopupOpen] = useState(false)
  const [isEditMode, setIsEditMode] = useState(false)
  const [editingWorkStationId, setEditingWorkStationId] = useState<
    number | null
  >(null)

  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [deletingWorkStationId, setDeletingWorkStationId] = useState<
    number | null
  >(null)

  const [formData, setFormData] = useState<CreateWorkStationType>({
    workStationName: '',
    workStationNumber: 0,
    createdBy: userData?.userId || 0,
  })

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'workStationNumber' ? Number(value) : value,
    }))
  }

  const resetForm = useCallback(() => {
    setFormData({
      workStationName: '',
      workStationNumber: 0,
      createdBy: userData?.userId || 0,
    })
    setEditingWorkStationId(null)
    setIsEditMode(false)
    setIsPopupOpen(false)
    setError(null)
  }, [userData?.userId])

  const closePopup = useCallback(() => {
    setIsPopupOpen(false)
    setError(null)
    resetForm()
  }, [resetForm])

  const addMutation = useAddWorkStation({
    onClose: closePopup,
    reset: resetForm,
  })
  const updateMutation = useUpdateWorkStation({
    onClose: closePopup,
    reset: resetForm,
  })
  const deleteMutation = useDeleteWorkStation({
    onClose: closePopup,
    reset: resetForm,
  })

  const handleSort = (column: keyof GetWorkStationType) => {
    if (column === sortColumn) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortColumn(column)
      setSortDirection('asc')
    }
  }

  const filteredWorkStations = useMemo(() => {
    if (!workStations?.data || !Array.isArray(workStations.data)) return []
    return workStations.data.filter((ws) =>
      ws.workStationName?.toLowerCase().includes(searchTerm.toLowerCase())
    )
  }, [workStations?.data, searchTerm])

  const sortedWorkStations = useMemo(() => {
    if (!Array.isArray(filteredWorkStations)) return []
    return [...filteredWorkStations].sort((a, b) => {
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
  }, [filteredWorkStations, sortColumn, sortDirection])

  const paginatedWorkStations = useMemo(() => {
    const startIndex = (currentPage - 1) * workStationsPerPage
    return sortedWorkStations.slice(
      startIndex,
      startIndex + workStationsPerPage
    )
  }, [sortedWorkStations, currentPage, workStationsPerPage])

  const totalPages = Math.ceil(sortedWorkStations.length / workStationsPerPage)

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault()
      setError(null)
      try {
        const submitData: CreateWorkStationType = {
          workStationName: formData.workStationName,
          workStationNumber: formData.workStationNumber,
          createdBy: formData.createdBy,
        }
        if (isEditMode) {
          submitData.updatedBy = userData?.userId || 0
        } else {
          submitData.createdBy = userData?.userId || 0
        }
        if (isEditMode && editingWorkStationId) {
          updateMutation.mutate({ id: editingWorkStationId, data: submitData })
        } else {
          addMutation.mutate(submitData)
        }
      } catch (err) {
        setError('Failed to save work station')
        console.error(err)
      }
    },
    [
      formData,
      isEditMode,
      editingWorkStationId,
      addMutation,
      updateMutation,
      userData,
    ]
  )

  useEffect(() => {
    if (addMutation.error || updateMutation.error) {
      setError('Error saving work station')
    }
  }, [addMutation.error, updateMutation.error])

  const handleEditClick = (ws: any) => {
    setFormData({
      workStationName: ws.workStationName,
      workStationNumber: ws.workStationNumber,
      createdBy: userData?.userId || 0,
    })
    setEditingWorkStationId(ws.workStationId)
    setIsEditMode(true)
    setIsPopupOpen(true)
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2 mb-4">
          <div className="bg-blue-100 p-2 rounded-md">
            <Monitor className="text-blue-600" />
          </div>
          <h2 className="text-lg font-semibold">Work Stations</h2>
        </div>
        <div className="flex items-center gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search work stations..."
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
                onClick={() => handleSort('workStationName')}
                className="cursor-pointer"
              >
                Work Station Name{' '}
                <ArrowUpDown className="ml-2 h-4 w-4 inline" />
              </TableHead>
              <TableHead
                onClick={() => handleSort('workStationNumber')}
                className="cursor-pointer"
              >
                Work Station Number{' '}
                <ArrowUpDown className="ml-2 h-4 w-4 inline" />
              </TableHead>
              <TableHead className="text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {!workStations || workStations.data === undefined ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-4">
                  Loading work stations...
                </TableCell>
              </TableRow>
            ) : !workStations.data || workStations.data.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-4">
                  No work stations found
                </TableCell>
              </TableRow>
            ) : paginatedWorkStations.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-4">
                  No work stations match your search
                </TableCell>
              </TableRow>
            ) : (
              paginatedWorkStations.map((ws: any, index) => (
                <TableRow key={index}>
                  <TableCell>
                    {(currentPage - 1) * workStationsPerPage + index + 1}
                  </TableCell>
                  <TableCell className="font-medium">
                    {ws.workStationName}
                  </TableCell>
                  <TableCell>{ws.workStationNumber}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-blue-600 hover:text-blue-700"
                        onClick={() => handleEditClick(ws)}
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-red-600 hover:text-red-700"
                        onClick={() => {
                          setDeletingWorkStationId(ws.workStationId)
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

      {sortedWorkStations.length > 0 && (
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
        title={isEditMode ? 'Edit Work Station' : 'Add Work Station'}
        size="sm:max-w-md"
      >
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="grid gap-4">
            <div className="space-y-2">
              <Label htmlFor="workStationName">
                Work Station Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="workStationName"
                name="workStationName"
                value={formData.workStationName}
                onChange={handleInputChange}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="workStationNumber">
                Work Station Number <span className="text-red-500">*</span>
              </Label>
              <Input
                id="workStationNumber"
                name="workStationNumber"
                type="number"
                min="0"
                value={formData.workStationNumber}
                onChange={handleInputChange}
                required
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
            <AlertDialogTitle>Delete Work Station</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this work station? This action
              cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex justify-end gap-2 mt-4">
            <AlertDialogCancel onClick={() => setIsDeleteDialogOpen(false)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (deletingWorkStationId) {
                  deleteMutation.mutate({ id: deletingWorkStationId })
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

export default WorkStations
