import os
import io
import numpy as np
from tensorflow import keras
from PIL import Image
from flask import Flask, request, jsonify
from urllib.parse import quote as url_quote

# Load model .h5
model = keras.models.load_model("model.h5")

# Daftar label
labels = [  	
    {"Predicted_Label": "Motif Barong From Bali", "Id_Provinsi": 2, "Id_Motif": 1},  
    {"Predicted_Label": "Motif Merak From Bali", "Id_Provinsi": 2, "Id_Motif": 2},  
    {"Predicted_Label": "Motif Ondel Ondel From Jakarta", "Id_Provinsi": 3, "Id_Motif": 1},  
    {"Predicted_Label": "Motif Tumpal From Jakarta", "Id_Provinsi": 3, "Id_Motif": 2},  
    {"Predicted_Label": "Motif Megamendung From Jawa Barat", "Id_Provinsi": 4, "Id_Motif": 1},  
    {"Predicted_Label": "Motif Asem Arang From Jawa Tengah", "Id_Provinsi": 13, "Id_Motif": 6},  
    {"Predicted_Label": "Motif Asem Sinom From Jawa Tengah", "Id_Provinsi": 13, "Id_Motif": 7},  
    {"Predicted_Label": "Motif Asem Warak From Jawa Tengah", "Id_Provinsi": 13, "Id_Motif": 8},  
    {"Predicted_Label": "Motif Blekok From Jawa Tengah", "Id_Provinsi": 13, "Id_Motif": 9},  
    {"Predicted_Label": "Motif Blekok Warak From Jawa Tengah", "Id_Provinsi": 13, "Id_Motif": 10},  
    {"Predicted_Label": "Motif Cipratan From Jawa Tengah", "Id_Provinsi": 13, "Id_Motif": 11},  
    {"Predicted_Label": "Motif Gambang Semarangan From Jawa Tengah", "Id_Provinsi": 13, "Id_Motif": 12},  
    {"Predicted_Label": "Motif Ikan Kerang From Jawa Tengah", "Id_Provinsi": 13, "Id_Motif": 13},  
    {"Predicted_Label": "Motif Jagung Lombok From Jawa Tengah", "Id_Provinsi": 13, "Id_Motif": 14},  
    {"Predicted_Label": "Motif Jambu Belimbing From Jawa Tengah", "Id_Provinsi": 13, "Id_Motif": 15},  
    {"Predicted_Label": "Motif Jambu Citra From Jawa Tengah", "Id_Provinsi": 13, "Id_Motif": 16},  
    {"Predicted_Label": "Motif Jlamprang From Jawa Tengah", "Id_Provinsi": 13, "Id_Motif": 17},  
    {"Predicted_Label": "Motif Kembang Sepatu From Jawa Tengah", "Id_Provinsi": 13, "Id_Motif": 18},  
    {"Predicted_Label": "Motif Laut From Jawa Tengah", "Id_Provinsi": 13, "Id_Motif": 19},  
    {"Predicted_Label": "Motif Lurik Semangka From Jawa Tengah", "Id_Provinsi": 13, "Id_Motif": 20},  
    {"Predicted_Label": "Motif Masjid Agung Demak From Jawa Tengah", "Id_Provinsi": 13, "Id_Motif": 21},  
    {"Predicted_Label": "Motif Naga From Jawa Tengah", "Id_Provinsi": 13, "Id_Motif": 22},  
    {"Predicted_Label": "Motif Parang Kusumo From Jawa Tengah", "Id_Provinsi": 13, "Id_Motif": 23},  
    {"Predicted_Label": "Motif Parang Slobog From Jawa Tengah", "Id_Provinsi": 13, "Id_Motif": 24},  
    {"Predicted_Label": "Motif Semarangan From Jawa Tengah", "Id_Provinsi": 13, "Id_Motif": 5},  
    {"Predicted_Label": "Motif Sidoluhur From Jawa Tengah", "Id_Provinsi": 13, "Id_Motif": 1},  
    {"Predicted_Label": "Motif Tebu Bambu From Jawa Tengah", "Id_Provinsi": 13, "Id_Motif": 25},  
    {"Predicted_Label": "Motif Tembakau From Jawa Tengah", "Id_Provinsi": 13, "Id_Motif": 26},  
    {"Predicted_Label": "Motif Truntum From Jawa Tengah", "Id_Provinsi": 13, "Id_Motif": 27},  
    {"Predicted_Label": "Motif Tugu Muda From Jawa Tengah", "Id_Provinsi": 13, "Id_Motif": 4},  
    {"Predicted_Label": "Motif Warak Beras Utah From Jawa Tengah", "Id_Provinsi": 13, "Id_Motif": 3},  
    {"Predicted_Label": "Motif Yuyu From Jawa Tengah", "Id_Provinsi": 13, "Id_Motif": 28},  
    {"Predicted_Label": "Motif Madura Gentongan From Jawa Timur", "Id_Provinsi": 5, "Id_Motif": 2},  
    {"Predicted_Label": "Motif Pring From Jawa Timur", "Id_Provinsi": 5, "Id_Motif": 1},  
    {"Predicted_Label": "Motif Insang From Kalimantan Barat", "Id_Provinsi": 6, "Id_Motif": 1},  
    {"Predicted_Label": "Motif Dayak From Kalimantan Tengah", "Id_Provinsi": 7, "Id_Motif": 1},  
    {"Predicted_Label": "Motif Bledheg From Lampung", "Id_Provinsi": 8, "Id_Motif": 2},  
    {"Predicted_Label": "Motif Gajah From Lampung", "Id_Provinsi": 8, "Id_Motif": 1},  
    {"Predicted_Label": "Motif Kacang Hijau From Lampung", "Id_Provinsi": 8, "Id_Motif": 3},  
    {"Predicted_Label": "Motif Pala From Maluku", "Id_Provinsi": 9, "Id_Motif": 1},  
    {"Predicted_Label": "Motif Lumbung From NTB", "Id_Provinsi": 10, "Id_Motif": 1},  
    {"Predicted_Label": "Motif Asmat From Papua Barat", "Id_Provinsi": 11, "Id_Motif": 1},  
    {"Predicted_Label": "Motif Cendrawasih From Papua", "Id_Provinsi": 12, "Id_Motif": 1},  
    {"Predicted_Label": "Motif Tifa From Papua", "Id_Provinsi": 12, "Id_Motif": 2},  
    {"Predicted_Label": "Motif Lontara From Sulawesi Selatan", "Id_Provinsi": 14, "Id_Motif": 1},  
    {"Predicted_Label": "Motif Rumah Minang From Sumatera Barat", "Id_Provinsi": 15, "Id_Motif": 1},  
    {"Predicted_Label": "Motif Boraspati From Sumatera Utara", "Id_Provinsi": 16, "Id_Motif": 1},  
    {"Predicted_Label": "Motif Pintu Aceh From Aceh", "Id_Provinsi": 1, "Id_Motif": 1},  
    {"Predicted_Label": "Motif Kawung From Yogyakarta", "Id_Provinsi": 17, "Id_Motif": 1},  
    {"Predicted_Label": "Motif Parang Curigo From Yogyakarta", "Id_Provinsi": 17, "Id_Motif": 3},  
    {"Predicted_Label": "Motif Parang Rusak From Yogyakarta", "Id_Provinsi": 17, "Id_Motif": 4},  
    {"Predicted_Label": "Motif Parang Tuding From Yogyakarta", "Id_Provinsi": 17, "Id_Motif": 5}  
]

app = Flask(__name__)

def predict_label(img):
    i = np.asarray(img) / 255.0
    i = i.reshape(1, 224, 224, 3)
    pred = model.predict(i)
    
    # Get the index of the highest predicted class and the confidence
    pred_idx = np.argmax(pred)
    confidence = pred[0][pred_idx]  # Confidence of the predicted label
    
    result = labels[pred_idx]
    
    # Mengembalikan Predicted_Label, Id_Provinsi, Id_Motif, dan Confidence
    return {
        "predicted_label": result["Predicted_Label"],
        "id_provinsi": result["Id_Provinsi"],
        "id_motif": result["Id_Motif"],
        "confidence": float(confidence)  # Ensure the confidence is in float
    }

@app.route("/predict", methods=["POST"])
def predict():
    file = request.files.get('file')
    if file is None or file.filename == "":
        return jsonify({"error": "No file uploaded"}), 400

    # Membaca dan memproses gambar
    image_bytes = file.read()
    img = Image.open(io.BytesIO(image_bytes))
    img = img.resize((224, 224), Image.NEAREST)
    pred_label = predict_label(img)

    return jsonify(pred_label)

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=8080, debug=True)
