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
import { ArrowUpDown, Search, MapPin, Edit2, Trash2 } from 'lucide-react'
import { Popup } from '@/utils/popup'
import type {
  CreateOfficeLocationType,
  GetOfficeLocationType,
} from '@/utils/type'
import { useInitializeUser, userDataAtom } from '@/utils/user'
import { useAtom } from 'jotai'
import {
  useAddOfficeLocation,
  useDeleteOfficeLocation,
  useGetCompanies,
  useGetOfficeLocations,
  useUpdateOfficeLocation,
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
import { CustomCombobox } from '@/utils/custom-combobox'

const OfficeLocations = () => {
  useInitializeUser()
  const [userData] = useAtom(userDataAtom)

  const { data: officeLocations } = useGetOfficeLocations()
  const { data: companies } = useGetCompanies()

  const [error, setError] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [locationsPerPage] = useState(10)
  const [sortColumn, setSortColumn] =
    useState<keyof GetOfficeLocationType>('companyName')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')
  const [searchTerm, setSearchTerm] = useState('')

  const [isPopupOpen, setIsPopupOpen] = useState(false)
  const [isEditMode, setIsEditMode] = useState(false)
  const [editingLocationId, setEditingLocationId] = useState<number | null>(
    null
  )

  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [deletingLocationId, setDeletingLocationId] = useState<number | null>(
    null
  )

  const defaultForm = useCallback<any>(
    () => ({
      companyId: null,
      companyName: '',
      address: '',
      latitude: null,
      longitude: null,
      radiusMeters: null,
      createdBy: userData?.userId || 0,
    }),
    [userData?.userId]
  )

  const [formData, setFormData] =
    useState<CreateOfficeLocationType>(defaultForm)

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type } = e.target
    if (type === 'number') {
      setFormData((prev) => ({
        ...prev,
        [name]: value === '' ? null : Number(value),
      }))
      return
    }
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const getCurrentLocation = useCallback((): Promise<{
    latitude: number
    longitude: number
  }> => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation is not supported by your browser.'))
        return
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          })
        },
        (error) => {
          let errorMessage = 'Unable to retrieve your location. '
          switch (error.code) {
            case error.PERMISSION_DENIED:
              errorMessage += 'Please grant location permission.'
              break
            case error.POSITION_UNAVAILABLE:
              errorMessage += 'Location information is unavailable.'
              break
            case error.TIMEOUT:
              errorMessage += 'The request to get your location timed out.'
              break
            default:
              errorMessage += 'Please try again.'
          }
          reject(new Error(errorMessage))
        }
      )
    })
  }, [])

  const resetForm = useCallback(() => {
    setFormData({ ...defaultForm, createdBy: userData?.userId || 0 })
    setEditingLocationId(null)
    setIsEditMode(false)
    setError(null)
  }, [userData?.userId, defaultForm])

  const closePopup = useCallback(() => {
    setIsPopupOpen(false)
    setError(null)
    resetForm()
  }, [resetForm])

  const openPopupForAdd = useCallback(async () => {
    resetForm()
    setIsPopupOpen(true)
    setError(null)

    // Auto-fill location when opening add popup
    try {
      const location = await getCurrentLocation()
      setFormData((prev) => ({
        ...prev,
        latitude: location.latitude,
        longitude: location.longitude,
      }))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to get location')
    }
  }, [resetForm, getCurrentLocation])

  const addMutation = useAddOfficeLocation({
    onClose: closePopup,
    reset: resetForm,
  })
  const updateMutation = useUpdateOfficeLocation({
    onClose: closePopup,
    reset: resetForm,
  })
  const deleteMutation = useDeleteOfficeLocation({
    onClose: closePopup,
    reset: resetForm,
  })

  const handleSort = (column: keyof GetOfficeLocationType) => {
    if (column === sortColumn) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortColumn(column)
      setSortDirection('asc')
    }
  }

  const handleSelectChange = (field: 'companyId', value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: Number(value),
    }))
  }

  const filteredLocations = useMemo(() => {
    if (!officeLocations?.data) return []
    return officeLocations.data.filter(
      (loc) =>
        loc.companyName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        loc.address?.toLowerCase().includes(searchTerm.toLowerCase())
    )
  }, [officeLocations?.data, searchTerm])

  const sortedLocations = useMemo(() => {
    return [...filteredLocations].sort((a, b) => {
      let aValue: any = a[sortColumn] ?? ''
      let bValue: any = b[sortColumn] ?? ''

      if (typeof aValue === 'string') {
        aValue = aValue.toLowerCase()
        bValue = bValue.toLowerCase()
      }

      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1
      return 0
    })
  }, [filteredLocations, sortColumn, sortDirection])

  const paginatedLocations = useMemo(() => {
    const startIndex = (currentPage - 1) * locationsPerPage
    return sortedLocations.slice(startIndex, startIndex + locationsPerPage)
  }, [sortedLocations, currentPage, locationsPerPage])

  const totalPages = Math.ceil(sortedLocations.length / locationsPerPage)

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault()
      setError(null)
      try {
        const submitData: CreateOfficeLocationType = { ...formData }
        if (isEditMode) {
          submitData.updatedBy = userData?.userId || 0
        } else {
          submitData.createdBy = userData?.userId || 0
        }

        if (isEditMode && editingLocationId) {
          updateMutation.mutate({
            id: editingLocationId,
            data: submitData as GetOfficeLocationType,
          })
        } else {
          addMutation.mutate(submitData)
        }
      } catch (err) {
        setError('Failed to save office location')
        console.error(err)
      }
    },
    [
      formData,
      isEditMode,
      editingLocationId,
      addMutation,
      updateMutation,
      userData,
    ]
  )

  useEffect(() => {
    if (addMutation.error || updateMutation.error) {
      setError('Error saving office location')
    }
  }, [addMutation.error, updateMutation.error])

  const handleEditClick = (loc: any) => {
    setFormData({
      companyId: loc.companyId,
      address: loc.address,
      latitude: loc.latitude,
      longitude: loc.longitude,
      radiusMeters: loc.radiusMeters,
      createdBy: userData?.userId || 0,
    })
    setEditingLocationId(loc.officeLocationId)
    setIsEditMode(true)
    setIsPopupOpen(true)
    setError(null)
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2 mb-4">
          <div className="bg-blue-100 p-2 rounded-md">
            <MapPin className="text-blue-600" />
          </div>
          <h2 className="text-lg font-semibold">Office Locations</h2>
        </div>
        <div className="flex items-center gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search office locations..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-64"
            />
          </div>
          <Button
            className="bg-blue-400 hover:bg-blue-500 text-black"
            onClick={openPopupForAdd}
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
                onClick={() => handleSort('companyName')}
                className="cursor-pointer"
              >
                Company Name <ArrowUpDown className="ml-2 h-4 w-4 inline" />
              </TableHead>
              <TableHead
                onClick={() => handleSort('address')}
                className="cursor-pointer"
              >
                Address <ArrowUpDown className="ml-2 h-4 w-4 inline" />
              </TableHead>
              <TableHead
                onClick={() => handleSort('latitude')}
                className="cursor-pointer"
              >
                Latitude <ArrowUpDown className="ml-2 h-4 w-4 inline" />
              </TableHead>
              <TableHead
                onClick={() => handleSort('longitude')}
                className="cursor-pointer"
              >
                Longitude <ArrowUpDown className="ml-2 h-4 w-4 inline" />
              </TableHead>
              <TableHead
                onClick={() => handleSort('radiusMeters')}
                className="cursor-pointer"
              >
                Radius (m) <ArrowUpDown className="ml-2 h-4 w-4 inline" />
              </TableHead>
              <TableHead className="text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {!officeLocations || officeLocations.data === undefined ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-4">
                  Loading office locations...
                </TableCell>
              </TableRow>
            ) : !officeLocations.data || officeLocations.data.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-4">
                  No office locations found
                </TableCell>
              </TableRow>
            ) : paginatedLocations.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-4">
                  No office locations match your search
                </TableCell>
              </TableRow>
            ) : (
              paginatedLocations.map((loc: any, index) => (
                <TableRow key={loc.officeLocationId ?? index}>
                  <TableCell>
                    {(currentPage - 1) * locationsPerPage + index + 1}
                  </TableCell>
                  <TableCell className="font-medium">
                    {loc.companyName}
                  </TableCell>
                  <TableCell>{loc.address ?? '—'}</TableCell>
                  <TableCell>{loc.latitude ?? '—'}</TableCell>
                  <TableCell>{loc.longitude ?? '—'}</TableCell>
                  <TableCell>{loc.radiusMeters ?? '—'}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-blue-600 hover:text-blue-700"
                        onClick={() => handleEditClick(loc)}
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-red-600 hover:text-red-700"
                        onClick={() => {
                          setDeletingLocationId(loc.officeLocationId)
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

      {sortedLocations.length > 0 && (
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
        title={isEditMode ? 'Edit Office Location' : 'Add Office Location'}
        size="sm:max-w-lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            {/* Company */}
            <div className="space-y-2 min-w-[200px]">
              <Label htmlFor="companyName">
                Company Name <span className="text-red-500">*</span>
              </Label>
              <CustomCombobox
                items={(companies?.data ?? [])
                  .filter((c: any) => c?.companyId && c?.companyName)
                  .map((c: any) => ({
                    id: String(c.companyId),
                    name: c.companyName,
                  }))}
                value={
                  formData.companyId
                    ? {
                        id: String(formData.companyId),
                        name:
                          companies?.data?.find(
                            (c: any) =>
                              String(c.companyId) === String(formData.companyId)
                          )?.companyName || '',
                      }
                    : null
                }
                onChange={(value) =>
                  handleSelectChange('companyId', value ? String(value.id) : '')
                }
                placeholder="Select company"
              />
            </div>

            {/* Address */}
            <div className="space-y-2 col-span-2">
              <Label htmlFor="address">
                Address <span className="text-red-500">*</span>
              </Label>
              <Input
                id="address"
                name="address"
                value={formData.address ?? ''}
                onChange={handleInputChange}
                required
              />
            </div>

            {/* Latitude */}
            <div className="space-y-2">
              <Label htmlFor="latitude">
                Latitude <span className="text-red-500">*</span>
              </Label>
              <Input
                id="latitude"
                name="latitude"
                type="number"
                step="any"
                value={formData.latitude ?? ''}
                onChange={handleInputChange}
                required
              />
            </div>

            {/* Longitude */}
            <div className="space-y-2">
              <Label htmlFor="longitude">
                Longitude <span className="text-red-500">*</span>
              </Label>
              <Input
                id="longitude"
                name="longitude"
                type="number"
                step="any"
                value={formData.longitude ?? ''}
                onChange={handleInputChange}
                required
              />
            </div>

            {/* Radius */}
            <div className="space-y-2 col-span-2">
              <Label htmlFor="radiusMeters">
                Radius (meters) <span className="text-red-500">*</span>
              </Label>
              <Input
                id="radiusMeters"
                name="radiusMeters"
                type="number"
                value={formData.radiusMeters ?? ''}
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
            <AlertDialogTitle>Delete Office Location</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this office location? This action
              cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex justify-end gap-2 mt-4">
            <AlertDialogCancel onClick={() => setIsDeleteDialogOpen(false)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (deletingLocationId) {
                  deleteMutation.mutate({ id: deletingLocationId })
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

export default OfficeLocations
