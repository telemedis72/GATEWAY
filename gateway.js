// Firebase config (ganti dengan konfigurasi milikmu)
const firebaseConfig = {
  apiKey: "AIzaSyAT1YuUSoKvAC_q1yxmB8Ggt4vR6f51Nkc",
  authDomain: "telemediss.firebaseapp.com",
  databaseURL: "https://telemediss-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "telemediss",
  storageBucket: "telemediss.firebasestorage.app",
  messagingSenderId: "96895220603",
  appId: "1:96895220603:web:fc4c9d8c3bb243a1155bde",
  measurementId: "G-RSN040MZWR"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.database();

// UI Elements
const btnMonitoring = document.getElementById("btn-monitoring");
const btnReceivers = document.getElementById("btn-receivers");
const btnNodes = document.getElementById("btn-nodes");
const btnNodeData = document.getElementById("btn-node-data");

const monitoringSection = document.getElementById("monitoring-section");
const receiversSection = document.getElementById("receivers-section");
const nodesSection = document.getElementById("nodes-section");
const nodeDataSection = document.getElementById("node-data-section");

const monitoringList = document.getElementById("monitoring-list");
const receiverList = document.getElementById("receiver-list");
const nodeList = document.getElementById("node-list");

const newReceiverIdInput = document.getElementById("new-receiver-id");
const newReceiverKodeInput = document.getElementById("new-receiver-kode");
const addReceiverBtn = document.getElementById("add-receiver-btn");

const newNodeIdInput = document.getElementById("new-node-id");
const addNodeBtn = document.getElementById("add-node-btn");

const nodeSelect = document.getElementById("node-select");
const nodeDataDisplay = document.getElementById("node-data-display");

// Helper fungsi show/hide
function hideAllSections() {
  monitoringSection.classList.add("hidden");
  receiversSection.classList.add("hidden");
  nodesSection.classList.add("hidden");
  nodeDataSection.classList.add("hidden");
}

// Firebase Authentication check
firebase.auth().onAuthStateChanged(user => {
  if (user) {
    const currentUserID = user.uid;

    // Bind tombol dan fungsi setelah user valid login
    btnMonitoring.onclick = () => {
      hideAllSections();
      monitoringSection.classList.remove("hidden");
      loadMonitoringData();
    };

    btnReceivers.onclick = () => {
      hideAllSections();
      receiversSection.classList.remove("hidden");
      loadReceivers();
    };

    btnNodes.onclick = () => {
      hideAllSections();
      nodesSection.classList.remove("hidden");
      loadNodes();
    };

    btnNodeData.onclick = () => {
      hideAllSections();
      nodeDataSection.classList.remove("hidden");
      loadNodeOptions();
    };

    addReceiverBtn.onclick = () => {
      const id = newReceiverIdInput.value.trim();
      const kode = newReceiverKodeInput.value.trim();
      if (!id || !kode) return alert("Lengkapi data");
      db.ref("receiver/" + id).set({
        owner: currentUserID,
        kode_khusus: kode
      }).then(() => {
        alert("Receiver berhasil ditambahkan");
        newReceiverIdInput.value = "";
        newReceiverKodeInput.value = "";
        loadReceivers();
      }).catch(err => alert("Gagal tambah receiver: " + err.message));
    };

    addNodeBtn.onclick = () => {
      const id = newNodeIdInput.value.trim();
      if (!id) return alert("Isi ID node");
      db.ref("akun/" + currentUserID + "/nodes/" + id).set(true).then(() => {
        alert("Node berhasil ditambahkan");
        newNodeIdInput.value = "";
        loadNodes();
      }).catch(err => alert("Gagal tambah node: " + err.message));
    };

    // Fungsi load receivers milik user
    function loadReceivers() {
      receiverList.innerHTML = "Loading...";
      db.ref("receiver").orderByChild("owner").equalTo(currentUserID).once("value", snapshot => {
        receiverList.innerHTML = "";
        if (!snapshot.exists()) {
          receiverList.innerHTML = "<i>Tidak ada receiver</i>";
          return;
        }
        snapshot.forEach(child => {
  const r = child.key;
  const kode = child.val().kode_khusus;

  // Buat elemen utama container receiver
  const div = document.createElement("div");
  div.className = "receiver-item";

  // Buat elemen info receiver
  const info = document.createElement("div");
  info.className = "receiver-info";

  // Tambahkan isi info
  const idDiv = document.createElement("div");
  idDiv.innerHTML = `<strong>📡 receiverID:</strong> ${r}`;

  const kodeDiv = document.createElement("div");
  kodeDiv.innerHTML = `<strong>🔐 kode_khusus:</strong> ${kode}`;

  // Masukkan info ke dalam info container
  info.appendChild(idDiv);
  info.appendChild(kodeDiv);

  // Buat tombol hapus
  const btnDel = document.createElement("button");
  btnDel.className = "delete-btn";
  btnDel.textContent = "Hapus";
  btnDel.onclick = () => {
    if (confirm(`Hapus receiver ${r}?`)) {
      db.ref("receiver/" + r).remove().then(() => loadReceivers());
    }
  };

  // Susun semua ke dalam div utama
  div.appendChild(info);
  div.appendChild(btnDel);

  // Masukkan ke daftar receiver
  receiverList.appendChild(div);
});

      });
    }

    // Fungsi load node milik user
    function loadNodes() {
      nodeList.innerHTML = "Loading...";
      db.ref("akun/" + currentUserID + "/nodes").once("value", snapshot => {
        nodeList.innerHTML = "";
        if (!snapshot.exists()) {
          nodeList.innerHTML = "<i>Tidak ada node</i>";
          return;
        }
        snapshot.forEach(child => {
         const div = document.createElement("div");
div.className = "node-item";

const info = document.createElement("div");
info.className = "node-info";

const idDiv = document.createElement("div");
idDiv.innerHTML = `<strong>📡 nodeID:</strong> ${id}`;

info.appendChild(idDiv);

const btnDel = document.createElement("button");
btnDel.className = "delete-btn";
btnDel.textContent = "Hapus";
btnDel.onclick = () => {
  if (confirm(`Hapus node ${id}?`)) {
    db.ref("akun/" + currentUserID + "/nodes/" + id).remove().then(() => loadNodes());
  }
};

div.appendChild(info);
div.appendChild(btnDel);
nodeList.appendChild(div);

        });
      });
    }

    // Fungsi load monitoring data semua node
    function loadMonitoringData() {
      monitoringList.innerHTML = "Memuat...";
      db.ref("data").once("value", snapshot => {
        monitoringList.innerHTML = "";
        if (!snapshot.exists()) {
          monitoringList.innerHTML = "<i>Tidak ada data monitoring</i>";
          return;
        }
        snapshot.forEach(child => {
          const nodeID = child.key;
          const data = child.val();
          const div = document.createElement("div");
          div.innerHTML = `<strong>${nodeID}</strong>: <pre>${JSON.stringify(data, null, 2)}</pre>`;
          monitoringList.appendChild(div);
        });
      });
    }

    // Load options node untuk pilihan data spesifik
    function loadNodeOptions() {
      nodeSelect.innerHTML = "";
      db.ref("akun/" + currentUserID + "/nodes").once("value", snapshot => {
        if (!snapshot.exists()) {
          nodeSelect.innerHTML = "<option disabled>Tidak ada node</option>";
          nodeDataDisplay.innerHTML = "<i>Pilih node terlebih dahulu</i>";
          return;
        }
        snapshot.forEach(child => {
          const opt = document.createElement("option");
          opt.value = child.key;
          opt.textContent = child.key;
          nodeSelect.appendChild(opt);
        });
        showNodeData();
      });
    }

    nodeSelect.onchange = showNodeData;

    function showNodeData() {
      const id = nodeSelect.value;
      if (!id) {
        nodeDataDisplay.innerHTML = "<i>Pilih node terlebih dahulu</i>";
        return;
      }
      db.ref("data/" + id).once("value", snap => {
        const val = snap.val();
        if (!val) {
          nodeDataDisplay.innerHTML = "<i>Tidak ada data untuk node ini</i>";
        } else {
          nodeDataDisplay.innerHTML = "<pre>" + JSON.stringify(val, null, 2) + "</pre>";
        }
      });
    }

    // Load halaman default, misalnya monitoring
    btnMonitoring.click();

  } else {
    // User belum login, redirect ke login
    window.location.href = "login.html";
  }
});
