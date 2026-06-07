'use client'

import type React from 'react'
import { useCallback, useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Popup } from '@/utils/popup'
import type {
  CreateAssetTransactionType,
  GetAssetType,
  GetAssetTransactionType,
  GetEmployeeType,
} from '@/utils/type'
import { useAtom } from 'jotai'
import { userDataAtom } from '@/utils/user'
import { useAssignAsset, useGetLatestAssetTransactions } from '@/hooks/use-api'
import { CustomCombobox } from '@/utils/custom-combobox'
import { RotateCcw } from 'lucide-react'

const TRANSACTION_TYPES = [
  'ISSUE',
  'RETURN',
  'TRANSFER',
  'LOST',
  'DAMAGE',
  'REPLACEMENT',
] as const

const buildEmployeeLabel = (emp: GetEmployeeType) =>
  `${emp.empCode ?? ''} - ${emp.empFullName ?? ''}`.trim()

const transactionStatusStyle: Record<string, string> = {
  ISSUE: 'bg-blue-50 text-blue-700 border-blue-200',
  RETURN: 'bg-green-50 text-green-700 border-green-200',
  TRANSFER: 'bg-purple-50 text-purple-700 border-purple-200',
  LOST: 'bg-red-50 text-red-700 border-red-200',
  DAMAGE: 'bg-orange-50 text-orange-700 border-orange-200',
  REPLACEMENT: 'bg-yellow-50 text-yellow-700 border-yellow-200',
}

interface AssetTransactionPopupProps {
  isOpen: boolean
  onClose: () => void
  asset: GetAssetType | null
  employees: GetEmployeeType[]
}

export const AssetTransactionPopup = ({
  isOpen,
  onClose,
  asset,
  employees,
}: AssetTransactionPopupProps) => {
  const [userData] = useAtom(userDataAtom)
  const [assignError, setAssignError] = useState<string | null>(null)

  const { data: latestTransactions } = useGetLatestAssetTransactions()
  console.log("🚀 ~ AssetTransactionPopup ~ latestTransactions:", latestTransactions)

  const latestTransaction: GetAssetTransactionType | undefined =
    latestTransactions?.data?.find(
      (t: GetAssetTransactionType) => t.assetId === asset?.assetId
    )

  const latestEmployee = latestTransaction?.employeeId
    ? employees.find((e) => e.employeeId === latestTransaction.employeeId)
    : null

  const emptyForm = useCallback(
    (): CreateAssetTransactionType => ({
      assetId: asset?.assetId ?? 0,
      employeeId: 0,
      transactionType: 'ISSUE',
      transactionDate: new Date(),
      remarks: null,
      approvedBy: null,
      createdBy: userData?.userId || 0,
      createdAt: new Date(),
      updatedBy: null,
      updatedAt: null,
    }),
    [asset?.assetId, userData?.userId]
  )

  const prefillFromLatest = useCallback(
    (): CreateAssetTransactionType => ({
      assetId: asset?.assetId ?? 0,
      employeeId: latestTransaction?.employeeId ?? 0,
      transactionType: latestTransaction?.transactionType ?? 'ISSUE',
      transactionDate: latestTransaction?.transactionDate
        ? new Date(latestTransaction.transactionDate)
        : new Date(),
      remarks: latestTransaction?.remarks ?? null,
      approvedBy: latestTransaction?.approvedBy ?? null,
      createdBy: userData?.userId || 0,
      createdAt: new Date(),
      updatedBy: null,
      updatedAt: null,
    }),
    [asset?.assetId, latestTransaction, userData?.userId]
  )

  const [formData, setFormData] =
    useState<CreateAssetTransactionType>(emptyForm)

  // Pre-fill whenever popup opens or latest transaction resolves
  useEffect(() => {
    if (isOpen) {
      setFormData(latestTransaction ? prefillFromLatest() : emptyForm())
      setAssignError(null)
    }
  }, [isOpen, latestTransaction]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleReset = () => {
    setFormData(emptyForm())
    setAssignError(null)
  }

  const handleClose = useCallback(() => {
    setFormData(emptyForm())
    setAssignError(null)
    onClose()
  }, [emptyForm, onClose])

  const assignMutation = useAssignAsset({
    onClose: handleClose,
    reset: () => {
      setFormData(emptyForm())
      setAssignError(null)
    },
  })

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault()
      setAssignError(null)

      assignMutation.mutate({
        ...formData,
        assetId: asset?.assetId ?? formData.assetId,
        createdBy: userData?.userId || 0,
        createdAt: new Date(),
      })
    },
    [formData, asset?.assetId, assignMutation, userData?.userId]
  )

  return (
    <Popup
      isOpen={isOpen}
      onClose={handleClose}
      title="Asset Transaction"
      size="sm:max-w-md"
    >
      <div className="space-y-4 py-4">
        {/* Asset info banner */}
        {asset && (
          <div className="bg-blue-50 border border-blue-200 rounded-md px-3 py-2 text-sm text-blue-800 flex gap-3">
            <span className="font-medium">{asset.assetCode}</span>
            <span className="text-blue-600">·</span>
            <span>{asset.assetName}</span>
          </div>
        )}

        {/* Latest transaction status */}
        {latestTransaction ? (
          <div
            className={`border rounded-md px-3 py-2.5 text-sm flex flex-col gap-1 ${
              transactionStatusStyle[latestTransaction.transactionType] ??
              'bg-gray-50 text-gray-700 border-gray-200'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="font-semibold text-xs uppercase tracking-wide">
                Last Transaction
              </span>
              <span className="font-medium">
                {latestTransaction.transactionType}
              </span>
            </div>
            {latestEmployee && (
              <div className="text-xs">
                Employee:{' '}
                <span className="font-medium">
                  {buildEmployeeLabel(latestEmployee)}
                </span>
              </div>
            )}
            {latestTransaction.transactionDate && (
              <div className="text-xs">
                Date:{' '}
                <span className="font-medium">
                  {new Date(
                    latestTransaction.transactionDate
                  ).toLocaleDateString()}
                </span>
              </div>
            )}
            {latestTransaction.remarks && (
              <div className="text-xs">
                Remarks:{' '}
                <span className="font-medium">{latestTransaction.remarks}</span>
              </div>
            )}
          </div>
        ) : (
          <div className="border border-gray-200 rounded-md px-3 py-2 text-sm text-gray-500 bg-gray-50">
            No previous transaction found for this asset.
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Form header with reset */}
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700">
              New Transaction
            </span>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleReset}
              className="text-gray-400 hover:text-gray-600 h-7 px-2 gap-1"
              title="Clear all fields"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span className="text-xs">Reset</span>
            </Button>
          </div>

          <div className="space-y-2">
            <Label>Employee</Label>
            <CustomCombobox
              items={employees.map((emp) => ({
                id: emp.employeeId!.toString(),
                name: buildEmployeeLabel(emp),
              }))}
              value={
                formData.employeeId && formData.employeeId !== 0
                  ? {
                      id: formData.employeeId.toString(),
                      name: (() => {
                        const matched = employees.find(
                          (emp) => emp.employeeId === formData.employeeId
                        )
                        return matched
                          ? buildEmployeeLabel(matched)
                          : formData.employeeId.toString()
                      })(),
                    }
                  : null
              }
              onChange={(value) =>
                setFormData((prev) => ({
                  ...prev,
                  employeeId: value ? Number(value.id) : 0,
                }))
              }
              placeholder="Select employee (optional)"
            />
          </div>

          <div className="space-y-2">
            <Label>
              Transaction Type <span className="text-red-500">*</span>
            </Label>
            <CustomCombobox
              items={TRANSACTION_TYPES.map((t) => ({ id: t, name: t }))}
              value={
                formData.transactionType
                  ? {
                      id: formData.transactionType,
                      name: formData.transactionType,
                    }
                  : null
              }
              onChange={(value) =>
                setFormData((prev) => ({
                  ...prev,
                  transactionType:
                    (value?.id as CreateAssetTransactionType['transactionType']) ??
                    'ISSUE',
                }))
              }
              placeholder="Select transaction type"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="transactionDate">
              Transaction Date <span className="text-red-500">*</span>
            </Label>
            <Input
              id="transactionDate"
              type="date"
              value={
                formData.transactionDate
                  ? new Date(formData.transactionDate)
                      .toISOString()
                      .split('T')[0]
                  : ''
              }
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  transactionDate: e.target.value
                    ? new Date(e.target.value)
                    : new Date(),
                }))
              }
              required
            />
          </div>

          <div className="space-y-2">
            <Label>Approved By</Label>
            <CustomCombobox
              items={employees.map((emp) => ({
                id: emp.employeeId!.toString(),
                name: buildEmployeeLabel(emp),
              }))}
              value={
                formData.approvedBy && formData.approvedBy !== 0
                  ? {
                      id: formData.approvedBy.toString(),
                      name: (() => {
                        const matched = employees.find(
                          (emp) => emp.employeeId === formData.approvedBy
                        )
                        return matched
                          ? buildEmployeeLabel(matched)
                          : formData.approvedBy.toString()
                      })(),
                    }
                  : null
              }
              onChange={(value) =>
                setFormData((prev) => ({
                  ...prev,
                  approvedBy: value ? Number(value.id) : null,
                }))
              }
              placeholder="Select approver (optional)"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="remarks">Remarks</Label>
            <Input
              id="remarks"
              value={formData.remarks ?? ''}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  remarks: e.target.value || null,
                }))
              }
              placeholder="Optional remarks"
            />
          </div>

          {assignError && (
            <div className="text-sm text-red-600 bg-red-50 p-2 rounded">
              {assignError}
            </div>
          )}

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={assignMutation.isPending}>
              {assignMutation.isPending ? 'Saving...' : 'Save Transaction'}
            </Button>
          </div>
        </form>
      </div>
    </Popup>
  )
}
