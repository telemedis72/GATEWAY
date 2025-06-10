// Ganti dengan konfigurasi Firebase milikmu
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
// LOGIN FUNCTION
function login() {
  const email = document.getElementById("login-email").value;
  const password = document.getElementById("login-password").value;

  firebase.auth().signInWithEmailAndPassword(email, password)
    .then((userCredential) => {
      alert("Login berhasil!");
      window.location.href = "gateway.html"; // ganti sesuai halaman dashboard
    })
    .catch((error) => {
      document.getElementById("login-error").innerText = error.message;
    });
}

// REGISTER FUNCTION
function register() {
  const name = document.getElementById("register-name").value;
  const email = document.getElementById("register-email").value;
  const password = document.getElementById("register-password").value;

  if (!name || !email || !password) {
    document.getElementById("register-error").innerText = "Semua kolom wajib diisi.";
    return;
  }

  firebase.auth().createUserWithEmailAndPassword(email, password)
    .then((userCredential) => {
      const uid = userCredential.user.uid;

      // Simpan data ke Firestore
      return db.collection("gateways").doc(uid).set({
        nama: name,
        email: email,
        uid: uid,
        role: "gateway",
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
      });
    })
    .then(() => {
      alert("Registrasi berhasil! Silakan login.");
      window.location.href = "index.html";
    })
    .catch((error) => {
      document.getElementById("register-error").innerText = error.message;
    });
}
