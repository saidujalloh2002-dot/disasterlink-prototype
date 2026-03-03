// DisasterLink Prototype (LocalStorage simulation)
// 3 views: Shop Portal, Data Center, Fire Station Dashboard

const LS_KEYS = {
  DEVICES: "dl_devices_v1",
  ALERTS: "dl_alerts_v1",
  FIRE_STATUS: "dl_fire_status_v1"
};

const HAZARD_COLORS = {
  Fire: "RED",
  Flood: "YELLOW",
  Earthquake: "ORANGE",
  Volcano: "PURPLE"
};

function nowISO() {
  return new Date().toISOString();
}

function loadJSON(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function saveJSON(key, val) {
  localStorage.setItem(key, JSON.stringify(val));
}

function distanceMeters(lat1, lon1, lat2, lon2) {
  // Haversine
  const R = 6371000;
  const toRad = (x) => (x * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function getDevices() {
  return loadJSON(LS_KEYS.DEVICES, []);
}
function setDevices(devs) {
  saveJSON(LS_KEYS.DEVICES, devs);
}

function getAlerts() {
  return loadJSON(LS_KEYS.ALERTS, []);
}
function setAlerts(alerts) {
  saveJSON(LS_KEYS.ALERTS, alerts);
}

function getFireStatus() {
  return loadJSON(LS_KEYS.FIRE_STATUS, {});
}
function setFireStatus(obj) {
  saveJSON(LS_KEYS.FIRE_STATUS, obj);
}

/* ----------------- Tabs / Views ----------------- */
const tabButtons = document.querySelectorAll(".tab");
tabButtons.forEach(btn => {
  btn.addEventListener("click", () => {
    tabButtons.forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    const view = btn.dataset.view;
    showView(view);
  });
});

function showView(view) {
  document.querySelectorAll(".view").forEach(v => v.classList.add("hidden"));
  document.getElementById(`view-${view}`).classList.remove("hidden");
  // refresh view
  if (view === "shop") renderDevicesList();
  if (view === "datacenter") renderDataCenter();
  if (view === "firestation") renderFireStation();
}

/* ----------------- SHOP PORTAL ----------------- */
const registerForm = document.getElementById("registerForm");
const devicesList = document.getElementById("devicesList");
const deviceSearch = document.getElementById("deviceSearch");
const clearAllBtn = document.getElementById("clearAll");
const seedDemoBtn = document.getElementById("seedDemo");

registerForm.addEventListener("submit", (e) => {
  e.preventDefault();

  const device = {
    id: document.getElementById("deviceId").value.trim(),
    ownerName: document.getElementById("ownerName").value.trim(),
    category: document.getElementById("category").value,
    language: document.getElementById("language").value,
    address: document.getElementById("address").value.trim(),
    lat: Number(document.getElementById("lat").value),
    lng: Number(document.getElementById("lng").value),
    phones: document.getElementById("phones").value
      .split(",")
      .map(s => s.trim())
      .filter(Boolean),
    createdAt: nowISO()
  };

  if (!device.id) return alert("Device ID required");
  if (device.phones.length < 1) return alert("Add at least 1 phone number.");

  const devs = getDevices();
  const exists = devs.find(d => d.id.toLowerCase() === device.id.toLowerCase());
  if (exists) {
    return alert("Device ID already exists. Use a new ID or clear all.");
  }

  devs.push(device);
  setDevices(devs);

  registerForm.reset();
  renderDevicesList();
  alert("Device saved ✅");
});

deviceSearch.addEventListener("input", renderDevicesList);

clearAllBtn.addEventListener("click", () => {
  if (!confirm("Delete ALL devices and alerts?")) return;
  localStorage.removeItem(LS_KEYS.DEVICES);
  localStorage.removeItem(LS_KEYS.ALERTS);
  localStorage.removeItem(LS_KEYS.FIRE_STATUS);
  renderDevicesList();
  renderDataCenter();
  renderFireStation();
});

seedDemoBtn.addEventListener("click", () => {
  const demo = [
    {
      id: "DL-UMS-0001",
      ownerName: "Mohamed (Home)",
      category: "Home",
      language: "Javanese",
      address: "Surakarta, Central Java",
      lat: -7.566,
      lng: 110.816,
      phones: ["+628111111111", "+628222222222"],
      createdAt: nowISO()
    },
    {
      id: "DL-BRI-0102",
      ownerName: "BRI Branch",
      category: "Bank",
      language: "Bahasa Indonesia",
      address: "Surakarta — Bank Area",
      lat: -7.575,
      lng: 110.820,
      phones: ["+628333333333", "+628444444444", "+628555555555"],
      createdAt: nowISO()
    },
    {
      id: "DL-MALL-0201",
      ownerName: "City Mall",
      category: "Mall",
      language: "English",
      address: "Surakarta — Mall",
      lat: -7.560,
      lng: 110.805,
      phones: ["+628666666666"],
      createdAt: nowISO()
    }
  ];
  setDevices(demo);
  setAlerts([]);
  setFireStatus({});
  renderDevicesList();
  alert("Demo devices created ✅");
});

function renderDevicesList() {
  const q = deviceSearch.value.trim().toLowerCase();
  const devs = getDevices();
  const filtered = !q ? devs : devs.filter(d =>
    (d.id + " " + d.ownerName + " " + d.address).toLowerCase().includes(q)
  );

  devicesList.innerHTML = filtered.length
    ? filtered.map(deviceCardHTML).join("")
    : `<div class="item"><div>No devices yet. Register one on the left.</div></div>`;

  // attach delete buttons
  filtered.forEach(d => {
    const btn = document.getElementById(`del-${cssSafe(d.id)}`);
    if (btn) {
      btn.addEventListener("click", () => deleteDevice(d.id));
    }
  });
}

function deviceCardHTML(d) {
  return `
    <div class="item">
      <div><b>${escapeHTML(d.id)}</b> — ${escapeHTML(d.ownerName)}</div>
      <div class="meta">
        <span class="badge">Category: ${escapeHTML(d.category)}</span>
        <span class="badge">Language: ${escapeHTML(d.language)}</span>
      </div>
      <div class="meta">${escapeHTML(d.address)} • (${d.lat.toFixed(4)}, ${d.lng.toFixed(4)})</div>
      <div class="meta">Phones: ${d.phones.map(escapeHTML).join(", ")}</div>
      <div class="row">
        <button id="del-${cssSafe(d.id)}" class="danger ghost">Delete</button>
      </div>
    </div>
  `;
}

function deleteDevice(id) {
  const devs = getDevices().filter(d => d.id !== id);
  setDevices(devs);

  // Also remove alerts tied to this device
  const alerts = getAlerts().filter(a => a.deviceId !== id);
  setAlerts(alerts);

  // Remove fire status for this device
  const fs = getFireStatus();
  delete fs[id];
  setFireStatus(fs);

  renderDevicesList();
  renderDataCenter();
  renderFireStation();
}

/* ----------------- DATA CENTER ----------------- */
const dcDeviceSelect = document.getElementById("dcDeviceSelect");
const dcHazard = document.getElementById("dcHazard");
const dcSeverity = document.getElementById("dcSeverity");
const dcRadius = document.getElementById("dcRadius");
const dcMessage = document.getElementById("dcMessage");
const triggerAlertBtn = document.getElementById("triggerAlert");
const resetAlertsBtn = document.getElementById("resetAlerts");
const alertsList = document.getElementById("alertsList");

triggerAlertBtn.addEventListener("click", () => {
  const devs = getDevices();
  if (devs.length === 0) return alert("Register a device first (Shop Portal).");

  const deviceId = dcDeviceSelect.value;
  const device = devs.find(d => d.id === deviceId);
  if (!device) return alert("Device not found.");

  const hazard = dcHazard.value;
  const severity = dcSeverity.value;
  const radius = Number(dcRadius.value);
  const msg = dcMessage.value.trim();

  const alertObj = {
    id: cryptoRandomId(),
    createdAt: nowISO(),
    hazard,
    severity,
    color: HAZARD_COLORS[hazard] || "UNKNOWN",
    deviceId: device.id,
    originAddress: device.address,
    originLat: device.lat,
    originLng: device.lng,
    message: msg || defaultMessage(hazard, severity),
    // For fire, we compute neighbors
    neighborRadiusMeters: hazard === "Fire" ? radius : null,
    neighbors: hazard === "Fire" ? findNeighbors(device, radius) : []
  };

  const alerts = getAlerts();
  alerts.unshift(alertObj);
  setAlerts(alerts);

  // For fire station status tracking
  if (hazard === "Fire") {
    const fs = getFireStatus();
    fs[device.id] = fs[device.id] || { status: "New", updatedAt: nowISO() };
    setFireStatus(fs);
  }

  dcMessage.value = "";
  renderDataCenter();
  renderFireStation();
  alert("Alert triggered ✅");
});

resetAlertsBtn.addEventListener("click", () => {
  setAlerts([]);
  setFireStatus({});
  renderDataCenter();
  renderFireStation();
});

function renderDataCenter() {
  const devs = getDevices();
  dcDeviceSelect.innerHTML = devs.length
    ? devs.map(d => `<option value="${escapeAttr(d.id)}">${escapeHTML(d.id)} — ${escapeHTML(d.ownerName)}</option>`).join("")
    : `<option value="">No devices</option>`;

  const alerts = getAlerts();
  alertsList.innerHTML = alerts.length
    ? alerts.map(alertCardHTML).join("")
    : `<div class="item"><div>No alerts yet. Trigger one to simulate.</div></div>`;
}

function alertCardHTML(a) {
  const neighborLine = a.hazard === "Fire"
    ? `<div class="meta">Neighbor warning radius: <b>${a.neighborRadiusMeters}m</b> • Neighbors warned: <b>${a.neighbors.length}</b></div>`
    : `<div class="meta">Regional / official-source style alert (geofenced)</div>`;

  return `
    <div class="item">
      <div>
        <b>${escapeHTML(a.hazard)}</b> — <span class="badge">${escapeHTML(a.severity)}</span>
        <span class="badge">LED: ${escapeHTML(a.color)}</span>
      </div>
      <div class="meta">Origin device: <b>${escapeHTML(a.deviceId)}</b> • ${escapeHTML(a.originAddress)}</div>
      <div class="meta">Message: ${escapeHTML(a.message)}</div>
      ${neighborLine}
      <div class="meta">Time: ${escapeHTML(a.createdAt)}</div>
    </div>
  `;
}

function defaultMessage(hazard, severity) {
  const base = {
    Fire: "Warning! Fire detected. Evacuate immediately!",
    Flood: "Flood warning. Prepare to evacuate and move valuables higher.",
    Earthquake: "Earthquake alert. DROP, COVER, HOLD ON.",
    Volcano: "Volcano alert. Follow official evacuation instructions."
  }[hazard] || "Emergency alert.";
  return `${base} (${severity})`;
}

function findNeighbors(originDevice, radiusMeters) {
  const devs = getDevices();
  const neighbors = devs
    .filter(d => d.id !== originDevice.id)
    .map(d => ({
      deviceId: d.id,
      ownerName: d.ownerName,
      address: d.address,
      distance: Math.round(distanceMeters(originDevice.lat, originDevice.lng, d.lat, d.lng))
    }))
    .filter(x => x.distance <= radiusMeters)
    .sort((a, b) => a.distance - b.distance);
  return neighbors;
}

/* ----------------- FIRE STATION ----------------- */
const fireIncidentsList = document.getElementById("fireIncidentsList");
const incidentDetail = document.getElementById("incidentDetail");

function renderFireStation() {
  const alerts = getAlerts().filter(a => a.hazard === "Fire");
  const fs = getFireStatus();

  fireIncidentsList.innerHTML = alerts.length
    ? alerts.map(a => fireIncidentHTML(a, fs[a.deviceId])).join("")
    : `<div class="item"><div>No fire incidents yet.</div></div>`;

  alerts.forEach(a => {
    const btn = document.getElementById(`open-${cssSafe(a.id)}`);
    if (btn) btn.addEventListener("click", () => openIncident(a.id));

    const warnBtn = document.getElementById(`warn-${cssSafe(a.id)}`);
    if (warnBtn) warnBtn.addEventListener("click", () => {
      alert(`Simulated: Sent neighborhood warning within ${a.neighborRadiusMeters}m ✅`);
    });

    const statusSel = document.getElementById(`status-${cssSafe(a.id)}`);
    if (statusSel) statusSel.addEventListener("change", () => {
      const fsObj = getFireStatus();
      fsObj[a.deviceId] = { status: statusSel.value, updatedAt: nowISO() };
      setFireStatus(fsObj);
      renderFireStation();
    });
  });
}

function fireIncidentHTML(a, statusObj) {
  const status = statusObj?.status || "New";
  const updatedAt = statusObj?.updatedAt || a.createdAt;
  return `
    <div class="item">
      <div><b>${escapeHTML(a.deviceId)}</b> — ${escapeHTML(a.originAddress)}</div>
      <div class="meta">
        <span class="badge">Status: ${escapeHTML(status)}</span>
        <span class="badge">Neighbors: ${a.neighbors.length}</span>
        <span class="badge">Radius: ${a.neighborRadiusMeters}m</span>
      </div>
      <div class="meta">Last update: ${escapeHTML(updatedAt)}</div>

      <div class="row">
        <button id="open-${cssSafe(a.id)}" class="primary">Open</button>
        <button id="warn-${cssSafe(a.id)}" class="ghost">Warn Nearby</button>

        <select id="status-${cssSafe(a.id)}">
          <option ${status === "New" ? "selected" : ""}>New</option>
          <option ${status === "Dispatch started" ? "selected" : ""}>Dispatch started</option>
          <option ${status === "Arrived" ? "selected" : ""}>Arrived</option>
          <option ${status === "Under control" ? "selected" : ""}>Under control</option>
          <option ${status === "False alarm" ? "selected" : ""}>False alarm</option>
          <option ${status === "Need backup" ? "selected" : ""}>Need backup</option>
        </select>
      </div>
    </div>
  `;
}

function openIncident(alertId) {
  const fireAlert = getAlerts().find(a => a.id === alertId);
  if (!fireAlert) return;

  const devs = getDevices();
  const origin = devs.find(d => d.id === fireAlert.deviceId);
  const fs = getFireStatus();
  const statusObj = fs[fireAlert.deviceId] || { status: "New", updatedAt: fireAlert.createdAt };

  incidentDetail.classList.remove("empty");
  incidentDetail.innerHTML = `
    <div><b>Incident:</b> FIRE</div>
    <div class="meta"><b>Device:</b> ${escapeHTML(fireAlert.deviceId)}</div>
    <div class="meta"><b>Owner:</b> ${escapeHTML(origin?.ownerName || "-")}</div>
    <div class="meta"><b>Category:</b> ${escapeHTML(origin?.category || "-")}</div>
    <div class="meta"><b>Language:</b> ${escapeHTML(origin?.language || "-")}</div>
    <div class="meta"><b>Address:</b> ${escapeHTML(fireAlert.originAddress)}</div>
    <div class="meta"><b>Coordinates:</b> ${fireAlert.originLat.toFixed(5)}, ${fireAlert.originLng.toFixed(5)}</div>
    <div class="meta"><b>Message:</b> ${escapeHTML(fireAlert.message)}</div>
    <div class="meta"><b>Status:</b> ${escapeHTML(statusObj.status)} (updated: ${escapeHTML(statusObj.updatedAt)})</div>
    <hr style="border:0;border-top:1px solid var(--border);margin:12px 0;" />
    <div><b>Nearby devices warned (${fireAlert.neighbors.length}):</b></div>
    <div class="meta">
      ${fireAlert.neighbors.length ? fireAlert.neighbors.map(n =>
        `• ${escapeHTML(n.deviceId)} (${escapeHTML(n.ownerName)}) — ${escapeHTML(n.address)} — ${n.distance}m`
      ).join("<br/>") : "None within radius."}
    </div>
  `;
}

/* ----------------- Utils ----------------- */
function escapeHTML(str) {
  return String(str).replace(/[&<>"']/g, s => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;"
  }[s]));
}
function escapeAttr(str) {
  return escapeHTML(str).replace(/"/g, "&quot;");
}
function cssSafe(str) {
  return String(str).replace(/[^a-zA-Z0-9_-]/g, "_");
}
function cryptoRandomId() {
  // short unique id
  return Math.random().toString(16).slice(2) + "-" + Math.random().toString(16).slice(2);
}

/* ----------------- Boot ----------------- */
renderDevicesList();
renderDataCenter();
renderFireStation();