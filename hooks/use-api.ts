import { tokenAtom, useInitializeUser } from '@/utils/user'
import { useAtom } from 'jotai'
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
  createEmployeeOtherSalaryComponent,
  createEmploymentType,
  createHoliday,
  createLeaveType,
  createLone,
  createOfficeTimingWeekend,
  createOtherSalaryComponent,
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
  deleteEmployeeOtherSalaryComponent,
  deleteEmploymentType,
  deleteHoliday,
  deleteLeaveType,
  deleteLone,
  deleteOfficeTimingWeekend,
  deleteOtherSalaryComponent,
  deleteSalary,
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
  editEmployeeOtherSalaryComponent,
  editEmploymentType,
  editHoliday,
  editLeaveType,
  editLone,
  editOfficeTimingWeekend,
  editOtherSalaryComponent,
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
  getAllEmployeeOtherSalaryComponents,
  getAllEmployees,
  getAllEmploymentTypes,
  getAllHolidays,
  getAllLeaveTypes,
  getAllLones,
  getAllOfficeTimingWeekends,
  getAllOtherSalaryComponents,
  getAllRoles,
  getAllSalaries,
  getAllTenants,
  getAllWeekends,
  getAllWorkStations,
  getAttendanceReport,
  getEmployeeAttendanceSummary,
  getEmployeeById,
  getEmployeeLeaveSummary,
  getLoneReport,
  getSalaryReport,
  skipLone,
} from '@/utils/api'
import {
  AssignLeaveTypeType,
  CreateDepartmentType,
  CreateDesignationType,
  CreateEmployeeAttendanceType,
  CreateEmployeeLeaveType,
  CreateEmployeeOtherSalaryComponentType,
  CreateEmploymentTypeType,
  CreateHolidayType,
  CreateLeaveTypeType,
  CreateEmployeeLoneType,
  CreateOfficeTimingType,
  CreateOtherSalaryComponentType,
  CreateSalaryType,
  GetEmployeeAttendanceType,
  GetEmployeeLeaveType,
  GetEmployeeLoneType,
  GetOfficeTimingType,
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
} from '@/utils/type'

//roles
export const useGetRoles = () => {
  const [token] = useAtom(tokenAtom)
  useInitializeUser()

  return useQuery({
    queryKey: ['roles'],
    queryFn: () => {
      if (!token) {
        throw new Error('Token not found')
      }
      return getAllRoles(token)
    },
    enabled: !!token,
    select: (data) => data,
  })
}

//customers
export const useGetCustomers = () => {
  const [token] = useAtom(tokenAtom)
  useInitializeUser()

  return useQuery({
    queryKey: ['customers'],
    queryFn: () => {
      if (!token) {
        throw new Error('Token not found')
      }
      return getAllCustomers(token)
    },
    enabled: !!token,
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
  const [token] = useAtom(tokenAtom)
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: async (data: CreateCustomerType) => {
      const res = await createCustomer(data, token)
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

export const useUpdateCustomer = ({
  onClose,
  reset,
}: {
  onClose: () => void
  reset: () => void
}) => {
  useInitializeUser()

  const [token] = useAtom(tokenAtom)
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: CreateCustomerType }) => {
      return editCustomer(id, data, token)
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

  const [token] = useAtom(tokenAtom)
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: ({ id }: { id: number }) => {
      return deleteCustomer(id, token)
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
    onError: (error) => {
      console.error('Error sending delete request:', error)
    },
  })

  return mutation
}

//business units
export const useGetBusinessUnits = () => {
  const [token] = useAtom(tokenAtom)
  useInitializeUser()

  return useQuery({
    queryKey: ['business-units'],
    queryFn: () => {
      if (!token) {
        throw new Error('Token not found')
      }
      return getAllBusinessUnits(token)
    },
    enabled: !!token,
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
  const [token] = useAtom(tokenAtom)
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: async (data: CreateBusinessUnitType) => {
      const res = await createBusinessUnit(data, token)
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

  const [token] = useAtom(tokenAtom)
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: GetBusinessUnitType }) => {
      return editBusinessUnit(id, data, token)
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

  const [token] = useAtom(tokenAtom)
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: ({ id }: { id: number }) => {
      return deleteBusinessUnit(id, token)
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
    onError: (error) => {
      console.error('Error sending delete request:', error)
    },
  })

  return mutation
}

//tenants
export const useGetTenants = () => {
  const [token] = useAtom(tokenAtom)
  useInitializeUser()

  return useQuery({
    queryKey: ['tenants'],
    queryFn: () => {
      if (!token) {
        throw new Error('Token not found')
      }
      return getAllTenants(token)
    },
    enabled: !!token,
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
  const [token] = useAtom(tokenAtom)
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: async (data: CreateTenantType) => {
      const res = await createTenant(data, token)
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

  const [token] = useAtom(tokenAtom)
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: CreateTenantType }) => {
      return editTenant(id, data, token)
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

  const [token] = useAtom(tokenAtom)
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: ({ id }: { id: number }) => {
      return deleteTenant(id, token)
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
    onError: (error) => {
      console.error('Error sending delete request:', error)
    },
  })

  return mutation
}

//departments
export const useGetDepartments = () => {
  const [token] = useAtom(tokenAtom)
  useInitializeUser()

  return useQuery({
    queryKey: ['departments'],
    queryFn: () => {
      if (!token) {
        throw new Error('Token not found')
      }
      return getAllDepartments(token)
    },
    enabled: !!token,
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
  const [token] = useAtom(tokenAtom)
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: async (data: CreateDepartmentType) => {
      const res = await createDepartment(data, token)
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

  const [token] = useAtom(tokenAtom)
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: GetDepartmentType }) => {
      return editDepartment(id, data, token)
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

  const [token] = useAtom(tokenAtom)
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: ({ id }: { id: number }) => {
      return deleteDepartment(id, token)
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
    onError: (error) => {
      console.error('Error sending delete request:', error)
    },
  })

  return mutation
}

// Companies Hooks
export const useGetCompanies = () => {
  const [token] = useAtom(tokenAtom)
  useInitializeUser()

  return useQuery({
    queryKey: ['companies'],
    queryFn: () => {
      if (!token) {
        throw new Error('Token not found')
      }
      return getAllCompanies(token)
    },
    enabled: !!token,
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
  const [token] = useAtom(tokenAtom)
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: async (formData: FormData) => {
      console.log("🚀 ~ useAddCompany ~ formData:", formData)
      const res = await createCompany(formData, token)
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
  const [token] = useAtom(tokenAtom)
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: ({ id, formData }: { id: number; formData: FormData }) => {
      return editCompany(id, formData, token)
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

  const [token] = useAtom(tokenAtom)
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: ({ id }: { id: number }) => {
      return deleteCompany(id, token)
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
    onError: (error) => {
      console.error('Error sending delete request:', error)
    },
  })

  return mutation
}

// Work Stations Hooks
export const useGetWorkStations = () => {
  const [token] = useAtom(tokenAtom)
  useInitializeUser()

  return useQuery({
    queryKey: ['workstations'],
    queryFn: () => {
      if (!token) {
        throw new Error('Token not found')
      }
      return getAllWorkStations(token)
    },
    enabled: !!token,
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
  const [token] = useAtom(tokenAtom)
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: async (data: CreateWorkStationType) => {
      const res = await createWorkStation(data, token)
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

  const [token] = useAtom(tokenAtom)
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: CreateWorkStationType }) => {
      return editWorkStation(id, data, token)
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

  const [token] = useAtom(tokenAtom)
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: ({ id }: { id: number }) => {
      return deleteWorkStation(id, token)
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
    onError: (error) => {
      console.error('Error sending delete request:', error)
    },
  })

  return mutation
}

// Divisions Hooks
export const useGetDivisions = () => {
  const [token] = useAtom(tokenAtom)
  useInitializeUser()

  return useQuery({
    queryKey: ['divisions'],
    queryFn: () => {
      if (!token) {
        throw new Error('Token not found')
      }
      return getAllDivisions(token)
    },
    enabled: !!token,
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
  const [token] = useAtom(tokenAtom)
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: async (data: CreateDivisionType) => {
      const res = await createDivision(data, token)
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

  const [token] = useAtom(tokenAtom)
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: GetDivisionType }) => {
      return editDivision(id, data, token)
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

  const [token] = useAtom(tokenAtom)
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: ({ id }: { id: number }) => {
      return deleteDivision(id, token)
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
    onError: (error) => {
      console.error('Error sending delete request:', error)
    },
  })

  return mutation
}

// Cost Centers Hooks
export const useGetCostCenters = () => {
  const [token] = useAtom(tokenAtom)
  useInitializeUser()

  return useQuery({
    queryKey: ['costcenters'],
    queryFn: () => {
      if (!token) {
        throw new Error('Token not found')
      }
      return getAllCostCenters(token)
    },
    enabled: !!token,
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
  const [token] = useAtom(tokenAtom)
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: async (data: CreateCostCenterType) => {
      const res = await createCostCenter(data, token)
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

  const [token] = useAtom(tokenAtom)
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: CreateCostCenterType }) => {
      return editCostCenter(id, data, token)
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

  const [token] = useAtom(tokenAtom)
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: ({ id }: { id: number }) => {
      return deleteCostCenter(id, token)
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
    onError: (error) => {
      console.error('Error sending delete request:', error)
    },
  })

  return mutation
}

//designation
export const useGetDesignations = () => {
  const [token] = useAtom(tokenAtom)
  useInitializeUser()

  return useQuery({
    queryKey: ['designations'],
    queryFn: () => {
      if (!token) {
        throw new Error('Token not found')
      }
      return getAllDesignations(token)
    },
    enabled: !!token,
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
  const [token] = useAtom(tokenAtom)
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: async (data: CreateDesignationType) => {
      const res = await createDesignation(data, token)
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

  const [token] = useAtom(tokenAtom)
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: CreateDesignationType }) => {
      return editDesignation(id, data, token)
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

  const [token] = useAtom(tokenAtom)
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: ({ id }: { id: number }) => {
      return deleteDesignation(id, token)
    },
    onSuccess: () => {
      toast({
        title: 'Success!',
        description: 'designation is deleted successfully.',
      })
      queryClient.invalidateQueries({ queryKey: ['designations'] })

      reset()
      onClose()
    },
    onError: (error) => {
      console.error('Error sending delete request:', error)
    },
  })

  return mutation
}

//employee type
export const useGetEmploymentTypes = () => {
  const [token] = useAtom(tokenAtom)
  useInitializeUser()

  return useQuery({
    queryKey: ['employmentTypes'],
    queryFn: () => {
      if (!token) {
        throw new Error('Token not found')
      }
      return getAllEmploymentTypes(token)
    },
    enabled: !!token,
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
  const [token] = useAtom(tokenAtom)
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: async (data: CreateEmploymentTypeType) => {
      const res = await createEmploymentType(data, token)
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

  const [token] = useAtom(tokenAtom)
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: number
      data: CreateEmploymentTypeType
    }) => {
      return editEmploymentType(id, data, token)
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

  const [token] = useAtom(tokenAtom)
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: ({ id }: { id: number }) => {
      return deleteEmploymentType(id, token)
    },
    onSuccess: () => {
      toast({
        title: 'Success!',
        description: 'employee type is deleted successfully.',
      })
      queryClient.invalidateQueries({ queryKey: ['employmentTypes'] })

      reset()
      onClose()
    },
    onError: (error) => {
      console.error('Error sending delete request:', error)
    },
  })

  return mutation
}

//weekend
export const useGetWeekends = () => {
  const [token] = useAtom(tokenAtom)
  useInitializeUser()

  return useQuery({
    queryKey: ['weekends'],
    queryFn: () => {
      if (!token) {
        throw new Error('Token not found')
      }
      return getAllWeekends(token)
    },
    enabled: !!token,
    select: (data) => data,
  })
}

//office timing weekends
export const useGetOfficeTimingWeekends = () => {
  const [token] = useAtom(tokenAtom)
  useInitializeUser()

  return useQuery({
    queryKey: ['officeTimings'],
    queryFn: () => {
      if (!token) {
        throw new Error('Token not found')
      }
      return getAllOfficeTimingWeekends(token)
    },
    enabled: !!token,
    select: (data) => data,
  })
}

export const useAddOfficeTimingWeekend = ({
  onClose,
  reset,
}: {
  onClose: () => void
  reset: () => void
}) => {
  useInitializeUser()
  const [token] = useAtom(tokenAtom)
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: async (data: CreateOfficeTimingType) => {
      const res = await createOfficeTimingWeekend(data, token)
      return res
    },
    onSuccess: (res) => {
      if (res?.error) {
        toast({
          title: 'Error',
          variant: 'destructive',
          description: res.error.message || 'Failed to create office timing',
        })
        return
      }

      toast({
        title: 'Success',
        description: 'Office timing created successfully!',
      })

      queryClient.invalidateQueries({ queryKey: ['officeTimings'] })
      reset()
      onClose()
    },
    onError: (error: any) => {
      console.error('Error adding office timing:', error)
      toast({
        title: 'Error',
        variant: 'destructive',
        description: error?.message || 'Unexpected error occurred',
      })
    },
  })

  return mutation
}

export const useUpdateOfficeTimingWeekend = ({
  onClose,
  reset,
}: {
  onClose: () => void
  reset: () => void
}) => {
  useInitializeUser()

  const [token] = useAtom(tokenAtom)
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: GetOfficeTimingType }) => {
      return editOfficeTimingWeekend(id, data, token)
    },
    onSuccess: () => {
      toast({
        title: 'Success!',
        description: 'office timing is edited successfully.',
      })
      queryClient.invalidateQueries({ queryKey: ['officeTimings'] })

      reset()
      onClose()
    },
    onError: (error) => {
      console.error('Error editing office timing:', error)
    },
  })

  return mutation
}

export const useDeleteOfficeTimingWeekend = ({
  onClose,
  reset,
}: {
  onClose: () => void
  reset: () => void
}) => {
  useInitializeUser()

  const [token] = useAtom(tokenAtom)
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: ({ id }: { id: number }) => {
      return deleteOfficeTimingWeekend(id, token)
    },
    onSuccess: () => {
      toast({
        title: 'Success!',
        description: 'office timing is deleted successfully.',
      })
      queryClient.invalidateQueries({ queryKey: ['officeTimings'] })

      reset()
      onClose()
    },
    onError: (error) => {
      console.error('Error sending delete request:', error)
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
  const [token] = useAtom(tokenAtom)
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const res = await createEmployee(formData, token)
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
  const [token] = useAtom(tokenAtom)
  useInitializeUser()

  return useQuery({
    queryKey: ['employees'],
    queryFn: () => {
      if (!token) {
        throw new Error('Token not found')
      }
      return getAllEmployees(token)
    },
    enabled: !!token,
    select: (data) => data,
  })
}

export const useGetEmployeeById = (id: number) => {
  const [token] = useAtom(tokenAtom)
  useInitializeUser()

  return useQuery({
    queryKey: ['employees', id],
    queryFn: () => {
      if (!token) throw new Error('Token not found')
      return getEmployeeById(token, id)
    },
    enabled: !!token && id > 0,
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

  const [token] = useAtom(tokenAtom)
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: FormData }) => {
      return editEmployee(id, data, token)
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

  const [token] = useAtom(tokenAtom)
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: ({ id }: { id: number }) => {
      return deleteEmployee(id, token)
    },
    onSuccess: () => {
      toast({
        title: 'Success!',
        description: 'employee is deleted successfully.',
      })
      queryClient.invalidateQueries({ queryKey: ['employees'] })

      reset()
      onClose()
    },
    onError: (error) => {
      console.error('Error sending delete request:', error)
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

  const [token] = useAtom(tokenAtom)
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: async ({ data }: { data: AssignLeaveTypeType }) => {
      const res = await assignLeaveType(data, token)
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
  const [token] = useAtom(tokenAtom)
  useInitializeUser()

  return useQuery({
    queryKey: ['holidays'],
    queryFn: () => {
      if (!token) {
        throw new Error('Token not found')
      }
      return getAllHolidays(token)
    },
    enabled: !!token,
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
  const [token] = useAtom(tokenAtom)
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: async (data: CreateHolidayType) => {
      const res = await createHoliday(data, token)
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

  const [token] = useAtom(tokenAtom)
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: CreateHolidayType }) => {
      return editHoliday(id, data, token)
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

  const [token] = useAtom(tokenAtom)
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: ({ id }: { id: number }) => {
      return deleteHoliday(id, token)
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
    onError: (error) => {
      console.error('Error sending delete request:', error)
    },
  })

  return mutation
}

//leave type
export const useGetLeaveTypes = () => {
  const [token] = useAtom(tokenAtom)
  useInitializeUser()

  return useQuery({
    queryKey: ['leaveTypes'],
    queryFn: () => {
      if (!token) {
        throw new Error('Token not found')
      }
      return getAllLeaveTypes(token)
    },
    enabled: !!token,
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
  const [token] = useAtom(tokenAtom)
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: async (data: CreateLeaveTypeType) => {
      const res = await createLeaveType(data, token)
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

  const [token] = useAtom(tokenAtom)
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: CreateLeaveTypeType }) => {
      return editLeaveType(id, data, token)
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

  const [token] = useAtom(tokenAtom)
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: ({ id }: { id: number }) => {
      return deleteLeaveType(id, token)
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
    onError: (error) => {
      console.error('Error sending delete request:', error)
    },
  })

  return mutation
}

//employee attendances
export const useGetEmployeeAttendances = () => {
  const [token] = useAtom(tokenAtom)
  useInitializeUser()

  return useQuery({
    queryKey: ['employeeAttendances'],
    queryFn: () => {
      if (!token) {
        throw new Error('Token not found')
      }
      return getAllEmployeeAttendances(token)
    },
    enabled: !!token,
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
  const [token] = useAtom(tokenAtom)
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: async (data: CreateEmployeeAttendanceType) => {
      const res = await createEmployeeAttendance(data, token)
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

  const [token] = useAtom(tokenAtom)
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: number
      data: GetEmployeeAttendanceType
    }) => {
      return editEmployeeAttendance(id, data, token)
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

  const [token] = useAtom(tokenAtom)
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: ({ id }: { id: number }) => {
      return deleteEmployeeAttendance(id, token)
    },
    onSuccess: () => {
      toast({
        title: 'Success!',
        description: 'employee attendance is deleted successfully.',
      })
      queryClient.invalidateQueries({ queryKey: ['employeeAttendances'] })

      reset()
      onClose()
    },
    onError: (error) => {
      console.error('Error sending delete request:', error)
    },
  })

  return mutation
}

//other salary components
export const useGetOtherSalaryComponents = () => {
  const [token] = useAtom(tokenAtom)
  useInitializeUser()

  return useQuery({
    queryKey: ['otherSalaryComponents'],
    queryFn: () => {
      if (!token) {
        throw new Error('Token not found')
      }
      return getAllOtherSalaryComponents(token)
    },
    enabled: !!token,
    select: (data) => data,
  })
}

export const useAddOtherSalaryComponent = ({
  onClose,
  reset,
}: {
  onClose: () => void
  reset: () => void
}) => {
  useInitializeUser()
  const [token] = useAtom(tokenAtom)
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: async (data: CreateOtherSalaryComponentType) => {
      const res = await createOtherSalaryComponent(data, token)
      return res
    },
    onSuccess: (res) => {
      if (res?.error) {
        toast({
          title: 'Error',
          variant: 'destructive',
          description:
            res.error.message || 'Failed to create other salary component',
        })
        return
      }

      toast({
        title: 'Success',
        description: 'Other salary component created successfully!',
      })

      queryClient.invalidateQueries({ queryKey: ['otherSalaryComponents'] })
      reset()
      onClose()
    },
    onError: (error: any) => {
      console.error('Error adding other salary component:', error)
      toast({
        title: 'Error',
        variant: 'destructive',
        description: error?.message || 'Unexpected error occurred',
      })
    },
  })

  return mutation
}

export const useUpdateOtherSalaryComponent = ({
  onClose,
  reset,
}: {
  onClose: () => void
  reset: () => void
}) => {
  useInitializeUser()

  const [token] = useAtom(tokenAtom)
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: number
      data: CreateOtherSalaryComponentType
    }) => {
      return editOtherSalaryComponent(id, data, token)
    },
    onSuccess: () => {
      toast({
        title: 'Success!',
        description: 'other salary component edited successfully.',
      })
      queryClient.invalidateQueries({ queryKey: ['otherSalaryComponents'] })

      reset()
      onClose()
    },
    onError: (error) => {
      console.error('Error editing other salary component:', error)
    },
  })

  return mutation
}

export const useDeleteOtherSalaryComponent = ({
  onClose,
  reset,
}: {
  onClose: () => void
  reset: () => void
}) => {
  useInitializeUser()

  const [token] = useAtom(tokenAtom)
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: ({ id }: { id: number }) => {
      return deleteOtherSalaryComponent(id, token)
    },
    onSuccess: () => {
      toast({
        title: 'Success!',
        description: 'other salary component is deleted successfully.',
      })
      queryClient.invalidateQueries({ queryKey: ['otherSalaryComponents'] })

      reset()
      onClose()
    },
    onError: (error) => {
      console.error('Error sending delete request:', error)
    },
  })

  return mutation
}

//employee other salary components
export const useGetEmployeeOtherSalaryComponents = () => {
  const [token] = useAtom(tokenAtom)
  useInitializeUser()

  return useQuery({
    queryKey: ['employeeOtherSalaryComponents'],
    queryFn: () => {
      if (!token) {
        throw new Error('Token not found')
      }
      return getAllEmployeeOtherSalaryComponents(token)
    },
    enabled: !!token,
    select: (data) => data,
  })
}

export const useAddEmployeeOtherSalaryComponent = ({
  onClose,
  reset,
}: {
  onClose: () => void
  reset: () => void
}) => {
  useInitializeUser()
  const [token] = useAtom(tokenAtom)
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: async (data: CreateEmployeeOtherSalaryComponentType) => {
      const res = await createEmployeeOtherSalaryComponent(data, token)
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
        queryKey: ['employeeOtherSalaryComponents'],
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

export const useUpdateEmployeeOtherSalaryComponent = ({
  onClose,
  reset,
}: {
  onClose: () => void
  reset: () => void
}) => {
  useInitializeUser()

  const [token] = useAtom(tokenAtom)
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: number
      data: CreateEmployeeOtherSalaryComponentType
    }) => {
      return editEmployeeOtherSalaryComponent(id, data, token)
    },
    onSuccess: () => {
      toast({
        title: 'Success!',
        description: 'Employee other salary component edited successfully.',
      })
      queryClient.invalidateQueries({
        queryKey: ['employeeOtherSalaryComponents'],
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

export const useDeleteEmployeeOtherSalaryComponent = ({
  onClose,
  reset,
}: {
  onClose: () => void
  reset: () => void
}) => {
  useInitializeUser()

  const [token] = useAtom(tokenAtom)
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: ({ id }: { id: number }) => {
      return deleteEmployeeOtherSalaryComponent(id, token)
    },
    onSuccess: () => {
      toast({
        title: 'Success!',
        description: 'Employee other salary component is deleted successfully.',
      })
      queryClient.invalidateQueries({
        queryKey: ['employeeOtherSalaryComponents'],
      })

      reset()
      onClose()
    },
    onError: (error) => {
      console.error('Error sending delete request:', error)
    },
  })

  return mutation
}

//salary
export const useGetSalaries = () => {
  const [token] = useAtom(tokenAtom)
  useInitializeUser()

  return useQuery({
    queryKey: ['salaries'],
    queryFn: () => {
      if (!token) {
        throw new Error('Token not found')
      }
      return getAllSalaries(token)
    },
    enabled: !!token,
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
  const [token] = useAtom(tokenAtom)
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: async (data: CreateSalaryType) => {
      const res = await createSalary(data, token)
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

  const [token] = useAtom(tokenAtom)
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => {
      return editSalary(id, data, token)
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

export const useDeleteSalary = ({
  onClose,
  reset,
}: {
  onClose: () => void
  reset: () => void
}) => {
  useInitializeUser()

  const [token] = useAtom(tokenAtom)
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: ({ id }: { id: number }) => {
      return deleteSalary(id, token)
    },
    onSuccess: () => {
      toast({
        title: 'Success!',
        description: 'salary is deleted successfully.',
      })
      queryClient.invalidateQueries({ queryKey: ['salaries'] })

      reset()
      onClose()
    },
    onError: (error) => {
      console.error('Error sending delete request:', error)
    },
  })

  return mutation
}

//lones
export const useGetLones = () => {
  const [token] = useAtom(tokenAtom)
  useInitializeUser()

  return useQuery({
    queryKey: ['lones'],
    queryFn: () => {
      if (!token) {
        throw new Error('Token not found')
      }
      return getAllLones(token)
    },
    enabled: !!token,
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
  const [token] = useAtom(tokenAtom)
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: async (data: CreateEmployeeLoneType) => {
      const res = await createLone(data, token)
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
  const [token] = useAtom(tokenAtom)
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: async ({
      employeeOtherSalaryComponentId,
      updatedBy,
    }: {
      employeeOtherSalaryComponentId: number
      updatedBy: number
    }) => {
      const res = await skipLone(
        employeeOtherSalaryComponentId,
        updatedBy,
        token
      )
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

      // Invalidate relevant queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['lones'] })
      queryClient.invalidateQueries({
        queryKey: ['employeeOtherSalaryComponents'],
      })

      // If we have the employeeLoneId from response, invalidate specific lone query
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

  const [token] = useAtom(tokenAtom)
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: GetEmployeeLoneType }) => {
      return editLone(id, data, token)
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

export const useDeleteLone = ({
  onClose,
  reset,
}: {
  onClose: () => void
  reset: () => void
}) => {
  useInitializeUser()

  const [token] = useAtom(tokenAtom)
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: ({ id }: { id: number }) => {
      return deleteLone(id, token)
    },
    onSuccess: () => {
      toast({
        title: 'Success!',
        description: 'lone is deleted successfully.',
      })
      queryClient.invalidateQueries({ queryKey: ['lones'] })

      reset()
      onClose()
    },
    onError: (error) => {
      console.error('Error sending delete request:', error)
    },
  })

  return mutation
}

//employee leaves
export const useGetEmployeeLeaves = () => {
  const [token] = useAtom(tokenAtom)
  useInitializeUser()

  return useQuery({
    queryKey: ['employeeLeaves'],
    queryFn: () => {
      if (!token) {
        throw new Error('Token not found')
      }
      return getAllEmployeeLeaves(token)
    },
    enabled: !!token,
    select: (data) => data,
  })
}

export const useGetEmployeeLeaveTypes = () => {
  const [token] = useAtom(tokenAtom)
  useInitializeUser()

  return useQuery({
    queryKey: ['employeeLeaveTypes'],
    queryFn: () => {
      if (!token) {
        throw new Error('Token not found')
      }
      return getAllEmployeeLeaveTypes(token)
    },
    enabled: !!token,
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
  const [token] = useAtom(tokenAtom)
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: async (data: CreateEmployeeLeaveType) => {
      const res = await createEmployeeLeave(data, token)
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

  const [token] = useAtom(tokenAtom)
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: GetEmployeeLeaveType }) => {
      return editEmployeeLeave(id, data, token)
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

  const [token] = useAtom(tokenAtom)
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: ({ id }: { id: number }) => {
      return deleteEmployeeLeave(id, token)
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
    onError: (error) => {
      console.error('Error sending delete request:', error)
    },
  })

  return mutation
}

//reports
export const useGetSalaryReport = (salaryMonth: string, salaryYear: number) => {
  const [token] = useAtom(tokenAtom)
  useInitializeUser()

  return useQuery({
    queryKey: ['salaryReport', salaryMonth, salaryYear],
    queryFn: () => {
      if (!token) throw new Error('Token not found')
      return getSalaryReport(salaryMonth, salaryYear, token)
    },
    enabled: !!token && salaryMonth.length > 0 && salaryYear > 0,
    select: (data) => data,
  })
}

export const useGetAttendanceReport = (fromDate: string, toDate: string) => {
  const [token] = useAtom(tokenAtom)
  useInitializeUser()

  return useQuery({
    queryKey: ['attendanceReport', fromDate, toDate],
    queryFn: () => {
      if (!token) throw new Error('Token not found')
      return getAttendanceReport(fromDate, toDate, token)
    },
    enabled: !!token && fromDate.length > 0 && toDate.length > 0,
    select: (data) => data,
  })
}

export const useGetLoneReport = (fromDate: string, toDate: string) => {
  const [token] = useAtom(tokenAtom)
  useInitializeUser()

  return useQuery({
    queryKey: ['loneReport', fromDate, toDate],
    queryFn: () => {
      if (!token) throw new Error('Token not found')
      return getLoneReport(fromDate, toDate, token)
    },
    enabled: !!token && fromDate.length > 0 && toDate.length > 0,
    select: (data) => data,
  })
}

//dashboard
export const useGetEmployeeLeaveSummary = () => {
  const [token] = useAtom(tokenAtom)
  useInitializeUser()

  return useQuery({
    queryKey: ['employeeLeaveSummary'],
    queryFn: () => {
      if (!token) {
        throw new Error('Token not found')
      }
      return getEmployeeLeaveSummary(token)
    },
    enabled: !!token,
    select: (data) => data,
  })
}

export const useGetEmployeeAttendanceSummary = () => {
  const [token] = useAtom(tokenAtom)
  useInitializeUser()

  return useQuery({
    queryKey: ['employeeAttendanceSummary'],
    queryFn: () => {
      if (!token) {
        throw new Error('Token not found')
      }
      return getEmployeeAttendanceSummary(token)
    },
    enabled: !!token,
    select: (data) => data,
  })
}
