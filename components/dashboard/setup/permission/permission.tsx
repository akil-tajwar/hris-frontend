'use client'

import {
  useGetPermissions,
  useGetRoles,
  useUpdatePermission,
} from '@/hooks/use-api'

import { useQueryClient } from '@tanstack/react-query'
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  Shield,
  Users,
  Lock,
  ChevronRight,
  ChevronDown,
  CheckCircle2,
  XCircle,
  Save,
  X,
  Search,
  CheckSquare,
  Square,
  Maximize2,
  Minimize2,
} from 'lucide-react'

type Role = { roleId: number; roleName: string; permission: number[] }
type Permission = { permissionId: number; permissionName: string }

// Small debounce hook so search doesn't re-filter on every keystroke
function useDebouncedValue<T>(value: T, delay = 200): T {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(id)
  }, [value, delay])
  return debounced
}

const Permission = () => {
  const queryClient = useQueryClient()

  const rolesQuery = useGetRoles()
  const permissionsQuery = useGetPermissions()

  const [selectedRoleId, setSelectedRoleId] = useState<number | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const debouncedSearch = useDebouncedValue(searchTerm, 200)
  const [hasChanges, setHasChanges] = useState(false)
  const [editMode, setEditMode] = useState(false)
  // Only populated while editMode is true — a working copy of the selected
  // role's permission IDs. The base role data itself comes from the query
  // cache and isn't mutated directly.
  const [draftPermissions, setDraftPermissions] = useState<number[] | null>(
    null
  )
  // Keyed by roleId so collapse state doesn't leak between roles
  const [collapsedByRole, setCollapsedByRole] = useState<
    Record<number, Set<string>>
  >({})
  const [pendingRoleId, setPendingRoleId] = useState<number | null>(null)

  const searchInputRef = useRef<HTMLInputElement>(null)

  const loading = rolesQuery.isLoading || permissionsQuery.isLoading

  // Normalize roles coming back from the API. Permission IDs are coerced to
  // numbers regardless of whether the backend sends numbers or numeric
  // strings — mixed types here silently break `.includes()` checks later.
  const mappedRoles: Role[] = useMemo(() => {
    const raw = (rolesQuery.data as any)?.data ?? []
    return raw.map((role: any) => {
      const permArray = role.permissions || role.permission || []
      return {
        roleId: role.roleId,
        roleName: role.roleName,
        permission: Array.isArray(permArray)
          ? permArray
              .map((p: any) => Number(p))
              .filter((n: number) => !Number.isNaN(n))
          : typeof permArray === 'string'
            ? permArray
                .split(',')
                .map((p: string) => parseInt(p.trim(), 10))
                .filter((n: number) => !Number.isNaN(n))
            : [],
      }
    })
  }, [rolesQuery.data])

  const mappedPermissions: Permission[] = useMemo(() => {
    const raw = (permissionsQuery.data as any)?.data ?? []
    return raw.map((item: any) => ({
      permissionId: Number(item.permissionId),
      permissionName: item.permissionName,
    }))
  }, [permissionsQuery.data])

  const baseSelectedRole = useMemo(
    () => mappedRoles.find((r) => r.roleId === selectedRoleId) ?? null,
    [mappedRoles, selectedRoleId]
  )

  // What the panel actually renders: the live draft while editing, otherwise
  // the role as it exists in the query cache.
  const selectedRole: Role | null = useMemo(() => {
    if (!baseSelectedRole) return null
    if (editMode) {
      return {
        ...baseSelectedRole,
        permission: draftPermissions ?? baseSelectedRole.permission,
      }
    }
    return baseSelectedRole
  }, [baseSelectedRole, editMode, draftPermissions])

  const collapsedCategories = useMemo(
    () =>
      selectedRole
        ? (collapsedByRole[selectedRole.roleId] ?? new Set<string>())
        : new Set<string>(),
    [collapsedByRole, selectedRole]
  )

  const updatePermissionMutation = useUpdatePermission({
    onClose: () => setEditMode(false),
    reset: () => {
      setHasChanges(false)
      setDraftPermissions(null)
    },
  })

  // Warn on tab close / refresh with unsaved changes
  useEffect(() => {
    if (!hasChanges) return
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault()
      e.returnValue = ''
    }
    window.addEventListener('beforeunload', handler)
    return () => window.removeEventListener('beforeunload', handler)
  }, [hasChanges])

  // Check if role has permission
  const hasPermission = (permissionId: number) => {
    if (!selectedRole) return false
    return selectedRole.permission.includes(permissionId)
  }

  // Toggle permission
  const togglePermission = (permissionId: number) => {
    if (!selectedRole || !editMode) return

    setDraftPermissions((prev) => {
      const current = prev ?? selectedRole.permission
      const hasIt = current.includes(permissionId)
      return hasIt
        ? current.filter((id) => id !== permissionId)
        : [...current, permissionId]
    })

    setHasChanges(true)
  }

  // Bulk toggle for a whole category
  const toggleCategory = (categoryPerms: Permission[], selectAll: boolean) => {
    if (!selectedRole || !editMode) return

    setDraftPermissions((prev) => {
      const current = prev ?? selectedRole.permission
      const ids = categoryPerms.map((p) => p.permissionId)
      return selectAll
        ? Array.from(new Set([...current, ...ids]))
        : current.filter((id) => !ids.includes(id))
    })

    setHasChanges(true)
  }

  const toggleCategoryCollapse = (category: string) => {
    if (!selectedRole) return
    const roleId = selectedRole.roleId
    setCollapsedByRole((prev) => {
      const current = new Set(prev[roleId] ?? [])
      if (current.has(category)) current.delete(category)
      else current.add(category)
      return { ...prev, [roleId]: current }
    })
  }

  // Save changes
  const handleSave = useCallback(() => {
    if (
      !baseSelectedRole ||
      !draftPermissions ||
      updatePermissionMutation.isPending
    )
      return

    updatePermissionMutation.mutate(
      { id: baseSelectedRole.roleId, data: draftPermissions },
      {
        onSuccess: () => {
          // useUpdatePermission invalidates the master ['permissions'] list,
          // not ['roles'] — so patch the roles cache locally to reflect the
          // save immediately (mirrors what the sidebar count reads).
          queryClient.setQueryData<any>(['roles'], (old: any) => {
            if (!old?.data) return old
            return {
              ...old,
              data: old.data.map((r: any) =>
                r.roleId === baseSelectedRole.roleId
                  ? { ...r, permissions: draftPermissions }
                  : r
              ),
            }
          })
        },
      }
    )
  }, [
    baseSelectedRole,
    draftPermissions,
    updatePermissionMutation,
    queryClient,
  ])

  // Cancel editing
  const handleCancel = useCallback(() => {
    setDraftPermissions(null)
    setHasChanges(false)
    setEditMode(false)
  }, [])

  // Keyboard shortcuts: Ctrl/Cmd+S to save, Esc to cancel
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (editMode && (e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault()
        if (hasChanges) handleSave()
      }
      if (editMode && e.key === 'Escape') {
        handleCancel()
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [editMode, hasChanges, handleSave, handleCancel])

  // Selecting a role always opens every category so its permissions are visible immediately
  const selectRole = (role: Role) => {
    if (hasChanges) {
      setPendingRoleId(role.roleId)
      return
    }
    setSelectedRoleId(role.roleId)
    setEditMode(false)
    setDraftPermissions(null)
    setSearchTerm('')
  }

  const confirmDiscardAndSwitch = () => {
    if (pendingRoleId !== null) {
      setSelectedRoleId(pendingRoleId)
      setHasChanges(false)
      setEditMode(false)
      setDraftPermissions(null)
      setSearchTerm('')
    }
    setPendingRoleId(null)
  }

  // Filter permissions based on edit mode
  const filteredPermissions = useMemo(() => {
    const term = debouncedSearch.toLowerCase()
    if (editMode) {
      return mappedPermissions.filter(
        (p) =>
          p.permissionName.toLowerCase().includes(term) ||
          p.permissionId.toString().includes(term)
      )
    }
    if (!selectedRole) return []
    return mappedPermissions.filter((p) => {
      const has = selectedRole.permission.includes(p.permissionId)
      return (
        has &&
        (p.permissionName.toLowerCase().includes(term) ||
          p.permissionId.toString().includes(term))
      )
    })
  }, [editMode, mappedPermissions, selectedRole, debouncedSearch])

  // Group permissions by category
  const groupedPermissions = useMemo(() => {
    return filteredPermissions.reduce(
      (acc, perm) => {
        const parts = perm.permissionName.split('.')
        const category = parts.length > 1 ? parts[0] : 'general'
        if (!acc[category]) acc[category] = []
        acc[category].push(perm)
        return acc
      },
      {} as Record<string, Permission[]>
    )
  }, [filteredPermissions])

  const categoryEntries = Object.entries(groupedPermissions)
  const allCategoriesCollapsed =
    categoryEntries.length > 0 &&
    categoryEntries.every(([category]) => collapsedCategories.has(category))

  const expandAll = () => {
    if (!selectedRole) return
    setCollapsedByRole((prev) => ({
      ...prev,
      [selectedRole.roleId]: new Set(),
    }))
  }

  const collapseAll = () => {
    if (!selectedRole) return
    setCollapsedByRole((prev) => ({
      ...prev,
      [selectedRole.roleId]: new Set(
        categoryEntries.map(([category]) => category)
      ),
    }))
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-16 bg-white rounded-lg border" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-24 bg-white rounded-lg border" />
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="h-96 bg-white rounded-lg border lg:col-span-1" />
            <div className="h-96 bg-white rounded-lg border lg:col-span-2" />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Discard changes confirm modal */}
      {pendingRoleId !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-sm w-full p-5">
            <h3 className="font-semibold text-gray-900 mb-2">
              Discard unsaved changes?
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              You have unsaved permission changes for{' '}
              <span className="font-medium">{selectedRole?.roleName}</span>.
              Switching roles will discard them.
            </p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setPendingRoleId(null)}
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg"
              >
                Keep editing
              </button>
              <button
                onClick={confirmDiscardAndSwitch}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg"
              >
                Discard & switch
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="bg-white border-b shadow-sm sticky top-0 z-30">
        <div className="px-6 py-4">
          <div className="flex items-center gap-3">
            <Shield className="w-8 h-8 text-blue-600" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Role & Permission Management
              </h1>
              <p className="text-sm text-gray-500">
                Manage access control and permissions
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="px-6">
        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
          <div className="bg-white rounded-lg shadow-sm border p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Roles</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {mappedRoles.length}
                </p>
              </div>
              <Users className="w-10 h-10 text-blue-500 opacity-20" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Permissions</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {mappedPermissions.length}
                </p>
              </div>
              <Lock className="w-10 h-10 text-green-500 opacity-20" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Assigned Permissions</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {selectedRole ? selectedRole.permission.length : '-'}
                </p>
              </div>
              <Shield className="w-10 h-10 text-purple-500 opacity-20" />
            </div>
          </div>
        </div>

        <div className="py-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Roles Sidebar */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-lg shadow-sm border lg:sticky lg:top-24">
                <div className="p-4 border-b bg-gray-50">
                  <div className="flex items-center gap-2">
                    <Users className="w-5 h-5 text-gray-600" />
                    <h2 className="font-semibold text-gray-900">
                      Roles ({mappedRoles.length})
                    </h2>
                  </div>
                </div>
                <div className="p-2 max-h-[calc(100vh-220px)] overflow-y-auto">
                  {mappedRoles.length === 0 ? (
                    <p className="text-center text-gray-500 py-8">
                      No roles found
                    </p>
                  ) : (
                    <div className="space-y-1">
                      {mappedRoles.map((role) => (
                        <button
                          key={role.roleId}
                          onClick={() => selectRole(role)}
                          className={`w-full text-left px-4 py-3 rounded-lg transition-all flex items-center justify-between group ${
                            selectedRole?.roleId === role.roleId
                              ? 'bg-blue-50 border-2 border-blue-500 text-blue-700'
                              : 'hover:bg-gray-50 border-2 border-transparent'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div
                              className={`w-2 h-2 rounded-full ${
                                selectedRole?.roleId === role.roleId
                                  ? 'bg-blue-500'
                                  : 'bg-gray-300'
                              }`}
                            ></div>
                            <div>
                              <div className="font-medium">{role.roleName}</div>
                              <div className="text-xs text-gray-500">
                                {role.permission.length} permissions
                              </div>
                            </div>
                          </div>
                          <ChevronRight
                            className={`w-4 h-4 transition-transform ${
                              selectedRole?.roleId === role.roleId
                                ? 'rotate-90'
                                : ''
                            }`}
                          />
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Permissions Panel */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-lg shadow-sm border">
                <div className="p-4 border-b bg-gray-50 sticky top-16 z-20">
                  <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
                    <div className="flex items-center gap-2">
                      <Lock className="w-5 h-5 text-gray-600" />
                      <h2 className="font-semibold text-gray-900">
                        {selectedRole
                          ? `${selectedRole.roleName} Permissions`
                          : 'Select a Role'}
                      </h2>
                      {hasChanges && (
                        <span className="text-xs font-medium text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full">
                          Unsaved changes
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3">
                      {selectedRole && (
                        <div className="text-sm text-gray-600">
                          <span className="font-medium text-green-600">
                            {selectedRole.permission.length}
                          </span>{' '}
                          / {mappedPermissions.length} assigned
                        </div>
                      )}
                      {selectedRole && !editMode && (
                        <button
                          onClick={() => {
                            setDraftPermissions(selectedRole.permission)
                            setEditMode(true)
                          }}
                          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                        >
                          Edit Permissions
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  {editMode && (
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex gap-2">
                        <button
                          onClick={handleSave}
                          disabled={
                            updatePermissionMutation.isPending || !hasChanges
                          }
                          className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <Save className="w-4 h-4" />
                          {updatePermissionMutation.isPending
                            ? 'Saving...'
                            : 'Save Changes'}
                        </button>
                        <button
                          onClick={handleCancel}
                          disabled={updatePermissionMutation.isPending}
                          className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors text-sm font-medium disabled:opacity-50"
                        >
                          Cancel
                        </button>
                      </div>
                      <span className="text-xs text-gray-400 hidden sm:inline">
                        ⌘/Ctrl+S to save · Esc to cancel
                      </span>
                    </div>
                  )}

                  <div className="flex items-center gap-2">
                    {/* Search Bar */}
                    <div className="relative flex-1">
                      <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        ref={searchInputRef}
                        type="text"
                        placeholder="Search permissions..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-9 pr-9 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      {searchTerm && (
                        <button
                          onClick={() => setSearchTerm('')}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                          aria-label="Clear search"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                    {selectedRole && categoryEntries.length > 0 && (
                      <button
                        onClick={
                          allCategoriesCollapsed ? expandAll : collapseAll
                        }
                        className="flex items-center gap-1.5 px-3 py-2 border rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100 whitespace-nowrap"
                      >
                        {allCategoriesCollapsed ? (
                          <>
                            <Maximize2 className="w-3.5 h-3.5" /> Expand all
                          </>
                        ) : (
                          <>
                            <Minimize2 className="w-3.5 h-3.5" /> Collapse all
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </div>

                <div className="p-4 max-h-[calc(100vh-340px)] overflow-y-auto">
                  {!selectedRole ? (
                    <div className="text-center py-16">
                      <Shield className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                      <p className="text-gray-500">
                        Select a role to view its permissions
                      </p>
                    </div>
                  ) : filteredPermissions.length === 0 ? (
                    <div className="text-center py-16">
                      <XCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                      <p className="text-gray-500">
                        {searchTerm
                          ? 'No permissions found matching your search'
                          : 'No permissions assigned to this role'}
                      </p>
                      {searchTerm && (
                        <button
                          onClick={() => setSearchTerm('')}
                          className="mt-3 text-sm text-blue-600 hover:underline"
                        >
                          Clear search
                        </button>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {categoryEntries.map(([category, perms]) => {
                        const isCollapsed = collapsedCategories.has(category)
                        const assignedCount = perms.filter((p) =>
                          hasPermission(p.permissionId)
                        ).length
                        const allSelected = assignedCount === perms.length

                        return (
                          <div
                            key={category}
                            className="border rounded-lg overflow-hidden"
                          >
                            {/* Accordion header — the whole row is clickable */}
                            <button
                              onClick={() => toggleCategoryCollapse(category)}
                              className="w-full flex items-center justify-between gap-3 px-4 py-3 bg-gray-50 hover:bg-gray-100 transition-colors"
                            >
                              <div className="flex items-center gap-2 min-w-0">
                                <ChevronDown
                                  className={`w-4 h-4 text-gray-500 flex-shrink-0 transition-transform ${
                                    isCollapsed ? '-rotate-90' : ''
                                  }`}
                                />
                                <div className="w-1 h-4 bg-blue-500 rounded flex-shrink-0"></div>
                                <span className="text-sm font-semibold text-gray-700 uppercase truncate">
                                  {category}
                                </span>
                              </div>
                              <div className="flex items-center gap-3 flex-shrink-0">
                                <span
                                  className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                                    assignedCount === perms.length
                                      ? 'bg-green-100 text-green-700'
                                      : assignedCount === 0
                                        ? 'bg-gray-200 text-gray-600'
                                        : 'bg-amber-100 text-amber-700'
                                  }`}
                                >
                                  {assignedCount}/{perms.length}
                                </span>
                                {editMode && (
                                  <span
                                    role="button"
                                    tabIndex={0}
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      toggleCategory(perms, !allSelected)
                                    }}
                                    onKeyDown={(e) => {
                                      if (e.key === 'Enter' || e.key === ' ') {
                                        e.stopPropagation()
                                        toggleCategory(perms, !allSelected)
                                      }
                                    }}
                                    className="flex items-center gap-1.5 text-xs font-medium text-blue-600 hover:text-blue-800"
                                  >
                                    {allSelected ? (
                                      <CheckSquare className="w-3.5 h-3.5" />
                                    ) : (
                                      <Square className="w-3.5 h-3.5" />
                                    )}
                                    {allSelected
                                      ? 'Deselect all'
                                      : 'Select all'}
                                  </span>
                                )}
                              </div>
                            </button>

                            {!isCollapsed && (
                              <div className="p-3 grid grid-cols-1 sm:grid-cols-2 gap-2 bg-white">
                                {perms.map((perm) => {
                                  const isActive = hasPermission(
                                    perm.permissionId
                                  )
                                  return (
                                    <button
                                      key={perm.permissionId}
                                      onClick={() =>
                                        togglePermission(perm.permissionId)
                                      }
                                      disabled={!editMode}
                                      className={`flex items-center gap-3 p-3 rounded-lg border transition-all ${
                                        isActive
                                          ? 'bg-green-50 border-green-300'
                                          : 'bg-gray-50 border-gray-200'
                                      } ${
                                        editMode
                                          ? 'cursor-pointer hover:border-blue-300 hover:shadow-sm'
                                          : 'cursor-default'
                                      }`}
                                    >
                                      {isActive ? (
                                        <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0" />
                                      ) : (
                                        <XCircle className="w-5 h-5 text-gray-300 flex-shrink-0" />
                                      )}
                                      <span
                                        className={`text-sm font-medium text-left ${
                                          isActive
                                            ? 'text-green-900'
                                            : 'text-gray-500'
                                        }`}
                                      >
                                        {perm.permissionId}.
                                        {perm.permissionName}
                                      </span>
                                    </button>
                                  )
                                })}
                              </div>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Permission
