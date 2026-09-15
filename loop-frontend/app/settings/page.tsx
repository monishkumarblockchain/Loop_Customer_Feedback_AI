"use client";

import {
  FormEvent,
  useEffect,
  useState,
} from "react";

import AppShell from "@/components/AppShell";
import { api } from "@/lib/api";
import type { User } from "@/lib/types";


export default function SettingsPage() {
  const [user, setUser] =
    useState<User | null>(null);

  const [firstName, setFirstName] =
    useState("");

  const [lastName, setLastName] =
    useState("");

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [message, setMessage] =
    useState("");

  const [error, setError] =
    useState("");


  useEffect(() => {
    async function loadProfile() {
      try {
        setLoading(true);
        setError("");

        const data =
          await api<User>(
            "/auth/me/",
          );

        setUser(data);

        setFirstName(
          data.first_name || "",
        );

        setLastName(
          data.last_name || "",
        );
      } catch (error) {
        setError(
          error instanceof Error
            ? error.message
            : "Failed to load profile.",
        );
      } finally {
        setLoading(false);
      }
    }

    loadProfile();
  }, []);


  async function save(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    try {
      setSaving(true);
      setMessage("");
      setError("");

      const data =
        await api<User>(
          "/auth/me/",
          {
            method: "PATCH",
            body: JSON.stringify({
              first_name: firstName,
              last_name: lastName,
            }),
          },
        );

      setUser(data);

      setMessage(
        "Profile updated successfully.",
      );
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Failed to update profile.",
      );
    } finally {
      setSaving(false);
    }
  }


  if (loading) {
    return (
      <AppShell>
        <div className="rounded-2xl border bg-white p-8 text-center text-gray-500">
          Loading profile...
        </div>
      </AppShell>
    );
  }


  return (
    <AppShell>
      <div className="mb-7">
        <h2 className="text-2xl font-bold">
          Settings
        </h2>

        <p className="mt-1 text-sm text-gray-500">
          Manage your LOOP account.
        </p>
      </div>


      <form
        onSubmit={save}
        className="max-w-2xl rounded-2xl border bg-white p-6"
      >
        {error && (
          <div className="mb-5 rounded-lg bg-red-50 p-3 text-sm text-red-700">
            {error}
          </div>
        )}


        {message && (
          <div className="mb-5 rounded-lg bg-green-50 p-3 text-sm text-green-700">
            {message}
          </div>
        )}


        <div className="mb-6 grid gap-4 md:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm font-medium">
              First Name
            </label>

            <input
              value={firstName}
              onChange={(event) =>
                setFirstName(
                  event.target.value,
                )
              }
              className="w-full rounded-lg border px-3 py-2.5"
            />
          </div>


          <div>
            <label className="mb-2 block text-sm font-medium">
              Last Name
            </label>

            <input
              value={lastName}
              onChange={(event) =>
                setLastName(
                  event.target.value,
                )
              }
              className="w-full rounded-lg border px-3 py-2.5"
            />
          </div>
        </div>


        <div className="mb-4">
          <label className="mb-2 block text-sm font-medium">
            Username
          </label>

          <input
            value={user?.username || ""}
            disabled
            className="w-full rounded-lg border bg-gray-50 px-3 py-2.5 text-gray-500"
          />
        </div>


        <div className="mb-4">
          <label className="mb-2 block text-sm font-medium">
            Email
          </label>

          <input
            value={user?.email || ""}
            disabled
            className="w-full rounded-lg border bg-gray-50 px-3 py-2.5 text-gray-500"
          />
        </div>


        <div className="mb-6">
          <label className="mb-2 block text-sm font-medium">
            Role
          </label>

          <input
            value={user?.role || ""}
            disabled
            className="w-full rounded-lg border bg-gray-50 px-3 py-2.5 text-gray-500"
          />
        </div>


        <button
          type="submit"
          disabled={saving}
          className="rounded-lg bg-black px-5 py-2.5 text-white disabled:opacity-50"
        >
          {saving
            ? "Saving..."
            : "Save Changes"}
        </button>
      </form>
    </AppShell>
  );
}