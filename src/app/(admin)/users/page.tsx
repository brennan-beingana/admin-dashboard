"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { deleteUser, getUsers, unwrapError } from "@/lib/api";

const PAGE_SIZE = 20;

export default function UsersPage() {
  const [offset, setOffset] = useState(0);
  const queryClient = useQueryClient();

  const usersQuery = useQuery({
    queryKey: ["users", PAGE_SIZE, offset],
    queryFn: () => getUsers({ limit: PAGE_SIZE, offset }),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteUser,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["users"] });
    },
  });

  const users = usersQuery.data?.users ?? [];

  return (
    <section className="space-y-4">
      <header>
        <h1 className="text-2xl font-semibold">Users</h1>
        <p className="text-sm text-foreground/70">Passenger user accounts.</p>
      </header>

      {usersQuery.error ? (
        <p className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {unwrapError(usersQuery.error)}
        </p>
      ) : null}

      <div className="overflow-x-auto rounded-lg border border-black/10">
        <table className="min-w-full text-sm">
          <thead className="bg-black/5 text-left">
            <tr>
              <th className="px-3 py-2">Name</th>
              <th className="px-3 py-2">Phone</th>
              <th className="px-3 py-2">Email</th>
              <th className="px-3 py-2">Created</th>
              <th className="px-3 py-2">Action</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id} className="border-t border-black/10">
                <td className="px-3 py-2">{user.name}</td>
                <td className="px-3 py-2">{user.phone}</td>
                <td className="px-3 py-2">{user.email ?? "-"}</td>
                <td className="px-3 py-2">{new Date(user.created_at).toLocaleString()}</td>
                <td className="px-3 py-2">
                  <button
                    type="button"
                    onClick={() => deleteMutation.mutate(user.id)}
                    className="rounded-md border border-black/15 px-2 py-1 hover:bg-black/5"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
            {!users.length ? (
              <tr>
                <td className="px-3 py-4 text-center text-foreground/70" colSpan={5}>
                  No users found.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => setOffset((current) => Math.max(0, current - PAGE_SIZE))}
          disabled={offset === 0}
          className="rounded-md border border-black/15 px-3 py-2 disabled:opacity-60"
        >
          Previous
        </button>
        <button
          type="button"
          onClick={() => setOffset((current) => current + PAGE_SIZE)}
          disabled={users.length < PAGE_SIZE}
          className="rounded-md border border-black/15 px-3 py-2 disabled:opacity-60"
        >
          Next
        </button>
      </div>
    </section>
  );
}
