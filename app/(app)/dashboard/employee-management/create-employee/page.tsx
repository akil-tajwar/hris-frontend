import CreateEmployee from '@/components/dashboard/employee-management/create-employee/create-employee'
import { Suspense } from 'react'

const CreateEmployeePage = () => {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <CreateEmployee />
    </Suspense>
  )
}

export default CreateEmployeePage
