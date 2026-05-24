import { off } from 'process'
import { boolean, z } from 'zod'

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
  tenantId: z.number(),
  email: z.string().email(),
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

export const RegisterUserResponseSchema = z.object({
  status: z.string(),
  data: z.object({
    user: z.object({
      username: z.string(),
      roleId: z.number(),
      active: z.boolean(),
      tenantId: z.number(),
    }),
  }),
})

export type RegisterUserResponse = z.infer<typeof RegisterUserResponseSchema>

export const RegisterUserSchema = z.object({
  username: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(6),
  confirmPassword: z.string().min(6),
  roleId: z.number(),
  tenantId: z.number(),
  isPasswordResetRequired: z.boolean().default(false),
})

export type RegisterUserRequest = z.infer<typeof RegisterUserSchema>

//customer
export const CustomerSchema = z.object({
  customerId: z.number().int().positive().optional(),
  customerName: z.string().min(1).max(100),
  email: z.string().email().max(50),
  phone: z.string().max(50).optional().nullable(),
  address: z.string().optional().nullable(),
  companyId: z.number().int(),
  createdBy: z.number().int(),
  createdAt: z.date().optional(),
  updatedBy: z.number().int().optional().nullable(),
  updatedAt: z.date().optional(),
})
export type CreateCustomerType = z.infer<typeof CustomerSchema>
export type GetCustomerType = z.infer<typeof CustomerSchema>

//tenant
export const tenantSchema = z.object({
  tenantId: z.number().optional(),
  tenantName: z.string().min(1).max(100),
  status: z.boolean().default(true),
  createdBy: z.number(),
  createdAt: z.date().optional(),
  updatedBy: z.number().nullable().optional(),
  updatedAt: z.date().nullable().optional(),
})
export type CreateTenantType = z.infer<typeof tenantSchema>
export type GetTenantType = z.infer<typeof tenantSchema>

export const businessUnitSchema = z.object({
  businessUnitId: z.number().nullable().optional(),
  companyId: z.number(),
  unitName: z.string(),
  unitCode: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  headEmployeeId: z.number().nullable().optional(),
  status: z.boolean().default(true),
  createdBy: z.number(),
  createdAt: z.date().nullable().optional(),
  updatedBy: z.number().nullable().optional(),
  updatedAt: z.date().nullable().optional(),
})
export type CreateBusinessUnitType = z.infer<typeof businessUnitSchema>
export type GetBusinessUnitType = z.infer<typeof businessUnitSchema> & {
  empCode: string
  empFullName: string
  departmentName: string
  designationName: string
  companyName: string
}

//departments
export const departmentSchema = z.object({
  departmentId: z.number().optional(),
  departmentName: z.string(),
  departmentCode: z.string().nullable().optional(),
  divisionId: z.number().nullable().optional(),
  parentDepartmentId: z.number().nullable().optional(),
  costCenterId: z.number().nullable().optional(),
  headEmployeeId: z.number().nullable().optional(),
  status: z.boolean().default(true).optional(),
  createdBy: z.number(),
  createdAt: z.date().optional(),
  updatedBy: z.number().nullable().optional(),
  updatedAt: z.date().optional(),
})
export type CreateDepartmentType = z.infer<typeof departmentSchema>
export type GetDepartmentType = z.infer<typeof departmentSchema> & {
  divisionName: string
  parentDepartmentName: string
  costCenterName: string
  headEmployeeName: string
  headEmployeeCode: string
}

//designations
export const designationSchema = z.object({
  designationId: z.number().optional(),
  designationName: z.string(),
  designationCode: z.string().nullable().optional(),
  jobLevel: z.number().nullable().optional(),
  description: z.string().nullable().optional(),
  status: z.boolean().default(true).optional(),
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
  code: z.string().max(50).nullable().optional(),
  companyName: z.string().max(100),
  shortName: z.string().max(50).nullable().optional(),
  tradeLicense: z.string().max(100).nullable().optional(),
  tin: z.string().max(50).nullable().optional(),
  bin: z.string().max(50).nullable().optional(),
  email: z.string().max(255).email().nullable().optional(),
  phone: z.string().max(50).nullable().optional(),
  address: z.string().nullable().optional(),
  logoUrl: z.string().max(500).nullable().optional(),
  timezone: z.string().max(100).default('UTC'),
  currency: z.string().length(3).default('USD'),
  status: z.boolean().default(true),
  createdBy: z.number().optional(),
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
  workStationNumber: z.number(),
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
  divisionCode: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  businessUnitId: z.number().nullable().optional(),
  headEmployeeId: z.number().nullable().optional(),
  status: z.boolean().default(true).optional(),
  createdBy: z.number(),
  createdAt: z.date().optional(),
  updatedBy: z.number().nullable().optional(),
  updatedAt: z.date().optional(),
})
export type CreateDivisionType = z.infer<typeof divisionSchema>
export type GetDivisionType = z.infer<typeof divisionSchema> & {
  businessUnitName: string
  empCode: string
  empFullName: string
  departmentName: string
  designationName: string
}

//employee type
export const employmentTypeSchema = z.object({
  employmentTypeId: z.number().optional(),
  employmentTypeName: z.string(),
  createdBy: z.number(),
  createdAt: z.date().optional(),
  updatedBy: z.number().nullable().optional(),
  updatedAt: z.date().optional(),
})
export type CreateEmploymentTypeType = z.infer<typeof employmentTypeSchema>
export type GetEmploymentTypeType = z.infer<typeof employmentTypeSchema>

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

//pre boarding
export const employeePreboardingSchema = z.object({
  preboardingId: z.number().optional(),
  fullName: z.string(),
  gender: z.enum(['Male', 'Female']),
  dob: z.string(),
  personalEmail: z.string(),
  personalPhone: z.string(),
  tentativeJoiningDate: z.string(),
  companyId: z.number(),
  departmentId: z.number(),
  designationId: z.number(),
  reportingAuthorityId: z.number(),
  employmentTypeId: z.number(),
  salaryStructureMasterId: z.number(),
  offeredSalary: z.number(),
  probationMonths: z.number(),
  status: z.boolean().default(false),
  createdBy: z.number(),
  createdAt: z.date().optional(),
  updatedBy: z.number().nullable().optional(),
  updatedAt: z.date().optional(),
})
export type CreateEmployeePreboardingType = z.infer<typeof employeePreboardingSchema>
export type GetEmployeePreboardingType = z.infer<typeof employeePreboardingSchema> & {
  preboardNo: string
  companyName: string
  departmentName: string
  designationName: string
  reportingAuthorityName: string
  employmentTypeName: string
  salaryStructureName: string
}

//checklist
export const ChecklistSchema = z.object({
  checklistMaster: z.object({
    checklistMasterId: z.number().optional().nullable(),
    checklistName: z.string(),
    heading: z.string().optional(),
    responsibleEmployeeId: z.number().optional(),
    responsibleEmployeeName: z.string().optional().nullable(), // only for get
    createdBy: z.number(),
    createdAt: z.coerce.date(),
    updatedBy: z.number().optional().nullable(),
    updatedAt: z.coerce.date().optional().nullable(),
  }),
  checklistDetails: z.array(
    z.object({
      checklistDetailsId: z.number().optional(),
      checklistDetailsName: z.string(),
      checklistMasterId: z.number().nullable(),
      responsibleEmployeeId: z.number(),
      responsibleEmployeeName: z.string().optional().nullable(), // only for get
      createdBy: z.number(),
      createdAt: z.coerce.date(),
      updatedBy: z.number().optional().nullable(),
      updatedAt: z.coerce.date().optional().nullable(),
    })
  ),
})
export type GetChecklistType = z.infer<typeof ChecklistSchema>
export type CreateChecklistType = z.infer<typeof ChecklistSchema>

//employee preboarding checklist
export const EmployeePreboardingChecklistSchema = z.object({
  employeePreboardingChecklistId: z.number().optional().nullable(),
  preboardingId: z.number(),
  checklistDetailsId: z.number(),
  responsibleEmployeeId: z.number(),
  completionDate: z.coerce.date(),
  status: z.boolean(),
  createdBy: z.number(),
  createdAt: z.date().optional(),
  updatedBy: z.number().nullable().optional(),
  updatedAt: z.date().optional(),
})
export type CreateEmployeePreboardingChecklistType = z.infer<typeof EmployeePreboardingChecklistSchema>
export type GetEmployeePreboardingChecklistType = z.infer<typeof EmployeePreboardingChecklistSchema> & {
  responsibleEmployeeName: string
  checklistDetailsName: string
}

export const notificationSchema = z.object({
  notificationId: z.number().optional(),
  employeeId: z.number(),
  notification: z.string().max(255),
  isRead: z.boolean().default(false),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
})
export type GetNotificationType = z.infer<typeof notificationSchema>

//employee
export const employeeSchema = z.object({
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
  employmentTypeId: z.number().int(),
  shiftId: z.number().int(),
  companyId: z.number().int(),
  workStationId: z.number().int(),
  divisionId: z.number().int(),
  costCenterId: z.number().int(),
  reportingAuthorityId: z.number().int().nullable(),

  // Additional fields from your service (not in original schema)
  shift: z.string().optional(), // This might be a string representation

  // For creating employee with leave types
  leaveTypeIds: z.array(z.number()).optional(),

  // Audit Fields
  createdBy: z.number(),
  createdAt: z.date().optional(),
  updatedBy: z.number().nullable().optional(),
  updatedAt: z.date().optional(),
})

export const createEmployeeSchema = z.object({
  employeeData: employeeSchema.omit({
    employeeId: true,
    createdAt: true,
    updatedAt: true,
  }),
  userData: z.object({
    username: z.string().min(1),
    password: z.string().min(6),
    confirmPassword: z.string().min(6),
    active: z.boolean().default(true),
    isPasswordResetRequired: z.boolean().default(false),
    roleId: z.number().int(),
    tenantId: z.number().int(),
    email: z.string().email(),
  }),
})

// For Update operations (all fields optional except ID)
export const updateEmployeeSchema = employeeSchema.partial().extend({
  employeeId: z.number().int().positive('Employee ID is required'),
})

// Type exports
export type CreateEmployeeType = z.infer<typeof createEmployeeSchema>
export type updateEmployeeType = z.infer<typeof updateEmployeeSchema>
export type GetEmployeeType = z.infer<typeof employeeSchema> & {
  departmentName: string
  designationName: string
  employmentTypeName: string
  companyName: string
  workStationName: string
  divisionName: string
  costCenterName: string
  reportingAuthorityName: string
  shiftName: string
  startTime: string
  endTime: string
}

//weekDay
export const weekDaySchema = z.object({
  weekDayId: z.number().optional(),
  day: z.string(),
})
export type GetWeekDayType = z.infer<typeof weekDaySchema>

//shift and week day
export const ShiftsSchema = z.object({
  shift: z.object({
    shiftId: z.number().optional(),
    companyId: z.number(),
    companyName: z.string().optional(), // only for get
    shiftName: z.string(),
    shiftCode: z.string(),
    shiftType: z.enum(['Fixed', 'Flexible', 'Rotational']),
    startTime: z.string(),
    endTime: z.string(),
    breakMinutes: z.number(),
    expectedWorkHours: z.number(),
    crossDay: z.boolean(),
    isFlexible: z.boolean(),
    flexibleInFrom: z.string().nullable(),
    flexibleInTo: z.string().nullable(),
    minimumHoursForPresent: z.number(),
    status: z.boolean(),
    createdBy: z.number().optional(),
    updatedBy: z.number().optional(),
  }),

  shiftDayAndWeekDays: z.array(
    z.object({
      weekDayId: z.number(),
      weekDay: z.string().optional(), // only for get
      dayType: z.enum(['FullDay', 'HalfDay', 'Weekend']),
      startTime: z.string().nullable().optional(),
      endTime: z.string().nullable().optional(),
      breakMinutes: z.number().optional(),
      expectedWorkHours: z.number().optional(),
      minimumHoursForPresent: z.number().optional(),
    })
  ),
})

export type GetShiftsType = z.infer<typeof ShiftsSchema>
export type CreateShiftType = z.infer<typeof ShiftsSchema>

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
  companyId: z.number(),
  code: z.string().min(1).max(20),
  name: z.string().min(1).max(100),
  category: z.enum(['Paid', 'Unpaid', 'Special']),
  genderApplicable: z.enum(['Male', 'Female', 'All']).nullable().optional(),
  religionApplicable: z.boolean().nullable().optional(),
  maritalStatusApplicable: z.boolean().nullable().optional(),
  maxDaysPerYear: z.number(),
  maxDaysPerRequest: z.number(),
  minDaysPerRequest: z.number(),
  allowHalfDay: z.boolean().optional(),
  allowHourly: z.boolean().optional(),
  attachmentRequired: z.boolean().optional(),
  attachmentAfterDays: z.number().nullable().optional(),
  carryForwardAllowed: z.boolean().optional(),
  maxCarryForwardDays: z.number().nullable().optional(),
  encashmentAllowed: z.boolean().optional(),
  negativeBalanceAllowed: z.boolean().optional(),
  sandwichPolicyApplicable: z.boolean().optional(),
  probationAllowed: z.boolean().optional(),
  noticePeriodAllowed: z.boolean().optional(),
  yearPeriod: z.number(),
  active: z.boolean().optional(),
  createdBy: z.number(),
  createdAt: z.date().optional(),
  updatedBy: z.number().nullable().optional(),
  updatedAt: z.date().optional(),
})
export type CreateLeaveTypeType = z.infer<typeof leaveTypeSchema>
export type GetLeaveTypeType = z.infer<typeof leaveTypeSchema> & {
  companyName: string
}

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

export const LeavePolicySchema = z.object({
  leavePolicyMaster: z.object({
    leavePolicyMasterId: z.number().optional().nullable(),
    companyId: z.number(),
    companyName: z.string().optional(), // only for get
    policyName: z.string(),
    effectiveFrom: z.coerce.date(),
    effectiveTo: z.coerce.date().optional().nullable(),
    description: z.string().optional().nullable(),
    active: z.boolean(),
    createdBy: z.number(),
    createdAt: z.coerce.date(),
    updatedBy: z.number().optional().nullable(),
    updatedAt: z.coerce.date().optional().nullable(),
  }),
  leavePolicyDetails: z.array(
    z.object({
      leavePolicyDetailsId: z.number().optional(),
      leavePolicyMasterId: z.number().nullable().optional(),
      leaveTypeId: z.number(),
      leaveTypeName: z.string().optional(), // only for get
      yearlyAllocation: z.number(),
      accrualFrequency: z.enum(['Monthly', 'Quarterly', 'Yearly']),
      accrualRate: z.number(),
      maxBalanceAllowed: z.number(),
      carryForwardLimit: z.number(),
      active: z.boolean(),
      createdBy: z.number(),
      createdAt: z.coerce.date(),
      updatedBy: z.number().optional().nullable(),
      updatedAt: z.coerce.date().optional().nullable(),
    })
  ),
})
export type GetLeavePolicyType = z.infer<typeof LeavePolicySchema>
export type CreateLeavePolicyType = z.infer<typeof LeavePolicySchema>

export const EmployeeLeaveAssignmentSchema = z.object({
  employeeLeaveAssignmentId: z.number().optional(),
  employeeId: z.number(),
  leavePolicyMasterId: z.number(),
  effectiveFrom: z.coerce.date(),
  effectiveTo: z.coerce.date().optional().nullable(),
  active: z.boolean().default(true),
  createdBy: z.number(),
  createdAt: z.date().optional(),
  updatedBy: z.number().optional().nullable(),
  updatedAt: z.date().optional().nullable(),
})
export type CreateEmployeeLeaveAssignmentType = z.infer<
  typeof EmployeeLeaveAssignmentSchema
>
export type GetEmployeeLeaveAssignmentType = z.infer<
  typeof EmployeeLeaveAssignmentSchema
> & {
  employeeName: string
  empCode: string
  designationName: string
  departmentName: string
  policyName: string
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

export const salaryComponentSchema = z.object({
  salaryComponentId: z.number().optional(),
  componentName: z.string(),
  componentCode: z.string().max(20),
  calculationType: z.enum(['Fixed', 'Percentage', 'Formula']),
  amount: z.number().optional(),
  percentage: z.number().optional(),
  formulaExpression: z.string().max(255).optional(),
  taxable: z.boolean().default(false),
  componentType: z.enum(['Allowance', 'Deduction']),
  affectGross: z.boolean().default(false),
  affectNet: z.boolean().default(false),
  sequenceNo: z.number(),
  createdBy: z.number(),
  createdAt: z.date().optional(),
  updatedBy: z.number().nullable().optional(),
  updatedAt: z.date().optional(),
})
export type CreateSalaryComponentType = z.infer<
  typeof salaryComponentSchema
>
export type GetSalaryComponentType = z.infer<
  typeof salaryComponentSchema
>

export const SalaryStructureSchema = z.object({
  salaryStructureMaster: z.object({
    salaryStructureMasterId: z.number().optional().nullable(),
    structureName: z.string(),
    structureCode: z.string().optional().nullable(),
    companyId: z.number(),
    companyName: z.string().optional(), // only for get
    structureType: z.enum(['Earning', 'Deduction']),
    effectiveFrom: z.coerce.date(),
    effectiveTo: z.coerce.date().optional().nullable(),
    active: z.boolean(),
    createdBy: z.number(),
    createdAt: z.coerce.date(),
    updatedBy: z.number().optional().nullable(),
    updatedAt: z.coerce.date().optional().nullable(),
  }),
  salaryStructureDetails: z.array(
    z.object({
      salaryStructureDetailId: z.number().optional(),
      salaryStructureMasterId: z.number().optional().nullable(),
      salaryComponentId: z.number(),
      salaryComponentName: z.string().optional(), // only for get
      amount: z.number(),
      percentage: z.number().optional().nullable(),
      formulaExpression: z.string().optional().nullable(),
      calculationOrder: z.number(),
      mandatory: z.boolean(),
      createdBy: z.number(),
      createdAt: z.coerce.date(),
      updatedBy: z.number().optional().nullable(),
      updatedAt: z.coerce.date().optional().nullable(),
    })
  ),
})
export type GetSalaryStructureType = z.infer<typeof SalaryStructureSchema>
export type CreateSalaryStructureType = z.infer<typeof SalaryStructureSchema>

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
      salaryComponentId: z.number(),
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

export const employeeSalaryComponentSchema = z.object({
  employeeSalaryComponentId: z.number().optional(),
  employeeId: z.number(),
  salaryComponentId: z.number(),
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
export type CreateEmployeeSalaryComponentType = z.infer<
  typeof employeeSalaryComponentSchema
>
export type GetEmployeeSalaryComponentType = z.infer<
  typeof employeeSalaryComponentSchema
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
        employeeSalaryComponentId: z.number(),
        salaryComponentId: z.number(),
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
