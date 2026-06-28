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
import { ArrowUpDown, Search, Building2, Edit2, Trash2 } from 'lucide-react'
import { Popup } from '@/utils/popup'
import type { CreateCompanyType, GetCompanyType } from '@/utils/type'
import { useInitializeUser, userDataAtom } from '@/utils/user'
import { useAtom } from 'jotai'
import {
  useAddCompany,
  useDeleteCompany,
  useGetCompanies,
  useGetTenants,
  useUpdateCompany,
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
import Image from 'next/image'
import { CustomCombobox } from '@/utils/custom-combobox'

const TIMEZONE_OPTIONS = [
  'UTC',
  'America/New_York',
  'America/Chicago',
  'America/Denver',
  'America/Los_Angeles',
  'Europe/London',
  'Europe/Paris',
  'Asia/Dubai',
  'Asia/Kolkata',
  'Asia/Dhaka',
  'Asia/Singapore',
  'Asia/Tokyo',
  'Australia/Sydney',
]

const CURRENCY_OPTIONS = [
  { value: 'USD', label: 'USD – US Dollar' },
  { value: 'EUR', label: 'EUR – Euro' },
  { value: 'GBP', label: 'GBP – British Pound' },
  { value: 'BDT', label: 'BDT – Bangladeshi Taka' },
  { value: 'INR', label: 'INR – Indian Rupee' },
  { value: 'AED', label: 'AED – UAE Dirham' },
  { value: 'SGD', label: 'SGD – Singapore Dollar' },
  { value: 'JPY', label: 'JPY – Japanese Yen' },
  { value: 'AUD', label: 'AUD – Australian Dollar' },
  { value: 'CAD', label: 'CAD – Canadian Dollar' },
]

const DEFAULT_FORM: CreateCompanyType = {
  tenantId: 0,
  companyName: '',
  code: '',
  shortName: '',
  tradeLicense: '',
  tin: '',
  bin: '',
  email: '',
  phone: '',
  address: '',
  logoUrl: '',
  timezone: 'UTC',
  currency: 'USD',
  status: true,
  createdBy: 0,
}

const Companies = () => {
  useInitializeUser()
  const [userData] = useAtom(userDataAtom)

  const { data: companies } = useGetCompanies()
  console.log("🚀 ~ Companies ~ companies:", companies)
  const { data: tenants } = useGetTenants()
  console.log("🚀 ~ Companies ~ tenants:", tenants)

  const [error, setError] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [companiesPerPage] = useState(10)
  const [sortColumn, setSortColumn] =
    useState<keyof GetCompanyType>('companyName')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')
  const [searchTerm, setSearchTerm] = useState('')

  const [isPopupOpen, setIsPopupOpen] = useState(false)
  const [isEditMode, setIsEditMode] = useState(false)
  const [editingCompanyId, setEditingCompanyId] = useState<number | null>(null)

  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [deletingCompanyId, setDeletingCompanyId] = useState<number | null>(
    null
  )

  const [formData, setFormData] = useState<CreateCompanyType>({
    ...DEFAULT_FORM,
    createdBy: userData?.userId || 0,
  })

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleStatusChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({ ...prev, status: e.target.checked }))
  }

  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [logoPreview, setLogoPreview] = useState<string | null>(null)

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null
    setLogoFile(file)
    if (file) {
      const url = URL.createObjectURL(file)
      setLogoPreview(url)
    } else {
      setLogoPreview(null)
    }
  }

  const resetForm = useCallback(() => {
    setFormData({
      ...DEFAULT_FORM,
      createdBy: userData?.userId || 0,
    })
    setLogoFile(null)
    setLogoPreview(null)
    setEditingCompanyId(null)
    setIsEditMode(false)
    setIsPopupOpen(false)
    setError(null)
  }, [userData?.userId])

  const closePopup = useCallback(() => {
    setIsPopupOpen(false)
    setError(null)
    resetForm()
  }, [resetForm])

  const addMutation = useAddCompany({ onClose: closePopup, reset: resetForm })
  const updateMutation = useUpdateCompany({
    onClose: closePopup,
    reset: resetForm,
  })
  const deleteMutation = useDeleteCompany({
    onClose: closePopup,
    reset: resetForm,
  })

  const handleSort = (column: keyof GetCompanyType) => {
    if (column === sortColumn) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortColumn(column)
      setSortDirection('asc')
    }
  }

  const filteredCompanies = useMemo(() => {
    if (!companies?.data || !Array.isArray(companies.data)) return []
    return companies.data.filter((company) =>
      company.companyName?.toLowerCase().includes(searchTerm.toLowerCase())
    )
  }, [companies?.data, searchTerm])

  const sortedCompanies = useMemo(() => {
    if (!Array.isArray(filteredCompanies)) return []
    return [...filteredCompanies].sort((a, b) => {
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
  }, [filteredCompanies, sortColumn, sortDirection])

  const paginatedCompanies = useMemo(() => {
    const startIndex = (currentPage - 1) * companiesPerPage
    return sortedCompanies.slice(startIndex, startIndex + companiesPerPage)
  }, [sortedCompanies, currentPage, companiesPerPage])

  const totalPages = Math.ceil(sortedCompanies.length / companiesPerPage)

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault()
      setError(null)
      try {
        const submitData = new FormData()
        submitData.append('tenantId', String(userData?.tenantId))
        submitData.append('companyName', formData.companyName)
        submitData.append('code', formData.code || '')
        submitData.append('shortName', formData.shortName || '')
        submitData.append('tradeLicense', formData.tradeLicense || '')
        submitData.append('tin', formData.tin || '')
        submitData.append('bin', formData.bin || '')
        submitData.append('email', formData.email || '')
        submitData.append('phone', formData.phone || '')
        submitData.append('address', formData.address || '')
        submitData.append('timezone', formData.timezone || 'UTC')
        submitData.append('currency', formData.currency || 'USD')
        submitData.append('status', formData.status ? 'true' : 'false')
        if (isEditMode) {
          submitData.append('updatedBy', String(userData?.userId || 0))
        } else {
          submitData.append('createdBy', String(userData?.userId || 0))
        }
        if (logoFile) {
          submitData.append('logoUrl', logoFile)
        }

        if (isEditMode && editingCompanyId) {
          updateMutation.mutate({ id: editingCompanyId, formData: submitData })
        } else {
          addMutation.mutate(submitData)
        }
      } catch (err) {
        setError('Failed to save company')
        console.error(err)
      }
    },
    [
      formData,
      isEditMode,
      editingCompanyId,
      logoFile,
      addMutation,
      updateMutation,
      userData,
    ]
  )

  useEffect(() => {
    if (addMutation.error || updateMutation.error) {
      setError('Error saving company')
    }
  }, [addMutation.error, updateMutation.error])

  useEffect(() => {
    if (companies?.data && companies.data.length === 0) {
      setIsPopupOpen(true)
    }
  }, [companies?.data])

  const handleEditClick = (company: any) => {
    setFormData({
      tenantId: company.tenantId,
      companyName: company.companyName,
      code: company.code || '',
      shortName: company.shortName || '',
      tradeLicense: company.tradeLicense || '',
      tin: company.tin || '',
      bin: company.bin || '',
      email: company.email || '',
      phone: company.phone || '',
      address: company.address || '',
      logoUrl: company.logoUrl || '',
      timezone: company.timezone || 'UTC',
      currency: company.currency || 'USD',
      status: company.status ?? true,
      createdBy: company.createdBy || 0,
      updatedBy: userData?.userId || 0,
    })
    setLogoPreview(company.logoUrl || null)
    setEditingCompanyId(company.companyId)
    setIsEditMode(true)
    setIsPopupOpen(true)
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2 mb-4">
          <div className="bg-blue-100 p-2 rounded-md">
            <Building2 className="text-blue-600" />
          </div>
          <h2 className="text-lg font-semibold">Companies</h2>
        </div>
        <div className="flex items-center gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search companies..."
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
                onClick={() => handleSort('companyName')}
                className="cursor-pointer"
              >
                Company Name <ArrowUpDown className="ml-2 h-4 w-4 inline" />
              </TableHead>
              <TableHead
                onClick={() => handleSort('code')}
                className="cursor-pointer"
              >
                Code <ArrowUpDown className="ml-2 h-4 w-4 inline" />
              </TableHead>
              <TableHead
                onClick={() => handleSort('phone')}
                className="cursor-pointer"
              >
                Phone <ArrowUpDown className="ml-2 h-4 w-4 inline" />
              </TableHead>
              <TableHead
                onClick={() => handleSort('email')}
                className="cursor-pointer"
              >
                Email <ArrowUpDown className="ml-2 h-4 w-4 inline" />
              </TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {!companies || companies.data === undefined ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-4">
                  Loading companies...
                </TableCell>
              </TableRow>
            ) : !companies.data || companies.data.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-4">
                  No companies found
                </TableCell>
              </TableRow>
            ) : paginatedCompanies.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-4">
                  No companies match your search
                </TableCell>
              </TableRow>
            ) : (
              paginatedCompanies.map((company: any, index) => (
                <TableRow key={index}>
                  <TableCell>
                    {(currentPage - 1) * companiesPerPage + index + 1}
                  </TableCell>
                  <TableCell className="font-medium">
                    {company.companyName}
                  </TableCell>
                  <TableCell>{company.code || '—'}</TableCell>
                  <TableCell>{company.phone || '—'}</TableCell>
                  <TableCell>{company.email || '—'}</TableCell>
                  <TableCell>
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                        company.status
                          ? 'bg-green-100 text-green-700'
                          : 'bg-red-100 text-red-700'
                      }`}
                    >
                      {company.status ? 'Active' : 'Inactive'}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-blue-600 hover:text-blue-700"
                        onClick={() => handleEditClick(company)}
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-red-600 hover:text-red-700"
                        onClick={() => {
                          setDeletingCompanyId(company.companyId)
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

      {sortedCompanies.length > 0 && (
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
        title={isEditMode ? 'Edit Company' : 'Add Company'}
        size="sm:max-w-2xl"
      >
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          {/* ── Section: Basic Info ── */}
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">
            Basic Information
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="companyName">
                Company Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="companyName"
                name="companyName"
                value={formData.companyName}
                onChange={handleInputChange}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="shortName">Short Name</Label>
              <Input
                id="shortName"
                name="shortName"
                value={formData.shortName ?? ''}
                onChange={handleInputChange}
                maxLength={50}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="code">Code</Label>
              <Input
                id="code"
                name="code"
                value={formData.code ?? ''}
                onChange={handleInputChange}
                maxLength={50}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="logoUrl">Logo</Label>
              <Input
                id="logoUrl"
                name="logoUrl"
                type="file"
                accept="image/*"
                onChange={handleLogoChange}
                className="cursor-pointer"
              />
              {(logoPreview || formData.logoUrl) && (
                <div className="mt-2">
                  <Image
                    src={logoPreview || formData.logoUrl || ''}
                    alt="Logo preview"
                    className="h-16 w-16 rounded-md object-contain border border-gray-200 bg-gray-50 p-1"
                    width={64}
                    height={64}
                    unoptimized
                  />
                </div>
              )}
            </div>
          </div>

          {/* ── Section: Contact ── */}
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 pt-2">
            Contact Details
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                value={formData.email ?? ''}
                onChange={handleInputChange}
                maxLength={255}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                name="phone"
                value={formData.phone ?? ''}
                onChange={handleInputChange}
                maxLength={50}
              />
            </div>

            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="address">Address</Label>
              <textarea
                id="address"
                name="address"
                value={formData.address ?? ''}
                onChange={handleInputChange}
                rows={2}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring resize-none"
              />
            </div>
          </div>

          {/* ── Section: Legal / Tax ── */}
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 pt-2">
            Legal &amp; Tax
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="tradeLicense">Trade License</Label>
              <Input
                id="tradeLicense"
                name="tradeLicense"
                value={formData.tradeLicense ?? ''}
                onChange={handleInputChange}
                maxLength={100}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="tin">TIN</Label>
              <Input
                id="tin"
                name="tin"
                value={formData.tin ?? ''}
                onChange={handleInputChange}
                maxLength={50}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="bin">BIN</Label>
              <Input
                id="bin"
                name="bin"
                value={formData.bin ?? ''}
                onChange={handleInputChange}
                maxLength={50}
              />
            </div>
          </div>

          {/* ── Section: Locale & Status ── */}
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 pt-2">
            Locale &amp; Status
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
            <div className="space-y-2">
              <Label>Timezone</Label>
              <CustomCombobox
                items={TIMEZONE_OPTIONS.map((tz) => ({ id: tz, name: tz }))}
                value={
                  formData.timezone
                    ? { id: formData.timezone, name: formData.timezone }
                    : null
                }
                onChange={(value) =>
                  setFormData((prev) => ({
                    ...prev,
                    timezone: value ? value.id : 'UTC',
                  }))
                }
                placeholder="Select timezone"
              />
            </div>

            <div className="space-y-2">
              <Label>Currency</Label>
              <CustomCombobox
                items={CURRENCY_OPTIONS.map((c) => ({
                  id: c.value,
                  name: c.label,
                }))}
                value={
                  formData.currency
                    ? {
                        id: formData.currency,
                        name:
                          CURRENCY_OPTIONS.find(
                            (c) => c.value === formData.currency
                          )?.label || formData.currency,
                      }
                    : null
                }
                onChange={(value) =>
                  setFormData((prev) => ({
                    ...prev,
                    currency: value ? value.id : 'USD',
                  }))
                }
                placeholder="Select currency"
              />
            </div>

            <div className="space-y-2">
              <Label>Status</Label>
              <div className="flex items-center gap-2 h-9">
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    id="status"
                    checked={formData.status}
                    onChange={handleStatusChange}
                    className="sr-only peer"
                  />
                  <div className="w-10 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:bg-black transition-colors" />
                  <div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full shadow transition-transform peer-checked:translate-x-4" />
                </label>
                <span className="text-sm text-muted-foreground">
                  {formData.status ? 'Active' : 'Inactive'}
                </span>
              </div>
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
            <AlertDialogTitle>Delete Company</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this company? This action cannot
              be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex justify-end gap-2 mt-4">
            <AlertDialogCancel onClick={() => setIsDeleteDialogOpen(false)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (deletingCompanyId) {
                  deleteMutation.mutate({ id: deletingCompanyId })
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

export default Companies
