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
import {
  ArrowUpDown,
  Search,
  Package,
  Edit2,
  Trash2,
  UserPlus,
} from 'lucide-react'
import { Popup } from '@/utils/popup'
import type {
  CreateAssetType,
  GetAssetType,
  GetAssetCategoryType,
  GetEmployeeType,
} from '@/utils/type'
import { useInitializeUser, userDataAtom } from '@/utils/user'
import { useAtom } from 'jotai'
import {
  useAddAsset,
  useDeleteAsset,
  useGetAllAssets,
  useUpdateAsset,
  useGetAllAssetCategories,
  useGetAllEmployees,
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
import { AssetTransactionPopup } from './asset-transaction-popup'

const ASSET_STATUSES = [
  'AVAILABLE',
  'ASSIGNED',
  'DAMAGE',
  'LOST',
  'SCRAPPED',
] as const
type AssetStatus = (typeof ASSET_STATUSES)[number]

const statusBadgeClass: Record<AssetStatus, string> = {
  AVAILABLE: 'bg-green-100 text-green-700',
  ASSIGNED: 'bg-blue-100 text-blue-700',
  DAMAGE: 'bg-yellow-100 text-yellow-700',
  LOST: 'bg-red-100 text-red-700',
  SCRAPPED: 'bg-gray-100 text-gray-700',
}

const Assets = () => {
  useInitializeUser()
  const [userData] = useAtom(userDataAtom)

  const { data: assets } = useGetAllAssets()
  const { data: assetCategories } = useGetAllAssetCategories()
  const { data: employees } = useGetAllEmployees()

  const [error, setError] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [assetsPerPage] = useState(10)
  const [sortColumn, setSortColumn] = useState<keyof GetAssetType>('assetName')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')
  const [searchTerm, setSearchTerm] = useState('')

  const [isPopupOpen, setIsPopupOpen] = useState(false)
  const [isEditMode, setIsEditMode] = useState(false)
  const [editingAssetId, setEditingAssetId] = useState<number | null>(null)

  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [deletingAssetId, setDeletingAssetId] = useState<number | null>(null)

  const [isAssignPopupOpen, setIsAssignPopupOpen] = useState(false)
  const [selectedAsset, setSelectedAsset] = useState<GetAssetType | null>(null)

  const defaultForm = useCallback(
    (): CreateAssetType => ({
      assetCode: '',
      assetName: '',
      categoryId: 0,
      serialNumber: null,
      purchaseDate: null,
      purchaseValue: null,
      currentStatus: 'AVAILABLE',
      tenantId: userData?.tenantId || 0,
      createdBy: userData?.userId || 0,
      createdAt: new Date(),
      updatedBy: null,
      updatedAt: null,
    }),
    [userData?.userId, userData?.tenantId]
  )

  const [formData, setFormData] = useState<CreateAssetType>(defaultForm)

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSelectChange = (name: keyof CreateAssetType, value: string) => {
    const parsed = value === '0' || value === '' ? null : Number(value)
    setFormData((prev) => ({ ...prev, [name]: parsed }))
  }

  const resetForm = useCallback(() => {
    setFormData(defaultForm())
    setEditingAssetId(null)
    setIsEditMode(false)
    setIsPopupOpen(false)
    setError(null)
  }, [defaultForm])

  const closePopup = useCallback(() => {
    setIsPopupOpen(false)
    setError(null)
    resetForm()
  }, [resetForm])

  const addMutation = useAddAsset({ onClose: closePopup, reset: resetForm })
  const updateMutation = useUpdateAsset({
    onClose: closePopup,
    reset: resetForm,
  })
  const deleteMutation = useDeleteAsset({
    onClose: closePopup,
    reset: resetForm,
  })

  const handleSort = (column: keyof GetAssetType) => {
    if (column === sortColumn) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortColumn(column)
      setSortDirection('asc')
    }
  }

  const filteredAssets = useMemo(() => {
    if (!assets?.data) return []
    return assets.data.filter(
      (asset: GetAssetType) =>
        asset.assetName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        asset.assetCode?.toLowerCase().includes(searchTerm.toLowerCase())
    )
  }, [assets?.data, searchTerm])

  const sortedAssets = useMemo(() => {
    return [...filteredAssets].sort((a, b) => {
      const aValue = String(a[sortColumn] ?? '')
      const bValue = String(b[sortColumn] ?? '')
      return sortDirection === 'asc'
        ? aValue.localeCompare(bValue)
        : bValue.localeCompare(aValue)
    })
  }, [filteredAssets, sortDirection, sortColumn])

  const paginatedAssets = useMemo(() => {
    const startIndex = (currentPage - 1) * assetsPerPage
    return sortedAssets.slice(startIndex, startIndex + assetsPerPage)
  }, [sortedAssets, currentPage, assetsPerPage])

  const totalPages = Math.ceil(sortedAssets.length / assetsPerPage)

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault()
      setError(null)
      try {
        if (isEditMode && editingAssetId) {
          const submitData: GetAssetType = {
            ...formData,
            updatedBy: userData?.userId || 0,
            updatedAt: new Date(),
            categoryName:
              assetCategories?.data?.find(
                (c: GetAssetCategoryType) =>
                  c.assetCategoryId === formData.categoryId
              )?.categoryName ?? '',
          }
          updateMutation.mutate({ id: editingAssetId, data: submitData })
        } else {
          addMutation.mutate({ ...formData, createdBy: userData?.userId || 0 })
        }
      } catch (err) {
        setError('Failed to save asset')
        console.error(err)
      }
    },
    [
      formData,
      isEditMode,
      editingAssetId,
      addMutation,
      updateMutation,
      userData,
      assetCategories,
    ]
  )

  useEffect(() => {
    if (addMutation.error || updateMutation.error) {
      setError('Error saving asset')
    }
  }, [addMutation.error, updateMutation.error])

  const handleEditClick = (asset: GetAssetType) => {
    setFormData({
      assetCode: asset.assetCode,
      assetName: asset.assetName,
      categoryId: asset.categoryId,
      serialNumber: asset.serialNumber ?? null,
      purchaseDate: asset.purchaseDate ?? null,
      purchaseValue: asset.purchaseValue ?? null,
      currentStatus: asset.currentStatus,
      tenantId: asset.tenantId,
      createdBy: asset.createdBy,
      createdAt: asset.createdAt,
      updatedBy: asset.updatedBy,
      updatedAt: asset.updatedAt,
    })
    setEditingAssetId(asset.assetId!)
    setIsEditMode(true)
    setIsPopupOpen(true)
  }

  const handleAssignClick = (asset: GetAssetType) => {
    setSelectedAsset(asset)
    setIsAssignPopupOpen(true)
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2 mb-4">
          <div className="bg-blue-100 p-2 rounded-md">
            <Package className="text-blue-600" />
          </div>
          <h2 className="text-lg font-semibold">Assets</h2>
        </div>
        <div className="flex items-center gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search assets..."
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
                onClick={() => handleSort('assetCode')}
                className="cursor-pointer"
              >
                Asset Code <ArrowUpDown className="ml-2 h-4 w-4 inline" />
              </TableHead>
              <TableHead
                onClick={() => handleSort('assetName')}
                className="cursor-pointer"
              >
                Asset Name <ArrowUpDown className="ml-2 h-4 w-4 inline" />
              </TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Serial Number</TableHead>
              <TableHead>Purchase Value</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {!assets || assets.data === undefined ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-4">
                  Loading assets...
                </TableCell>
              </TableRow>
            ) : assets?.data?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-4">
                  No assets found
                </TableCell>
              </TableRow>
            ) : paginatedAssets.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-4">
                  No assets match your search
                </TableCell>
              </TableRow>
            ) : (
              paginatedAssets.map((asset: GetAssetType, index: number) => (
                <TableRow key={asset.assetId ?? index}>
                  <TableCell>
                    {(currentPage - 1) * assetsPerPage + index + 1}
                  </TableCell>
                  <TableCell>{asset.assetCode}</TableCell>
                  <TableCell className="font-medium">
                    {asset.assetName}
                  </TableCell>
                  <TableCell>{asset.categoryName ?? '—'}</TableCell>
                  <TableCell>{asset.serialNumber ?? '—'}</TableCell>
                  <TableCell>
                    {asset.purchaseValue != null
                      ? asset.purchaseValue.toLocaleString()
                      : '—'}
                  </TableCell>
                  <TableCell>
                    <span
                      className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                        statusBadgeClass[asset.currentStatus] ??
                        'bg-gray-100 text-gray-700'
                      }`}
                    >
                      {asset.currentStatus}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-green-600 hover:text-green-700"
                        onClick={() => handleAssignClick(asset)}
                        title="Assign to employee"
                      >
                        <UserPlus className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-blue-600 hover:text-blue-700"
                        onClick={() => handleEditClick(asset)}
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-red-600 hover:text-red-700"
                        onClick={() => {
                          setDeletingAssetId(asset.assetId!)
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

      {sortedAssets.length > 0 && (
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

      {/* Add / Edit Asset Popup */}
      <Popup
        isOpen={isPopupOpen}
        onClose={closePopup}
        title={isEditMode ? 'Edit Asset' : 'Add Asset'}
        size="sm:max-w-lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="assetCode">
                Asset Code <span className="text-red-500">*</span>
              </Label>
              <Input
                id="assetCode"
                name="assetCode"
                value={formData.assetCode ?? ''}
                onChange={handleInputChange}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="assetName">
                Asset Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="assetName"
                name="assetName"
                value={formData.assetName ?? ''}
                onChange={handleInputChange}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="categoryId">
                Category <span className="text-red-500">*</span>
              </Label>
              <CustomCombobox
                items={
                  assetCategories?.data?.map((cat: GetAssetCategoryType) => ({
                    id: cat.assetCategoryId!.toString(),
                    name: cat.categoryName,
                  })) || []
                }
                value={
                  formData.categoryId
                    ? {
                        id: formData.categoryId.toString(),
                        name:
                          assetCategories?.data?.find(
                            (c: GetAssetCategoryType) =>
                              c.assetCategoryId === formData.categoryId
                          )?.categoryName ?? formData.categoryId.toString(),
                      }
                    : null
                }
                onChange={(value) =>
                  handleSelectChange(
                    'categoryId',
                    value ? String(value.id) : '0'
                  )
                }
                placeholder="Select category"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="serialNumber">Serial Number</Label>
              <Input
                id="serialNumber"
                name="serialNumber"
                value={formData.serialNumber ?? ''}
                onChange={handleInputChange}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="purchaseDate">Purchase Date</Label>
              <Input
                id="purchaseDate"
                type="date"
                value={
                  formData.purchaseDate
                    ? new Date(formData.purchaseDate)
                        .toISOString()
                        .split('T')[0]
                    : ''
                }
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    purchaseDate: e.target.value
                      ? new Date(e.target.value)
                      : null,
                  }))
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="purchaseValue">Purchase Value</Label>
              <Input
                id="purchaseValue"
                type="number"
                value={formData.purchaseValue ?? ''}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    purchaseValue: e.target.value
                      ? Number(e.target.value)
                      : null,
                  }))
                }
              />
            </div>

            <div className="space-y-2 col-span-2">
              <Label htmlFor="currentStatus">
                Status <span className="text-red-500">*</span>
              </Label>
              <CustomCombobox
                items={ASSET_STATUSES.map((s) => ({ id: s, name: s }))}
                value={
                  formData.currentStatus
                    ? {
                        id: formData.currentStatus,
                        name: formData.currentStatus,
                      }
                    : null
                }
                onChange={(value) =>
                  setFormData((prev) => ({
                    ...prev,
                    currentStatus: (value?.id as AssetStatus) ?? 'AVAILABLE',
                  }))
                }
                placeholder="Select status"
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

      {/* Assign Asset Popup — always creates new transaction */}
      <AssetTransactionPopup
        isOpen={isAssignPopupOpen}
        onClose={() => {
          setIsAssignPopupOpen(false)
          setSelectedAsset(null)
        }}
        asset={selectedAsset}
        employees={employees?.data ?? []}
      />

      {/* Delete Confirmation */}
      <AlertDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
      >
        <AlertDialogContent className="bg-white">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Asset</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this asset? This action cannot be
              undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex justify-end gap-2 mt-4">
            <AlertDialogCancel onClick={() => setIsDeleteDialogOpen(false)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (deletingAssetId) {
                  deleteMutation.mutate({ id: deletingAssetId })
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

export default Assets
