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
  CreateAttendanceDailyApplyType,
  GetAttendanceDailyApplyType,
  GetIndividualAttendanceSummaryReportType,
  GenerateSalaryType,
  GetEmployeeLeaveEncashment,
  CreateEmployeeLeaveEncashment,
  GetNoticeType,
  CreateNoticeType,
  GetEmployeeLoneSummaryType,
  GetEmployeeSalaryStatusType,
  CurrentUserResponse,
  CurrentUserResponseSchema,
} from '@/utils/type'

export async function getAllRoles() {
  return fetchApi<
    { roleId: number; roleName: string; permissions: number[] }[]
  >({
    url: 'api/roles/get-all-roles',
    method: 'GET',
  })
}

export async function getAllPermissions() {
  return fetchApi<{ id: number; name: string }[]>({
    url: 'api/roles/get-all-permissions',
    method: 'GET',
  })
}

export async function updateRolePermissions(
  roleId: number,
  permissions: number[]
) {
  return fetchApi({
    url: `api/roles/update-role-permissions/${roleId}`,
    method: 'PUT',
    body: { permissions },
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

export async function logout() {
  return fetchApi<{ message: string }>({
    url: 'api/auth/logout',
    method: 'POST',
  })
}

export async function chatBot(message: string) {
  return fetchApi<{ answer: string }>({
    url: 'api/ai/chat',
    method: 'POST',
    body: { message },
  })
}

export async function getCurrentUser() {
  return fetchApi<CurrentUserResponse>({
    url: 'api/auth/currentUser',
    method: 'GET',
    schema: CurrentUserResponseSchema,
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

export async function getAllCustomers() {
  return fetchApi<GetCustomerType[]>({
    url: 'api/customers/getall',
    method: 'GET',
  })
}

export async function createCustomer(data: CreateCustomerType) {
  return fetchApi<CreateCustomerType>({
    url: 'api/customers/create',
    method: 'POST',
    body: data,
  })
}

export async function editCustomer(id: number, data: GetCustomerType) {
  return fetchApi<GetCustomerType>({
    url: `api/customers/edit/${id}`,
    method: 'PATCH',
    body: data,
  })
}

export async function deleteCustomer(id: number) {
  return fetchApi<{ id: number }>({
    url: `api/customers/delete/${id}`,
    method: 'DELETE',
  })
}

export async function getAllBusinessUnits() {
  return fetchApi<GetBusinessUnitType[]>({
    url: 'api/business-units/getall',
    method: 'GET',
  })
}

export async function createBusinessUnit(data: CreateBusinessUnitType) {
  return fetchApi<CreateBusinessUnitType>({
    url: 'api/business-units/create',
    method: 'POST',
    body: data,
  })
}

export async function editBusinessUnit(id: number, data: GetBusinessUnitType) {
  return fetchApi<GetBusinessUnitType>({
    url: `api/business-units/edit/${id}`,
    method: 'PATCH',
    body: data,
  })
}

export async function deleteBusinessUnit(id: number) {
  return fetchApi<{ id: number }>({
    url: `api/business-units/delete/${id}`,
    method: 'DELETE',
  })
}

export async function getAllTenants() {
  return fetchApi<GetTenantType[]>({
    url: 'api/tenants/getall',
    method: 'GET',
  })
}

export async function createTenant(data: CreateTenantType) {
  return fetchApi<CreateTenantType>({
    url: 'api/tenants/create',
    method: 'POST',
    body: data,
  })
}

export async function editTenant(id: number, data: GetTenantType) {
  return fetchApi<GetTenantType>({
    url: `api/tenants/edit/${id}`,
    method: 'PATCH',
    body: data,
  })
}

export async function deleteTenant(id: number) {
  return fetchApi<{ id: number }>({
    url: `api/tenants/delete/${id}`,
    method: 'DELETE',
  })
}

export async function getAllDepartments() {
  return fetchApi<GetDepartmentType[]>({
    url: 'api/departments/getall',
    method: 'GET',
  })
}

export async function createDepartment(data: CreateDepartmentType) {
  return fetchApi<CreateDepartmentType>({
    url: 'api/departments/create',
    method: 'POST',
    body: data,
  })
}

export async function editDepartment(id: number, data: GetDepartmentType) {
  return fetchApi<GetDepartmentType>({
    url: `api/departments/edit/${id}`,
    method: 'PATCH',
    body: data,
  })
}

export async function deleteDepartment(id: number) {
  return fetchApi<{ id: number }>({
    url: `api/departments/delete/${id}`,
    method: 'DELETE',
  })
}

export async function getAllDesignations() {
  return fetchApi<GetDesignationType[]>({
    url: 'api/designations/getall',
    method: 'GET',
  })
}

export async function createDesignation(data: CreateDesignationType) {
  return fetchApi<CreateDesignationType>({
    url: 'api/designations/create',
    method: 'POST',
    body: data,
  })
}

export async function editDesignation(id: number, data: GetDesignationType) {
  return fetchApi<GetDesignationType>({
    url: `api/designations/edit/${id}`,
    method: 'PATCH',
    body: data,
  })
}

export async function deleteDesignation(id: number) {
  return fetchApi<{ id: number }>({
    url: `api/designations/delete/${id}`,
    method: 'DELETE',
  })
}

export async function getAllCompanies() {
  return fetchApi<GetCompanyType[]>({
    url: 'api/company/getall',
    method: 'GET',
  })
}

export async function createCompany(formData: FormData) {
  return fetchApiWithFile<CreateCompanyType>({
    url: 'api/company/create',
    method: 'POST',
    body: formData,
  })
}

export async function editCompany(id: number, formData: FormData) {
  return fetchApiWithFile<GetCompanyType>({
    url: `api/company/edit/${id}`,
    method: 'PATCH',
    body: formData,
  })
}

export async function deleteCompany(id: number) {
  return fetchApi<{ id: number }>({
    url: `api/company/delete/${id}`,
    method: 'DELETE',
  })
}

export async function getAllWorkStations() {
  return fetchApi<GetWorkStationType[]>({
    url: 'api/workstations/getall',
    method: 'GET',
  })
}

export async function createWorkStation(data: CreateWorkStationType) {
  return fetchApi<CreateWorkStationType>({
    url: 'api/workstations/create',
    method: 'POST',
    body: data,
  })
}

export async function editWorkStation(id: number, data: GetWorkStationType) {
  return fetchApi<GetWorkStationType>({
    url: `api/workstations/edit/${id}`,
    method: 'PATCH',
    body: data,
  })
}

export async function deleteWorkStation(id: number) {
  return fetchApi<{ id: number }>({
    url: `api/workstations/delete/${id}`,
    method: 'DELETE',
  })
}

export async function getAllDivisions() {
  return fetchApi<GetDivisionType[]>({
    url: 'api/divisions/getall',
    method: 'GET',
  })
}

export async function createDivision(data: CreateDivisionType) {
  return fetchApi<CreateDivisionType>({
    url: 'api/divisions/create',
    method: 'POST',
    body: data,
  })
}

export async function editDivision(id: number, data: GetDivisionType) {
  return fetchApi<GetDivisionType>({
    url: `api/divisions/edit/${id}`,
    method: 'PATCH',
    body: data,
  })
}

export async function deleteDivision(id: number) {
  return fetchApi<{ id: number }>({
    url: `api/divisions/delete/${id}`,
    method: 'DELETE',
  })
}

export async function getAllCostCenters() {
  return fetchApi<GetCostCenterType[]>({
    url: 'api/costcenters/getall',
    method: 'GET',
  })
}

export async function createCostCenter(data: CreateCostCenterType) {
  return fetchApi<CreateCostCenterType>({
    url: 'api/costcenters/create',
    method: 'POST',
    body: data,
  })
}

export async function editCostCenter(id: number, data: GetCostCenterType) {
  return fetchApi<GetCostCenterType>({
    url: `api/costcenters/edit/${id}`,
    method: 'PATCH',
    body: data,
  })
}

export async function deleteCostCenter(id: number) {
  return fetchApi<{ id: number }>({
    url: `api/costcenters/delete/${id}`,
    method: 'DELETE',
  })
}

export async function getAllEmploymentTypes() {
  return fetchApi<GetEmploymentTypeType[]>({
    url: 'api/employmentTypes/getall',
    method: 'GET',
  })
}

export async function createEmploymentType(data: CreateEmploymentTypeType) {
  return fetchApi<CreateEmploymentTypeType>({
    url: 'api/employmentTypes/create',
    method: 'POST',
    body: data,
  })
}

export async function editEmploymentType(
  id: number,
  data: GetEmploymentTypeType
) {
  return fetchApi<GetEmploymentTypeType>({
    url: `api/employmentTypes/edit/${id}`,
    method: 'PATCH',
    body: data,
  })
}

export async function deleteEmploymentType(id: number) {
  return fetchApi<{ id: number }>({
    url: `api/employmentTypes/delete/${id}`,
    method: 'DELETE',
  })
}

export async function getAllWeekDays() {
  return fetchApi<GetWeekDayType[]>({
    url: 'api/weekDays/getall',
    method: 'GET',
  })
}

export async function getAllShiftDayAndWeekDays() {
  return fetchApi<GetShiftsType[]>({
    url: 'api/shift/getall',
    method: 'GET',
  })
}

export async function createShiftDayAndWeekDays(data: CreateShiftType) {
  return fetchApi<CreateShiftType>({
    url: 'api/shift/create',
    method: 'POST',
    body: data,
  })
}

export async function editShiftDayAndWeekDays(id: number, data: GetShiftsType) {
  return fetchApi<GetShiftsType>({
    url: `api/shift/edit/${id}`,
    method: 'PATCH',
    body: data,
  })
}

export async function deleteShiftDayAndWeekDays(id: number) {
  return fetchApi<{ id: number }>({
    url: `api/shift/delete/${id}`,
    method: 'DELETE',
  })
}

export async function getAllEmployeePreboardings() {
  return fetchApi<GetEmployeePreboardingType[]>({
    url: 'api/employeePreboarding/getall',
    method: 'GET',
  })
}

export async function getEmployeePreboardingById(id: number) {
  return fetchApi<GetEmployeePreboardingType>({
    url: `api/employeePreboarding/getPreboarding/${id}`,
    method: 'GET',
  })
}

export async function createEmployeePreboarding(
  data: CreateEmployeePreboardingType
) {
  return fetchApi<CreateEmployeePreboardingType>({
    url: 'api/employeePreboarding/create',
    method: 'POST',
    body: data,
  })
}

export async function editEmployeePreboarding(
  id: number,
  data: GetEmployeePreboardingType
) {
  return fetchApi<GetEmployeePreboardingType>({
    url: `api/employeePreboarding/edit/${id}`,
    method: 'PATCH',
    body: data,
  })
}

export async function deleteEmployeePreboarding(id: number) {
  return fetchApi<{ id: number }>({
    url: `api/employeePreboarding/delete/${id}`,
    method: 'DELETE',
  })
}

export async function createPreboardingEmployeeChecklist(
  data: CreateEmployeePreboardingChecklistType
) {
  return fetchApi<CreateEmployeePreboardingChecklistType>({
    url: 'api/employeePreboarding/assign',
    method: 'POST',
    body: data,
  })
}

export async function editEmployeePreboardingChecklist(
  id: number,
  data: GetEmployeePreboardingChecklistType
) {
  return fetchApi<GetEmployeePreboardingChecklistType>({
    url: `api/employeePreboarding/edit/${id}`,
    method: 'PATCH',
    body: data,
  })
}

export async function getPreboardingEmployeeChecklistsById(id: number) {
  return fetchApi<GetEmployeePreboardingChecklistType>({
    url: `api/employeePreboarding/getChecklists/${id}`,
    method: 'GET',
  })
}

export async function getPreboardingEmployeeChecklistsByUserId(userId: number) {
  return fetchApi<GetEmployeePreboardingChecklistType>({
    url: `api/employeePreboarding/getAssignedChecklistsByUser/${userId}`,
    method: 'GET',
  })
}

export async function completeEmployeePreboardingChecklist(data: {
  employeePreboardingChecklistId: number
  completionDate: string | Date
}) {
  return fetchApi<number>({
    url: 'api/employeePreboarding/completeChecklist/',
    method: 'PATCH',
    body: data,
  })
}

export async function getAllAssetCategories() {
  return fetchApi<GetAssetCategoryType[]>({
    url: 'api/assetCategory/getall',
    method: 'GET',
  })
}

export async function getAssetCategoryById(id: number) {
  return fetchApi<GetAssetCategoryType>({
    url: `api/assetCategory/getPreboarding/${id}`,
    method: 'GET',
  })
}

export async function createAssetCategory(data: CreateAssetCategoryType) {
  return fetchApi<CreateAssetCategoryType>({
    url: 'api/assetCategory/create',
    method: 'POST',
    body: data,
  })
}

export async function editAssetCategory(
  id: number,
  data: GetAssetCategoryType
) {
  return fetchApi<GetAssetCategoryType>({
    url: `api/assetCategory/edit/${id}`,
    method: 'PATCH',
    body: data,
  })
}

export async function deleteAssetCategory(id: number) {
  return fetchApi<{ id: number }>({
    url: `api/assetCategory/delete/${id}`,
    method: 'DELETE',
  })
}

export async function getAllAssets() {
  return fetchApi<GetAssetType[]>({
    url: 'api/assets/getall',
    method: 'GET',
  })
}

export async function getLatestAssetTransactions() {
  return fetchApi<GetAssetTransactionType[]>({
    url: 'api/assets/getLatestTransactions',
    method: 'GET',
  })
}

export async function getAssetById(id: number) {
  return fetchApi<GetAssetType>({
    url: `api/assets/getPreboarding/${id}`,
    method: 'GET',
  })
}

export async function createAsset(data: CreateAssetType) {
  return fetchApi<CreateAssetType>({
    url: 'api/assets/create',
    method: 'POST',
    body: data,
  })
}

export async function editAsset(id: number, data: GetAssetType) {
  return fetchApi<GetAssetType>({
    url: `api/assets/edit/${id}`,
    method: 'PATCH',
    body: data,
  })
}

export async function deleteAsset(id: number) {
  return fetchApi<{ id: number }>({
    url: `api/assets/delete/${id}`,
    method: 'DELETE',
  })
}

export async function assignAsset(data: CreateAssetTransactionType) {
  return fetchApi<CreateAssetTransactionType>({
    url: 'api/assets/assign',
    method: 'POST',
    body: data,
  })
}

export async function editAssignedAsset(
  assetTransactionId: number,
  data: GetAssetTransactionType
) {
  return fetchApi<GetAssetTransactionType>({
    url: `api/assets/assign/edit/${assetTransactionId}`,
    method: 'PATCH',
    body: data,
  })
}

export async function getNotificationsById(id: number) {
  return fetchApi<GetNotificationType>({
    url: `api/notifications/get/${id}`,
    method: 'GET',
  })
}

export async function markAsRead(data: number[]) {
  return fetchApi<number[]>({
    url: 'api/notifications/markAsRead',
    method: 'PATCH',
    body: data,
  })
}

export async function getAllChecklists() {
  return fetchApi<GetChecklistType[]>({
    url: 'api/checklists/getall',
    method: 'GET',
  })
}

export async function createChecklist(data: CreateChecklistType) {
  return fetchApi<CreateChecklistType>({
    url: 'api/checklists/create',
    method: 'POST',
    body: data,
  })
}

export async function editChecklist(id: number, data: GetChecklistType) {
  return fetchApi<GetChecklistType>({
    url: `api/checklists/edit/${id}`,
    method: 'PATCH',
    body: data,
  })
}

export async function deleteChecklist(id: number) {
  return fetchApi<{ id: number }>({
    url: `api/checklists/delete/${id}`,
    method: 'DELETE',
  })
}

export async function getAllEmployees() {
  return fetchApi<GetEmployeeType[]>({
    url: 'api/employees/getall',
    method: 'GET',
  })
}

export async function getEmployeeById(id: number) {
  return fetchApi<GetEmployeeType>({
    url: `api/employees/getById/${id}`,
    method: 'GET',
  })
}

export async function getEmpIdByUserId(userId: number) {
  return fetchApi<number>({
    url: `api/employees/getEmpIdByUserId/${userId}`,
    method: 'GET',
  })
}

export async function createEmployee(formData: FormData) {
  console.log('🚀 ~ createEmployee ~ formData:', formData)
  return fetchApiWithFile<CreateEmployeeType>({
    url: 'api/employees/create',
    method: 'POST',
    body: formData,
  })
}

export async function editEmployee(formData: FormData) {
  return fetchApiWithFile<GetEmployeeType>({
    url: `api/employees/edit`,
    method: 'PATCH',
    body: formData,
  })
}

export async function deleteEmployee(id: number) {
  return fetchApi<{ id: number }>({
    url: `api/employees/delete/${id}`,
    method: 'DELETE',
  })
}

export async function assignLeaveType(data: AssignLeaveTypeType) {
  return fetchApi<AssignLeaveTypeType>({
    url: `api/employees/assignLeaveType`,
    method: 'PATCH',
    body: data,
  })
}

export async function getAllHolidays() {
  return fetchApi<GetHolidayType[]>({
    url: 'api/holidays/getall',
    method: 'GET',
  })
}

export async function createHoliday(data: CreateHolidayType) {
  return fetchApi<CreateHolidayType>({
    url: 'api/holidays/create',
    method: 'POST',
    body: data,
  })
}

export async function editHoliday(id: number, data: GetHolidayType) {
  return fetchApi<GetHolidayType>({
    url: `api/holidays/edit/${id}`,
    method: 'PATCH',
    body: data,
  })
}

export async function deleteHoliday(id: number) {
  return fetchApi<{ id: number }>({
    url: `api/holidays/delete/${id}`,
    method: 'DELETE',
  })
}

export async function getAllLeaveTypes() {
  return fetchApi<GetLeaveTypeType[]>({
    url: 'api/leaveTypes/getall',
    method: 'GET',
  })
}

export async function createLeaveType(data: CreateLeaveTypeType) {
  return fetchApi<CreateLeaveTypeType>({
    url: 'api/leaveTypes/create',
    method: 'POST',
    body: data,
  })
}

export async function editLeaveType(id: number, data: GetLeaveTypeType) {
  return fetchApi<GetLeaveTypeType>({
    url: `api/leaveTypes/edit/${id}`,
    method: 'PATCH',
    body: data,
  })
}

export async function deleteLeaveType(id: number) {
  return fetchApi<{ id: number }>({
    url: `api/leaveTypes/delete/${id}`,
    method: 'DELETE',
  })
}

export async function getAllLeavePolicies() {
  return fetchApi<GetLeavePolicyType[]>({
    url: 'api/leavePolicy/getall',
    method: 'GET',
  })
}

export async function createLeavePolicy(data: CreateLeavePolicyType) {
  return fetchApi<CreateLeavePolicyType>({
    url: 'api/leavePolicy/create',
    method: 'POST',
    body: data,
  })
}

export async function editLeavePolicy(id: number, data: GetLeavePolicyType) {
  return fetchApi<GetLeavePolicyType>({
    url: `api/leavePolicy/edit/${id}`,
    method: 'PATCH',
    body: data,
  })
}

export async function deleteLeavePolicy(id: number) {
  return fetchApi<{ id: number }>({
    url: `api/leavePolicy/delete/${id}`,
    method: 'DELETE',
  })
}

export async function getAllEmployeeLeaveAssignments() {
  return fetchApi<GetEmployeeLeaveAssignmentType[]>({
    url: 'api/employeeLeaveAssignments/getall',
    method: 'GET',
  })
}

export async function createEmployeeLeaveAssignment(
  data: CreateEmployeeLeaveAssignmentType[]
) {
  return fetchApi<CreateEmployeeLeaveAssignmentType[]>({
    url: 'api/employeeLeaveAssignments/create',
    method: 'POST',
    body: data,
  })
}

export async function editEmployeeLeaveAssignment(
  id: number,
  data: GetEmployeeLeaveAssignmentType
) {
  return fetchApi<GetEmployeeLeaveAssignmentType>({
    url: `api/employeeLeaveAssignments/edit/${id}`,
    method: 'PATCH',
    body: data,
  })
}

export async function deleteEmployeeLeaveAssignment(id: number) {
  return fetchApi<{ id: number }>({
    url: `api/employeeLeaveAssignments/delete/${id}`,
    method: 'DELETE',
  })
}

export async function getAllEmployeeLeaveEncashments() {
  return fetchApi<GetEmployeeLeaveEncashment[]>({
    url: 'api/employeeLeaveEncashments/getall',
    method: 'GET',
  })
}

export async function createEmployeeLeaveEncashment(
  data: CreateEmployeeLeaveEncashment[]
) {
  return fetchApi<CreateEmployeeLeaveEncashment[]>({
    url: 'api/employeeLeaveEncashments/create',
    method: 'POST',
    body: data,
  })
}

export async function getAllEmployeeAttendances() {
  return fetchApi<GetEmployeeAttendanceType[]>({
    url: 'api/employeeAttendances/getall',
    method: 'GET',
  })
}

export async function createEmployeeAttendance(
  data: CreateEmployeeAttendanceType
) {
  return fetchApi<CreateEmployeeAttendanceType>({
    url: 'api/employeeAttendances/create',
    method: 'POST',
    body: data,
  })
}

export async function editEmployeeAttendance(
  id: number,
  data: GetEmployeeAttendanceType
) {
  return fetchApi<GetEmployeeAttendanceType>({
    url: `api/employeeAttendances/edit/${id}`,
    method: 'PATCH',
    body: data,
  })
}

export async function deleteEmployeeAttendance(id: number) {
  return fetchApi<{ id: number }>({
    url: `api/employeeAttendances/delete/${id}`,
    method: 'DELETE',
  })
}

export async function getAllSalaryComponents() {
  return fetchApi<GetSalaryComponentType[]>({
    url: 'api/salaryComponents/getall',
    method: 'GET',
  })
}

export async function createSalaryComponent(data: CreateSalaryComponentType) {
  return fetchApi<CreateSalaryComponentType>({
    url: 'api/salaryComponents/create',
    method: 'POST',
    body: data,
  })
}

export async function editSalaryComponent(
  id: number,
  data: GetSalaryComponentType
) {
  return fetchApi<GetSalaryComponentType>({
    url: `api/salaryComponents/edit/${id}`,
    method: 'PATCH',
    body: data,
  })
}

export async function deleteSalaryComponent(id: number) {
  return fetchApi<{ id: number }>({
    url: `api/salaryComponents/delete/${id}`,
    method: 'DELETE',
  })
}

export async function getAllSalaryStructures() {
  return fetchApi<GetSalaryStructureType[]>({
    url: 'api/salaryStructures/getall',
    method: 'GET',
  })
}

export async function createSalaryStructure(data: CreateSalaryStructureType) {
  return fetchApi<CreateSalaryStructureType>({
    url: 'api/salaryStructures/create',
    method: 'POST',
    body: data,
  })
}

export async function editSalaryStructure(
  id: number,
  data: GetSalaryStructureType
) {
  return fetchApi<GetSalaryStructureType>({
    url: `api/salaryStructures/edit/${id}`,
    method: 'PATCH',
    body: data,
  })
}

export async function deleteSalaryStructure(id: number) {
  return fetchApi<{ id: number }>({
    url: `api/salaryStructures/delete/${id}`,
    method: 'DELETE',
  })
}

export async function getAllEmployeeSalaryComponents() {
  return fetchApi<GetEmployeeSalaryComponentType[]>({
    url: 'api/employeeSalaryComponents/getall',
    method: 'GET',
  })
}

export async function createEmployeeSalaryComponent(
  data: CreateEmployeeSalaryComponentType
) {
  return fetchApi<CreateEmployeeSalaryComponentType>({
    url: 'api/employeeSalaryComponents/create',
    method: 'POST',
    body: data,
  })
}

export async function editEmployeeSalaryComponent(
  id: number,
  data: CreateEmployeeSalaryComponentType
) {
  return fetchApi<CreateEmployeeSalaryComponentType>({
    url: `api/employeeSalaryComponents/edit/${id}`,
    method: 'PATCH',
    body: data,
  })
}

export async function deleteEmployeeSalaryComponent(id: number) {
  return fetchApi<{ id: number }>({
    url: `api/employeeSalaryComponents/delete/${id}`,
    method: 'DELETE',
  })
}

export async function generateSalary(salaryMonth: string, salaryYear: number) {
  return fetchApi<GenerateSalaryType[]>({
    url: `api/salary/generate-salary?salaryMonth=${salaryMonth ?? ''}&salaryYear=${salaryYear ?? ''}`,
    method: 'GET',
  })
}

export async function getAllSalaries() {
  return fetchApi<GetSalaryType[]>({
    url: 'api/salary/getall',
    method: 'GET',
  })
}

export async function createSalary(data: CreateSalaryType) {
  return fetchApi<CreateSalaryType>({
    url: 'api/salary/create',
    method: 'POST',
    body: data,
  })
}

export async function editSalary(data: GetSalaryType) {
  return fetchApi<GetSalaryType>({
    url: 'api/salary/edit',
    method: 'PATCH',
    body: data,
  })
}

export async function giveSalary(id: number) {
  return fetchApi<{ id: number }>({
    url: `api/salary/give-salary/${id}`,
    method: 'PATCH',
  })
}

export async function makeSalaryPermanent(id: number) {
  return fetchApi<{ id: number }>({
    url: `api/salary/make-salary-permanent/${id}`,
    method: 'PATCH',
  })
}

export async function getAllLones() {
  return fetchApi<GetEmployeeLoneType[]>({
    url: 'api/employeeLones/getall',
    method: 'GET',
  })
}

export async function createLone(data: CreateEmployeeLoneType) {
  return fetchApi<CreateEmployeeLoneType>({
    url: 'api/employeeLones/create',
    method: 'POST',
    body: data,
  })
}

export async function editLone(id: number, data: GetEmployeeLoneType) {
  return fetchApi<GetEmployeeLoneType>({
    url: `api/employeeLones/edit/${id}`,
    method: 'PATCH',
    body: data,
  })
}

export async function makeEmployeeLoneFullPaid(id: number) {
  return fetchApi<{ id: number }>({
    url: `api/employeeLones/make-full-paid/${id}`,
    method: 'PATCH',
  })
}

export async function deleteLone(id: number) {
  return fetchApi<{ id: number }>({
    url: `api/employeeLones/delete/${id}`,
    method: 'DELETE',
  })
}

export async function skipLone(
  employeeLoneInstallmentId: number,
  updatedBy: number
) {
  return fetchApi<any>({
    url: `api/employeeLones/skipLone/${employeeLoneInstallmentId}/${updatedBy}`,
    method: 'POST',
  })
}

export async function getAllEmployeeLeaves() {
  return fetchApi<GetEmployeeLeaveType[]>({
    url: 'api/employeeLeaves/getall',
    method: 'GET',
  })
}

export async function createEmployeeLeave(data: CreateEmployeeLeaveType) {
  return fetchApi<CreateEmployeeLeaveType>({
    url: 'api/employeeLeaves/create',
    method: 'POST',
    body: data,
  })
}

export async function editEmployeeLeave(
  id: number,
  data: GetEmployeeLeaveType
) {
  return fetchApi<GetEmployeeLeaveType>({
    url: `api/employeeLeaves/edit/${id}`,
    method: 'PATCH',
    body: data,
  })
}

export async function deleteEmployeeLeave(id: number) {
  return fetchApi<{ id: number }>({
    url: `api/employeeLeaves/delete/${id}`,
    method: 'DELETE',
  })
}

export async function getAllEmployeeLeaveTypes() {
  return fetchApi<GetEmployeeLeaveTypeType[]>({
    url: 'api/employeeLeaves/getallEmployeeLeaveTypes',
    method: 'GET',
  })
}

export async function getAllEmployeeLeaveApplications() {
  return fetchApi<GetEmployeeLeaveApply[]>({
    url: 'api/employeeLeaveApply/getAll',
    method: 'GET',
  })
}

export async function createEmployeeLeaveApplication(
  data: CreateEmployeeLeaveApply
) {
  return fetchApi<CreateEmployeeLeaveApply>({
    url: 'api/employeeLeaveApply/create',
    method: 'POST',
    body: data,
  })
}

export async function editEmployeeLeaveApplication(
  id: number,
  data: GetEmployeeLeaveApply
) {
  return fetchApi<GetEmployeeLeaveApply>({
    url: `api/employeeLeaveApply/edit/${id}`,
    method: 'PATCH',
    body: data,
  })
}

export async function deleteEmployeeLeaveApplication(id: number) {
  return fetchApi<{ id: number }>({
    url: `api/employeeLeaveApply/delete/${id}`,
    method: 'DELETE',
  })
}

export async function approveEmployeeLeaveRepAuth(
  id: number,
  updatedBy: number
) {
  return fetchApi({
    url: `api/employeeLeaveApply/approve-rep-auth/${id}`,
    method: 'PATCH',
    body: { updatedBy },
  })
}

export async function approveEmployeeLeaveHr(id: number, updatedBy: number) {
  return fetchApi({
    url: `api/employeeLeaveApply/approve-hr/${id}`,
    method: 'PATCH',
    body: { updatedBy },
  })
}

export async function rejectLeave(id: number, updatedBy: number) {
  return fetchApi({
    url: `api/employeeLeaveApply/rejectLeave/${id}`,
    method: 'PATCH',
    body: { updatedBy },
  })
}

export async function getLeaveApplyNoOfDays(
  userId: number,
  leaveTypeId: number,
  fromDate: string,
  toDate: string
) {
  return fetchApi<number>({
    url: `api/employeeLeaveApply/calculate-noOfDays?userId=${userId}&leaveTypeId=${leaveTypeId}&fromDate=${fromDate}&toDate=${toDate}`,
    method: 'GET',
  })
}

export async function getEmployeeActivityReport(employeeId: number) {
  return fetchApi<GetEmployeeActivityHistoryReport>({
    url: `api/reports/activity-report?employeeId=${employeeId}`,
    method: 'GET',
  })
}

export async function getShiftReport(date: string) {
  return fetchApi<GetShiftReportType>({
    url: `api/reports/shift-report?date=${date}`,
    method: 'GET',
  })
}

export async function getSalaryReport(
  salaryMonthy: string,
  salaryYear: number
) {
  return fetchApi<GetSalaryType[]>({
    url: `api/reports/salary-report?salaryMonth=${salaryMonthy}&salaryYear=${salaryYear}`,
    method: 'GET',
  })
}

export async function getIndividualAttendanceSummaryReport(
  fromDate: string,
  toDate: string
) {
  return fetchApi<GetIndividualAttendanceSummaryReportType[]>({
    url: `api/reports/individual-attendance-summary?fromDate=${fromDate}&toDate=${toDate}`,
    method: 'GET',
  })
}

export async function getAttendanceReport(fromDate: string, toDate: string) {
  return fetchApi<GetEmployeeAttendanceType[]>({
    url: `api/reports/attendance-report?fromDate=${fromDate}&toDate=${toDate}`,
    method: 'GET',
  })
}

export async function getLeaveBalanceSummaryReport() {
  return fetchApi<GetEmployeeLeaveBalanceSummaryReport[]>({
    url: 'api/reports/leave-balance-summary-report',
    method: 'GET',
  })
}

export async function getEmployeeLeaveLedgerReport() {
  return fetchApi<GetEmployeeLeaveLedgerReport[]>({
    url: 'api/reports/leave-ledger-report',
    method: 'GET',
  })
}

export async function getEmployeeLeaveSummary() {
  return fetchApi<GetEmployeeLeaveSummaryType[]>({
    url: 'api/dashboard/leave-summary',
    method: 'GET',
  })
}

export async function getEmployeeAttendanceSummary() {
  return fetchApi<GetEmployeeAttendanceSummaryType[]>({
    url: 'api/dashboard/attendance-summary',
    method: 'GET',
  })
}

export async function getEmployeeLoneSummary() {
  return fetchApi<GetEmployeeLoneSummaryType[]>({
    url: 'api/dashboard/lone-summary',
    method: 'GET',
  })
}

export async function getEmployeeSalaryStatus() {
  return fetchApi<GetEmployeeSalaryStatusType[]>({
    url: 'api/dashboard/salary-status',
    method: 'GET',
  })
}

export async function getAllAttendancePolicies() {
  return fetchApi<GetAttendancePolicyType[]>({
    url: 'api/attendancePolicies/getAll',
    method: 'GET',
  })
}

export async function getAttendancePolicyById(id: number) {
  return fetchApi<GetAttendancePolicyType>({
    url: `api/attendancePolicies/getById/${id}`,
    method: 'GET',
  })
}

export async function createAttendancePolicy(data: CreateAttendancePolicyType) {
  return fetchApi<CreateAttendancePolicyType>({
    url: 'api/attendancePolicies/create',
    method: 'POST',
    body: data,
  })
}

export async function editAttendancePolicy(
  id: number,
  data: GetAttendancePolicyType
) {
  return fetchApi<GetAttendancePolicyType>({
    url: `api/attendancePolicies/edit/${id}`,
    method: 'PATCH',
    body: data,
  })
}

export async function deleteAttendancePolicy(id: number) {
  return fetchApi<{ id: number }>({
    url: `api/attendancePolicies/delete/${id}`,
    method: 'DELETE',
  })
}

export async function getAllShiftAllocations() {
  return fetchApi<GetShiftAllocationType[]>({
    url: 'api/shiftAllocation/getAll',
    method: 'GET',
  })
}

export async function createShiftAllocation(data: CreateShiftAllocationType[]) {
  return fetchApi<CreateShiftAllocationType>({
    url: 'api/shiftAllocation/create/single',
    method: 'POST',
    body: data,
  })
}

export async function createBulkShiftAllocation(
  data: CreateBulkShiftAllocationType
) {
  return fetchApi<CreateBulkShiftAllocationType>({
    url: 'api/shiftAllocation/create/bulk',
    method: 'POST',
    body: data,
  })
}

export async function editShiftAllocation(
  id: number,
  data: Partial<CreateShiftAllocationType>
) {
  return fetchApi<GetShiftAllocationType>({
    url: `api/shiftAllocation/edit/${id}`,
    method: 'PATCH',
    body: data,
  })
}

export async function deleteShiftAllocation(id: number) {
  return fetchApi<{ id: number }>({
    url: `api/shiftAllocation/delete/${id}`,
    method: 'DELETE',
  })
}

export async function GetEmployeeWeekDays(userId: number) {
  return fetchApi<{ userId: number }>({
    url: `api/shiftAllocation/empWeekDays/${userId}`,
    method: 'GET',
  })
}

export async function getShiftAllocationsByEmployee(employeeId: number) {
  return fetchApi<GetShiftAllocationType[]>({
    url: `api/shiftAllocation/employee/${employeeId}`,
    method: 'GET',
  })
}

export async function updateShiftAllocationRecurrence(
  id: number,
  data: UpdateRecurrenceType
) {
  return fetchApi<GetShiftAllocationType>({
    url: `api/shiftAllocation/recurrence/${id}`,
    method: 'PATCH',
    body: data,
  })
}

export async function copyShiftAllocationById(id: number, createdBy: number) {
  return fetchApi<{
    success: boolean
    insertedId: number
    dateRange: any
    message: string
  }>({
    url: `api/shiftAllocation/copy/${id}`,
    method: 'POST',
    body: { createdBy },
  })
}

export async function copyAllActiveShiftAllocations(
  recurrenceType: 'weekly' | 'monthly',
  createdBy: number
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
  })
}

export async function getDailyAttendanceReport(date: string) {
  return fetchApi<DailyAttendanceType[]>({
    url: `api/reports/daily-attendance?date=${date}`,
    method: 'GET',
  })
}

export async function getAttendanceSummaryReport(
  fromDate: string,
  toDate: string
) {
  return fetchApi<AttendanceSummaryType[]>({
    url: `api/reports/attendance-summary?fromDate=${fromDate}&toDate=${toDate}`,
    method: 'GET',
  })
}

export async function getAllHolidayCalendars() {
  return fetchApi<GetHolidayCalendarType[]>({
    url: 'api/holidayCalendar/getAll',
    method: 'GET',
  })
}

export async function createHolidayCalendar(data: CreateHolidayCalendarType) {
  return fetchApi<GetHolidayCalendarType>({
    url: 'api/holidayCalendar/create',
    method: 'POST',
    body: data,
  })
}

export async function editHolidayCalendar(
  id: number,
  data: Partial<CreateHolidayCalendarType>
) {
  return fetchApi<GetHolidayCalendarType>({
    url: `api/holidayCalendar/edit/${id}`,
    method: 'PATCH',
    body: data,
  })
}

export async function deleteHolidayCalendar(id: number) {
  return fetchApi<{ id: number }>({
    url: `api/holidayCalendar/delete/${id}`,
    method: 'DELETE',
  })
}

export async function getCalendarWithHolidays(id: number) {
  return fetchApi<GetHolidayCalendarType & { holidays: GetNewHolidayType[] }>({
    url: `api/holidayCalendar/getWithHolidays/${id}`,
    method: 'GET',
  })
}

export async function getAllNewHolidays() {
  return fetchApi<GetNewHolidayType[]>({
    url: `api/holidays/getAll`,
    method: 'GET',
  })
}

export async function getNewHolidayById(id: number) {
  return fetchApi<GetNewHolidayType>({
    url: `api/holidays/getById/${id}`,
    method: 'GET',
  })
}

export async function createNewHolidayRange(data: CreateNewHolidayType) {
  return fetchApi<{ message: string; holidays: GetNewHolidayType[] }>({
    url: 'api/holidays/createRange',
    method: 'POST',
    body: data,
  })
}

export async function editNewHoliday(
  id: number,
  data: Partial<CreateNewHolidayType>
) {
  return fetchApi<GetNewHolidayType>({
    url: `api/holidays/edit/${id}`,
    method: 'PATCH',
    body: data,
  })
}

export async function deleteNewHoliday(id: number) {
  return fetchApi<{ id: number }>({
    url: `api/holidays/delete/${id}`,
    method: 'DELETE',
  })
}

export async function processAttendanceDate(data: ProcessAttendanceDateType) {
  return fetchApi<ProcessAttendanceResultType>({
    url: 'api/attendanceProcessing/process/date',
    method: 'POST',
    body: data,
  })
}

export async function processAttendanceRange(data: ProcessAttendanceRangeType) {
  return fetchApi<ProcessAttendanceRangeResultType>({
    url: 'api/attendanceProcessing/process/range',
    method: 'POST',
    body: data,
  })
}

export async function getAttendanceAuditLogs(params: {
  employeeId?: number
  fromDate?: string
  toDate?: string
  action?: 'INSERT' | 'UPDATE'
  page?: number
  limit?: number
}) {
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
  })
}

export async function getAllAttendanceDaily() {
  return fetchApi<GetAttendanceDailyType[]>({
    url: 'api/attendanceDaily/getAll',
    method: 'GET',
  })
}

export async function getAllAttendanceDailyWithParams(
  employeeId?: number,
  fromDate?: string,
  toDate?: string
) {
  return fetchApi<GetAttendanceDailyType[]>({
    url: `api/attendanceDaily/getAll?employeeId=${employeeId ?? ''}&fromDate=${fromDate ?? ''}&toDate=${toDate ?? ''}`,
    method: 'GET',
  })
}

export async function uploadAttendance(data: FormData) {
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
  })
}

export async function createAttendanceDaily(data: CreateAttendanceDailyType) {
  return fetchApi<GetAttendanceDailyType>({
    url: 'api/attendanceDaily/create',
    method: 'POST',
    body: data,
  })
}

export async function editAttendanceDaily(
  id: number,
  data: UpdateAttendanceDailyType
) {
  return fetchApi<{ success: boolean; data: GetAttendanceDailyType }>({
    url: `api/attendanceDaily/edit/${id}`,
    method: 'PATCH',
    body: data,
  })
}

export async function deleteAttendanceDaily(id: number) {
  return fetchApi<{ message: string }>({
    url: `api/attendanceDaily/delete/${id}`,
    method: 'DELETE',
  })
}

export async function getAttendanceDailyByUserId(userId: number) {
  return fetchApi<GetAttendanceDailyType[]>({
    url: `api/attendanceDaily/getByUserId/${userId}`,
    method: 'GET',
  })
}

export async function addManualAttendanceDailyApply(
  id: number,
  data: CreateAttendanceDailyApplyType
) {
  return fetchApi<CreateAttendanceDailyApplyType>({
    url: `api/attendanceDailyApply/create/${id}`,
    method: 'POST',
    body: data,
  })
}

export async function getAttendanceDailyApplyByUserId(userId: number) {
  return fetchApi<GetAttendanceDailyApplyType[]>({
    url: `api/attendanceDailyApply/getByUserId/${userId}`,
    method: 'GET',
  })
}

export async function getAllAttendanceApply() {
  return fetchApi<GetAttendanceDailyApplyType[]>({
    url: `api/attendanceDailyApply/getAll`,
    method: 'GET',
  })
}

export async function editManualAttendanceDailyApply(
  id: number,
  data: GetAttendanceDailyApplyType
) {
  return fetchApi<GetAttendanceDailyApplyType>({
    url: `api/attendanceDailyApply/edit/${id}`,
    method: 'PATCH',
    body: data,
  })
}

export async function approveManualAttendanceByRepAuth(
  id: number,
  updatedBy: number
) {
  return fetchApi({
    url: `api/attendanceDailyApply/approve-rep-auth/${id}`,
    method: 'PATCH',
    body: { updatedBy },
  })
}

export async function approveManualAttendanceByHr(
  id: number,
  updatedBy: number
) {
  return fetchApi({
    url: `api/attendanceDailyApply/approve-hr/${id}`,
    method: 'PATCH',
    body: { updatedBy },
  })
}

export async function rejectManualAttendance(id: number, updatedBy: number) {
  return fetchApi({
    url: `api/attendanceDailyApply/reject/${id}`,
    method: 'PATCH',
    body: { updatedBy },
  })
}

export async function getAllNotice() {
  return fetchApi<GetNoticeType[]>({
    url: 'api/notice/getall',
    method: 'GET',
  })
}

export async function createNotice(formData: FormData) {
  return fetchApiWithFile<CreateNoticeType>({
    url: 'api/notice/create',
    method: 'POST',
    body: formData,
  })
}

export async function editNotice(id: number, formData: FormData) {
  return fetchApiWithFile<GetNoticeType>({
    url: `api/notice/edit/${id}`,
    method: 'PATCH',
    body: formData,
  })
}

export async function deleteNotice(id: number) {
  return fetchApi<{ id: number }>({
    url: `api/notice/delete/${id}`,
    method: 'DELETE',
  })
}
