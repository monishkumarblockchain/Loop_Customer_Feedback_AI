"use client";

import {
  FormEvent,
  useState,
} from "react";

import Link from "next/link";
import { useRouter } from "next/navigation";

import { api } from "@/lib/api";


export default function RegisterPage() {
  const router = useRouter();

  const [username, setUsername] =
    useState("");

  const [email, setEmail] =
    useState("");

  const [firstName, setFirstName] =
    useState("");

  const [lastName, setLastName] =
    useState("");

  const [password, setPassword] =
    useState("");

  const [passwordConfirm, setPasswordConfirm] =
    useState("");

  const [role, setRole] =
    useState("VIEWER");

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState("");

  const [success, setSuccess] =
    useState("");


  async function register(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    setError("");
    setSuccess("");

    if (
      password !== passwordConfirm
    ) {
      setError(
        "Passwords do not match.",
      );

      return;
    }

    try {
      setLoading(true);

      await api(
        "/auth/register/",
        {
          method: "POST",
          skipAuth: true,
          body: JSON.stringify({
            username,
            email:
              email.trim().toLowerCase(),
            first_name: firstName,
            last_name: lastName,
            password,
            password_confirm:
              passwordConfirm,
            role,
          }),
        },
      );

      setSuccess(
        "Registration successful. Redirecting to login...",
      );

      setTimeout(() => {
        router.push("/login");
      }, 1000);
    } catch (error) {
      console.error(
        "Registration error:",
        error,
      );

      setError(
        error instanceof Error
          ? error.message
          : "Registration failed.",
      );
    } finally {
      setLoading(false);
    }
  }


  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-50 p-6">
      <form
        onSubmit={register}
        className="w-full max-w-lg rounded-2xl border bg-white p-8 shadow-sm"
      >
        <div className="mb-8">
          <div className="mb-3 inline-flex rounded-xl bg-black px-3 py-2 font-bold text-white">
            L
          </div>

          <h1 className="text-2xl font-bold">
            Create LOOP Account
          </h1>

          <p className="mt-1 text-sm text-gray-500">
            Register a new LOOP user.
          </p>
        </div>


        {error && (
          <div className="mb-5 rounded-lg bg-red-50 p-3 text-sm text-red-700">
            {error}
          </div>
        )}


        {success && (
          <div className="mb-5 rounded-lg bg-green-50 p-3 text-sm text-green-700">
            {success}
          </div>
        )}


        <div className="grid gap-4 md:grid-cols-2">
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


        <div className="mt-4">
          <label className="mb-2 block text-sm font-medium">
            Username
          </label>

          <input
            required
            value={username}
            onChange={(event) =>
              setUsername(
                event.target.value,
              )
            }
            className="w-full rounded-lg border px-3 py-2.5"
          />
        </div>


        <div className="mt-4">
          <label className="mb-2 block text-sm font-medium">
            Email
          </label>

          <input
            type="email"
            required
            value={email}
            onChange={(event) =>
              setEmail(
                event.target.value,
              )
            }
            className="w-full rounded-lg border px-3 py-2.5"
          />
        </div>


        <div className="mt-4">
          <label className="mb-2 block text-sm font-medium">
            Role
          </label>

          <select
            value={role}
            onChange={(event) =>
              setRole(
                event.target.value,
              )
            }
            className="w-full rounded-lg border bg-white px-3 py-2.5"
          >
            <option value="VIEWER">
              Viewer
            </option>

            <option value="OWNER">
              Owner
            </option>

            <option value="ADMIN">
              Admin
            </option>
          </select>
        </div>


        <div className="mt-4">
          <label className="mb-2 block text-sm font-medium">
            Password
          </label>

          <input
            type="password"
            required
            value={password}
            onChange={(event) =>
              setPassword(
                event.target.value,
              )
            }
            className="w-full rounded-lg border px-3 py-2.5"
          />
        </div>


        <div className="mt-4">
          <label className="mb-2 block text-sm font-medium">
            Confirm Password
          </label>

          <input
            type="password"
            required
            value={passwordConfirm}
            onChange={(event) =>
              setPasswordConfirm(
                event.target.value,
              )
            }
            className="w-full rounded-lg border px-3 py-2.5"
          />
        </div>


        <button
          type="submit"
          disabled={loading}
          className="mt-6 w-full rounded-lg bg-black py-2.5 font-medium text-white disabled:opacity-50"
        >
          {loading
            ? "Creating account..."
            : "Create Account"}
        </button>


        <p className="mt-5 text-center text-sm text-gray-500">
          Already have an account?{" "}
          <Link
            href="/login"
            className="font-medium text-black underline"
          >
            Login
          </Link>
        </p>
      </form>
    </main>
  );
}