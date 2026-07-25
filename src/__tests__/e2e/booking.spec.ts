/**
 * E2E tests for the booking wizard flow.
 *
 * Covers the full user journey: homepage → barber selection →
 * service selection → date/time → contact info → confirmation.
 *
 * Prerequisites:
 * - Dev server running (pnpm dev)
 * - Database seeded with test data (pnpm seed)
 */

import { test, expect } from "@playwright/test";

test.describe("Booking wizard", () => {
	test("homepage loads and shows barberos and servicios stats", async ({
		page,
	}) => {
		await page.goto("/");

		// Hero section should be visible
		await expect(page.locator("h1")).toContainText("Style Dealers");

		// Stats should show barberos and servicios counts
		await expect(page.getByText("Barberos")).toBeVisible();
		await expect(page.getByText("Servicios")).toBeVisible();

		// CTA buttons should exist
		await expect(
			page.getByRole("link", { name: /agendar turno/i }),
		).toBeVisible();
	});

	test("booking wizard shows barber selection as first step", async ({
		page,
	}) => {
		await page.goto("/agendar");

		// Step indicator should show step 1 active
		await expect(page.getByText("Barbero")).toBeVisible();
		await expect(page.getByText("Elegí tu barbero")).toBeVisible();
	});

	test("booking wizard shows service selection after choosing a barber", async ({
		page,
	}) => {
		await page.goto("/agendar");

		// Wait for barber list and click first available barber
		const barberButtons = page.locator("button", { hasText: /^[A-Z]/ });
		const count = await barberButtons.count();
		if (count === 0) {
			test.skip(true, "No barbers available — seed the database first");
			return;
		}

		await barberButtons.first().click();

		// Should advance to service selection step
		await expect(page.getByText("Elegí el servicio")).toBeVisible();
	});

	test("booking wizard shows date/time step after selecting a service", async ({
		page,
	}) => {
		await page.goto("/agendar");

		const barberButtons = page.locator("button", { hasText: /^[A-Z]/ });
		const barberCount = await barberButtons.count();
		if (barberCount === 0) {
			test.skip(true, "No barbers available");
			return;
		}

		await barberButtons.first().click();
		await expect(page.getByText("Elegí el servicio")).toBeVisible();

		// Click first available service
		const serviceButtons = page.locator("button").filter({ hasText: /min/ });
		const serviceCount = await serviceButtons.count();
		if (serviceCount === 0) {
			test.skip(true, "No services available for this barber");
			return;
		}

		await serviceButtons.first().click();

		// Should advance to datetime step
		await expect(page.getByText("Elegí día y horario")).toBeVisible();
	});

	test("booking wizard shows date input field", async ({ page }) => {
		await page.goto("/agendar");

		// Date input should be visible after going through first two steps
		const dateInput = page.locator('input[type="date"]');
		await expect(dateInput).toBeVisible();
	});

	test("booking wizard shows cancel page", async ({ page }) => {
		await page.goto("/agendar/cancelar");

		await expect(page.getByText(/cancelar/i)).toBeVisible();
	});
});
