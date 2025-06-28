"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { MoreVertical, X } from "lucide-react";

interface Role {
  role_id: number;
  role_name: string;
  description?: string;
  permissions: { permission_id: number; permission_name: string }[];
}

const ManageUsersPage = () => {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [users, setUsers] = useState<any[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);

  const [editingUserId, setEditingUserId] = useState<number | null>(null);
  const [selectedRole, setSelectedRole] = useState<{ [key: number]: number }>({});

  useEffect(() => {
    if (status === "loading") return;
    if (!session?.user?.is_ceo) router.push("/unauthorized");
    else {
      fetchUsers();
      fetchRoles();
    }
  }, [status, session, router]);

  const fetchUsers = async () => {
    const res = await fetch("/api/admin/users");
    const data = await res.json();
    setUsers(data);

    const roleMap: { [key: number]: number } = {};
    data.forEach((user: any) => {
      const roleId = user.user_roles_user_roles_user_idTousers?.[0]?.roles?.role_id;
      if (roleId) roleMap[user.user_id] = roleId;
    });

    setSelectedRole(roleMap);
    setLoading(false);
  };

  const fetchRoles = async () => {
    const res = await fetch("/api/admin/getAllRolesWithPermissions");
    const data = await res.json();
    setRoles(data);
  };

  const handleRoleChange = (userId: number, roleId: number) => {
    setSelectedRole((prev) => ({ ...prev, [userId]: roleId }));
  };

  const saveRoleForUser = async (userId: number) => {
    const roleId = selectedRole[userId];

    const res = await fetch(`/api/admin/users/${userId}/role`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role_id: roleId }),
    });

    if (res.ok) {
      setEditingUserId(null);
      fetchUsers();
    } else {
      alert("Failed to update user role");
    }
  };

  if (loading || status === "loading")
    return <p className="text-center mt-10 text-gray-300">Loading users...</p>;

  return (
    <div className="max-w-5xl mx-auto mt-10 mb-20 px-4">
      <h1 className="text-3xl font-bold mb-6 text-lime-400">Manage Users</h1>
      <div className="space-y-6">
        {users.map((user) => (
          <div
            key={user.user_id}
            className="bg-[#1f1f1f] border border-gray-700 rounded-lg p-4 shadow-md"
          >
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-xl font-semibold text-white">{user.full_name}</h2>
                <p className="text-gray-400 text-sm">{user.email}</p>
              </div>
              <button onClick={() => setEditingUserId(user.user_id)}>
                <MoreVertical className="text-gray-400 hover:text-white" />
              </button>
            </div>

            {editingUserId === user.user_id ? (
              <div className="mt-4 border-t border-gray-600 pt-4">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="text-gray-300 font-semibold">Assign Role</h3>
                  <button onClick={() => setEditingUserId(null)}>
                    <X className="text-red-400 hover:text-red-600" />
                  </button>
                </div>

                <select
                  className="w-full bg-black border border-gray-700 text-white p-2 rounded"
                  value={selectedRole[user.user_id] || ""}
                  onChange={(e) =>
                    handleRoleChange(user.user_id, parseInt(e.target.value))
                  }
                >
                  <option value="" disabled>
                    Select a role
                  </option>
                  {roles.map((role) => (
                    <option key={role.role_id} value={role.role_id}>
                      {role.role_name}
                    </option>
                  ))}
                </select>

                <div className="mt-4">
                  <h4 className="text-sm text-lime-400 mb-1">Permissions:</h4>
                  <ul className="ml-4 list-disc text-lime-300 text-sm">
                    {roles
                      .find((r) => r.role_id === selectedRole[user.user_id])
                      ?.permissions.map((perm, idx) => (
                        <li key={idx}>{perm.permission_name}</li>
                      ))}
                  </ul>
                </div>

                <button
                  onClick={() => saveRoleForUser(user.user_id)}
                  className="mt-4 bg-lime-500 text-black font-bold px-4 py-2 rounded hover:bg-lime-600"
                >
                  Save Role
                </button>
              </div>
            ) : (
              <div className="mt-2 text-sm">
                <p className="text-gray-400 mb-1">Role & Permissions:</p>
                <span className="text-white font-medium">
                  {
                    user.user_roles_user_roles_user_idTousers?.[0]?.roles
                      ?.role_name
                  }
                </span>
                <ul className="ml-4 list-disc text-lime-400 text-xs">
                  {user.user_roles_user_roles_user_idTousers?.[0]?.roles?.role_permissions.map(
                    (rp: any, idx: number) => (
                      <li key={idx}>{rp.permissions.permission_name}</li>
                    )
                  )}
                </ul>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default ManageUsersPage;
