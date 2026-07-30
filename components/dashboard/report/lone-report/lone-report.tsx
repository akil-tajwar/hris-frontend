'use client'

import React from 'react'
import { useState, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
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
  Banknote,
  ChevronDown,
  ChevronRight,
  FileSpreadsheet,
} from 'lucide-react'
import * as XLSX from 'xlsx'
import { saveAs } from 'file-saver'
import type { GetEmployeeLoneType } from '@/utils/type'
import { useInitializeUser } from '@/utils/user'
import { useGetLones } from '@/hooks/use-api'

const LoneReport = () => {
  useInitializeUser()

  const { data: lones } = useGetLones()

  const [currentPage, setCurrentPage] = useState(1)
  const [lonesPerPage] = useState(10)
  const [sortColumn, setSortColumn] =
    useState<keyof GetEmployeeLoneType>('empFullName')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')
  const [searchTerm, setSearchTerm] = useState('')

  // Track which lone accordion rows are expanded
  const [expandedLoneIds, setExpandedLoneIds] = useState<Set<number>>(new Set())

  const handleSort = (column: keyof GetEmployeeLoneType) => {
    if (column === sortColumn) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortColumn(column)
      setSortDirection('asc')
    }
  }

  const filteredLones = useMemo(() => {
    if (!lones?.data) return []
    return lones.data.filter(
      (lone: GetEmployeeLoneType) =>
        lone.empFullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        lone.empCode?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        lone.employeeLoneName
          ?.toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        lone.departmentName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        lone.designationName?.toLowerCase().includes(searchTerm.toLowerCase())
    )
  }, [lones?.data, searchTerm])

  const sortedLones = useMemo(() => {
    return [...filteredLones].sort((a, b) => {
      const aValue = (a[sortColumn] ?? '') as string
      const bValue = (b[sortColumn] ?? '') as string
      return sortDirection === 'asc'
        ? String(aValue).localeCompare(String(bValue))
        : String(bValue).localeCompare(String(aValue))
    })
  }, [filteredLones, sortColumn, sortDirection])

  const paginatedLones = useMemo(() => {
    const startIndex = (currentPage - 1) * lonesPerPage
    return sortedLones.slice(startIndex, startIndex + lonesPerPage)
  }, [sortedLones, currentPage, lonesPerPage])

  const totalPages = Math.ceil(sortedLones.length / lonesPerPage)

  const toggleAccordion = (loneId: number) => {
    setExpandedLoneIds((prev) => {
      const next = new Set(prev)
      if (next.has(loneId)) {
        next.delete(loneId)
      } else {
        next.add(loneId)
      }
      return next
    })
  }

  const exportToExcel = () => {
    const flatData = sortedLones.flatMap((lone: any) => {
      const installments = lone.installments ?? []
      if (installments.length === 0) {
        return [
          {
            'Employee Code': lone.empCode,
            'Employee Name': lone.empFullName,
            Department: lone.departmentName || '-',
            Designation: lone.designationName || '-',
            'Lone Name': lone.employeeLoneName,
            'Lone Date': lone.loneDate,
            Amount: lone.amount,
            'Per Month': lone.perMonth,
            Paid: lone.totalPaid,
            Remaining: lone.remainingBalance,
            Description: lone.description || '-',
            Status: Number(lone.remainingBalance) <= 0 ? 'Paid' : 'Pending',
            'Installment Month': '-',
            'Installment Year': '-',
            'Installment Amount': '-',
            'Installment Status': '-',
          },
        ]
      }
      return installments.map((inst: any, idx: number) => ({
        'Employee Code': idx === 0 ? lone.empCode : '',
        'Employee Name': idx === 0 ? lone.empFullName : '',
        Department: idx === 0 ? lone.departmentName || '-' : '',
        Designation: idx === 0 ? lone.designationName || '-' : '',
        'Lone Name': idx === 0 ? lone.employeeLoneName : '',
        'Lone Date': idx === 0 ? lone.loneDate : '',
        Amount: idx === 0 ? lone.amount : '',
        'Per Month': idx === 0 ? lone.perMonth : '',
        Paid: idx === 0 ? lone.totalPaid : '',
        Remaining: idx === 0 ? lone.remainingBalance : '',
        Description: idx === 0 ? lone.description || '-' : '',
        Status:
          idx === 0
            ? Number(lone.remainingBalance) <= 0
              ? 'Paid'
              : 'Pending'
            : '',
        'Installment Month': inst.loneInstallmentMonth,
        'Installment Year': inst.loneInstallmentYear,
        'Installment Amount': inst.amount,
        'Installment Status': inst.isSkipped
          ? 'Skipped'
          : inst.isPaid
            ? 'Paid'
            : 'Pending',
      }))
    })

    const worksheet = XLSX.utils.json_to_sheet(flatData)
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Lone Report')
    const excelBuffer = XLSX.write(workbook, {
      bookType: 'xlsx',
      type: 'array',
    })
    const blob = new Blob([excelBuffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8',
    })
    saveAs(blob, `lone-report.xlsx`)
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2 mb-4">
          <h2 className="text-2xl font-bold">Lone Report</h2>
        </div>
        <div className="flex items-center gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search lones..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-64"
            />
          </div>
          <Button
            onClick={exportToExcel}
            variant="ghost"
            className="flex items-center gap-2 bg-green-100 text-green-900 hover:bg-green-200"
            disabled={sortedLones.length === 0}
          >
            <FileSpreadsheet className="h-4 w-4" />
            Excel
          </Button>
        </div>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader className="bg-blue-100">
            <TableRow>
              <TableHead className="w-8" />
              <TableHead>Sl No.</TableHead>
              <TableHead
                onClick={() => handleSort('empFullName')}
                className="cursor-pointer"
              >
                Employee Details <ArrowUpDown className="ml-2 h-4 w-4 inline" />
              </TableHead>
              <TableHead
                onClick={() => handleSort('employeeLoneName')}
                className="cursor-pointer"
              >
                Lone Name <ArrowUpDown className="ml-2 h-4 w-4 inline" />
              </TableHead>
              <TableHead
                onClick={() => handleSort('loneDate')}
                className="cursor-pointer"
              >
                Lone Date <ArrowUpDown className="ml-2 h-4 w-4 inline" />
              </TableHead>
              <TableHead
                onClick={() => handleSort('amount')}
                className="cursor-pointer"
              >
                Amount <ArrowUpDown className="ml-2 h-4 w-4 inline" />
              </TableHead>
              <TableHead
                onClick={() => handleSort('perMonth')}
                className="cursor-pointer"
              >
                Per Month <ArrowUpDown className="ml-2 h-4 w-4 inline" />
              </TableHead>
              <TableHead>Paid / Remaining</TableHead>
              <TableHead
                onClick={() => handleSort('description')}
                className="cursor-pointer"
              >
                Description <ArrowUpDown className="ml-2 h-4 w-4 inline" />
              </TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {!lones || lones.data === undefined ? (
              <TableRow>
                <TableCell colSpan={10} className="text-center py-4">
                  Loading lones...
                </TableCell>
              </TableRow>
            ) : !lones.data || lones.data.length === 0 ? (
              <TableRow>
                <TableCell colSpan={10} className="text-center py-4">
                  No lones found
                </TableCell>
              </TableRow>
            ) : paginatedLones.length === 0 ? (
              <TableRow>
                <TableCell colSpan={10} className="text-center py-4">
                  No lones match your search
                </TableCell>
              </TableRow>
            ) : (
              paginatedLones.map((lone, index) => {
                const loneId = lone.employeeLoneId ?? -1
                const loneInstallments = lone.installments ?? []
                const isExpanded = expandedLoneIds.has(loneId)
                const isFullyPaid = Number(lone.remainingBalance) <= 0

                return (
                  <React.Fragment key={loneId}>
                    {/* Main lone row */}
                    <TableRow
                      className="cursor-pointer hover:bg-gray-50"
                      onClick={() =>
                        loneInstallments.length > 0 && toggleAccordion(loneId)
                      }
                    >
                      <TableCell className="w-8">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="p-0 h-6 w-6"
                          disabled={loneInstallments.length === 0}
                          onClick={() => toggleAccordion(loneId)}
                          title={
                            loneInstallments.length === 0
                              ? 'No installments'
                              : isExpanded
                                ? 'Collapse installments'
                                : 'View installments'
                          }
                        >
                          {isExpanded ? (
                            <ChevronDown className="h-4 w-4 text-blue-600" />
                          ) : (
                            <ChevronRight
                              className={`h-4 w-4 ${
                                loneInstallments.length === 0
                                  ? 'text-gray-200'
                                  : 'text-gray-400'
                              }`}
                            />
                          )}
                        </Button>
                      </TableCell>

                      <TableCell>
                        {(currentPage - 1) * lonesPerPage + index + 1}
                      </TableCell>

                      <TableCell>
                        <div className="flex flex-col gap-0.5">
                          <span className="font-medium">
                            {lone.empFullName}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {lone.empCode}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {lone.departmentName} · {lone.designationName}
                          </span>
                        </div>
                      </TableCell>

                      <TableCell>{lone.employeeLoneName}</TableCell>
                      <TableCell>{lone.loneDate}</TableCell>
                      <TableCell>{lone.amount}</TableCell>
                      <TableCell>{lone.perMonth}</TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-0.5 text-xs">
                          <span className="text-blue-700 font-medium">
                            Paid: {lone.totalPaid}
                          </span>
                          <span className="text-muted-foreground">
                            Remaining: {lone.remainingBalance}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>{lone.description}</TableCell>

                      <TableCell>
                        <span
                          className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${
                            isFullyPaid
                              ? 'bg-emerald-100 text-emerald-700'
                              : 'bg-yellow-100 text-gray-600'
                          }`}
                        >
                          {isFullyPaid ? 'Paid' : 'Pending'}
                        </span>
                      </TableCell>
                    </TableRow>

                    {/* Accordion: installments sub-table */}
                    {isExpanded && loneInstallments.length > 0 && (
                      <TableRow className="bg-blue-50/60">
                        <TableCell colSpan={10} className="p-0">
                          <div className="px-8 py-3">
                            <p className="text-xs font-semibold text-blue-700 mb-2 uppercase tracking-wide">
                              Installments for {lone.employeeLoneName} (
                              {lone.totalInstallments} total)
                            </p>

                            <Table>
                              <TableHeader>
                                <TableRow className="bg-blue-100/70">
                                  <TableHead className="py-2 text-xs">
                                    Sl No.
                                  </TableHead>
                                  <TableHead className="py-2 text-xs">
                                    Installment Month
                                  </TableHead>
                                  <TableHead className="py-2 text-xs">
                                    Installment Year
                                  </TableHead>
                                  <TableHead className="py-2 text-xs">
                                    Amount
                                  </TableHead>
                                  <TableHead className="py-2 text-xs">
                                    Status
                                  </TableHead>
                                </TableRow>
                              </TableHeader>

                              <TableBody>
                                {loneInstallments.map((inst, instIdx) => {
                                  const alreadySkipped = !!inst.isSkipped

                                  return (
                                    <TableRow
                                      key={inst.employeeLoneInstallmentId}
                                      className="text-sm"
                                    >
                                      <TableCell className="py-2 text-xs">
                                        {instIdx + 1}
                                      </TableCell>

                                      <TableCell className="py-2 text-xs">
                                        {inst.loneInstallmentMonth}
                                      </TableCell>

                                      <TableCell className="py-2 text-xs">
                                        {inst.loneInstallmentYear}
                                      </TableCell>

                                      <TableCell className="py-2 text-xs">
                                        {inst.amount}
                                      </TableCell>

                                      <TableCell className="py-2 text-xs">
                                        <span
                                          className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${
                                            alreadySkipped
                                              ? 'bg-orange-100 text-orange-700'
                                              : inst.isPaid
                                                ? 'bg-emerald-100 text-emerald-700'
                                                : 'bg-yellow-100 text-gray-500'
                                          }`}
                                        >
                                          {alreadySkipped
                                            ? 'Skipped'
                                            : inst.isPaid
                                              ? 'Paid'
                                              : 'Pending'}
                                        </span>
                                      </TableCell>
                                    </TableRow>
                                  )
                                })}
                              </TableBody>
                            </Table>
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </React.Fragment>
                )
              })
            )}
          </TableBody>
        </Table>
      </div>

      {sortedLones.length > 0 && (
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
                    <PaginationItem key={index}>
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
                    <PaginationItem key={`e-${index}`}>
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
    </div>
  )
}

export default LoneReport
