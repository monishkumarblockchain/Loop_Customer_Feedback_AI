"use client";

import {
  FormEvent,
  useState,
} from "react";

import Link from "next/link";
import { useRouter } from "next/navigation";

import { api } from "@/lib/api";
import type { User } from "@/lib/types";

type LoginResponse = {
  access: string;
  refresh: string;
};

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function login(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    setError("");
    setLoading(true);

    try {
      // 1. Login and get JWT tokens
      const data = await api<LoginResponse>(
        "/auth/login/",
        {
          method: "POST",
          skipAuth: true,
          body: JSON.stringify({
            email: email.trim().toLowerCase(),
            password,
          }),
        },
      );

      if (!data.access || !data.refresh) {
        throw new Error(
          "Login succeeded but no JWT token was returned.",
        );
      }

      // 2. Save JWT tokens
      localStorage.setItem(
        "access_token",
        data.access,
      );

      localStorage.setItem(
        "refresh_token",
        data.refresh,
      );

      // 3. Get logged-in user's details
      const user = await api<User>(
        "/auth/me/",
      );

      // 4. Save user information
      localStorage.setItem(
        "user_role",
        user.role,
      );

      localStorage.setItem(
        "user",
        JSON.stringify(user),
      );

      console.log(
        "Login successful:",
        user,
      );

      console.log(
        "User role:",
        user.role,
      );

      // 5. Go to dashboard
      router.replace("/dashboard");
    } catch (error) {
      console.error(
        "Login error:",
        error,
      );

      // Clear invalid authentication data
      localStorage.removeItem(
        "access_token",
      );

      localStorage.removeItem(
        "refresh_token",
      );

      localStorage.removeItem(
        "user_role",
      );

      localStorage.removeItem(
        "user",
      );

      setError(
        error instanceof Error
          ? error.message
          : "Login failed. Check your email and password.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-50 p-6">
      <form
        onSubmit={login}
        className="w-full max-w-md rounded-2xl border bg-white p-8 shadow-sm"
      >
        <div className="mb-8">
          <div className="mb-3 inline-flex rounded-xl bg-black px-3 py-2 font-bold text-white">
            L
          </div>

          <h1 className="text-2xl font-bold">
            Welcome to LOOP
          </h1>

          <p className="mt-1 text-sm text-gray-500">
            Sign in to your feedback intelligence
            workspace.
          </p>
        </div>

        {error && (
          <div className="mb-5 rounded-lg bg-red-50 p-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <label className="mb-2 block text-sm font-medium">
          Email
        </label>

        <input
          type="email"
          required
          value={email}
          onChange={(event) =>
            setEmail(event.target.value)
          }
          placeholder="admin@loop.com"
          className="mb-5 w-full rounded-lg border px-3 py-2.5 outline-none focus:border-black"
        />

        <label className="mb-2 block text-sm font-medium">
          Password
        </label>

        <input
          type="password"
          required
          value={password}
          onChange={(event) =>
            setPassword(event.target.value)
          }
          placeholder="••••••••"
          className="mb-6 w-full rounded-lg border px-3 py-2.5 outline-none focus:border-black"
        />

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-black py-2.5 font-medium text-white disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading
            ? "Signing in..."
            : "Sign in"}
        </button>

        <p className="mt-5 text-center text-sm text-gray-500">
          Don't have an account?{" "}

          <Link
            href="/register"
            className="font-medium text-black underline"
          >
            Register
          </Link>
        </p>
      </form>
    </main>
  );
}