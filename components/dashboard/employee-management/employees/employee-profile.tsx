'use client'

import { useState } from 'react'
import { useParams } from 'next/navigation'
import {
  Building2,
  Calendar,
  Copy,
  Droplet,
  FileText,
  Heart,
  Mail,
  MapPin,
  Phone,
  ShieldAlert,
  User,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { cn } from '@/lib/utils'
import { useGetEmployeeById } from '@/hooks/use-api'
import { GetEmployeeType } from '@/utils/type'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatDate(value?: string | null) {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '—'
  return date.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

function formatCurrency(value?: number) {
  if (value === undefined || value === null) return '—'
  return new Intl.NumberFormat('en-BD', {
    style: 'currency',
    currency: 'BDT',
    maximumFractionDigits: 0,
  }).format(value)
}

function getInitials(name?: string) {
  if (!name) return 'NA'
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('')
}

// ---------------------------------------------------------------------------
// Reusable field display
// ---------------------------------------------------------------------------

function InfoField({
  label,
  value,
  icon: Icon,
  copyable,
}: {
  label: string
  value?: string | number | null
  icon?: React.ComponentType<{ className?: string }>
  copyable?: boolean
}) {
  const display =
    value === undefined || value === null || value === '' ? '—' : value

  const handleCopy = () => {
    if (value) navigator.clipboard.writeText(String(value))
  }

  return (
    <div className="space-y-1">
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <div className="flex items-center gap-2">
        {Icon && (
          <Icon className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
        )}
        <p className="text-sm font-medium text-foreground truncate">
          {display}
        </p>
        {copyable && value && (
          <Button
            variant="ghost"
            size="icon"
            className="h-5 w-5 shrink-0"
            onClick={handleCopy}
            aria-label={`Copy ${label}`}
          >
            <Copy className="h-3 w-3" />
          </Button>
        )}
      </div>
    </div>
  )
}

function SectionCard({
  title,
  description,
  children,
}: {
  title: string
  description?: string
  children: React.ReactNode
}) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <h3 className="text-sm font-semibold">{title}</h3>
        {description && (
          <p className="text-xs text-muted-foreground">{description}</p>
        )}
      </CardHeader>
      <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {children}
      </CardContent>
    </Card>
  )
}

// ---------------------------------------------------------------------------
// Loading / Error / Empty states
// ---------------------------------------------------------------------------

function ProfileSkeleton() {
  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="flex flex-col items-start gap-4 pt-6 sm:flex-row sm:items-center">
          <Skeleton className="h-20 w-20 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-5 w-48" />
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-4 w-24" />
          </div>
        </CardContent>
      </Card>
      <Skeleton className="h-10 w-full max-w-xl" />
      <Card>
        <CardContent className="grid grid-cols-1 gap-4 pt-6 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-4 w-32" />
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}

function ProfileError({ onRetry }: { onRetry: () => void }) {
  return (
    <Card>
      <CardContent className="flex flex-col items-center gap-3 py-16 text-center">
        <ShieldAlert className="h-10 w-10 text-destructive" />
        <div>
          <p className="text-sm font-semibold">
            Couldn&apos;t load this employee
          </p>
          <p className="text-xs text-muted-foreground">
            Something went wrong while fetching the profile. Try again.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={onRetry}>
          Retry
        </Button>
      </CardContent>
    </Card>
  )
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export function EmployeeProfile() {
  const params = useParams()
  const employeeId = parseInt(params.employeeId as string, 10)
  const [activeTab, setActiveTab] = useState('overview')
  const {
    data: response,
    isLoading,
    isError,
    refetch,
  } = useGetEmployeeById(employeeId)

  // Extract employee data from the API response
  const employee = response?.data

  console.log('🚀 ~ EmployeeProfile ~ employee:', employee)

  // Handle invalid employeeId
  if (isNaN(employeeId)) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center gap-3 py-16 text-center">
          <ShieldAlert className="h-10 w-10 text-destructive" />
          <div>
            <p className="text-sm font-semibold">Invalid Employee ID</p>
            <p className="text-xs text-muted-foreground">
              The employee ID provided is not valid.
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (isLoading) return <ProfileSkeleton />
  if (isError || !employee) return <ProfileError onRetry={() => refetch()} />

  return (
    <div className="space-y-6">
      <ProfileHeader employee={employee} />

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3 lg:w-fit lg:grid-cols-6">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="contact">Contact</TabsTrigger>
          <TabsTrigger value="employment">Employment</TabsTrigger>
          <TabsTrigger value="qualification">Qualification</TabsTrigger>
          <TabsTrigger value="emergency">Emergency</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
        </TabsList>

        <div className="mt-4">
          <TabsContent value="overview" className="space-y-4">
            <OverviewTab employee={employee} />
          </TabsContent>
          <TabsContent value="contact" className="space-y-4">
            <ContactTab employee={employee} />
          </TabsContent>
          <TabsContent value="employment" className="space-y-4">
            <EmploymentTab employee={employee} />
          </TabsContent>
          <TabsContent value="qualification" className="space-y-4">
            <QualificationTab employee={employee} />
          </TabsContent>
          <TabsContent value="emergency" className="space-y-4">
            <EmergencyTab employee={employee} />
          </TabsContent>
          <TabsContent value="documents" className="space-y-4">
            <DocumentsTab employee={employee} />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Header
// ---------------------------------------------------------------------------

function ProfileHeader({ employee }: { employee: GetEmployeeType }) {
  return (
    <Card>
      <CardContent className="flex flex-col items-start gap-4 pt-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center">
          <Avatar className="h-20 w-20 border">
            <AvatarImage
              src={employee.photoUrl ?? undefined}
              alt={employee.empFullName}
            />
            <AvatarFallback className="text-lg">
              {getInitials(employee.empFullName)}
            </AvatarFallback>
          </Avatar>
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-lg font-semibold">{employee.empFullName}</h2>
              <Badge variant={employee.isActive ? 'default' : 'secondary'}>
                {employee.isActive ? 'Active' : 'Inactive'}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              {employee.designationName ?? 'No designation'}
              {employee.departmentName ? ` · ${employee.departmentName}` : ''}
            </p>
            <p className="text-xs text-muted-foreground">
              Employee Code:{' '}
              <span className="font-medium text-foreground">
                {employee.empCode}
              </span>
            </p>
          </div>
        </div>

        <div className="flex gap-4 sm:flex-col sm:items-end sm:gap-1">
          {employee.workEmail && (
            <a
              href={`mailto:${employee.workEmail}`}
              className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground"
            >
              <Mail className="h-3.5 w-3.5" />
              {employee.workEmail}
            </a>
          )}
          {employee.officialPhone && (
            <a
              href={`tel:${employee.officialPhone}`}
              className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground"
            >
              <Phone className="h-3.5 w-3.5" />
              {employee.officialPhone}
            </a>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

// ---------------------------------------------------------------------------
// Tabs
// ---------------------------------------------------------------------------

function OverviewTab({ employee }: { employee: GetEmployeeType }) {
  return (
    <SectionCard title="Basic Information">
      <InfoField label="Full Name" value={employee.empFullName} icon={User} />
      <InfoField label="Short Name" value={employee.empShortName} />
      <InfoField
        label="Date of Birth"
        value={formatDate(employee.dob)}
        icon={Calendar}
      />
      <InfoField
        label="Date of Joining"
        value={formatDate(employee.doj)}
        icon={Calendar}
      />
      {employee.doc && (
        <InfoField
          label="Date of Confirmation"
          value={formatDate(employee.doc)}
          icon={Calendar}
        />
      )}
      <InfoField label="Gender" value={employee.gender} />
      <InfoField
        label="Marital Status"
        value={employee.maritalStatus}
        icon={Heart}
      />
      <InfoField
        label="Blood Group"
        value={employee.bloodGroup}
        icon={Droplet}
      />
      <InfoField label="Religion" value={employee.religion} />
      <InfoField label="Nationality" value={employee.nationality} />
      <InfoField label="National ID No." value={employee.nationalIdNo} />
    </SectionCard>
  )
}

function ContactTab({ employee }: { employee: GetEmployeeType }) {
  return (
    <>
      <SectionCard title="Contact Details">
        <InfoField
          label="Work Email"
          value={employee.workEmail}
          icon={Mail}
          copyable
        />
        <InfoField
          label="Private Email"
          value={employee.privateEmail}
          icon={Mail}
          copyable
        />
        <InfoField
          label="Official Phone"
          value={employee.officialPhone}
          icon={Phone}
          copyable
        />
        <InfoField
          label="Personal Phone"
          value={employee.personalPhone}
          icon={Phone}
          copyable
        />
        <InfoField
          label="Home Phone"
          value={employee.homePhone}
          icon={Phone}
          copyable
        />
      </SectionCard>

      <SectionCard title="Address">
        <InfoField
          label="Present Address"
          value={employee.presentAddress}
          icon={MapPin}
        />
        <InfoField
          label="Permanent Address"
          value={employee.permanentAddress}
          icon={MapPin}
        />
        <InfoField label="City" value={employee.city} />
        <InfoField label="Country" value={employee.country} />
        <InfoField label="Zip Code" value={employee.zipCode} />
      </SectionCard>
    </>
  )
}

function EmploymentTab({ employee }: { employee: GetEmployeeType }) {
  return (
    <SectionCard title="Employment Information">
      <InfoField
        label="Department"
        value={employee.departmentName}
        icon={Building2}
      />
      <InfoField
        label="Designation"
        value={employee.designationName}
        icon={Building2}
      />
      <InfoField
        label="Basic Salary"
        value={formatCurrency(employee.basicSalary)}
      />
      <InfoField
        label="Date of Joining"
        value={formatDate(employee.doj)}
        icon={Calendar}
      />
      <InfoField
        label="Status"
        value={employee.isActive ? 'Active' : 'Inactive'}
      />
      {employee.shift && <InfoField label="Shift" value={employee.shift} />}
    </SectionCard>
  )
}

function QualificationTab({ employee }: { employee: GetEmployeeType }) {
  const hasQualificationDetails =
    employee.instituteName || employee.subjectName || employee.result

  return (
    <SectionCard title="Qualification">
      <InfoField
        label="Qualification"
        value={employee.qualification}
        icon={FileText}
      />
      <InfoField label="Institute" value={employee.instituteName} />
      <InfoField label="Subject" value={employee.subjectName} />
      <InfoField label="Result" value={employee.result} />
      <InfoField
        label="Start Date"
        value={formatDate(employee.startDate)}
        icon={Calendar}
      />
      <InfoField
        label="End Date"
        value={formatDate(employee.endDate)}
        icon={Calendar}
      />
      {!hasQualificationDetails && (
        <p className="col-span-full text-xs text-muted-foreground">
          No additional qualification details on file.
        </p>
      )}
    </SectionCard>
  )
}

function EmergencyTab({ employee }: { employee: GetEmployeeType }) {
  const hasEmergencyContact =
    employee.emergencyContactName || employee.emergencyContactPhone

  const hasDependents = employee.dependentsName || employee.dependentRelation

  return (
    <>
      <SectionCard title="Emergency Contact">
        {hasEmergencyContact ? (
          <>
            <InfoField
              label="Name"
              value={employee.emergencyContactName}
              icon={User}
            />
            <InfoField
              label="Phone"
              value={employee.emergencyContactPhone}
              icon={Phone}
              copyable
            />
            <InfoField
              label="Relation"
              value={employee.emergencyContactRelation}
            />
          </>
        ) : (
          <p className="col-span-full text-xs text-muted-foreground">
            No emergency contact on file.
          </p>
        )}
      </SectionCard>

      <SectionCard title="Dependents">
        {hasDependents ? (
          <>
            <InfoField
              label="Name"
              value={employee.dependentsName}
              icon={User}
            />
            <InfoField label="Relation" value={employee.dependentRelation} />
          </>
        ) : (
          <p className="col-span-full text-xs text-muted-foreground">
            No dependents on file.
          </p>
        )}
      </SectionCard>
    </>
  )
}

function DocumentsTab({ employee }: { employee: GetEmployeeType }) {
  const documents = [
    { label: 'Photo', url: employee.photoUrl },
    { label: 'CV / Resume', url: employee.cvUrl },
    { label: 'Certificate', url: employee.certificateUrl },
  ].filter((doc) => doc.url)

  if (documents.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center gap-2 py-12 text-center">
          <FileText className="h-8 w-8 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            No documents uploaded yet.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <h3 className="text-sm font-semibold">Documents</h3>
      </CardHeader>
      <CardContent className="space-y-2">
        {documents.map((doc, i) => (
          <div key={doc.label}>
            {i > 0 && <Separator className="my-2" />}
            <a
              href={doc.url ?? '#'}
              target="_blank"
              rel="noopener noreferrer"
              className={cn(
                'flex items-center justify-between rounded-md px-2 py-2 text-sm hover:bg-muted'
              )}
            >
              <span className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-muted-foreground" />
                {doc.label}
              </span>
              <span className="text-xs text-muted-foreground">View →</span>
            </a>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}

export default EmployeeProfile
