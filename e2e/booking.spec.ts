import { test, expect } from "@playwright/test";

test.describe("Booking flow", () => {
	test("complete booking flow from barber selection to confirmation", async ({
		page,
	}) => {
		// Navigate to booking page
		await page.goto("/agendar");

		// Step 1: Select a barber
		await expect(page.getByText("Elegí tu barbero")).toBeVisible();
		const barberButton = page.getByRole("radio", { name: /Barbero:/ }).first();
		await barberButton.click();

		// Step 2: Select a service
		await expect(page.getByText("Elegí el servicio")).toBeVisible();
		const serviceButton = page
			.getByRole("radio", { name: /Servicio:/ })
			.first();
		await serviceButton.click();

		// Step 3: Select date and time
		await expect(page.getByText("Elegí día y horario")).toBeVisible();

		// Select a date (7 days from now)
		const futureDate = new Date();
		futureDate.setDate(futureDate.getDate() + 7);
		const dateStr = futureDate.toISOString().split("T")[0];
		await page.getByLabel("Día").fill(dateStr);

		// Wait for slots to load
		await expect(page.getByLabel("Horarios disponibles")).toBeVisible();

		// Select a time slot
		const timeSlot = page
			.getByRole("radio", { name: /Horario: \d{2}:\d{2}/ })
			.first();
		await timeSlot.click();

		// Step 4: Fill in client info
		await expect(page.getByText("Tus datos")).toBeVisible();
		await page.getByLabel("Nombre").fill("Test Client");
		await page.getByLabel("Teléfono").fill("11 1234 5678");
		await page.getByLabel(/Email/).fill("test@example.com");

		// Submit the form
		await page.getByRole("button", { name: /Confirmar turno/ }).click();

		// Step 5: Confirmation
		await expect(page.getByText("Turno confirmado")).toBeVisible();
	});

	test("shows validation errors on invalid data", async ({ page }) => {
		await page.goto("/agendar");

		// Skip to info step by selecting barber, service, and time
		const barberButton = page.getByRole("radio", { name: /Barbero:/ }).first();
		await barberButton.click();

		const serviceButton = page
			.getByRole("radio", { name: /Servicio:/ })
			.first();
		await serviceButton.click();

		const futureDate = new Date();
		futureDate.setDate(futureDate.getDate() + 7);
		await page.getByLabel("Día").fill(futureDate.toISOString().split("T")[0]);
		await page.getByLabel("Horarios disponibles").waitFor();
		const timeSlot = page
			.getByRole("radio", { name: /Horario: \d{2}:\d{2}/ })
			.first();
		await timeSlot.click();

		// Try to submit without filling fields
		await page.getByRole("button", { name: /Confirmar turno/ }).click();

		// Should show validation errors
		await expect(page.getByText("Nombre requerido")).toBeVisible();
		await expect(page.getByText("Teléfono requerido")).toBeVisible();
	});
});
