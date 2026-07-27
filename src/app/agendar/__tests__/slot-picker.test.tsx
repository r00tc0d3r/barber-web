// @vitest-environment happy-dom
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { SlotPicker } from "../components/slot-picker";
import type { Slot } from "@/types/models";

const mockSlots: Slot[] = [
	{ time: "09:00", available: true },
	{ time: "09:30", available: false },
	{ time: "10:00", available: true },
	{ time: "10:30", available: true },
];

describe("SlotPicker", () => {
	it("renders all slots", () => {
		render(<SlotPicker slots={mockSlots} selected={null} onSelect={vi.fn()} />);

		expect(screen.getByText("09:00")).toBeInTheDocument();
		expect(screen.getByText("09:30")).toBeInTheDocument();
		expect(screen.getByText("10:00")).toBeInTheDocument();
		expect(screen.getByText("10:30")).toBeInTheDocument();
	});

	it("disables unavailable slots", () => {
		render(<SlotPicker slots={mockSlots} selected={null} onSelect={vi.fn()} />);

		const unavailable = screen.getByText("09:30");
		expect(unavailable).toBeDisabled();
		expect(unavailable).toHaveClass("cursor-not-allowed");
	});

	it("calls onSelect when clicking available slot", () => {
		const onSelect = vi.fn();
		render(
			<SlotPicker slots={mockSlots} selected={null} onSelect={onSelect} />,
		);

		fireEvent.click(screen.getByText("10:00"));
		expect(onSelect).toHaveBeenCalledWith("10:00");
	});

	it("does not call onSelect when clicking unavailable slot", () => {
		const onSelect = vi.fn();
		render(
			<SlotPicker slots={mockSlots} selected={null} onSelect={onSelect} />,
		);

		fireEvent.click(screen.getByText("09:30"));
		expect(onSelect).not.toHaveBeenCalled();
	});

	it("highlights selected slot", () => {
		render(
			<SlotPicker slots={mockSlots} selected="10:00" onSelect={vi.fn()} />,
		);

		const selected = screen.getByText("10:00");
		expect(selected).toHaveClass("bg-blue-600");
		expect(selected).toHaveClass("text-white");
	});

	it("shows empty state when no slots", () => {
		render(<SlotPicker slots={[]} selected={null} onSelect={vi.fn()} />);

		expect(
			screen.getByText("No hay horarios disponibles para este día."),
		).toBeInTheDocument();
	});
});
