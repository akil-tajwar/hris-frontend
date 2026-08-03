'use client'

import {
  useGetPermissions,
  useGetRoles,
  useUpdatePermission,
} from '@/hooks/use-api'

import { useQueryClient } from '@tanstack/react-query'
import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { Fingerprint, Save, Search, X } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import CustomSwitch from '@/utils/custom-switch'
import { Card } from '@/components/ui/card'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'

type Role = { roleId: number; roleName: string; permission: number[] }
type PermissionItem = { permissionId: number; permissionName: string }

function useDebouncedValue<T>(value: T, delay = 200): T {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(id)
  }, [value, delay])
  return debounced
}

const Permissions = () => {
  const queryClient = useQueryClient()

  const { data: roles, isLoading: rolesLoading } = useGetRoles()
  const { data: permissions, isLoading: permissionsLoading } =
    useGetPermissions()

  const [selectedRoleId, setSelectedRoleId] = useState<number | null>(null)
  const [roleFilter, setRoleFilter] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const debouncedSearch = useDebouncedValue(searchTerm, 200)
  const [activeCategory, setActiveCategory] = useState<string>('all')
  const [hasChanges, setHasChanges] = useState(false)
  const [editMode, setEditMode] = useState(false)
  const [draftPermissions, setDraftPermissions] = useState<number[] | null>(
    null
  )
  const [pendingRoleId, setPendingRoleId] = useState<number | null>(null)

  const loading = rolesLoading || permissionsLoading

  // Normalize roles. Permission IDs are coerced to numbers regardless of
  // whether the backend sends numbers or numeric strings.
  const mappedRoles: Role[] = useMemo(() => {
    const raw = (roles as any)?.data ?? []
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
  }, [roles])

  // The API's permission shape is `{ id, name }`; fall back to
  // `permissionId`/`permissionName` too in case that ever changes.
  const mappedPermissions: PermissionItem[] = useMemo(() => {
    const raw = (permissions as any)?.data ?? []
    return raw.map((item: any) => ({
      permissionId: Number(item.permissionId ?? item.id),
      permissionName: item.permissionName ?? item.name ?? '',
    }))
  }, [permissions])

  const baseSelectedRole = useMemo(
    () => mappedRoles.find((r) => r.roleId === selectedRoleId) ?? null,
    [mappedRoles, selectedRoleId]
  )

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

  const updatePermissionMutation = useUpdatePermission({
    onClose: () => setEditMode(false),
    reset: () => {
      setHasChanges(false)
      setDraftPermissions(null)
    },
  })

  useEffect(() => {
    if (!hasChanges) return
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault()
      e.returnValue = ''
    }
    window.addEventListener('beforeunload', handler)
    return () => window.removeEventListener('beforeunload', handler)
  }, [hasChanges])

  const hasPermission = (permissionId: number) => {
    if (!selectedRole) return false
    return selectedRole.permission.includes(permissionId)
  }

  const setPermission = (permissionId: number, grant: boolean) => {
    if (!selectedRole || !editMode) return
    setDraftPermissions((prev) => {
      const current = prev ?? selectedRole.permission
      return grant
        ? Array.from(new Set([...current, permissionId]))
        : current.filter((id) => id !== permissionId)
    })
    setHasChanges(true)
  }

  const setVisible = (ids: number[], grant: boolean) => {
    if (!selectedRole || !editMode) return
    setDraftPermissions((prev) => {
      const current = prev ?? selectedRole.permission
      return grant
        ? Array.from(new Set([...current, ...ids]))
        : current.filter((id) => !ids.includes(id))
    })
    setHasChanges(true)
  }

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
          // useUpdatePermission invalidates ['permissions'], not ['roles'] —
          // patch the roles cache locally so the counts update right away.
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

  const handleCancel = useCallback(() => {
    setDraftPermissions(null)
    setHasChanges(false)
    setEditMode(false)
  }, [])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (editMode && (e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault()
        if (hasChanges) handleSave()
      }
      if (editMode && e.key === 'Escape') handleCancel()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [editMode, hasChanges, handleSave, handleCancel])

  const selectRole = (role: Role) => {
    if (hasChanges) {
      setPendingRoleId(role.roleId)
      return
    }
    setSelectedRoleId(role.roleId)
    setEditMode(false)
    setDraftPermissions(null)
    setSearchTerm('')
    setActiveCategory('all')
  }

  const confirmDiscardAndSwitch = () => {
    if (pendingRoleId !== null) {
      setSelectedRoleId(pendingRoleId)
      setHasChanges(false)
      setEditMode(false)
      setDraftPermissions(null)
      setSearchTerm('')
      setActiveCategory('all')
    }
    setPendingRoleId(null)
  }

  const filteredRoles = useMemo(() => {
    const term = roleFilter.trim().toLowerCase()
    if (!term) return mappedRoles
    return mappedRoles.filter((r) => r.roleName.toLowerCase().includes(term))
  }, [mappedRoles, roleFilter])

  // Only permissions with dot-notation names ("module.action") get a
  // category; anything else is just left ungrouped under "All" — no
  // catch-all "general" bucket.
  const categoryOf = (name: string): string | null => {
    const parts = name.split('.')
    return parts.length > 1 ? parts[0] : null
  }

  // The pool of permissions to browse: the whole catalog while editing,
  // otherwise only what the role currently has.
  const browsablePermissions = useMemo(() => {
    if (editMode) return mappedPermissions
    if (!selectedRole) return []
    return mappedPermissions.filter((p) =>
      selectedRole.permission.includes(p.permissionId)
    )
  }, [editMode, mappedPermissions, selectedRole])

  const tabs = useMemo(() => {
    const byCategory = new Map<string, { total: number; assigned: number }>()
    browsablePermissions.forEach((p) => {
      const cat = categoryOf(p.permissionName)
      if (!cat) return
      const entry = byCategory.get(cat) ?? { total: 0, assigned: 0 }
      entry.total += 1
      if (hasPermission(p.permissionId)) entry.assigned += 1
      byCategory.set(cat, entry)
    })
    return Array.from(byCategory.entries()).sort((a, b) =>
      a[0].localeCompare(b[0])
    )
  }, [browsablePermissions, selectedRole])

  const visiblePermissions = useMemo(() => {
    const term = debouncedSearch.toLowerCase()
    return browsablePermissions.filter((p) => {
      const matchesCategory =
        activeCategory === 'all' ||
        categoryOf(p.permissionName) === activeCategory
      const matchesSearch =
        p.permissionName.toLowerCase().includes(term) ||
        p.permissionId.toString().includes(term)
      return matchesCategory && matchesSearch
    })
  }, [browsablePermissions, activeCategory, debouncedSearch])

  const allVisibleGranted =
    visiblePermissions.length > 0 &&
    visiblePermissions.every((p) => hasPermission(p.permissionId))

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 p-6">
        <div className="mx-auto max-w-4xl animate-pulse space-y-4">
          <div className="h-8 w-56 rounded-md bg-slate-200" />
          <div className="h-16 rounded-xl bg-white border" />
          <div className="h-[440px] rounded-xl bg-white border" />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Discard changes confirm dialog */}
      <Dialog
        open={pendingRoleId !== null}
        onOpenChange={(open) => !open && setPendingRoleId(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Discard unsaved changes?</DialogTitle>
            <DialogDescription>
              Switching to{' '}
              <span className="font-medium text-slate-900">
                {mappedRoles.find((r) => r.roleId === pendingRoleId)?.roleName}
              </span>{' '}
              will discard your unsaved changes to{' '}
              <span className="font-medium text-slate-900">
                {selectedRole?.roleName}
              </span>
              .
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPendingRoleId(null)}>
              Keep editing
            </Button>
            <Button variant="destructive" onClick={confirmDiscardAndSwitch}>
              Discard & switch
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="mx-auto max-w-4xl px-6 py-8">
        <header className="mb-5 flex items-center gap-2.5">
          <Fingerprint className="h-6 w-6 text-blue-600" />
          <div>
            <h1 className="text-[19px] font-semibold leading-tight text-slate-900">
              Permissions
            </h1>
            <p className="text-[13px] text-slate-500">
              Pick a role, then grant or revoke what it can reach.
            </p>
          </div>
        </header>

        {/* Role rack */}
        <Card className="mb-4 p-3">
          <div className="mb-2.5 flex items-center gap-2 px-1">
            <Search className="h-3.5 w-3.5 text-slate-400" />
            <Input
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              placeholder="Filter roles"
              className="h-7 w-48 border-none bg-transparent px-0 text-[13px] shadow-none focus-visible:ring-0"
            />
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {filteredRoles.length === 0 ? (
              <p className="px-2 py-3 text-[13px] text-slate-500">
                No roles match “{roleFilter}”
              </p>
            ) : (
              filteredRoles.map((role) => {
                const isSelected = selectedRole?.roleId === role.roleId
                return (
                  <Button
                    key={role.roleId}
                    onClick={() => selectRole(role)}
                    variant={isSelected ? 'default' : 'outline'}
                    className={
                      isSelected
                        ? 'flex-shrink-0 gap-2 rounded-full bg-blue-600 hover:bg-blue-700'
                        : 'flex-shrink-0 gap-2 rounded-full'
                    }
                  >
                    {role.roleName}
                    <Badge
                      variant="secondary"
                      className={
                        isSelected
                          ? 'bg-blue-500 text-white hover:bg-blue-500'
                          : 'bg-slate-100 text-slate-600'
                      }
                    >
                      {role.permission.length}/{mappedPermissions.length}
                    </Badge>
                  </Button>
                )
              })
            )}
          </div>
        </Card>

        {/* Permission workspace */}
        <Card className="overflow-hidden">
          {!selectedRole ? (
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <Fingerprint className="mb-3 h-9 w-9 text-slate-200" />
              <p className="text-[14px] text-slate-500">
                Select a role above to see what it can reach.
              </p>
            </div>
          ) : (
            <>
              <div className="border-b p-4">
                <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <h2 className="text-[15px] font-semibold text-slate-900">
                      {selectedRole.roleName}
                    </h2>
                    <span className="text-[13px] tabular-nums text-slate-500">
                      {selectedRole.permission.length} of{' '}
                      {mappedPermissions.length} granted
                    </span>
                    {hasChanges && (
                      <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100">
                        Unsaved changes
                      </Badge>
                    )}
                  </div>

                  {editMode ? (
                    <div className="flex items-center gap-2">
                      <span className="hidden text-[11px] text-slate-400 sm:inline">
                        ⌘S save · Esc cancel
                      </span>
                      <Button
                        variant="outline"
                        onClick={handleCancel}
                        disabled={updatePermissionMutation.isPending}
                      >
                        Cancel
                      </Button>
                      <Button
                        onClick={handleSave}
                        disabled={
                          updatePermissionMutation.isPending || !hasChanges
                        }
                        className="gap-1.5 bg-blue-600 hover:bg-blue-700"
                      >
                        <Save className="h-3.5 w-3.5" />
                        {updatePermissionMutation.isPending
                          ? 'Saving…'
                          : 'Save changes'}
                      </Button>
                    </div>
                  ) : (
                    <Button
                      onClick={() => {
                        setDraftPermissions(selectedRole.permission)
                        setEditMode(true)
                      }}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      Edit permissions
                    </Button>
                  )}
                </div>

                <div className="relative mb-3">
                  <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                  <Input
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search permissions"
                    className="pl-8 pr-8"
                  />
                  {searchTerm && (
                    <button
                      onClick={() => setSearchTerm('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400"
                      aria-label="Clear search"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>

                {tabs.length > 0 && (
                  <Tabs
                    value={activeCategory}
                    onValueChange={setActiveCategory}
                  >
                    <TabsList className="flex h-auto w-full flex-wrap justify-start gap-1 bg-transparent p-0">
                      <TabsTrigger
                        value="all"
                        className="rounded-full border data-[state=active]:border-blue-600 data-[state=active]:bg-blue-600 data-[state=active]:text-white"
                      >
                        All · {browsablePermissions.length}
                      </TabsTrigger>
                      {tabs.map(([cat, counts]) => (
                        <TabsTrigger
                          key={cat}
                          value={cat}
                          className="rounded-full border capitalize data-[state=active]:border-blue-600 data-[state=active]:bg-blue-600 data-[state=active]:text-white"
                        >
                          {cat} · {counts.assigned}/{counts.total}
                        </TabsTrigger>
                      ))}
                    </TabsList>
                  </Tabs>
                )}
              </div>

              <div className="p-4">
                {editMode && visiblePermissions.length > 0 && (
                  <div className="mb-3 flex justify-end">
                    <button
                      onClick={() =>
                        setVisible(
                          visiblePermissions.map((p) => p.permissionId),
                          !allVisibleGranted
                        )
                      }
                      className="text-[12.5px] font-medium text-blue-600 hover:text-blue-700"
                    >
                      {allVisibleGranted ? 'Clear shown' : 'Grant all shown'}
                    </button>
                  </div>
                )}

                {visiblePermissions.length === 0 ? (
                  <div className="py-16 text-center">
                    <p className="text-[13.5px] text-slate-500">
                      {searchTerm
                        ? `No permissions match “${searchTerm}”`
                        : 'Nothing granted here yet.'}
                    </p>
                  </div>
                ) : (
                  <div className="divide-y">
                    {visiblePermissions.map((perm) => {
                      const isActive = hasPermission(perm.permissionId)
                      return (
                        <div key={perm.permissionId} className="py-2.5">
                          <CustomSwitch
                            label={
                              perm.permissionName ||
                              `Permission #${perm.permissionId}`
                            }
                            checked={isActive}
                            onChange={(value) => {
                              if (!editMode) return
                              setPermission(perm.permissionId, !!value)
                            }}
                          />
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            </>
          )}
        </Card>
      </div>
    </div>
  )
}

export default Permissions
