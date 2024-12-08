const admin = require("firebase-admin");

// Inisialisasi Firebase dengan kredensial service account  
const serviceAccount = require("./functions/serviceAccountKey.json"); // Ganti dengan path yang benar  
admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: "https://<your-project-id>.firebaseio.com" // Ganti dengan Project ID-mu  
});

const db = admin.firestore();
const jsonData = require('./motifscan.json');

async function importData() {
    try {
        const batch = db.batch();
        jsonData.forEach(item => {
            const newsRef = db.collection('motifscan').doc();
            batch.set(newsRef, item);
        });
        await batch.commit();
        console.log('Data imported successfully!');
    } catch (error) {
        console.error('Error importing data:', error);
    }
}

importData();
