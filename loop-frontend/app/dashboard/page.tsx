"use client";

import { useEffect, useState } from "react";

import AppShell from "@/components/AppShell";
import StatCard from "@/components/StatCard";
import { api } from "@/lib/api";
import type { Feedback } from "@/lib/types";


// ============================================================
// API RESPONSE TYPE
// ============================================================

type FeedbackResponse =
  | Feedback[]
  | {
      results: Feedback[];
    };


// ============================================================
// DASHBOARD
// ============================================================

export default function DashboardPage() {
  const [feedback, setFeedback] = useState<Feedback[]>(
    [],
  );

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState("");


  // ==========================================================
  // LOAD FEEDBACK
  // ==========================================================

  useEffect(() => {
    async function loadFeedback() {
      try {
        setLoading(true);
        setError("");

        const response =
          await api<FeedbackResponse>(
            "/feedback/",
          );

        // Support both:
        //
        // [
        //   {...},
        //   {...}
        // ]
        //
        // and:
        //
        // {
        //   results: [...]
        // }

        const data = Array.isArray(response)
          ? response
          : response.results || [];

        setFeedback(data);
      } catch (err) {
        console.error(
          "Dashboard error:",
          err,
        );

        setError(
          err instanceof Error
            ? err.message
            : "Could not load dashboard.",
        );
      } finally {
        setLoading(false);
      }
    }

    loadFeedback();
  }, []);


  // ==========================================================
  // STATISTICS
  // ==========================================================

  const totalFeedback =
    feedback.length;


  const positive =
    feedback.filter(
      (item) =>
        item.sentiment?.toUpperCase() ===
        "POSITIVE",
    ).length;


  const negative =
    feedback.filter(
      (item) =>
        item.sentiment?.toUpperCase() ===
        "NEGATIVE",
    ).length;


  const neutral =
    feedback.filter(
      (item) =>
        item.sentiment?.toUpperCase() ===
        "NEUTRAL",
    ).length;


  // IMPORTANT:
  // Use the database is_processed field.
  const processed =
    feedback.filter(
      (item) =>
        item.is_processed === true,
    ).length;


  // ==========================================================
  // UI
  // ==========================================================

  return (
    <AppShell>

      {/* ======================================================
          HEADER
          ====================================================== */}

      <div className="mb-7">
        <h2 className="text-2xl font-bold">
          Dashboard
        </h2>

        <p className="mt-1 text-sm text-gray-500">
          Live customer feedback overview.
        </p>
      </div>


      {/* ======================================================
          ERROR
          ====================================================== */}

      {error && (
        <div className="mb-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}


      {/* ======================================================
          MAIN STAT CARDS
          ====================================================== */}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">

        <StatCard
          title="Total Feedback"
          value={
            loading
              ? "..."
              : totalFeedback
          }
          note="Django API"
        />

        <StatCard
          title="Positive"
          value={
            loading
              ? "..."
              : positive
          }
          note="Positive sentiment"
        />

        <StatCard
          title="Negative"
          value={
            loading
              ? "..."
              : negative
          }
          note="Needs attention"
        />

        <StatCard
          title="AI Processed"
          value={
            loading
              ? "..."
              : processed
          }
          note="Analyzed feedback"
        />

      </div>


      {/* ======================================================
          SENTIMENT SUMMARY
          ====================================================== */}

      <div className="mt-6 grid gap-4 md:grid-cols-3">

        {/* POSITIVE */}

        <div className="rounded-2xl border bg-white p-5">
          <p className="text-sm text-gray-500">
            Positive
          </p>

          <p className="mt-2 text-2xl font-bold">
            {loading
              ? "..."
              : positive}
          </p>
        </div>


        {/* NEUTRAL */}

        <div className="rounded-2xl border bg-white p-5">
          <p className="text-sm text-gray-500">
            Neutral
          </p>

          <p className="mt-2 text-2xl font-bold">
            {loading
              ? "..."
              : neutral}
          </p>
        </div>


        {/* NEGATIVE */}

        <div className="rounded-2xl border bg-white p-5">
          <p className="text-sm text-gray-500">
            Negative
          </p>

          <p className="mt-2 text-2xl font-bold">
            {loading
              ? "..."
              : negative}
          </p>
        </div>

      </div>


      {/* ======================================================
          LATEST FEEDBACK
          ====================================================== */}

      <div className="mt-6 rounded-2xl border bg-white">

        {/* HEADER */}

        <div className="border-b p-5">
          <h3 className="font-semibold">
            Latest Feedback
          </h3>

          <p className="mt-1 text-xs text-gray-500">
            Latest feedback stored in the database.
          </p>
        </div>


        {/* LOADING */}

        {loading && (
          <div className="p-8 text-center text-sm text-gray-500">
            Loading feedback...
          </div>
        )}


        {/* EMPTY */}

        {!loading &&
          feedback.length === 0 && (
            <div className="p-8 text-center text-sm text-gray-500">
              No feedback found.
            </div>
          )}


        {/* FEEDBACK LIST */}

        {!loading &&
          feedback.length > 0 && (
            <div className="divide-y">

              {feedback
                .slice(0, 10)
                .map((item) => (

                  <div
                    key={item.id}
                    className="flex items-center justify-between gap-4 p-5"
                  >

                    {/* FEEDBACK CONTENT */}

                    <div className="min-w-0">

                      <p className="truncate text-sm font-medium">
                        {item.content ||
                          item.title ||
                          "No feedback content"}
                      </p>


                      <p className="mt-1 text-xs text-gray-500">

                        {item.category ||
                          "Uncategorized"}

                        {" · "}

                        {item.is_processed
                          ? "AI Processed"
                          : "Pending"}

                      </p>

                    </div>


                    {/* SENTIMENT */}

                    <span
                      className="shrink-0 rounded-full bg-gray-100 px-3 py-1 text-xs font-medium"
                    >
                      {item.sentiment ||
                        "Pending"}
                    </span>

                  </div>

                ))}

            </div>
          )}

      </div>

    </AppShell>
  );
}