// @vitest-environment happy-dom
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { BarberStep } from "../steps/barber-step";
import type { BookingBarber } from "@/types/models";

const mockBarbers: BookingBarber[] = [
	{
		id: "b1",
		name: "Carlos",
		color: "#3B82F6",
		specialties: "Degradados, Clásicos",
		services: [
			{ barberId: "b1", serviceId: "s1", service: { id: "s1", name: "Corte" } },
		],
	},
	{
		id: "b2",
		name: "Luis",
		color: "#10B981",
		specialties: "Barba",
		services: [
			{ barberId: "b2", serviceId: "s2", service: { id: "s2", name: "Barba" } },
		],
	},
];

describe("BarberStep", () => {
	it("renders all barbers", () => {
		render(
			<BarberStep barbers={mockBarbers} selected={null} onSelect={vi.fn()} />,
		);

		expect(screen.getByText("Carlos")).toBeInTheDocument();
		expect(screen.getByText("Luis")).toBeInTheDocument();
	});

	it("calls onSelect when clicking a barber", () => {
		const onSelect = vi.fn();
		render(
			<BarberStep barbers={mockBarbers} selected={null} onSelect={onSelect} />,
		);

		fireEvent.click(screen.getByText("Carlos"));
		expect(onSelect).toHaveBeenCalledWith(mockBarbers[0]);
	});

	it("shows heading", () => {
		render(
			<BarberStep barbers={mockBarbers} selected={null} onSelect={vi.fn()} />,
		);

		expect(screen.getByText("Elegí tu barbero")).toBeInTheDocument();
	});

	it("renders barber color circles", () => {
		render(
			<BarberStep barbers={mockBarbers} selected={null} onSelect={vi.fn()} />,
		);

		const circles = screen.getAllByText(/^[CL]$/);
		expect(circles.length).toBe(2);
	});

	it("filters barbers by specialty when tag is selected", () => {
		render(
			<BarberStep barbers={mockBarbers} selected={null} onSelect={vi.fn()} />,
		);

		// Initially all barbers are shown
		expect(screen.getByText("Carlos")).toBeInTheDocument();
		expect(screen.getByText("Luis")).toBeInTheDocument();

		// Click on "Barba" specialty tag to filter
		fireEvent.click(screen.getByText("Barba"));

		// Only Luis should be visible (has "Barba" specialty)
		expect(screen.queryByText("Carlos")).not.toBeInTheDocument();
		expect(screen.getByText("Luis")).toBeInTheDocument();
	});
});
