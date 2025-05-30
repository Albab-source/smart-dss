// Impor Firebase (kode Firebase tetap sama)
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import { getAuth, signInAnonymously, signInWithCustomToken, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";
import { getFirestore, doc, getDoc, setDoc, updateDoc, onSnapshot, setLogLevel } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

// Konfigurasi Firebase (kode Firebase tetap sama)
const firebaseConfig = {
  apiKey: "AIzaSyD4E2g2yqAEatYThkxeXzyoaG6kU8wwopY",
  authDomain: "dss-smart.firebaseapp.com",
  projectId: "dss-smart",
  storageBucket: "dss-smart.firebasestorage.app",
  messagingSenderId: "173392709329",
  appId: "1:173392709329:web:b531c14a0494c0c0bca7f0",
  measurementId: "G-G2KJYVRHX7"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);
const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-dss-app';
let userId = null;


const getDssDocRef = () => {
    if (!userId) { return null; }
    return doc(db, `artifacts/${appId}/users/${userId}/dssProjectData/current`);
}

// Variabel global untuk menyimpan data CSV yang sudah diparsing sementara
let parsedCsvData = { headers: [], dataRows: [] };

// State aplikasi (sama seperti sebelumnya)
let criteria = [];
let alternatives = [];
let values = {}; 
let results = [];
let calculationStepDetails = {
    normalizedValuesMatrix: {},
    weightedNormalizedValuesMatrix: {}
};


// --- Fungsi Firebase (authenticateUser, onAuthStateChanged, saveDataToFirestore, loadDataFromFirestore) ---
// --- TETAP SAMA seperti sebelumnya, pastikan sudah ada di script Anda ---
async function authenticateUser() {
    try {
        if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
            await signInWithCustomToken(auth, __initial_auth_token);
            console.log("Berhasil masuk dengan custom token.");
        } else {
            await signInAnonymously(auth);
            console.log("Berhasil masuk secara anonim.");
        }
    } catch (error) {
        console.error("Error saat otentikasi:", error);
        showModal("Error Otentikasi: " + error.message);
    }
}

onAuthStateChanged(auth, async (user) => {
    if (user) {
        userId = user.uid;
        const userIdDisplay = document.getElementById('userIdDisplay');
        if (userIdDisplay) userIdDisplay.textContent = `User ID: ${userId}`;
        await loadDataFromFirestore(); 
        const dssDocRef = getDssDocRef();
        if (dssDocRef) {
            onSnapshot(dssDocRef, (docSnap) => {
                if (docSnap.exists()) {
                    const data = docSnap.data();
                    criteria = data.criteria || [];
                    alternatives = data.alternatives || [];
                    values = data.values || {};
                    results = data.results || [];
                    calculationStepDetails = data.calculationStepDetails || { normalizedValuesMatrix: {}, weightedNormalizedValuesMatrix: {} };
                } else {
                    criteria = []; alternatives = []; values = {}; results = [];
                    calculationStepDetails = { normalizedValuesMatrix: {}, weightedNormalizedValuesMatrix: {} };
                }
                renderApp(); 
            }, (error) => {
                console.error("Error pada onSnapshot:", error);
                showModal("Gagal sinkronisasi data real-time: " + error.message);
            });
        }
    } else {
        userId = null;
        const userIdDisplay = document.getElementById('userIdDisplay');
        if (userIdDisplay) userIdDisplay.textContent = "User ID: Tidak terautentikasi";
        criteria = []; alternatives = []; values = {}; results = [];
        calculationStepDetails = { normalizedValuesMatrix: {}, weightedNormalizedValuesMatrix: {} };
        renderApp();
    }
});

async function saveDataToFirestore() {
    if (!userId) {
        showModal("Tidak dapat menyimpan data. User belum terautentikasi.");
        return;
    }
    const dssDocRef = getDssDocRef();
    if (!dssDocRef) return;
    try {
        await setDoc(dssDocRef, {
            criteria, alternatives, values, results, calculationStepDetails,
            lastUpdated: new Date().toISOString()
        });
        console.log("Data berhasil disimpan ke Firestore");
    } catch (error) {
        console.error("Error menyimpan data ke Firestore:", error);
        showModal("Gagal menyimpan data: " + error.message);
    }
}

async function loadDataFromFirestore() {
    if (!userId) { return; }
    const dssDocRef = getDssDocRef();
    if (!dssDocRef) return;
    try {
        const docSnap = await getDoc(dssDocRef);
        if (docSnap.exists()) {
            const data = docSnap.data();
            criteria = data.criteria || [];
            alternatives = data.alternatives || [];
            values = data.values || {};
            results = data.results || [];
            calculationStepDetails = data.calculationStepDetails || { normalizedValuesMatrix: {}, weightedNormalizedValuesMatrix: {} };
        } else {
            criteria = []; alternatives = []; values = {}; results = [];
            calculationStepDetails = { normalizedValuesMatrix: {}, weightedNormalizedValuesMatrix: {} };
        }
    } catch (error) {
        console.error("Error memuat data dari Firestore:", error);
        showModal("Gagal memuat data: " + error.message);
    }
    renderApp(); 
}
// --- Akhir Fungsi Firebase ---


// Fungsi CRUD Kriteria & Alternatif (Manual) - Tetap sama seperti versi dengan unit
window.addCriterion = function() {
    const nameInput = document.getElementById('criterionName');
    const typeInput = document.getElementById('criterionType');
    const weightInput = document.getElementById('criterionWeight');
    const unitInput = document.getElementById('criterionUnit'); 

    if (!nameInput || !typeInput || !weightInput || !unitInput) {
        console.error("Elemen input kriteria tidak ditemukan");
        return;
    }
    const name = nameInput.value.trim();
    const type = typeInput.value;
    const weight = parseFloat(weightInput.value);
    const unit = unitInput.value.trim(); 

    if (!name || isNaN(weight) || weight <= 0 || criteria.find(c => c.name.toLowerCase() === name.toLowerCase())) {
        showModal(!name ? "Nama kriteria tidak boleh kosong." : (isNaN(weight) || weight <=0 ? "Bobot kriteria harus angka positif." : "Nama kriteria sudah ada."));
        return;
    }
    criteria.push({ id: 'c' + Date.now(), name, type, weight, unit });
    nameInput.value = ''; weightInput.value = ''; unitInput.value = '';
    saveDataToFirestore(); 
}
window.removeCriterion = function(id) { /* ... sama seperti sebelumnya ... */ 
    criteria = criteria.filter(c => c.id !== id);
    Object.keys(values).forEach(key => { if (key.endsWith('_' + id)) delete values[key]; });
    Object.keys(calculationStepDetails.normalizedValuesMatrix).forEach(key => { if (key.endsWith('_' + id)) delete calculationStepDetails.normalizedValuesMatrix[key]; });
    Object.keys(calculationStepDetails.weightedNormalizedValuesMatrix).forEach(key => { if (key.endsWith('_' + id)) delete calculationStepDetails.weightedNormalizedValuesMatrix[key]; });
    saveDataToFirestore();
}
window.addAlternative = function() { /* ... sama seperti sebelumnya, pastikan mengembalikan objek alternatif jika perlu ... */
    const nameInput = document.getElementById('alternativeName');
    if (!nameInput) return null;
    const name = nameInput.value.trim();
    if (!name || alternatives.find(a => a.name.toLowerCase() === name.toLowerCase())) {
        showModal(!name ? "Nama alternatif tidak boleh kosong." : "Nama alternatif sudah ada.");
        return null;
    }
    const newAlternative = { id: 'a' + Date.now(), name };
    alternatives.push(newAlternative);
    nameInput.value = '';
    saveDataToFirestore();
    return newAlternative;
 }
window.removeAlternative = function(id) { /* ... sama seperti sebelumnya ... */
    alternatives = alternatives.filter(a => a.id !== id);
    Object.keys(values).forEach(key => { if (key.startsWith(id + '_')) delete values[key]; });
    Object.keys(calculationStepDetails.normalizedValuesMatrix).forEach(key => { if (key.startsWith(id + '_')) delete calculationStepDetails.normalizedValuesMatrix[key]; });
    Object.keys(calculationStepDetails.weightedNormalizedValuesMatrix).forEach(key => { if (key.startsWith(id + '_')) delete calculationStepDetails.weightedNormalizedValuesMatrix[key]; });
    saveDataToFirestore();
}
window.updateValue = function(altId, critId, event) { /* ... sama seperti sebelumnya ... */
    const value = parseFloat(event.target.value);
    if (!isNaN(value)) values[`${altId}_${critId}`] = value;
    else delete values[`${altId}_${critId}`]; 
    saveDataToFirestore(); 
}

// --- Fungsi render tabel (Criteria, Alternatives, Values, Results, Details) ---
// --- Sebagian besar sama, pastikan render unit di header jika ada ---
function renderCriteriaTable() { /* ... sama seperti versi dengan unit ... */
    const tbody = document.getElementById('criteriaTableBody');
    if (!tbody) return;
    tbody.innerHTML = '';
    criteria.forEach(c => {
        const tr = document.createElement('tr');
        tr.className = 'border-b border-gray-200 hover:bg-gray-50';
        tr.innerHTML = `
            <td class="py-3 px-4 text-gray-700">${c.name}</td>
            <td class="py-3 px-4 text-gray-700">${c.type === 'benefit' ? 'Benefit' : 'Cost'}</td>
            <td class="py-3 px-4 text-gray-700">${c.weight}</td>
            <td class="py-3 px-4 text-gray-700">${c.unit || '-'}</td>
            <td class="py-3 px-4">
                <button onclick="removeCriterion('${c.id}')" class="bg-red-500 hover:bg-red-600 text-white text-xs font-medium py-1 px-2 rounded-md transition duration-150">Hapus</button>
            </td>
        `;
        tbody.appendChild(tr);
    });
 }
function renderAlternativesTable() { /* ... sama seperti sebelumnya ... */
    const tbody = document.getElementById('alternativesTableBody');
    if (!tbody) return;
    tbody.innerHTML = '';
    alternatives.forEach(a => {
        const tr = document.createElement('tr');
        tr.className = 'border-b border-gray-200 hover:bg-gray-50';
        tr.innerHTML = `
            <td class="py-3 px-4 text-gray-700">${a.name}</td>
            <td class="py-3 px-4">
                <button onclick="removeAlternative('${a.id}')" class="bg-red-500 hover:bg-red-600 text-white text-xs font-medium py-1 px-2 rounded-md transition duration-150">Hapus</button>
            </td>
        `;
        tbody.appendChild(tr);
    });
 }
function renderValuesTable() { /* ... sama seperti versi dengan unit ... */
    const table = document.getElementById('valuesTable');
    const sectionTitle = document.getElementById('valuesSectionTitle');
    if (!table || !sectionTitle) return;
    const thead = table.querySelector('thead');
    const tbody = table.querySelector('tbody');
    if(!thead || !tbody) return;
    thead.innerHTML = ''; tbody.innerHTML = '';
    if (criteria.length === 0 || alternatives.length === 0) {
        table.classList.add('hidden'); sectionTitle.classList.add('hidden'); return;
    }
    table.classList.remove('hidden'); sectionTitle.classList.remove('hidden');
    let headerRowHtml = '<th class="py-3 px-4 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider rounded-tl-lg">Alternatif / Kriteria</th>';
    criteria.forEach(c => {
        const unitDisplay = c.unit ? ` (${c.unit})` : '';
        headerRowHtml += `<th class="py-3 px-4 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">${c.name}${unitDisplay} (${c.type === 'benefit' ? 'B' : 'C'})</th>`;
    });
    headerRowHtml += '<th class="py-3 px-4 bg-gray-100 rounded-tr-lg"></th>';
    thead.innerHTML = `<tr>${headerRowHtml}</tr>`;
    alternatives.forEach(a => {
        let rowHtml = `<td class="py-3 px-4 border-b border-gray-200 text-gray-700 font-medium">${a.name}</td>`;
        criteria.forEach(c => {
            const valueKey = `${a.id}_${c.id}`;
            const currentValue = values[valueKey] !== undefined ? values[valueKey] : '';
            rowHtml += `<td class="py-3 px-4 border-b border-gray-200"><input type="number" step="any" value="${currentValue}" onchange="updateValue('${a.id}', '${c.id}', event)" class="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-sm"></td>`;
        });
        rowHtml += '<td class="py-3 px-4 border-b border-gray-200"></td>';
        tbody.innerHTML += `<tr class="hover:bg-gray-50">${rowHtml}</tr>`;
    });
 }
function renderNormalizedValuesTable() { /* ... sama seperti versi dengan unit di header ... */
    const container = document.getElementById('normalizedValuesTableContainer');
    if (!container || !calculationStepDetails.normalizedValuesMatrix) return;
    if (Object.keys(calculationStepDetails.normalizedValuesMatrix).length === 0 || criteria.length === 0 || alternatives.length === 0) {
        container.innerHTML = '<p class="text-sm text-gray-500">Data normalisasi tidak tersedia.</p>'; return;
    }
    let tableHtml = '<table><thead><tr><th>Alternatif / Kriteria</th>';
    criteria.forEach(c => {
        const unitDisplay = c.unit ? ` (${c.unit})` : '';
        tableHtml += `<th>${c.name}${unitDisplay}</th>`;
    });
    tableHtml += '</tr></thead><tbody>';
    alternatives.forEach(a => {
        tableHtml += `<tr><td>${a.name}</td>`;
        criteria.forEach(c => {
            const key = `${a.id}_${c.id}`;
            const val = calculationStepDetails.normalizedValuesMatrix[key];
            tableHtml += `<td>${val !== undefined ? val.toFixed(4) : '-'}</td>`;
        });
        tableHtml += '</tr>';
    });
    tableHtml += '</tbody></table>'; container.innerHTML = tableHtml;
 }
function renderWeightedNormalizedValuesTable() { /* ... sama seperti versi dengan unit di header ... */
    const container = document.getElementById('weightedNormalizedValuesTableContainer');
    if (!container || !calculationStepDetails.weightedNormalizedValuesMatrix) return;
    if (Object.keys(calculationStepDetails.weightedNormalizedValuesMatrix).length === 0 || criteria.length === 0 || alternatives.length === 0) {
        container.innerHTML = '<p class="text-sm text-gray-500">Data normalisasi terbobot tidak tersedia.</p>'; return;
    }
    let tableHtml = '<table><thead><tr><th>Alternatif / Kriteria</th>';
    criteria.forEach(c => {
        const unitDisplay = c.unit ? ` (${c.unit})` : '';
        const weightDisplay = c.normalizedWeight ? ` (Bobot: ${(c.normalizedWeight * 100).toFixed(1)}%)` : '';
        tableHtml += `<th>${c.name}${unitDisplay}${weightDisplay}</th>`;
    });
    tableHtml += '</tr></thead><tbody>';
    alternatives.forEach(a => {
        tableHtml += `<tr><td>${a.name}</td>`;
        criteria.forEach(c => {
            const key = `${a.id}_${c.id}`;
            const val = calculationStepDetails.weightedNormalizedValuesMatrix[key];
            tableHtml += `<td>${val !== undefined ? val.toFixed(4) : '-'}</td>`;
        });
        tableHtml += '</tr>';
    });
    tableHtml += '</tbody></table>'; container.innerHTML = tableHtml;
}
function renderResultsTable() { /* ... sama seperti sebelumnya ... */
    const container = document.getElementById('resultsContainer');
    const table = document.getElementById('resultsTable');
    if (!container || !table) return;
    const tbody = table.querySelector('tbody');
    if (!tbody) return; tbody.innerHTML = '';
    if (results.length === 0) { container.classList.add('hidden'); return; }
    container.classList.remove('hidden');
    results.forEach(r => {
        const tr = document.createElement('tr');
        tr.className = 'border-b border-gray-200 hover:bg-gray-50';
        tr.innerHTML = `<td class="py-3 px-4 text-gray-700">${r.rank}</td><td class="py-3 px-4 text-gray-700 font-medium">${r.alternativeName}</td><td class="py-3 px-4 text-gray-700">${r.score.toFixed(4)}</td>`;
        tbody.appendChild(tr);
    });
}

function renderApp() { // Sama seperti sebelumnya
    renderCriteriaTable();
    renderAlternativesTable();
    renderValuesTable();
    renderResultsTable();
    const showDetailsCheckbox = document.getElementById('showCalculationDetails');
    const detailsContainer = document.getElementById('calculationDetailsContainer');
    if (showDetailsCheckbox && detailsContainer) {
        if (showDetailsCheckbox.checked && (Object.keys(calculationStepDetails.normalizedValuesMatrix).length > 0 || Object.keys(calculationStepDetails.weightedNormalizedValuesMatrix).length > 0)) {
            renderNormalizedValuesTable();
            renderWeightedNormalizedValuesTable();
            detailsContainer.classList.remove('hidden');
        } else {
            detailsContainer.classList.add('hidden');
        }
    }
}
// --- Akhir fungsi render ---

// --- Fungsi calculateSMART, showModal, closeModal TETAP SAMA ---
window.calculateSMART = function() { /* ... sama seperti sebelumnya ... */
    if (criteria.length === 0 || alternatives.length === 0) {
        showModal("Tambahkan kriteria dan alternatif terlebih dahulu.");
        calculationStepDetails.normalizedValuesMatrix = {}; calculationStepDetails.weightedNormalizedValuesMatrix = {}; results = [];
        renderApp(); saveDataToFirestore(); return;
    }
    const totalWeight = criteria.reduce((sum, c) => sum + c.weight, 0);
    if (Math.abs(totalWeight - 100) > 0.001) {
        if (totalWeight <= 0) {
            showModal("Total bobot kriteria harus lebih dari 0.");
            calculationStepDetails.normalizedValuesMatrix = {}; calculationStepDetails.weightedNormalizedValuesMatrix = {}; results = [];
            renderApp(); saveDataToFirestore(); return;
        }
        criteria.forEach(c => { c.normalizedWeight = (c.weight / totalWeight); });
        showModal(`Total bobot kriteria adalah ${totalWeight.toFixed(2)}%. Bobot telah dinormalisasi agar totalnya 1 (atau 100%).`);
    } else {
         criteria.forEach(c => { c.normalizedWeight = c.weight / 100; });
    }
    const currentNormalizedValues = {}; const currentWeightedNormalizedValues = {};
    try {
        criteria.forEach(c => {
            const critValues = alternatives.map(a => values[`${a.id}_${c.id}`]).filter(v => v !== undefined && !isNaN(v));
            if (critValues.length === 0 && alternatives.length > 0) {
                 showModal(`Tidak ada nilai valid untuk kriteria "${c.name}". Perhitungan tidak dapat dilanjutkan.`);
                 results = []; calculationStepDetails.normalizedValuesMatrix = {}; calculationStepDetails.weightedNormalizedValuesMatrix = {};
                 saveDataToFirestore(); renderApp(); throw new Error(`Tidak ada nilai valid untuk kriteria "${c.name}"`);
            }
            if (critValues.length === 0 && alternatives.length === 0) { return; }
            const minVal = Math.min(...critValues); const maxVal = Math.max(...critValues);
            alternatives.forEach(a => {
                const val = values[`${a.id}_${c.id}`]; let normalizedVal;
                if (val === undefined || isNaN(val)) { normalizedVal = 0; } 
                else {
                    if (c.type === 'benefit') normalizedVal = (maxVal - minVal === 0) ? (maxVal === 0 ? 0 : 1) : (val - minVal) / (maxVal - minVal);
                    else normalizedVal = (maxVal - minVal === 0) ? (maxVal === 0 ? 0 : 1) : (maxVal - val) / (maxVal - minVal);
                }
                currentNormalizedValues[`${a.id}_${c.id}`] = normalizedVal;
                currentWeightedNormalizedValues[`${a.id}_${c.id}`] = normalizedVal * c.normalizedWeight;
            });
        });
    } catch (error) { console.error("Error saat normalisasi nilai:", error.message); return; }
    calculationStepDetails.normalizedValuesMatrix = currentNormalizedValues;
    calculationStepDetails.weightedNormalizedValuesMatrix = currentWeightedNormalizedValues;
    results = alternatives.map(a => {
        let score = 0;
        criteria.forEach(c => {
            const weightedVal = currentWeightedNormalizedValues[`${a.id}_${c.id}`];
            if (weightedVal !== undefined) score += weightedVal;
        });
        return { alternativeId: a.id, alternativeName: a.name, score };
    });
    results.sort((a, b) => b.score - a.score);
    results.forEach((r, index) => r.rank = index + 1);
    saveDataToFirestore(); renderApp(); 
    showModal("Perhitungan SMART selesai. Hasil telah diperbarui.");
}
function showModal(message) { /* ... sama seperti sebelumnya ... */
    const modal = document.getElementById('infoModal');
    const modalMessage = document.getElementById('modalMessage');
    if (modal && modalMessage) { modalMessage.textContent = message; modal.classList.remove('hidden'); } 
    else { alert(message); }
}
window.closeModal = function() { /* ... sama seperti sebelumnya ... */
    const modal = document.getElementById('infoModal'); if (modal) modal.classList.add('hidden');
}
// --- Akhir fungsi calculateSMART, showModal, closeModal ---


// Fungsi BARU untuk menangani upload dan menampilkan antarmuka pemetaan CSV
function handleCSVFileSelect(event) {
    const file = event.target.files[0];
    if (!file) {
        showModal("Tidak ada file yang dipilih.");
        return;
    }
    const reader = new FileReader();
    reader.onload = function(e) {
        const csvText = e.target.result;
        try {
            parsedCsvData = parseCSV(csvText); // Simpan ke variabel global sementara
            if (parsedCsvData.headers.length === 0) {
                showModal("CSV tidak memiliki header atau kosong.");
                parsedCsvData = { headers: [], dataRows: [] }; // Reset
                document.getElementById('csvFileInputConfig').value = ''; // Reset input file
                return;
            }
            displayCSVMГУMappingInterface();
        } catch (error) {
            console.error("Error parsing CSV:", error);
            showModal("Gagal memparsing CSV: " + error.message);
            parsedCsvData = { headers: [], dataRows: [] }; // Reset
            document.getElementById('csvFileInputConfig').value = ''; // Reset input file
        }
    };
    reader.onerror = function() {
        showModal("Gagal membaca file.");
        console.error("FileReader error:", reader.error);
        parsedCsvData = { headers: [], dataRows: [] }; // Reset
        document.getElementById('csvFileInputConfig').value = ''; // Reset input file
    };
    reader.readAsText(file);
}

// Fungsi BARU untuk menampilkan antarmuka pemetaan CSV
function displayCSVMГУMappingInterface() {
    const mappingInterface = document.getElementById('csvMappingInterface');
    const previewContainer = document.getElementById('csvPreviewContainer');
    const previewTableBody = previewContainer.querySelector('#csvPreviewTable tbody');
    const previewTableHeader = previewContainer.querySelector('#csvPreviewTable thead');
    const altColSelect = document.getElementById('alternativeColumnSelect');
    const critMapContainer = document.getElementById('csvMappingCriteriaTable').querySelector('tbody');

    if (!mappingInterface || !previewTableBody || !previewTableHeader || !altColSelect || !critMapContainer) {
        console.error("Elemen UI untuk pemetaan CSV tidak ditemukan.");
        return;
    }

    // 1. Tampilkan Pratinjau CSV
    previewTableHeader.innerHTML = '';
    previewTableBody.innerHTML = '';
    let headerHtml = '<tr>';
    parsedCsvData.headers.forEach(header => headerHtml += `<th>${header}</th>`);
    headerHtml += '</tr>';
    previewTableHeader.innerHTML = headerHtml;

    const previewRows = parsedCsvData.dataRows.slice(0, 5); // Tampilkan 5 baris pertama
    previewRows.forEach(row => {
        let rowHtml = '<tr>';
        parsedCsvData.headers.forEach(header => {
            rowHtml += `<td>${row[header] !== undefined ? row[header] : ''}</td>`;
        });
        rowHtml += '</tr>';
        previewTableBody.innerHTML += rowHtml;
    });

    // 2. Isi Pilihan Kolom Alternatif
    altColSelect.innerHTML = '';
    parsedCsvData.headers.forEach(header => {
        const option = document.createElement('option');
        option.value = header;
        option.textContent = header;
        altColSelect.appendChild(option);
    });

    // 3. Buat Baris untuk Pemetaan Kriteria
    critMapContainer.innerHTML = '';
    parsedCsvData.headers.forEach((header, index) => {
        const tr = document.createElement('tr');
        tr.className = 'criteria-row border-b';
        tr.dataset.csvHeader = header; // Simpan nama header asli

        tr.innerHTML = `
            <td class="text-center"><input type="checkbox" class="csv-criterion-use" data-header-index="${index}"></td>
            <td>${header}</td>
            <td><input type="text" class="csv-criterion-name" value="${header}" placeholder="Nama Kriteria"></td>
            <td>
                <select class="csv-criterion-type">
                    <option value="benefit">Benefit</option>
                    <option value="cost">Cost</option>
                </select>
            </td>
            <td><input type="number" class="csv-criterion-weight" placeholder="0-100"></td>
            <td><input type="text" class="csv-criterion-unit" placeholder="cth: Rp, Kg"></td>
        `;
        critMapContainer.appendChild(tr);
    });

    mappingInterface.classList.remove('hidden');
}

// Fungsi BARU untuk membatalkan impor CSV
window.cancelCSVImport = function() {
    document.getElementById('csvMappingInterface').classList.add('hidden');
    document.getElementById('csvFileInputConfig').value = ''; // Reset input file
    parsedCsvData = { headers: [], dataRows: [] }; // Kosongkan data parse
}

// Fungsi BARU untuk memproses data CSV yang sudah dipetakan
window.processMappedCSV = function() {
    const altColumnName = document.getElementById('alternativeColumnSelect').value;
    const criteriaMappingRows = document.getElementById('csvMappingCriteriaTable').querySelectorAll('tbody tr.criteria-row');
    
    const newCriteria = [];
    const newAlternatives = [];
    const newValues = {};

    // Kumpulkan kriteria yang dipilih dan dikonfigurasi
    criteriaMappingRows.forEach(row => {
        const useCheckbox = row.querySelector('.csv-criterion-use');
        if (useCheckbox.checked) {
            const originalHeader = row.dataset.csvHeader;
            const name = row.querySelector('.csv-criterion-name').value.trim();
            const type = row.querySelector('.csv-criterion-type').value;
            const weight = parseFloat(row.querySelector('.csv-criterion-weight').value);
            const unit = row.querySelector('.csv-criterion-unit').value.trim();

            if (!name) {
                showModal(`Nama kriteria untuk header "${originalHeader}" tidak boleh kosong.`);
                throw new Error("Nama kriteria kosong"); // Hentikan proses
            }
            if (isNaN(weight) || weight < 0) {
                showModal(`Bobot untuk kriteria "${name}" tidak valid.`);
                throw new Error("Bobot tidak valid");
            }
            if (newCriteria.find(c => c.name.toLowerCase() === name.toLowerCase())) {
                 showModal(`Nama kriteria "${name}" duplikat. Harap gunakan nama unik.`);
                 throw new Error("Nama kriteria duplikat");
            }

            newCriteria.push({ 
                id: 'c' + Date.now() + Math.random().toString(36).substring(2, 7), // ID unik
                originalHeader: originalHeader, // Simpan header asli untuk mengambil nilai
                name, type, weight, unit 
            });
        }
    });

    if (newCriteria.length === 0) {
        showModal("Tidak ada kriteria yang dipilih untuk diproses dari CSV.");
        return;
    }
    
    // Validasi total bobot jika perlu (misalnya, harus 100%)
    const totalConfiguredWeight = newCriteria.reduce((sum, c) => sum + c.weight, 0);
    if (Math.abs(totalConfiguredWeight - 100) > 0.001 && newCriteria.some(c => c.weight > 0)) { // Cek jika ada bobot > 0
        // Beri peringatan, atau normalisasi otomatis jika diinginkan
        showModal(`Total bobot kriteria yang dikonfigurasi adalah ${totalConfiguredWeight.toFixed(2)}%. Disarankan total bobot adalah 100%.`);
        // Jika ingin menghentikan, throw error di sini.
    }


    // Proses baris data untuk alternatif dan nilai
    const altNameMap = new Map(); // Untuk melacak ID alternatif berdasarkan nama

    parsedCsvData.dataRows.forEach(dataRow => {
        const altName = dataRow[altColumnName];
        if (!altName || altName.trim() === '') {
            console.warn("Baris CSV tanpa nama alternatif dilewati:", dataRow);
            return; // Lewati baris jika nama alternatif kosong
        }

        let currentAlternativeId;
        if (altNameMap.has(altName.toLowerCase())) {
            currentAlternativeId = altNameMap.get(altName.toLowerCase());
        } else {
            currentAlternativeId = 'a' + Date.now() + Math.random().toString(36).substring(2, 7);
            newAlternatives.push({ id: currentAlternativeId, name: altName });
            altNameMap.set(altName.toLowerCase(), currentAlternativeId);
        }
        
        newCriteria.forEach(crit => {
            const rawValue = dataRow[crit.originalHeader]; // Ambil nilai dari kolom header CSV asli
            const valueNum = parseFloat(rawValue);
            if (!isNaN(valueNum)) {
                newValues[`${currentAlternativeId}_${crit.id}`] = valueNum;
            } else {
                // Bisa juga mengisi dengan 0 atau null, atau menampilkan peringatan
                console.warn(`Nilai tidak valid atau kosong ("${rawValue}") untuk Alternatif: ${altName}, Kriteria: ${crit.name} (dari ${crit.originalHeader}). Tidak diimpor.`);
            }
        });
    });

    if (newAlternatives.length === 0) {
        showModal("Tidak ada data alternatif yang valid ditemukan di CSV untuk kolom yang dipilih.");
        return;
    }

    // GANTI data lama dengan data baru dari CSV
    criteria = newCriteria.map(({originalHeader, ...rest}) => rest); // Hapus originalHeader dari objek kriteria final
    alternatives = newAlternatives;
    values = newValues;
    results = []; // Reset hasil perhitungan sebelumnya
    calculationStepDetails = { normalizedValuesMatrix: {}, weightedNormalizedValuesMatrix: {} }; // Reset detail

    saveDataToFirestore();
    renderApp();
    cancelCSVImport(); // Sembunyikan antarmuka pemetaan & reset input file
    showModal("Data dari CSV berhasil diproses dan dimuat menggantikan data lama.");
}


// Fungsi parseCSV (Sama seperti sebelumnya atau bisa ditingkatkan)
function parseCSV(csvText) {
    const lines = csvText.trim().replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n');
    if (lines.length === 0) return { headers: [], dataRows: [] };
    if (lines[0].charCodeAt(0) === 0xFEFF) lines[0] = lines[0].substring(1); // Handle BOM
    
    const headers = lines[0].split(',').map(h => h.trim());
    const dataRows = [];
    for (let i = 1; i < lines.length; i++) {
        if (lines[i].trim() === '') continue;
        // Parser sederhana, bisa lebih robust jika ada koma dalam field ber-quote
        const values = lines[i].split(',').map(v => v.trim());
        if (values.length === headers.length) { // Pastikan jumlah kolom sesuai header
            const row = {};
            for (let j = 0; j < headers.length; j++) {
                if (headers[j]) row[headers[j]] = values[j];
            }
            if (Object.keys(row).length > 0) dataRows.push(row);
        } else {
            console.warn(`Baris ${i+1} memiliki jumlah kolom berbeda dengan header, dilewati: ${lines[i]}`);
        }
    }
    return { headers, dataRows };
}


// Inisialisasi aplikasi saat DOM siap
document.addEventListener('DOMContentLoaded', async () => {
    const userIdDisplay = document.getElementById('userIdDisplay');
    // ... (sisa inisialisasi UI) ...
    
    const showDetailsCheckbox = document.getElementById('showCalculationDetails');
    if (showDetailsCheckbox) {
        showDetailsCheckbox.addEventListener('change', renderApp); 
    }

    // Event listener untuk input file CSV baru
    const csvFileInputConfig = document.getElementById('csvFileInputConfig');
    if (csvFileInputConfig) {
        csvFileInputConfig.addEventListener('change', handleCSVFileSelect);
    }

    await authenticateUser(); 
});