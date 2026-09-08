'use client'

import type React from 'react'
import { useCallback, useEffect, useState, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import CustomSwitch from '@/utils/custom-switch'
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { ArrowUpDown, Search, FileText, Plus, X, Pencil } from 'lucide-react'
import { Popup } from '@/utils/popup'
import type { GetCompanyPolicyType, GetCompanyType } from '@/utils/type'
import { useInitializeUser, userDataAtom } from '@/utils/user'
import {
  useAddCompanyPolicy,
  useUpdateCompanyPolicy,
  useGetCompanyPolicy,
  useGetCompanies,
} from '@/hooks/use-api'
import { CustomCombobox } from '@/utils/custom-combobox'
import { useAtom } from 'jotai'

const CURRENT_YEAR = new Date().getFullYear()

type PolicyRow = GetCompanyPolicyType & {
  file: File | null // local-only, not sent as pdfUrl — pdfUrl stays a string for existing/copied URLs
}

const emptyRow = (): PolicyRow => ({
  companyId: 0,
  tenantId: 0,
  name: '',
  description: '',
  year: CURRENT_YEAR,
  pdfUrl: null,
  createdBy: 0,
  active: false,
  file: null,
})

const CompanyPolicy = () => {
  useInitializeUser()
  const [userData] = useAtom(userDataAtom)

  const { data: policies, refetch: refetchPolicies } = useGetCompanyPolicy()
  const { data: companies } = useGetCompanies()

  const [currentPage, setCurrentPage] = useState(1)
  const [policiesPerPage] = useState(10)
  const [sortColumn, setSortColumn] =
    useState<keyof GetCompanyPolicyType>('name')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')
  const [searchTerm, setSearchTerm] = useState('')

  const [isPopupOpen, setIsPopupOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [rows, setRows] = useState<PolicyRow[]>([emptyRow()])

  const [isEditPopupOpen, setIsEditPopupOpen] = useState(false)
  const [editRow, setEditRow] = useState<PolicyRow | null>(null)
  const [editError, setEditError] = useState<string | null>(null)

  // Pending toggle confirmation (table Active switch)
  const [pendingToggle, setPendingToggle] =
    useState<GetCompanyPolicyType | null>(null)

  const updateRow = (index: number, patch: Partial<PolicyRow>) => {
    setRows((prev) =>
      prev.map((row, i) => (i === index ? { ...row, ...patch } : row))
    )
  }

  // No longer filtering out companies with an existing policy for the year —
  // multiple policies per company/year are allowed now.
  const optionsByRow = useMemo(() => {
    return rows.map(() =>
      (companies?.data ?? []).map((c: GetCompanyType) => ({
        id: String(c.companyId),
        name: c.companyName,
      }))
    )
  }, [rows, companies?.data])

  const editCompanyOptions = useMemo(() => {
    return (companies?.data ?? []).map((c: GetCompanyType) => ({
      id: String(c.companyId),
      name: c.companyName,
    }))
  }, [companies?.data])

  const resetForm = useCallback(() => {
    setRows([emptyRow()])
    setError(null)
    setIsPopupOpen(false)
  }, [])

  const closePopup = useCallback(() => {
    setIsPopupOpen(false)
    setError(null)
    resetForm()
  }, [resetForm])

  const closeEditPopup = useCallback(() => {
    setIsEditPopupOpen(false)
    setEditRow(null)
    setEditError(null)
  }, [])

  const addMutation = useAddCompanyPolicy({
    onClose: closePopup,
    reset: resetForm,
  })

  const updateMutation = useUpdateCompanyPolicy({
    onClose: closeEditPopup,
    reset: closeEditPopup,
  })

  const handleSort = (column: keyof GetCompanyPolicyType) => {
    if (column === sortColumn) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortColumn(column)
      setSortDirection('asc')
    }
  }

  const filteredPolicies = useMemo(() => {
    if (!policies?.data || !Array.isArray(policies.data)) return []
    return policies.data.filter((p: GetCompanyPolicyType) =>
      p.name?.toLowerCase().includes(searchTerm.toLowerCase())
    )
  }, [policies?.data, searchTerm])

  const sortedPolicies = useMemo(() => {
    if (!Array.isArray(filteredPolicies)) return []
    return [...filteredPolicies].sort(
      (a: GetCompanyPolicyType, b: GetCompanyPolicyType) => {
        const aValue = a[sortColumn as keyof GetCompanyPolicyType] ?? ''
        const bValue = b[sortColumn as keyof GetCompanyPolicyType] ?? ''
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
      }
    )
  }, [filteredPolicies, sortColumn, sortDirection])

  const paginatedPolicies = useMemo(() => {
    const startIndex = (currentPage - 1) * policiesPerPage
    return sortedPolicies.slice(startIndex, startIndex + policiesPerPage)
  }, [sortedPolicies, currentPage, policiesPerPage])

  const totalPages = Math.ceil(sortedPolicies.length / policiesPerPage)

  const addRow = () => setRows((prev) => [...prev, emptyRow()])

  const removeRow = (index: number) =>
    setRows((prev) => prev.filter((_, i) => i !== index))

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault()
      setError(null)

      const invalid = rows.some((r) => !r.companyId || !r.name || !r.file)
      if (invalid) {
        setError('Each policy needs a company, name, and PDF file.')
        return
      }

      // Only one active policy is allowed per company/year — check within this submission.
      const activeCounts = new Map<string, number>()
      rows.forEach((r) => {
        if (r.active) {
          const key = `${r.companyId}-${r.year}`
          activeCounts.set(key, (activeCounts.get(key) ?? 0) + 1)
        }
      })
      if ([...activeCounts.values()].some((count) => count > 1)) {
        setError(
          'Only one policy can be active per company per year — uncheck Active on the duplicate row.'
        )
        return
      }

      try {
        const submitData = new FormData()

        const policiesPayload = rows.map((r) => ({
          companyId: r.companyId,
          name: r.name,
          description: r.description || undefined,
          year: r.year,
          active: r.active,
          createdBy: userData?.userId || 0,
        }))

        submitData.append('policies', JSON.stringify(policiesPayload))
        rows.forEach((r) => {
          if (r.file) submitData.append('pdfUrl', r.file)
        })

        addMutation.mutate(submitData)
      } catch (err) {
        setError('Failed to save company policy')
        console.error(err)
      }
    },
    [rows, addMutation, userData?.userId]
  )

  const openEditPopup = (policy: GetCompanyPolicyType) => {
    setEditRow({ ...policy, file: null })
    setEditError(null)
    setIsEditPopupOpen(true)
  }

  const handleEditSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault()
      if (!editRow) return
      setEditError(null)

      if (!editRow.companyId || !editRow.name) {
        setEditError('Company and policy name are required.')
        return
      }

      if (!editRow.companyPolicyId) {
        setEditError('Missing policy id.')
        return
      }

      try {
        const submitData = new FormData()
        const payload = {
          companyId: editRow.companyId,
          name: editRow.name,
          description: editRow.description || undefined,
          year: editRow.year,
          active: editRow.active,
        }
        submitData.append('policy', JSON.stringify(payload))
        if (editRow.file) submitData.append('pdfUrl', editRow.file)

        updateMutation.mutate({
          id: editRow.companyPolicyId,
          formData: submitData,
        })
      } catch (err) {
        setEditError('Failed to update company policy')
        console.error(err)
      }
    },
    [editRow, updateMutation]
  )

  // Policies (excluding the one being toggled) that are active for the same
  // company + year — these get force-deactivated when the toggled policy
  // becomes active.
  const getConflictingActivePolicies = useCallback(
    (policy: GetCompanyPolicyType) => {
      if (!Array.isArray(policies?.data)) return []
      return policies.data.filter(
        (p: GetCompanyPolicyType) =>
          p.companyPolicyId !== policy.companyPolicyId &&
          p.companyId === policy.companyId &&
          p.year === policy.year &&
          p.active === true
      )
    },
    [policies?.data]
  )

  const handleToggleActive = useCallback(
    (policy: GetCompanyPolicyType) => {
      if (!policy.companyPolicyId) return
      const nextActive = !policy.active

      // Activating this policy: deactivate any other active policy for the
      // same company/year first, since only one can be active at a time.
      if (nextActive) {
        const conflicting = getConflictingActivePolicies(policy)
        conflicting.forEach((p: GetCompanyPolicyType) => {
          if (!p.companyPolicyId) return
          const deactivateData = new FormData()
          deactivateData.append('policy', JSON.stringify({ active: false }))
          updateMutation.mutate({
            id: p.companyPolicyId,
            formData: deactivateData,
          })
        })
      }

      const submitData = new FormData()
      submitData.append('policy', JSON.stringify({ active: nextActive }))
      updateMutation.mutate({
        id: policy.companyPolicyId,
        formData: submitData,
      })
    },
    [updateMutation, getConflictingActivePolicies]
  )

  const confirmPendingToggle = useCallback(() => {
    if (!pendingToggle) return
    handleToggleActive(pendingToggle)
    setPendingToggle(null)
  }, [pendingToggle, handleToggleActive])

  useEffect(() => {
    if (addMutation.error) {
      setError('Error saving company policy')
    }
  }, [addMutation.error])

  useEffect(() => {
    if (updateMutation.error) {
      setEditError('Error updating company policy')
    }
  }, [updateMutation.error])

  const getCompanyName = (companyId: number) =>
    (companies?.data ?? []).find(
      (c: GetCompanyType) => c.companyId === companyId
    )?.companyName ?? '—'

  const pendingConflicts = pendingToggle
    ? getConflictingActivePolicies(pendingToggle)
    : []

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2 mb-4">
          <div className="bg-blue-100 p-2 rounded-md">
            <FileText className="text-blue-600" />
          </div>
          <h2 className="text-lg font-semibold">Company Policies</h2>
        </div>
        <div className="flex items-center gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search policies..."
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
                onClick={() => handleSort('name')}
                className="cursor-pointer"
              >
                Policy Name <ArrowUpDown className="ml-2 h-4 w-4 inline" />
              </TableHead>
              <TableHead>Company</TableHead>
              <TableHead
                onClick={() => handleSort('year')}
                className="cursor-pointer"
              >
                Year <ArrowUpDown className="ml-2 h-4 w-4 inline" />
              </TableHead>
              <TableHead>Description</TableHead>
              <TableHead>PDF</TableHead>
              <TableHead>Active</TableHead>
              <TableHead>Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {!policies || policies.data === undefined ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-4">
                  Loading policies...
                </TableCell>
              </TableRow>
            ) : !policies.data || policies.data.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-4">
                  No policies found
                </TableCell>
              </TableRow>
            ) : paginatedPolicies.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-4">
                  No policies match your search
                </TableCell>
              </TableRow>
            ) : (
              paginatedPolicies.map((policy, index: number) => (
                <TableRow key={policy.companyPolicyId || index}>
                  <TableCell>
                    {(currentPage - 1) * policiesPerPage + index + 1}
                  </TableCell>
                  <TableCell className="font-medium">{policy.name}</TableCell>
                  <TableCell>{getCompanyName(policy.companyId)}</TableCell>
                  <TableCell>{policy.year}</TableCell>
                  <TableCell>{policy.description}</TableCell>
                  <TableCell>
                    {policy.pdfUrl ? (
                      <a
                        href={policy.pdfUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline text-sm"
                      >
                        View PDF
                      </a>
                    ) : (
                      '—'
                    )}
                  </TableCell>
                  <TableCell>
                    <CustomSwitch
                      label=""
                      checked={policy.active === true}
                      onChange={() => setPendingToggle(policy)}
                    />
                  </TableCell>
                  <TableCell>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => openEditPopup(policy)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {sortedPolicies.length > 0 && (
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
        title="Add Company Policies"
        size="sm:max-w-3xl"
      >
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">
            Add one row per company. Each row uploads its own policy PDF.
            Multiple policies per company/year are allowed, but only one can be
            active per company per year.
          </p>

          <div className="space-y-4 max-h-[420px] overflow-y-auto pr-1">
            {rows.map((row, index) => (
              <div
                key={index}
                className="border rounded-md p-4 space-y-3 relative"
              >
                {rows.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeRow(index)}
                    className="absolute top-2 right-2 text-gray-400 hover:text-red-600"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>
                      Company <span className="text-red-500">*</span>
                    </Label>
                    <CustomCombobox
                      items={optionsByRow[index]}
                      value={
                        row.companyId
                          ? (optionsByRow[index].find(
                              (c) => c.id === String(row.companyId)
                            ) ?? null)
                          : null
                      }
                      onChange={(value) =>
                        updateRow(index, {
                          companyId: value ? Number(value.id) : undefined,
                        })
                      }
                      placeholder="Select company"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>
                      Policy Name <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      value={row.name}
                      onChange={(e) =>
                        updateRow(index, { name: e.target.value })
                      }
                      maxLength={100}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Year</Label>
                    <Input
                      type="number"
                      value={row.year}
                      onChange={(e) =>
                        updateRow(index, { year: Number(e.target.value) })
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>
                      PDF File <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      type="file"
                      accept="application/pdf"
                      onChange={(e) =>
                        updateRow(index, {
                          file: e.target.files?.[0] ?? null,
                        })
                      }
                      className="cursor-pointer"
                    />
                    {row.file && (
                      <p className="text-xs text-gray-500">{row.file.name}</p>
                    )}
                  </div>

                  <div className="space-y-2 sm:col-span-2">
                    <CustomSwitch
                      label="Active"
                      checked={row.active === true}
                      onChange={(value) => updateRow(index, { active: value })}
                    />
                  </div>

                  <div className="space-y-2 sm:col-span-2">
                    <Label>Description</Label>
                    <textarea
                      value={row.description ?? ''}
                      onChange={(e) =>
                        updateRow(index, { description: e.target.value })
                      }
                      rows={2}
                      className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring resize-none"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          <Button
            type="button"
            variant="outline"
            onClick={addRow}
            className="w-full"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add another company
          </Button>

          {error && (
            <div className="text-sm text-red-600 bg-red-50 p-2 rounded">
              {error}
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={closePopup}>
              Cancel
            </Button>
            <Button type="submit" disabled={addMutation.isPending}>
              {addMutation.isPending ? 'Saving...' : 'Save'}
            </Button>
          </div>
        </form>
      </Popup>

      <Popup
        isOpen={isEditPopupOpen}
        onClose={closeEditPopup}
        title="Edit Company Policy"
        size="sm:max-w-lg"
      >
        {editRow && (
          <form onSubmit={handleEditSubmit} className="space-y-4 py-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>
                  Company <span className="text-red-500">*</span>
                </Label>
                <CustomCombobox
                  items={editCompanyOptions}
                  value={
                    editRow.companyId
                      ? (editCompanyOptions.find(
                          (c) => c.id === String(editRow.companyId)
                        ) ?? null)
                      : null
                  }
                  onChange={(value) =>
                    setEditRow((prev) =>
                      prev
                        ? {
                            ...prev,
                            companyId: value
                              ? Number(value.id)
                              : prev.companyId,
                          }
                        : prev
                    )
                  }
                  placeholder="Select company"
                />
              </div>

              <div className="space-y-2">
                <Label>
                  Policy Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  value={editRow.name}
                  onChange={(e) =>
                    setEditRow((prev) =>
                      prev ? { ...prev, name: e.target.value } : prev
                    )
                  }
                  maxLength={100}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label>Year</Label>
                <Input
                  type="number"
                  value={editRow.year}
                  onChange={(e) =>
                    setEditRow((prev) =>
                      prev ? { ...prev, year: Number(e.target.value) } : prev
                    )
                  }
                />
              </div>

              <div className="space-y-2">
                <Label>Replace PDF (optional)</Label>
                <Input
                  type="file"
                  accept="application/pdf"
                  onChange={(e) =>
                    setEditRow((prev) =>
                      prev
                        ? { ...prev, file: e.target.files?.[0] ?? null }
                        : prev
                    )
                  }
                  className="cursor-pointer"
                />
                {editRow.file ? (
                  <p className="text-xs text-gray-500">{editRow.file.name}</p>
                ) : editRow.pdfUrl ? (
                  <a
                    href={editRow.pdfUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-blue-600 hover:underline"
                  >
                    Current PDF
                  </a>
                ) : null}
              </div>

              <div className="space-y-2 sm:col-span-2">
                <CustomSwitch
                  label="Active"
                  checked={editRow.active === true}
                  onChange={(value) =>
                    setEditRow((prev) =>
                      prev ? { ...prev, active: value } : prev
                    )
                  }
                />
              </div>

              <div className="space-y-2 sm:col-span-2">
                <Label>Description</Label>
                <textarea
                  value={editRow.description ?? ''}
                  onChange={(e) =>
                    setEditRow((prev) =>
                      prev ? { ...prev, description: e.target.value } : prev
                    )
                  }
                  rows={2}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring resize-none"
                />
              </div>
            </div>

            {editError && (
              <div className="text-sm text-red-600 bg-red-50 p-2 rounded">
                {editError}
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={closeEditPopup}>
                Cancel
              </Button>
              <Button type="submit" disabled={updateMutation.isPending}>
                {updateMutation.isPending ? 'Saving...' : 'Save'}
              </Button>
            </div>
          </form>
        )}
      </Popup>

      <AlertDialog
        open={!!pendingToggle}
        onOpenChange={(open) => {
          if (!open) setPendingToggle(null)
        }}
      >
        <AlertDialogContent className='bg-white'>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {pendingToggle?.active
                ? 'Deactivate policy?'
                : 'Activate policy?'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {pendingToggle &&
              !pendingToggle.active &&
              pendingConflicts.length > 0 ? (
                <>
                  This will activate &quot;{pendingToggle.name}&quot; and
                  deactivate {pendingConflicts.length === 1 ? 'the' : 'the'}{' '}
                  currently active{' '}
                  {pendingConflicts.length > 1 ? 'policies' : 'policy'} (
                  {pendingConflicts.map((p) => p.name).join(', ')}) for{' '}
                  {getCompanyName(pendingToggle.companyId)} in{' '}
                  {pendingToggle.year}, since only one policy can be active per
                  company per year.
                </>
              ) : (
                <>
                  Are you sure you want to{' '}
                  {pendingToggle?.active ? 'deactivate' : 'activate'} &quot;
                  {pendingToggle?.name}&quot;?
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setPendingToggle(null)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction onClick={confirmPendingToggle} className='bg-blue-500 text-white'>
              Confirm
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

export default CompanyPolicy
