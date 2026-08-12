import { useInitializeUser, userDataAtom } from '@/utils/user'
import { useAtom, useAtomValue } from 'jotai'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from './use-toast'
import {
  assignLeaveType,
  createBusinessUnit,
  createCompany,
  createCostCenter,
  createCustomer,
  createDepartment,
  createDesignation,
  createDivision,
  createEmployee,
  createEmployeeAttendance,
  createEmployeeLeave,
  createEmployeeSalaryComponent,
  createEmploymentType,
  createHoliday,
  createLeaveType,
  createLone,
  createShiftDayAndWeekDays,
  createSalaryComponent,
  createSalary,
  createTenant,
  createWorkStation,
  deleteBusinessUnit,
  deleteCompany,
  deleteCostCenter,
  deleteCustomer,
  deleteDepartment,
  deleteDesignation,
  deleteDivision,
  deleteEmployee,
  deleteEmployeeAttendance,
  deleteEmployeeLeave,
  deleteEmployeeSalaryComponent,
  deleteEmploymentType,
  deleteHoliday,
  deleteLeaveType,
  deleteLone,
  deleteShiftDayAndWeekDays,
  deleteSalaryComponent,
  giveSalary,
  deleteTenant,
  deleteWorkStation,
  editBusinessUnit,
  editCompany,
  editCostCenter,
  editCustomer,
  editDepartment,
  editDesignation,
  editDivision,
  editEmployee,
  editEmployeeAttendance,
  editEmployeeLeave,
  editEmployeeSalaryComponent,
  editEmploymentType,
  editHoliday,
  editLeaveType,
  editLone,
  editShiftDayAndWeekDays,
  editSalaryComponent,
  editSalary,
  editTenant,
  editWorkStation,
  getAllBusinessUnits,
  getAllCompanies,
  getAllCostCenters,
  getAllCustomers,
  getAllDepartments,
  getAllDesignations,
  getAllDivisions,
  getAllEmployeeAttendances,
  getAllEmployeeLeaves,
  getAllEmployeeLeaveTypes,
  getAllEmployeeSalaryComponents,
  getAllEmployees,
  getAllEmploymentTypes,
  getAllHolidays,
  getAllLeaveTypes,
  getAllLones,
  getAllShiftDayAndWeekDays,
  getAllSalaryComponents,
  getAllRoles,
  getAllSalaries,
  getAllTenants,
  getAllWeekDays,
  getAllWorkStations,
  getAttendanceReport,
  getEmployeeAttendanceSummary,
  getEmployeeById,
  getEmployeeLeaveSummary,
  getSalaryReport,
  skipLone,
  getAllLeavePolicies,
  createLeavePolicy,
  editLeavePolicy,
  deleteLeavePolicy,
  getAllEmployeeLeaveAssignments,
  createEmployeeLeaveAssignment,
  editEmployeeLeaveAssignment,
  deleteEmployeeLeaveAssignment,
  getAllSalaryStructures,
  createSalaryStructure,
  editSalaryStructure,
  deleteSalaryStructure,
  getAllEmployeePreboardings,
  createEmployeePreboarding,
  editEmployeePreboarding,
  deleteEmployeePreboarding,
  getAllChecklists,
  createChecklist,
  editChecklist,
  deleteChecklist,
  getPreboardingEmployeeChecklistsById,
  createPreboardingEmployeeChecklist,
  editEmployeePreboardingChecklist,
  getNotificationsById,
  markAsRead,
  completeEmployeePreboardingChecklist,
  getEmployeePreboardingById,
  getPreboardingEmployeeChecklistsByUserId,
  getAllAssetCategories,
  getAssetCategoryById,
  createAssetCategory,
  editAssetCategory,
  deleteAssetCategory,
  getAllAssets,
  getAssetById,
  createAsset,
  editAsset,
  deleteAsset,
  assignAsset,
  getLatestAssetTransactions,
  getAllAttendancePolicies,
  getAttendancePolicyById,
  createAttendancePolicy,
  editAttendancePolicy,
  deleteAttendancePolicy,
  getEmployeeActivityReport,
  getAllShiftAllocations,
  createBulkShiftAllocation,
  editShiftAllocation,
  deleteShiftAllocation,
  updateShiftAllocationRecurrence,
  copyShiftAllocationById,
  copyAllActiveShiftAllocations,
  getAttendanceSummaryReport,
  getDailyAttendanceReport,
  getAllHolidayCalendars,
  createHolidayCalendar,
  editHolidayCalendar,
  deleteHolidayCalendar,
  getAllNewHolidays,
  createNewHolidayRange,
  editNewHoliday,
  deleteNewHoliday,
  getAttendanceAuditLogs,
  processAttendanceRange,
  processAttendanceDate,
  getAllAttendanceDaily,
  createAttendanceDaily,
  editAttendanceDaily,
  deleteAttendanceDaily,
  getAllEmployeeLeaveApplications,
  createEmployeeLeaveApplication,
  editEmployeeLeaveApplication,
  deleteEmployeeLeaveApplication,
  approveEmployeeLeaveRepAuth,
  approveEmployeeLeaveHr,
  GetEmployeeWeekDays,
  getLeaveApplyNoOfDays,
  getEmpIdByUserId,
  rejectLeave,
  getLeaveBalanceSummaryReport,
  getEmployeeLeaveLedgerReport,
  getShiftReport,
  createShiftAllocation,
  uploadAttendance,
  getAllAttendanceDailyWithParams,
  getAttendanceDailyByUserId,
  addManualAttendanceDailyApply,
  editManualAttendanceDailyApply,
  approveManualAttendanceByRepAuth,
  approveManualAttendanceByHr,
  rejectManualAttendance,
  getAttendanceDailyApplyByUserId,
  getAllAttendanceApply,
  getIndividualAttendanceSummaryReport,
  generateSalary,
  makeSalaryPermanent,
  createEmployeeLeaveEncashment,
  getAllEmployeeLeaveEncashments,
  makeEmployeeLoneFullPaid,
  getAllNotice,
  createNotice,
  editNotice,
  deleteNotice,
  getEmployeeLoneSummary,
  getEmployeeSalaryStatus,
  getAllPermissions,
  updateRolePermissions,
  getCurrentUser,
  logout,
} from '@/utils/api'
import {
  AssignLeaveTypeType,
  CreateDepartmentType,
  CreateDesignationType,
  CreateEmployeeAttendanceType,
  CreateEmployeeLeaveType,
  CreateEmployeeSalaryComponentType,
  CreateEmploymentTypeType,
  CreateHolidayType,
  CreateLeaveTypeType,
  CreateEmployeeLoneType,
  CreateShiftType,
  CreateSalaryComponentType,
  CreateSalaryType,
  GetEmployeeAttendanceType,
  GetEmployeeLeaveType,
  GetEmployeeLoneType,
  GetShiftsType,
  CreateCompanyType,
  CreateWorkStationType,
  CreateDivisionType,
  CreateCostCenterType,
  CreateTenantType,
  CreateCustomerType,
  CreateBusinessUnitType,
  GetBusinessUnitType,
  GetDepartmentType,
  GetDivisionType,
  GetLeaveTypeType,
  CreateLeavePolicyType,
  GetLeavePolicyType,
  CreateEmployeeLeaveAssignmentType,
  GetEmployeeLeaveAssignmentType,
  CreateSalaryStructureType,
  GetSalaryStructureType,
  CreateEmployeePreboardingType,
  GetEmployeePreboardingType,
  CreateChecklistType,
  GetChecklistType,
  CreateEmployeePreboardingChecklistType,
  GetEmployeePreboardingChecklistType,
  CreateAssetCategoryType,
  GetAssetCategoryType,
  CreateAssetType,
  GetAssetType,
  CreateAssetTransactionType,
  GetAssetTransactionType,
  CreateAttendancePolicyType,
  GetAttendancePolicyType,
  CreateShiftAllocationType,
  CreateBulkShiftAllocationType,
  UpdateRecurrenceType,
  DailyAttendanceType,
  CreateHolidayCalendarType,
  CreateNewHolidayType,
  ProcessAttendanceRangeType,
  ProcessAttendanceDateType,
  CreateAttendanceDailyType,
  UpdateAttendanceDailyType,
  CreateEmployeeLeaveApply,
  GetEmployeeLeaveApply,
  GetTenantType,
  UploadAttendanceType,
  CreateAttendanceDailyApplyType,
  GetAttendanceDailyApplyType,
  CreateEmployeeLeaveEncashment,
} from '@/utils/type'

//roles
export const useGetRoles = () => {
  useInitializeUser()
  const userData = useAtomValue(userDataAtom)

  return useQuery({
    queryKey: ['roles'],
    queryFn: () => getAllRoles(),
    enabled: !!userData,
    select: (data) => data,
  })
}

//current user
export const useGetCurrentUser = () => {
  useInitializeUser()
  const userData = useAtomValue(userDataAtom)

  return useQuery({
    queryKey: ['currentUser'],
    queryFn: () => getCurrentUser(),
    enabled: !!userData,
    select: (data) => data,
  })
}

export const useGetPermissions = () => {
  useInitializeUser()
  const userData = useAtomValue(userDataAtom)

  return useQuery({
    queryKey: ['permissions'],
    queryFn: () => getAllPermissions(),
    enabled: !!userData,
    select: (data) => data,
  })
}

export const useUpdatePermission = ({
  onClose,
  reset,
}: {
  onClose: () => void
  reset: () => void
}) => {
  useInitializeUser()
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: number[] }) => {
      return updateRolePermissions(id, data)
    },
    onSuccess: () => {
      toast({
        title: 'Success!',
        description: 'Permission edited successfully.',
      })
      queryClient.invalidateQueries({ queryKey: ['permissions'] })

      reset()
      onClose()
    },
    onError: (error) => {
      console.error('Error editing permission:', error)
    },
  })

  return mutation
}

//customers
export const useGetCustomers = () => {
  useInitializeUser()
  const userData = useAtomValue(userDataAtom)

  return useQuery({
    queryKey: ['customers'],
    queryFn: () => getAllCustomers(),
    enabled: !!userData,
    select: (data) => data,
  })
}

export const useAddCustomer = ({
  onClose,
  reset,
}: {
  onClose: () => void
  reset: () => void
}) => {
  useInitializeUser()
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: async (data: CreateCustomerType) => {
      const res = await createCustomer(data)
      return res
    },
    onSuccess: (res) => {
      if (res?.error) {
        toast({
          title: 'Error',
          variant: 'destructive',
          description: res.error.message || 'Failed to create customer',
        })
        return
      }

      toast({
        title: 'Success',
        description: 'Customer created successfully!',
      })

      queryClient.invalidateQueries({ queryKey: ['customers'] })
      reset()
      onClose()
    },
    onError: (error: any) => {
      console.error('Error adding customer:', error)
      toast({
        title: 'Error',
        variant: 'destructive',
        description: error?.message || 'Unexpected error occurred',
      })
    },
  })

  return mutation
}

export const useLogout = ({
  onClose,
  reset,
}: {
  onClose: () => void
  reset: () => void
}) => {
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: async () => {
      const res = await logout()
      return res
    },

    onSuccess: (res) => {
      if (res?.error) {
        toast({
          title: 'Error',
          variant: 'destructive',
          description: res.error.message || 'Failed to logout',
        })
        return
      }

      toast({
        title: 'Success',
        description: 'Logged out successfully!',
      })

      // Clear React Query cache
      queryClient.clear()

      reset()
      onClose()
    },

    onError: (error: any) => {
      console.error('Error logging out:', error)

      toast({
        title: 'Error',
        variant: 'destructive',
        description: error?.message || 'Unexpected error occurred',
      })
    },
  })

  return mutation
}

export const useUpdateCustomer = ({
  onClose,
  reset,
}: {
  onClose: () => void
  reset: () => void
}) => {
  useInitializeUser()
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: CreateCustomerType }) => {
      return editCustomer(id, data)
    },
    onSuccess: () => {
      toast({
        title: 'Success!',
        description: 'Customer edited successfully.',
      })
      queryClient.invalidateQueries({ queryKey: ['customers'] })

      reset()
      onClose()
    },
    onError: (error) => {
      console.error('Error editing customer:', error)
    },
  })

  return mutation
}

export const useDeleteCustomer = ({
  onClose,
  reset,
}: {
  onClose: () => void
  reset: () => void
}) => {
  useInitializeUser()
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: async ({ id }: { id: number }) => {
      const res = await deleteCustomer(id)

      console.log('DELETE RESPONSE:', res)

      const apiError = res?.error || (res?.data === null && res?.error?.message)

      const successFlag = (res?.error?.details as any)?.success

      if (apiError || successFlag === false) {
        throw new Error('Failed to delete customer')
      }

      return res
    },

    onSuccess: () => {
      toast({
        title: 'Success!',
        description: 'Customer is deleted successfully.',
      })
      queryClient.invalidateQueries({ queryKey: ['customers'] })

      reset()
      onClose()
    },

    onError: (error: any) => {
      console.error('Delete error:', error)

      toast({
        title: 'Error',
        variant: 'destructive',
        description: 'This data is needed elsewhere',
      })
    },
  })

  return mutation
}

//business units
export const useGetBusinessUnits = () => {
  useInitializeUser()
  const userData = useAtomValue(userDataAtom)

  return useQuery({
    queryKey: ['business-units'],
    queryFn: () => getAllBusinessUnits(),
    enabled: !!userData,
    select: (data) => data,
  })
}

export const useAddBusinessUnit = ({
  onClose,
  reset,
}: {
  onClose: () => void
  reset: () => void
}) => {
  useInitializeUser()
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: async (data: CreateBusinessUnitType) => {
      const res = await createBusinessUnit(data)
      return res
    },
    onSuccess: (res) => {
      if (res?.error) {
        toast({
          title: 'Error',
          variant: 'destructive',
          description: res.error.message || 'Failed to create customer',
        })
        return
      }

      toast({
        title: 'Success',
        description: 'BusinessUnit created successfully!',
      })

      queryClient.invalidateQueries({ queryKey: ['business-units'] })
      reset()
      onClose()
    },
    onError: (error: any) => {
      console.error('Error adding business unit:', error)
      toast({
        title: 'Error',
        variant: 'destructive',
        description: error?.message || 'Unexpected error occurred',
      })
    },
  })

  return mutation
}

export const useUpdateBusinessUnit = ({
  onClose,
  reset,
}: {
  onClose: () => void
  reset: () => void
}) => {
  useInitializeUser()
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: GetBusinessUnitType }) => {
      return editBusinessUnit(id, data)
    },
    onSuccess: () => {
      toast({
        title: 'Success!',
        description: 'BusinessUnit edited successfully.',
      })
      queryClient.invalidateQueries({ queryKey: ['business-units'] })

      reset()
      onClose()
    },
    onError: (error) => {
      console.error('Error editing business unit:', error)
    },
  })

  return mutation
}

export const useDeleteBusinessUnit = ({
  onClose,
  reset,
}: {
  onClose: () => void
  reset: () => void
}) => {
  useInitializeUser()
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: async ({ id }: { id: number }) => {
      const res = await deleteBusinessUnit(id)

      console.log('DELETE RESPONSE:', res)

      const apiError = res?.error || (res?.data === null && res?.error?.message)

      const successFlag = (res?.error?.details as any)?.success

      if (apiError || successFlag === false) {
        throw new Error('Failed to delete business unit')
      }

      return res
    },

    onSuccess: () => {
      toast({
        title: 'Success!',
        description: 'BusinessUnit is deleted successfully.',
      })
      queryClient.invalidateQueries({ queryKey: ['business-units'] })

      reset()
      onClose()
    },

    onError: (error: any) => {
      console.error('Delete error:', error)

      toast({
        title: 'Error',
        variant: 'destructive',
        description: 'This data is needed elsewhere',
      })
    },
  })

  return mutation
}

//tenants
export const useGetTenants = () => {
  useInitializeUser()
  const userData = useAtomValue(userDataAtom)

  return useQuery({
    queryKey: ['tenants'],
    queryFn: () => getAllTenants(),
    enabled: !!userData,
    select: (data) => data,
  })
}

export const useAddTenant = ({
  onClose,
  reset,
}: {
  onClose: () => void
  reset: () => void
}) => {
  useInitializeUser()
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: async (data: CreateTenantType) => {
      const res = await createTenant(data)
      return res
    },
    onSuccess: (res) => {
      if (res?.error) {
        toast({
          title: 'Error',
          variant: 'destructive',
          description: res.error.message || 'Failed to create department',
        })
        return
      }

      toast({
        title: 'Success',
        description: 'Tenant created successfully!',
      })

      queryClient.invalidateQueries({ queryKey: ['tenants'] })
      reset()
      onClose()
    },
    onError: (error: any) => {
      console.error('Error adding tenant:', error)
      toast({
        title: 'Error',
        variant: 'destructive',
        description: error?.message || 'Unexpected error occurred',
      })
    },
  })

  return mutation
}

export const useUpdateTenant = ({
  onClose,
  reset,
}: {
  onClose: () => void
  reset: () => void
}) => {
  useInitializeUser()
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: GetTenantType }) => {
      return editTenant(id, data)
    },
    onSuccess: () => {
      toast({
        title: 'Success!',
        description: 'tenant edited successfully.',
      })
      queryClient.invalidateQueries({ queryKey: ['tenants'] })

      reset()
      onClose()
    },
    onError: (error) => {
      console.error('Error editing tenant:', error)
    },
  })

  return mutation
}

export const useDeleteTenant = ({
  onClose,
  reset,
}: {
  onClose: () => void
  reset: () => void
}) => {
  useInitializeUser()
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: async ({ id }: { id: number }) => {
      const res = await deleteTenant(id)

      console.log('DELETE RESPONSE:', res)

      const apiError = res?.error || (res?.data === null && res?.error?.message)

      const successFlag = (res?.error?.details as any)?.success

      if (apiError || successFlag === false) {
        throw new Error('Failed to delete tenant')
      }

      return res
    },

    onSuccess: () => {
      toast({
        title: 'Success!',
        description: 'tenant is deleted successfully.',
      })
      queryClient.invalidateQueries({ queryKey: ['tenants'] })

      reset()
      onClose()
    },

    onError: (error: any) => {
      console.error('Delete error:', error)

      toast({
        title: 'Error',
        variant: 'destructive',
        description: 'This data is needed elsewhere',
      })
    },
  })

  return mutation
}

//departments
export const useGetDepartments = () => {
  useInitializeUser()
  const userData = useAtomValue(userDataAtom)

  return useQuery({
    queryKey: ['departments'],
    queryFn: () => getAllDepartments(),
    enabled: !!userData,
    select: (data) => data,
  })
}

export const useAddDepartment = ({
  onClose,
  reset,
}: {
  onClose: () => void
  reset: () => void
}) => {
  useInitializeUser()
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: async (data: CreateDepartmentType) => {
      const res = await createDepartment(data)
      return res
    },
    onSuccess: (res) => {
      if (res?.error) {
        toast({
          title: 'Error',
          variant: 'destructive',
          description: res.error.message || 'Failed to create department',
        })
        return
      }

      toast({
        title: 'Success',
        description: 'Department created successfully!',
      })

      queryClient.invalidateQueries({ queryKey: ['departments'] })
      reset()
      onClose()
    },
    onError: (error: any) => {
      console.error('Error adding department:', error)
      toast({
        title: 'Error',
        variant: 'destructive',
        description: error?.message || 'Unexpected error occurred',
      })
    },
  })

  return mutation
}

export const useUpdateDepartment = ({
  onClose,
  reset,
}: {
  onClose: () => void
  reset: () => void
}) => {
  useInitializeUser()
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: GetDepartmentType }) => {
      return editDepartment(id, data)
    },
    onSuccess: () => {
      toast({
        title: 'Success!',
        description: 'department edited successfully.',
      })
      queryClient.invalidateQueries({ queryKey: ['departments'] })

      reset()
      onClose()
    },
    onError: (error) => {
      console.error('Error editing department:', error)
    },
  })

  return mutation
}

export const useDeleteDepartment = ({
  onClose,
  reset,
}: {
  onClose: () => void
  reset: () => void
}) => {
  useInitializeUser()
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: async ({ id }: { id: number }) => {
      const res = await deleteDepartment(id)

      console.log('DELETE RESPONSE:', res)

      const apiError = res?.error || (res?.data === null && res?.error?.message)

      const successFlag = (res?.error?.details as any)?.success

      if (apiError || successFlag === false) {
        throw new Error('Failed to delete department')
      }

      return res
    },

    onSuccess: () => {
      toast({
        title: 'Success!',
        description: 'department is deleted successfully.',
      })
      queryClient.invalidateQueries({ queryKey: ['departments'] })

      reset()
      onClose()
    },

    onError: (error: any) => {
      console.error('Delete error:', error)

      toast({
        title: 'Error',
        variant: 'destructive',
        description: 'This data is needed elsewhere',
      })
    },
  })

  return mutation
}

// Companies Hooks
export const useGetCompanies = () => {
  useInitializeUser()
  const userData = useAtomValue(userDataAtom)

  return useQuery({
    queryKey: ['companies'],
    queryFn: () => getAllCompanies(),
    enabled: !!userData,
    select: (data) => data,
  })
}

export const useAddCompany = ({
  onClose,
  reset,
}: {
  onClose: () => void
  reset: () => void
}) => {
  useInitializeUser()
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const res = await createCompany(formData)
      return res
    },
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Company created successfully!',
      })
      queryClient.invalidateQueries({ queryKey: ['companies'] })
      reset()
      onClose()
    },
    onError: (error: any) => {
      console.error('Error adding company:', error)
      toast({
        title: 'Error',
        variant: 'destructive',
        description: error?.message || 'Unexpected error occurred',
      })
    },
  })

  return mutation
}

export const useUpdateCompany = ({
  onClose,
  reset,
}: {
  onClose: () => void
  reset: () => void
}) => {
  useInitializeUser()
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: ({ id, formData }: { id: number; formData: FormData }) => {
      return editCompany(id, formData)
    },
    onSuccess: () => {
      toast({
        title: 'Success!',
        description: 'Company updated successfully.',
      })
      queryClient.invalidateQueries({ queryKey: ['companies'] })
      reset()
      onClose()
    },
    onError: (error: any) => {
      console.error('Error editing company:', error)
      toast({
        title: 'Error',
        variant: 'destructive',
        description: error?.message || 'Unexpected error occurred',
      })
    },
  })

  return mutation
}

export const useDeleteCompany = ({
  onClose,
  reset,
}: {
  onClose: () => void
  reset: () => void
}) => {
  useInitializeUser()
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: async ({ id }: { id: number }) => {
      const res = await deleteCompany(id)

      console.log('DELETE RESPONSE:', res)

      const apiError = res?.error || (res?.data === null && res?.error?.message)
      const successFlag = (res?.error?.details as any)?.success

      if (apiError || successFlag === false) {
        throw new Error('Failed to delete company')
      }

      return res
    },
    onSuccess: () => {
      toast({
        title: 'Success!',
        description: 'Company is deleted successfully.',
      })
      queryClient.invalidateQueries({ queryKey: ['companies'] })
      reset()
      onClose()
    },
    onError: (error: any) => {
      console.error('Delete error:', error)
      toast({
        title: 'Error',
        variant: 'destructive',
        description: 'This data is needed elsewhere',
      })
    },
  })

  return mutation
}

// Work Stations Hooks
export const useGetWorkStations = () => {
  useInitializeUser()
  const userData = useAtomValue(userDataAtom)

  return useQuery({
    queryKey: ['workstations'],
    queryFn: () => getAllWorkStations(),
    enabled: !!userData,
    select: (data) => data,
  })
}

export const useAddWorkStation = ({
  onClose,
  reset,
}: {
  onClose: () => void
  reset: () => void
}) => {
  useInitializeUser()
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: async (data: CreateWorkStationType) => {
      const res = await createWorkStation(data)
      return res
    },
    onSuccess: (res) => {
      if (res?.error) {
        toast({
          title: 'Error',
          variant: 'destructive',
          description: res.error.message || 'Failed to create work station',
        })
        return
      }

      toast({
        title: 'Success',
        description: 'Work station created successfully!',
      })

      queryClient.invalidateQueries({ queryKey: ['workstations'] })
      reset()
      onClose()
    },
    onError: (error: any) => {
      console.error('Error adding work station:', error)
      toast({
        title: 'Error',
        variant: 'destructive',
        description: error?.message || 'Unexpected error occurred',
      })
    },
  })

  return mutation
}

export const useUpdateWorkStation = ({
  onClose,
  reset,
}: {
  onClose: () => void
  reset: () => void
}) => {
  useInitializeUser()
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: CreateWorkStationType }) => {
      return editWorkStation(id, data)
    },
    onSuccess: () => {
      toast({
        title: 'Success!',
        description: 'Work station edited successfully.',
      })
      queryClient.invalidateQueries({ queryKey: ['workstations'] })

      reset()
      onClose()
    },
    onError: (error) => {
      console.error('Error editing work station:', error)
    },
  })

  return mutation
}

export const useDeleteWorkStation = ({
  onClose,
  reset,
}: {
  onClose: () => void
  reset: () => void
}) => {
  useInitializeUser()
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: async ({ id }: { id: number }) => {
      const res = await deleteWorkStation(id)

      console.log('DELETE RESPONSE:', res)

      const apiError = res?.error || (res?.data === null && res?.error?.message)

      const successFlag = (res?.error?.details as any)?.success

      if (apiError || successFlag === false) {
        throw new Error('Failed to delete work station')
      }

      return res
    },

    onSuccess: () => {
      toast({
        title: 'Success!',
        description: 'Work station is deleted successfully.',
      })
      queryClient.invalidateQueries({ queryKey: ['workstations'] })

      reset()
      onClose()
    },

    onError: (error: any) => {
      console.error('Delete error:', error)

      toast({
        title: 'Error',
        variant: 'destructive',
        description: 'This data is needed elsewhere',
      })
    },
  })

  return mutation
}

// Divisions Hooks
export const useGetDivisions = () => {
  useInitializeUser()
  const userData = useAtomValue(userDataAtom)

  return useQuery({
    queryKey: ['divisions'],
    queryFn: () => getAllDivisions(),
    enabled: !!userData,
    select: (data) => data,
  })
}

export const useAddDivision = ({
  onClose,
  reset,
}: {
  onClose: () => void
  reset: () => void
}) => {
  useInitializeUser()
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: async (data: CreateDivisionType) => {
      const res = await createDivision(data)
      return res
    },
    onSuccess: (res) => {
      if (res?.error) {
        toast({
          title: 'Error',
          variant: 'destructive',
          description: res.error.message || 'Failed to create division',
        })
        return
      }

      toast({
        title: 'Success',
        description: 'Division created successfully!',
      })

      queryClient.invalidateQueries({ queryKey: ['divisions'] })
      reset()
      onClose()
    },
    onError: (error: any) => {
      console.error('Error adding division:', error)
      toast({
        title: 'Error',
        variant: 'destructive',
        description: error?.message || 'Unexpected error occurred',
      })
    },
  })

  return mutation
}

export const useUpdateDivision = ({
  onClose,
  reset,
}: {
  onClose: () => void
  reset: () => void
}) => {
  useInitializeUser()
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: GetDivisionType }) => {
      return editDivision(id, data)
    },
    onSuccess: () => {
      toast({
        title: 'Success!',
        description: 'Division edited successfully.',
      })
      queryClient.invalidateQueries({ queryKey: ['divisions'] })

      reset()
      onClose()
    },
    onError: (error) => {
      console.error('Error editing division:', error)
    },
  })

  return mutation
}

export const useDeleteDivision = ({
  onClose,
  reset,
}: {
  onClose: () => void
  reset: () => void
}) => {
  useInitializeUser()
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: async ({ id }: { id: number }) => {
      const res = await deleteDivision(id)

      console.log('DELETE RESPONSE:', res)

      const apiError = res?.error || (res?.data === null && res?.error?.message)

      const successFlag = (res?.error?.details as any)?.success

      if (apiError || successFlag === false) {
        throw new Error('Failed to delete division')
      }

      return res
    },

    onSuccess: () => {
      toast({
        title: 'Success!',
        description: 'Division is deleted successfully.',
      })
      queryClient.invalidateQueries({ queryKey: ['divisions'] })

      reset()
      onClose()
    },

    onError: (error: any) => {
      console.error('Delete error:', error)

      toast({
        title: 'Error',
        variant: 'destructive',
        description: 'This data is needed elsewhere',
      })
    },
  })

  return mutation
}

// Cost Centers Hooks
export const useGetCostCenters = () => {
  useInitializeUser()
  const userData = useAtomValue(userDataAtom)

  return useQuery({
    queryKey: ['costcenters'],
    queryFn: () => getAllCostCenters(),
    enabled: !!userData,
    select: (data) => data,
  })
}

export const useAddCostCenter = ({
  onClose,
  reset,
}: {
  onClose: () => void
  reset: () => void
}) => {
  useInitializeUser()
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: async (data: CreateCostCenterType) => {
      const res = await createCostCenter(data)
      return res
    },
    onSuccess: (res) => {
      if (res?.error) {
        toast({
          title: 'Error',
          variant: 'destructive',
          description: res.error.message || 'Failed to create cost center',
        })
        return
      }

      toast({
        title: 'Success',
        description: 'Cost center created successfully!',
      })

      queryClient.invalidateQueries({ queryKey: ['costcenters'] })
      reset()
      onClose()
    },
    onError: (error: any) => {
      console.error('Error adding cost center:', error)
      toast({
        title: 'Error',
        variant: 'destructive',
        description: error?.message || 'Unexpected error occurred',
      })
    },
  })

  return mutation
}

export const useUpdateCostCenter = ({
  onClose,
  reset,
}: {
  onClose: () => void
  reset: () => void
}) => {
  useInitializeUser()
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: CreateCostCenterType }) => {
      return editCostCenter(id, data)
    },
    onSuccess: () => {
      toast({
        title: 'Success!',
        description: 'Cost center edited successfully.',
      })
      queryClient.invalidateQueries({ queryKey: ['costcenters'] })

      reset()
      onClose()
    },
    onError: (error) => {
      console.error('Error editing cost center:', error)
    },
  })

  return mutation
}

export const useDeleteCostCenter = ({
  onClose,
  reset,
}: {
  onClose: () => void
  reset: () => void
}) => {
  useInitializeUser()
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: async ({ id }: { id: number }) => {
      const res = await deleteCostCenter(id)

      console.log('DELETE RESPONSE:', res)

      const apiError = res?.error || (res?.data === null && res?.error?.message)

      const successFlag = (res?.error?.details as any)?.success

      if (apiError || successFlag === false) {
        throw new Error('Failed to delete cost center')
      }

      return res
    },

    onSuccess: () => {
      toast({
        title: 'Success!',
        description: 'Cost center is deleted successfully.',
      })
      queryClient.invalidateQueries({ queryKey: ['costcenters'] })

      reset()
      onClose()
    },

    onError: (error: any) => {
      console.error('Delete error:', error)

      toast({
        title: 'Error',
        variant: 'destructive',
        description: 'This data is needed elsewhere',
      })
    },
  })

  return mutation
}

//designation
export const useGetDesignations = () => {
  useInitializeUser()
  const userData = useAtomValue(userDataAtom)

  return useQuery({
    queryKey: ['designations'],
    queryFn: () => getAllDesignations(),
    enabled: !!userData,
    select: (data) => data,
  })
}

export const useAddDesignation = ({
  onClose,
  reset,
}: {
  onClose: () => void
  reset: () => void
}) => {
  useInitializeUser()
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: async (data: CreateDesignationType) => {
      const res = await createDesignation(data)
      return res
    },
    onSuccess: (res) => {
      if (res?.error) {
        toast({
          title: 'Error',
          variant: 'destructive',
          description: res.error.message || 'Failed to create designation',
        })
        return
      }

      toast({
        title: 'Success',
        description: 'Designation created successfully!',
      })

      queryClient.invalidateQueries({ queryKey: ['designations'] })
      reset()
      onClose()
    },
    onError: (error: any) => {
      console.error('Error adding designation:', error)
      toast({
        title: 'Error',
        variant: 'destructive',
        description: error?.message || 'Unexpected error occurred',
      })
    },
  })

  return mutation
}

export const useUpdateDesignation = ({
  onClose,
  reset,
}: {
  onClose: () => void
  reset: () => void
}) => {
  useInitializeUser()
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: CreateDesignationType }) => {
      return editDesignation(id, data)
    },
    onSuccess: () => {
      toast({
        title: 'Success!',
        description: 'designation edited successfully.',
      })
      queryClient.invalidateQueries({ queryKey: ['designations'] })

      reset()
      onClose()
    },
    onError: (error) => {
      console.error('Error editing designation:', error)
    },
  })

  return mutation
}

export const useDeleteDesignation = ({
  onClose,
  reset,
}: {
  onClose: () => void
  reset: () => void
}) => {
  useInitializeUser()
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: async ({ id }: { id: number }) => {
      const res = await deleteDesignation(id)

      console.log('DELETE RESPONSE:', res)

      const apiError = res?.error || (res?.data === null && res?.error?.message)

      const successFlag = (res?.error?.details as any)?.success

      if (apiError || successFlag === false) {
        throw new Error('Failed to delete designation')
      }

      return res
    },

    onSuccess: () => {
      toast({
        title: 'Success!',
        description: 'Designation is deleted successfully.',
      })
      queryClient.invalidateQueries({ queryKey: ['designations'] })

      reset()
      onClose()
    },

    onError: (error: any) => {
      console.error('Delete error:', error)

      toast({
        title: 'Error',
        variant: 'destructive',
        description: 'This data is needed elsewhere',
      })
    },
  })

  return mutation
}

//employee type
export const useGetEmploymentTypes = () => {
  useInitializeUser()
  const userData = useAtomValue(userDataAtom)

  return useQuery({
    queryKey: ['employmentTypes'],
    queryFn: () => getAllEmploymentTypes(),
    enabled: !!userData,
    select: (data) => data,
  })
}

export const useAddEmploymentType = ({
  onClose,
  reset,
}: {
  onClose: () => void
  reset: () => void
}) => {
  useInitializeUser()
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: async (data: CreateEmploymentTypeType) => {
      const res = await createEmploymentType(data)
      return res
    },
    onSuccess: (res) => {
      if (res?.error) {
        toast({
          title: 'Error',
          variant: 'destructive',
          description: res.error.message || 'Failed to create employee type',
        })
        return
      }

      toast({
        title: 'Success',
        description: 'Employee type created successfully!',
      })

      queryClient.invalidateQueries({ queryKey: ['employmentTypes'] })
      reset()
      onClose()
    },
    onError: (error: any) => {
      console.error('Error adding employmentType:', error)
      toast({
        title: 'Error',
        variant: 'destructive',
        description: error?.message || 'Unexpected error occurred',
      })
    },
  })

  return mutation
}

export const useUpdateEmploymentType = ({
  onClose,
  reset,
}: {
  onClose: () => void
  reset: () => void
}) => {
  useInitializeUser()
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: number
      data: CreateEmploymentTypeType
    }) => {
      return editEmploymentType(id, data)
    },
    onSuccess: () => {
      toast({
        title: 'Success!',
        description: 'employee type edited successfully.',
      })
      queryClient.invalidateQueries({ queryKey: ['employmentTypes'] })

      reset()
      onClose()
    },
    onError: (error) => {
      console.error('Error editing employmentType:', error)
    },
  })

  return mutation
}

export const useDeleteEmploymentType = ({
  onClose,
  reset,
}: {
  onClose: () => void
  reset: () => void
}) => {
  useInitializeUser()
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: async ({ id }: { id: number }) => {
      const res = await deleteEmploymentType(id)

      console.log('DELETE RESPONSE:', res)

      const apiError = res?.error || (res?.data === null && res?.error?.message)

      const successFlag = (res?.error?.details as any)?.success

      if (apiError || successFlag === false) {
        throw new Error('Failed to delete employment type')
      }

      return res
    },

    onSuccess: () => {
      toast({
        title: 'Success!',
        description: 'Employment type is deleted successfully.',
      })
      queryClient.invalidateQueries({ queryKey: ['employmentTypes'] })

      reset()
      onClose()
    },

    onError: (error: any) => {
      console.error('Delete error:', error)

      toast({
        title: 'Error',
        variant: 'destructive',
        description: 'This data is needed elsewhere',
      })
    },
  })

  return mutation
}

//weekDay
export const useGetWeekDays = () => {
  useInitializeUser()
  const userData = useAtomValue(userDataAtom)

  return useQuery({
    queryKey: ['weekDays'],
    queryFn: () => getAllWeekDays(),
    enabled: !!userData,
    select: (data) => data,
  })
}

//shift weekDays
export const useGetShiftDayAndWeekDays = () => {
  useInitializeUser()
  const userData = useAtomValue(userDataAtom)

  return useQuery({
    queryKey: ['shift'],
    queryFn: () => getAllShiftDayAndWeekDays(),
    enabled: !!userData,
    select: (data) => data,
  })
}

export const useAddShiftDayAndWeekDays = ({
  onClose,
  reset,
}: {
  onClose: () => void
  reset: () => void
}) => {
  useInitializeUser()
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: async (data: CreateShiftType) => {
      const res = await createShiftDayAndWeekDays(data)
      return res
    },
    onSuccess: (res) => {
      if (res?.error) {
        toast({
          title: 'Error',
          variant: 'destructive',
          description: res.error.message || 'Failed to create shift',
        })
        return
      }

      toast({
        title: 'Success',
        description: 'Office timing created successfully!',
      })

      queryClient.invalidateQueries({ queryKey: ['shift'] })
      reset()
      onClose()
    },
    onError: (error: any) => {
      console.error('Error adding shift:', error)
      toast({
        title: 'Error',
        variant: 'destructive',
        description: error?.message || 'Unexpected error occurred',
      })
    },
  })

  return mutation
}

export const useUpdateShiftDayAndWeekDays = ({
  onClose,
  reset,
}: {
  onClose: () => void
  reset: () => void
}) => {
  useInitializeUser()
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: GetShiftsType }) => {
      return editShiftDayAndWeekDays(id, data)
    },
    onSuccess: () => {
      toast({
        title: 'Success!',
        description: 'shift is edited successfully.',
      })
      queryClient.invalidateQueries({ queryKey: ['shift'] })

      reset()
      onClose()
    },
    onError: (error) => {
      console.error('Error editing shift:', error)
    },
  })

  return mutation
}

export const useDeleteShiftDayAndWeekDays = ({
  onClose,
  reset,
}: {
  onClose: () => void
  reset: () => void
}) => {
  useInitializeUser()
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: async ({ id }: { id: number }) => {
      const res = await deleteShiftDayAndWeekDays(id)

      console.log('DELETE RESPONSE:', res)

      const apiError = res?.error || (res?.data === null && res?.error?.message)

      const successFlag = (res?.error?.details as any)?.success

      if (apiError || successFlag === false) {
        throw new Error('Failed to delete shift')
      }

      return res
    },

    onSuccess: () => {
      toast({
        title: 'Success!',
        description: 'shift is deleted successfully.',
      })
      queryClient.invalidateQueries({ queryKey: ['shift'] })

      reset()
      onClose()
    },

    onError: (error: any) => {
      console.error('Delete error:', error)

      toast({
        title: 'Error',
        variant: 'destructive',
        description: 'This data is needed elsewhere',
      })
    },
  })

  return mutation
}

// employee-preboarding
export const useGetAllEmployeePreboardings = () => {
  useInitializeUser()
  const userData = useAtomValue(userDataAtom)

  return useQuery({
    queryKey: ['employeePreboardings'],
    queryFn: () => getAllEmployeePreboardings(),
    enabled: !!userData,
    select: (data) => data,
  })
}

export const useGetEmployeePreboardingById = (id: number) => {
  useInitializeUser()
  const userData = useAtomValue(userDataAtom)

  return useQuery({
    queryKey: ['employeePreboardings', id],
    queryFn: () => getEmployeePreboardingById(id),
    enabled: !!userData && id > 0,
    select: (data) => data,
  })
}

export const useCreateEmployeePreboarding = ({
  onClose,
  reset,
}: {
  onClose: () => void
  reset: () => void
}) => {
  useInitializeUser()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: CreateEmployeePreboardingType) => {
      return createEmployeePreboarding(data)
    },

    onSuccess: () => {
      toast({
        title: 'Success!',
        description: 'Employee preboarding created successfully.',
      })
      queryClient.invalidateQueries({ queryKey: ['employeePreboardings'] })
      reset()
      onClose()
    },

    onError: (error) => {
      console.error('Create preboarding error:', error)
      toast({
        title: 'Error',
        variant: 'destructive',
        description: 'Failed to create employee preboarding',
      })
    },
  })
}

export const useEditEmployeePreboarding = ({
  onClose,
  reset,
}: {
  onClose: () => void
  reset: () => void
}) => {
  useInitializeUser()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: number
      data: GetEmployeePreboardingType
    }) => {
      return editEmployeePreboarding(id, data)
    },

    onSuccess: () => {
      toast({
        title: 'Success!',
        description: 'Employee preboarding updated successfully.',
      })
      queryClient.invalidateQueries({ queryKey: ['employeePreboardings'] })
      reset()
      onClose()
    },

    onError: (error) => {
      console.error('Edit preboarding error:', error)
      toast({
        title: 'Error',
        variant: 'destructive',
        description: 'Failed to update employee preboarding',
      })
    },
  })
}

export const useDeleteEmployeePreboarding = ({
  onClose,
  reset,
}: {
  onClose: () => void
  reset: () => void
}) => {
  useInitializeUser()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id }: { id: number }) => {
      return deleteEmployeePreboarding(id)
    },

    onSuccess: () => {
      toast({
        title: 'Success!',
        description: 'Employee preboarding deleted successfully.',
      })
      queryClient.invalidateQueries({ queryKey: ['employeePreboardings'] })
      reset()
      onClose()
    },

    onError: (error) => {
      console.error('Delete preboarding error:', error)
      toast({
        title: 'Error',
        variant: 'destructive',
        description: 'This record is needed elsewhere',
      })
    },
  })
}

export const useCompleteEmployeePreboardingChecklist = ({
  onClose,
  reset,
}: {
  onClose: () => void
  reset: () => void
}) => {
  useInitializeUser()
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: ({
      employeePreboardingChecklistId,
      completionDate,
    }: {
      employeePreboardingChecklistId: number
      completionDate: string | Date
    }) => {
      return completeEmployeePreboardingChecklist({
        employeePreboardingChecklistId,
        completionDate,
      })
    },

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['preboardingChecklist'],
      })

      reset()
      onClose()
    },

    onError: (error) => {
      console.error('Error completing checklist:', error)

      toast({
        title: 'Error',
        variant: 'destructive',
        description: 'Failed to complete checklist',
      })
    },
  })

  return mutation
}

//checklists
export const useGetChecklists = () => {
  useInitializeUser()
  const userData = useAtomValue(userDataAtom)

  return useQuery({
    queryKey: ['checklists'],
    queryFn: () => getAllChecklists(),
    enabled: !!userData,
    select: (data) => data,
  })
}

export const useAddChecklists = ({
  onClose,
  reset,
}: {
  onClose: () => void
  reset: () => void
}) => {
  useInitializeUser()
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: async (data: CreateChecklistType) => {
      const res = await createChecklist(data)
      return res
    },
    onSuccess: (res) => {
      if (res?.error) {
        toast({
          title: 'Error',
          variant: 'destructive',
          description: res.error.message || 'Failed to create checklist',
        })
        return
      }

      toast({
        title: 'Success',
        description: 'Checklist created successfully!',
      })

      queryClient.invalidateQueries({
        queryKey: ['checklists'],
      })

      reset()
      onClose()
    },
    onError: (error: any) => {
      console.error('Error adding checklist:', error)
      toast({
        title: 'Error',
        variant: 'destructive',
        description: error?.message || 'Unexpected error occurred',
      })
    },
  })

  return mutation
}

export const useUpdateChecklists = ({
  onClose,
  reset,
}: {
  onClose: () => void
  reset: () => void
}) => {
  useInitializeUser()
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: GetChecklistType }) => {
      return editChecklist(id, data)
    },
    onSuccess: () => {
      toast({
        title: 'Success!',
        description: 'Checklist updated successfully.',
      })

      queryClient.invalidateQueries({
        queryKey: ['checklists'],
      })

      reset()
      onClose()
    },
    onError: (error) => {
      console.error('Error editing checklist:', error)
      toast({
        title: 'Error',
        variant: 'destructive',
        description: 'Failed to update checklist',
      })
    },
  })

  return mutation
}

export const useDeleteChecklists = ({
  onClose,
  reset,
}: {
  onClose: () => void
  reset: () => void
}) => {
  useInitializeUser()
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: async ({ id }: { id: number }) => {
      const res = await deleteChecklist(id)

      console.log('DELETE RESPONSE:', res)

      const apiError = res?.error || (res?.data === null && res?.error?.message)

      const successFlag = (res?.error?.details as any)?.success

      if (apiError || successFlag === false) {
        throw new Error('Failed to delete checklist')
      }

      return res
    },

    onSuccess: () => {
      toast({
        title: 'Success!',
        description: 'Checklist deleted successfully.',
      })
      queryClient.invalidateQueries({ queryKey: ['checklists'] })

      reset()
      onClose()
    },

    onError: (error: any) => {
      console.error('Delete error:', error)

      toast({
        title: 'Error',
        variant: 'destructive',
        description: 'This data is needed elsewhere',
      })
    },
  })

  return mutation
}

export const useGetPreboardingEmployeeChecklistsById = (id: number) => {
  useInitializeUser()
  const userData = useAtomValue(userDataAtom)

  return useQuery({
    queryKey: ['preboardingChecklist', id],
    queryFn: () => getPreboardingEmployeeChecklistsById(id),
    enabled: !!userData && id > 0,
    select: (data) => data,
  })
}

export const useGetPreboardingEmployeeChecklistsByUserId = (userId: number) => {
  useInitializeUser()
  const userData = useAtomValue(userDataAtom)

  return useQuery({
    queryKey: ['preboardingChecklist', userId],
    queryFn: () => getPreboardingEmployeeChecklistsByUserId(userId),
    enabled: !!userData && userId > 0,
    select: (data) => data,
  })
}

export const useAddPreboardingEmployeeChecklists = ({
  onClose,
  reset,
}: {
  onClose: () => void
  reset: () => void
}) => {
  useInitializeUser()
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: async (data: CreateEmployeePreboardingChecklistType) => {
      const res = await createPreboardingEmployeeChecklist(data)
      return res
    },
    onSuccess: (res) => {
      if (res?.error) {
        toast({
          title: 'Error',
          variant: 'destructive',
          description: res.error.message || 'Failed to create checklist',
        })
        return
      }

      toast({
        title: 'Success',
        description: 'Checklist created successfully!',
      })

      queryClient.invalidateQueries({
        queryKey: ['checklists'],
      })

      reset()
      onClose()
    },
    onError: (error: any) => {
      console.error('Error adding checklist:', error)
      toast({
        title: 'Error',
        variant: 'destructive',
        description: error?.message || 'Unexpected error occurred',
      })
    },
  })

  return mutation
}

export const useUpdatePreboardingEmployeeChecklists = ({
  onClose,
  reset,
}: {
  onClose: () => void
  reset: () => void
}) => {
  useInitializeUser()
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: number
      data: GetEmployeePreboardingChecklistType
    }) => {
      return editEmployeePreboardingChecklist(id, data)
    },
    onSuccess: () => {
      toast({
        title: 'Success!',
        description: 'Checklist updated successfully.',
      })

      queryClient.invalidateQueries({
        queryKey: ['checklists'],
      })

      reset()
      onClose()
    },
    onError: (error) => {
      console.error('Error editing checklist:', error)
      toast({
        title: 'Error',
        variant: 'destructive',
        description: 'Failed to update checklist',
      })
    },
  })

  return mutation
}

//notifications
export const useGetNotificationsByUserId = (id: number) => {
  useInitializeUser()
  const userData = useAtomValue(userDataAtom)

  return useQuery({
    queryKey: ['notifications', id],
    queryFn: () => getNotificationsById(id),
    enabled: !!userData && id > 0,
    select: (data) => data,
  })
}

export const useMarksAsRead = ({
  onClose,
  reset,
}: {
  onClose: () => void
  reset: () => void
}) => {
  useInitializeUser()
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: ({ data }: { data: number[] }) => {
      return markAsRead(data)
    },

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['notifications'],
      })

      reset()
      onClose()
    },

    onError: (error) => {
      console.error('Error marking notifications as read:', error)

      toast({
        title: 'Error',
        variant: 'destructive',
        description: 'Failed to mark as read',
      })
    },
  })

  return mutation
}

//employee
export const useAddEmployee = ({
  onClose,
  reset,
}: {
  onClose: () => void
  reset: () => void
}) => {
  useInitializeUser()
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const res = await createEmployee(formData)
      return res
    },
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Employee created successfully!',
      })

      queryClient.invalidateQueries({ queryKey: ['employees'] })
      reset()
      onClose()
    },
    onError: (error: any) => {
      console.error('Error adding employees:', error)
      toast({
        title: 'Error',
        variant: 'destructive',
        description: error?.message || 'Unexpected error occurred',
      })
    },
  })

  return mutation
}

export const useGetAllEmployees = () => {
  useInitializeUser()
  const userData = useAtomValue(userDataAtom)

  return useQuery({
    queryKey: ['employees'],
    queryFn: () => getAllEmployees(),
    enabled: !!userData,
    select: (data) => data,
  })
}

export const useGetEmployeeById = (id: number) => {
  useInitializeUser()
  const userData = useAtomValue(userDataAtom)

  return useQuery({
    queryKey: ['employees', id],
    queryFn: () => getEmployeeById(id),
    enabled: !!userData && id > 0,
    select: (data) => data,
  })
}

export const useGetEmpIdByUserId = (userId: number) => {
  useInitializeUser()
  const userData = useAtomValue(userDataAtom)

  return useQuery({
    queryKey: ['employees', userId],
    queryFn: () => getEmpIdByUserId(userId),
    enabled: !!userData && userId > 0,
    select: (data) => data,
  })
}

export const useUpdateEmployeeWithFees = ({
  onClose,
  reset,
}: {
  onClose: () => void
  reset: () => void
}) => {
  useInitializeUser()
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: ({ data }: { data: FormData }) => {
      return editEmployee(data)
    },
    onSuccess: () => {
      toast({
        title: 'Success!',
        description: 'Employee edited successfully.',
      })
      queryClient.invalidateQueries({ queryKey: ['employees'] })
      reset()
      onClose()
    },
    onError: (error) => {
      console.error('Error editing employee:', error)
    },
  })

  return mutation
}

export const useDeleteEmployee = ({
  onClose,
  reset,
}: {
  onClose: () => void
  reset: () => void
}) => {
  useInitializeUser()
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: async ({ id }: { id: number }) => {
      const res = await deleteEmployee(id)

      console.log('DELETE RESPONSE:', res)

      const apiError = res?.error || (res?.data === null && res?.error?.message)

      const successFlag = (res?.error?.details as any)?.success

      if (apiError || successFlag === false) {
        throw new Error('Failed to delete employee')
      }

      return res
    },

    onSuccess: () => {
      toast({
        title: 'Success!',
        description: 'employee is deleted successfully.',
      })
      queryClient.invalidateQueries({ queryKey: ['salaryComponents'] })

      reset()
      onClose()
    },

    onError: (error: any) => {
      console.error('Delete error:', error)

      toast({
        title: 'Error',
        variant: 'destructive',
        description: 'This data is needed elsewhere',
      })
    },
  })

  return mutation
}

export const useAssignLeaveType = ({
  onClose,
  reset,
}: {
  onClose: () => void
  reset: () => void
}) => {
  useInitializeUser()
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: async ({ data }: { data: AssignLeaveTypeType }) => {
      const res = await assignLeaveType(data)
      return res
    },
    onSuccess: (res) => {
      if (res?.error) {
        toast({
          title: 'Error',
          variant: 'destructive',
          description: res.error.message || 'Failed to assign leave type',
        })
        return
      }

      toast({
        title: 'Success',
        description: 'Leave type assigned successfully!',
      })

      queryClient.invalidateQueries({ queryKey: ['employees'] })
      reset()
      onClose()
    },
    onError: (error: any) => {
      console.error('Error assigning leaveType:', error)
      toast({
        title: 'Error',
        variant: 'destructive',
        description: error?.message || 'Unexpected error occurred',
      })
    },
  })

  return mutation
}

//holidays
export const useGetHolidays = () => {
  useInitializeUser()
  const userData = useAtomValue(userDataAtom)

  return useQuery({
    queryKey: ['holidays'],
    queryFn: () => getAllHolidays(),
    enabled: !!userData,
    select: (data) => data,
  })
}

export const useAddHoliday = ({
  onClose,
  reset,
}: {
  onClose: () => void
  reset: () => void
}) => {
  useInitializeUser()
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: async (data: CreateHolidayType) => {
      const res = await createHoliday(data)
      return res
    },
    onSuccess: (res) => {
      if (res?.error) {
        toast({
          title: 'Error',
          variant: 'destructive',
          description: res.error.message || 'Failed to create holiday',
        })
        return
      }

      toast({
        title: 'Success',
        description: 'Holiday created successfully!',
      })

      queryClient.invalidateQueries({ queryKey: ['holidays'] })
      reset()
      onClose()
    },
    onError: (error: any) => {
      console.error('Error adding holiday:', error)
      toast({
        title: 'Error',
        variant: 'destructive',
        description: error?.message || 'Unexpected error occurred',
      })
    },
  })

  return mutation
}

export const useUpdateHoliday = ({
  onClose,
  reset,
}: {
  onClose: () => void
  reset: () => void
}) => {
  useInitializeUser()
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: CreateHolidayType }) => {
      return editHoliday(id, data)
    },
    onSuccess: () => {
      toast({
        title: 'Success!',
        description: 'holiday edited successfully.',
      })
      queryClient.invalidateQueries({ queryKey: ['holidays'] })

      reset()
      onClose()
    },
    onError: (error) => {
      console.error('Error editing holiday:', error)
    },
  })

  return mutation
}

export const useDeleteHoliday = ({
  onClose,
  reset,
}: {
  onClose: () => void
  reset: () => void
}) => {
  useInitializeUser()
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: async ({ id }: { id: number }) => {
      const res = await deleteHoliday(id)

      console.log('DELETE RESPONSE:', res)

      const apiError = res?.error || (res?.data === null && res?.error?.message)

      const successFlag = (res?.error?.details as any)?.success

      if (apiError || successFlag === false) {
        throw new Error('Failed to delete holiday')
      }

      return res
    },

    onSuccess: () => {
      toast({
        title: 'Success!',
        description: 'holiday is deleted successfully.',
      })
      queryClient.invalidateQueries({ queryKey: ['holidays'] })

      reset()
      onClose()
    },

    onError: (error: any) => {
      console.error('Delete error:', error)

      toast({
        title: 'Error',
        variant: 'destructive',
        description: 'This data is needed elsewhere',
      })
    },
  })

  return mutation
}

//leave type
export const useGetLeaveTypes = () => {
  useInitializeUser()
  const userData = useAtomValue(userDataAtom)

  return useQuery({
    queryKey: ['leaveTypes'],
    queryFn: () => getAllLeaveTypes(),
    enabled: !!userData,
    select: (data) => data,
  })
}

export const useAddLeaveType = ({
  onClose,
  reset,
}: {
  onClose: () => void
  reset: () => void
}) => {
  useInitializeUser()
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: async (data: CreateLeaveTypeType) => {
      const res = await createLeaveType(data)
      return res
    },
    onSuccess: (res) => {
      if (res?.error) {
        toast({
          title: 'Error',
          variant: 'destructive',
          description: res.error.message || 'Failed to create leave type',
        })
        return
      }

      toast({
        title: 'Success',
        description: 'Leave type created successfully!',
      })

      queryClient.invalidateQueries({ queryKey: ['leaveTypes'] })
      reset()
      onClose()
    },
    onError: (error: any) => {
      console.error('Error adding leaveType:', error)
      toast({
        title: 'Error',
        variant: 'destructive',
        description: error?.message || 'Unexpected error occurred',
      })
    },
  })

  return mutation
}

export const useUpdateLeaveType = ({
  onClose,
  reset,
}: {
  onClose: () => void
  reset: () => void
}) => {
  useInitializeUser()
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: GetLeaveTypeType }) => {
      return editLeaveType(id, data)
    },
    onSuccess: () => {
      toast({
        title: 'Success!',
        description: 'leave type edited successfully.',
      })
      queryClient.invalidateQueries({ queryKey: ['leaveTypes'] })

      reset()
      onClose()
    },
    onError: (error) => {
      console.error('Error editing leaveType:', error)
    },
  })

  return mutation
}

export const useDeleteLeaveType = ({
  onClose,
  reset,
}: {
  onClose: () => void
  reset: () => void
}) => {
  useInitializeUser()
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: async ({ id }: { id: number }) => {
      const res = await deleteLeaveType(id)

      console.log('DELETE RESPONSE:', res)

      const apiError = res?.error || (res?.data === null && res?.error?.message)

      const successFlag = (res?.error?.details as any)?.success

      if (apiError || successFlag === false) {
        throw new Error('Failed to delete leave type')
      }

      return res
    },

    onSuccess: () => {
      toast({
        title: 'Success!',
        description: 'leave type is deleted successfully.',
      })
      queryClient.invalidateQueries({ queryKey: ['leaveTypes'] })

      reset()
      onClose()
    },

    onError: (error: any) => {
      console.error('Delete error:', error)

      toast({
        title: 'Error',
        variant: 'destructive',
        description: 'This data is needed elsewhere',
      })
    },
  })

  return mutation
}

//leave policy
export const useGetLeavePolicies = () => {
  useInitializeUser()
  const userData = useAtomValue(userDataAtom)

  return useQuery({
    queryKey: ['leavePolicy'],
    queryFn: () => getAllLeavePolicies(),
    enabled: !!userData,
    select: (data) => data,
  })
}

export const useAddLeavePolicys = ({
  onClose,
  reset,
}: {
  onClose: () => void
  reset: () => void
}) => {
  useInitializeUser()
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: async (data: CreateLeavePolicyType) => {
      const res = await createLeavePolicy(data)
      return res
    },
    onSuccess: (res) => {
      if (res?.error) {
        toast({
          title: 'Error',
          variant: 'destructive',
          description: res.error.message || 'Failed to create leave policy',
        })
        return
      }

      toast({
        title: 'Success',
        description: 'Leave Policy created successfully!',
      })

      queryClient.invalidateQueries({ queryKey: ['leavePolicy'] })
      reset()
      onClose()
    },
    onError: (error: any) => {
      console.error('Error adding leave policy:', error)
      toast({
        title: 'Error',
        variant: 'destructive',
        description: error?.message || 'Unexpected error occurred',
      })
    },
  })

  return mutation
}

export const useUpdateLeavePolicy = ({
  onClose,
  reset,
}: {
  onClose: () => void
  reset: () => void
}) => {
  useInitializeUser()
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: GetLeavePolicyType }) => {
      return editLeavePolicy(id, data)
    },
    onSuccess: () => {
      toast({
        title: 'Success!',
        description: 'leave policy is edited successfully.',
      })
      queryClient.invalidateQueries({ queryKey: ['leavePolicy'] })

      reset()
      onClose()
    },
    onError: (error) => {
      console.error('Error editing leave policy:', error)
    },
  })

  return mutation
}

export const useDeleteLeavePolicys = ({
  onClose,
  reset,
}: {
  onClose: () => void
  reset: () => void
}) => {
  useInitializeUser()
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: async ({ id }: { id: number }) => {
      const res = await deleteLeavePolicy(id)

      console.log('DELETE RESPONSE:', res)

      const apiError = res?.error || (res?.data === null && res?.error?.message)

      const successFlag = (res?.error?.details as any)?.success

      if (apiError || successFlag === false) {
        throw new Error('Failed to delete leave policy')
      }

      return res
    },

    onSuccess: () => {
      toast({
        title: 'Success!',
        description: 'leave policy is deleted successfully.',
      })
      queryClient.invalidateQueries({ queryKey: ['leavePolicy'] })

      reset()
      onClose()
    },

    onError: (error: any) => {
      console.error('Delete error:', error)

      toast({
        title: 'Error',
        variant: 'destructive',
        description: 'This data is needed elsewhere',
      })
    },
  })

  return mutation
}

export const useGetSalaryStructures = () => {
  useInitializeUser()
  const userData = useAtomValue(userDataAtom)

  return useQuery({
    queryKey: ['salaryStructure'],
    queryFn: () => getAllSalaryStructures(),
    enabled: !!userData,
    select: (data) => data,
  })
}

export const useAddSalaryStructures = ({
  onClose,
  reset,
}: {
  onClose: () => void
  reset: () => void
}) => {
  useInitializeUser()
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: async (data: CreateSalaryStructureType) => {
      const res = await createSalaryStructure(data)
      return res
    },
    onSuccess: (res) => {
      if (res?.error) {
        toast({
          title: 'Error',
          variant: 'destructive',
          description: res.error.message || 'Failed to create salary structure',
        })
        return
      }

      toast({
        title: 'Success',
        description: 'Salary structure created successfully!',
      })

      queryClient.invalidateQueries({
        queryKey: ['salaryStructure'],
      })

      reset()
      onClose()
    },
    onError: (error: any) => {
      console.error('Error adding salary structure:', error)
      toast({
        title: 'Error',
        variant: 'destructive',
        description: error?.message || 'Unexpected error occurred',
      })
    },
  })

  return mutation
}

export const useUpdateSalaryStructures = ({
  onClose,
  reset,
}: {
  onClose: () => void
  reset: () => void
}) => {
  useInitializeUser()
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: number
      data: GetSalaryStructureType
    }) => {
      return editSalaryStructure(id, data)
    },
    onSuccess: () => {
      toast({
        title: 'Success!',
        description: 'Salary structure updated successfully.',
      })

      queryClient.invalidateQueries({
        queryKey: ['salaryStructure'],
      })

      reset()
      onClose()
    },
    onError: (error) => {
      console.error('Error editing salary structure:', error)
      toast({
        title: 'Error',
        variant: 'destructive',
        description: 'Failed to update salary structure',
      })
    },
  })

  return mutation
}

export const useDeleteSalaryStructures = ({
  onClose,
  reset,
}: {
  onClose: () => void
  reset: () => void
}) => {
  useInitializeUser()
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: async ({ id }: { id: number }) => {
      const res = await deleteSalaryStructure(id)

      console.log('DELETE RESPONSE:', res)

      const apiError = res?.error || (res?.data === null && res?.error?.message)

      const successFlag = (res?.error?.details as any)?.success

      if (apiError || successFlag === false) {
        throw new Error('Failed to delete salary structure')
      }

      return res
    },

    onSuccess: () => {
      toast({
        title: 'Success!',
        description: 'Salary structure deleted successfully.',
      })
      queryClient.invalidateQueries({ queryKey: ['salaryStructure'] })

      reset()
      onClose()
    },

    onError: (error: any) => {
      console.error('Delete error:', error)

      toast({
        title: 'Error',
        variant: 'destructive',
        description: 'This data is needed elsewhere',
      })
    },
  })

  return mutation
}

//employee leave assignment
export const useGetEmployeeLeaveAssignments = () => {
  useInitializeUser()
  const userData = useAtomValue(userDataAtom)

  return useQuery({
    queryKey: ['employeeLeaveAssignments'],
    queryFn: () => getAllEmployeeLeaveAssignments(),
    enabled: !!userData,
    select: (data) => data,
  })
}

export const useCreateEmployeeLeaveAssignment = ({
  onClose,
  reset,
}: {
  onClose: () => void
  reset: () => void
}) => {
  useInitializeUser()
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: async (data: CreateEmployeeLeaveAssignmentType[]) => {
      const res = await createEmployeeLeaveAssignment(data)
      return res
    },
    onSuccess: (res) => {
      if (res?.error) {
        toast({
          title: 'Error',
          variant: 'destructive',
          description:
            res.error.message || 'Failed to create employee leave assignment',
        })
        return
      }

      toast({
        title: 'Success',
        description: 'Employee leave assignment created successfully!',
      })

      queryClient.invalidateQueries({ queryKey: ['employeeLeaveAssignments'] })
      reset()
      onClose()
    },
    onError: (error: any) => {
      console.error('Error adding employee leave assignment:', error)
      toast({
        title: 'Error',
        variant: 'destructive',
        description: error?.message || 'Unexpected error occurred',
      })
    },
  })

  return mutation
}

export const useUpdateEmployeeLeaveAssignment = ({
  onClose,
  reset,
}: {
  onClose: () => void
  reset: () => void
}) => {
  useInitializeUser()
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: number
      data: GetEmployeeLeaveAssignmentType
    }) => {
      return editEmployeeLeaveAssignment(id, data)
    },
    onSuccess: (res) => {
      if (res?.error) {
        toast({
          title: 'Error',
          variant: 'destructive',
          description:
            res.error.message || 'Failed to update employee leave assignment',
        })
        return
      }

      toast({
        title: 'Success!',
        description: 'Employee leave assignment updated successfully.',
      })
      queryClient.invalidateQueries({ queryKey: ['employeeLeaveAssignments'] })

      reset()
      onClose()
    },
    onError: (error) => {
      console.error('Error editing employee leave assignment:', error)
      toast({
        title: 'Error',
        variant: 'destructive',
        description:
          error?.message || 'Failed to update employee leave assignment',
      })
    },
  })

  return mutation
}

export const useDeleteEmployeeLeaveAssignment = ({
  onClose,
  reset,
}: {
  onClose: () => void
  reset: () => void
}) => {
  useInitializeUser()
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: async ({ id }: { id: number }) => {
      const res = await deleteEmployeeLeaveAssignment(id)

      console.log('DELETE RESPONSE:', res)

      const apiError = res?.error || (res?.data === null && res?.error?.message)

      const successFlag = (res?.error?.details as any)?.success

      if (apiError || successFlag === false) {
        throw new Error('Failed to delete employee leave assignment')
      }

      return res
    },

    onSuccess: () => {
      toast({
        title: 'Success!',
        description: 'Employee leave assignment deleted successfully.',
      })
      queryClient.invalidateQueries({ queryKey: ['employeeLeaveAssignments'] })

      reset()
      onClose()
    },

    onError: (error: any) => {
      console.error('Delete error:', error)

      toast({
        title: 'Error',
        variant: 'destructive',
        description: 'This data is needed elsewhere',
      })
    },
  })

  return mutation
}

//employee leave encashments
export const useGetEmployeeLeaveEncashments = () => {
  useInitializeUser()
  const userData = useAtomValue(userDataAtom)

  return useQuery({
    queryKey: ['employeeLeaveEncashments'],
    queryFn: () => getAllEmployeeLeaveEncashments(),
    enabled: !!userData,
    select: (data) => data,
  })
}

export const useCreateEmployeeLeaveEncashment = ({
  onClose,
  reset,
}: {
  onClose: () => void
  reset: () => void
}) => {
  useInitializeUser()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: CreateEmployeeLeaveEncashment[]) => {
      return createEmployeeLeaveEncashment(data)
    },

    onSuccess: (res) => {
      if (res?.error) {
        toast({
          title: 'Error',
          variant: 'destructive',
          description:
            res.error.message || 'Failed to create employee leave encashment',
        })
        return
      }

      toast({
        title: 'Success',
        description: 'Employee leave encashment created successfully!',
      })

      queryClient.invalidateQueries({
        queryKey: ['employeeLeaveEncashments'],
      })

      reset()
      onClose()
    },

    onError: (error: any) => {
      console.error('Error creating employee leave encashment:', error)

      toast({
        title: 'Error',
        variant: 'destructive',
        description: error?.message || 'Unexpected error occurred',
      })
    },
  })
}

//employee leave apply
export const useGetEmployeeLeaveApplications = () => {
  useInitializeUser()
  const userData = useAtomValue(userDataAtom)

  return useQuery({
    queryKey: ['employeeLeaveApplications'],
    queryFn: () => getAllEmployeeLeaveApplications(),
    enabled: !!userData,
    select: (data) => data,
  })
}

export const useCreateEmployeeLeaveApplication = ({
  onClose,
  reset,
}: {
  onClose: () => void
  reset: () => void
}) => {
  useInitializeUser()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: CreateEmployeeLeaveApply) => {
      return await createEmployeeLeaveApplication(data)
    },

    onSuccess: (res) => {
      if (res?.error) {
        toast({
          title: 'Error',
          variant: 'destructive',
          description:
            res.error.message || 'Failed to create leave application',
        })

        return
      }

      toast({
        title: 'Success',
        description: 'Leave application created successfully!',
      })

      queryClient.invalidateQueries({
        queryKey: ['employeeLeaveApplications'],
      })

      reset()
      onClose()
    },

    onError: (error: any) => {
      toast({
        title: 'Error',
        variant: 'destructive',
        description: error?.message || 'Unexpected error occurred',
      })
    },
  })
}

export const useUpdateEmployeeLeaveApplication = ({
  onClose,
  reset,
}: {
  onClose: () => void
  reset: () => void
}) => {
  useInitializeUser()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: GetEmployeeLeaveApply }) => {
      return editEmployeeLeaveApplication(id, data)
    },

    onSuccess: (res) => {
      if (res?.error) {
        toast({
          title: 'Error',
          variant: 'destructive',
          description:
            res.error.message || 'Failed to update leave application',
        })

        return
      }

      toast({
        title: 'Success!',
        description: 'Leave application updated successfully.',
      })

      queryClient.invalidateQueries({
        queryKey: ['employeeLeaveApplications'],
      })

      reset()
      onClose()
    },

    onError: (error: any) => {
      toast({
        title: 'Error',
        variant: 'destructive',
        description: error?.message || 'Failed to update leave application',
      })
    },
  })
}

export const useDeleteEmployeeLeaveApplication = ({
  onClose,
  reset,
}: {
  onClose: () => void
  reset: () => void
}) => {
  useInitializeUser()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id }: { id: number }) => {
      const res = await deleteEmployeeLeaveApplication(id)

      const apiError = res?.error || (res?.data === null && res?.error?.message)

      const successFlag = (res?.error?.details as any)?.success

      if (apiError || successFlag === false) {
        throw new Error('Failed to delete leave application')
      }

      return res
    },

    onSuccess: () => {
      toast({
        title: 'Success!',
        description: 'Leave application deleted successfully.',
      })

      queryClient.invalidateQueries({
        queryKey: ['employeeLeaveApplications'],
      })

      reset()
      onClose()
    },

    onError: () => {
      toast({
        title: 'Error',
        variant: 'destructive',
        description: 'This data is needed elsewhere',
      })
    },
  })
}

export const useApproveEmployeeLeaveRepAuth = () => {
  useInitializeUser()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, updatedBy }: { id: number; updatedBy: number }) =>
      approveEmployeeLeaveRepAuth(id, updatedBy),

    onSuccess: () => {
      toast({
        title: 'Success!',
        description: 'Leave approved by reporting authority.',
      })

      queryClient.invalidateQueries({
        queryKey: ['employeeLeaveApplications'],
      })
    },

    onError: (error: any) => {
      toast({
        title: 'Error',
        variant: 'destructive',
        description: error?.message || 'Approval failed',
      })
    },
  })
}

export const useApproveEmployeeLeaveHr = () => {
  useInitializeUser()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, updatedBy }: { id: number; updatedBy: number }) =>
      approveEmployeeLeaveHr(id, updatedBy),

    onSuccess: () => {
      toast({
        title: 'Success!',
        description: 'Leave approved by HR.',
      })

      queryClient.invalidateQueries({
        queryKey: ['employeeLeaveApplications'],
      })
    },

    onError: (error: any) => {
      toast({
        title: 'Error',
        variant: 'destructive',
        description: error?.message || 'Approval failed',
      })
    },
  })
}

export const useRejectLeave = () => {
  useInitializeUser()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, updatedBy }: { id: number; updatedBy: number }) =>
      rejectLeave(id, updatedBy),

    onSuccess: () => {
      toast({
        title: 'Success!',
        description: 'Leave is rejected successfully',
      })

      queryClient.invalidateQueries({
        queryKey: ['employeeLeaveApplications'],
      })
    },

    onError: (error: any) => {
      toast({
        title: 'Error',
        variant: 'destructive',
        description: error?.message || 'Approval failed',
      })
    },
  })
}

export const useGetLeaveApplyNoOfDays = ({
  userId,
  leaveTypeId,
  fromDate,
  toDate,
}: {
  userId: number
  leaveTypeId: number
  fromDate: string
  toDate: string
}) => {
  useInitializeUser()
  const userData = useAtomValue(userDataAtom)

  return useQuery({
    queryKey: ['leaveApplyNoOfDays', userId, leaveTypeId, fromDate, toDate],
    queryFn: () => getLeaveApplyNoOfDays(userId, leaveTypeId, fromDate, toDate),
    enabled:
      !!userData && userId > 0 && leaveTypeId > 0 && !!fromDate && !!toDate,
    select: (data) => data,
  })
}

//asset category
export const useGetAllAssetCategories = () => {
  useInitializeUser()
  const userData = useAtomValue(userDataAtom)

  return useQuery({
    queryKey: ['assetCategories'],
    queryFn: () => getAllAssetCategories(),
    enabled: !!userData,
    select: (data) => data,
  })
}

export const useGetAssetCategoryById = (id: number) => {
  useInitializeUser()
  const userData = useAtomValue(userDataAtom)

  return useQuery({
    queryKey: ['assetCategory', id],
    queryFn: () => getAssetCategoryById(id),
    enabled: !!userData && !!id,
    select: (data) => data,
  })
}

export const useAddAssetCategory = ({
  onClose,
  reset,
}: {
  onClose: () => void
  reset: () => void
}) => {
  useInitializeUser()
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: async (data: CreateAssetCategoryType) => {
      const res = await createAssetCategory(data)
      return res
    },
    onSuccess: (res) => {
      if (res?.error) {
        toast({
          title: 'Error',
          variant: 'destructive',
          description: res.error.message || 'Failed to create asset category',
        })
        return
      }

      toast({
        title: 'Success',
        description: 'Asset category created successfully!',
      })

      queryClient.invalidateQueries({ queryKey: ['assetCategories'] })
      reset()
      onClose()
    },
    onError: (error: any) => {
      console.error('Error adding asset category:', error)
      toast({
        title: 'Error',
        variant: 'destructive',
        description: error?.message || 'Unexpected error occurred',
      })
    },
  })

  return mutation
}

export const useUpdateAssetCategory = ({
  onClose,
  reset,
}: {
  onClose: () => void
  reset: () => void
}) => {
  useInitializeUser()
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: GetAssetCategoryType }) => {
      return editAssetCategory(id, data)
    },
    onSuccess: () => {
      toast({
        title: 'Success!',
        description: 'Asset category edited successfully.',
      })
      queryClient.invalidateQueries({ queryKey: ['assetCategories'] })
      reset()
      onClose()
    },
    onError: (error) => {
      console.error('Error editing asset category:', error)
      toast({
        title: 'Error',
        variant: 'destructive',
        description: 'Failed to edit asset category',
      })
    },
  })

  return mutation
}

export const useDeleteAssetCategory = ({
  onClose,
  reset,
}: {
  onClose: () => void
  reset: () => void
}) => {
  useInitializeUser()
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: async ({ id }: { id: number }) => {
      const res = await deleteAssetCategory(id)
      console.log('DELETE RESPONSE:', res)
      const apiError = res?.error || (res?.data === null && res?.error?.message)
      const successFlag = (res?.error?.details as any)?.success
      if (apiError || successFlag === false) {
        throw new Error('Failed to delete asset category')
      }
      return res
    },
    onSuccess: () => {
      toast({
        title: 'Success!',
        description: 'Asset category deleted successfully.',
      })
      queryClient.invalidateQueries({ queryKey: ['assetCategories'] })
      reset()
      onClose()
    },
    onError: (error: any) => {
      console.error('Delete error:', error)
      toast({
        title: 'Error',
        variant: 'destructive',
        description: 'This data is needed elsewhere',
      })
    },
  })

  return mutation
}

// ==================== ASSETS ====================

export const useGetAllAssets = () => {
  useInitializeUser()
  const userData = useAtomValue(userDataAtom)

  return useQuery({
    queryKey: ['assets'],
    queryFn: () => getAllAssets(),
    enabled: !!userData,
    select: (data) => data,
  })
}

export const useGetLatestAssetTransactions = () => {
  useInitializeUser()
  const userData = useAtomValue(userDataAtom)

  return useQuery({
    queryKey: ['assetTransactions'],
    queryFn: () => getLatestAssetTransactions(),
    enabled: !!userData,
    select: (data) => data,
  })
}

export const useGetAssetById = (id: number) => {
  useInitializeUser()
  const userData = useAtomValue(userDataAtom)

  return useQuery({
    queryKey: ['asset', id],
    queryFn: () => getAssetById(id),
    enabled: !!userData && !!id,
    select: (data) => data,
  })
}

export const useAddAsset = ({
  onClose,
  reset,
}: {
  onClose: () => void
  reset: () => void
}) => {
  useInitializeUser()
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: async (data: CreateAssetType) => {
      const res = await createAsset(data)
      return res
    },
    onSuccess: (res) => {
      if (res?.error) {
        toast({
          title: 'Error',
          variant: 'destructive',
          description: res.error.message || 'Failed to create asset',
        })
        return
      }

      toast({
        title: 'Success',
        description: 'Asset created successfully!',
      })

      queryClient.invalidateQueries({ queryKey: ['assets'] })
      reset()
      onClose()
    },
    onError: (error: any) => {
      console.error('Error adding asset:', error)
      toast({
        title: 'Error',
        variant: 'destructive',
        description: error?.message || 'Unexpected error occurred',
      })
    },
  })

  return mutation
}

export const useUpdateAsset = ({
  onClose,
  reset,
}: {
  onClose: () => void
  reset: () => void
}) => {
  useInitializeUser()
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: GetAssetType }) => {
      return editAsset(id, data)
    },
    onSuccess: () => {
      toast({
        title: 'Success!',
        description: 'Asset edited successfully.',
      })
      queryClient.invalidateQueries({ queryKey: ['assets'] })
      reset()
      onClose()
    },
    onError: (error) => {
      console.error('Error editing asset:', error)
      toast({
        title: 'Error',
        variant: 'destructive',
        description: 'Failed to edit asset',
      })
    },
  })

  return mutation
}

export const useDeleteAsset = ({
  onClose,
  reset,
}: {
  onClose: () => void
  reset: () => void
}) => {
  useInitializeUser()
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: async ({ id }: { id: number }) => {
      const res = await deleteAsset(id)
      console.log('DELETE RESPONSE:', res)
      const apiError = res?.error || (res?.data === null && res?.error?.message)
      const successFlag = (res?.error?.details as any)?.success
      if (apiError || successFlag === false) {
        throw new Error('Failed to delete asset')
      }
      return res
    },
    onSuccess: () => {
      toast({
        title: 'Success!',
        description: 'Asset deleted successfully.',
      })
      queryClient.invalidateQueries({ queryKey: ['assets'] })
      reset()
      onClose()
    },
    onError: (error: any) => {
      console.error('Delete error:', error)
      toast({
        title: 'Error',
        variant: 'destructive',
        description: 'This data is needed elsewhere',
      })
    },
  })

  return mutation
}

export const useAssignAsset = ({
  onClose,
  reset,
}: {
  onClose: () => void
  reset: () => void
}) => {
  useInitializeUser()
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: async (data: CreateAssetTransactionType) => {
      const res = await assignAsset(data)
      return res
    },
    onSuccess: (res) => {
      if (res?.error) {
        toast({
          title: 'Error',
          variant: 'destructive',
          description: res.error.message || 'Failed to assign asset',
        })
        return
      }

      toast({
        title: 'Success',
        description: 'Asset assigned successfully!',
      })

      queryClient.invalidateQueries({ queryKey: ['assets'] })
      queryClient.invalidateQueries({ queryKey: ['assetTransactions'] })
      reset()
      onClose()
    },
    onError: (error: any) => {
      console.error('Error assigning asset:', error)
      toast({
        title: 'Error',
        variant: 'destructive',
        description: error?.message || 'Unexpected error occurred',
      })
    },
  })

  return mutation
}

//employee attendances
export const useGetEmployeeAttendances = () => {
  useInitializeUser()
  const userData = useAtomValue(userDataAtom)

  return useQuery({
    queryKey: ['employeeAttendances'],
    queryFn: () => getAllEmployeeAttendances(),
    enabled: !!userData,
    select: (data) => data,
  })
}

export const useAddEmployeeAttendance = ({
  onClose,
  reset,
}: {
  onClose: () => void
  reset: () => void
  showToast?: (type: 'success' | 'error', message: string) => void
}) => {
  useInitializeUser()
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: async (data: CreateEmployeeAttendanceType) => {
      const res = await createEmployeeAttendance(data)
      return res
    },
    onSuccess: (res) => {
      if (res?.error) {
        toast({
          title: 'Error',
          variant: 'destructive',
          description:
            (res.error?.details as any)?.message ||
            res.error.message ||
            'Failed to add employee attendance.',
        })
        return
      }

      toast({
        title: 'Success',
        description: 'Employee attendance added successfully!',
      })

      queryClient.invalidateQueries({ queryKey: ['employeeAttendances'] })
      reset()
      onClose()
    },
    onError: (error: any) => {
      console.error('Error adding employee attendance:', error)
      toast({
        title: 'Error',
        variant: 'destructive',
        description: error?.message || 'Failed to add employee attendance.',
      })
    },
  })

  return mutation
}

export const useUpdateEmployeeAttendance = ({
  onClose,
  reset,
}: {
  onClose: () => void
  reset: () => void
}) => {
  useInitializeUser()
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: number
      data: GetEmployeeAttendanceType
    }) => {
      return editEmployeeAttendance(id, data)
    },
    onSuccess: () => {
      toast({
        title: 'Success!',
        description: 'employee attendance edited successfully.',
      })
      queryClient.invalidateQueries({ queryKey: ['employeeAttendances'] })

      reset()
      onClose()
    },
    onError: (error) => {
      console.error('Error editing employee attendance:', error)
    },
  })

  return mutation
}

export const useDeleteEmployeeAttendance = ({
  onClose,
  reset,
}: {
  onClose: () => void
  reset: () => void
}) => {
  useInitializeUser()
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: async ({ id }: { id: number }) => {
      const res = await deleteEmployeeAttendance(id)

      console.log('DELETE RESPONSE:', res)

      const apiError = res?.error || (res?.data === null && res?.error?.message)

      const successFlag = (res?.error?.details as any)?.success

      if (apiError || successFlag === false) {
        throw new Error('Failed to delete employee attendance')
      }

      return res
    },

    onSuccess: () => {
      toast({
        title: 'Success!',
        description: 'Employee attendance deleted successfully.',
      })
      queryClient.invalidateQueries({ queryKey: ['employeeAttendances'] })

      reset()
      onClose()
    },

    onError: (error: any) => {
      console.error('Delete error:', error)

      toast({
        title: 'Error',
        variant: 'destructive',
        description: 'This data is needed elsewhere',
      })
    },
  })

  return mutation
}

//salary components
export const useGetSalaryComponents = () => {
  useInitializeUser()
  const userData = useAtomValue(userDataAtom)

  return useQuery({
    queryKey: ['salaryComponents'],
    queryFn: () => getAllSalaryComponents(),
    enabled: !!userData,
    select: (data) => data,
  })
}

export const useAddSalaryComponent = ({
  onClose,
  reset,
}: {
  onClose: () => void
  reset: () => void
}) => {
  useInitializeUser()
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: async (data: CreateSalaryComponentType) => {
      const res = await createSalaryComponent(data)
      return res
    },
    onSuccess: (res) => {
      if (res?.error) {
        toast({
          title: 'Error',
          variant: 'destructive',
          description: res.error.message || 'Failed to create salary component',
        })
        return
      }

      toast({
        title: 'Success',
        description: 'Salary component created successfully!',
      })

      queryClient.invalidateQueries({ queryKey: ['salaryComponents'] })
      reset()
      onClose()
    },
    onError: (error: any) => {
      console.error('Error adding salary component:', error)
      toast({
        title: 'Error',
        variant: 'destructive',
        description: error?.message || 'Unexpected error occurred',
      })
    },
  })

  return mutation
}

export const useUpdateSalaryComponent = ({
  onClose,
  reset,
}: {
  onClose: () => void
  reset: () => void
}) => {
  useInitializeUser()
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: number
      data: CreateSalaryComponentType
    }) => {
      return editSalaryComponent(id, data)
    },
    onSuccess: () => {
      toast({
        title: 'Success!',
        description: 'Salary component edited successfully.',
      })
      queryClient.invalidateQueries({ queryKey: ['salaryComponents'] })

      reset()
      onClose()
    },
    onError: (error) => {
      console.error('Error editing salary component:', error)
    },
  })

  return mutation
}

export const useDeleteSalaryComponent = ({
  onClose,
  reset,
}: {
  onClose: () => void
  reset: () => void
}) => {
  useInitializeUser()
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: async ({ id }: { id: number }) => {
      const res = await deleteSalaryComponent(id)

      console.log('DELETE RESPONSE:', res)

      const apiError = res?.error || (res?.data === null && res?.error?.message)

      const successFlag = (res?.error?.details as any)?.success

      if (apiError || successFlag === false) {
        throw new Error('Failed to delete salary component')
      }

      return res
    },

    onSuccess: () => {
      toast({
        title: 'Success!',
        description: 'Salary component is deleted successfully.',
      })
      queryClient.invalidateQueries({ queryKey: ['salaryComponents'] })

      reset()
      onClose()
    },

    onError: (error: any) => {
      console.error('Delete error:', error)

      toast({
        title: 'Error',
        variant: 'destructive',
        description: 'This data is needed elsewhere',
      })
    },
  })

  return mutation
}

//employee salary components
export const useGetEmployeeSalaryComponents = () => {
  useInitializeUser()
  const userData = useAtomValue(userDataAtom)

  return useQuery({
    queryKey: ['employeeSalaryComponents'],
    queryFn: () => getAllEmployeeSalaryComponents(),
    enabled: !!userData,
    select: (data) => data,
  })
}

export const useAddEmployeeSalaryComponent = ({
  onClose,
  reset,
}: {
  onClose: () => void
  reset: () => void
}) => {
  useInitializeUser()
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: async (data: CreateEmployeeSalaryComponentType) => {
      const res = await createEmployeeSalaryComponent(data)
      return res
    },
    onSuccess: (res) => {
      if (res?.error) {
        toast({
          title: 'Error',
          variant: 'destructive',
          description:
            res.error.message ||
            'Failed to create employee other salary component',
        })
        return
      }

      toast({
        title: 'Success',
        description: 'Employee other salary component created successfully!',
      })

      queryClient.invalidateQueries({
        queryKey: ['employeeSalaryComponents'],
      })
      reset()
      onClose()
    },
    onError: (error: any) => {
      console.error('Error adding employee other salary component:', error)
      toast({
        title: 'Error',
        variant: 'destructive',
        description: error?.message || 'Unexpected error occurred',
      })
    },
  })

  return mutation
}

export const useUpdateEmployeeSalaryComponent = ({
  onClose,
  reset,
}: {
  onClose: () => void
  reset: () => void
}) => {
  useInitializeUser()
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: number
      data: CreateEmployeeSalaryComponentType
    }) => {
      return editEmployeeSalaryComponent(id, data)
    },
    onSuccess: () => {
      toast({
        title: 'Success!',
        description: 'Employee other salary component edited successfully.',
      })
      queryClient.invalidateQueries({
        queryKey: ['employeeSalaryComponents'],
      })

      reset()
      onClose()
    },
    onError: (error) => {
      console.error('Error editing employee other salary component:', error)
    },
  })

  return mutation
}

export const useDeleteEmployeeSalaryComponent = ({
  onClose,
  reset,
}: {
  onClose: () => void
  reset: () => void
}) => {
  useInitializeUser()
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: async ({ id }: { id: number }) => {
      const res = await deleteEmployeeSalaryComponent(id)

      console.log('DELETE RESPONSE:', res)

      const apiError = res?.error || (res?.data === null && res?.error?.message)

      const successFlag = (res?.error?.details as any)?.success

      if (apiError || successFlag === false) {
        throw new Error('Failed to delete employee salary component')
      }

      return res
    },

    onSuccess: () => {
      toast({
        title: 'Success!',
        description: 'Employee salary component is deleted successfully.',
      })
      queryClient.invalidateQueries({ queryKey: ['employeeSalaryComponents'] })

      reset()
      onClose()
    },

    onError: (error: any) => {
      console.error('Delete error:', error)

      toast({
        title: 'Error',
        variant: 'destructive',
        description: 'This data is needed elsewhere',
      })
    },
  })

  return mutation
}

//salary
export const useGenerateSalary = (salaryMonth: string, salaryYear: number) => {
  useInitializeUser()
  const userData = useAtomValue(userDataAtom)

  return useQuery({
    queryKey: ['generateSalary', salaryMonth, salaryYear],
    queryFn: () => generateSalary(salaryMonth, salaryYear),
    enabled: !!userData && salaryMonth.length > 0 && salaryYear > 0,
    select: (data) => data,
  })
}

export const useGetSalaries = () => {
  useInitializeUser()
  const userData = useAtomValue(userDataAtom)

  return useQuery({
    queryKey: ['salaries'],
    queryFn: () => getAllSalaries(),
    enabled: !!userData,
    select: (data) => data,
  })
}

export const useAddSalary = ({
  onClose,
  reset,
}: {
  onClose: () => void
  reset: () => void
}) => {
  useInitializeUser()
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: async (data: CreateSalaryType) => {
      const res = await createSalary(data)
      return res
    },
    onSuccess: (res) => {
      if (res?.error) {
        toast({
          title: 'Error',
          variant: 'destructive',
          description: res.error.message || 'Failed to create salary',
        })
        return
      }

      toast({
        title: 'Success',
        description: 'Salary created successfully!',
      })

      queryClient.invalidateQueries({ queryKey: ['salaries'] })
      reset()
      onClose()
    },
    onError: (error: any) => {
      console.error('Error adding salary:', error)
      toast({
        title: 'Error',
        variant: 'destructive',
        description: error?.message || 'Unexpected error occurred',
      })
    },
  })

  return mutation
}

export const useUpdateSalary = ({
  onClose,
  reset,
}: {
  onClose: () => void
  reset: () => void
}) => {
  useInitializeUser()
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: ({ data }: { data: any }) => {
      return editSalary(data)
    },
    onSuccess: () => {
      toast({
        title: 'Success!',
        description: 'salary edited successfully.',
      })
      queryClient.invalidateQueries({ queryKey: ['salaries'] })

      reset()
      onClose()
    },
    onError: (error) => {
      console.error('Error editing salary:', error)
    },
  })

  return mutation
}

export const useGiveSalary = ({
  onClose,
  reset,
}: {
  onClose: () => void
  reset: () => void
}) => {
  useInitializeUser()
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: ({ id }: { id: number }) => {
      return giveSalary(id)
    },
    onSuccess: () => {
      toast({
        title: 'Success!',
        description: 'salary is given successfully.',
      })
      queryClient.invalidateQueries({ queryKey: ['salaries'] })

      reset()
      onClose()
    },
    onError: (error) => {
      console.error('Error editing salary:', error)
    },
  })

  return mutation
}

export const useMakeSalaryPermanent = ({
  onClose,
  reset,
}: {
  onClose: () => void
  reset: () => void
}) => {
  useInitializeUser()
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: ({ id }: { id: number }) => {
      return makeSalaryPermanent(id)
    },
    onSuccess: () => {
      toast({
        title: 'Success!',
        description: 'salary has made permanent successfully.',
      })
      queryClient.invalidateQueries({ queryKey: ['salaries'] })

      reset()
      onClose()
    },
    onError: (error) => {
      console.error('Error editing salary:', error)
    },
  })

  return mutation
}

//lones
export const useGetLones = () => {
  useInitializeUser()
  const userData = useAtomValue(userDataAtom)

  return useQuery({
    queryKey: ['lones'],
    queryFn: () => getAllLones(),
    enabled: !!userData,
    select: (data) => data,
  })
}

export const useAddLone = ({
  onClose,
  reset,
}: {
  onClose: () => void
  reset: () => void
}) => {
  useInitializeUser()
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: async (data: CreateEmployeeLoneType) => {
      const res = await createLone(data)
      return res
    },
    onSuccess: (res) => {
      if (res?.error) {
        toast({
          title: 'Error',
          variant: 'destructive',
          description: res.error.message || 'Failed to create lone',
        })
        return
      }

      toast({
        title: 'Success',
        description: 'Lone created successfully!',
      })

      queryClient.invalidateQueries({ queryKey: ['lones'] })
      reset()
      onClose()
    },
    onError: (error: any) => {
      console.error('Error adding lone:', error)
      toast({
        title: 'Error',
        variant: 'destructive',
        description: error?.message || 'Unexpected error occurred',
      })
    },
  })

  return mutation
}

export const useSkipLone = ({
  onClose,
  reset,
  onSuccess,
}: {
  onClose: () => void
  reset: () => void
  onSuccess?: () => void
}) => {
  useInitializeUser()
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: async ({
      employeeLoneInstallmentId,
      updatedBy,
    }: {
      employeeLoneInstallmentId: number
      updatedBy: number
    }) => {
      const res = await skipLone(employeeLoneInstallmentId, updatedBy)
      return res
    },
    onSuccess: (res) => {
      if (res?.error) {
        toast({
          title: 'Error',
          variant: 'destructive',
          description: res.error.message || 'Failed to skip lone installment',
        })
        return
      }

      toast({
        title: 'Success',
        description:
          res.data?.message || 'Lone installment skipped successfully!',
      })

      queryClient.invalidateQueries({ queryKey: ['lones'] })
      queryClient.invalidateQueries({
        queryKey: ['employeeSalaryComponents'],
      })

      const employeeLoneId = res.data?.employeeLoneId
      if (employeeLoneId) {
        queryClient.invalidateQueries({
          queryKey: ['lone', employeeLoneId],
        })
      }

      reset()
      onClose()
      if (onSuccess) onSuccess()
    },
    onError: (error: any) => {
      console.error('Error skipping lone:', error)
      toast({
        title: 'Error',
        variant: 'destructive',
        description: error?.message || 'Unexpected error occurred',
      })
    },
  })

  return mutation
}

export const useUpdateLone = ({
  onClose,
  reset,
}: {
  onClose: () => void
  reset: () => void
}) => {
  useInitializeUser()
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: GetEmployeeLoneType }) => {
      return editLone(id, data)
    },
    onSuccess: () => {
      toast({
        title: 'Success!',
        description: 'lone edited successfully.',
      })
      queryClient.invalidateQueries({ queryKey: ['lones'] })

      reset()
      onClose()
    },
    onError: (error) => {
      console.error('Error editing lone:', error)
    },
  })

  return mutation
}

export const useMakeEmployeeLoneFullPaid = ({
  onClose,
  reset,
}: {
  onClose: () => void
  reset: () => void
}) => {
  useInitializeUser()
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: ({ id }: { id: number }) => {
      return makeEmployeeLoneFullPaid(id)
    },
    onSuccess: () => {
      toast({
        title: 'Success!',
        description: 'lone is fully paid successfully.',
      })
      queryClient.invalidateQueries({ queryKey: ['lones'] })

      reset()
      onClose()
    },
    onError: (error) => {
      console.error('Error editing lone:', error)
    },
  })

  return mutation
}

export const useDeleteLone = ({
  onClose,
  reset,
}: {
  onClose: () => void
  reset: () => void
}) => {
  useInitializeUser()
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: async ({ id }: { id: number }) => {
      const res = await deleteLone(id)

      console.log('DELETE RESPONSE:', res)

      const apiError = res?.error || (res?.data === null && res?.error?.message)

      const successFlag = (res?.error?.details as any)?.success

      if (apiError || successFlag === false) {
        throw new Error('Failed to delete lone')
      }

      return res
    },

    onSuccess: () => {
      toast({
        title: 'Success!',
        description: 'Lone is deleted successfully.',
      })
      queryClient.invalidateQueries({ queryKey: ['lones'] })

      reset()
      onClose()
    },

    onError: (error: any) => {
      console.error('Delete error:', error)

      toast({
        title: 'Error',
        variant: 'destructive',
        description: 'This data is needed elsewhere',
      })
    },
  })

  return mutation
}

//employee leaves
export const useGetEmployeeLeaves = () => {
  useInitializeUser()
  const userData = useAtomValue(userDataAtom)

  return useQuery({
    queryKey: ['employeeLeaves'],
    queryFn: () => getAllEmployeeLeaves(),
    enabled: !!userData,
    select: (data) => data,
  })
}

export const useGetEmployeeLeaveTypes = () => {
  useInitializeUser()
  const userData = useAtomValue(userDataAtom)

  return useQuery({
    queryKey: ['employeeLeaveTypes'],
    queryFn: () => getAllEmployeeLeaveTypes(),
    enabled: !!userData,
    select: (data) => data,
  })
}

export const useAddEmployeeLeave = ({
  onClose,
  reset,
}: {
  onClose: () => void
  reset: () => void
}) => {
  useInitializeUser()
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: async (data: CreateEmployeeLeaveType) => {
      const res = await createEmployeeLeave(data)
      return res
    },
    onSuccess: (res) => {
      if (res?.error) {
        toast({
          title: 'Error',
          variant: 'destructive',
          description: res.error.message || 'Failed to create employee leave',
        })
        return
      }

      toast({
        title: 'Success',
        description: 'Employee leave created successfully!',
      })

      queryClient.invalidateQueries({ queryKey: ['employeeLeaves'] })
      reset()
      onClose()
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        variant: 'destructive',
        description: error?.message || 'Unexpected error occurred',
      })
    },
  })

  return mutation
}

export const useUpdateEmployeeLeave = ({
  onClose,
  reset,
}: {
  onClose: () => void
  reset: () => void
}) => {
  useInitializeUser()
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: GetEmployeeLeaveType }) => {
      return editEmployeeLeave(id, data)
    },
    onSuccess: () => {
      toast({
        title: 'Success!',
        description: 'Employee leave edited successfully.',
      })
      queryClient.invalidateQueries({ queryKey: ['employeeLeaves'] })

      reset()
      onClose()
    },
    onError: (error) => {
      console.error('Error editing employee leave:', error)
    },
  })

  return mutation
}

export const useDeleteEmployeeLeave = ({
  onClose,
  reset,
}: {
  onClose: () => void
  reset: () => void
}) => {
  useInitializeUser()
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: async ({ id }: { id: number }) => {
      const res = await deleteEmployeeLeave(id)

      console.log('DELETE RESPONSE:', res)

      const apiError = res?.error || (res?.data === null && res?.error?.message)

      const successFlag = (res?.error?.details as any)?.success

      if (apiError || successFlag === false) {
        throw new Error('Failed to delete employee leave')
      }

      return res
    },

    onSuccess: () => {
      toast({
        title: 'Success!',
        description: 'Employee leave is deleted successfully.',
      })
      queryClient.invalidateQueries({ queryKey: ['employeeLeaves'] })

      reset()
      onClose()
    },

    onError: (error: any) => {
      console.error('Delete error:', error)

      toast({
        title: 'Error',
        variant: 'destructive',
        description: 'This data is needed elsewhere',
      })
    },
  })

  return mutation
}

//reports
export const useGetEmployeeActivityReport = (employeeId: number) => {
  useInitializeUser()
  const userData = useAtomValue(userDataAtom)

  return useQuery({
    queryKey: ['activityReport', employeeId],
    queryFn: () => getEmployeeActivityReport(employeeId),
    enabled: !!userData && !!employeeId,
    select: (data) => data,
  })
}

export const useGetShiftReport = (date: string) => {
  useInitializeUser()
  const userData = useAtomValue(userDataAtom)

  return useQuery({
    queryKey: ['shiftReport', date],
    queryFn: () => getShiftReport(date),
    enabled: !!userData && !!date,
    select: (data) => data,
  })
}

export const useGetSalaryReport = (salaryMonth: string, salaryYear: number) => {
  useInitializeUser()
  const userData = useAtomValue(userDataAtom)

  return useQuery({
    queryKey: ['salaryReport', salaryMonth, salaryYear],
    queryFn: () => getSalaryReport(salaryMonth, salaryYear),
    enabled: !!userData && salaryMonth.length > 0 && salaryYear > 0,
    select: (data) => data,
  })
}

export const useGetAttendanceReport = (fromDate: string, toDate: string) => {
  useInitializeUser()
  const userData = useAtomValue(userDataAtom)

  return useQuery({
    queryKey: ['attendanceReport', fromDate, toDate],
    queryFn: () => getAttendanceReport(fromDate, toDate),
    enabled: !!userData && fromDate.length > 0 && toDate.length > 0,
    select: (data) => data,
  })
}

export const useGetIndividualAttendanceSummaryReport = (
  fromDate: string,
  toDate: string
) => {
  useInitializeUser()
  const userData = useAtomValue(userDataAtom)

  return useQuery({
    queryKey: ['individualAttendanceSummaryReport', fromDate, toDate],
    queryFn: () => getIndividualAttendanceSummaryReport(fromDate, toDate),
    enabled: !!userData && fromDate.length > 0 && toDate.length > 0,
    select: (data) => data,
  })
}

export const useGetLeaveBalanceSummaryReport = () => {
  useInitializeUser()
  const userData = useAtomValue(userDataAtom)

  return useQuery({
    queryKey: ['leaveBalanceSummaryReport'],
    queryFn: () => getLeaveBalanceSummaryReport(),
    enabled: !!userData,
    select: (data) => data,
  })
}

export const useGetEmployeeLeaveLedgerReport = () => {
  useInitializeUser()
  const userData = useAtomValue(userDataAtom)

  return useQuery({
    queryKey: ['employeeLeaveLedgerReport'],
    queryFn: () => getEmployeeLeaveLedgerReport(),
    enabled: !!userData,
    select: (data) => data,
  })
}

//dashboard
export const useGetEmployeeLeaveSummary = () => {
  useInitializeUser()
  const userData = useAtomValue(userDataAtom)

  return useQuery({
    queryKey: ['employeeLeaveSummary'],
    queryFn: () => getEmployeeLeaveSummary(),
    enabled: !!userData,
    select: (data) => data,
  })
}

export const useGetEmployeeAttendanceSummary = () => {
  useInitializeUser()
  const userData = useAtomValue(userDataAtom)

  return useQuery({
    queryKey: ['employeeAttendanceSummary'],
    queryFn: () => getEmployeeAttendanceSummary(),
    enabled: !!userData,
    select: (data) => data,
  })
}

export const useGetEmployeeLoneSummary = () => {
  useInitializeUser()
  const userData = useAtomValue(userDataAtom)

  return useQuery({
    queryKey: ['employeeLoneSummary'],
    queryFn: () => getEmployeeLoneSummary(),
    enabled: !!userData,
    select: (data) => data,
  })
}

export const useGetEmployeeSalaryStatus = () => {
  useInitializeUser()
  const userData = useAtomValue(userDataAtom)

  return useQuery({
    queryKey: ['employeeSalaryStatus'],
    queryFn: () => getEmployeeSalaryStatus(),
    enabled: !!userData,
    select: (data) => data,
  })
}

// attendance policy
export const useGetAttendancePolicies = () => {
  useInitializeUser()
  const userData = useAtomValue(userDataAtom)

  return useQuery({
    queryKey: ['attendancePolicies'],
    queryFn: () => getAllAttendancePolicies(),
    enabled: !!userData,
    select: (data) => data,
  })
}

export const useGetAttendancePolicyById = (id: number) => {
  useInitializeUser()
  const userData = useAtomValue(userDataAtom)

  return useQuery({
    queryKey: ['attendancePolicy', id],
    queryFn: () => getAttendancePolicyById(id),
    enabled: !!userData && id > 0,
    select: (data) => data,
  })
}

export const useAddAttendancePolicy = ({
  onClose,
  reset,
}: {
  onClose: () => void
  reset: () => void
}) => {
  useInitializeUser()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: CreateAttendancePolicyType) => {
      const res = await createAttendancePolicy(data)
      return res
    },
    onSuccess: (res) => {
      if (res?.error) {
        toast({
          title: 'Error',
          variant: 'destructive',
          description:
            res.error.message || 'Failed to create attendance policy',
        })
        return
      }
      toast({
        title: 'Success',
        description: 'Attendance policy created successfully!',
      })
      queryClient.invalidateQueries({ queryKey: ['attendancePolicies'] })
      reset()
      onClose()
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        variant: 'destructive',
        description: error?.message || 'Unexpected error occurred',
      })
    },
  })
}

export const useUpdateAttendancePolicy = ({
  onClose,
  reset,
}: {
  onClose: () => void
  reset: () => void
}) => {
  useInitializeUser()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: number
      data: GetAttendancePolicyType
    }) => {
      return editAttendancePolicy(id, data)
    },
    onSuccess: () => {
      toast({
        title: 'Success!',
        description: 'Attendance policy updated successfully.',
      })
      queryClient.invalidateQueries({ queryKey: ['attendancePolicies'] })
      reset()
      onClose()
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        variant: 'destructive',
        description: error?.message || 'Failed to update attendance policy',
      })
    },
  })
}

export const useDeleteAttendancePolicy = ({
  onClose,
  reset,
}: {
  onClose: () => void
  reset: () => void
}) => {
  useInitializeUser()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id }: { id: number }) => {
      const res = await deleteAttendancePolicy(id)

      const apiError = res?.error || (res?.data === null && res?.error?.message)
      const successFlag = (res?.error?.details as any)?.success

      if (apiError || successFlag === false) {
        throw new Error('Failed to delete attendance policy')
      }
      return res
    },
    onSuccess: () => {
      toast({
        title: 'Success!',
        description: 'Attendance policy deleted successfully.',
      })
      queryClient.invalidateQueries({ queryKey: ['attendancePolicies'] })
      reset()
      onClose()
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        variant: 'destructive',
        description: 'This data is needed elsewhere',
      })
    },
  })
}

// shift allocations
export const useGetShiftAllocations = () => {
  useInitializeUser()
  const userData = useAtomValue(userDataAtom)

  return useQuery({
    queryKey: ['shiftAllocations'],
    queryFn: () => getAllShiftAllocations(),
    enabled: !!userData,
    select: (data) => data,
  })
}

export const useAddShiftAllocation = ({
  onClose,
  reset,
}: {
  onClose: () => void
  reset: () => void
}) => {
  useInitializeUser()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: CreateShiftAllocationType[]) => {
      const res = await createShiftAllocation(data)
      return res
    },
    onSuccess: (res) => {
      if (res?.error) {
        toast({
          title: 'Error',
          variant: 'destructive',
          description: res.error.message || 'Failed to create shift allocation',
        })
        return
      }
      toast({
        title: 'Success',
        description: 'Shift allocation created successfully!',
      })
      queryClient.invalidateQueries({ queryKey: ['shiftAllocations'] })
      reset()
      onClose()
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        variant: 'destructive',
        description: error?.message || 'Unexpected error occurred',
      })
    },
  })
}

export const useAddBulkShiftAllocation = ({
  onClose,
  reset,
}: {
  onClose: () => void
  reset: () => void
}) => {
  useInitializeUser()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: CreateBulkShiftAllocationType) => {
      const res = await createBulkShiftAllocation(data)
      return res
    },
    onSuccess: (res) => {
      if (res?.error) {
        toast({
          title: 'Error',
          variant: 'destructive',
          description: res.error.message || 'Failed to bulk allocate shifts',
        })
        return
      }
      toast({
        title: 'Success',
        description: res?.data
          ? `${(res.data as any).totalAllocated} employees allocated successfully!`
          : 'Bulk shift allocation successful!',
      })
      queryClient.invalidateQueries({ queryKey: ['shiftAllocations'] })
      reset()
      onClose()
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        variant: 'destructive',
        description: error?.message || 'Unexpected error occurred',
      })
    },
  })
}

export const useUpdateShiftAllocation = ({
  onClose,
  reset,
}: {
  onClose: () => void
  reset: () => void
}) => {
  useInitializeUser()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: number
      data: Partial<CreateShiftAllocationType>
    }) => {
      return editShiftAllocation(id, data)
    },
    onSuccess: () => {
      toast({
        title: 'Success!',
        description: 'Shift allocation updated successfully.',
      })
      queryClient.invalidateQueries({ queryKey: ['shiftAllocations'] })
      reset()
      onClose()
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        variant: 'destructive',
        description: error?.message || 'Failed to update shift allocation',
      })
    },
  })
}

export const useDeleteShiftAllocation = ({
  onClose,
  reset,
}: {
  onClose: () => void
  reset: () => void
}) => {
  useInitializeUser()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id }: { id: number }) => {
      const res = await deleteShiftAllocation(id)

      const apiError = res?.error || (res?.data === null && res?.error?.message)
      const successFlag = (res?.error?.details as any)?.success

      if (apiError || successFlag === false) {
        throw new Error('Failed to delete shift allocation')
      }
      return res
    },
    onSuccess: () => {
      toast({
        title: 'Success!',
        description: 'Shift allocation deleted successfully.',
      })
      queryClient.invalidateQueries({ queryKey: ['shiftAllocations'] })
      reset()
      onClose()
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        variant: 'destructive',
        description: 'This data is needed elsewhere',
      })
    },
  })
}

export const useUpdateShiftAllocationRecurrence = ({
  onClose,
  reset,
}: {
  onClose: () => void
  reset: () => void
}) => {
  useInitializeUser()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateRecurrenceType }) =>
      updateShiftAllocationRecurrence(id, data),
    onSuccess: (res) => {
      if (res?.error) {
        toast({
          title: 'Error',
          variant: 'destructive',
          description: res.error.message,
        })
        return
      }
      toast({ title: 'Success', description: 'Recurrence setting updated!' })
      queryClient.invalidateQueries({ queryKey: ['shiftAllocations'] })
      reset()
      onClose()
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        variant: 'destructive',
        description: error?.message,
      })
    },
  })
}

export const useCopyShiftAllocation = () => {
  useInitializeUser()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, createdBy }: { id: number; createdBy: number }) =>
      copyShiftAllocationById(id, createdBy),
    onSuccess: (res) => {
      if (res?.error) {
        toast({
          title: 'Error',
          variant: 'destructive',
          description: res.error.message,
        })
        return
      }
      toast({
        title: 'Success',
        description: res?.data?.message || 'Copied successfully!',
      })
      queryClient.invalidateQueries({ queryKey: ['shiftAllocations'] })
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        variant: 'destructive',
        description: error?.message,
      })
    },
  })
}

export const useCopyAllActiveAllocations = () => {
  useInitializeUser()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      recurrenceType,
      createdBy,
    }: {
      recurrenceType: 'weekly' | 'monthly'
      createdBy: number
    }) => copyAllActiveShiftAllocations(recurrenceType, createdBy),
    onSuccess: (res) => {
      if (res?.error) {
        toast({
          title: 'Error',
          variant: 'destructive',
          description: res.error.message,
        })
        return
      }
      toast({
        title: 'Success',
        description: res?.data?.message || 'All copied successfully!',
      })
      queryClient.invalidateQueries({ queryKey: ['shiftAllocations'] })
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        variant: 'destructive',
        description: error?.message,
      })
    },
  })
}

export const useGetEmployeeWeekDays = (userId: number) => {
  useInitializeUser()
  const userData = useAtomValue(userDataAtom)

  return useQuery({
    queryKey: ['empWeekDays', userId],
    queryFn: () => GetEmployeeWeekDays(userId),
    enabled: !!userData && userId > 0,
    select: (data) => data,
  })
}

// hooks/use-api.ts
export const useGetDailyAttendanceReport = (date: string) => {
  useInitializeUser()
  const userData = useAtomValue(userDataAtom)

  return useQuery({
    queryKey: ['dailyAttendanceReport', date],
    queryFn: () => getDailyAttendanceReport(date),
    enabled: !!userData && date.length > 0,
  })
}

export const useGetAttendanceSummaryReport = (
  fromDate: string,
  toDate: string
) => {
  useInitializeUser()
  const userData = useAtomValue(userDataAtom)

  return useQuery({
    queryKey: ['attendanceSummaryReport', fromDate, toDate],
    queryFn: () => getAttendanceSummaryReport(fromDate, toDate),
    enabled: !!userData && fromDate.length > 0 && toDate.length > 0,
  })
}

// ── Holiday Calendars ──
export const useGetHolidayCalendars = () => {
  useInitializeUser()
  const userData = useAtomValue(userDataAtom)

  return useQuery({
    queryKey: ['holidayCalendars'],
    queryFn: () => getAllHolidayCalendars(),
    enabled: !!userData,
  })
}

export const useAddHolidayCalendar = ({
  onClose,
  reset,
}: {
  onClose: () => void
  reset: () => void
}) => {
  useInitializeUser()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: CreateHolidayCalendarType) =>
      createHolidayCalendar(data),
    onSuccess: (res) => {
      if (res?.error) {
        toast({
          title: 'Error',
          variant: 'destructive',
          description: res.error.message,
        })
        return
      }
      toast({ title: 'Success', description: 'Holiday calendar created!' })
      queryClient.invalidateQueries({ queryKey: ['holidayCalendars'] })
      reset()
      onClose()
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        variant: 'destructive',
        description: error?.message,
      })
    },
  })
}

export const useUpdateHolidayCalendar = ({
  onClose,
  reset,
}: {
  onClose: () => void
  reset: () => void
}) => {
  useInitializeUser()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: number
      data: Partial<CreateHolidayCalendarType>
    }) => editHolidayCalendar(id, data),
    onSuccess: () => {
      toast({ title: 'Success!', description: 'Holiday calendar updated.' })
      queryClient.invalidateQueries({ queryKey: ['holidayCalendars'] })
      reset()
      onClose()
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        variant: 'destructive',
        description: error?.message,
      })
    },
  })
}

export const useDeleteHolidayCalendar = ({
  onClose,
  reset,
}: {
  onClose: () => void
  reset: () => void
}) => {
  useInitializeUser()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id }: { id: number }) => {
      const res = await deleteHolidayCalendar(id)
      const apiError = res?.error || (res?.data === null && res?.error?.message)
      const successFlag = (res?.error?.details as any)?.success
      if (apiError || successFlag === false) throw new Error('Failed to delete')
      return res
    },
    onSuccess: () => {
      toast({ title: 'Success!', description: 'Holiday calendar deleted.' })
      queryClient.invalidateQueries({ queryKey: ['holidayCalendars'] })
      reset()
      onClose()
    },
    onError: () => {
      toast({
        title: 'Error',
        variant: 'destructive',
        description: 'This data is needed elsewhere',
      })
    },
  })
}

// ── New Holidays ──
export const useGetNewHolidays = (calendarId: number) => {
  useInitializeUser()
  const userData = useAtomValue(userDataAtom)

  return useQuery({
    queryKey: ['newHolidays', calendarId],
    queryFn: () => getAllNewHolidays(),
    enabled: !!userData,
  })
}

export const useAddNewHolidayRange = ({
  onClose,
  reset,
}: {
  onClose: () => void
  reset: () => void
}) => {
  useInitializeUser()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: CreateNewHolidayType) => createNewHolidayRange(data),
    onSuccess: (res) => {
      if (res?.error) {
        toast({
          title: 'Error',
          variant: 'destructive',
          description: res.error.message,
        })
        return
      }
      toast({
        title: 'Success',
        description: (res?.data as any)?.message || 'Holiday(s) created!',
      })
      queryClient.invalidateQueries({ queryKey: ['newHolidays'] })
      reset()
      onClose()
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        variant: 'destructive',
        description: error?.message,
      })
    },
  })
}

export const useUpdateNewHoliday = ({
  onClose,
  reset,
}: {
  onClose: () => void
  reset: () => void
}) => {
  useInitializeUser()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: number
      data: Partial<CreateNewHolidayType>
    }) => editNewHoliday(id, data),
    onSuccess: () => {
      toast({ title: 'Success!', description: 'Holiday updated.' })
      queryClient.invalidateQueries({ queryKey: ['newHolidays'] })
      reset()
      onClose()
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        variant: 'destructive',
        description: error?.message,
      })
    },
  })
}

export const useDeleteNewHoliday = ({
  onClose,
  reset,
}: {
  onClose: () => void
  reset: () => void
}) => {
  useInitializeUser()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id }: { id: number }) => {
      const res = await deleteNewHoliday(id)
      const apiError = res?.error || (res?.data === null && res?.error?.message)
      const successFlag = (res?.error?.details as any)?.success
      if (apiError || successFlag === false) throw new Error('Failed to delete')
      return res
    },
    onSuccess: () => {
      toast({ title: 'Success!', description: 'Holiday deleted.' })
      queryClient.invalidateQueries({ queryKey: ['newHolidays'] })
      reset()
      onClose()
    },
    onError: () => {
      toast({
        title: 'Error',
        variant: 'destructive',
        description: 'This data is needed elsewhere',
      })
    },
  })
}

// attendance processing
export const useProcessAttendanceDate = () => {
  useInitializeUser()

  return useMutation({
    mutationFn: (data: ProcessAttendanceDateType) =>
      processAttendanceDate(data),
    onSuccess: (res) => {
      if (res?.error) {
        toast({
          title: 'Error',
          variant: 'destructive',
          description: res.error.message,
        })
        return
      }
      toast({
        title: 'Success',
        description: `${res?.data?.processed} employees processed!`,
      })
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        variant: 'destructive',
        description: error?.message,
      })
    },
  })
}

export const useProcessAttendanceRange = () => {
  useInitializeUser()

  return useMutation({
    mutationFn: (data: ProcessAttendanceRangeType) =>
      processAttendanceRange(data),
    onSuccess: (res) => {
      if (res?.error) {
        toast({
          title: 'Error',
          variant: 'destructive',
          description: res.error.message,
        })
        return
      }
      toast({
        title: 'Success',
        description: `${res?.data?.results?.length} days processed!`,
      })
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        variant: 'destructive',
        description: error?.message,
      })
    },
  })
}

export const useGetAttendanceAuditLogs = (params: {
  employeeId?: number
  fromDate?: string
  toDate?: string
  action?: 'INSERT' | 'UPDATE'
  page?: number
  limit?: number
}) => {
  useInitializeUser()
  const userData = useAtomValue(userDataAtom)

  return useQuery({
    queryKey: ['attendanceAuditLogs', params],
    queryFn: () => getAttendanceAuditLogs(params),
    enabled: !!userData,
  })
}

// ── Attendance Daily (manual entry) ──
export const useGetAllAttendanceDaily = () => {
  useInitializeUser()
  const userData = useAtomValue(userDataAtom)

  return useQuery({
    queryKey: ['attendanceDaily'],
    queryFn: () => getAllAttendanceDaily(),
    enabled: !!userData,
    select: (data) => data,
  })
}

export const useGetAllAttendanceDailyWithParams = (
  employeeId?: number,
  fromDate?: string,
  toDate?: string
) => {
  useInitializeUser()
  const userData = useAtomValue(userDataAtom)

  return useQuery({
    queryKey: ['attendanceDaily', { employeeId, fromDate, toDate }],
    queryFn: () =>
      getAllAttendanceDailyWithParams(employeeId, fromDate, toDate),
    enabled: !!userData,
    select: (data) => data,
  })
}

export const useUploadAttendance = ({
  onClose,
  reset,
}: {
  onClose: () => void
  reset: () => void
}) => {
  useInitializeUser()
  const queryClient = useQueryClient()

  const mutation = useMutation<any, any, FormData>({
    mutationFn: async (data: FormData) => {
      const res = await uploadAttendance(data)
      return res
    },
    onSuccess: (result: any) => {
      toast({
        title: result.failed > 0 ? 'Import Finished with Errors' : 'Success',
        description: `Import complete. ${result.inserted} inserted, ${result.failed} failed.`,
        variant: result.failed > 0 ? 'destructive' : undefined,
      })

      queryClient.invalidateQueries({ queryKey: ['employeeAttendances'] })
      reset()
      onClose()
    },
    onError: (error: any) => {
      console.error('Error uploading attendance CSV:', error)
      toast({
        title: 'Error',
        variant: 'destructive',
        description: error?.message || 'Failed to import attendance punches.',
      })
    },
  })

  return mutation
}

export const useAddAttendanceDaily = ({
  onClose,
  reset,
}: {
  onClose: () => void
  reset: () => void
}) => {
  useInitializeUser()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: CreateAttendanceDailyType) =>
      createAttendanceDaily(data),
    onSuccess: (res) => {
      if (res?.error) {
        toast({
          title: 'Error',
          variant: 'destructive',
          description:
            res.error.message || 'Failed to create attendance record',
        })
        return
      }
      toast({
        title: 'Success',
        description: 'Attendance record created successfully!',
      })
      queryClient.invalidateQueries({ queryKey: ['attendanceDaily'] })
      reset()
      onClose()
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        variant: 'destructive',
        description: error?.message || 'Unexpected error occurred',
      })
    },
  })
}

export const useUpdateAttendanceDaily = ({
  onClose,
  reset,
}: {
  onClose: () => void
  reset: () => void
}) => {
  useInitializeUser()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: number
      data: UpdateAttendanceDailyType
    }) => editAttendanceDaily(id, data),
    onSuccess: (res) => {
      if (res?.error) {
        toast({
          title: 'Error',
          variant: 'destructive',
          description:
            res.error.message || 'Failed to update attendance record',
        })
        return
      }
      toast({
        title: 'Success!',
        description: 'Attendance record updated successfully.',
      })
      queryClient.invalidateQueries({ queryKey: ['attendanceDaily'] })
      reset()
      onClose()
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        variant: 'destructive',
        description: error?.message || 'Failed to update attendance record',
      })
    },
  })
}

export const useDeleteAttendanceDaily = ({
  onClose,
  reset,
}: {
  onClose: () => void
  reset: () => void
}) => {
  useInitializeUser()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id }: { id: number }) => {
      const res = await deleteAttendanceDaily(id)
      const apiError = res?.error || (res?.data === null && res?.error?.message)
      const successFlag = (res?.error?.details as any)?.success
      if (apiError || successFlag === false) {
        throw new Error('Failed to delete attendance record')
      }
      return res
    },
    onSuccess: () => {
      toast({
        title: 'Success!',
        description: 'Attendance record deleted successfully.',
      })
      queryClient.invalidateQueries({ queryKey: ['attendanceDaily'] })
      reset()
      onClose()
    },
    onError: () => {
      toast({
        title: 'Error',
        variant: 'destructive',
        description: 'This data is needed elsewhere',
      })
    },
  })
}

export const useGetAllAttendanceDailyByUserId = (userId: number) => {
  useInitializeUser()
  const userData = useAtomValue(userDataAtom)

  return useQuery({
    queryKey: ['attendanceDaily', { userId }],
    queryFn: () => getAttendanceDailyByUserId(userId),
    enabled: !!userData,
    select: (data) => data,
  })
}

export const useGetAllAttendanceDailyApplyByUserId = (userId: number) => {
  useInitializeUser()
  const userData = useAtomValue(userDataAtom)

  return useQuery({
    queryKey: ['attendanceDailyApply', { userId }],
    queryFn: () => getAttendanceDailyApplyByUserId(userId),
    enabled: !!userData,
    select: (data) => data,
  })
}

export const useGetAllAttendanceDailyApply = () => {
  useInitializeUser()
  const userData = useAtomValue(userDataAtom)

  return useQuery({
    queryKey: ['attendanceDailyApply'],
    queryFn: () => getAllAttendanceApply(),
    enabled: !!userData,
    select: (data) => data,
  })
}

export const useAddManualAttendanceDailyApply = () => {
  useInitializeUser()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: number
      data: CreateAttendanceDailyApplyType
    }) => {
      return addManualAttendanceDailyApply(id, data)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['attendanceDaily'],
      })
      queryClient.invalidateQueries({
        queryKey: ['attendanceDailyApply'],
      })
    },
  })
}

export const useEditManualAttendanceDailyApply = () => {
  useInitializeUser()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: number
      data: GetAttendanceDailyApplyType
    }) => {
      return editManualAttendanceDailyApply(id, data)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['attendanceDailyApply'],
      })
    },
  })
}

export const useApproveManualAttendanceByRepAuth = () => {
  useInitializeUser()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, updatedBy }: { id: number; updatedBy: number }) => {
      return approveManualAttendanceByRepAuth(id, updatedBy)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['attendanceDailyApply'],
      })
      queryClient.invalidateQueries({
        queryKey: ['attendanceDaily'],
      })
    },
  })
}

export const useApproveManualAttendanceByHr = () => {
  useInitializeUser()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, updatedBy }: { id: number; updatedBy: number }) => {
      return approveManualAttendanceByHr(id, updatedBy)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['attendanceDailyApply'],
      })
      queryClient.invalidateQueries({
        queryKey: ['attendanceDaily'],
      })
    },
  })
}

export const useRejectManualAttendance = () => {
  useInitializeUser()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, updatedBy }: { id: number; updatedBy: number }) => {
      return rejectManualAttendance(id, updatedBy)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['attendanceDailyApply'],
      })
      queryClient.invalidateQueries({
        queryKey: ['attendanceDaily'],
      })
    },
  })
}

//notice
export const useGetNotice = () => {
  useInitializeUser()
  const userData = useAtomValue(userDataAtom)

  return useQuery({
    queryKey: ['notice'],
    queryFn: () => getAllNotice(),
    enabled: !!userData,
    select: (data) => data,
  })
}

export const useAddNotice = ({
  onClose,
  reset,
}: {
  onClose: () => void
  reset: () => void
}) => {
  useInitializeUser()
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: async (formData: FormData) => {
      console.log('🚀 ~ useAddNotice ~ formData:', formData)
      const res = await createNotice(formData)
      return res
    },
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Notice created successfully!',
      })
      queryClient.invalidateQueries({ queryKey: ['notice'] })
      reset()
      onClose()
    },
    onError: (error: any) => {
      console.error('Error adding Notice:', error)
      toast({
        title: 'Error',
        variant: 'destructive',
        description: error?.message || 'Unexpected error occurred',
      })
    },
  })

  return mutation
}

export const useUpdateNotice = ({
  onClose,
  reset,
}: {
  onClose: () => void
  reset: () => void
}) => {
  useInitializeUser()
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: ({ id, formData }: { id: number; formData: FormData }) => {
      return editNotice(id, formData)
    },
    onSuccess: () => {
      toast({
        title: 'Success!',
        description: 'Notice updated successfully.',
      })
      queryClient.invalidateQueries({ queryKey: ['notice'] })
      reset()
      onClose()
    },
    onError: (error: any) => {
      console.error('Error editing Notice:', error)
      toast({
        title: 'Error',
        variant: 'destructive',
        description: error?.message || 'Unexpected error occurred',
      })
    },
  })

  return mutation
}

export const useDeleteNotice = ({
  onClose,
  reset,
}: {
  onClose: () => void
  reset: () => void
}) => {
  useInitializeUser()
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: async ({ id }: { id: number }) => {
      const res = await deleteNotice(id)

      console.log('DELETE RESPONSE:', res)

      const apiError = res?.error || (res?.data === null && res?.error?.message)

      const successFlag = (res?.error?.details as any)?.success

      if (apiError || successFlag === false) {
        throw new Error('Failed to delete Notice')
      }

      return res
    },

    onSuccess: () => {
      toast({
        title: 'Success!',
        description: 'Notice is deleted successfully.',
      })
      queryClient.invalidateQueries({ queryKey: ['notice'] })

      reset()
      onClose()
    },

    onError: (error: any) => {
      console.error('Delete error:', error)

      toast({
        title: 'Error',
        variant: 'destructive',
        description: 'This data is needed elsewhere',
      })
    },
  })

  return mutation
}
