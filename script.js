// Data operator
const operators = [
    { id: 1, name: "Operator 1", type: "Pendaftaran", status: "available", currentQueue: null },
    { id: 2, name: "Operator 2", type: "Verifikasi Berkas", status: "available", currentQueue: null },
    { id: 3, name: "Operator 3", type: "Tes Akademik", status: "available", currentQueue: null },
    { id: 4, name: "Operator 4", type: "Wawancara", status: "available", currentQueue: null },
    { id: 5, name: "Operator 5", type: "Tes Kesehatan", status: "busy", currentQueue: "098" },
    { id: 6, name: "Operator 6", type: "Administrasi", status: "available", currentQueue: null },
    { id: 7, name: "Operator 7", type: "Pembayaran", status: "available", currentQueue: null },
    { id: 8, name: "Operator 8", type: "Informasi", status: "available", currentQueue: null }
];

// Data history panggilan
let callHistory = [];
let totalCalls = 0;
let currentCall = { queue: "101", operator: "Operator 1 - Pendaftaran" };

// Inisialisasi speech synthesis
let speech = window.speechSynthesis;
let voices = [];
let selectedVoice = null;

// DOM Elements
const queueNumberInput = document.getElementById('queueNumber');
const operatorSelect = document.getElementById('operatorSelect');
const callBtn = document.getElementById('callBtn');
const repeatBtn = document.getElementById('repeatBtn');
const decreaseBtn = document.getElementById('decreaseBtn');
const increaseBtn = document.getElementById('increaseBtn');
const currentQueueDisplay = document.getElementById('currentQueue');
const currentOperatorDisplay = document.getElementById('currentOperator');
const historyList = document.getElementById('historyList');
const operatorGrid = document.getElementById('operatorGrid');
const volumeSlider = document.getElementById('volumeSlider');
const volumeValue = document.getElementById('volumeValue');
const testVoiceBtn = document.getElementById('testVoiceBtn');
const timeDisplay = document.getElementById('time');
const totalCallsDisplay = document.getElementById('totalCalls');

// Inisialisasi sistem suara
function initSpeechSynthesis() {
    // Tunggu sampai voices tersedia
    speech.onvoiceschanged = () => {
        voices = speech.getVoices();
        
        // Cari voice wanita (bahasa Indonesia atau Inggris)
        selectedVoice = voices.find(voice => 
            voice.name.includes('Female') || 
            voice.lang.startsWith('id') || 
            voice.lang.startsWith('en')
        ) || voices[0];
        
        console.log('Voice yang digunakan:', selectedVoice?.name);
    };
}

// Fungsi untuk berbicara
function speak(text) {
    if (speech.speaking) {
        speech.cancel();
    }
    
    const utterance = new SpeechSynthesisUtterance(text);
    
    // Set voice jika tersedia
    if (selectedVoice) {
        utterance.voice = selectedVoice;
    }
    
    // Set properties
    utterance.volume = parseFloat(volumeSlider.value);
    utterance.rate = 0.9; // Sedikit lebih lambat untuk kejelasan
    utterance.pitch = 1.2; // Lebih tinggi untuk suara wanita
    
    speech.speak(utterance);
}

// Format nomor antrian untuk diucapkan
function formatNumberForSpeech(number) {
    return number.split('').join(' ');
}

// Panggil antrian
function callQueue() {
    const queueNumber = queueNumberInput.value;
    const operatorId = operatorSelect.value;
    const operator = operators.find(op => op.id == operatorId);
    
    if (!queueNumber || !operator) return;
    
    // Update display
    currentQueueDisplay.textContent = queueNumber;
    currentOperatorDisplay.textContent = `${operator.name} - ${operator.type}`;
    
    // Update operator status
    updateOperatorStatus(operatorId, 'busy', queueNumber);
    
    // Buat teks untuk diucapkan
    const callText = `Nomor antrian ${formatNumberForSpeech(queueNumber)}. Silakan menuju ${operator.name}, untuk ${operator.type.toLowerCase()}.`;
    
    // Ucapkan panggilan
    speak(callText);
    
    // Simpan data panggilan
    currentCall = { 
        queue: queueNumber, 
        operator: `${operator.name} - ${operator.type}` 
    };
    
    // Tambahkan ke history
    addToHistory(queueNumber, operator.name, operator.type);
    
    // Increment total calls
    totalCalls++;
    totalCallsDisplay.textContent = totalCalls;
    
    // Auto increment queue number
    queueNumberInput.value = String(parseInt(queueNumber) + 1).padStart(3, '0');
    
    // Simpan ke localStorage
    saveToLocalStorage();
}

// Ulangi panggilan terakhir
function repeatCall() {
    if (!currentCall.queue) return;
    
    const callText = `Nomor antrian ${formatNumberForSpeech(currentCall.queue)}. Silakan menuju ${currentCall.operator.split(' - ')[0]}, untuk ${currentCall.operator.split(' - ')[1].toLowerCase()}.`;
    speak(callText);
    
    // Tambahkan ke history sebagai pengulangan
    addToHistory(currentCall.queue, 
                currentCall.operator.split(' - ')[0], 
                currentCall.operator.split(' - ')[1], 
                true);
}

// Tambahkan panggilan ke history
function addToHistory(queueNumber, operatorName, operatorType, isRepeat = false) {
    const now = new Date();
    const timeString = now.toLocaleTimeString('id-ID', { 
        hour: '2-digit', 
        minute: '2-digit' 
    });
    
    const historyItem = {
        id: Date.now(),
        queue: queueNumber,
        operator: `${operatorName} - ${operatorType}`,
        time: timeString,
        isRepeat: isRepeat
    };
    
    callHistory.unshift(historyItem);
    
    // Batasi history maksimal 10 item
    if (callHistory.length > 10) {
        callHistory = callHistory.slice(0, 10);
    }
    
    updateHistoryDisplay();
}

// Update tampilan history
function updateHistoryDisplay() {
    historyList.innerHTML = '';
    
    callHistory.forEach(item => {
        const historyItem = document.createElement('div');
        historyItem.className = 'history-item';
        
        historyItem.innerHTML = `
            <div>
                <span class="history-queue">Antrian ${item.queue}</span>
                <span class="history-operator"> → ${item.operator}</span>
                ${item.isRepeat ? '<span style="color: #f39c12; margin-left: 5px;">(diulang)</span>' : ''}
            </div>
            <div class="history-time">${item.time}</div>
        `;
        
        historyList.appendChild(historyItem);
    });
}

// Update status operator
function updateOperatorStatus(operatorId, status, queueNumber = null) {
    const operator = operators.find(op => op.id == operatorId);
    if (operator) {
        operator.status = status;
        operator.currentQueue = queueNumber;
        updateOperatorGrid();
    }
}

// Update tampilan grid operator
function updateOperatorGrid() {
    operatorGrid.innerHTML = '';
    
    operators.forEach(operator => {
        const operatorCard = document.createElement('div');
        operatorCard.className = `operator-card ${operator.status}`;
        
        operatorCard.innerHTML = `
            <div class="operator-info">
                <span class="operator-name">${operator.name}</span>
                <span class="operator-status-badge status-${operator.status}">
                    ${operator.status === 'available' ? 'Tersedia' : 'Sedang Melayani'}
                </span>
            </div>
            <div class="current-number">
                ${operator.type}
                ${operator.currentQueue ? `<br>Antrian: ${operator.currentQueue}` : ''}
            </div>
        `;
        
        operatorGrid.appendChild(operatorCard);
    });
}

// Update waktu real-time
function updateTime() {
    const now = new Date();
    const timeString = now.toLocaleTimeString('id-ID', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
    });
    timeDisplay.textContent = timeString;
}

// Test suara
function testVoice() {
    const testText = "Sistem antrian S P M B SMA Negeri 1 Magetan siap digunakan.";
    speak(testText);
}

// Simpan data ke localStorage
function saveToLocalStorage() {
    const data = {
        queueNumber: queueNumberInput.value,
        totalCalls: totalCalls,
        callHistory: callHistory,
        currentCall: currentCall,
        operators: operators,
        volume: volumeSlider.value
    };
    
    localStorage.setItem('queueSystemData', JSON.stringify(data));
}

// Load data dari localStorage
function loadFromLocalStorage() {
    const savedData = localStorage.getItem('queueSystemData');
    
    if (savedData) {
        const data = JSON.parse(savedData);
        
        queueNumberInput.value = data.queueNumber || '101';
        totalCalls = data.totalCalls || 0;
        callHistory = data.callHistory || [];
        currentCall = data.currentCall || { queue: '101', operator: 'Operator 1 - Pendaftaran' };
        
        if (data.operators) {
            operators.forEach((op, index) => {
                if (data.operators[index]) {
                    op.status = data.operators[index].status;
                    op.currentQueue = data.operators[index].currentQueue;
                }
            });
        }
        
        // Update volume
        if (data.volume) {
            volumeSlider.value = data.volume;
            volumeValue.textContent = `${Math.round(data.volume * 100)}%`;
        }
        
        // Update display
        currentQueueDisplay.textContent = currentCall.queue;
        currentOperatorDisplay.textContent = currentCall.operator;
        totalCallsDisplay.textContent = totalCalls;
        updateHistoryDisplay();
        updateOperatorGrid();
        
        console.log('Data berhasil dimuat dari localStorage');
    }
}

// Event Listeners
callBtn.addEventListener('click', callQueue);
repeatBtn.addEventListener('click', repeatCall);

decreaseBtn.addEventListener('click', () => {
    let currentValue = parseInt(queueNumberInput.value);
    if (currentValue > 1) {
        queueNumberInput.value = String(currentValue - 1).padStart(3, '0');
    }
});

increaseBtn.addEventListener('click', () => {
    let currentValue = parseInt(queueNumberInput.value);
    queueNumberInput.value = String(currentValue + 1).padStart(3, '0');
});

queueNumberInput.addEventListener('change', () => {
    let value = parseInt(queueNumberInput.value);
    if (value < 1) value = 1;
    if (value > 999) value = 999;
    queueNumberInput.value = String(value).padStart(3, '0');
});

volumeSlider.addEventListener('input', () => {
    const volume = parseFloat(volumeSlider.value);
    volumeValue.textContent = `${Math.round(volume * 100)}%`;
    saveToLocalStorage();
});

testVoiceBtn.addEventListener('click', testVoice);

// Keyboard shortcuts
document.addEventListener('keydown', (e) => {
    // Ctrl + P untuk panggil antrian
    if (e.ctrlKey && e.key === 'p') {
        e.preventDefault();
        callQueue();
    }
    
    // Ctrl + R untuk ulangi panggilan
    if (e.ctrlKey && e.key === 'r') {
        e.preventDefault();
        repeatCall();
    }
    
    // Spasi untuk panggil antrian (jika tidak di input field)
    if (e.code === 'Space' && !['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target.tagName)) {
        e.preventDefault();
        callQueue();
    }
});

// Inisialisasi saat halaman dimuat
document.addEventListener('DOMContentLoaded', () => {
    // Inisialisasi speech synthesis
    initSpeechSynthesis();
    
    // Update waktu setiap detik
    updateTime();
    setInterval(updateTime, 1000);
    
    // Load data dari localStorage
    loadFromLocalStorage();
    
    // Inisialisasi grid operator
    updateOperatorGrid();
    
    // Update history display
    updateHistoryDisplay();
    
    console.log('Sistem Antrian SPMB SMA Negeri 1 Magetan siap digunakan!');
});

// Simpan data sebelum window ditutup
window.addEventListener('beforeunload', saveToLocalStorage);