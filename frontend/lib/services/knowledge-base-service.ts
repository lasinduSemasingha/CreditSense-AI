export type KnowledgeDoc = { title?: string; content: string };

export async function addBulkKnowledge(documents: KnowledgeDoc[]) {
	if (!Array.isArray(documents) || documents.length === 0) {
		throw new Error("documents array is required");
	}

	const res = await fetch("/api/kb/bulk", {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({ documents }),
	});

	if (!res.ok) {
		const message = await res.text();
		throw new Error(message || "Failed to add bulk knowledge");
	}

	return (await res.json()) as { id: string; title?: string | null; content: string }[];
}

// Parse an Excel/CSV file into knowledge documents and upload in one call.
// Expected headers: Title, Content (case-insensitive). Content is required.
export async function uploadKnowledgeFromExcel(file: File) {
	const XLSX = await import("xlsx");
	const arrayBuffer = await file.arrayBuffer();
	const workbook = XLSX.read(arrayBuffer, { type: "array" });
	const firstSheet = workbook.SheetNames[0];
	if (!firstSheet) throw new Error("No sheets found in file");

	const rows: Record<string, unknown>[] = XLSX.utils.sheet_to_json(
		workbook.Sheets[firstSheet],
		{ defval: "" }
	);

	const docs: KnowledgeDoc[] = rows
		.map((row) => {
			const title = String(row.Title ?? row.title ?? "").trim();
			const content = String(row.Content ?? row.content ?? "").trim();
			return content ? { title: title || content.slice(0, 80), content } : null;
		})
		.filter((v): v is KnowledgeDoc => Boolean(v));

	if (docs.length === 0) {
		throw new Error("No valid rows found (need Title/Content columns)");
	}

	return addBulkKnowledge(docs);
}
