import { fetchApi, fetchApiWithFile } from '@/utils/http'
import {
  AssignLeaveTypeType,
  CreateDepartmentType,
  CreateDesignationType,
  CreateEmployeeAttendanceType,
  CreateEmployeeLeaveType,
  CreateEmployeeOtherSalaryComponentType,
  CreateEmployeeType,
  CreateEmployeeTypeType,
  CreateHolidayType,
  CreateLeaveTypeType,
  CreateEmployeeLoneType,
  CreateOfficeTimingType,
  CreateOtherSalaryComponentType,
  CreateSalaryType,
  GetDepartmentType,
  GetDesignationType,
  GetEmployeeAttendanceType,
  GetEmployeeLeaveType,
  GetEmployeeOtherSalaryComponentType,
  GetEmployeeType,
  GetEmployeeTypeType,
  GetHolidayType,
  GetLeaveTypeType,
  GetEmployeeLoneType,
  GetOfficeTimingType,
  GetOtherSalaryComponentType,
  GetSalaryType,
  GetWeekendType,
  SignInRequest,
  SignInResponse,
  SignInResponseSchema,
  GetEmployeeLeaveTypeType,
  GetLoneReportType,
  GetEmployeeLeaveSummaryType,
  GetEmployeeAttendanceSummaryType,
} from '@/utils/type'

export async function signIn(credentials: SignInRequest) {
  return fetchApi<SignInResponse>({
    url: 'api/auth/login',
    method: 'POST',
    body: credentials,
    schema: SignInResponseSchema,
  })
}

//departments
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

//employee type
export async function getAllEmployeeTypes(token: string) {
  return fetchApi<GetEmployeeTypeType[]>({
    url: 'api/employeeTypes/getall',
    method: 'GET',
    headers: {
      Authorization: token,
      'Content-Type': 'application/json',
    },
  })
}

export async function createEmployeeType(
  data: CreateEmployeeTypeType,
  token: string
) {
  return fetchApi<CreateEmployeeTypeType>({
    url: 'api/employeeTypes/create',
    method: 'POST',
    body: data,
    headers: {
      Authorization: token,
      'Content-Type': 'application/json',
    },
  })
}

export async function editEmployeeType(
  id: number,
  data: GetEmployeeTypeType,
  token: string
) {
  return fetchApi<GetEmployeeTypeType>({
    url: `api/employeeTypes/edit/${id}`,
    method: 'PATCH',
    body: data,
    headers: {
      Authorization: `${token}`,
      'Content-Type': 'application/json',
    },
  })
}

export async function deleteEmployeeType(id: number, token: string) {
  return fetchApi<{ id: number }>({
    url: `api/employeeTypes/delete/${id}`,
    method: 'DELETE',
    headers: {
      Authorization: token,
      'Content-Type': 'application/json',
    },
  })
}

//weekends
export async function getAllWeekends(token: string) {
  return fetchApi<GetWeekendType[]>({
    url: 'api/weekends/getall',
    method: 'GET',
    headers: {
      Authorization: token,
      'Content-Type': 'application/json',
    },
  })
}

//office timing weekends
export async function getAllOfficeTimingWeekends(token: string) {
  return fetchApi<GetOfficeTimingType[]>({
    url: 'api/officeTimings/getall',
    method: 'GET',
    headers: {
      Authorization: token,
      'Content-Type': 'application/json',
    },
  })
}

export async function createOfficeTimingWeekend(
  data: CreateOfficeTimingType,
  token: string
) {
  return fetchApi<CreateOfficeTimingType>({
    url: 'api/officeTimings/create',
    method: 'POST',
    body: data,
    headers: {
      Authorization: token,
      'Content-Type': 'application/json',
    },
  })
}

export async function editOfficeTimingWeekend(
  id: number,
  data: GetOfficeTimingType,
  token: string
) {
  return fetchApi<GetOfficeTimingType>({
    url: `api/officeTimings/edit/${id}`,
    method: 'PATCH',
    body: data,
    headers: {
      Authorization: `${token}`,
      'Content-Type': 'application/json',
    },
  })
}

export async function deleteOfficeTimingWeekend(id: number, token: string) {
  return fetchApi<{ id: number }>({
    url: `api/officeTimings/delete/${id}`,
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

//other salary related components
export async function getAllOtherSalaryComponents(token: string) {
  return fetchApi<GetOtherSalaryComponentType[]>({
    url: 'api/otherSalaryComponents/getall',
    method: 'GET',
    headers: {
      Authorization: token,
      'Content-Type': 'application/json',
    },
  })
}

export async function createOtherSalaryComponent(
  data: CreateOtherSalaryComponentType,
  token: string
) {
  return fetchApi<CreateOtherSalaryComponentType>({
    url: 'api/otherSalaryComponents/create',
    method: 'POST',
    body: data,
    headers: {
      Authorization: token,
      'Content-Type': 'application/json',
    },
  })
}

export async function editOtherSalaryComponent(
  id: number,
  data: GetOtherSalaryComponentType,
  token: string
) {
  return fetchApi<GetOtherSalaryComponentType>({
    url: `api/otherSalaryComponents/edit/${id}`,
    method: 'PATCH',
    body: data,
    headers: {
      Authorization: `${token}`,
      'Content-Type': 'application/json',
    },
  })
}

export async function deleteOtherSalaryComponent(id: number, token: string) {
  return fetchApi<{ id: number }>({
    url: `api/otherSalaryComponents/delete/${id}`,
    method: 'DELETE',
    headers: {
      Authorization: token,
      'Content-Type': 'application/json',
    },
  })
}

//employee other salary components
export async function getAllEmployeeOtherSalaryComponents(token: string) {
  return fetchApi<GetEmployeeOtherSalaryComponentType[]>({
    url: 'api/employeeOtherSalaryComponents/getall',
    method: 'GET',
    headers: {
      Authorization: token,
      'Content-Type': 'application/json',
    },
  })
}

export async function createEmployeeOtherSalaryComponent(
  data: CreateEmployeeOtherSalaryComponentType,
  token: string
) {
  return fetchApi<CreateEmployeeOtherSalaryComponentType>({
    url: 'api/employeeOtherSalaryComponents/create',
    method: 'POST',
    body: data,
    headers: {
      Authorization: token,
      'Content-Type': 'application/json',
    },
  })
}

export async function editEmployeeOtherSalaryComponent(
  id: number,
  data: CreateEmployeeOtherSalaryComponentType,
  token: string
) {
  return fetchApi<CreateEmployeeOtherSalaryComponentType>({
    url: `api/employeeOtherSalaryComponents/edit/${id}`,
    method: 'PATCH',
    body: data,
    headers: {
      Authorization: `${token}`,
      'Content-Type': 'application/json',
    },
  })
}

export async function deleteEmployeeOtherSalaryComponent(id: number, token: string) {
  return fetchApi<{ id: number }>({
    url: `api/employeeOtherSalaryComponents/delete/${id}`,
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

export async function createLone(
  data: CreateEmployeeLoneType,
  token: string
) {
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
  employeeOtherSalaryComponentId: number,
  updatedBy: number,
  token: string
) {
  return fetchApi<any>({
    url: `api/employeeLones/skipLone/${employeeOtherSalaryComponentId}/${updatedBy}`,
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