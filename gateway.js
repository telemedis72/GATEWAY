// Konfigurasi Firebase (gunakan konfigurasi milikmu)
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

// Elemen UI
const btnMonitoring     = document.getElementById("btn-monitoring");
const btnReceivers      = document.getElementById("btn-receivers");
const btnNodes          = document.getElementById("btn-nodes");
const btnNodeData       = document.getElementById("btn-node-data");

const monitoringSection = document.getElementById("monitoring-section");
const receiversSection  = document.getElementById("receivers-section");
const nodesSection      = document.getElementById("nodes-section");
const nodeDataSection   = document.getElementById("node-data-section");

const monitoringList    = document.getElementById("monitoring-list");
const receiverList      = document.getElementById("receiver-list");
const nodeList          = document.getElementById("node-list");

const newReceiverIdInput   = document.getElementById("new-receiver-id");
const newReceiverKodeInput = document.getElementById("new-receiver-kode");
const addReceiverBtn       = document.getElementById("add-receiver-btn");

const newNodeIdInput = document.getElementById("new-node-id");
const addNodeBtn     = document.getElementById("add-node-btn");

const nodeSelect       = document.getElementById("node-select");
const nodeDataDisplay  = document.getElementById("node-data-display");

// Variabel untuk monitoring status receiver
let receiverStatusCheckers = {};
let receiverListeners = {};

// Fungsi bantu untuk sembunyikan semua section
function hideAllSections() {
  monitoringSection.classList.add("hidden");
  receiversSection.classList.add("hidden");
  nodesSection.classList.add("hidden");
  nodeDataSection.classList.add("hidden");
}

// Fungsi untuk memulai monitoring status receiver
function startReceiverStatusMonitoring(receiverId) {
  // Hentikan monitoring sebelumnya jika ada
  if (receiverStatusCheckers[receiverId]) {
    clearInterval(receiverStatusCheckers[receiverId]);
  }

  // Mulai monitoring setiap 15 detik
  receiverStatusCheckers[receiverId] = setInterval(() => {
    checkReceiverStatus(receiverId);
  }, 15000); // 15 detik

  // Jalankan pengecekan pertama kali
  checkReceiverStatus(receiverId);
}

// Fungsi untuk mengecek status receiver
function checkReceiverStatus(receiverId) {
  db.ref("receiver/" + receiverId).once("value", snapshot => {
    if (!snapshot.exists()) return;

    const data = snapshot.val();
    const lastSeen = data.lastSeen || 0;
    const currentTime = Date.now();
    const timeDiff = currentTime - lastSeen;

    // Jika lebih dari 60 detik (60000 ms), set status offline
    if (timeDiff > 60000 && data.status === "1") {
      db.ref("receiver/" + receiverId + "/status").set("0");
      console.log(`${receiverId} set to offline - no heartbeat for ${timeDiff}ms`);
    }
  });
}

// Fungsi untuk menghentikan monitoring receiver
function stopReceiverMonitoring() {
  // Hentikan semua monitoring receiver
  Object.keys(receiverStatusCheckers).forEach(receiverId => {
    clearInterval(receiverStatusCheckers[receiverId]);
    delete receiverStatusCheckers[receiverId];
  });

  // Hentikan semua listeners
  Object.keys(receiverListeners).forEach(receiverId => {
    if (receiverListeners[receiverId]) {
      receiverListeners[receiverId].off();
      delete receiverListeners[receiverId];
    }
  });
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
    loadMonitoringData(currentUserID);
  };

  btnReceivers.onclick = () => {
    hideAllSections();
    receiversSection.classList.remove("hidden");
    loadReceivers(currentUserID);
  };

  btnNodes.onclick = () => {
    hideAllSections();
    nodesSection.classList.remove("hidden");
    loadNodes(currentUserID);
  };

  btnNodeData.onclick = () => {
    hideAllSections();
    nodeDataSection.classList.remove("hidden");
    loadNodeOptions(currentUserID);
  };

  // Tambah Receiver
  addReceiverBtn.onclick = () => {
    const id   = newReceiverIdInput.value.trim();
    const kode = newReceiverKodeInput.value.trim();
    if (!id || !kode) return alert("Lengkapi data");

    db.ref("receiver/" + id).once("value", snap => {
      if (snap.exists()) {
        const data = snap.val();
        if (data.owner !== currentUserID) {
          return alert("Receiver sudah dimiliki akun lain!");
        }
      }

      db.ref("receiver/" + id).set({
        owner: currentUserID,
        kode_khusus: kode,
        status: "0",
        lastSeen: 0
      }).then(() => {
        alert("Receiver berhasil ditambahkan");
        newReceiverIdInput.value = "";
        newReceiverKodeInput.value = "";
        loadReceivers(currentUserID);
      }).catch(err => alert("Gagal tambah receiver: " + err.message));
    });
  };

  // Tambah Node
  addNodeBtn.onclick = () => {
    const id = newNodeIdInput.value.trim();
    if (!id) return alert("Isi ID node");

    // Cek apakah node sudah terdaftar di akun lain
    db.ref("akun").once("value", snapshot => {
      let alreadyTaken = false;
      snapshot.forEach(child => {
        if (child.child("nodes").hasChild(id)) {
          alreadyTaken = true;
        }
      });

      if (alreadyTaken) {
        alert("Node sudah dimiliki akun lain!");
      } else {
        db.ref("akun/" + currentUserID + "/nodes/" + id).set(true).then(() => {
          alert("Node berhasil ditambahkan");
          newNodeIdInput.value = "";
          loadNodes(currentUserID);
        }).catch(err => alert("Gagal tambah node: " + err.message));
      }
    });
  };

  // Load Receiver dengan monitoring status
  function loadReceivers(uid) {
    receiverList.innerHTML = "Loading...";
    
    // Hentikan monitoring receiver sebelumnya
    stopReceiverMonitoring();

    db.ref("receiver").orderByChild("owner").equalTo(uid).once("value", snapshot => {
      receiverList.innerHTML = "";
      if (!snapshot.exists()) {
        receiverList.innerHTML = "<i>Tidak ada receiver</i>";
        return;
      }

      const receiverIds = [];
      
      snapshot.forEach(child => {
        const r      = child.key;
        const data   = child.val();
        const kode   = data.kode_khusus;
        const status = data.status || "0";
        
        receiverIds.push(r);

        const div  = document.createElement("div");
        div.className = "receiver-item";
        div.id = `receiver-${r}`;

        const info = document.createElement("div");
        info.className = "receiver-info";
        info.innerHTML = `
          <div><strong>📡 receiverID:</strong> ${r}</div>
          <div><strong>🔐 kode_khusus:</strong> ${kode}</div>
          <div><strong>📶 status:</strong> <span class="${status === '1' ? 'status-online' : 'status-offline'}">${status === '1' ? 'online' : 'offline'}</span></div>`;

        const btnDel = document.createElement("button");
        btnDel.className = "delete-btn";
        btnDel.textContent = "Hapus";
        btnDel.onclick = () => {
          if (confirm(`Hapus receiver ${r}?`)) {
            // Hentikan monitoring untuk receiver ini
            if (receiverStatusCheckers[r]) {
              clearInterval(receiverStatusCheckers[r]);
              delete receiverStatusCheckers[r];
            }
            if (receiverListeners[r]) {
              receiverListeners[r].off();
              delete receiverListeners[r];
            }
            db.ref("receiver/" + r).remove().then(() => loadReceivers(uid));
          }
        };

        div.appendChild(info);
        div.appendChild(btnDel);
        receiverList.appendChild(div);
      });

      // Mulai monitoring untuk semua receiver
      receiverIds.forEach(receiverId => {
        startReceiverStatusMonitoring(receiverId);
        
        // Set up realtime listener untuk update UI
        receiverListeners[receiverId] = db.ref("receiver/" + receiverId);
        receiverListeners[receiverId].on("value", snapshot => {
          if (snapshot.exists()) {
            const data = snapshot.val();
            const receiverDiv = document.getElementById(`receiver-${receiverId}`);
            if (receiverDiv) {
              const statusSpan = receiverDiv.querySelector('.status-online, .status-offline');
              
              if (statusSpan) {
                statusSpan.textContent = data.status === '1' ? 'online' : 'offline';
                statusSpan.className = data.status === '1' ? 'status-online' : 'status-offline';
              }
            }
          }
        });
      });
    });
  }

  // Load Node (tanpa monitoring)
  function loadNodes(uid) {
    nodeList.innerHTML = "Loading...";
    db.ref("akun/" + uid + "/nodes").once("value", snapshot => {
      nodeList.innerHTML = "";
      if (!snapshot.exists()) {
        nodeList.innerHTML = "<i>Tidak ada node</i>";
        return;
      }

      snapshot.forEach(child => {
        const id  = child.key;
        const div = document.createElement("div");
        div.className = "node-item";

        const info = document.createElement("div");
        info.className = "node-info";
        info.innerHTML = `<div><strong>📡 nodeID:</strong> ${id}</div>`;

        const btnDel = document.createElement("button");
        btnDel.className = "delete-btn";
        btnDel.textContent = "Hapus";
        btnDel.onclick = () => {
          if (confirm(`Hapus node ${id}?`)) {
            db.ref("akun/" + uid + "/nodes/" + id).remove().then(() => loadNodes(uid));
          }
        };

        div.appendChild(info);
        div.appendChild(btnDel);
        nodeList.appendChild(div);
      });
    });
  }

  // Realtime Monitoring Data
  let monitoringListener = null;

  function loadMonitoringData(uid) {
    monitoringList.innerHTML = "Memuat...";

    if (monitoringListener) {
      monitoringListener.off();
    }

    db.ref("akun/" + uid + "/nodes").once("value", nodeSnap => {
      const nodeIDs = [];
      nodeSnap.forEach(child => nodeIDs.push(child.key));

      if (nodeIDs.length === 0) {
        monitoringList.innerHTML = "<i>Tidak ada node terdaftar</i>";
        return;
      }

      monitoringList.innerHTML = "<i>Menghubungkan ke Firebase...</i>";

      monitoringListener = db.ref("data");
      monitoringListener.on("value", dataSnap => {
        monitoringList.innerHTML = "";
        let ada = false;

        dataSnap.forEach(child => {
          const nodeID = child.key;
          if (nodeIDs.includes(nodeID)) {
            const data = child.val();
            const div = document.createElement("div");
            div.className = "data-item";
            div.innerHTML = `<strong>${nodeID}</strong>: <pre>${JSON.stringify(data, null, 2)}</pre>`;
            monitoringList.appendChild(div);
            ada = true;
          }
        });

        if (!ada) {
          monitoringList.innerHTML = "<i>Belum ada data yang tersedia</i>";
        }
      });
    });
  }

  // Load Node untuk pilihan di Node Data
  function loadNodeOptions(uid) {
    nodeSelect.innerHTML = "";
    db.ref("akun/" + uid + "/nodes").once("value", snapshot => {
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

      showNodeData(uid);
    });
  }

  // Tampilkan Data per Node
  nodeSelect.onchange = () => showNodeData(currentUserID);

  function showNodeData(uid) {
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

  // Cleanup saat window ditutup
  window.addEventListener('beforeunload', () => {
    stopReceiverMonitoring();
  });

  // Mulai dengan monitoring
  btnMonitoring.click();
});
