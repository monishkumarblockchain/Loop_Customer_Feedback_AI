"use client";

import {
  FormEvent,
  useEffect,
  useState,
} from "react";
import { useRouter } from "next/navigation";

import AppShell from "@/components/AppShell";
import { api } from "@/lib/api";
import {
  canAccessCompanies,
} from "@/lib/auth";

import type {
  Company,
  Product,
} from "@/lib/types";

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

export default function CompaniesPage() {
  const router = useRouter();

  const [authorized, setAuthorized] =
    useState(false);

  const [companies, setCompanies] =
    useState<Company[]>([]);

  const [products, setProducts] =
    useState<Record<number, Product[]>>({});

  const [name, setName] = useState("");
  const [description, setDescription] =
    useState("");
  const [website, setWebsite] =
    useState("");

  const [productNames, setProductNames] =
    useState<Record<number, string>>({});

  const [productDescriptions, setProductDescriptions] =
    useState<Record<number, string>>({});

  const [loading, setLoading] =
    useState(true);

  const [creating, setCreating] =
    useState(false);

  const [addingProduct, setAddingProduct] =
    useState<number | null>(null);

  const [error, setError] = useState("");
  const [success, setSuccess] =
    useState("");

  /*
   * ------------------------------------------------
   * ROLE AUTHORIZATION
   * ------------------------------------------------
   *
   * ADMIN  -> allowed
   * OWNER  -> allowed
   * ANALYST -> denied
   * VIEWER -> denied
   */
  useEffect(() => {
    const allowed = canAccessCompanies();

    if (!allowed) {
      router.replace("/dashboard");
      return;
    }

    setAuthorized(true);
  }, [router]);

  /*
   * ------------------------------------------------
   * LOAD COMPANIES
   * ------------------------------------------------
   */
  async function loadCompanies() {
    try {
      setLoading(true);
      setError("");

      const response =
        await api<CompanyResponse>(
          "/companies/",
        );

      const data = Array.isArray(response)
        ? response
        : response.results || [];

      setCompanies(data);

      /*
       * Load products for every company
       */
      await Promise.all(
        data.map((company) =>
          loadProducts(company.id),
        ),
      );
    } catch (error) {
      console.error(
        "Failed to load companies:",
        error,
      );

      setError(
        error instanceof Error
          ? error.message
          : "Failed to load companies.",
      );
    } finally {
      setLoading(false);
    }
  }

  /*
   * ------------------------------------------------
   * LOAD PRODUCTS
   * ------------------------------------------------
   */
  async function loadProducts(
    companyId: number,
  ) {
    try {
      const response =
        await api<ProductResponse>(
          `/products/?company=${companyId}`,
        );

      const data = Array.isArray(response)
        ? response
        : response.results || [];

      setProducts((current) => ({
        ...current,
        [companyId]: data,
      }));
    } catch (error) {
      console.error(
        `Failed to load products for company ${companyId}:`,
        error,
      );
    }
  }

  /*
   * ------------------------------------------------
   * INITIAL DATA LOAD
   * ------------------------------------------------
   */
  useEffect(() => {
    if (!authorized) {
      return;
    }

    async function load() {
      await loadCompanies();
    }

    load();
  }, [authorized]);

  /*
   * ------------------------------------------------
   * CREATE COMPANY
   * ------------------------------------------------
   */
  async function createCompany(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    const companyName = name.trim();

    if (!companyName) {
      setError(
        "Company name is required.",
      );
      return;
    }

    try {
      setCreating(true);
      setError("");
      setSuccess("");

      await api<Company>(
        "/companies/",
        {
          method: "POST",
          body: JSON.stringify({
            name: companyName,
            description:
              description.trim(),
            website: website.trim(),
          }),
        },
      );

      /*
       * Clear form
       */
      setName("");
      setDescription("");
      setWebsite("");

      setSuccess(
        "Company created successfully.",
      );

      /*
       * Reload companies
       */
      await loadCompanies();
    } catch (error) {
      console.error(
        "Create company error:",
        error,
      );

      setError(
        error instanceof Error
          ? error.message
          : "Failed to create company.",
      );
    } finally {
      setCreating(false);
    }
  }

  /*
   * ------------------------------------------------
   * CREATE PRODUCT
   * ------------------------------------------------
   */
  async function createProduct(
    companyId: number,
  ) {
    const productName =
      productNames[companyId]?.trim();

    const productDescription =
      productDescriptions[
        companyId
      ]?.trim() || "";

    if (!productName) {
      setError(
        "Product name is required.",
      );
      return;
    }

    try {
      setAddingProduct(companyId);
      setError("");
      setSuccess("");

      await api<Product>(
        "/products/",
        {
          method: "POST",
          body: JSON.stringify({
            company: companyId,
            name: productName,
            description:
              productDescription,
          }),
        },
      );

      /*
       * Clear product form
       */
      setProductNames((current) => ({
        ...current,
        [companyId]: "",
      }));

      setProductDescriptions(
        (current) => ({
          ...current,
          [companyId]: "",
        }),
      );

      /*
       * Reload products
       */
      await loadProducts(companyId);

      setSuccess(
        "Product added successfully.",
      );
    } catch (error) {
      console.error(
        "Create product error:",
        error,
      );

      setError(
        error instanceof Error
          ? error.message
          : "Failed to create product.",
      );
    } finally {
      setAddingProduct(null);
    }
  }

  /*
   * ------------------------------------------------
   * DELETE PRODUCT
   * ------------------------------------------------
   */
  async function deleteProduct(
    productId: number,
    companyId: number,
  ) {
    const confirmed =
      window.confirm(
        "Delete this product?",
      );

    if (!confirmed) {
      return;
    }

    try {
      setError("");
      setSuccess("");

      await api(
        `/products/${productId}/`,
        {
          method: "DELETE",
        },
      );

      /*
       * Reload products
       */
      await loadProducts(companyId);

      setSuccess(
        "Product deleted successfully.",
      );
    } catch (error) {
      console.error(
        "Delete product error:",
        error,
      );

      setError(
        error instanceof Error
          ? error.message
          : "Failed to delete product.",
      );
    }
  }

  /*
   * ------------------------------------------------
   * AUTHORIZATION LOADING
   * ------------------------------------------------
   */
  if (!authorized) {
    return null;
  }

  /*
   * ------------------------------------------------
   * PAGE UI
   * ------------------------------------------------
   */
  return (
    <AppShell>
      <div className="p-6 md:p-8">
        {/* PAGE HEADER */}
        <div className="mb-7">
          <h2 className="text-2xl font-bold">
            Companies
          </h2>

          <p className="mt-1 text-sm text-gray-500">
            Create companies and manage
            their products.
          </p>
        </div>

        {/* ERROR */}
        {error && (
          <div className="mb-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* SUCCESS */}
        {success && (
          <div className="mb-5 rounded-xl border border-green-200 bg-green-50 p-4 text-sm text-green-700">
            {success}
          </div>
        )}

        {/* CREATE COMPANY */}
        <form
          onSubmit={createCompany}
          className="mb-8 rounded-2xl border bg-white p-6 shadow-sm"
        >
          <h3 className="mb-5 font-semibold">
            Create Company
          </h3>

          <div className="grid gap-4 md:grid-cols-2">
            {/* COMPANY NAME */}
            <input
              required
              value={name}
              onChange={(event) =>
                setName(
                  event.target.value,
                )
              }
              placeholder="Company name"
              className="rounded-lg border px-3 py-2.5 outline-none focus:border-black"
            />

            {/* WEBSITE */}
            <input
              type="url"
              value={website}
              onChange={(event) =>
                setWebsite(
                  event.target.value,
                )
              }
              placeholder="https://example.com"
              className="rounded-lg border px-3 py-2.5 outline-none focus:border-black"
            />

            {/* DESCRIPTION */}
            <textarea
              value={description}
              onChange={(event) =>
                setDescription(
                  event.target.value,
                )
              }
              placeholder="Company description"
              rows={3}
              className="rounded-lg border px-3 py-2.5 outline-none focus:border-black md:col-span-2"
            />
          </div>

          <button
            type="submit"
            disabled={creating}
            className="mt-5 rounded-lg bg-black px-5 py-2.5 text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {creating
              ? "Creating..."
              : "Create Company"}
          </button>
        </form>

        {/* COMPANIES */}
        {loading ? (
          <div className="rounded-2xl border bg-white p-8 text-center text-gray-500 shadow-sm">
            Loading companies...
          </div>
        ) : companies.length === 0 ? (
          <div className="rounded-2xl border bg-white p-8 text-center text-gray-500 shadow-sm">
            No companies found.
          </div>
        ) : (
          <div className="space-y-6">
            {companies.map((company) => {
              const companyProducts =
                products[company.id] || [];

              return (
                <div
                  key={company.id}
                  className="rounded-2xl border bg-white p-6 shadow-sm"
                >
                  {/* COMPANY INFORMATION */}
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-xl font-bold">
                        {company.name}
                      </h3>

                      <p className="mt-2 text-sm text-gray-500">
                        {company.description ||
                          "No description"}
                      </p>

                      {company.website && (
                        <a
                          href={
                            company.website
                          }
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mt-2 block text-sm text-blue-600 hover:underline"
                        >
                          {company.website}
                        </a>
                      )}
                    </div>
                  </div>

                  {/* PRODUCTS */}
                  <div className="mt-6 border-t pt-5">
                    <h4 className="font-semibold">
                      Products
                    </h4>

                    {companyProducts.length ===
                    0 ? (
                      <p className="mt-3 text-sm text-gray-500">
                        No products added yet.
                      </p>
                    ) : (
                      <div className="mt-3 grid gap-3 md:grid-cols-2">
                        {companyProducts.map(
                          (product) => (
                            <div
                              key={
                                product.id
                              }
                              className="rounded-xl border p-4"
                            >
                              <div className="flex items-start justify-between gap-3">
                                <div>
                                  <h5 className="font-medium">
                                    {
                                      product.name
                                    }
                                  </h5>

                                  <p className="mt-1 text-sm text-gray-500">
                                    {product.description ||
                                      "No description"}
                                  </p>
                                </div>

                                <button
                                  type="button"
                                  onClick={() =>
                                    deleteProduct(
                                      product.id,
                                      company.id,
                                    )
                                  }
                                  className="text-xs text-red-600 hover:underline"
                                >
                                  Delete
                                </button>
                              </div>
                            </div>
                          ),
                        )}
                      </div>
                    )}

                    {/* ADD PRODUCT */}
                    <div className="mt-5 rounded-xl bg-gray-50 p-4">
                      <h5 className="text-sm font-semibold">
                        Add Product
                      </h5>

                      <div className="mt-3 grid gap-3 md:grid-cols-2">
                        {/* PRODUCT NAME */}
                        <input
                          value={
                            productNames[
                              company.id
                            ] || ""
                          }
                          onChange={(event) =>
                            setProductNames(
                              (current) => ({
                                ...current,
                                [company.id]:
                                  event.target
                                    .value,
                              }),
                            )
                          }
                          placeholder="Product name"
                          className="rounded-lg border bg-white px-3 py-2.5 outline-none focus:border-black"
                        />

                        {/* PRODUCT DESCRIPTION */}
                        <input
                          value={
                            productDescriptions[
                              company.id
                            ] || ""
                          }
                          onChange={(event) =>
                            setProductDescriptions(
                              (current) => ({
                                ...current,
                                [company.id]:
                                  event.target
                                    .value,
                              }),
                            )
                          }
                          placeholder="Product description"
                          className="rounded-lg border bg-white px-3 py-2.5 outline-none focus:border-black"
                        />
                      </div>

                      <button
                        type="button"
                        disabled={
                          addingProduct ===
                          company.id
                        }
                        onClick={() =>
                          createProduct(
                            company.id,
                          )
                        }
                        className="mt-3 rounded-lg bg-black px-4 py-2 text-sm text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {addingProduct ===
                        company.id
                          ? "Adding..."
                          : "+ Add Product"}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </AppShell>
  );
}