let liveCount = 0;
let historyNow = [];
let historyHourAgo = [];
let historyYesterday = [];

const maxPoints = 20;

/* ---------- DOM ---------- */
const liveCountEl = document.getElementById("liveCount");
const hourAgoEl = document.getElementById("hourAgo");
const yesterdayEl = document.getElementById("yesterday");
const rateEl = document.getElementById("rate");
const peakEl = document.getElementById("peak");
const avgWaitEl = document.getElementById("avgWait");
const estWaitEl = document.getElementById("estWait");
const healthEl = document.getElementById("queueHealth");

/* ---------- SIMULATION ---------- */
function simulateData() {
  const change = Math.floor(Math.random() * 7 - 3);
  liveCount = Math.max(0, liveCount + change);

  historyNow.push(liveCount);
  historyHourAgo.push(Math.max(0, liveCount - 10));
  historyYesterday.push(Math.max(0, liveCount - 20));

  if (historyNow.length > maxPoints) {
    historyNow.shift();
    historyHourAgo.shift();
    historyYesterday.shift();
  }

  updateUI();
  updateCharts();
}

function updateUI() {
  liveCountEl.innerText = liveCount;
  hourAgoEl.innerText = historyHourAgo.at(-1);
  yesterdayEl.innerText = historyYesterday.at(-1);

  const rate = Math.floor(Math.random() * 5 + 1);
  rateEl.innerText = rate;
  peakEl.innerText = Math.max(...historyNow);
  avgWaitEl.innerText = Math.round(liveCount * 0.8) + " min";
  estWaitEl.innerText = liveCount + 5 + " min";

  // Health logic
  if (liveCount < 50) {
    healthEl.style.background = "#22c55e";
    healthEl.innerText = "HEALTHY";
  } else if (liveCount < 100) {
    healthEl.style.background = "#facc15";
    healthEl.innerText = "MODERATE";
  } else {
    healthEl.style.background = "#dc2626";
    healthEl.innerText = "CONGESTED";
  }
}

/* ---------- CHARTS ---------- */
const labels = Array.from({ length: maxPoints }, (_, i) => i + 1);

const hourChart = new Chart(
  document.getElementById("queueChart"),
  {
    type: "line",
    data: {
      labels,
      datasets: [
        {
          label: "Current",
          data: historyNow,
          borderColor: "#2563eb",
          tension: 0.4
        },
        {
          label: "1 Hour Ago",
          data: historyHourAgo,
          borderColor: "#16a34a",
          tension: 0.4
        }
      ]
    }
  }
);

const yesterdayChart = new Chart(
  document.getElementById("compareChart"),
  {
    type: "line",
    data: {
      labels,
      datasets: [
        {
          label: "Current",
          data: historyNow,
          borderColor: "#7c3aed",
          tension: 0.4
        },
        {
          label: "Yesterday",
          data: historyYesterday,
          borderColor: "#f97316",
          tension: 0.4
        }
      ]
    }
  }
);

const avgWaitChart = new Chart(
  document.getElementById("avgWaitChart"),
  {
    type: "line",
    data: {
      labels,
      datasets: [
        {
          label: "Avg Wait Time",
          data: historyNow.map(v => v * 0.8),
          borderColor: "#0ea5e9",
          tension: 0.4
        }
      ]
    }
  }
);

function updateCharts() {
  hourChart.update();
  yesterdayChart.update();
  avgWaitChart.update();
}

/* ---------- ARDUINO BUTTON ---------- */
let port;
let reader;

async function connectArduino() {
  port = await navigator.serial.requestPort();
  await port.open({ baudRate: 9600 });

  const decoder = new TextDecoderStream();
  port.readable.pipeTo(decoder.writable);
  reader = decoder.readable.getReader();

  connectBtn.innerText = "Arduino Connected";
  connectBtn.style.background = "#16a34a";

  readArduinoData();
}

async function readArduinoData() {
  while (true) {
    const { value, done } = await reader.read();
    if (done) break;

    const num = parseInt(value.trim());
    if (!isNaN(num)) {
      liveCount = num;
      historyNow.push(liveCount);
      historyHourAgo.push(Math.max(0, liveCount - 10));
      historyYesterday.push(Math.max(0, liveCount - 20));

      if (historyNow.length > maxPoints) {
        historyNow.shift();
        historyHourAgo.shift();
        historyYesterday.shift();
      }

      updateUI();
      updateCharts();
    }
  }
}

connectBtn.addEventListener("click", connectArduino);


// Check if running locally
const isLocalhost = window.location.hostname === 'localhost' || 
                    window.location.hostname === '127.0.0.1';

if (!isLocalhost) {
  // On GitHub - hide Arduino button, use simulation only
  document.getElementById("connectBtn").style.display = "none";
  setInterval(simulateData, 3000); // Auto-simulate
} else {
  // On localhost - show Arduino button
  connectBtn.addEventListener("click", connectArduino);
  setInterval(simulateData, 3000); // Fallback simulation
}