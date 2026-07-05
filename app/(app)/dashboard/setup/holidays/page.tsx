import Holidays from '@/components/dashboard/setup/holidays/holidays'
import React, { Suspense } from 'react'

const HolidaysPage = () => {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <Holidays />
    </Suspense>
  )
}

export default HolidaysPage
