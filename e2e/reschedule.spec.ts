import { test, expect } from "@playwright/test";

test.describe("Reschedule flow", () => {
	test("reschedule appointment from profile", async ({ page }) => {
		// Login first (assuming test user exists)
		await page.goto("/login");
		await page.getByLabel("Email").fill("test@example.com");
		await page.getByLabel("Contraseña").fill("password123");
		await page.getByRole("button", { name: /Iniciar sesión/ }).click();

		// Navigate to profile
		await page.goto("/perfil");
		await expect(page.getByText("Mis turnos")).toBeVisible();

		// Click reschedule button on first appointment
		const rescheduleButton = page
			.getByRole("link", { name: /Reprogramar/ })
			.first();

		// Only test if there are appointments to reschedule
		if (await rescheduleButton.isVisible()) {
			await rescheduleButton.click();

			// Should navigate to reschedule page
			await expect(page.getByText("Reprogramar turno")).toBeVisible();
			await expect(page.getByText("Turno actual:")).toBeVisible();

			// Select new date
			const futureDate = new Date();
			futureDate.setDate(futureDate.getDate() + 14);
			await page.getByLabel("Día").fill(futureDate.toISOString().split("T")[0]);

			// Wait for slots
			await expect(page.getByLabel("Horarios disponibles")).toBeVisible();

			// Select new time
			const timeSlot = page
				.getByRole("radio", { name: /Horario: \d{2}:\d{2}/ })
				.first();
			await timeSlot.click();

			// Confirm reschedule
			await page
				.getByRole("button", { name: /Confirmar nuevo horario/ })
				.click();

			// Should redirect back to profile
			await expect(page.getByText("Mis turnos")).toBeVisible();
		}
	});

	test("cancel reschedule returns to profile", async ({ page }) => {
		// Login
		await page.goto("/login");
		await page.getByLabel("Email").fill("test@example.com");
		await page.getByLabel("Contraseña").fill("password123");
		await page.getByRole("button", { name: /Iniciar sesión/ }).click();

		// Navigate to profile
		await page.goto("/perfil");

		const rescheduleButton = page
			.getByRole("link", { name: /Reprogramar/ })
			.first();

		if (await rescheduleButton.isVisible()) {
			await rescheduleButton.click();

			// Click cancel
			await page.getByRole("button", { name: /Cancelar/ }).click();

			// Should return to profile
			await expect(page.getByText("Mis turnos")).toBeVisible();
		}
	});
});
