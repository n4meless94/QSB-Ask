import { expect, test } from "@playwright/test";

test("login page shows required auth copy and no marketing hero", async ({ page }) => {
  await page.goto("/login");

  await expect(page.getByRole("heading", { level: 1, name: "QSB Ask" })).toBeVisible();
  await expect(page.getByText("Sign in to manage event Q&A and surveys.")).toBeVisible();
  await expect(page.getByLabel("Email")).toBeVisible();
  await expect(page.getByLabel("Password")).toBeVisible();
  await expect(page.getByRole("button", { name: "Sign in" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Forgot password" })).toHaveAttribute(
    "href",
    "/password-reset",
  );

  await expect(page.locator(".hero")).toHaveCount(0);
});

test("invalid credentials state keeps email, clears password, and focuses error summary", async ({
  page,
}) => {
  await page.goto("/login?error=invalid&email=user%40example.com");

  const email = page.getByLabel("Email");
  const password = page.getByLabel("Password");

  await expect(
    page.getByText("We could not sign you in. Check your email and password, then try again."),
  ).toBeFocused();
  await expect(email).toHaveValue("user@example.com");
  await expect(password).toHaveValue("");
});

test("password reset request uses non-enumerating confirmation copy", async ({ page }) => {
  await page.goto("/password-reset?sent=1");

  await expect(
    page.getByText("If an account exists for that email, a reset link has been sent."),
  ).toBeVisible();
});

test("expired password reset link routes back to request flow", async ({ page }) => {
  await page.goto("/password-reset/confirm?error=expired");

  await expect(
    page.getByText("This reset link is invalid or expired. Request a new reset link."),
  ).toBeVisible();
  await expect(page.getByRole("link", { name: "Request a new reset link" })).toHaveAttribute(
    "href",
    "/password-reset",
  );
});

test("unauthenticated dashboard access redirects to login", async ({ page }) => {
  await page.goto("/dashboard");

  await expect(page).toHaveURL(/\/login/);
});
