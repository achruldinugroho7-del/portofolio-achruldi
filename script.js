// Kembali ke Beranda ketika halaman dimuat ulang

if ("scrollRestoration" in history) {
    history.scrollRestoration = "manual";
}

window.addEventListener("load", function () {
    window.scrollTo({
        top: 0,
        left: 0,
        behavior: "instant"
    });
});
// =====================================
// PPIC INVENTORY SIMULATION
// =====================================

// Automatic inventory calculation: the visible form is the single source of truth.
(function initializeInventorySimulation() {
    const ids = ["stokAwalInput", "barangMasukInput", "barangKeluarInput", "minimumStokInput"];
    const inputs = ids.map(id => document.getElementById(id));
    const status = document.getElementById("inventoryStatus");
    const result = document.querySelector(".inventory-result");
    if (inputs.some(input => !input) || !status || !result) return;

    const format = number => number.toLocaleString("id-ID", {maximumFractionDigits: 2});
    function updateInventory() {
        const valid = inputs.every(input => input.value.trim() !== "" &&
            Number.isFinite(Number(input.value)) && Number(input.value) >= 0);
        result.classList.remove("is-low", "is-out");
        if (!valid) {
            status.textContent = "Masukkan angka valid (≥ 0)";
            result.classList.add("is-out");
            return;
        }
        const [awal, masuk, keluar, minimum] = inputs.map(input => Number(input.value));
        const akhir = awal + masuk - keluar;
        [["displayStokAwal", awal], ["displayBarangMasuk", masuk],
         ["displayBarangKeluar", keluar], ["displayStokAkhir", akhir]].forEach(([id, value]) => {
            const element = document.getElementById(id);
            if (element) element.textContent = format(value);
        });
        if (akhir <= 0) {
            status.textContent = akhir < 0 ? "Stok Tidak Mencukupi" : "Out of Stock";
            result.classList.add("is-out");
        } else if (akhir < minimum) {
            status.textContent = "Low Stock — Reorder Required";
            result.classList.add("is-low");
        } else {
            status.textContent = "Safe Stock";
        }
    }
    inputs.forEach(input => input.addEventListener("input", updateInventory));
    updateInventory();
})();

// =====================================
// AUTOMATIC STOCK STATUS & REORDER ALERT
// =====================================

const stockTable = document.getElementById("stockTable");

if (stockTable) {

    function updateStockStatus(row) {

        const currentInput =
            row.querySelector(".current-stock");

        const minimumInput =
            row.querySelector(".minimum-stock");

        const shortageCell =
            row.querySelector(".stock-shortage");

        const statusBadge =
            row.querySelector(".stock-badge");

        const currentStock = Number(currentInput.value);
        const minimumStock = Number(minimumInput.value);

        // Validasi data
        const invalidInput =
            currentInput.value.trim() === "" ||
            minimumInput.value.trim() === "" ||
            !Number.isFinite(currentStock) ||
            !Number.isFinite(minimumStock) ||
            currentStock < 0 ||
            minimumStock < 0;

        if (invalidInput) {
            shortageCell.textContent = "—";
            shortageCell.classList.remove("has-shortage");

            statusBadge.textContent = "Invalid Input";
            statusBadge.className = "stock-badge invalid";

            return;
        }

        // Menghitung kekurangan stok
        const shortage = Math.max(
            minimumStock - currentStock,
            0
        );

        shortageCell.textContent =
            shortage.toLocaleString("id-ID");

        // Menentukan status stok
        if (currentStock < minimumStock) {

            statusBadge.textContent = "Reorder Required";
            statusBadge.className = "stock-badge warning";

            shortageCell.classList.add("has-shortage");

        } else {

            statusBadge.textContent = "Available";
            statusBadge.className = "stock-badge safe";

            shortageCell.classList.remove("has-shortage");
        }
    }

    // Mengambil seluruh baris material
    const materialRows =
        stockTable.querySelectorAll("tbody tr");

    materialRows.forEach(function (row) {

        const inputs = row.querySelectorAll(".stock-input");

        // Memeriksa stok ketika angka diubah
        inputs.forEach(function (input) {

            input.addEventListener("input", function () {
                updateStockStatus(row);
            });

        });

        // Menghitung status awal
        updateStockStatus(row);

    });

}// =====================================
// INVENTORY ANALYTICS SUMMARY
// =====================================

function updateInventorySummary() {

    const table = document.getElementById("stockTable");

    if (!table) return;

    const rows = table.querySelectorAll("tbody tr");

    let totalMaterial = rows.length;
    let safeMaterial = 0;
    let reorderMaterial = 0;
    let invalidMaterial = 0;

    rows.forEach(function (row) {

        const currentInput =
            row.querySelector(".current-stock");

        const minimumInput =
            row.querySelector(".minimum-stock");

        const currentStock = Number(currentInput.value);
        const minimumStock = Number(minimumInput.value);

        const isInvalid =
            currentInput.value.trim() === "" ||
            minimumInput.value.trim() === "" ||
            !Number.isFinite(currentStock) ||
            !Number.isFinite(minimumStock) ||
            currentStock < 0 ||
            minimumStock < 0;

        if (isInvalid) {
            invalidMaterial++;
        } else if (currentStock < minimumStock) {
            reorderMaterial++;
        } else {
            safeMaterial++;
        }

    });

    // Persentase material aman
    const validMaterial = totalMaterial - invalidMaterial;

    const healthPercentage = validMaterial > 0
        ? (safeMaterial / validMaterial) * 100
        : 0;

    const formattedHealth = Math.round(healthPercentage);

    // Memperbarui tampilan dashboard
    document.getElementById("totalMaterial").textContent =
        totalMaterial;

    document.getElementById("safeMaterial").textContent =
        safeMaterial;

    document.getElementById("reorderMaterial").textContent =
        reorderMaterial;

    document.getElementById("inventoryHealth").textContent =
        formattedHealth + "%";

    document.getElementById("healthProgressBar").style.width =
        healthPercentage + "%";

}

// Jalankan saat halaman dibuka
updateInventorySummary();

// Perbarui dashboard ketika stok berubah
const inventoryTable = document.getElementById("stockTable");

if (inventoryTable) {

    inventoryTable.addEventListener("input", function () {
        updateInventorySummary();
    });

}// =====================================
// MATERIAL REQUIREMENT PLANNING
// =====================================

const tombolMRP = document.getElementById("hitungMRP");

if (tombolMRP) {

    tombolMRP.addEventListener("click", function () {

        const targetInput =
            document.getElementById("targetProduksi");

        const materialInput =
            document.getElementById("materialPerUnit");

        const stokInput =
            document.getElementById("stokMaterial");

        const inputs = [
            targetInput,
            materialInput,
            stokInput
        ];

        // Validasi input
        const tidakValid = inputs.some(function (input) {
            return (
                input.value.trim() === "" ||
                !Number.isFinite(Number(input.value)) ||
                Number(input.value) < 0
            );
        });

        if (tidakValid) {
            alert("Masukkan angka yang valid dan tidak negatif.");
            return;
        }

        const targetProduksi = Number(targetInput.value);
        const materialPerUnit = Number(materialInput.value);
        const stokMaterial = Number(stokInput.value);

        // Perhitungan kebutuhan material
        const totalKebutuhan =
            targetProduksi * materialPerUnit;

        const kekuranganMaterial = Math.max(
            totalKebutuhan - stokMaterial,
            0
        );

        // Format angka Indonesia
        const formatAngka = angka =>
            angka.toLocaleString("id-ID", {
                maximumFractionDigits: 2
            });

        // Menampilkan hasil
        document.getElementById("totalKebutuhan").textContent =
            formatAngka(totalKebutuhan) + " Kg";

        document.getElementById("stokTersediaMRP").textContent =
            formatAngka(stokMaterial) + " Kg";

        document.getElementById("kekuranganMaterial").textContent =
            formatAngka(kekuranganMaterial) + " Kg";

        // Menentukan status material
        const statusMRP =
            document.getElementById("statusMRP");

        if (kekuranganMaterial > 0) {

            statusMRP.textContent =
                "⚠ Material Replenishment Required";

            statusMRP.classList.remove("is-sufficient");

        } else {

            statusMRP.textContent =
                "✓ Material Sufficient for Production";

            statusMRP.classList.add("is-sufficient");
        }

    });

}// =====================================
// STOCK VARIANCE ANALYSIS
// =====================================

const varianceTable = document.getElementById("varianceTable");

if (varianceTable) {

    const rows = varianceTable.querySelectorAll("tbody tr");

    function updateVarianceAnalysis() {

        let shortageCount = 0;
        let surplusCount = 0;
        let matchCount = 0;
        let invalidCount = 0;

        rows.forEach(function (row) {

            const systemInput =
                row.querySelector(".system-stock");

            const physicalInput =
                row.querySelector(".physical-stock");

            const varianceCell =
                row.querySelector(".variance-value");

            const percentCell =
                row.querySelector(".variance-percent");

            const statusBadge =
                row.querySelector(".variance-status");

            const systemStock = Number(systemInput.value);
            const physicalStock = Number(physicalInput.value);

            const invalid =
                systemInput.value.trim() === "" ||
                physicalInput.value.trim() === "" ||
                !Number.isFinite(systemStock) ||
                !Number.isFinite(physicalStock) ||
                systemStock < 0 ||
                physicalStock < 0;

            if (invalid) {
                varianceCell.textContent = "—";
                percentCell.textContent = "—";

                statusBadge.textContent = "Invalid Input";
                statusBadge.className =
                    "variance-status invalid";

                invalidCount++;
                return;
            }

            // Menghitung selisih
            const variance = physicalStock - systemStock;

            // Menghitung persentase
            const percentage = systemStock !== 0
                ? (variance / systemStock) * 100
                : null;

            // Format angka
            const formatAngka = angka =>
                angka.toLocaleString("id-ID", {
                    maximumFractionDigits: 2
                });

            varianceCell.textContent =
                (variance > 0 ? "+" : "") +
                formatAngka(variance);

            percentCell.textContent =
                percentage === null
                    ? "N/A"
                    : (percentage > 0 ? "+" : "") +
                      formatAngka(percentage) + "%";

            // Menentukan status
            if (variance < 0) {

                statusBadge.textContent = "Shortage";
                statusBadge.className =
                    "variance-status shortage";

                shortageCount++;

            } else if (variance > 0) {

                statusBadge.textContent = "Surplus";
                statusBadge.className =
                    "variance-status surplus";

                surplusCount++;

            } else {

                statusBadge.textContent = "Match";
                statusBadge.className =
                    "variance-status match";

                matchCount++;
            }

        });

        // Memperbarui KPI
        document.getElementById("varianceTotal").textContent =
            rows.length;

        document.getElementById("varianceShortage").textContent =
            shortageCount;

        document.getElementById("varianceSurplus").textContent =
            surplusCount;

        document.getElementById("varianceMatch").textContent =
            matchCount;

        // Memperbarui insight
        const insight =
            document.getElementById("varianceInsightText");

        insight.textContent =
            "Ditemukan " + shortageCount +
            " material shortage, " + surplusCount +
            " material surplus, dan " + matchCount +
            " material dengan stok sesuai." +
            (invalidCount > 0
                ? " Terdapat " + invalidCount +
                  " material dengan input tidak valid."
                : "");
    }

    // Jalankan saat halaman dibuka
    updateVarianceAnalysis();

    // Perbarui saat input berubah
    varianceTable.addEventListener("input", function () {
        updateVarianceAnalysis();
    });

}// =====================================
// PPIC PROJECT NAVIGATION - FIX
// =====================================

function initializeProjectNavigation() {

    const tabs = document.querySelectorAll(".project-tab");

    const panels = document.querySelectorAll(
        "[data-project-panel]"
    );

    if (tabs.length === 0 || panels.length === 0) {
        console.warn("Project navigation belum ditemukan.");
        return;
    }

    function showProject(projectName) {

        // Mengatur tombol aktif
        tabs.forEach(function (tab) {

            const active =
                tab.dataset.project === projectName;

            tab.classList.toggle("active", active);

            tab.setAttribute(
                "aria-pressed",
                String(active)
            );

        });

        // Mengatur dashboard yang tampil
        panels.forEach(function (panel) {

            const active =
                panel.dataset.projectPanel === projectName;

            panel.hidden = !active;

        });

    }

    // Menambahkan fungsi klik
    tabs.forEach(function (tab) {

        tab.addEventListener("click", function () {

            const projectName = tab.dataset.project;

            showProject(projectName);

        });

    });

    // Menampilkan Inventory Control saat pertama dibuka
    showProject("inventory");

}

// Jalankan setelah HTML selesai dimuat
if (document.readyState === "loading") {

    document.addEventListener(
        "DOMContentLoaded",
        initializeProjectNavigation
    );

} else {
    initializeProjectNavigation();
}

