/**
 * Formatea un precio al estilo argentino:
 *  - Miles con punto: $10.000
 *  - Decimales con coma: $10.500,50
 *  - Sin decimales si es entero
 *
 * Accepts number, string, or Prisma Decimal (which has toString()).
 */
export function formatPrice(
	price: number | string | { toString(): string },
): string {
	const num = typeof price === "number" ? price : Number(price.toString());

	// Separar parte entera y decimal
	const [intPart, decPart] = num.toFixed(2).split(".");

	// Miles: punto cada 3 dígitos
	const withThousands = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ".");

	// Si el decimal es 00, mostrar sin decimales
	if (decPart === "00") {
		return `$${withThousands}`;
	}

	return `$${withThousands},${decPart}`;
}
