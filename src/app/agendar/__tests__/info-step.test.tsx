// @vitest-environment happy-dom
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { InfoStep } from "../steps/info-step";
import type { BookingBarber, BookingService } from "@/types/models";

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

describe("InfoStep", () => {
	const defaultProps = {
		barber: mockBarber,
		service: mockService,
		date: "2026-08-01",
		time: "10:00",
		name: "",
		phone: "",
		email: "",
		onFieldChange: vi.fn(),
		onBlur: vi.fn(),
		onSubmit: vi.fn(),
		onBack: vi.fn(),
		submitting: false,
		errors: {},
	};

	it("renders booking summary", () => {
		render(<InfoStep {...defaultProps} />);

		expect(screen.getByText(/Carlos/)).toBeInTheDocument();
		expect(screen.getByText(/Corte/)).toBeInTheDocument();
		expect(screen.getByText(/\$5\.000/)).toBeInTheDocument();
	});

	it("renders form fields", () => {
		render(<InfoStep {...defaultProps} />);

		expect(screen.getByLabelText("Nombre")).toBeInTheDocument();
		expect(screen.getByLabelText("Teléfono")).toBeInTheDocument();
		expect(screen.getByLabelText(/Email/)).toBeInTheDocument();
	});

	it("shows back button", () => {
		render(<InfoStep {...defaultProps} />);

		expect(screen.getByText("← Cambiar horario")).toBeInTheDocument();
	});

	it("calls onBack when clicking back button", () => {
		const onBack = vi.fn();
		render(<InfoStep {...defaultProps} onBack={onBack} />);

		fireEvent.click(screen.getByText("← Cambiar horario"));
		expect(onBack).toHaveBeenCalled();
	});

	it("calls onFieldChange when typing in name field", () => {
		const onFieldChange = vi.fn();
		render(<InfoStep {...defaultProps} onFieldChange={onFieldChange} />);

		fireEvent.change(screen.getByLabelText("Nombre"), {
			target: { value: "Juan" },
		});
		expect(onFieldChange).toHaveBeenCalledWith("clientName", "Juan");
	});

	it("calls onFieldChange when typing in phone field", () => {
		const onFieldChange = vi.fn();
		render(<InfoStep {...defaultProps} onFieldChange={onFieldChange} />);

		fireEvent.change(screen.getByLabelText("Teléfono"), {
			target: { value: "11 5555 1234" },
		});
		expect(onFieldChange).toHaveBeenCalledWith("clientPhone", "11 5555 1234");
	});

	it("calls onSubmit when submitting form", () => {
		const onSubmit = vi.fn();
		render(<InfoStep {...defaultProps} onSubmit={onSubmit} />);

		fireEvent.submit(screen.getByRole("button", { name: /Confirmar turno/ }));
		expect(onSubmit).toHaveBeenCalled();
	});

	it("shows loading state when submitting", () => {
		render(<InfoStep {...defaultProps} submitting={true} />);

		expect(screen.getByText("Reservando...")).toBeInTheDocument();
		expect(screen.getByRole("button", { name: /Reservando/ })).toBeDisabled();
	});

	it("displays field errors", () => {
		const errors = { clientName: "Nombre requerido" };
		render(<InfoStep {...defaultProps} errors={errors} />);

		expect(screen.getByText("Nombre requerido")).toBeInTheDocument();
	});
});
