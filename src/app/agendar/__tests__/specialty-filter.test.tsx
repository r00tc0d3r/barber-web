// @vitest-environment happy-dom
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { SpecialtyFilter } from "../components/specialty-filter";
import type { BookingBarber } from "@/types/models";

const mockBarbers: BookingBarber[] = [
	{
		id: "b1",
		name: "Carlos",
		color: "#3B82F6",
		specialties: "Degradados, Clásicos",
		services: [
			{
				barberId: "b1",
				serviceId: "s1",
				service: { id: "s1", name: "Corte" },
			},
		],
	},
	{
		id: "b2",
		name: "Luis",
		color: "#10B981",
		specialties: "Barba, Degradados",
		services: [
			{
				barberId: "b2",
				serviceId: "s2",
				service: { id: "s2", name: "Barba" },
			},
		],
	},
];

// Mock barbers with specialties
const barbersWithSpecialties: BookingBarber[] = [
	{ ...mockBarbers[0], specialties: "Degradados, Clásicos" },
	{ ...mockBarbers[1], specialties: "Barba, Degradados" },
];

describe("SpecialtyFilter", () => {
	it("renders unique specialties as tags", () => {
		render(
			<SpecialtyFilter
				barbers={barbersWithSpecialties}
				selected={[]}
				onToggle={vi.fn()}
			/>,
		);

		expect(screen.getByText("Degradados")).toBeInTheDocument();
		expect(screen.getByText("Clásicos")).toBeInTheDocument();
		expect(screen.getByText("Barba")).toBeInTheDocument();
	});

	it("calls onToggle when clicking a tag", () => {
		const onToggle = vi.fn();
		render(
			<SpecialtyFilter
				barbers={barbersWithSpecialties}
				selected={[]}
				onToggle={onToggle}
			/>,
		);

		fireEvent.click(screen.getByText("Degradados"));
		expect(onToggle).toHaveBeenCalledWith("Degradados");
	});

	it("highlights selected tags", () => {
		render(
			<SpecialtyFilter
				barbers={barbersWithSpecialties}
				selected={["Degradados"]}
				onToggle={vi.fn()}
			/>,
		);

		const tag = screen.getByText("Degradados");
		expect(tag).toHaveClass("bg-blue-600");
	});

	it("shows unselected tags with neutral style", () => {
		render(
			<SpecialtyFilter
				barbers={barbersWithSpecialties}
				selected={[]}
				onToggle={vi.fn()}
			/>,
		);

		const tag = screen.getByText("Clásicos");
		expect(tag).toHaveClass("bg-neutral-800");
	});

	it("renders nothing when no barbers have specialties", () => {
		const barbersWithoutSpecialties: BookingBarber[] = [
			{ ...mockBarbers[0], specialties: null },
			{ ...mockBarbers[1], specialties: null },
		];
		const { container } = render(
			<SpecialtyFilter
				barbers={barbersWithoutSpecialties}
				selected={[]}
				onToggle={vi.fn()}
			/>,
		);

		expect(container.firstChild).toBeNull();
	});
});
