"use client";

import {
  FormEvent,
  useEffect,
  useState,
} from "react";

import AppShell from "@/components/AppShell";
import { api } from "@/lib/api";

import type {
  Company,
  Feedback,
  Product,
} from "@/lib/types";


// ============================================================
// API RESPONSE TYPES
// ============================================================

type FeedbackResponse =
  | Feedback[]
  | {
      results: Feedback[];
    };

type CompanyResponse =
  | Company[]
  | {
      results: Company[];
    };

type ProductResponse =
  | Product[]
  | {
      results: Product[];
    };


// ============================================================
// FEEDBACK PAGE
// ============================================================

export default function FeedbackPage() {
  const [feedback, setFeedback] =
    useState<Feedback[]>([]);

  const [companies, setCompanies] =
    useState<Company[]>([]);

  const [products, setProducts] =
    useState<Product[]>([]);


  // ----------------------------------------------------------
  // FORM STATE
  // ----------------------------------------------------------

  const [title, setTitle] =
    useState("");

  const [content, setContent] =
    useState("");

  const [rating, setRating] =
    useState("");

  const [companyId, setCompanyId] =
    useState("");

  const [productId, setProductId] =
    useState("");


  // ----------------------------------------------------------
  // UI STATE
  // ----------------------------------------------------------

  const [loading, setLoading] =
    useState(true);

  const [loadingProducts, setLoadingProducts] =
    useState(false);

  const [submitting, setSubmitting] =
    useState(false);

  const [error, setError] =
    useState("");

  const [success, setSuccess] =
    useState("");


  // ==========================================================
  // LOAD FEEDBACK
  // ==========================================================

  async function loadFeedback() {
    const response =
      await api<FeedbackResponse>(
        "/feedback/",
      );

    const data = Array.isArray(response)
      ? response
      : response.results || [];

    setFeedback(data);
  }


  // ==========================================================
  // LOAD COMPANIES
  // ==========================================================

  async function loadCompanies() {
    const response =
      await api<CompanyResponse>(
        "/companies/",
      );

    const data = Array.isArray(response)
      ? response
      : response.results || [];

    setCompanies(data);
  }


  // ==========================================================
  // LOAD PRODUCTS
  // ==========================================================

  async function loadProducts(
    company: string,
  ) {
    if (!company) {
      setProducts([]);
      setProductId("");
      return;
    }

    try {
      setLoadingProducts(true);
      setError("");

      const response =
        await api<ProductResponse>(
          `/products/?company=${company}`,
        );

      const data = Array.isArray(response)
        ? response
        : response.results || [];

      setProducts(data);
      setProductId("");
    } catch (err) {
      console.error(
        "Products error:",
        err,
      );

      setProducts([]);
      setProductId("");

      setError(
        err instanceof Error
          ? err.message
          : "Failed to load products.",
      );
    } finally {
      setLoadingProducts(false);
    }
  }


  // ==========================================================
  // LOAD ALL DATA
  // ==========================================================

  async function loadData() {
    try {
      setLoading(true);
      setError("");

      await Promise.all([
        loadFeedback(),
        loadCompanies(),
      ]);
    } catch (err) {
      console.error(
        "Feedback page error:",
        err,
      );

      setError(
        err instanceof Error
          ? err.message
          : "Failed to load feedback data.",
      );
    } finally {
      setLoading(false);
    }
  }


  // ==========================================================
  // INITIAL LOAD
  // ==========================================================

  useEffect(() => {
    loadData();
  }, []);


  // ==========================================================
  // LOAD PRODUCTS WHEN COMPANY CHANGES
  // ==========================================================

  useEffect(() => {
    loadProducts(companyId);
  }, [companyId]);


  // ==========================================================
  // SUBMIT FEEDBACK
  // ==========================================================

  async function submitFeedback(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    setError("");
    setSuccess("");


    // --------------------------------------------------------
    // VALIDATION
    // --------------------------------------------------------

    if (!title.trim()) {
      setError(
        "Please enter a feedback title.",
      );
      return;
    }

    if (!content.trim()) {
      setError(
        "Please enter customer feedback.",
      );
      return;
    }

    if (!companyId) {
      setError(
        "Please select a company.",
      );
      return;
    }

    if (!productId) {
      setError(
        "Please select a product.",
      );
      return;
    }

    if (!rating) {
      setError(
        "Please select a rating.",
      );
      return;
    }


    // --------------------------------------------------------
    // API REQUEST
    // --------------------------------------------------------

    try {
      setSubmitting(true);

      await api<Feedback>(
        "/feedback/",
        {
          method: "POST",

          body: JSON.stringify({
            title: title.trim(),

            content: content.trim(),

            company: Number(companyId),

            product: Number(productId),

            rating: Number(rating),
          }),
        },
      );


      // ------------------------------------------------------
      // RESET FORM
      // ------------------------------------------------------

      setTitle("");
      setContent("");
      setRating("");
      setCompanyId("");
      setProductId("");
      setProducts([]);


      setSuccess(
        "Feedback submitted successfully.",
      );


      // ------------------------------------------------------
      // REFRESH DATABASE DATA
      // ------------------------------------------------------

      await loadFeedback();

    } catch (err) {
      console.error(
        "Submit feedback error:",
        err,
      );

      setError(
        err instanceof Error
          ? err.message
          : "Failed to submit feedback.",
      );
    } finally {
      setSubmitting(false);
    }
  }


  // ==========================================================
  // RENDER
  // ==========================================================

  return (
    <AppShell>

      {/* ======================================================
          PAGE HEADER
          ====================================================== */}

      <div className="mb-7">
        <h2 className="text-2xl font-bold">
          Customer Feedback
        </h2>

        <p className="mt-1 text-sm text-gray-500">
          Submit customer feedback and analyze
          sentiment, issues and product requests.
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
          SUCCESS
          ====================================================== */}

      {success && (
        <div className="mb-5 rounded-xl border border-green-200 bg-green-50 p-4 text-sm text-green-700">
          {success}
        </div>
      )}


      {/* ======================================================
          SUBMIT FORM
          ====================================================== */}

      <form
        onSubmit={submitFeedback}
        className="mb-8 rounded-2xl border bg-white p-6 shadow-sm"
      >

        <h3 className="mb-5 text-lg font-semibold">
          Submit Feedback
        </h3>


        <div className="space-y-4">

          {/* --------------------------------------------------
              TITLE
              -------------------------------------------------- */}

          <div>
            <label className="mb-2 block text-sm font-medium">
              Feedback Title
            </label>

            <input
              type="text"
              required
              value={title}
              onChange={(event) =>
                setTitle(event.target.value)
              }
              placeholder="Example: Product quality issue"
              className="w-full rounded-lg border px-3 py-2.5 outline-none focus:border-black"
            />
          </div>


          {/* --------------------------------------------------
              CONTENT
              -------------------------------------------------- */}

          <div>
            <label className="mb-2 block text-sm font-medium">
              Customer Feedback
            </label>

            <textarea
              required
              value={content}
              onChange={(event) =>
                setContent(event.target.value)
              }
              placeholder="Enter customer feedback..."
              rows={5}
              className="w-full rounded-lg border px-3 py-2.5 outline-none focus:border-black"
            />
          </div>


          {/* --------------------------------------------------
              COMPANY / PRODUCT / RATING
              -------------------------------------------------- */}

          <div className="grid gap-4 md:grid-cols-3">

            {/* COMPANY */}

            <div>
              <label className="mb-2 block text-sm font-medium">
                Company
              </label>

              <select
                required
                value={companyId}
                onChange={(event) =>
                  setCompanyId(
                    event.target.value,
                  )
                }
                className="w-full rounded-lg border bg-white px-3 py-2.5"
              >

                <option value="">
                  Select company
                </option>

                {companies.map(
                  (company) => (
                    <option
                      key={company.id}
                      value={company.id}
                    >
                      {company.name}
                    </option>
                  ),
                )}

              </select>
            </div>


            {/* PRODUCT */}

            <div>
              <label className="mb-2 block text-sm font-medium">
                Product
              </label>

              <select
                required
                value={productId}
                onChange={(event) =>
                  setProductId(
                    event.target.value,
                  )
                }
                disabled={
                  !companyId ||
                  loadingProducts
                }
                className="w-full rounded-lg border bg-white px-3 py-2.5 disabled:bg-gray-100"
              >

                <option value="">
                  {loadingProducts
                    ? "Loading products..."
                    : !companyId
                      ? "Select company first"
                      : products.length === 0
                        ? "No products found"
                        : "Select product"}
                </option>

                {products.map(
                  (product) => (
                    <option
                      key={product.id}
                      value={product.id}
                    >
                      {product.name}
                    </option>
                  ),
                )}

              </select>
            </div>


            {/* RATING */}

            <div>
              <label className="mb-2 block text-sm font-medium">
                Rating
              </label>

              <select
                required
                value={rating}
                onChange={(event) =>
                  setRating(
                    event.target.value,
                  )
                }
                className="w-full rounded-lg border bg-white px-3 py-2.5"
              >

                <option value="">
                  Select rating
                </option>

                <option value="1">
                  ⭐ 1 / 5
                </option>

                <option value="2">
                  ⭐⭐ 2 / 5
                </option>

                <option value="3">
                  ⭐⭐⭐ 3 / 5
                </option>

                <option value="4">
                  ⭐⭐⭐⭐ 4 / 5
                </option>

                <option value="5">
                  ⭐⭐⭐⭐⭐ 5 / 5
                </option>

              </select>
            </div>

          </div>

        </div>


        {/* ----------------------------------------------------
            SUBMIT
            ---------------------------------------------------- */}

        <button
          type="submit"
          disabled={submitting}
          className="mt-5 rounded-lg bg-black px-5 py-2.5 text-white disabled:cursor-not-allowed disabled:opacity-50"
        >
          {submitting
            ? "Submitting..."
            : "Submit Feedback"}
        </button>

      </form>


      {/* ======================================================
          FEEDBACK LIST
          ====================================================== */}

      <div className="rounded-2xl border bg-white shadow-sm">

        <div className="border-b p-5">

          <h3 className="font-semibold">
            Feedback List
          </h3>

          <p className="mt-1 text-xs text-gray-500">
            All feedback stored in the database.
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


        {/* DATA */}

        {!loading &&
          feedback.length > 0 && (
            <div className="divide-y">

              {feedback.map(
                (item) => (

                  <div
                    key={item.id}
                    className="p-5"
                  >

                    {/* TITLE + SENTIMENT */}

                    <div className="flex items-start justify-between gap-4">

                      <div className="min-w-0">

                        <h4 className="font-semibold">
                          {item.title ||
                            "Untitled Feedback"}
                        </h4>

                        <p className="mt-2 text-sm text-gray-600">
                          {item.content ||
                            "No feedback content"}
                        </p>

                      </div>


                      {/* SENTIMENT */}

                      <span className="shrink-0 rounded-full bg-gray-100 px-3 py-1 text-xs font-medium">
                        {item.sentiment ||
                          "Pending"}
                      </span>

                    </div>


                    {/* ==================================================
                        DATABASE DETAILS
                        ================================================== */}

                    <div className="mt-4 grid gap-3 text-sm md:grid-cols-2">

                      {/* COMPANY */}

                      <div className="rounded-lg bg-gray-50 p-3">

                        <p className="text-xs text-gray-500">
                          Company
                        </p>

                        <p className="mt-1 font-medium text-gray-900">
                          {item.company_name ||
                            `Company #${item.company}`}
                        </p>

                        {item.company_description && (
                          <p className="mt-1 text-xs text-gray-500">
                            {item.company_description}
                          </p>
                        )}

                      </div>


                      {/* PRODUCT */}

                      <div className="rounded-lg bg-gray-50 p-3">

                        <p className="text-xs text-gray-500">
                          Product
                        </p>

                        <p className="mt-1 font-medium text-gray-900">
                          {item.product_name ||
                            `Product #${item.product}`}
                        </p>

                        {item.product_description && (
                          <p className="mt-1 text-xs text-gray-500">
                            {item.product_description}
                          </p>
                        )}

                      </div>


                      {/* TITLE */}

                      <div className="rounded-lg bg-gray-50 p-3">

                        <p className="text-xs text-gray-500">
                          Title
                        </p>

                        <p className="mt-1 font-medium text-gray-900">
                          {item.title}
                        </p>

                      </div>


                      {/* RATING */}

                      <div className="rounded-lg bg-gray-50 p-3">

                        <p className="text-xs text-gray-500">
                          Rating
                        </p>

                        <p className="mt-1 font-medium text-gray-900">
                          {item.rating != null
                            ? `${item.rating} / 5`
                            : "Not rated"}
                        </p>

                      </div>


                      {/* SENTIMENT */}

                      <div className="rounded-lg bg-gray-50 p-3">

                        <p className="text-xs text-gray-500">
                          Sentiment
                        </p>

                        <p className="mt-1 font-medium text-gray-900">
                          {item.sentiment ||
                            "Pending"}
                        </p>

                      </div>


                      {/* CATEGORY */}

                      <div className="rounded-lg bg-gray-50 p-3">

                        <p className="text-xs text-gray-500">
                          Category
                        </p>

                        <p className="mt-1 font-medium text-gray-900">
                          {item.category ||
                            "Uncategorized"}
                        </p>

                      </div>


                      {/* AI PROCESSING */}

                      <div className="rounded-lg bg-gray-50 p-3">

                        <p className="text-xs text-gray-500">
                          AI Status
                        </p>

                        <p className="mt-1 font-medium text-gray-900">
                          {item.is_processed
                            ? "Processed"
                            : "Pending"}
                        </p>

                      </div>


                      {/* SENTIMENT SCORE */}

                      <div className="rounded-lg bg-gray-50 p-3">

                        <p className="text-xs text-gray-500">
                          Sentiment Score
                        </p>

                        <p className="mt-1 font-medium text-gray-900">
                          {item.sentiment_score != null
                            ? item.sentiment_score
                            : "Pending"}
                        </p>

                      </div>

                    </div>

                  </div>

                ),
              )}

            </div>
          )}

      </div>

    </AppShell>
  );
}