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
import { ArrowUpDown, Search, Tag, Edit2, Trash2 } from 'lucide-react'
import { Popup } from '@/utils/popup'
import type {
  CreateAssetCategoryType,
  GetAssetCategoryType,
} from '@/utils/type'
import { useInitializeUser, userDataAtom } from '@/utils/user'
import { useAtom } from 'jotai'
import {
  useAddAssetCategory,
  useDeleteAssetCategory,
  useGetAllAssetCategories,
  useUpdateAssetCategory,
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

const AssetCategories = () => {
  useInitializeUser()
  const [userData] = useAtom(userDataAtom)

  const { data: assetCategories } = useGetAllAssetCategories()

  const [error, setError] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [categoriesPerPage] = useState(10)
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')
  const [searchTerm, setSearchTerm] = useState('')

  const [isPopupOpen, setIsPopupOpen] = useState(false)
  const [isEditMode, setIsEditMode] = useState(false)
  const [editingCategoryId, setEditingCategoryId] = useState<number | null>(
    null
  )

  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [deletingCategoryId, setDeletingCategoryId] = useState<number | null>(
    null
  )

  const defaultForm = useCallback(
    (): CreateAssetCategoryType => ({
      categoryName: '',
      createdBy: userData?.userId || 0,
      createdAt: new Date(),
      updatedBy: null,
      updatedAt: null,
    }),
    [userData?.userId]
  )

  const [formData, setFormData] = useState<CreateAssetCategoryType>(defaultForm)

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const resetForm = useCallback(() => {
    setFormData(defaultForm())
    setEditingCategoryId(null)
    setIsEditMode(false)
    setIsPopupOpen(false)
    setError(null)
  }, [defaultForm])

  const closePopup = useCallback(() => {
    setIsPopupOpen(false)
    setError(null)
    resetForm()
  }, [resetForm])

  const addMutation = useAddAssetCategory({
    onClose: closePopup,
    reset: resetForm,
  })
  const updateMutation = useUpdateAssetCategory({
    onClose: closePopup,
    reset: resetForm,
  })
  const deleteMutation = useDeleteAssetCategory({
    onClose: closePopup,
    reset: resetForm,
  })

  const filteredCategories = useMemo(() => {
    if (!assetCategories?.data) return []
    return assetCategories.data.filter((cat: GetAssetCategoryType) =>
      cat.categoryName?.toLowerCase().includes(searchTerm.toLowerCase())
    )
  }, [assetCategories?.data, searchTerm])

  const sortedCategories = useMemo(() => {
    return [...filteredCategories].sort((a, b) => {
      const aValue = a.categoryName ?? ''
      const bValue = b.categoryName ?? ''
      return sortDirection === 'asc'
        ? aValue.localeCompare(bValue)
        : bValue.localeCompare(aValue)
    })
  }, [filteredCategories, sortDirection])

  const paginatedCategories = useMemo(() => {
    const startIndex = (currentPage - 1) * categoriesPerPage
    return sortedCategories.slice(startIndex, startIndex + categoriesPerPage)
  }, [sortedCategories, currentPage, categoriesPerPage])

  const totalPages = Math.ceil(sortedCategories.length / categoriesPerPage)

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault()
      setError(null)
      try {
        if (isEditMode && editingCategoryId) {
          const submitData: GetAssetCategoryType = {
            ...formData,
            updatedBy: userData?.userId || 0,
            updatedAt: new Date(),
          }
          updateMutation.mutate({ id: editingCategoryId, data: submitData })
        } else {
          const submitData: CreateAssetCategoryType = {
            ...formData,
            createdBy: userData?.userId || 0,
          }
          addMutation.mutate(submitData)
        }
      } catch (err) {
        setError('Failed to save asset category')
        console.error(err)
      }
    },
    [
      formData,
      isEditMode,
      editingCategoryId,
      addMutation,
      updateMutation,
      userData,
    ]
  )

  useEffect(() => {
    if (addMutation.error || updateMutation.error) {
      setError('Error saving asset category')
    }
  }, [addMutation.error, updateMutation.error])

  const handleEditClick = (cat: GetAssetCategoryType) => {
    setFormData({
      categoryName: cat.categoryName,
      createdBy: cat.createdBy,
      createdAt: cat.createdAt,
      updatedBy: cat.updatedBy,
      updatedAt: cat.updatedAt,
    })
    setEditingCategoryId(cat.assetCategoryId!)
    setIsEditMode(true)
    setIsPopupOpen(true)
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2 mb-4">
          <div className="bg-blue-100 p-2 rounded-md">
            <Tag className="text-blue-600" />
          </div>
          <h2 className="text-lg font-semibold">Asset Categories</h2>
        </div>
        <div className="flex items-center gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search categories..."
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
                onClick={() =>
                  setSortDirection((d) => (d === 'asc' ? 'desc' : 'asc'))
                }
                className="cursor-pointer"
              >
                Category Name <ArrowUpDown className="ml-2 h-4 w-4 inline" />
              </TableHead>
              <TableHead className="text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {!assetCategories || assetCategories.data === undefined ? (
              <TableRow>
                <TableCell colSpan={3} className="text-center py-4">
                  Loading asset categories...
                </TableCell>
              </TableRow>
            ) : assetCategories?.data?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={3} className="text-center py-4">
                  No asset categories found
                </TableCell>
              </TableRow>
            ) : paginatedCategories.length === 0 ? (
              <TableRow>
                <TableCell colSpan={3} className="text-center py-4">
                  No categories match your search
                </TableCell>
              </TableRow>
            ) : (
              paginatedCategories.map(
                (cat: GetAssetCategoryType, index: number) => (
                  <TableRow key={cat.assetCategoryId ?? index}>
                    <TableCell>
                      {(currentPage - 1) * categoriesPerPage + index + 1}
                    </TableCell>
                    <TableCell className="font-medium">
                      {cat.categoryName}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-blue-600 hover:text-blue-700"
                          onClick={() => handleEditClick(cat)}
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-red-600 hover:text-red-700"
                          onClick={() => {
                            setDeletingCategoryId(cat.assetCategoryId!)
                            setIsDeleteDialogOpen(true)
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                )
              )
            )}
          </TableBody>
        </Table>
      </div>

      {sortedCategories.length > 0 && (
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
        title={isEditMode ? 'Edit Asset Category' : 'Add Asset Category'}
        size="sm:max-w-md"
      >
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="categoryName">
              Category Name <span className="text-red-500">*</span>
            </Label>
            <Input
              id="categoryName"
              name="categoryName"
              value={formData.categoryName ?? ''}
              onChange={handleInputChange}
              required
            />
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
            <AlertDialogTitle>Delete Asset Category</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this asset category? This action
              cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex justify-end gap-2 mt-4">
            <AlertDialogCancel onClick={() => setIsDeleteDialogOpen(false)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (deletingCategoryId) {
                  deleteMutation.mutate({ id: deletingCategoryId })
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

export default AssetCategories
