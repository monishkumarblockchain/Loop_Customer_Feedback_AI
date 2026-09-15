"use client";

import { useEffect, useState } from "react";
import AppShell from "@/components/AppShell";
import { api } from "@/lib/api";
import type { User } from "@/lib/types";

type UserResponse =
  | User[]
  | {
      results: User[];
    };

const roles = [
  "ADMIN",
  "OWNER",
  "ANALYST",
  "VIEWER",
];

export default function UsersPage() {
  const [users, setUsers] =
    useState<User[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] = useState("");

  async function loadUsers() {
    try {
      setLoading(true);
      setError("");

      const response =
        await api<UserResponse>(
          "/auth/users/",
        );

      const data = Array.isArray(response)
        ? response
        : response.results || [];

      setUsers(data);
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Failed to load users.",
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    async function load() {
      await loadUsers();
    }

    load();
  }, []);

  async function changeRole(
    user: User,
    role: string,
  ) {
    try {
      await api<User>(
        `/auth/users/${user.id}/`,
        {
          method: "PATCH",
          body: JSON.stringify({
            role,
          }),
        },
      );

      await loadUsers();
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Failed to update role.",
      );
    }
  }

  async function deleteUser(user: User) {
    const confirmed = window.confirm(
      `Delete ${user.email}?`,
    );

    if (!confirmed) {
      return;
    }

    try {
      await api(
        `/auth/users/${user.id}/`,
        {
          method: "DELETE",
        },
      );

      await loadUsers();
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Failed to delete user.",
      );
    }
  }

  return (
    <AppShell>
      <div className="mb-7">
        <h2 className="text-2xl font-bold">
          Users & Roles
        </h2>

        <p className="mt-1 text-sm text-gray-500">
          Manage LOOP users and permissions.
        </p>
      </div>

      {error && (
        <div className="mb-5 rounded-xl bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="overflow-hidden rounded-2xl border bg-white">
        {loading ? (
          <div className="p-8 text-center text-gray-500">
            Loading users...
          </div>
        ) : users.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            No users found.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="border-b bg-gray-50">
                <tr>
                  <th className="p-4 text-sm font-semibold">
                    User
                  </th>

                  <th className="p-4 text-sm font-semibold">
                    Email
                  </th>

                  <th className="p-4 text-sm font-semibold">
                    Role
                  </th>

                  <th className="p-4 text-sm font-semibold">
                    Action
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y">
                {users.map((user) => (
                  <tr key={user.id}>
                    <td className="p-4">
                      <p className="font-medium">
                        {user.first_name ||
                          user.username}
                      </p>

                      <p className="text-xs text-gray-500">
                        @{user.username}
                      </p>
                    </td>

                    <td className="p-4 text-sm text-gray-600">
                      {user.email}
                    </td>

                    <td className="p-4">
                      <select
                        value={user.role}
                        onChange={(e) =>
                          changeRole(
                            user,
                            e.target.value,
                          )
                        }
                        className="rounded-lg border px-3 py-2 text-sm"
                      >
                        {roles.map((role) => (
                          <option
                            key={role}
                            value={role}
                          >
                            {role}
                          </option>
                        ))}
                      </select>
                    </td>

                    <td className="p-4">
                      <button
                        onClick={() =>
                          deleteUser(user)
                        }
                        className="rounded-lg border border-red-200 px-3 py-2 text-sm text-red-600 hover:bg-red-50"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AppShell>
  );
}