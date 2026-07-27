import { PROGRESS_STEPS, STEP_LABELS } from "../types";
import type { Step } from "../types";

type Props = {
	currentStep: number;
};

export function ProgressIndicator({ currentStep }: Props) {
	return (
		<div className="mb-8 flex items-center justify-center gap-2 text-sm">
			{PROGRESS_STEPS.map((s: Step, i: number) => (
				<div key={s} className="flex items-center gap-2">
					<span
						className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-medium ${
							i <= currentStep
								? "bg-blue-600 text-white"
								: "bg-neutral-800 text-neutral-500"
						}`}
					>
						{i + 1}
					</span>
					<span
						className={`hidden sm:inline ${
							i <= currentStep ? "text-white" : "text-neutral-500"
						}`}
					>
						{STEP_LABELS[s]}
					</span>
					{i < PROGRESS_STEPS.length - 1 && (
						<span className="text-neutral-700">—</span>
					)}
				</div>
			))}
		</div>
	);
}
