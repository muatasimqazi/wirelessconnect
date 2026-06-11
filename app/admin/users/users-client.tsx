"use client";

import { useState, useTransition } from "react";
import { updateUserRole } from "@/features/admin/users/actions";
import type { AdminUser } from "@/features/admin/users/queries";
import { ShieldIcon, UserCogIcon, UserIcon, UsersIcon } from "lucide-react";
import { cn } from "@/lib/utils";

function RoleBadge({ role }: { role: AdminUser["role"] }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold",
        role === "admin" && "bg-purple-100 text-purple-800",
        role === "staff" && "bg-blue-100 text-blue-800",
        role === "customer" && "bg-muted text-muted-foreground",
      )}
    >
      {role === "admin" && <ShieldIcon className="h-3 w-3" aria-hidden="true" />}
      {role === "staff" && <UserCogIcon className="h-3 w-3" aria-hidden="true" />}
      {role === "customer" && <UserIcon className="h-3 w-3" aria-hidden="true" />}
      {role}
    </span>
  );
}

function RoleSelect({ user, onChanged }: { user: AdminUser; onChanged: (newRole: AdminUser["role"]) => void }) {
  const [isPending, startTransition] = useTransition();
  const [currentRole, setCurrentRole] = useState(user.role);
  const [error, setError] = useState<string | null>(null);

  function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const newRole = e.target.value as AdminUser["role"];
    if (newRole === currentRole) return;

    if (!window.confirm(`Change ${user.email} from "${currentRole}" to "${newRole}"?`)) {
      e.target.value = currentRole;
      return;
    }

    setError(null);
    startTransition(async () => {
      const result = await updateUserRole(user.id, newRole);
      if (result.error) {
        setError(result.error);
        e.target.value = currentRole;
      } else {
        setCurrentRole(newRole);
        onChanged(newRole);
      }
    });
  }

  return (
    <div>
      <select
        value={currentRole}
        onChange={handleChange}
        disabled={isPending}
        className="rounded-md border border-input bg-background px-2 py-1 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:opacity-50"
        aria-label={`Change role for ${user.email}`}
      >
        <option value="customer">Customer</option>
        <option value="staff">Staff</option>
        <option value="admin">Admin</option>
      </select>
      {error && <p className="mt-0.5 text-xs text-destructive">{error}</p>}
    </div>
  );
}

export function UsersClient({
  users: initialUsers,
  currentAdminId,
}: {
  users: AdminUser[];
  currentAdminId: string;
}) {
  const [users, setUsers] = useState(initialUsers);

  function handleRoleChanged(userId: string, newRole: AdminUser["role"]) {
    setUsers((prev) =>
      prev.map((u) => (u.id === userId ? { ...u, role: newRole } : u)),
    );
  }

  const counts = {
    admin: users.filter((u) => u.role === "admin").length,
    staff: users.filter((u) => u.role === "staff").length,
    customer: users.filter((u) => u.role === "customer").length,
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Users</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {users.length} account{users.length !== 1 ? "s" : ""} ·{" "}
          <span className="text-purple-700">{counts.admin} admin</span> ·{" "}
          <span className="text-blue-700">{counts.staff} staff</span> ·{" "}
          <span>{counts.customer} customer</span>
        </p>
      </div>

      <div className="overflow-hidden rounded-lg border border-border bg-background">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/40">
              {["User", "Locale", "Current Role", "Joined", "Change Role"].map((h) => (
                <th
                  key={h}
                  className="px-4 py-2.5 text-start text-xs font-semibold uppercase tracking-wider text-muted-foreground"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {users.map((user) => {
              const isSelf = user.id === currentAdminId;
              return (
                <tr key={user.id} className="border-b border-border last:border-0 hover:bg-muted/20">
                  <td className="px-4 py-3">
                    <div className="font-medium text-foreground">
                      {user.full_name ?? (
                        <span className="italic text-muted-foreground">No name</span>
                      )}
                      {isSelf && (
                        <span className="ms-1.5 rounded bg-muted px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                          you
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground">{user.email}</div>
                  </td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">
                    {user.preferred_locale.toUpperCase()}
                  </td>
                  <td className="px-4 py-3">
                    <RoleBadge role={user.role} />
                  </td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">
                    {new Intl.DateTimeFormat("en-US", { dateStyle: "medium" }).format(
                      new Date(user.created_at),
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {isSelf ? (
                      <span className="text-xs text-muted-foreground">Cannot change own role</span>
                    ) : (
                      <RoleSelect
                        user={user}
                        onChanged={(newRole) => handleRoleChanged(user.id, newRole)}
                      />
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {users.length === 0 && (
          <div className="flex flex-col items-center gap-2 py-16 text-center">
            <UsersIcon className="h-8 w-8 text-muted-foreground/40" aria-hidden="true" />
            <p className="text-sm text-muted-foreground">No users found.</p>
          </div>
        )}
      </div>
    </div>
  );
}
