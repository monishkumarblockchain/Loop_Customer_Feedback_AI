"use client";

import { useEffect, useState } from "react";
import AnalyticsChatbot from "@/components/AnalyticsChatbot";
import {
  BarChart3,
  CheckCircle2,
  Clock3,
  MessageSquare,
  Star,
  TrendingDown,
  TrendingUp,
  Minus,
  Lightbulb,
} from "lucide-react";

import AppShell from "@/components/AppShell";
import StatCard from "@/components/StatCard";

import { api } from "@/lib/api";

import type {
  AnalyticsOverview,
  SentimentItem,
  IssueItem,
  FeatureRequest,
  SummaryResponse,
  CompanyAnalytics,
  Company,
} from "@/lib/types";


/* ============================================================
   ANALYTICS PAGE
   ============================================================ */

export default function AnalyticsPage() {

  const [
    overview,
    setOverview,
  ] = useState<AnalyticsOverview | null>(
    null
  );

  const [
    sentiment,
    setSentiment,
  ] = useState<SentimentItem[]>([]);

  const [
    issues,
    setIssues,
  ] = useState<IssueItem[]>([]);

  const [
    features,
    setFeatures,
  ] = useState<FeatureRequest[]>([]);

  const [
    summary,
    setSummary,
  ] = useState("");

  const [
    companies,
    setCompanies,
  ] = useState<CompanyAnalytics[]>([]);

  const [
    companyList,
    setCompanyList,
  ] = useState<Company[]>([]);

  const [
    selectedCompany,
    setSelectedCompany,
  ] = useState("");

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    error,
    setError,
  ] = useState("");

  const [
    companyLoading,
    setCompanyLoading,
  ] = useState(false);

  // Controls the floating AI assistant window.
  const [chatbotOpen, setChatbotOpen] = useState(false);


  /* ==========================================================
     LOAD COMPANY LIST
     ========================================================== */

  async function loadCompanies() {

    try {

      const data = await api<
        Company[] | { results: Company[] }
      >(
        "/companies/"
      );

      const list = Array.isArray(data)
        ? data
        : data?.results || [];

      setCompanyList(list);

    } catch (err) {

      console.error(
        "Company loading error:",
        err
      );

    }
  }


  /* ==========================================================
     LOAD MAIN ANALYTICS
     ========================================================== */

  async function loadAnalytics() {

    try {

      setLoading(true);
      setError("");

      const [
        overviewData,
        sentimentData,
        issuesData,
        featuresData,
        summaryData,
      ] = await Promise.all([

        api<AnalyticsOverview>(
          "/analytics/overview/"
        ),

        api<SentimentItem[]>(
          "/analytics/sentiment/"
        ),

        api<IssueItem[]>(
          "/analytics/top-issues/"
        ),

        api<FeatureRequest[]>(
          "/analytics/feature-requests/"
        ),

        api<SummaryResponse>(
          "/analytics/ai-summary/"
        ),

      ]);

      setOverview(
        overviewData
      );

      setSentiment(
        Array.isArray(sentimentData)
          ? sentimentData
          : []
      );

      setIssues(
        Array.isArray(issuesData)
          ? issuesData
          : []
      );

      setFeatures(
        Array.isArray(featuresData)
          ? featuresData
          : []
      );

      setSummary(
        summaryData?.summary || ""
      );

    } catch (err) {

      console.error(
        "Analytics error:",
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : "Failed to load analytics."
      );

    } finally {

      setLoading(false);

    }
  }


  /* ==========================================================
     LOAD COMPANY ANALYTICS
     ========================================================== */

  async function loadCompanyAnalytics(
    companyId = ""
  ) {

    try {

      setCompanyLoading(true);

      const endpoint =
        companyId
          ? `/analytics/company-breakdown/?company=${companyId}`
          : "/analytics/company-breakdown/";

      const data =
        await api<CompanyAnalytics[]>(
          endpoint
        );

      setCompanies(
        Array.isArray(data)
          ? data
          : []
      );

    } catch (err) {

      console.error(
        "Company analytics error:",
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : "Failed to load company analytics."
      );

    } finally {

      setCompanyLoading(false);

    }
  }


  /* ==========================================================
     INITIAL LOAD
     ========================================================== */

  useEffect(() => {

    loadAnalytics();
    loadCompanies();
    loadCompanyAnalytics();

  }, []);


  /* ==========================================================
     COMPANY FILTER
     ========================================================== */

  function handleCompanyChange(
    value: string
  ) {

    setSelectedCompany(value);

    loadCompanyAnalytics(value);

  }


  /* ==========================================================
     COMPANY TOTALS
     ========================================================== */

  const totalCompanyFeedback =
    companies.reduce(
      (sum, company) =>
        sum + company.total_feedback,
      0
    );

  const totalCompanyPositive =
    companies.reduce(
      (sum, company) =>
        sum + company.positive,
      0
    );

  const totalCompanyNegative =
    companies.reduce(
      (sum, company) =>
        sum + company.negative,
      0
    );

  const totalCompanyNeutral =
    companies.reduce(
      (sum, company) =>
        sum + company.neutral,
      0
    );

  const totalCompanyProcessed =
    companies.reduce(
      (sum, company) =>
        sum + company.processed,
      0
    );

  const totalCompanyPending =
    companies.reduce(
      (sum, company) =>
        sum + company.pending,
      0
    );

  const totalFeatureRequests =
    companies.reduce(
      (sum, company) =>
        sum + company.feature_requests,
      0
    );


  /* ==========================================================
     RENDER
     ========================================================== */

  return (

    <AppShell>

      {/* ======================================================
          FLOATING AI ASSISTANT BUTTON
          ====================================================== */}

      <button
        type="button"
        onClick={() => setChatbotOpen(true)}
        aria-label="Open LOOP Analytics AI"
        className="fixed bottom-6 right-6 z-40 flex items-center gap-2 rounded-full bg-black px-5 py-3 text-sm font-semibold text-white shadow-lg transition hover:scale-105 hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-2"
      >
        <MessageSquare size={18} />
        <span>AI Assistant</span>
      </button>

      {/* ======================================================
          AI ASSISTANT MODAL
          ====================================================== */}

      {chatbotOpen && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setChatbotOpen(false);
            }
          }}
        >
          <div className="relative max-h-[90vh] w-full max-w-3xl overflow-hidden rounded-2xl bg-white shadow-2xl">
            <button
              type="button"
              onClick={() => setChatbotOpen(false)}
              aria-label="Close AI Assistant"
              className="absolute right-4 top-4 z-10 flex h-9 w-9 items-center justify-center rounded-full border border-gray-200 bg-white text-lg text-gray-500 shadow-sm transition hover:bg-gray-100 hover:text-black"
            >
              ×
            </button>

            <div className="max-h-[90vh] overflow-y-auto p-1">
              <AnalyticsChatbot
                companyId={selectedCompany ? Number(selectedCompany) : null}
                companyName={
                  selectedCompany
                    ? companyList.find(
                        (company) => String(company.id) === selectedCompany,
                      )?.name ?? null
                    : null
                }
              />
            </div>
          </div>
        </div>
      )}

      {/* ======================================================
          HEADER
          ====================================================== */}

      <div className="mb-7">

        <div className="flex items-center gap-3">

          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-black text-white">

            <BarChart3 size={20} />

          </div>

          <div>

            <h1 className="text-2xl font-bold tracking-tight">
              AI Analytics
            </h1>

            <p className="mt-1 text-sm text-gray-500">
              Customer feedback intelligence
              from all stored database data.
            </p>

          </div>

        </div>

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
          LOADING
          ====================================================== */}

      {loading ? (

        <div className="rounded-2xl border bg-white p-10 text-center text-gray-500">

          Loading analytics...

        </div>

      ) : overview ? (

        <>

          {/* ==================================================
              OVERVIEW
              ================================================== */}

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">

            <StatCard
              title="Total Feedback"
              value={
                overview.total_feedback ?? 0
              }
              note="All stored feedback"
            />

            <StatCard
              title="Positive"
              value={
                overview.positive ?? 0
              }
              note="Positive sentiment"
            />

            <StatCard
              title="Negative"
              value={
                overview.negative ?? 0
              }
              note="Needs attention"
            />

            <StatCard
              title="Processed"
              value={
                overview.processed ?? 0
              }
              note="AI analyzed feedback"
            />

          </div>


          {/* ==================================================
              EXTRA OVERVIEW
              ================================================== */}

          <div className="mt-6 grid gap-4 md:grid-cols-3">

            <SimpleStat
              title="Neutral"
              value={
                overview.neutral ?? 0
              }
            />

            <SimpleStat
              title="Companies"
              value={
                overview.companies ?? 0
              }
            />

            <SimpleStat
              title="Total Feedback"
              value={
                overview.total_feedback ?? 0
              }
            />

          </div>


          {/* ==================================================
              SENTIMENT + TOP ISSUES
              ================================================== */}

          <div className="mt-6 grid gap-6 lg:grid-cols-2">


            {/* SENTIMENT */}

            <div className="rounded-2xl border bg-white p-6">

              <h3 className="mb-5 font-semibold">
                Sentiment
              </h3>

              {sentiment.length === 0 ? (

                <p className="text-sm text-gray-500">
                  No sentiment data available.
                </p>

              ) : (

                <div className="space-y-4">

                  {sentiment.map(
                    (item, index) => {

                      const total =
                        Number(
                          item.total
                        ) || 0;

                      const overallTotal =
                        Math.max(
                          Number(
                            overview.total_feedback
                          ) || 0,
                          1
                        );

                      const percentage =
                        Math.min(
                          100,
                          (
                            total /
                            overallTotal
                          ) * 100
                        );

                      return (

                        <div
                          key={`${item.sentiment}-${index}`}
                        >

                          <div className="mb-1 flex justify-between text-sm">

                            <span>
                              {
                                item.sentiment ||
                                "Unknown"
                              }
                            </span>

                            <span>
                              {total}
                            </span>

                          </div>

                          <div className="h-2 rounded-full bg-gray-100">

                            <div
                              className="h-2 rounded-full bg-black"
                              style={{
                                width:
                                  `${percentage}%`,
                              }}
                            />

                          </div>

                        </div>

                      );

                    }
                  )}

                </div>

              )}

            </div>


            {/* TOP ISSUES */}

            <div className="rounded-2xl border bg-white p-6">

              <h3 className="mb-5 font-semibold">
                Top Issues
              </h3>

              {issues.length === 0 ? (

                <p className="text-sm text-gray-500">
                  No negative issues found.
                </p>

              ) : (

                <div className="space-y-3">

                  {issues.map(
                    (issue, index) => (

                      <div
                        key={`${issue.category}-${index}`}
                        className="flex justify-between rounded-lg bg-gray-50 p-3"
                      >

                        <span className="text-sm">

                          {issue.category ||
                            "Uncategorized"}

                        </span>

                        <span className="text-sm font-semibold">

                          {issue.total}

                        </span>

                      </div>

                    )
                  )}

                </div>

              )}

            </div>

          </div>


          {/* ==================================================
              AI SUMMARY
              ================================================== */}

          <div className="mt-6 rounded-2xl border bg-white p-6">

            <h3 className="mb-3 font-semibold">
              AI Summary
            </h3>

            <p className="text-sm leading-6 text-gray-600">

              {summary ||
                "No AI summary available."}

            </p>

          </div>


          {/* ==================================================
              FEATURE REQUESTS
              ================================================== */}

          <div className="mt-6 rounded-2xl border bg-white p-6">

            <div className="mb-5 flex items-center gap-2">

              <Lightbulb size={18} />

              <h3 className="font-semibold">
                Feature Requests
              </h3>

            </div>

            {features.length === 0 ? (

              <p className="text-sm text-gray-500">
                No feature requests found.
              </p>

            ) : (

              <div className="space-y-3">

                {features.map(
                  (feature, index) => (

                    <div
                      key={`${feature.feedback_id}-${index}`}
                      className="rounded-lg border p-4"
                    >

                      <p className="text-sm">

                        {feature.feature_request ||
                          "No feature request"}

                      </p>

                      <p className="mt-1 text-xs text-gray-400">

                        Feedback #
                        {feature.feedback_id}

                      </p>

                    </div>

                  )
                )}

              </div>

            )}

          </div>


          {/* ==================================================
              COMPANY ANALYTICS
              ================================================== */}

          <div className="mt-8">

            <div className="mb-5">

              <h2 className="text-xl font-bold">
                Company Feedback Analytics
              </h2>

              <p className="mt-1 text-sm text-gray-500">
                View feedback statistics for
                every stored company.
              </p>

            </div>


            {/* COMPANY FILTER */}

            <div className="mb-6 rounded-2xl border bg-white p-5">

              <label className="mb-2 block text-sm font-medium">

                Select Company

              </label>

              <select
                value={selectedCompany}
                onChange={(event) =>
                  handleCompanyChange(
                    event.target.value
                  )
                }
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-black md:w-96"
              >

                <option value="">
                  All Companies
                </option>

                {companyList.map(
                  (company) => (

                    <option
                      key={company.id}
                      value={company.id}
                    >
                      {company.name}
                    </option>

                  )
                )}

              </select>

            </div>


            {/* COMPANY SUMMARY */}

            <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">

              <CompanyStat
                title="Total Feedback"
                value={
                  totalCompanyFeedback
                }
                icon={
                  <MessageSquare
                    size={18}
                  />
                }
              />

              <CompanyStat
                title="Positive"
                value={
                  totalCompanyPositive
                }
                icon={
                  <TrendingUp
                    size={18}
                  />
                }
              />

              <CompanyStat
                title="Negative"
                value={
                  totalCompanyNegative
                }
                icon={
                  <TrendingDown
                    size={18}
                  />
                }
              />

              <CompanyStat
                title="Neutral"
                value={
                  totalCompanyNeutral
                }
                icon={
                  <Minus size={18} />
                }
              />

            </div>


            {/* COMPANY PROCESSING */}

            <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">

              <CompanyStat
                title="AI Processed"
                value={
                  totalCompanyProcessed
                }
                icon={
                  <CheckCircle2
                    size={18}
                  />
                }
              />

              <CompanyStat
                title="Pending Analysis"
                value={
                  totalCompanyPending
                }
                icon={
                  <Clock3 size={18} />
                }
              />

              <CompanyStat
                title="Feature Requests"
                value={
                  totalFeatureRequests
                }
                icon={
                  <Lightbulb
                    size={18}
                  />
                }
              />

            </div>


            {/* COMPANY TABLE */}

            <div className="rounded-2xl border bg-white">

              <div className="border-b border-gray-200 p-6">

                <h3 className="font-semibold">
                  Company Feedback Checklist
                </h3>

                <p className="mt-1 text-sm text-gray-500">
                  Feedback count and AI analytics
                  for each stored company.
                </p>

              </div>


              {companyLoading ? (

                <div className="p-10 text-center text-sm text-gray-500">

                  Loading company analytics...

                </div>

              ) : companies.length === 0 ? (

                <div className="p-10 text-center text-sm text-gray-500">

                  No company data found.

                </div>

              ) : (

                <div className="overflow-x-auto">

                  <table className="w-full min-w-[950px] text-left text-sm">

                    <thead className="border-b border-gray-200 bg-gray-50">

                      <tr>

                        <th className="px-5 py-4 font-semibold">
                          Company
                        </th>

                        <th className="px-5 py-4 font-semibold">
                          Total
                        </th>

                        <th className="px-5 py-4 font-semibold">
                          Positive
                        </th>

                        <th className="px-5 py-4 font-semibold">
                          Negative
                        </th>

                        <th className="px-5 py-4 font-semibold">
                          Neutral
                        </th>

                        <th className="px-5 py-4 font-semibold">
                          Processed
                        </th>

                        <th className="px-5 py-4 font-semibold">
                          Pending
                        </th>

                        <th className="px-5 py-4 font-semibold">
                          Rating
                        </th>

                      </tr>

                    </thead>


                    <tbody>

                      {companies.map(
                        (company) => (

                          <tr
                            key={
                              company.company_id
                            }
                            className="border-b border-gray-100 last:border-0 hover:bg-gray-50"
                          >

                            <td className="px-5 py-4">

                              <p className="font-semibold">
                                {
                                  company.company_name
                                }
                              </p>

                              <p className="mt-1 text-xs text-gray-400">
                                ID #
                                {
                                  company.company_id
                                }
                              </p>

                            </td>


                            <td className="px-5 py-4 font-bold">

                              {
                                company.total_feedback
                              }

                            </td>


                            <td className="px-5 py-4">

                              {
                                company.positive
                              }

                              <span className="ml-1 text-xs text-gray-400">

                                (
                                {
                                  company.positive_percentage
                                }%)

                              </span>

                            </td>


                            <td className="px-5 py-4">

                              {
                                company.negative
                              }

                              <span className="ml-1 text-xs text-gray-400">

                                (
                                {
                                  company.negative_percentage
                                }%)

                              </span>

                            </td>


                            <td className="px-5 py-4">

                              {
                                company.neutral
                              }

                              <span className="ml-1 text-xs text-gray-400">

                                (
                                {
                                  company.neutral_percentage
                                }%)

                              </span>

                            </td>


                            <td className="px-5 py-4">

                              {
                                company.processed
                              }

                            </td>


                            <td className="px-5 py-4">

                              {
                                company.pending
                              }

                            </td>


                            <td className="px-5 py-4">

                              <div className="flex items-center gap-1">

                                <Star
                                  size={15}
                                  className="fill-current"
                                />

                                {company.average_rating !==
                                null
                                  ? company.average_rating.toFixed(
                                      2
                                    )
                                  : "N/A"}

                              </div>

                            </td>

                          </tr>

                        )
                      )}

                    </tbody>

                  </table>

                </div>

              )}

            </div>


            {/* ==================================================
                DETAILED COMPANY CARDS
                ================================================== */}

            <div className="mt-6">

              <h3 className="mb-4 text-lg font-semibold">
                Company Details
              </h3>

              <div className="grid gap-5 lg:grid-cols-2">

                {companies.map(
                  (company) => (

                    <CompanyAnalyticsCard
                      key={
                        company.company_id
                      }
                      company={company}
                    />

                  )
                )}

              </div>

            </div>

          </div>

        </>

      ) : (

        <div className="rounded-2xl border bg-white p-8 text-center text-sm text-gray-500">

          No analytics data available.

        </div>

      )}

    </AppShell>
  );
}


/* ============================================================
   SIMPLE STAT
   ============================================================ */

function SimpleStat({
  title,
  value,
}: {
  title: string;
  value: number;
}) {

  return (

    <div className="rounded-2xl border bg-white p-5">

      <p className="text-sm text-gray-500">
        {title}
      </p>

      <p className="mt-2 text-2xl font-bold">
        {value}
      </p>

    </div>

  );
}


/* ============================================================
   COMPANY STAT
   ============================================================ */

function CompanyStat({
  title,
  value,
  icon,
}: {
  title: string;
  value: number;
  icon: React.ReactNode;
}) {

  return (

    <div className="rounded-2xl border bg-white p-5">

      <div className="mb-4 flex items-center justify-between">

        <p className="text-sm text-gray-500">
          {title}
        </p>

        <div className="text-gray-700">
          {icon}
        </div>

      </div>

      <p className="text-3xl font-bold">
        {value}
      </p>

    </div>

  );
}


/* ============================================================
   COMPANY ANALYTICS CARD
   ============================================================ */

function CompanyAnalyticsCard({
  company,
}: {
  company: CompanyAnalytics;
}) {

  return (

    <div className="rounded-2xl border bg-white p-6">

      {/* Company */}

      <div className="mb-6">

        <h4 className="text-lg font-bold">
          {company.company_name}
        </h4>

        <p className="mt-1 text-xs text-gray-400">
          Company ID #
          {company.company_id}
        </p>

      </div>


      {/* Main Statistics */}

      <div className="grid grid-cols-2 gap-3">

        <DetailItem
          label="Total Feedback"
          value={
            company.total_feedback
          }
        />

        <DetailItem
          label="AI Processed"
          value={
            company.processed
          }
        />

        <DetailItem
          label="Pending"
          value={
            company.pending
          }
        />

        <DetailItem
          label="Feature Requests"
          value={
            company.feature_requests
          }
        />

      </div>


      {/* Sentiment */}

      <div className="mt-6">

        <h5 className="mb-4 text-sm font-semibold">
          Sentiment Analysis
        </h5>

        <div className="space-y-4">

          <SentimentRow
            label="Positive"
            count={
              company.positive
            }
            percentage={
              company.positive_percentage
            }
          />

          <SentimentRow
            label="Negative"
            count={
              company.negative
            }
            percentage={
              company.negative_percentage
            }
          />

          <SentimentRow
            label="Neutral"
            count={
              company.neutral
            }
            percentage={
              company.neutral_percentage
            }
          />

        </div>

      </div>


      {/* Rating */}

      <div className="mt-6 flex items-center justify-between border-t border-gray-200 pt-5">

        <span className="text-sm text-gray-500">
          Average Rating
        </span>

        <span className="flex items-center gap-1 font-semibold">

          <Star
            size={16}
            className="fill-current"
          />

          {company.average_rating !==
          null
            ? `${company.average_rating.toFixed(
                2
              )} / 5`
            : "Not rated"}

        </span>

      </div>


      {/* Top Issue */}

      <div className="mt-4 flex items-center justify-between">

        <span className="text-sm text-gray-500">
          Top Issue
        </span>

        <span className="max-w-[60%] truncate rounded-md border border-gray-300 px-3 py-1 text-sm font-medium">

          {company.top_issue ||
            "No issues yet"}

        </span>

      </div>

    </div>

  );
}


/* ============================================================
   DETAIL ITEM
   ============================================================ */

function DetailItem({
  label,
  value,
}: {
  label: string;
  value: number;
}) {

  return (

    <div className="rounded-lg border border-gray-200 bg-gray-50 p-3">

      <p className="text-xs text-gray-500">
        {label}
      </p>

      <p className="mt-1 text-xl font-bold">
        {value}
      </p>

    </div>

  );

}


/* ============================================================
   SENTIMENT ROW
   ============================================================ */

function SentimentRow({
  label,
  count,
  percentage,
}: {
  label: string;
  count: number;
  percentage: number;
}) {

  return (

    <div>

      <div className="mb-1 flex items-center justify-between text-xs">

        <span className="font-medium">
          {label}
        </span>

        <span className="text-gray-500">
          {count} ({percentage}%)
        </span>

      </div>

      <div className="h-2 overflow-hidden rounded-full bg-gray-200">

        <div
          className="h-full rounded-full bg-black transition-all"
          style={{
            width: `${Math.min(
              percentage,
              100
            )}%`,
          }}
        />

      </div>

    </div>

  );

}