// @vitest-environment happy-dom
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { ProgressIndicator } from "../components/progress-indicator";

describe("ProgressIndicator", () => {
	it("renders all step labels", () => {
		render(<ProgressIndicator currentStep={0} />);

		expect(screen.getByText("Barbero")).toBeInTheDocument();
		expect(screen.getByText("Servicio")).toBeInTheDocument();
		expect(screen.getByText("Horario")).toBeInTheDocument();
		expect(screen.getByText("Tus datos")).toBeInTheDocument();
	});

	it("highlights current step", () => {
		render(<ProgressIndicator currentStep={1} />);

		const circles = screen.getAllByText(/^\d$/);
		// Step 2 (index 1) should have blue background
		expect(circles[1]).toHaveClass("bg-blue-600");
	});

	it("highlights completed steps", () => {
		render(<ProgressIndicator currentStep={2} />);

		const circles = screen.getAllByText(/^\d$/);
		// Steps 1 and 2 should be blue (completed)
		expect(circles[0]).toHaveClass("bg-blue-600");
		expect(circles[1]).toHaveClass("bg-blue-600");
		// Step 3 should also be blue (current)
		expect(circles[2]).toHaveClass("bg-blue-600");
	});

	it("dims future steps", () => {
		render(<ProgressIndicator currentStep={0} />);

		const circles = screen.getAllByText(/^\d$/);
		// Steps 2-4 should be gray (future)
		expect(circles[1]).toHaveClass("bg-neutral-800");
		expect(circles[2]).toHaveClass("bg-neutral-800");
		expect(circles[3]).toHaveClass("bg-neutral-800");
	});

	it("renders separators between steps", () => {
		const { container } = render(<ProgressIndicator currentStep={0} />);

		const separators = container.querySelectorAll(".text-neutral-700");
		expect(separators.length).toBe(3); // 3 separators for 4 steps
	});
});
