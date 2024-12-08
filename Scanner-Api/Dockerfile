# Menggunakan image Python 3.9 sebagai base image
FROM python:3.9-slim

# Set working directory
WORKDIR /app

# Menyimpan environment variable untuk host
ENV HOST 0.0.0.0

# Menyalin file requirements.txt ke dalam container
COPY requirements.txt .

# Menginstall dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Menyalin semua file aplikasi ke dalam container
COPY . .

# Menentukan port yang digunakan oleh aplikasi
EXPOSE 8080

# Menjalankan aplikasi menggunakan gunicorn (sesuaikan dengan file main.py dan nama aplikasi Flask)
CMD ["gunicorn", "-w", "2", "-b", "0.0.0.0:8080", "main:app"]
