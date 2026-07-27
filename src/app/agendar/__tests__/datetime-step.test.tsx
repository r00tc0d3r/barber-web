// @vitest-environment happy-dom
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { DateTimeStep } from "../steps/datetime-step";
import type { Slot } from "@/types/models";

const mockSlots: Slot[] = [
	{ time: "09:00", available: true },
	{ time: "09:30", available: false },
	{ time: "10:00", available: true },
];

describe("DateTimeStep", () => {
	it("renders date input", () => {
		render(
			<DateTimeStep
				date=""
				time={null}
				slots={[]}
				loading={false}
				onDateChange={vi.fn()}
				onSelect={vi.fn()}
				onBack={vi.fn()}
			/>,
		);

		expect(screen.getByLabelText("Día")).toBeInTheDocument();
	});

	it("shows back button", () => {
		render(
			<DateTimeStep
				date=""
				time={null}
				slots={[]}
				loading={false}
				onDateChange={vi.fn()}
				onSelect={vi.fn()}
				onBack={vi.fn()}
			/>,
		);

		expect(screen.getByText("← Cambiar servicio")).toBeInTheDocument();
	});

	it("calls onBack when clicking back button", () => {
		const onBack = vi.fn();
		render(
			<DateTimeStep
				date=""
				time={null}
				slots={[]}
				loading={false}
				onDateChange={vi.fn()}
				onSelect={vi.fn()}
				onBack={onBack}
			/>,
		);

		fireEvent.click(screen.getByText("← Cambiar servicio"));
		expect(onBack).toHaveBeenCalled();
	});

	it("shows loading skeleton", () => {
		render(
			<DateTimeStep
				date="2026-08-01"
				time={null}
				slots={[]}
				loading={true}
				onDateChange={vi.fn()}
				onSelect={vi.fn()}
				onBack={vi.fn()}
			/>,
		);

		const loadingRegion = screen.getByLabelText(
			"Cargando horarios disponibles",
		);
		expect(loadingRegion).toBeInTheDocument();
		expect(loadingRegion).toHaveAttribute("aria-busy", "true");
	});

	it("renders slots when available", () => {
		render(
			<DateTimeStep
				date="2026-08-01"
				time={null}
				slots={mockSlots}
				loading={false}
				onDateChange={vi.fn()}
				onSelect={vi.fn()}
				onBack={vi.fn()}
			/>,
		);

		expect(screen.getByText("09:00")).toBeInTheDocument();
		expect(screen.getByText("09:30")).toBeInTheDocument();
		expect(screen.getByText("10:00")).toBeInTheDocument();
	});

	it("calls onSelect when clicking a slot", () => {
		const onSelect = vi.fn();
		render(
			<DateTimeStep
				date="2026-08-01"
				time={null}
				slots={mockSlots}
				loading={false}
				onDateChange={vi.fn()}
				onSelect={onSelect}
				onBack={vi.fn()}
			/>,
		);

		fireEvent.click(screen.getByText("10:00"));
		expect(onSelect).toHaveBeenCalledWith("10:00");
	});

	it("calls onDateChange when date changes", () => {
		const onDateChange = vi.fn();
		render(
			<DateTimeStep
				date=""
				time={null}
				slots={[]}
				loading={false}
				onDateChange={onDateChange}
				onSelect={vi.fn()}
				onBack={vi.fn()}
			/>,
		);

		const dateInput = screen.getByLabelText("Día");
		fireEvent.change(dateInput, { target: { value: "2026-08-01" } });
		expect(onDateChange).toHaveBeenCalledWith("2026-08-01");
	});
});
