'use client'

import type React from 'react'
import { useState, useMemo, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Popup } from '@/utils/popup'
import type { GetAssetType, CreateAssetTransactionType } from '@/utils/type'
import { useAssignAsset } from '@/hooks/use-api'
import { CustomCombobox } from '@/utils/custom-combobox'

interface AssignAssetPopupProps {
  isOpen: boolean
  onClose: () => void
  employeeId: number
  employeeName: string
  assets: GetAssetType[] | undefined
}

const TRANSACTION_TYPES: CreateAssetTransactionType['transactionType'][] = [
  'ISSUE',
  'RETURN',
  'TRANSFER',
  'LOST',
  'DAMAGE',
  'REPLACEMENT',
]

// Format a Date to "YYYY-MM-DD" for <input type="date">
const toDateInputValue = (date: Date) => date.toISOString().split('T')[0]

const AssignAssetPopup: React.FC<AssignAssetPopupProps> = ({
  isOpen,
  onClose,
  employeeId,
  employeeName,
  assets,
}) => {
  const [selectedAssetId, setSelectedAssetId] = useState<number | null>(null)
  const [transactionType, setTransactionType] =
    useState<CreateAssetTransactionType['transactionType']>('ISSUE')
  const [transactionDate, setTransactionDate] = useState<string>(
    toDateInputValue(new Date())
  )
  const [remarks, setRemarks] = useState('')
  const [error, setError] = useState<string | null>(null)

  const availableAssets = useMemo(
    () => assets?.filter((a) => a.currentStatus === 'AVAILABLE') ?? [],
    [assets]
  )

  const assetComboItems = useMemo(
    () =>
      availableAssets.map((a) => ({
        id: a.assetId!.toString(),
        name: `${a.assetCode} — ${a.assetName}`,
      })),
    [availableAssets]
  )

  const selectedAssetItem = useMemo(() => {
    if (!selectedAssetId) return null
    const found = availableAssets.find((a) => a.assetId === selectedAssetId)
    return found
      ? {
          id: found.assetId!.toString(),
          name: `${found.assetCode} — ${found.assetName}`,
        }
      : null
  }, [selectedAssetId, availableAssets])

  const reset = useCallback(() => {
    setSelectedAssetId(null)
    setTransactionType('ISSUE')
    setTransactionDate(toDateInputValue(new Date()))
    setRemarks('')
    setError(null)
  }, [])

  const handleClose = useCallback(() => {
    reset()
    onClose()
  }, [reset, onClose])

  const assignMutation = useAssignAsset({
    onClose: handleClose,
    reset,
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!selectedAssetId) {
      setError('Please select an asset')
      return
    }
    if (!transactionDate) {
      setError('Please select a transaction date')
      return
    }

    setError(null)

    const payload: CreateAssetTransactionType = {
      assetId: selectedAssetId,
      employeeId,
      transactionType,
      transactionDate: new Date(transactionDate),
      remarks: remarks.trim() || null,
      approvedBy: null,
      createdBy: employeeId,
      createdAt: new Date(),
      updatedBy: null,
      updatedAt: null,
    }

    assignMutation.mutate(payload)
  }

  return (
    <Popup
      isOpen={isOpen}
      onClose={handleClose}
      title={`Assign Asset to ${employeeName}`}
      size="sm:max-w-lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4 py-4">
        {/* Asset */}
        <div className="space-y-2">
          <Label>
            Asset <span className="text-red-500">*</span>
          </Label>
          <CustomCombobox
            items={assetComboItems}
            value={selectedAssetItem}
            onChange={(val) => setSelectedAssetId(val ? Number(val.id) : null)}
            placeholder="Select available asset"
          />
          {availableAssets.length === 0 && (
            <p className="text-xs text-gray-500">No available assets found.</p>
          )}
        </div>

        {/* Transaction Type */}
        <div className="space-y-2">
          <Label>
            Transaction Type <span className="text-red-500">*</span>
          </Label>
          <Select
            value={transactionType}
            onValueChange={(v) =>
              setTransactionType(
                v as CreateAssetTransactionType['transactionType']
              )
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Select type" />
            </SelectTrigger>
            <SelectContent>
              {TRANSACTION_TYPES.map((t) => (
                <SelectItem key={t} value={t}>
                  {t}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Transaction Date */}
        <div className="space-y-2">
          <Label htmlFor="transactionDate">
            Transaction Date <span className="text-red-500">*</span>
          </Label>
          <Input
            id="transactionDate"
            type="date"
            value={transactionDate}
            onChange={(e) => setTransactionDate(e.target.value)}
            className="w-full"
          />
        </div>

        {/* Remarks */}
        <div className="space-y-2">
          <Label>Remarks</Label>
          <textarea
            className="w-full border rounded-md p-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-300"
            rows={3}
            placeholder="Optional remarks..."
            value={remarks}
            onChange={(e) => setRemarks(e.target.value)}
          />
        </div>

        {error && (
          <div className="text-sm text-red-600 bg-red-50 p-2 rounded">
            {error}
          </div>
        )}

        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={assignMutation.isPending}
            className="bg-blue-400 hover:bg-blue-500 text-black"
          >
            {assignMutation.isPending ? 'Assigning...' : 'Assign'}
          </Button>
        </div>
      </form>
    </Popup>
  )
}

export default AssignAssetPopup
