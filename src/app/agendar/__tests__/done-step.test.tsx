// @vitest-environment happy-dom
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { DoneStep } from "../steps/done-step";
import type { BookingBarber, BookingService } from "@/types/models";
import type { BookingResult } from "../types";

const mockBarber: BookingBarber = {
	id: "b1",
	name: "Carlos",
	color: "#3B82F6",
	specialties: "Degradados",
	services: [],
};

const mockService: BookingService = {
	id: "s1",
	name: "Corte",
	duration: 30,
	price: 5000,
};

const mockResult: BookingResult = {
	id: "apt-1",
	cancelToken: "token-1",
	date: "2026-08-01",
	time: "10:00",
};

describe("DoneStep", () => {
	it("shows confirmation message", () => {
		render(
			<DoneStep
				result={mockResult}
				barber={mockBarber}
				service={mockService}
				onReset={vi.fn()}
			/>,
		);

		expect(screen.getByText("Turno confirmado")).toBeInTheDocument();
	});

	it("shows barber name and appointment time", () => {
		render(
			<DoneStep
				result={mockResult}
				barber={mockBarber}
				service={mockService}
				onReset={vi.fn()}
			/>,
		);

		expect(screen.getByText(/Carlos/)).toBeInTheDocument();
		expect(screen.getByText(/10:00hs/)).toBeInTheDocument();
	});

	it("shows reset button", () => {
		render(
			<DoneStep
				result={mockResult}
				barber={mockBarber}
				service={mockService}
				onReset={vi.fn()}
			/>,
		);

		expect(screen.getByText("Agendar otro turno")).toBeInTheDocument();
	});

	it("calls onReset when clicking reset button", () => {
		const onReset = vi.fn();
		render(
			<DoneStep
				result={mockResult}
				barber={mockBarber}
				service={mockService}
				onReset={onReset}
			/>,
		);

		fireEvent.click(screen.getByText("Agendar otro turno"));
		expect(onReset).toHaveBeenCalled();
	});

	it("shows checkmark emoji", () => {
		render(
			<DoneStep
				result={mockResult}
				barber={mockBarber}
				service={mockService}
				onReset={vi.fn()}
			/>,
		);

		expect(screen.getByText("✅")).toBeInTheDocument();
	});
});
