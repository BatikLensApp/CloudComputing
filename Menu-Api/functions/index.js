const express = require("express");
const fileParser = require("express-multipart-file-parser");
const { Readable } = require("stream");
const admin = require("firebase-admin");
const cors = require("cors");
const axios = require("axios")
const path = require("path");
const serviceAccount = require(path.resolve(__dirname, "serviceAccountKey.json"));
const { v4: uuidv4 } = require("uuid");
const FormData = require('form-data');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  storageBucket: "newsapi-442013.firebasestorage.app", // Ganti dengan nama bucket Firebase Storage Anda
});

const app = express();
const bucket = admin.storage().bucket();  // Pastikan ini digunakan setelah admin.initializeApp()
const db = admin.firestore();

app.use(cors({ origin: true }));
app.use(fileParser);

// Rute API
app.get("/motif", async (req, res) => {
  try {
    const snapshot = await db.collection("motifhome").get();
    const motifs = snapshot.docs.map((doc) => ({
      id: doc.data().id,
      jenis: doc.data().jenis,
      foto: doc.data().foto,
    }));
    res.status(200).json(motifs);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get("/news", async (req, res) => {
  try {
    const snapshot = await db.collection("news").get();
    const newsList = snapshot.docs.map((doc) => ({
      id: doc.data().id,
      judul: doc.data().judul,
      deskripsi: doc.data().deskripsi,
      author: doc.data().author,
      tanggal: doc.data().tanggal,
      bulan: doc.data().bulan,
      tahun: doc.data().tahun,
      foto: doc.data().foto,
    }));
    res.status(200).json(newsList);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get("/motif/search", async (req, res) => {
  const searchQuery = req.query.search;
  if (!searchQuery) {
    return res.status(400).json({ error: "Parameter 'search' tidak boleh kosong." });
  }

  try {
    const snapshot = await db.collection("menumotif").get();
    const motifList = snapshot.docs.map((doc) => doc.data());

    // Filter berdasarkan namaMotif  
    const filteredMotifs = motifList.flatMap((motif) =>
      motif.ListBatik.filter((batik) =>
        batik.namaMotif.toLowerCase().includes(searchQuery.toLowerCase())
      ).map((batik) => ({
        id: batik.id,
        namaMotif: batik.namaMotif,
        foto: batik.foto,
        Arti_Motif: batik.Arti_Motif,
        Sejarah_Batik: batik.Sejarah_Batik,
        provinsi: motif.Provinsi // Menyertakan provinsi dari koleksi utama  
      }))
    );

    if (filteredMotifs.length === 0) {
      return res.status(404).json({ error: "Motif tidak ditemukan." });
    }

    res.status(200).json(filteredMotifs);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Rute untuk pencarian berita
app.get("/news/search", async (req, res) => {
  const searchQuery = req.query.search;
  if (!searchQuery) {
    return res.status(400).json({ error: "Parameter 'search' tidak boleh kosong." });
  }

  try {
    const snapshot = await db.collection("news").get();
    const newsList = snapshot.docs.map((doc) => doc.data());
    const filteredNews = newsList.filter((news) =>
      news.judul.toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (filteredNews.length === 0) {
      return res.status(404).json({ error: "Berita tidak ditemukan." });
    }

    res.status(200).json(filteredNews);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get("/motif/:id", async (req, res) => {
  try {
    const idParam = parseInt(req.params.id);
    if (isNaN(idParam)) {
      return res.status(400).json({ error: "ID harus berupa angka." });
    }

    const snapshot = await db.collection("motifhome").where("id", "==", idParam).get();

    if (snapshot.empty) {
      return res.status(404).json({ error: "Motif not found" });
    }

    const motifItem = snapshot.docs[0].data();
    res.status(200).json({
      id: motifItem.id,
      jenis: motifItem.jenis,
      arti: motifItem.arti,
      sejarah: motifItem.sejarah,
      foto: motifItem.foto,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Rute Dinamis News
app.get("/news/:id", async (req, res) => {
  try {
    const idParam = parseInt(req.params.id);
    if (isNaN(idParam)) {
      return res.status(400).json({ error: "ID harus berupa angka." });
    }

    const snapshot = await db.collection("news").where("id", "==", idParam).get();

    if (snapshot.empty) {
      return res.status(404).json({ error: "News not found" });
    }

    const newsItem = snapshot.docs[0].data();
    res.status(200).json({
      id: newsItem.id,
      judul: newsItem.judul,
      deskripsi: newsItem.deskripsi,
      author: newsItem.author,
      tanggal: newsItem.tanggal,
      bulan: newsItem.bulan,
      tahun: newsItem.tahun,
      foto: newsItem.foto,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Rute untuk mendapatkan daftar provinsi
app.get("/provinsi", async (req, res) => {
  try {
    const snapshot = await db.collection("menumotif").get();
    const provinces = snapshot.docs.map((doc) => ({
      id: doc.data().id,
      Provinsi: doc.data().Provinsi,
      Foto: doc.data().Foto,
    }));
    res.status(200).json(provinces);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Rute untuk mendapatkan daftar batik berdasarkan provinsi
app.get("/provinsi/:id", async (req, res) => {
  try {
    const idParam = parseInt(req.params.id);
    if (isNaN(idParam)) {
      return res.status(400).json({ error: "ID harus berupa angka." });
    }

    // Dapatkan data provinsi berdasarkan ID
    const snapshot = await db.collection("menumotif").where("id", "==", idParam).get();

    if (snapshot.empty) {
      return res.status(404).json({ error: "Provinsi tidak ditemukan." });
    }

    // Ambil provinsi yang ditemukan
    const province = snapshot.docs[0].data();

    // Kembalikan data provinsi dan ListBatik
    const response = {
      id: province.id,
      Provinsi: province.Provinsi,
      Foto: province.Foto,
      ListBatik: province.ListBatik.map((batik) => ({
        id: batik.id,
        namaMotif: batik.namaMotif,
        foto: batik.foto,
        Arti_Motif: batik.Arti_Motif,
        Sejarah_Batik: batik.Sejarah_Batik
      }))
    };

    res.status(200).json(response);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Rute untuk mendapatkan detail batik berdasarkan provinsi dan ID batik
app.get("/provinsi/:provinceId/batik/:batikId", async (req, res) => {
  try {
    const provinceId = parseInt(req.params.provinceId);
    const batikId = parseInt(req.params.batikId);

    if (isNaN(provinceId) || isNaN(batikId)) {
      return res.status(400).json({ error: "ID harus berupa angka." });
    }

    // Cari provinsi berdasarkan ID
    const snapshot = await db.collection("menumotif").where("id", "==", provinceId).get();

    if (snapshot.empty) {
      return res.status(404).json({ error: "Provinsi tidak ditemukan." });
    }

    const province = snapshot.docs[0].data();

    // Cari batik berdasarkan ID di ListBatik
    const batik = province.ListBatik.find(b => b.id === batikId);

    if (!batik) {
      return res.status(404).json({ error: "Batik tidak ditemukan." });
    }

    // Kembalikan data batik
    res.status(200).json({
      id: batik.id,
      namaMotif: batik.namaMotif,
      foto: batik.foto,
      Arti_Motif: batik.Arti_Motif,
      Sejarah_Batik: batik.Sejarah_Batik
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


// REGISTRATION ROUTE
app.post("/register", async (req, res) => {
  try {
    const { name, email, password, confirmPassword } = req.body;

    // Validasi input
    if (!name || !email || !password || !confirmPassword) {
      return res.status(400).json({ error: "All fields are required" });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({ error: "Passwords do not match" });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: "Password must be at least 6 characters long" });
    }

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: "Profile image is required" });
    }

    // Ambil file gambar
    const file = req.files[0];
    const filePath = `profiles/${Date.now()}_${file.originalname}`;
    const fileUpload = bucket.file(filePath);

    // Generate token untuk akses publik
    const downloadToken = uuidv4();

    // Upload gambar ke Firebase Storage
    const fileStream = Readable.from(file.buffer);
    await new Promise((resolve, reject) => {
      fileStream
        .pipe(
          fileUpload.createWriteStream({
            metadata: {
              contentType: file.mimetype,
              metadata: {
                firebaseStorageDownloadTokens: downloadToken, // Token unik
              },
            },
          })
        )
        .on("error", (error) => {
          console.error("Error uploading file:", error);
          reject(error);
        })
        .on("finish", resolve);
    });

    // Generate URL publik dengan token
    const downloadURL = `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodeURIComponent(filePath)}?alt=media&token=${downloadToken}`;

    // Buat user di Firebase Authentication
    const userRecord = await admin.auth().createUser({
      email,
      password,
      displayName: name,
      photoURL: downloadURL,
    });

    // Simpan data user tambahan di Firestore
    await db.collection("users").doc(userRecord.uid).set({
      name: name,
      email: email,
      photoUrl: downloadURL,
    });

    res.status(201).json({
      message: "User registered successfully",
      user: {
        uid: userRecord.uid,
        name: name,
        email: email,
        photoUrl: downloadURL,
      },
    });
  } catch (error) {
    console.error("Error registering user:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
});


app.get("/user/:id", async (req, res) => {
  try {
    const uid = req.params.id;

    // Ambil data pengguna dari Firestore
    const userSnapshot = await db.collection("users").doc(uid).get();

    if (!userSnapshot.exists) {
      return res.status(404).json({ error: "User not found" });
    }

    const userData = userSnapshot.data();
    res.status(200).json({
      uid: uid,
      name: userData.name,
      email: userData.email,
      photoUrl: userData.photoUrl,
    });
  } catch (error) {
    console.error("Error fetching user data:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.put('/edit-profile', async (req, res) => {
  try {
    const { uid, name, email } = req.body;  // Ambil uid, name, dan email dari body request  

    if (!uid) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const file = req.files[0];  // Ambil file foto dari request  
    const downloadToken = uuidv4();  // Generate token untuk akses publik  
    const filePath = `profiles/${uid}/${Date.now()}_${file.originalname}`;

    const fileStream = Readable.from(file.buffer);
    await new Promise((resolve, reject) => {
      fileStream
        .pipe(
          admin.storage().bucket().file(filePath).createWriteStream({
            metadata: {
              contentType: file.mimetype,
              metadata: {
                firebaseStorageDownloadTokens: downloadToken,
              },
            },
          })
        )
        .on("error", (error) => {
          console.error("Error uploading file:", error);
          reject(error);
        })
        .on("finish", resolve);
    });

    const photoUrl = `https://firebasestorage.googleapis.com/v0/b/${admin.storage().bucket().name}/o/${encodeURIComponent(filePath)}?alt=media&token=${downloadToken}`;

    // Update user profile in Firebase Authentication  
    const userRecord = await admin.auth().updateUser(uid, {
      photoURL: photoUrl,
      displayName: name, // Update display name  
      email: email, // Update email  
    });

    // Update user profile in Firestore  
    await admin.firestore().collection('users').doc(uid).update({
      photoUrl: photoUrl,
      name: name, // Update name  
      email: email, // Update email  
    });

    // Mengembalikan semua informasi yang diperbarui  
    res.status(200).json({
      message: 'Profile updated successfully',
      user: {
        uid: userRecord.uid,
        name: name, // Tambahkan name ke respons  
        email: email, // Tambahkan email ke respons  
        photoUrl: photoUrl,
      },
    });

  } catch (error) {
    console.error("Error updating profile:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.get("/fashion", async (req, res) => {
  try {
    const snapshot = await db.collection("fashion").get();
    const newsList = snapshot.docs.map((doc) => ({
      id: doc.data().id,
      judul: doc.data().judul,
      deskripsi: doc.data().deskripsi,
      author: doc.data().author,
      tanggal: doc.data().tanggal,
      foto: doc.data().foto,
    }));
    res.status(200).json(newsList);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get("/fashion/:id", async (req, res) => {
  try {
    const idParam = parseInt(req.params.id);
    if (isNaN(idParam)) {
      return res.status(400).json({ error: "ID harus berupa angka." });
    }

    const snapshot = await db.collection("fashion").where("id", "==", idParam).get();

    if (snapshot.empty) {
      return res.status(404).json({ error: "News not found" });
    }

    const newsItem = snapshot.docs[0].data();
    res.status(200).json({
      id: newsItem.id,
      judul: newsItem.judul,
      deskripsi: newsItem.deskripsi,
      author: newsItem.author,
      tanggal: newsItem.tanggal,
      foto: newsItem.foto,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


app.get("/fashion", async (req, res) => {
  try {
    const snapshot = await db.collection("fashion").get();
    const newsList = snapshot.docs.map((doc) => ({
      id: doc.data().id,
      judul: doc.data().judul,
      deskripsi: doc.data().deskripsi,
      author: doc.data().author,
      tanggal: doc.data().tanggal,
      foto: doc.data().foto,
    }));
    res.status(200).json(newsList);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get("/fashion/:id", async (req, res) => {
  try {
    const idParam = parseInt(req.params.id);
    if (isNaN(idParam)) {
      return res.status(400).json({ error: "ID harus berupa angka." });
    }

    const snapshot = await db.collection("fashion").where("id", "==", idParam).get();

    if (snapshot.empty) {
      return res.status(404).json({ error: "News not found" });
    }

    const newsItem = snapshot.docs[0].data();
    res.status(200).json({
      id: newsItem.id,
      judul: newsItem.judul,
      deskripsi: newsItem.deskripsi,
      author: newsItem.author,
      tanggal: newsItem.tanggal,
      foto: newsItem.foto,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get("/motifscan", async (req, res) => {
  try {
    const snapshot = await db.collection("motifscan").get();
    const newsList = snapshot.docs.map((doc) => ({
      id: doc.data().id,
      namaMotif: doc.data().namaMotif,
      Arti_Motif: doc.data().Arti_Motif,
      Sejarah_Batik: doc.data().Sejarah_Batik,
      foto: doc.data().foto,
    }));
    res.status(200).json(newsList);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get("/motifscan/:id", async (req, res) => {
  try {
    const idParam = parseInt(req.params.id);
    if (isNaN(idParam)) {
      return res.status(400).json({ error: "ID harus berupa angka." });
    }

    const snapshot = await db.collection("motifscan").where("id", "==", idParam).get();

    if (snapshot.empty) {
      return res.status(404).json({ error: "News not found" });
    }

    const newsItem = snapshot.docs[0].data();
    res.status(200).json({
      id: newsItem.id,
      namaMotif: newsItem.namaMotif,
      Arti_Motif: newsItem.Arti_Motif,
      Sejarah_Batik: newsItem.Sejarah_Batik,
      foto: newsItem.foto,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post("/scan-batik", async (req, res) => {
  try {
    // 1. Ambil gambar dari form data
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: "Tidak ada gambar yang diunggah" });
    }

    const file = req.files[0]; // Asumsikan hanya satu file
    console.log('File uploaded:', file.originalname);

    // 2. Kirim gambar langsung ke API scanner sebagai buffer atau stream
    const formData = new FormData();

    // Jika menggunakan Buffer
    // formData.append("file", Buffer.from(file.buffer), { filename: file.originalname, contentType: file.mimetype });

    // Atau jika ingin menggunakan stream (alternative)
    const stream = fs.createReadStream(file.tempFilePath); // Menggunakan fs.createReadStream jika menggunakan file sementara
    formData.append("file", stream, { filename: file.originalname, contentType: file.mimetype });

    // Menambahkan log untuk memastikan request API dikirim
    console.log("Mengirim gambar ke API scanner...");
    const response = await axios.post("https://batikfix-service-516544967646.us-central1.run.app/predict", formData, {
      headers: formData.getHeaders(),
    });

    // Ambil label dari API scanner
    const predictedLabel = response.data.predicted_label.predicted_label;
    console.log(`Motif ditemukan: ${predictedLabel}`);

    if (!predictedLabel) {
      return res.status(400).json({ error: "Motif batik tidak terdeteksi" });
    }

    // 3. Cek data motif dari API motifscan berdasarkan nama motif yang dideteksi
    const motifResponse = await axios.get("https://api-tysphbhbhq-uc.a.run.app/motifscan");
    const matchedMotif = motifResponse.data.find(motif =>
      motif.namaMotif.toLowerCase().includes(predictedLabel.toLowerCase())
    );

    if (!matchedMotif) {
      return res.status(404).json({ error: "Motif tidak ditemukan dalam database" });
    }

    console.log(`Motif ditemukan dalam database: ${matchedMotif.namaMotif}`);

    // 4. Menyimpan data ke Firestore
    const scanHistory = {
      motif: matchedMotif.namaMotif,
      artiMotif: matchedMotif.Arti_Motif,
      sejarahBatik: matchedMotif.Sejarah_Batik,
      foto: matchedMotif.foto,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
    };

    console.log("Menyimpan data ke Firestore...");
    await db.collection("scanHistory").add(scanHistory);

    // 5. Mengirimkan respons dengan informasi motif yang terdeteksi
    res.status(200).json({
      motif: matchedMotif.namaMotif,
      artiMotif: matchedMotif.Arti_Motif,
      sejarahBatik: matchedMotif.Sejarah_Batik,
      foto: matchedMotif.foto,
    });
  } catch (error) {
    console.error("Terjadi kesalahan dalam pemrosesan:", error);
    res.status(500).json({ error: "Terjadi kesalahan dalam pemrosesan" });
  }
});


// Endpoint untuk mengambil riwayat scan
app.get("/scan-history", async (req, res) => {
  try {
    const snapshot = await db.collection("scanHistory").get();
    const scanHistoryList = snapshot.docs.map((doc) => doc.data());
    res.status(200).json(scanHistoryList);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Ekspor fungsi API
exports.api = require("firebase-functions/v2").https.onRequest(app);