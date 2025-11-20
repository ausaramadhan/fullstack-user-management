export function downloadCSV(filename: string, data: any[]) {
    if (data.length === 0) {
        alert("Tidak ada data untuk diexport!");
        return;
    }

    const csvRows = [];

    // Header
    const headers = Object.keys(data[0]);
    csvRows.push(headers.join(","));

    // Isi data
    for (const row of data) {
        const values = headers.map(h => `"${row[h]}"`);
        csvRows.push(values.join(","));
    }

    const csvContent = csvRows.join("\n");
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();

    window.URL.revokeObjectURL(url);
}
