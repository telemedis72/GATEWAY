// Konfigurasi Firebase
const firebaseConfig = {
  apiKey: "AIzaSyAT1YuUSoKvAC_q1yxmB8Ggt4vR6f51Nkc",
  authDomain: "telemediss.firebaseapp.com",
  databaseURL: "https://telemediss-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "telemediss",
  storageBucket: "telemediss.appspot.com",
  messagingSenderId: "96895220603",
  appId: "1:96895220603:web:fc4c9d8c3bb243a1155bde",
  measurementId: "G-RSN040MZWR"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.database();

// Elemen UI
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

function hideAllSections() {
  monitoringSection.classList.add("hidden");
  receiversSection.classList.add("hidden");
  nodesSection.classList.add("hidden");
  nodeDataSection.classList.add("hidden");
}

firebase.auth().onAuthStateChanged(user => {
  if (!user) {
    window.location.href = "login.html";
    return;
  }

  const currentUserID = user.uid;

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

  // Tambah Receiver
  addReceiverBtn.onclick = () => {
    const id = newReceiverIdInput.value.trim();
    const kode = newReceiverKodeInput.value.trim();
    if (!id || !kode) return alert("Lengkapi data");

    db.ref("receiver/" + id).once("value", snap => {
      if (snap.exists()) {
        const owner = snap.val().owner;
        if (owner && owner !== currentUserID) {
          return alert("Receiver sudah dimiliki akun lain!");
        }
      }

      db.ref("receiver/" + id).set({
        owner: currentUserID,
        kode_khusus: kode
      }).then(() => {
        alert("Receiver berhasil ditambahkan");
        newReceiverIdInput.value = "";
        newReceiverKodeInput.value = "";
        loadReceivers();
      }).catch(err => alert("Gagal tambah receiver: " + err.message));
    });
  };

  // Tambah Node
  addNodeBtn.onclick = () => {
    const id = newNodeIdInput.value.trim();
    if (!id) return alert("Isi ID node");

    // Cek apakah node sudah dimiliki akun lain
    db.ref("akun").once("value", snap => {
      let digunakan = false;
      snap.forEach(child => {
        if (child.key !== currentUserID && child.child("nodes").child(id).exists()) {
          digunakan = true;
        }
      });

      if (digunakan) {
        return alert("Node sudah digunakan oleh akun lain!");
      }

      db.ref("akun/" + currentUserID + "/nodes/" + id).set(true).then(() => {
        alert("Node berhasil ditambahkan");
        newNodeIdInput.value = "";
        loadNodes();
      }).catch(err => alert("Gagal tambah node: " + err.message));
    });
  };

  // Load Receivers
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

        const div = document.createElement("div");
        div.className = "receiver-item";

        const info = document.createElement("div");
        info.className = "receiver-info";

        const idDiv = document.createElement("div");
        idDiv.innerHTML = `<strong>📡 receiverID:</strong> ${r}`;

        const kodeDiv = document.createElement("div");
        kodeDiv.innerHTML = `<strong>🔐 kode_khusus:</strong> ${kode}`;

        info.appendChild(idDiv);
        info.appendChild(kodeDiv);

        const btnDel = document.createElement("button");
        btnDel.className = "delete-btn";
        btnDel.textContent = "Hapus";
        btnDel.onclick = () => {
          if (confirm(`Hapus receiver ${r}?`)) {
            db.ref("receiver/" + r).remove().then(() => loadReceivers());
          }
        };

        div.appendChild(info);
        div.appendChild(btnDel);
        receiverList.appendChild(div);
      });
    });
  }

  // Load Nodes
  function loadNodes() {
    nodeList.innerHTML = "Loading...";
    db.ref("akun/" + currentUserID + "/nodes").once("value", snapshot => {
      nodeList.innerHTML = "";
      if (!snapshot.exists()) {
        nodeList.innerHTML = "<i>Tidak ada node</i>";
        return;
      }

      snapshot.forEach(child => {
        const id = child.key;
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

  // Load Monitoring hanya node milik akun ini
  function loadMonitoringData() {
    monitoringList.innerHTML = "Memuat...";
    db.ref("akun/" + currentUserID + "/nodes").once("value", nodeSnapshot => {
      const nodeIDs = [];
      nodeSnapshot.forEach(child => nodeIDs.push(child.key));

      if (nodeIDs.length === 0) {
        monitoringList.innerHTML = "<i>Tidak ada node terdaftar</i>";
        return;
      }

      db.ref("data").once("value", dataSnapshot => {
        monitoringList.innerHTML = "";

        let count = 0;

        dataSnapshot.forEach(child => {
          const nodeID = child.key;
          if (nodeIDs.includes(nodeID)) {
            const data = child.val();
            const div = document.createElement("div");
            div.innerHTML = `<strong>${nodeID}</strong>: <pre>${JSON.stringify(data, null, 2)}</pre>`;
            monitoringList.appendChild(div);
            count++;
          }
        });

        if (count === 0) {
          monitoringList.innerHTML = "<i>Tidak ada data untuk node Anda</i>";
        }
      });
    });
  }

  // Load Pilihan Node
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

  // Tampilkan Data Node Saat Dipilih
  nodeSelect.onchange = showNodeData;

  function showNodeData() {
    const id = nodeSelect.value;
    if (!id) {
      nodeDataDisplay.innerHTML = "<i>Pilih node terlebih dahulu</i>";
      return;
    }

    db.ref("data/" + id).once("value", snap => {
      const val = snap.val();
      nodeDataDisplay.innerHTML = val
        ? `<pre>${JSON.stringify(val, null, 2)}</pre>`
        : "<i>Tidak ada data untuk node ini</i>";
    });
  }

  // Load awal monitoring
  btnMonitoring.click();
});
