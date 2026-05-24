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
  GetLoneReportType,
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

export async function createBusinessUnit(data: CreateBusinessUnitType, token: string) {
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

//departments
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
export async function getPreboardingEmployeeChecklistsById(token: string, id: number) {
  return fetchApi<GetEmployeeType>({
    url: `api/employeePreboarding/get/${id}`,
    method: 'GET',
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

export async function markAsRead(
  data:number[],
  token: string
) {
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

export async function createEmployee(formData: FormData, token: string) {
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

export async function deleteEmployeeSalaryComponent(
  id: number,
  token: string
) {
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

//reports
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

export async function getLoneReport(
  fromDate: string,
  toDate: string,
  token: string
) {
  return fetchApi<GetLoneReportType[]>({
    url: `api/reports/lone-report?fromDate=${fromDate}&toDate=${toDate}`,
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
