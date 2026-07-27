// @vitest-environment happy-dom
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ServiceStep } from "../steps/service-step";
import type { BookingBarber, BookingService } from "@/types/models";

const mockBarber: BookingBarber = {
	id: "b1",
	name: "Carlos",
	color: "#3B82F6",
	specialties: "Degradados",
	services: [
		{ barberId: "b1", serviceId: "s1", service: { id: "s1", name: "Corte" } },
		{ barberId: "b1", serviceId: "s2", service: { id: "s2", name: "Barba" } },
	],
};

const mockServices: BookingService[] = [
	{ id: "s1", name: "Corte", duration: 30, price: 5000 },
	{ id: "s2", name: "Barba", duration: 20, price: 3000 },
];

describe("ServiceStep", () => {
	it("renders services for the barber", () => {
		render(
			<ServiceStep
				barber={mockBarber}
				services={mockServices}
				selected={null}
				onSelect={vi.fn()}
				onBack={vi.fn()}
			/>,
		);

		expect(screen.getByText("Corte")).toBeInTheDocument();
		expect(screen.getByText("Barba")).toBeInTheDocument();
	});

	it("shows back button", () => {
		render(
			<ServiceStep
				barber={mockBarber}
				services={mockServices}
				selected={null}
				onSelect={vi.fn()}
				onBack={vi.fn()}
			/>,
		);

		expect(screen.getByText("← Cambiar barbero")).toBeInTheDocument();
	});

	it("calls onBack when clicking back button", () => {
		const onBack = vi.fn();
		render(
			<ServiceStep
				barber={mockBarber}
				services={mockServices}
				selected={null}
				onSelect={vi.fn()}
				onBack={onBack}
			/>,
		);

		fireEvent.click(screen.getByText("← Cambiar barbero"));
		expect(onBack).toHaveBeenCalled();
	});

	it("calls onSelect when clicking a service", () => {
		const onSelect = vi.fn();
		render(
			<ServiceStep
				barber={mockBarber}
				services={mockServices}
				selected={null}
				onSelect={onSelect}
				onBack={vi.fn()}
			/>,
		);

		fireEvent.click(screen.getByText("Corte"));
		expect(onSelect).toHaveBeenCalledWith(mockServices[0]);
	});

	it("shows service price and duration", () => {
		render(
			<ServiceStep
				barber={mockBarber}
				services={mockServices}
				selected={null}
				onSelect={vi.fn()}
				onBack={vi.fn()}
			/>,
		);

		expect(screen.getByText("$5.000")).toBeInTheDocument();
		expect(screen.getByText("30 min")).toBeInTheDocument();
	});
});
