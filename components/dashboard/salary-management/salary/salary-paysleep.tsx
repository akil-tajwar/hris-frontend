'use client'

import React from 'react'
import { toWords } from 'number-to-words'

type PayslipComponent = {
  salaryComponentId: number
  componentName: string
  componentType: string
  amount: number
}

type SalaryPayslipProps = {
  employeeName: string
  empCode?: string
  departmentName: string
  designationName: string
  salaryMonth: string
  salaryYear: number
  basicSalary: number
  netSalary: number
  components: PayslipComponent[]
}

const SalaryPayslip = React.forwardRef<HTMLDivElement, SalaryPayslipProps>(
  (
    {
      employeeName,
      empCode,
      departmentName,
      designationName,
      salaryMonth,
      salaryYear,
      basicSalary,
      netSalary,
      components,
    },
    ref
  ) => {
    const allowances = components.filter((c) => c.componentType === 'Allowance')
    const deductions = components.filter((c) => c.componentType === 'Deduction')

    const earnings = [
      { key: 'basic', name: 'Basic Salary', amount: basicSalary },
      ...allowances.map((c) => ({
        key: String(c.salaryComponentId),
        name: c.componentName,
        amount: c.amount,
      })),
    ]

    const totalEarning = earnings.reduce((sum, e) => sum + e.amount, 0)
    const totalDeduction = deductions.reduce((sum, d) => sum + d.amount, 0)

    const rowCount = Math.max(earnings.length, deductions.length)
    const rows = Array.from({ length: rowCount }, (_, i) => ({
      earning: earnings[i],
      deduction: deductions[i],
    }))

    return (
      <div
        ref={ref}
        className="w-full max-w-4xl mx-auto bg-white shadow-lg print:shadow-none"
      >
        {/* Header */}
        <div className="border-b-4 border-blue-300 p-8">
          <h1 className="text-3xl font-bold text-gray-800 tracking-wide text-center">
            SALARY PAYSLIP
          </h1>
          <h1 className="text-xl font-bold text-gray-800 tracking-wide text-center">
            {salaryMonth} {salaryYear}
          </h1>

          {/* Employee Info */}
          <div className="mt-6 space-y-3 text-sm">
            <div className="flex justify-between gap-6">
              <div className="flex gap-2 flex-1">
                <span className="text-gray-600">Name:</span>
                <p className="font-semibold border-b border-gray-400 flex-1">
                  {employeeName}
                </p>
              </div>
              <div className="flex gap-2">
                <span className="text-gray-600">Date:</span>
                <p className="font-semibold border-b border-gray-400 min-w-[100px]">
                  {new Date().toLocaleDateString()}
                </p>
              </div>
            </div>

            <div className="flex justify-between gap-6">
              <div className="flex gap-2 flex-1">
                <span className="text-gray-600">Employee Code:</span>
                <p className="font-semibold border-b border-gray-400 flex-1">
                  {empCode || 'N/A'}
                </p>
              </div>
              <div className="flex gap-2 flex-1">
                <span className="text-gray-600">Department:</span>
                <p className="font-semibold border-b border-gray-400 flex-1">
                  {departmentName || 'N/A'}
                </p>
              </div>
              <div className="flex gap-2 flex-1">
                <span className="text-gray-600">Designation:</span>
                <p className="font-semibold border-b border-gray-400 flex-1">
                  {designationName || 'N/A'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Salary Table */}
        <div className="p-8">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-blue-300">
                <th className="border border-gray-300 px-4 py-3 text-left text-black">
                  Earning
                </th>
                <th className="border border-gray-300 px-4 py-3 text-center text-black w-32">
                  Amount
                </th>
                <th className="border border-gray-300 px-4 py-3 text-left text-black">
                  Deduction
                </th>
                <th className="border border-gray-300 px-4 py-3 text-center text-black w-32">
                  Amount
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, idx) => (
                <tr key={idx}>
                  <td className="border border-gray-300 px-4 py-3 text-sm text-gray-800">
                    {row.earning?.name ?? ''}
                  </td>
                  <td className="border border-gray-300 px-4 py-3 text-center font-semibold text-gray-800">
                    {row.earning ? row.earning.amount.toLocaleString() : ''}
                  </td>
                  <td className="border border-gray-300 px-4 py-3 text-sm text-gray-800">
                    {row.deduction?.componentName ?? ''}
                  </td>
                  <td className="border border-gray-300 px-4 py-3 text-center font-semibold text-gray-800">
                    {row.deduction ? row.deduction.amount.toLocaleString() : ''}
                  </td>
                </tr>
              ))}
              {/* Totals Row */}
              <tr className="bg-blue-50">
                <td className="border border-gray-300 px-4 py-3 text-sm font-bold text-gray-900">
                  Total Earning
                </td>
                <td className="border border-gray-300 px-4 py-3 text-center font-bold text-gray-900">
                  {totalEarning.toLocaleString()}
                </td>
                <td className="border border-gray-300 px-4 py-3 text-sm font-bold text-gray-900">
                  Total Deduction
                </td>
                <td className="border border-gray-300 px-4 py-3 text-center font-bold text-gray-900">
                  {totalDeduction.toLocaleString()}
                </td>
              </tr>
              {/* Net Salary Row */}
              <tr className="bg-blue-100">
                <td
                  className="border border-gray-300 px-4 py-3 text-sm font-bold text-gray-900"
                  colSpan={3}
                >
                  Net Salary
                </td>
                <td className="border border-gray-300 px-4 py-3 text-center font-bold text-gray-900 text-base">
                  {netSalary.toLocaleString()}
                </td>
              </tr>
            </tbody>
          </table>
          <div className="text-lg pt-6 px-1 flex gap-2">
            <h4 className="font-medium">Amount in Words:</h4>
            <p className="text-gray-700 mb-4 capitalize">
              {toWords(netSalary)} Taka
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-gray-300 px-8 py-6 text-xs text-gray-500">
          <div className="grid grid-cols-3 gap-8 mt-14">
            <div>
              <p className="border-t border-gray-400 pt-2 text-center">
                Prepared By
              </p>
            </div>
            <div></div>
            <div>
              <p className="border-t border-gray-400 pt-2 text-center">
                Approved By
              </p>
            </div>
          </div>
          <p className="text-center mt-6">
            Generated on {new Date().toLocaleDateString()}
          </p>
        </div>
      </div>
    )
  }
)

SalaryPayslip.displayName = 'SalaryPayslip'

export default SalaryPayslip
