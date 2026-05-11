'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { EyeIcon, EyeOffIcon, User, LockIcon, MailIcon } from 'lucide-react'
import { toast } from '@/hooks/use-toast'
import { registerUser } from '@/utils/api'
import { useGetRoles, useGetTenants } from '@/hooks/use-api'
import { CustomCombobox } from '@/utils/custom-combobox'

export default function RegisterUser() {
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  // Form state for role and tenant
  const [roleId, setRoleId] = useState<number>(0)
  const [tenantId, setTenantId] = useState<number>(0)
  const [isPasswordResetRequired, setIsPasswordResetRequired] = useState(false)
  const [active, setActive] = useState(true) // Default to active

  // Fetch roles and tenants from API
  const { data: rolesData, isLoading: rolesLoading } = useGetRoles()
  const { data: tenantsData, isLoading: tenantsLoading } = useGetTenants()

  const handleSelectChange = (field: 'roleId' | 'tenantId', value: string) => {
    const numericValue = parseInt(value, 10)
    if (field === 'roleId') {
      setRoleId(numericValue)
    } else {
      setTenantId(numericValue)
    }
  }

  const handleActiveToggle = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.checked
    setActive(newValue)
    console.log('Active toggled:', newValue)
  }

  const handlePasswordResetToggle = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const newValue = e.target.checked
    setIsPasswordResetRequired(newValue)
    console.log('Password reset toggled:', newValue)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    console.log('Current form values:', {
      username,
      email,
      password,
      confirmPassword,
      roleId,
      tenantId,
      isPasswordResetRequired,
      active,
    })

    // Validate all fields
    if (!username || !email || !password || !confirmPassword) {
      setError('Please fill in all fields.')
      setIsLoading(false)
      return
    }

    // Validate role and tenant selection
    if (!roleId || roleId === 0) {
      setError('Please select a role.')
      setIsLoading(false)
      return
    }

    if (!tenantId || tenantId === 0) {
      setError('Please select a tenant.')
      setIsLoading(false)
      return
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      setError('Please enter a valid email address.')
      setIsLoading(false)
      return
    }

    // Check if password and confirm password match
    if (password !== confirmPassword) {
      setError('Passwords do not match.')
      setIsLoading(false)
      return
    }

    // Validate password length
    if (password.length < 6) {
      setError('Password must be at least 6 characters long.')
      setIsLoading(false)
      return
    }

    try {
      // Prepare request body with all fields including active
      const requestData = {
        username,
        email,
        password,
        confirmPassword,
        roleId,
        tenantId,
        isPasswordResetRequired,
        active,
      }

      console.log('Sending request data:', requestData)

      const response = await registerUser(requestData)

      if (response.error || !response.data) {
        toast({
          title: 'Error',
          description: response.error?.message || 'Failed to register user',
          variant: 'destructive',
        })
      } else {
        toast({
          title: 'Success',
          description: 'User registered successfully!',
        })

        // Reset form
        setUsername('')
        setEmail('')
        setPassword('')
        setConfirmPassword('')
        setRoleId(0)
        setTenantId(0)
        setIsPasswordResetRequired(false)
        setActive(true) // Reset to default active

        // Optional: Redirect to users list or login page
        // router.push('/users')
        // router.push('/login')
      }
    } catch (err) {
      console.error('Registration error:', err)
      setError('An unexpected error occurred. Please try again later.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      <div className="flex items-center gap-2 mb-4">
        <div className="bg-amber-100 p-2 rounded-md">
          <User className="text-amber-600" />
        </div>
        <h2 className="text-lg font-semibold">Register User</h2>
      </div>
      <Card className="w-full max-w-md border border-black">
        <CardHeader className="space-y-1">
          <CardTitle className="text-xl font-bold text-center">
            Create a new user account
          </CardTitle>
          <CardDescription className="text-center">
            Fill in the details to register a new user
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">
                Username <span className="text-red-500">*</span>
              </Label>
              <Input
                id="username"
                type="text"
                placeholder="Enter username"
                className="border border-black"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">
                Email <span className="text-red-500">*</span>
              </Label>
              <div className="relative">
                <MailIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter email address"
                  className="border border-black pl-10"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">
                Password <span className="text-red-500">*</span>
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter password (min. 6 characters)"
                  className="border border-black pr-10"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOffIcon className="h-4 w-4" />
                  ) : (
                    <EyeIcon className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">
                Confirm Password <span className="text-red-500">*</span>
              </Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  placeholder="Confirm your password"
                  className="border border-black pr-10"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? (
                    <EyeOffIcon className="h-4 w-4" />
                  ) : (
                    <EyeIcon className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>

            {/* Role Selection */}
            <div className="space-y-2">
              <Label htmlFor="roleId">
                Role <span className="text-red-500">*</span>
              </Label>
              <CustomCombobox
                items={
                  rolesData?.data?.map((role) => ({
                    id: role?.roleId?.toString() || '0',
                    name: role?.roleName || 'Unnamed role',
                  })) || []
                }
                value={
                  roleId && roleId !== 0
                    ? {
                        id: roleId.toString(),
                        name:
                          rolesData?.data?.find((r) => r.roleId === roleId)
                            ?.roleName || '',
                      }
                    : null
                }
                onChange={(value) =>
                  handleSelectChange('roleId', value ? String(value.id) : '0')
                }
                placeholder={rolesLoading ? 'Loading roles...' : 'Select role'}
                disabled={rolesLoading}
              />
            </div>

            {/* Tenant Selection */}
            <div className="space-y-2">
              <Label htmlFor="tenantId">
                Tenant <span className="text-red-500">*</span>
              </Label>
              <CustomCombobox
                items={
                  tenantsData?.data?.map((tenant) => ({
                    id: tenant?.tenantId?.toString() || '0',
                    name: tenant?.tenantName || 'Unnamed tenant',
                  })) || []
                }
                value={
                  tenantId && tenantId !== 0
                    ? {
                        id: tenantId.toString(),
                        name:
                          tenantsData?.data?.find(
                            (t) => t.tenantId === tenantId
                          )?.tenantName || '',
                      }
                    : null
                }
                onChange={(value) =>
                  handleSelectChange('tenantId', value ? String(value.id) : '0')
                }
                placeholder={
                  tenantsLoading ? 'Loading tenants...' : 'Select tenant'
                }
                disabled={tenantsLoading}
              />
            </div>

            {/* Status (Active/Inactive) Switch */}
            <div className="space-y-2">
              <Label>Status</Label>
              <div className="flex items-center gap-2 h-9">
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={active}
                    onChange={handleActiveToggle}
                    className="sr-only peer"
                  />
                  <div className="w-10 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:bg-black transition-colors" />
                  <div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full shadow transition-transform peer-checked:translate-x-4" />
                </label>
                <span className="text-sm text-muted-foreground">
                  {active ? 'Active' : 'Inactive'}
                </span>
              </div>
            </div>

            {/* Password Reset Required Switch */}
            {/* <div className="space-y-2">
              <Label>Password Reset Required</Label>
              <div className="flex items-center gap-2 h-9">
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isPasswordResetRequired}
                    onChange={handlePasswordResetToggle}
                    className="sr-only peer"
                  />
                  <div className="w-10 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:bg-black transition-colors" />
                  <div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full shadow transition-transform peer-checked:translate-x-4" />
                </label>
                <span className="text-sm text-muted-foreground">
                  {isPasswordResetRequired ? 'Yes' : 'No'}
                </span>
              </div>
            </div> */}

            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <Button
              type="submit"
              className="w-full bg-amber-500 hover:bg-amber-600 text-white"
              disabled={isLoading || rolesLoading || tenantsLoading}
            >
              <LockIcon className="mr-2 h-4 w-4" />
              {isLoading ? 'Registering...' : 'Register User'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
