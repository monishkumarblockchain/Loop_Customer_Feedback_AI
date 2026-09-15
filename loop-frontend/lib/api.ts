const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  "http://127.0.0.1:8000/api/v1";

type ApiOptions = RequestInit & {
  skipAuth?: boolean;
};

export async function api<T>(
  endpoint: string,
  options: ApiOptions = {},
): Promise<T> {
  const {
    skipAuth = false,
    ...requestOptions
  } = options;

  // ----------------------------------------------------------
  // GET ACCESS TOKEN
  // ----------------------------------------------------------

  const token =
    typeof window !== "undefined"
      ? localStorage.getItem("access_token")
      : null;

  // ----------------------------------------------------------
  // HEADERS
  // ----------------------------------------------------------

  const headers = new Headers(
    requestOptions.headers,
  );

  // Automatically use JSON for requests with a body.
  if (
    requestOptions.body &&
    !headers.has("Content-Type")
  ) {
    headers.set(
      "Content-Type",
      "application/json",
    );
  }

  // Add JWT token.
  if (
    token &&
    !skipAuth
  ) {
    headers.set(
      "Authorization",
      `Bearer ${token}`,
    );
  }

  // ----------------------------------------------------------
  // API REQUEST
  // ----------------------------------------------------------

  const response = await fetch(
    `${API_URL}${endpoint}`,
    {
      ...requestOptions,
      headers,
      cache: "no-store",
    },
  );

  // ----------------------------------------------------------
  // NO CONTENT
  // ----------------------------------------------------------

  if (response.status === 204) {
    return undefined as T;
  }

  // ----------------------------------------------------------
  // READ RESPONSE
  // ----------------------------------------------------------

  const text = await response.text();

  let data: unknown = null;

  try {
    data = text
      ? JSON.parse(text)
      : null;
  } catch {
    data = text;
  }

  // ----------------------------------------------------------
  // HANDLE API ERROR
  // ----------------------------------------------------------

  if (!response.ok) {
    let message =
      `API request failed: ${response.status}`;

    if (
      typeof data === "object" &&
      data !== null
    ) {
      const errorData =
        data as Record<string, unknown>;

      // Django REST Framework:
      // {"detail": "..."}
      if (errorData.detail) {
        message = String(
          errorData.detail,
        );
      } else {
        // Django validation error:
        // {"email": ["This field is required."]}
        const firstValue =
          Object.values(errorData)[0];

        if (
          Array.isArray(firstValue) &&
          firstValue.length > 0
        ) {
          message = String(
            firstValue[0],
          );
        } else if (firstValue) {
          message = String(
            firstValue,
          );
        }
      }
    } else if (
      typeof data === "string" &&
      data.trim()
    ) {
      message = data;
    }

    // --------------------------------------------------------
    // UNAUTHORIZED
    // --------------------------------------------------------

    if (
      response.status === 401 &&
      typeof window !== "undefined"
    ) {
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
    }

    throw new Error(message);
  }

  // ----------------------------------------------------------
  // SUCCESS
  // ----------------------------------------------------------

  return data as T;
}


// ============================================================
// LOGOUT
// ============================================================

export function logout() {
  if (
    typeof window !== "undefined"
  ) {
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

    window.location.href = "/login";
  }
}