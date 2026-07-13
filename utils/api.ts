import { fetchApi, fetchApiWithFile } from '@/utils/http'
import {
  AssignLeaveTypeType,
  CreateDepartmentType,
  CreateDesignationType,
  CreateEmployeeAttendanceType,
  CreateEmployeeLeaveType,
  CreateEmployeeSalaryComponentType,
  CreateEmployeeType,
  CreateEmploymentTypeType,
  CreateHolidayType,
  CreateLeaveTypeType,
  CreateEmployeeLoneType,
  CreateShiftType,
  CreateSalaryComponentType,
  CreateSalaryType,
  GetDepartmentType,
  GetDesignationType,
  GetEmployeeAttendanceType,
  GetEmployeeLeaveType,
  GetEmployeeSalaryComponentType,
  GetEmployeeType,
  GetEmploymentTypeType,
  GetHolidayType,
  GetLeaveTypeType,
  GetEmployeeLoneType,
  GetShiftsType,
  GetSalaryComponentType,
  GetSalaryType,
  GetWeekDayType,
  SignInRequest,
  SignInResponse,
  SignInResponseSchema,
  GetEmployeeLeaveTypeType,
  GetEmployeeLeaveSummaryType,
  GetEmployeeAttendanceSummaryType,
  GetCostCenterType,
  CreateCostCenterType,
  GetDivisionType,
  CreateDivisionType,
  GetCompanyType,
  CreateCompanyType,
  GetWorkStationType,
  CreateWorkStationType,
  GetTenantType,
  CreateTenantType,
  RegisterUserResponse,
  RegisterUserResponseSchema,
  GetCustomerType,
  CreateCustomerType,
  GetBusinessUnitType,
  CreateBusinessUnitType,
  GetLeavePolicyType,
  CreateLeavePolicyType,
  GetEmployeeLeaveAssignmentType,
  CreateEmployeeLeaveAssignmentType,
  GetSalaryStructureType,
  CreateSalaryStructureType,
  GetEmployeePreboardingType,
  CreateEmployeePreboardingType,
  GetChecklistType,
  CreateChecklistType,
  CreateEmployeePreboardingChecklistType,
  GetEmployeePreboardingChecklistType,
  GetNotificationType,
  GetAssetCategoryType,
  CreateAssetCategoryType,
  GetAssetType,
  CreateAssetType,
  CreateAssetTransactionType,
  GetAssetTransactionType,
  GetAttendancePolicyType,
  CreateAttendancePolicyType,
  GetEmployeeActivityHistoryReport,
  GetShiftAllocationType,
  CreateShiftAllocationType,
  CreateBulkShiftAllocationType,
  UpdateRecurrenceType,
  AttendanceSummaryType,
  DailyAttendanceType,
  GetHolidayCalendarType,
  CreateHolidayCalendarType,
  GetNewHolidayType,
  CreateNewHolidayType,
  ProcessAttendanceDateType,
  ProcessAttendanceResultType,
  ProcessAttendanceRangeType,
  ProcessAttendanceRangeResultType,
  AttendanceAuditResponseType,
  GetAttendanceDailyType,
  CreateAttendanceDailyType,
  UpdateAttendanceDailyType,
  GetEmployeeLeaveApply,
  CreateEmployeeLeaveApply,
  GetEmployeeLeaveBalanceSummaryReport,
  GetEmployeeLeaveLedgerReport,
  GetShiftReportType,
  UploadAttendanceType,
} from '@/utils/type'

export async function getAllRoles(token: string) {
  return fetchApi<{ roleId: number; roleName: string }[]>({
    url: 'api/roles/getall',
    method: 'GET',
    headers: {
      Authorization: token,
      'Content-Type': 'application/json',
    },
  })
}

export async function signIn(credentials: SignInRequest) {
  return fetchApi<SignInResponse>({
    url: 'api/auth/login',
    method: 'POST',
    body: credentials,
    schema: SignInResponseSchema,
  })
}

export async function registerUser(credentials: SignInRequest) {
  return fetchApi<RegisterUserResponse>({
    url: 'api/auth/register',
    method: 'POST',
    body: credentials,
    schema: RegisterUserResponseSchema,
  })
}

//customers
export async function getAllCustomers(token: string) {
  return fetchApi<GetCustomerType[]>({
    url: 'api/customers/getall',
    method: 'GET',
    headers: {
      Authorization: token,
      'Content-Type': 'application/json',
    },
  })
}

export async function createCustomer(data: CreateCustomerType, token: string) {
  return fetchApi<CreateCustomerType>({
    url: 'api/customers/create',
    method: 'POST',
    body: data,
    headers: {
      Authorization: token,
      'Content-Type': 'application/json',
    },
  })
}

export async function editCustomer(
  id: number,
  data: GetCustomerType,
  token: string
) {
  return fetchApi<GetCustomerType>({
    url: `api/customers/edit/${id}`,
    method: 'PATCH',
    body: data,
    headers: {
      Authorization: `${token}`,
      'Content-Type': 'application/json',
    },
  })
}

export async function deleteCustomer(id: number, token: string) {
  return fetchApi<{ id: number }>({
    url: `api/customers/delete/${id}`,
    method: 'DELETE',
    headers: {
      Authorization: token,
      'Content-Type': 'application/json',
    },
  })
}

//business units
export async function getAllBusinessUnits(token: string) {
  return fetchApi<GetBusinessUnitType[]>({
    url: 'api/business-units/getall',
    method: 'GET',
    headers: {
      Authorization: token,
      'Content-Type': 'application/json',
    },
  })
}

export async function createBusinessUnit(
  data: CreateBusinessUnitType,
  token: string
) {
  return fetchApi<CreateBusinessUnitType>({
    url: 'api/business-units/create',
    method: 'POST',
    body: data,
    headers: {
      Authorization: token,
      'Content-Type': 'application/json',
    },
  })
}

export async function editBusinessUnit(
  id: number,
  data: GetBusinessUnitType,
  token: string
) {
  return fetchApi<GetBusinessUnitType>({
    url: `api/business-units/edit/${id}`,
    method: 'PATCH',
    body: data,
    headers: {
      Authorization: `${token}`,
      'Content-Type': 'application/json',
    },
  })
}

export async function deleteBusinessUnit(id: number, token: string) {
  return fetchApi<{ id: number }>({
    url: `api/business-units/delete/${id}`,
    method: 'DELETE',
    headers: {
      Authorization: token,
      'Content-Type': 'application/json',
    },
  })
}

//tenants
export async function getAllTenants(token: string) {
  return fetchApi<GetTenantType[]>({
    url: 'api/tenants/getall',
    method: 'GET',
    headers: {
      Authorization: token,
      'Content-Type': 'application/json',
    },
  })
}

export async function createTenant(data: CreateTenantType, token: string) {
  return fetchApi<CreateTenantType>({
    url: 'api/tenants/create',
    method: 'POST',
    body: data,
    headers: {
      Authorization: token,
      'Content-Type': 'application/json',
    },
  })
}

export async function editTenant(
  id: number,
  data: GetTenantType,
  token: string
) {
  return fetchApi<GetTenantType>({
    url: `api/tenants/edit/${id}`,
    method: 'PATCH',
    body: data,
    headers: {
      Authorization: `${token}`,
      'Content-Type': 'application/json',
    },
  })
}

export async function deleteTenant(id: number, token: string) {
  return fetchApi<{ id: number }>({
    url: `api/tenants/delete/${id}`,
    method: 'DELETE',
    headers: {
      Authorization: token,
      'Content-Type': 'application/json',
    },
  })
}

//department
export async function getAllDepartments(token: string) {
  return fetchApi<GetDepartmentType[]>({
    url: 'api/departments/getall',
    method: 'GET',
    headers: {
      Authorization: token,
      'Content-Type': 'application/json',
    },
  })
}

export async function createDepartment(
  data: CreateDepartmentType,
  token: string
) {
  return fetchApi<CreateDepartmentType>({
    url: 'api/departments/create',
    method: 'POST',
    body: data,
    headers: {
      Authorization: token,
      'Content-Type': 'application/json',
    },
  })
}

export async function editDepartment(
  id: number,
  data: GetDepartmentType,
  token: string
) {
  return fetchApi<GetDepartmentType>({
    url: `api/departments/edit/${id}`,
    method: 'PATCH',
    body: data,
    headers: {
      Authorization: `${token}`,
      'Content-Type': 'application/json',
    },
  })
}

export async function deleteDepartment(id: number, token: string) {
  return fetchApi<{ id: number }>({
    url: `api/departments/delete/${id}`,
    method: 'DELETE',
    headers: {
      Authorization: token,
      'Content-Type': 'application/json',
    },
  })
}

//designation
export async function getAllDesignations(token: string) {
  return fetchApi<GetDesignationType[]>({
    url: 'api/designations/getall',
    method: 'GET',
    headers: {
      Authorization: token,
      'Content-Type': 'application/json',
    },
  })
}

export async function createDesignation(
  data: CreateDesignationType,
  token: string
) {
  return fetchApi<CreateDesignationType>({
    url: 'api/designations/create',
    method: 'POST',
    body: data,
    headers: {
      Authorization: token,
      'Content-Type': 'application/json',
    },
  })
}

export async function editDesignation(
  id: number,
  data: GetDesignationType,
  token: string
) {
  return fetchApi<GetDesignationType>({
    url: `api/designations/edit/${id}`,
    method: 'PATCH',
    body: data,
    headers: {
      Authorization: `${token}`,
      'Content-Type': 'application/json',
    },
  })
}

export async function deleteDesignation(id: number, token: string) {
  return fetchApi<{ id: number }>({
    url: `api/designations/delete/${id}`,
    method: 'DELETE',
    headers: {
      Authorization: token,
      'Content-Type': 'application/json',
    },
  })
}

// Company API Functions
export async function getAllCompanies(token: string) {
  return fetchApi<GetCompanyType[]>({
    url: 'api/company/getall',
    method: 'GET',
    headers: {
      Authorization: token,
      'Content-Type': 'application/json',
    },
  })
}

export async function createCompany(formData: FormData, token: string) {
  return fetchApiWithFile<CreateCompanyType>({
    url: 'api/company/create',
    method: 'POST',
    body: formData,
    headers: {
      Authorization: token,
    },
  })
}

export async function editCompany(
  id: number,
  formData: FormData,
  token: string
) {
  return fetchApiWithFile<GetCompanyType>({
    url: `api/company/edit/${id}`,
    method: 'PATCH',
    body: formData,
    headers: {
      Authorization: `${token}`,
    },
  })
}

export async function deleteCompany(id: number, token: string) {
  return fetchApi<{ id: number }>({
    url: `api/company/delete/${id}`,
    method: 'DELETE',
    headers: {
      Authorization: token,
      'Content-Type': 'application/json',
    },
  })
}

// Work Station API Functions
export async function getAllWorkStations(token: string) {
  return fetchApi<GetWorkStationType[]>({
    url: 'api/workstations/getall',
    method: 'GET',
    headers: {
      Authorization: token,
      'Content-Type': 'application/json',
    },
  })
}

export async function createWorkStation(
  data: CreateWorkStationType,
  token: string
) {
  return fetchApi<CreateWorkStationType>({
    url: 'api/workstations/create',
    method: 'POST',
    body: data,
    headers: {
      Authorization: token,
      'Content-Type': 'application/json',
    },
  })
}

export async function editWorkStation(
  id: number,
  data: GetWorkStationType,
  token: string
) {
  return fetchApi<GetWorkStationType>({
    url: `api/workstations/edit/${id}`,
    method: 'PATCH',
    body: data,
    headers: {
      Authorization: `${token}`,
      'Content-Type': 'application/json',
    },
  })
}

export async function deleteWorkStation(id: number, token: string) {
  return fetchApi<{ id: number }>({
    url: `api/workstations/delete/${id}`,
    method: 'DELETE',
    headers: {
      Authorization: token,
      'Content-Type': 'application/json',
    },
  })
}

// Division API Functions
export async function getAllDivisions(token: string) {
  return fetchApi<GetDivisionType[]>({
    url: 'api/divisions/getall',
    method: 'GET',
    headers: {
      Authorization: token,
      'Content-Type': 'application/json',
    },
  })
}

// Division API Functions
export async function createDivision(data: CreateDivisionType, token: string) {
  return fetchApi<CreateDivisionType>({
    url: 'api/divisions/create',
    method: 'POST',
    body: data,
    headers: {
      Authorization: token,
      'Content-Type': 'application/json',
    },
  })
}

export async function editDivision(
  id: number,
  data: GetDivisionType,
  token: string
) {
  return fetchApi<GetDivisionType>({
    url: `api/divisions/edit/${id}`,
    method: 'PATCH',
    body: data,
    headers: {
      Authorization: `${token}`,
      'Content-Type': 'application/json',
    },
  })
}

export async function deleteDivision(id: number, token: string) {
  return fetchApi<{ id: number }>({
    url: `api/divisions/delete/${id}`,
    method: 'DELETE',
    headers: {
      Authorization: token,
      'Content-Type': 'application/json',
    },
  })
}

// Cost Center API Functions
export async function getAllCostCenters(token: string) {
  return fetchApi<GetCostCenterType[]>({
    url: 'api/costcenters/getall',
    method: 'GET',
    headers: {
      Authorization: token,
      'Content-Type': 'application/json',
    },
  })
}

export async function createCostCenter(
  data: CreateCostCenterType,
  token: string
) {
  return fetchApi<CreateCostCenterType>({
    url: 'api/costcenters/create',
    method: 'POST',
    body: data,
    headers: {
      Authorization: token,
      'Content-Type': 'application/json',
    },
  })
}

export async function editCostCenter(
  id: number,
  data: GetCostCenterType,
  token: string
) {
  return fetchApi<GetCostCenterType>({
    url: `api/costcenters/edit/${id}`,
    method: 'PATCH',
    body: data,
    headers: {
      Authorization: `${token}`,
      'Content-Type': 'application/json',
    },
  })
}

export async function deleteCostCenter(id: number, token: string) {
  return fetchApi<{ id: number }>({
    url: `api/costcenters/delete/${id}`,
    method: 'DELETE',
    headers: {
      Authorization: token,
      'Content-Type': 'application/json',
    },
  })
}

//employee type
export async function getAllEmploymentTypes(token: string) {
  return fetchApi<GetEmploymentTypeType[]>({
    url: 'api/employmentTypes/getall',
    method: 'GET',
    headers: {
      Authorization: token,
      'Content-Type': 'application/json',
    },
  })
}

export async function createEmploymentType(
  data: CreateEmploymentTypeType,
  token: string
) {
  return fetchApi<CreateEmploymentTypeType>({
    url: 'api/employmentTypes/create',
    method: 'POST',
    body: data,
    headers: {
      Authorization: token,
      'Content-Type': 'application/json',
    },
  })
}

export async function editEmploymentType(
  id: number,
  data: GetEmploymentTypeType,
  token: string
) {
  return fetchApi<GetEmploymentTypeType>({
    url: `api/employmentTypes/edit/${id}`,
    method: 'PATCH',
    body: data,
    headers: {
      Authorization: `${token}`,
      'Content-Type': 'application/json',
    },
  })
}

export async function deleteEmploymentType(id: number, token: string) {
  return fetchApi<{ id: number }>({
    url: `api/employmentTypes/delete/${id}`,
    method: 'DELETE',
    headers: {
      Authorization: token,
      'Content-Type': 'application/json',
    },
  })
}

//weekDays
export async function getAllWeekDays(token: string) {
  return fetchApi<GetWeekDayType[]>({
    url: 'api/weekDays/getall',
    method: 'GET',
    headers: {
      Authorization: token,
      'Content-Type': 'application/json',
    },
  })
}

//shift weekDays
export async function getAllShiftDayAndWeekDays(token: string) {
  return fetchApi<GetShiftsType[]>({
    url: 'api/shift/getall',
    method: 'GET',
    headers: {
      Authorization: token,
      'Content-Type': 'application/json',
    },
  })
}

export async function createShiftDayAndWeekDays(
  data: CreateShiftType,
  token: string
) {
  return fetchApi<CreateShiftType>({
    url: 'api/shift/create',
    method: 'POST',
    body: data,
    headers: {
      Authorization: token,
      'Content-Type': 'application/json',
    },
  })
}

export async function editShiftDayAndWeekDays(
  id: number,
  data: GetShiftsType,
  token: string
) {
  return fetchApi<GetShiftsType>({
    url: `api/shift/edit/${id}`,
    method: 'PATCH',
    body: data,
    headers: {
      Authorization: `${token}`,
      'Content-Type': 'application/json',
    },
  })
}

export async function deleteShiftDayAndWeekDays(id: number, token: string) {
  return fetchApi<{ id: number }>({
    url: `api/shift/delete/${id}`,
    method: 'DELETE',
    headers: {
      Authorization: token,
      'Content-Type': 'application/json',
    },
  })
}

//employee preboarding
export async function getAllEmployeePreboardings(token: string) {
  return fetchApi<GetEmployeePreboardingType[]>({
    url: 'api/employeePreboarding/getall',
    method: 'GET',
    headers: {
      Authorization: token,
      'Content-Type': 'application/json',
    },
  })
}

export async function getEmployeePreboardingById(token: string, id: number) {
  return fetchApi<GetEmployeePreboardingType>({
    url: `api/employeePreboarding/getPreboarding/${id}`,
    method: 'GET',
    headers: {
      Authorization: token,
      'Content-Type': 'application/json',
    },
  })
}

export async function createEmployeePreboarding(
  data: CreateEmployeePreboardingType,
  token: string
) {
  return fetchApi<CreateEmployeePreboardingType>({
    url: 'api/employeePreboarding/create',
    method: 'POST',
    body: data,
    headers: {
      Authorization: token,
      'Content-Type': 'application/json',
    },
  })
}

export async function editEmployeePreboarding(
  id: number,
  data: GetEmployeePreboardingType,
  token: string
) {
  return fetchApi<GetEmployeePreboardingType>({
    url: `api/employeePreboarding/edit/${id}`,
    method: 'PATCH',
    body: data,
    headers: {
      Authorization: `${token}`,
      'Content-Type': 'application/json',
    },
  })
}

export async function deleteEmployeePreboarding(id: number, token: string) {
  return fetchApi<{ id: number }>({
    url: `api/employeePreboarding/delete/${id}`,
    method: 'DELETE',
    headers: {
      Authorization: token,
      'Content-Type': 'application/json',
    },
  })
}

//assign checklist to preboarding employee
export async function createPreboardingEmployeeChecklist(
  data: CreateEmployeePreboardingChecklistType,
  token: string
) {
  return fetchApi<CreateEmployeePreboardingChecklistType>({
    url: 'api/employeePreboarding/assign',
    method: 'POST',
    body: data,
    headers: {
      Authorization: token,
      'Content-Type': 'application/json',
    },
  })
}

//edit assigned checklist to preboarding employee
export async function editEmployeePreboardingChecklist(
  id: number,
  data: GetEmployeePreboardingChecklistType,
  token: string
) {
  return fetchApi<GetEmployeePreboardingChecklistType>({
    url: `api/employeePreboarding/edit/${id}`,
    method: 'PATCH',
    body: data,
    headers: {
      Authorization: `${token}`,
      'Content-Type': 'application/json',
    },
  })
}

// get assigned checklist by preboarding employee id
export async function getPreboardingEmployeeChecklistsById(
  token: string,
  id: number
) {
  return fetchApi<GetEmployeePreboardingChecklistType>({
    url: `api/employeePreboarding/getChecklists/${id}`,
    method: 'GET',
    headers: {
      Authorization: token,
      'Content-Type': 'application/json',
    },
  })
}

// get assigned checklist by user id
export async function getPreboardingEmployeeChecklistsByUserId(
  token: string,
  userId: number
) {
  return fetchApi<GetEmployeePreboardingChecklistType>({
    url: `api/employeePreboarding/getAssignedChecklistsByUser/${userId}`,
    method: 'GET',
    headers: {
      Authorization: token,
      'Content-Type': 'application/json',
    },
  })
}

export async function completeEmployeePreboardingChecklist(
  data: {
    employeePreboardingChecklistId: number
    completionDate: string | Date
  },
  token: string
) {
  return fetchApi<number>({
    url: 'api/employeePreboarding/completeChecklist/',
    method: 'PATCH',
    body: data,
    headers: {
      Authorization: `${token}`,
      'Content-Type': 'application/json',
    },
  })
}

export async function getAllAssetCategories(token: string) {
  return fetchApi<GetAssetCategoryType[]>({
    url: 'api/assetCategory/getall',
    method: 'GET',
    headers: {
      Authorization: token,
      'Content-Type': 'application/json',
    },
  })
}

export async function getAssetCategoryById(token: string, id: number) {
  return fetchApi<GetAssetCategoryType>({
    url: `api/assetCategory/getPreboarding/${id}`,
    method: 'GET',
    headers: {
      Authorization: token,
      'Content-Type': 'application/json',
    },
  })
}

export async function createAssetCategory(
  data: CreateAssetCategoryType,
  token: string
) {
  return fetchApi<CreateAssetCategoryType>({
    url: 'api/assetCategory/create',
    method: 'POST',
    body: data,
    headers: {
      Authorization: token,
      'Content-Type': 'application/json',
    },
  })
}

export async function editAssetCategory(
  id: number,
  data: GetAssetCategoryType,
  token: string
) {
  return fetchApi<GetAssetCategoryType>({
    url: `api/assetCategory/edit/${id}`,
    method: 'PATCH',
    body: data,
    headers: {
      Authorization: `${token}`,
      'Content-Type': 'application/json',
    },
  })
}

export async function deleteAssetCategory(id: number, token: string) {
  return fetchApi<{ id: number }>({
    url: `api/assetCategory/delete/${id}`,
    method: 'DELETE',
    headers: {
      Authorization: token,
      'Content-Type': 'application/json',
    },
  })
}

//assets
export async function getAllAssets(token: string) {
  return fetchApi<GetAssetType[]>({
    url: 'api/assets/getall',
    method: 'GET',
    headers: {
      Authorization: token,
      'Content-Type': 'application/json',
    },
  })
}

export async function getLatestAssetTransactions(token: string) {
  return fetchApi<GetAssetTransactionType[]>({
    url: 'api/assets/getLatestTransactions',
    method: 'GET',
    headers: {
      Authorization: token,
      'Content-Type': 'application/json',
    },
  })
}

export async function getAssetById(token: string, id: number) {
  return fetchApi<GetAssetType>({
    url: `api/assets/getPreboarding/${id}`,
    method: 'GET',
    headers: {
      Authorization: token,
      'Content-Type': 'application/json',
    },
  })
}

export async function createAsset(data: CreateAssetType, token: string) {
  return fetchApi<CreateAssetType>({
    url: 'api/assets/create',
    method: 'POST',
    body: data,
    headers: {
      Authorization: token,
      'Content-Type': 'application/json',
    },
  })
}

export async function editAsset(id: number, data: GetAssetType, token: string) {
  return fetchApi<GetAssetType>({
    url: `api/assets/edit/${id}`,
    method: 'PATCH',
    body: data,
    headers: {
      Authorization: `${token}`,
      'Content-Type': 'application/json',
    },
  })
}

export async function deleteAsset(id: number, token: string) {
  return fetchApi<{ id: number }>({
    url: `api/assets/delete/${id}`,
    method: 'DELETE',
    headers: {
      Authorization: token,
      'Content-Type': 'application/json',
    },
  })
}

//assign asset to employee
export async function assignAsset(
  data: CreateAssetTransactionType,
  token: string
) {
  return fetchApi<CreateAssetTransactionType>({
    url: 'api/assets/assign',
    method: 'POST',
    body: data,
    headers: {
      Authorization: token,
      'Content-Type': 'application/json',
    },
  })
}

export async function editAssignedAsset(
  token: string,
  assetTransactionId: number,
  data: GetAssetTransactionType
) {
  return fetchApi<GetAssetTransactionType>({
    url: `api/assets/assign/edit/${assetTransactionId}`,
    method: 'PATCH',
    body: data,
    headers: {
      Authorization: token,
      'Content-Type': 'application/json',
    },
  })
}

//notifications
export async function getNotificationsById(token: string, id: number) {
  return fetchApi<GetNotificationType>({
    url: `api/notifications/get/${id}`,
    method: 'GET',
    headers: {
      Authorization: token,
      'Content-Type': 'application/json',
    },
  })
}

export async function markAsRead(data: number[], token: string) {
  return fetchApi<number[]>({
    url: 'api/notifications/markAsRead',
    method: 'PATCH',
    body: data,
    headers: {
      Authorization: `${token}`,
      'Content-Type': 'application/json',
    },
  })
}

//checklist
export async function getAllChecklists(token: string) {
  return fetchApi<GetChecklistType[]>({
    url: 'api/checklists/getall',
    method: 'GET',
    headers: {
      Authorization: token,
      'Content-Type': 'application/json',
    },
  })
}

export async function createChecklist(
  data: CreateChecklistType,
  token: string
) {
  return fetchApi<CreateChecklistType>({
    url: 'api/checklists/create',
    method: 'POST',
    body: data,
    headers: {
      Authorization: token,
      'Content-Type': 'application/json',
    },
  })
}

export async function editChecklist(
  id: number,
  data: GetChecklistType,
  token: string
) {
  return fetchApi<GetChecklistType>({
    url: `api/checklists/edit/${id}`,
    method: 'PATCH',
    body: data,
    headers: {
      Authorization: `${token}`,
      'Content-Type': 'application/json',
    },
  })
}

export async function deleteChecklist(id: number, token: string) {
  return fetchApi<{ id: number }>({
    url: `api/checklists/delete/${id}`,
    method: 'DELETE',
    headers: {
      Authorization: token,
      'Content-Type': 'application/json',
    },
  })
}

//employee
export async function getAllEmployees(token: string) {
  return fetchApi<GetEmployeeType[]>({
    url: 'api/employees/getall',
    method: 'GET',
    headers: {
      Authorization: token,
      'Content-Type': 'application/json',
    },
  })
}

export async function getEmployeeById(token: string, id: number) {
  return fetchApi<GetEmployeeType>({
    url: `api/employees/getById/${id}`,
    method: 'GET',
    headers: {
      Authorization: token,
      'Content-Type': 'application/json',
    },
  })
}

export async function getEmpIdByUserId(token: string, userId: number) {
  return fetchApi<number>({
    url: `api/employees/getEmpIdByUserId/${userId}`,
    method: 'GET',
    headers: {
      Authorization: token,
      'Content-Type': 'application/json',
    },
  })
}

export async function createEmployee(formData: FormData, token: string) {
  console.log('🚀 ~ createEmployee ~ formData:', formData)
  return fetchApiWithFile<CreateEmployeeType>({
    url: 'api/employees/create',
    method: 'POST',
    body: formData,
    headers: {
      Authorization: token,
    },
  })
}

export async function editEmployee(
  id: number,
  formData: FormData,
  token: string
) {
  return fetchApiWithFile<GetEmployeeType>({
    url: `api/employees/edit/${id}`,
    method: 'PATCH',
    body: formData,
    headers: {
      Authorization: `${token}`,
    },
  })
}

export async function deleteEmployee(id: number, token: string) {
  return fetchApi<{ id: number }>({
    url: `api/employees/delete/${id}`,
    method: 'DELETE',
    headers: {
      Authorization: token,
      'Content-Type': 'application/json',
    },
  })
}

export async function assignLeaveType(
  data: AssignLeaveTypeType,
  token: string
) {
  return fetchApi<AssignLeaveTypeType>({
    url: `api/employees/assignLeaveType`,
    method: 'PATCH',
    body: data,
    headers: {
      Authorization: `${token}`,
      'Content-Type': 'application/json',
    },
  })
}

//holidays
export async function getAllHolidays(token: string) {
  return fetchApi<GetHolidayType[]>({
    url: 'api/holidays/getall',
    method: 'GET',
    headers: {
      Authorization: token,
      'Content-Type': 'application/json',
    },
  })
}

export async function createHoliday(data: CreateHolidayType, token: string) {
  return fetchApi<CreateHolidayType>({
    url: 'api/holidays/create',
    method: 'POST',
    body: data,
    headers: {
      Authorization: token,
      'Content-Type': 'application/json',
    },
  })
}

export async function editHoliday(
  id: number,
  data: GetHolidayType,
  token: string
) {
  return fetchApi<GetHolidayType>({
    url: `api/holidays/edit/${id}`,
    method: 'PATCH',
    body: data,
    headers: {
      Authorization: `${token}`,
      'Content-Type': 'application/json',
    },
  })
}

export async function deleteHoliday(id: number, token: string) {
  return fetchApi<{ id: number }>({
    url: `api/holidays/delete/${id}`,
    method: 'DELETE',
    headers: {
      Authorization: token,
      'Content-Type': 'application/json',
    },
  })
}

//leave type
export async function getAllLeaveTypes(token: string) {
  return fetchApi<GetLeaveTypeType[]>({
    url: 'api/leaveTypes/getall',
    method: 'GET',
    headers: {
      Authorization: token,
      'Content-Type': 'application/json',
    },
  })
}

export async function createLeaveType(
  data: CreateLeaveTypeType,
  token: string
) {
  return fetchApi<CreateLeaveTypeType>({
    url: 'api/leaveTypes/create',
    method: 'POST',
    body: data,
    headers: {
      Authorization: token,
      'Content-Type': 'application/json',
    },
  })
}

export async function editLeaveType(
  id: number,
  data: GetLeaveTypeType,
  token: string
) {
  return fetchApi<GetLeaveTypeType>({
    url: `api/leaveTypes/edit/${id}`,
    method: 'PATCH',
    body: data,
    headers: {
      Authorization: `${token}`,
      'Content-Type': 'application/json',
    },
  })
}

export async function deleteLeaveType(id: number, token: string) {
  return fetchApi<{ id: number }>({
    url: `api/leaveTypes/delete/${id}`,
    method: 'DELETE',
    headers: {
      Authorization: token,
      'Content-Type': 'application/json',
    },
  })
}

//leave policy
export async function getAllLeavePolicies(token: string) {
  return fetchApi<GetLeavePolicyType[]>({
    url: 'api/leavePolicy/getall',
    method: 'GET',
    headers: {
      Authorization: token,
      'Content-Type': 'application/json',
    },
  })
}

export async function createLeavePolicy(
  data: CreateLeavePolicyType,
  token: string
) {
  return fetchApi<CreateLeavePolicyType>({
    url: 'api/leavePolicy/create',
    method: 'POST',
    body: data,
    headers: {
      Authorization: token,
      'Content-Type': 'application/json',
    },
  })
}

export async function editLeavePolicy(
  id: number,
  data: GetLeavePolicyType,
  token: string
) {
  return fetchApi<GetLeavePolicyType>({
    url: `api/leavePolicy/edit/${id}`,
    method: 'PATCH',
    body: data,
    headers: {
      Authorization: `${token}`,
      'Content-Type': 'application/json',
    },
  })
}

export async function deleteLeavePolicy(id: number, token: string) {
  return fetchApi<{ id: number }>({
    url: `api/leavePolicy/delete/${id}`,
    method: 'DELETE',
    headers: {
      Authorization: token,
      'Content-Type': 'application/json',
    },
  })
}

//employee leave assignment
export async function getAllEmployeeLeaveAssignments(token: string) {
  return fetchApi<GetEmployeeLeaveAssignmentType[]>({
    url: 'api/employeeLeaveAssignments/getall',
    method: 'GET',
    headers: {
      Authorization: token,
      'Content-Type': 'application/json',
    },
  })
}

export async function createEmployeeLeaveAssignment(
  data: CreateEmployeeLeaveAssignmentType,
  token: string
) {
  return fetchApi<CreateEmployeeLeaveAssignmentType>({
    url: 'api/employeeLeaveAssignments/create',
    method: 'POST',
    body: data,
    headers: {
      Authorization: token,
      'Content-Type': 'application/json',
    },
  })
}

export async function editEmployeeLeaveAssignment(
  id: number,
  data: GetEmployeeLeaveAssignmentType,
  token: string
) {
  return fetchApi<GetEmployeeLeaveAssignmentType>({
    url: `api/employeeLeaveAssignments/edit/${id}`,
    method: 'PATCH',
    body: data,
    headers: {
      Authorization: `${token}`,
      'Content-Type': 'application/json',
    },
  })
}

export async function deleteEmployeeLeaveAssignment(id: number, token: string) {
  return fetchApi<{ id: number }>({
    url: `api/employeeLeaveAssignments/delete/${id}`,
    method: 'DELETE',
    headers: {
      Authorization: token,
      'Content-Type': 'application/json',
    },
  })
}

//employee attendance
export async function getAllEmployeeAttendances(token: string) {
  return fetchApi<GetEmployeeAttendanceType[]>({
    url: 'api/employeeAttendances/getall',
    method: 'GET',
    headers: {
      Authorization: token,
      'Content-Type': 'application/json',
    },
  })
}

export async function createEmployeeAttendance(
  data: CreateEmployeeAttendanceType,
  token: string
) {
  return fetchApi<CreateEmployeeAttendanceType>({
    url: 'api/employeeAttendances/create',
    method: 'POST',
    body: data,
    headers: {
      Authorization: token,
      'Content-Type': 'application/json',
    },
  })
}

export async function editEmployeeAttendance(
  id: number,
  data: GetEmployeeAttendanceType,
  token: string
) {
  return fetchApi<GetEmployeeAttendanceType>({
    url: `api/employeeAttendances/edit/${id}`,
    method: 'PATCH',
    body: data,
    headers: {
      Authorization: `${token}`,
      'Content-Type': 'application/json',
    },
  })
}

export async function deleteEmployeeAttendance(id: number, token: string) {
  return fetchApi<{ id: number }>({
    url: `api/employeeAttendances/delete/${id}`,
    method: 'DELETE',
    headers: {
      Authorization: token,
      'Content-Type': 'application/json',
    },
  })
}

//salary components
export async function getAllSalaryComponents(token: string) {
  return fetchApi<GetSalaryComponentType[]>({
    url: 'api/salaryComponents/getall',
    method: 'GET',
    headers: {
      Authorization: token,
      'Content-Type': 'application/json',
    },
  })
}

export async function createSalaryComponent(
  data: CreateSalaryComponentType,
  token: string
) {
  return fetchApi<CreateSalaryComponentType>({
    url: 'api/salaryComponents/create',
    method: 'POST',
    body: data,
    headers: {
      Authorization: token,
      'Content-Type': 'application/json',
    },
  })
}

export async function editSalaryComponent(
  id: number,
  data: GetSalaryComponentType,
  token: string
) {
  return fetchApi<GetSalaryComponentType>({
    url: `api/salaryComponents/edit/${id}`,
    method: 'PATCH',
    body: data,
    headers: {
      Authorization: `${token}`,
      'Content-Type': 'application/json',
    },
  })
}

export async function deleteSalaryComponent(id: number, token: string) {
  return fetchApi<{ id: number }>({
    url: `api/salaryComponents/delete/${id}`,
    method: 'DELETE',
    headers: {
      Authorization: token,
      'Content-Type': 'application/json',
    },
  })
}

//salary structure
export async function getAllSalaryStructures(token: string) {
  return fetchApi<GetSalaryStructureType[]>({
    url: 'api/salaryStructures/getall',
    method: 'GET',
    headers: {
      Authorization: token,
      'Content-Type': 'application/json',
    },
  })
}

export async function createSalaryStructure(
  data: CreateSalaryStructureType,
  token: string
) {
  return fetchApi<CreateSalaryStructureType>({
    url: 'api/salaryStructures/create',
    method: 'POST',
    body: data,
    headers: {
      Authorization: token,
      'Content-Type': 'application/json',
    },
  })
}

export async function editSalaryStructure(
  id: number,
  data: GetSalaryStructureType,
  token: string
) {
  return fetchApi<GetSalaryStructureType>({
    url: `api/salaryStructures/edit/${id}`,
    method: 'PATCH',
    body: data,
    headers: {
      Authorization: `${token}`,
      'Content-Type': 'application/json',
    },
  })
}

export async function deleteSalaryStructure(id: number, token: string) {
  return fetchApi<{ id: number }>({
    url: `api/salaryStructures/delete/${id}`,
    method: 'DELETE',
    headers: {
      Authorization: token,
      'Content-Type': 'application/json',
    },
  })
}

//employee other salary components
export async function getAllEmployeeSalaryComponents(token: string) {
  return fetchApi<GetEmployeeSalaryComponentType[]>({
    url: 'api/employeeSalaryComponents/getall',
    method: 'GET',
    headers: {
      Authorization: token,
      'Content-Type': 'application/json',
    },
  })
}

export async function createEmployeeSalaryComponent(
  data: CreateEmployeeSalaryComponentType,
  token: string
) {
  return fetchApi<CreateEmployeeSalaryComponentType>({
    url: 'api/employeeSalaryComponents/create',
    method: 'POST',
    body: data,
    headers: {
      Authorization: token,
      'Content-Type': 'application/json',
    },
  })
}

export async function editEmployeeSalaryComponent(
  id: number,
  data: CreateEmployeeSalaryComponentType,
  token: string
) {
  return fetchApi<CreateEmployeeSalaryComponentType>({
    url: `api/employeeSalaryComponents/edit/${id}`,
    method: 'PATCH',
    body: data,
    headers: {
      Authorization: `${token}`,
      'Content-Type': 'application/json',
    },
  })
}

export async function deleteEmployeeSalaryComponent(id: number, token: string) {
  return fetchApi<{ id: number }>({
    url: `api/employeeSalaryComponents/delete/${id}`,
    method: 'DELETE',
    headers: {
      Authorization: token,
      'Content-Type': 'application/json',
    },
  })
}

//salary
export async function getAllSalaries(token: string) {
  return fetchApi<GetSalaryType[]>({
    url: 'api/salary/getall',
    method: 'GET',
    headers: {
      Authorization: token,
      'Content-Type': 'application/json',
    },
  })
}

export async function createSalary(data: CreateSalaryType, token: string) {
  return fetchApi<CreateSalaryType>({
    url: 'api/salary/create',
    method: 'POST',
    body: data,
    headers: {
      Authorization: token,
      'Content-Type': 'application/json',
    },
  })
}

export async function editSalary(
  id: number,
  data: GetSalaryType,
  token: string
) {
  return fetchApi<GetSalaryType>({
    url: `api/salary/edit/${id}`,
    method: 'PATCH',
    body: data,
    headers: {
      Authorization: `${token}`,
      'Content-Type': 'application/json',
    },
  })
}

export async function deleteSalary(id: number, token: string) {
  return fetchApi<{ id: number }>({
    url: `api/salary/delete/${id}`,
    method: 'DELETE',
    headers: {
      Authorization: token,
      'Content-Type': 'application/json',
    },
  })
}

//lones
export async function getAllLones(token: string) {
  return fetchApi<GetEmployeeLoneType[]>({
    url: 'api/employeeLones/getall',
    method: 'GET',
    headers: {
      Authorization: token,
      'Content-Type': 'application/json',
    },
  })
}

export async function createLone(data: CreateEmployeeLoneType, token: string) {
  return fetchApi<CreateEmployeeLoneType>({
    url: 'api/employeeLones/create',
    method: 'POST',
    body: data,
    headers: {
      Authorization: token,
      'Content-Type': 'application/json',
    },
  })
}

export async function editLone(
  id: number,
  data: GetEmployeeLoneType,
  token: string
) {
  return fetchApi<GetEmployeeLoneType>({
    url: `api/employeeLones/edit/${id}`,
    method: 'PATCH',
    body: data,
    headers: {
      Authorization: `${token}`,
      'Content-Type': 'application/json',
    },
  })
}

export async function deleteLone(id: number, token: string) {
  return fetchApi<{ id: number }>({
    url: `api/employeeLones/delete/${id}`,
    method: 'DELETE',
    headers: {
      Authorization: token,
      'Content-Type': 'application/json',
    },
  })
}

export async function skipLone(
  employeeSalaryComponentId: number,
  updatedBy: number,
  token: string
) {
  return fetchApi<any>({
    url: `api/employeeLones/skipLone/${employeeSalaryComponentId}/${updatedBy}`,
    method: 'POST',
    headers: {
      Authorization: token,
      'Content-Type': 'application/json',
    },
  })
}

//employee leaves
export async function getAllEmployeeLeaves(token: string) {
  return fetchApi<GetEmployeeLeaveType[]>({
    url: 'api/employeeLeaves/getall',
    method: 'GET',
    headers: {
      Authorization: token,
      'Content-Type': 'application/json',
    },
  })
}

export async function createEmployeeLeave(
  data: CreateEmployeeLeaveType,
  token: string
) {
  return fetchApi<CreateEmployeeLeaveType>({
    url: 'api/employeeLeaves/create',
    method: 'POST',
    body: data,
    headers: {
      Authorization: token,
      'Content-Type': 'application/json',
    },
  })
}

export async function editEmployeeLeave(
  id: number,
  data: GetEmployeeLeaveType,
  token: string
) {
  return fetchApi<GetEmployeeLeaveType>({
    url: `api/employeeLeaves/edit/${id}`,
    method: 'PATCH',
    body: data,
    headers: {
      Authorization: `${token}`,
      'Content-Type': 'application/json',
    },
  })
}

export async function deleteEmployeeLeave(id: number, token: string) {
  return fetchApi<{ id: number }>({
    url: `api/employeeLeaves/delete/${id}`,
    method: 'DELETE',
    headers: {
      Authorization: token,
      'Content-Type': 'application/json',
    },
  })
}

export async function getAllEmployeeLeaveTypes(token: string) {
  return fetchApi<GetEmployeeLeaveTypeType[]>({
    url: 'api/employeeLeaves/getallEmployeeLeaveTypes',
    method: 'GET',
    headers: {
      Authorization: token,
      'Content-Type': 'application/json',
    },
  })
}

//employee leave apply
export async function getAllEmployeeLeaveApplications(token: string) {
  return fetchApi<GetEmployeeLeaveApply[]>({
    url: 'api/employeeLeaveApply/getAll',
    method: 'GET',
    headers: {
      Authorization: token,
      'Content-Type': 'application/json',
    },
  })
}

export async function createEmployeeLeaveApplication(
  data: CreateEmployeeLeaveApply,
  token: string
) {
  return fetchApi<CreateEmployeeLeaveApply>({
    url: 'api/employeeLeaveApply/create',
    method: 'POST',
    body: data,
    headers: {
      Authorization: token,
      'Content-Type': 'application/json',
    },
  })
}

export async function editEmployeeLeaveApplication(
  id: number,
  data: GetEmployeeLeaveApply,
  token: string
) {
  return fetchApi<GetEmployeeLeaveApply>({
    url: `api/employeeLeaveApply/edit/${id}`,
    method: 'PATCH',
    body: data,
    headers: {
      Authorization: token,
      'Content-Type': 'application/json',
    },
  })
}

export async function deleteEmployeeLeaveApplication(
  id: number,
  token: string
) {
  return fetchApi<{ id: number }>({
    url: `api/employeeLeaveApply/delete/${id}`,
    method: 'DELETE',
    headers: {
      Authorization: token,
      'Content-Type': 'application/json',
    },
  })
}

// APPROVE BY REPORTING AUTHORITY
export async function approveEmployeeLeaveRepAuth(
  id: number,
  updatedBy: number,
  token: string
) {
  return fetchApi({
    url: `api/employeeLeaveApply/approve-rep-auth/${id}`,
    method: 'PATCH',
    body: { updatedBy },
    headers: {
      Authorization: token,
      'Content-Type': 'application/json',
    },
  })
}

// APPROVE BY HR
export async function approveEmployeeLeaveHr(
  id: number,
  updatedBy: number,
  token: string
) {
  return fetchApi({
    url: `api/employeeLeaveApply/approve-hr/${id}`,
    method: 'PATCH',
    body: { updatedBy },
    headers: {
      Authorization: token,
      'Content-Type': 'application/json',
    },
  })
}

export async function rejectLeave(
  id: number,
  updatedBy: number,
  token: string
) {
  return fetchApi({
    url: `api/employeeLeaveApply/rejectLeave/${id}`,
    method: 'PATCH',
    body: { updatedBy },
    headers: {
      Authorization: token,
      'Content-Type': 'application/json',
    },
  })
}

export async function getLeaveApplyNoOfDays(
  token: string,
  userId: number,
  leaveTypeId: number,
  fromDate: string,
  toDate: string
) {
  return fetchApi<number>({
    url: `api/employeeLeaveApply/calculate-noOfDays?userId=${userId}&leaveTypeId=${leaveTypeId}&fromDate=${fromDate}&toDate=${toDate}`,
    method: 'GET',
    headers: {
      Authorization: token,
      'Content-Type': 'application/json',
    },
  })
}

//reports
export async function getEmployeeActivityReport(
  employeeId: number,
  token: string
) {
  return fetchApi<GetEmployeeActivityHistoryReport>({
    url: `api/reports/activity-report?employeeId=${employeeId}`,
    method: 'GET',
    headers: {
      Authorization: token,
      'Content-Type': 'application/json',
    },
  })
}

export async function getShiftReport(date: string, token: string) {
  return fetchApi<GetShiftReportType>({
    url: `api/reports/shift-report?date=${date}`,
    method: 'GET',
    headers: {
      Authorization: token,
      'Content-Type': 'application/json',
    },
  })
}

export async function getSalaryReport(
  salaryMonthy: string,
  salaryYear: number,
  token: string
) {
  return fetchApi<GetSalaryType[]>({
    url: `api/reports/salary-report?salaryMonth=${salaryMonthy}&salaryYear=${salaryYear}`,
    method: 'GET',
    headers: {
      Authorization: token,
      'Content-Type': 'application/json',
    },
  })
}

export async function getAttendanceReport(
  fromDate: string,
  toDate: string,
  token: string
) {
  return fetchApi<GetEmployeeAttendanceType[]>({
    url: `api/reports/attendance-report?fromDate=${fromDate}&toDate=${toDate}`,
    method: 'GET',
    headers: {
      Authorization: token,
      'Content-Type': 'application/json',
    },
  })
}

export async function getLeaveBalanceSummaryReport(token: string) {
  return fetchApi<GetEmployeeLeaveBalanceSummaryReport[]>({
    url: 'api/reports/leave-balance-summary-report',
    method: 'GET',
    headers: {
      Authorization: token,
      'Content-Type': 'application/json',
    },
  })
}

export async function getEmployeeLeaveLedgerReport(token: string) {
  return fetchApi<GetEmployeeLeaveLedgerReport[]>({
    url: 'api/reports/leave-ledger-report',
    method: 'GET',
    headers: {
      Authorization: token,
      'Content-Type': 'application/json',
    },
  })
}

//dashbaord
export async function getEmployeeLeaveSummary(token: string) {
  return fetchApi<GetEmployeeLeaveSummaryType[]>({
    url: 'api/dashboard/leave-summary',
    method: 'GET',
    headers: {
      Authorization: token,
      'Content-Type': 'application/json',
    },
  })
}

export async function getEmployeeAttendanceSummary(token: string) {
  return fetchApi<GetEmployeeAttendanceSummaryType[]>({
    url: 'api/dashboard/attendance-summary',
    method: 'GET',
    headers: {
      Authorization: token,
      'Content-Type': 'application/json',
    },
  })
}

// attendance policy
export async function getAllAttendancePolicies(token: string) {
  return fetchApi<GetAttendancePolicyType[]>({
    url: 'api/attendancePolicies/getAll',
    method: 'GET',
    headers: {
      Authorization: token,
      'Content-Type': 'application/json',
    },
  })
}

export async function getAttendancePolicyById(token: string, id: number) {
  return fetchApi<GetAttendancePolicyType>({
    url: `api/attendancePolicies/getById/${id}`,
    method: 'GET',
    headers: {
      Authorization: token,
      'Content-Type': 'application/json',
    },
  })
}

export async function createAttendancePolicy(
  data: CreateAttendancePolicyType,
  token: string
) {
  return fetchApi<CreateAttendancePolicyType>({
    url: 'api/attendancePolicies/create',
    method: 'POST',
    body: data,
    headers: {
      Authorization: token,
      'Content-Type': 'application/json',
    },
  })
}

export async function editAttendancePolicy(
  id: number,
  data: GetAttendancePolicyType,
  token: string
) {
  return fetchApi<GetAttendancePolicyType>({
    url: `api/attendancePolicies/edit/${id}`,
    method: 'PATCH',
    body: data,
    headers: {
      Authorization: `${token}`,
      'Content-Type': 'application/json',
    },
  })
}

export async function deleteAttendancePolicy(id: number, token: string) {
  return fetchApi<{ id: number }>({
    url: `api/attendancePolicies/delete/${id}`,
    method: 'DELETE',
    headers: {
      Authorization: token,
      'Content-Type': 'application/json',
    },
  })
}

// shift allocations
export async function getAllShiftAllocations(token: string) {
  return fetchApi<GetShiftAllocationType[]>({
    url: 'api/shiftAllocation/getAll',
    method: 'GET',
    headers: {
      Authorization: token,
      'Content-Type': 'application/json',
    },
  })
}

export async function createShiftAllocation(
  data: CreateShiftAllocationType[],
  token: string
) {
  return fetchApi<CreateShiftAllocationType>({
    url: 'api/shiftAllocation/create/single',
    method: 'POST',
    body: data,
    headers: {
      Authorization: token,
      'Content-Type': 'application/json',
    },
  })
}

export async function createBulkShiftAllocation(
  data: CreateBulkShiftAllocationType,
  token: string
) {
  return fetchApi<CreateBulkShiftAllocationType>({
    url: 'api/shiftAllocation/create/bulk',
    method: 'POST',
    body: data,
    headers: {
      Authorization: token,
      'Content-Type': 'application/json',
    },
  })
}

export async function editShiftAllocation(
  id: number,
  data: Partial<CreateShiftAllocationType>,
  token: string
) {
  return fetchApi<GetShiftAllocationType>({
    url: `api/shiftAllocation/edit/${id}`,
    method: 'PATCH',
    body: data,
    headers: {
      Authorization: `${token}`,
      'Content-Type': 'application/json',
    },
  })
}

export async function deleteShiftAllocation(id: number, token: string) {
  return fetchApi<{ id: number }>({
    url: `api/shiftAllocation/delete/${id}`,
    method: 'DELETE',
    headers: {
      Authorization: token,
      'Content-Type': 'application/json',
    },
  })
}

export async function GetEmployeeWeekDays(userId: number, token: string) {
  return fetchApi<{ userId: number }>({
    url: `api/shiftAllocation/empWeekDays/${userId}`,
    method: 'GET',
    headers: {
      Authorization: token,
      'Content-Type': 'application/json',
    },
  })
}

export async function getShiftAllocationsByEmployee(
  employeeId: number,
  token: string
) {
  return fetchApi<GetShiftAllocationType[]>({
    url: `api/shiftAllocation/employee/${employeeId}`,
    method: 'GET',
    headers: {
      Authorization: token,
      'Content-Type': 'application/json',
    },
  })
}

export async function updateShiftAllocationRecurrence(
  id: number,
  data: UpdateRecurrenceType,
  token: string
) {
  return fetchApi<GetShiftAllocationType>({
    url: `api/shiftAllocation/recurrence/${id}`,
    method: 'PATCH',
    body: data,
    headers: { Authorization: token, 'Content-Type': 'application/json' },
  })
}

export async function copyShiftAllocationById(
  id: number,
  createdBy: number,
  token: string
) {
  return fetchApi<{
    success: boolean
    insertedId: number
    dateRange: any
    message: string
  }>({
    url: `api/shiftAllocation/copy/${id}`,
    method: 'POST',
    body: { createdBy },
    headers: { Authorization: token, 'Content-Type': 'application/json' },
  })
}

export async function copyAllActiveShiftAllocations(
  recurrenceType: 'weekly' | 'monthly',
  createdBy: number,
  token: string
) {
  return fetchApi<{
    success: boolean
    totalCopied: number
    dateRange: any
    message: string
  }>({
    url: `api/shiftAllocation/copy-all`,
    method: 'POST',
    body: { recurrenceType, createdBy },
    headers: { Authorization: token, 'Content-Type': 'application/json' },
  })
}

// api/attendance.api.ts

export async function getDailyAttendanceReport(date: string, token: string) {
  return fetchApi<DailyAttendanceType[]>({
    url: `api/reports/daily-attendance?date=${date}`,
    method: 'GET',
    headers: { Authorization: token, 'Content-Type': 'application/json' },
  })
}

export async function getAttendanceSummaryReport(
  fromDate: string,
  toDate: string,
  token: string
) {
  return fetchApi<AttendanceSummaryType[]>({
    url: `api/reports/attendance-summary?fromDate=${fromDate}&toDate=${toDate}`,
    method: 'GET',
    headers: { Authorization: token, 'Content-Type': 'application/json' },
  })
}

// ── Holiday Calendars ──
export async function getAllHolidayCalendars(token: string) {
  return fetchApi<GetHolidayCalendarType[]>({
    url: 'api/holidayCalendar/getAll',
    method: 'GET',
    headers: { Authorization: token, 'Content-Type': 'application/json' },
  })
}

export async function createHolidayCalendar(
  data: CreateHolidayCalendarType,
  token: string
) {
  return fetchApi<GetHolidayCalendarType>({
    url: 'api/holidayCalendar/create',
    method: 'POST',
    body: data,
    headers: { Authorization: token, 'Content-Type': 'application/json' },
  })
}

export async function editHolidayCalendar(
  id: number,
  data: Partial<CreateHolidayCalendarType>,
  token: string
) {
  return fetchApi<GetHolidayCalendarType>({
    url: `api/holidayCalendar/edit/${id}`,
    method: 'PATCH',
    body: data,
    headers: { Authorization: token, 'Content-Type': 'application/json' },
  })
}

export async function deleteHolidayCalendar(id: number, token: string) {
  return fetchApi<{ id: number }>({
    url: `api/holidayCalendar/delete/${id}`,
    method: 'DELETE',
    headers: { Authorization: token, 'Content-Type': 'application/json' },
  })
}

export async function getCalendarWithHolidays(id: number, token: string) {
  return fetchApi<GetHolidayCalendarType & { holidays: GetNewHolidayType[] }>({
    url: `api/holidayCalendar/getWithHolidays/${id}`,
    method: 'GET',
    headers: { Authorization: token, 'Content-Type': 'application/json' },
  })
}

// ── New Holidays ──
export async function getAllNewHolidays(token: string) {
  return fetchApi<GetNewHolidayType[]>({
    url: `api/holidays/getAll`,
    method: 'GET',
    headers: { Authorization: token, 'Content-Type': 'application/json' },
  })
}

export async function getNewHolidayById(id: number, token: string) {
  return fetchApi<GetNewHolidayType>({
    url: `api/holidays/getById/${id}`,
    method: 'GET',
    headers: { Authorization: token, 'Content-Type': 'application/json' },
  })
}

export async function createNewHolidayRange(
  data: CreateNewHolidayType,
  token: string
) {
  return fetchApi<{ message: string; holidays: GetNewHolidayType[] }>({
    url: 'api/holidays/createRange',
    method: 'POST',
    body: data,
    headers: { Authorization: token, 'Content-Type': 'application/json' },
  })
}

export async function editNewHoliday(
  id: number,
  data: Partial<CreateNewHolidayType>,
  token: string
) {
  return fetchApi<GetNewHolidayType>({
    url: `api/holidays/edit/${id}`,
    method: 'PATCH',
    body: data,
    headers: { Authorization: token, 'Content-Type': 'application/json' },
  })
}

export async function deleteNewHoliday(id: number, token: string) {
  return fetchApi<{ id: number }>({
    url: `api/holidays/delete/${id}`,
    method: 'DELETE',
    headers: { Authorization: token, 'Content-Type': 'application/json' },
  })
}

//attendance processing
// utils/api.ts এ যোগ করো

export async function processAttendanceDate(
  data: ProcessAttendanceDateType,
  token: string
) {
  return fetchApi<ProcessAttendanceResultType>({
    url: 'api/attendanceProcessing/process/date',
    method: 'POST',
    body: data,
    headers: { Authorization: token, 'Content-Type': 'application/json' },
  })
}

export async function processAttendanceRange(
  data: ProcessAttendanceRangeType,
  token: string
) {
  return fetchApi<ProcessAttendanceRangeResultType>({
    url: 'api/attendanceProcessing/process/range',
    method: 'POST',
    body: data,
    headers: { Authorization: token, 'Content-Type': 'application/json' },
  })
}

export async function getAttendanceAuditLogs(
  params: {
    employeeId?: number
    fromDate?: string
    toDate?: string
    action?: 'INSERT' | 'UPDATE'
    page?: number
    limit?: number
  },
  token: string
) {
  const query = new URLSearchParams()
  if (params.employeeId) query.append('employeeId', String(params.employeeId))
  if (params.fromDate) query.append('fromDate', params.fromDate)
  if (params.toDate) query.append('toDate', params.toDate)
  if (params.action) query.append('action', params.action)
  if (params.page) query.append('page', String(params.page))
  if (params.limit) query.append('limit', String(params.limit))

  return fetchApi<AttendanceAuditResponseType>({
    url: `api/attendanceProcessing/audit?${query.toString()}`,
    method: 'GET',
    headers: { Authorization: token, 'Content-Type': 'application/json' },
  })
}

// ── Attendance Daily (manual entry) ──
export async function getAllAttendanceDaily(token: string) {
  return fetchApi<GetAttendanceDailyType[]>({
    url: 'api/attendanceDaily/getAll',
    method: 'GET',
    headers: {
      Authorization: token,
      'Content-Type': 'application/json',
    },
  })
}

export async function getAllAttendanceDailyWithParams(
  token: string,
  employeeId?: number,
  fromDate?: string,
  toDate?: string
) {
  return fetchApi<GetAttendanceDailyType[]>({
    url: `api/attendanceDaily/getAll?employeeId=${employeeId ?? ''}&fromDate=${fromDate ?? ''}&toDate=${toDate ?? ''}`,
    method: 'GET',
    headers: {
      Authorization: token,
      'Content-Type': 'application/json',
    },
  })
}

//upload attendance
export async function uploadAttendance(data: FormData, token: string) {
  return fetchApiWithFile<{
    savedFile: string
    total: number
    inserted: number
    failed: number
    errors: { row: number; reason: string }[]
  }>({
    url: 'api/csv/import',
    method: 'POST',
    body: data,
    headers: {
      Authorization: token,
    },
  })
}

export async function getAttendanceDailyByEmployee(
  employeeId: number,
  token: string
) {
  return fetchApi<GetAttendanceDailyType[]>({
    url: `api/attendanceDaily/getByEmployee/${employeeId}`,
    method: 'GET',
    headers: { Authorization: token, 'Content-Type': 'application/json' },
  })
}

export async function createAttendanceDaily(
  data: CreateAttendanceDailyType,
  token: string
) {
  return fetchApi<GetAttendanceDailyType>({
    url: 'api/attendanceDaily/create',
    method: 'POST',
    body: data,
    headers: { Authorization: token, 'Content-Type': 'application/json' },
  })
}

export async function editAttendanceDaily(
  id: number,
  data: UpdateAttendanceDailyType,
  token: string
) {
  return fetchApi<{ success: boolean; data: GetAttendanceDailyType }>({
    url: `api/attendanceDaily/edit/${id}`,
    method: 'PATCH',
    body: data,
    headers: { Authorization: `${token}`, 'Content-Type': 'application/json' },
  })
}

export async function deleteAttendanceDaily(id: number, token: string) {
  return fetchApi<{ message: string }>({
    url: `api/attendanceDaily/delete/${id}`,
    method: 'DELETE',
    headers: { Authorization: token, 'Content-Type': 'application/json' },
  })
}
