import { off } from 'process'
import { z } from 'zod'

//auth + authorization + user management
export const SignInRequestSchema = z.object({
  username: z.string().min(1),
  password: z.string().min(1),
})

export const PermissionSchema = z.object({
  id: z.number(),
  name: z.string(),
})

export const RolePermissionSchema = z.object({
  roleId: z.number(),
  permissionId: z.number(),
  permission: PermissionSchema,
})

export const RoleSchema = z.object({
  roleId: z.number(),
  roleName: z.string(),
  rolePermissions: z.array(RolePermissionSchema),
})

export const UserSchema = z.object({
  userId: z.number(),
  username: z.string(),
  password: z.string(),
  active: z.boolean(),
  roleId: z.number(),
  isPasswordResetRequired: z.boolean(),
  createdAt: z.string(),
  updatedAt: z.string(),
  role: RoleSchema,
})
export type User = z.infer<typeof UserSchema>

export const SignInResponseSchema = z.object({
  token: z.string(),
  user: UserSchema,
})
export type SignInRequest = z.infer<typeof SignInRequestSchema>
export type SignInResponse = z.infer<typeof SignInResponseSchema>

//departments
export const departmentSchema = z.object({
  departmentId: z.number().optional(),
  departmentName: z.string(),
  createdBy: z.number(),
  createdAt: z.date().optional(),
  updatedBy: z.number().nullable().optional(),
  updatedAt: z.date().optional(),
})
export type CreateDepartmentType = z.infer<typeof departmentSchema>
export type GetDepartmentType = z.infer<typeof departmentSchema>

//designations
export const designationSchema = z.object({
  designationId: z.number().optional(),
  designationName: z.string(),
  createdBy: z.number(),
  createdAt: z.date().optional(),
  updatedBy: z.number().nullable().optional(),
  updatedAt: z.date().optional(),
})
export type CreateDesignationType = z.infer<typeof designationSchema>
export type GetDesignationType = z.infer<typeof designationSchema>

//company type
export const companySchema = z.object({
  companyId: z.number().optional(),
  companyName: z.string(),
  createdBy: z.number(),
  createdAt: z.date().optional(),
  updatedBy: z.number().nullable().optional(),
  updatedAt: z.date().optional(),
})
export type CreateCompanyType = z.infer<typeof companySchema>
export type GetCompanyType = z.infer<typeof companySchema>

//work station type
export const workStationSchema = z.object({
  workStationId: z.number().optional(),
  workStationName: z.string(),
  createdBy: z.number(),
  createdAt: z.date().optional(),
  updatedBy: z.number().nullable().optional(),
  updatedAt: z.date().optional(),
})
export type CreateWorkStationType = z.infer<typeof workStationSchema>
export type GetWorkStationType = z.infer<typeof workStationSchema>

//division type
export const divisionSchema = z.object({
  divisionId: z.number().optional(),
  divisionName: z.string(),
  createdBy: z.number(),
  createdAt: z.date().optional(),
  updatedBy: z.number().nullable().optional(),
  updatedAt: z.date().optional(),
})
export type CreateDivisionType = z.infer<typeof divisionSchema>
export type GetDivisionType = z.infer<typeof divisionSchema>

//employee type
export const employeeTypeSchema = z.object({
  employeeTypeId: z.number().optional(),
  employeeTypeName: z.string(),
  createdBy: z.number(),
  createdAt: z.date().optional(),
  updatedBy: z.number().nullable().optional(),
  updatedAt: z.date().optional(),
})
export type CreateEmployeeTypeType = z.infer<typeof employeeTypeSchema>
export type GetEmployeeTypeType = z.infer<typeof employeeTypeSchema>

//cost center type
export const costCenterSchema = z.object({
  costCenterId: z.number().optional(),
  costCenterName: z.string(),
  createdBy: z.number(),
  createdAt: z.date().optional(),
  updatedBy: z.number().nullable().optional(),
  updatedAt: z.date().optional(),
})
export type CreateCostCenterType = z.infer<typeof costCenterSchema>
export type GetCostCenterType = z.infer<typeof costCenterSchema>

//employee
export const employeeSchema = z.object({
  // Primary Key (auto-generated)
  employeeId: z.number().optional(),

  // Basic Information
  empCode: z.string().min(1, 'Employee code is required').max(10),
  empFullName: z.string().min(1, 'Full name is required').max(100),
  empShortName: z.string().max(20).optional().nullable(),
  dob: z.string().min(1, 'Date of birth is required'),
  doj: z.string().min(1, 'Date of joining is required'),
  doc: z.string().optional().nullable(),
  gender: z.enum(['Male', 'Female']),
  nationalIdNo: z.string().max(50).optional().nullable(),
  nationality: z
    .enum(['Bangladeshi', 'Pakistani', 'Indian', 'British', 'American'])
    .optional()
    .nullable(),
  country: z.string().max(100).optional().nullable(),
  city: z.string().max(100).optional().nullable(),
  zipCode: z.string().max(20).optional().nullable(),

  // Contact Information
  workEmail: z
    .string()
    .email('Invalid work email')
    .max(100)
    .optional()
    .nullable(),
  privateEmail: z
    .string()
    .email('Invalid private email')
    .max(100)
    .optional()
    .nullable(),
  homePhone: z.string().max(20).optional().nullable(),
  personalPhone: z.string().max(20).optional().nullable(),
  officialPhone: z.string().min(1, 'Official phone is required').max(20),

  // Address Information
  presentAddress: z.string().min(1, 'Present address is required').max(255),
  permanentAddress: z.string().max(255).optional().nullable(),

  // Emergency Contact
  emergencyContactName: z.string().max(100).optional().nullable(),
  emergencyContactPhone: z.string().max(20).optional().nullable(),
  emergencyContactRelation: z.string().max(50).optional().nullable(),

  // Personal Information
  maritalStatus: z.enum(['Single', 'Married']).optional().nullable(),
  photoUrl: z.string().url('Invalid photo URL').max(255).optional().nullable(),
  cvUrl: z.string().url('Invalid CV URL').max(255).optional().nullable(),
  religion: z.string().max(20).optional().nullable(),
  bloodGroup: z
    .enum(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'])
    .optional()
    .nullable(),

  // Qualification Information
  qualification: z.enum(['SSC', 'HSC', 'Graduate', 'Postgraduate']),
  instituteName: z.string().max(255).optional().nullable(),
  subjectName: z.string().max(255).optional().nullable(),
  startDate: z.string().optional().nullable(),
  endDate: z.string().optional().nullable(),
  result: z.string().max(50).optional().nullable(),
  certificateUrl: z
    .string()
    .url('Invalid certificate URL')
    .max(255)
    .optional()
    .nullable(),

  // Employment Information
  basicSalary: z.number().positive('Basic salary must be positive'),
  isActive: z.boolean().default(true),

  // Dependents Information
  dependentsName: z.string().max(255).optional().nullable(),
  dependentRelation: z.string().max(50).optional().nullable(),

  // Foreign Keys (IDs)
  departmentId: z.number().int(),
  designationId: z.number().int(),
  employeeTypeId: z.number().int(),
  officeTimingId: z.number().int(),
  companyId: z.number().int(),
  workStationId: z.number().int(),
  divisionId: z.number().int(),
  costCenterId: z.number().int(),
  reportingAuthorityId: z.number().int(),

  // Additional fields from your service (not in original schema)
  officeTiming: z.string().optional(), // This might be a string representation

  // For creating employee with leave types
  leaveTypeIds: z.array(z.number()).optional(),

  // Audit Fields
  createdBy: z.number(),
  createdAt: z.date().optional(),
  updatedBy: z.number().nullable().optional(),
  updatedAt: z.date().optional(),
})

// For Create operations (without auto-generated and audit fields)
export const createEmployeeSchema = employeeSchema.omit({
  employeeId: true,
  createdAt: true,
  updatedAt: true,
})

// For Update operations (all fields optional except ID)
export const updateEmployeeSchema = employeeSchema.partial().extend({
  employeeId: z.number().int().positive('Employee ID is required'),
})

// Type exports
export type CreateEmployeeType = z.infer<typeof createEmployeeSchema>
export type UpdateEmployeeType = z.infer<typeof updateEmployeeSchema>
export type GetEmployeeType = z.infer<typeof employeeSchema> & {
  departmentName: string
  designationName: string
  employeeTypeName: string
  companyName: string
  workStationName: string
  divisionName: string
  costCenterName: string
  reportingAuthorityName: string
  officeTiming: string
  leaveTypes: string[]
}

//weekend
export const weekendSchema = z.object({
  weekendId: z.number().optional(),
  day: z.string(),
})
export type GetWeekendType = z.infer<typeof weekendSchema>

//office timing weekend
export const officeTimingSchema = z.object({
  officeTiminId: z.number().optional(),
  officeTimingId: z.number().optional(),
  startTime: z.string(),
  endTime: z.string(),
  weekendIds: z.array(z.number()),
  createdBy: z.number(),
  createdAt: z.date().optional(),
  updatedBy: z.number().nullable().optional(),
  updatedAt: z.date().optional(),
})
export type CreateOfficeTimingType = z.infer<typeof officeTimingSchema>
export type GetOfficeTimingType = z.infer<typeof officeTimingSchema> & {
  weekends: string[]
}

//holiday
export const holidaySchema = z.object({
  holidayId: z.number().optional(),
  holidayName: z.string(),
  startDate: z.string(),
  endDate: z.string(),
  noOfDays: z.number(),
  description: z.string().optional().nullable(),
  createdBy: z.number(),
  createdAt: z.date().optional(),
  updatedBy: z.number().nullable().optional(),
  updatedAt: z.date().optional(),
})
export type CreateHolidayType = z.infer<typeof holidaySchema>
export type GetHolidayType = z.infer<typeof holidaySchema>

//leave type
export const leaveTypeSchema = z.object({
  leaveTypeId: z.number().optional(),
  leaveTypeName: z.string(),
  totalLeaves: z.number(),
  yearPeriod: z.number(),
  createdBy: z.number(),
  createdAt: z.date().optional(),
  updatedBy: z.number().nullable().optional(),
  updatedAt: z.date().optional(),
})
export type CreateLeaveTypeType = z.infer<typeof leaveTypeSchema>
export type GetLeaveTypeType = z.infer<typeof leaveTypeSchema>

export const employeeLeaveTypeSchema = z.object({
  employeeLeaveTypeId: z.number().optional(),
  employeeId: z.number(),
  leaveTypeId: z.number(),
})
export type GetEmployeeLeaveTypeType = z.infer<
  typeof employeeLeaveTypeSchema
> & {
  leaveTypeName: string
  totalLeaves: number
  employeeName: string
  empCode: string
  designationName: string
  departmentName: string
}

export const employeeAttendanceSchema = z.object({
  employeeAttendanceId: z.number().optional(),
  employeeId: z.number(),
  attendanceDate: z.string(),
  inTime: z.string().optional(),
  outTime: z.string().optional(),
  lateInMinutes: z.number().optional(),
  earlyOutMinutes: z.number().optional(),
  isAbsent: z.boolean(),
  createdBy: z.number(),
  createdAt: z.date().optional(),
  updatedBy: z.number().nullable().optional(),
  updatedAt: z.date().optional(),
})
export type CreateEmployeeAttendanceType = z.infer<
  typeof employeeAttendanceSchema
>
export type GetEmployeeAttendanceType = z.infer<
  typeof employeeAttendanceSchema
> & {
  employeeName: string
  empCode: string
  designationName: string
  departmentName: string
  officeStartTime: string
  officeEndTime: string
}

export const assignLeaveTypeSchema = z.object({
  employeeLeaveTypeId: z.number().optional(),
  employeeId: z.number(),
  leaveTypeIds: z.array(z.number()).min(1),
})
export type AssignLeaveTypeType = z.infer<typeof assignLeaveTypeSchema>

export const otherSalaryComponentSchema = z.object({
  otherSalaryComponentId: z.number().optional(),
  componentName: z.string(),
  componentType: z.enum(['Allowance', 'Deduction']),
  amount: z.number(),
  forDays: z.number(),
  status: z.number(),
  isAbsentFee: z.boolean(),
  isLoneFee: z.boolean(),
  isLateEarlyOutFee: z.boolean(),
  createdBy: z.number(),
  createdAt: z.date().optional(),
  updatedBy: z.number().nullable().optional(),
  updatedAt: z.date().optional(),
})
export type CreateOtherSalaryComponentType = z.infer<
  typeof otherSalaryComponentSchema
>
export type GetOtherSalaryComponentType = z.infer<
  typeof otherSalaryComponentSchema
>

export const salarySchema = z.object({
  salary: z.object({
    salaryMonth: z.string(),
    salaryYear: z.number(),
    employeeId: z.number(),
    employeeName: z.string().optional(), // only for get
    departmentId: z.number(),
    departmentName: z.string().optional(), //only for get
    designationId: z.number(),
    designationName: z.string().optional(), //only for get
    basicSalary: z.number(),
    grossSalary: z.number(),
    netSalary: z.number(),
    doj: z.string(),
    createdBy: z.number(),
    createdAt: z.date().optional(),
    updatedBy: z.number().nullable().optional(),
    updatedAt: z.date().optional(),
  }),

  otherSalary: z.array(
    z.object({
      employeeId: z.number(),
      employeeName: z.string().optional(), // only for get
      otherSalaryComponentId: z.number(),
      componentName: z.string().optional(), //only for get
      componentType: z.enum(['Allowance', 'Deduction']).optional(), //only for get
      salaryMonth: z.string(),
      salaryYear: z.number(),
      amount: z.number(),
      createdBy: z.number(),
      createdAt: z.date().optional(),
      updatedBy: z.number().nullable().optional(),
      updatedAt: z.date().optional(),
    })
  ),
})
export type GetSalaryType = z.infer<typeof salarySchema>

export const createSalarySchema = z.object({
  salaryMonth: z.string(),
  salaryYear: z.number(),
  employeeId: z.number(),
  departmentId: z.number(),
  designationId: z.number(),
  basicSalary: z.number(),
  grossSalary: z.number(),
  netSalary: z.number(),
  doj: z.string(),
  createdBy: z.number(),
  createdAt: z.date().optional(),
  updatedBy: z.number().nullable().optional(),
  updatedAt: z.date().optional(),
})
export type CreateSalaryType = z.infer<typeof createSalarySchema>

export const employeeOtherSalaryComponentSchema = z.object({
  employeeOtherSalaryComponentId: z.number().optional(),
  employeeId: z.number(),
  otherSalaryComponentId: z.number(),
  employeeLoneId: z.number().optional().nullable(),
  salaryMonth: z.string(),
  salaryYear: z.number(),
  amount: z.number(),
  isAuthorized: z.number().int().min(0).max(1),
  isSkipped: z.number().int().min(0).max(1).optional(),
  createdBy: z.number(),
  createdAt: z.date().optional(),
  updatedBy: z.number().nullable().optional(),
  updatedAt: z.date().optional(),
})
export type CreateEmployeeOtherSalaryComponentType = z.infer<
  typeof employeeOtherSalaryComponentSchema
>
export type GetEmployeeOtherSalaryComponentType = z.infer<
  typeof employeeOtherSalaryComponentSchema
> & {
  empCode: string
  employeeName: string
  employeeDepartmentName: string
  employeeDesignationName: string
  componentName: string
  componentType: 'Allowance' | 'Deduction'
  isAbsentFee: number
  isLoneFee: number
  isLateEarlyOutFee: number
}

export const employeeLonesSchema = z.object({
  employeeLoneId: z.number().optional(),
  employeeLoneName: z.string().min(1),
  loneDate: z.string().min(1),
  employeeId: z.number(),
  amount: z.number(),
  perMonth: z.number(),
  description: z.string().optional(),
  createdBy: z.number(),
  createdAt: z.date().optional(),
  updatedBy: z.number().nullable().optional(),
  updatedAt: z.date().optional(),
})
export type CreateEmployeeLoneType = z.infer<typeof employeeLonesSchema>
export type GetEmployeeLoneType = z.infer<typeof employeeLonesSchema> & {
  employeeName: string
  empCode: string
  designationName: string
  departmentName: string
}

export const employeeLeaveSchema = z.object({
  employeeLeaveId: z.number().optional(),
  employeeId: z.number(),
  startDate: z.string().min(1),
  endDate: z.string().min(1),
  noOfDays: z.number().int().positive(),
  leaveTypeId: z.number(),
  description: z.string().optional(),
  createdBy: z.number(),
  createdAt: z.date().optional(),
  updatedBy: z.number().nullable().optional(),
  updatedAt: z.date().optional(),
})
export type CreateEmployeeLeaveType = z.infer<typeof employeeLeaveSchema>
export type GetEmployeeLeaveType = z.infer<typeof employeeLeaveSchema> & {
  employeeName: string
  empCode: string
  designationName: string
  departmentName: string
  leaveTypeName: string
}

export const loneReportSchema = z.array(
  z.object({
    lone: z.object({
      employeeLoneId: z.number(),
      employeeLoneName: z.string(),
      amount: z.number(),
      perMonth: z.number(),
      loneDate: z.string(),
      description: z.string(),
      employeeId: z.number(),
      employeeName: z.string().optional(), // only for get
      empCode: z.string().optional(), // only for get
      departmentId: z.number(),
      departmentName: z.string().optional(), // only for get
      designationId: z.number(),
      designationName: z.string().optional(), // only for get
    }),

    installments: z.array(
      z.object({
        employeeOtherSalaryComponentId: z.number(),
        otherSalaryComponentId: z.number(),
        salaryMonth: z.string(),
        salaryYear: z.number(),
        amount: z.number(),
        isAuthorized: z.number(),
        isSkipped: z.number(),
        isSalaryGiven: z.number(),
        createdAt: z.date(),
      })
    ),
  })
)
export type GetLoneReportType = z.infer<typeof loneReportSchema>

export const employeeLeaveSummarySchema = z.array(
  z.object({
    employeeDetails: z.object({
      employeeId: z.number(),
      empCode: z.string(),
      empFullName: z.string(),
      designationName: z.string(),
      departmentName: z.string(),
      totalLeavesTaken: z.number(),
    }),

    leaveDetails: z.array(
      z.object({
        leaveTypeId: z.number(),
        leaveTypeName: z.string(),
        totalLeaves: z.number(),
        takenLeaves: z.number(),
        remainingLeaves: z.number(),
      })
    ),
  })
)
export type GetEmployeeLeaveSummaryType = z.infer<
  typeof employeeLeaveSummarySchema
>

export const employeeAttendanceSummarySchema = z.array(
  z.object({
    employeeDetails: z.object({
      employeeId: z.number(),
      empCode: z.string(),
      empFullName: z.string(),
      designationName: z.string(),
      departmentName: z.string(),

      totalAbsent: z.number(),
      totalLateInMinutes: z.number(),
      totalEarlyOutMinutes: z.number(),
    }),

    attendanceDetails: z.array(
      z.object({
        attendanceDate: z.string(),
        isAbsent: z.number(),
        lateInMinutes: z.number().nullable(),
        earlyOutMinutes: z.number().nullable(),
      })
    ),
  })
)
export type GetEmployeeAttendanceSummaryType = z.infer<
  typeof employeeAttendanceSummarySchema
>
