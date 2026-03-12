import streamlit as st
import numpy as np
import matplotlib.pyplot as plt
import random
import math

# --- KONFIGURASI HALAMAN ---
st.set_page_config(page_title="Vector Academy", page_icon="🚀", layout="centered")

st.title("🚀 Vector Space Academy (Streamlit Edition)")
st.markdown("Mari belajar vektor dengan sistem markah terbina! Sesuaikan sudut dan kuasa enjin untuk sampai ke sasaran.")

# --- SISTEM MARKAH (GAMIFIKASI) ---
# Menggunakan 'session_state' untuk menyimpan markah dan tahap supaya tidak hilang bila halaman disegar semula.
if 'score' not in st.session_state:
    st.session_state.score = 0
if 'level' not in st.session_state:
    st.session_state.level = 1
if 'target_x' not in st.session_state:
    # Sasaran rawak untuk permulaan
    st.session_state.target_x = random.randint(2, 10)
    st.session_state.target_y = random.randint(-10, 10)

# Paparkan Status Pemain
col1, col2 = st.columns(2)
with col1:
    st.metric(label="Tahap Semasa", value=st.session_state.level)
with col2:
    st.metric(label="Markah Keseluruhan", value=f"{st.session_state.score} XP")

st.divider()

# --- INPUT PENGGUNA ---
st.subheader("Bilik Kawalan Kapal Angkasa")

# Dua cara untuk memberikan input:
# 1. Magnitud dan Arah (Polar)
# 2. Komponen X dan Y (Cartesian)
input_type = st.radio("Pilih Mod Kawalan:", ("Magnitud & Sudut", "Paksi X (i) & Y (j)"))

if input_type == "Magnitud & Sudut":
    magnitude = st.slider("Kuasa Enjin (Magnitud)", min_value=0.0, max_value=20.0, value=5.0, step=0.5)
    angle_deg = st.slider("Arah Berlepas (Darjah °)", min_value=0, max_value=360, value=45)
    
    # Tukar kepada X dan Y
    angle_rad = math.radians(angle_deg)
    user_x = magnitude * math.cos(angle_rad)
    user_y = magnitude * math.sin(angle_rad)
    
else:
    user_x = st.number_input("Paksi X (i)", min_value=-20.0, max_value=20.0, value=3.0)
    user_y = st.number_input("Paksi Y (j)", min_value=-20.0, max_value=20.0, value=4.0)

# --- VISUALISASI KANVAS ---
st.subheader("Radar Simulasi")

# Kita menggunakan Matplotlib untuk melukis graf
fig, ax = plt.subplots(figsize=(6, 6))

# Hadkan graf supaya sentiasa dalam skala yang sama
ax.set_xlim(-15, 15)
ax.set_ylim(-15, 15)
ax.grid(True, linestyle='--', alpha=0.6)
ax.axhline(0, color='black', linewidth=1)
ax.axvline(0, color='black', linewidth=1)

# Lukis Sasaran
target_x = st.session_state.target_x
target_y = st.session_state.target_y
ax.scatter(target_x, target_y, color='red', s=200, label='Zon Sasaran', marker='*')

# Lukis Vektor Pengguna
ax.quiver(0, 0, user_x, user_y, angles='xy', scale_units='xy', scale=1, color='blue', label='Trajektori Anda')

ax.legend()
st.pyplot(fig)

# --- LOGIK PERMAINAN CELAH (EVALUATION) ---
# Mengira jarak antara titik pengguna dan titik sasaran
jarak = math.sqrt((user_x - target_x)**2 + (user_y - target_y)**2)
toleransi = 1.5 # Sejauh mana ralat yang dibenarkan

if st.button("LANCARKAN KAPAL!", type="primary"):
    if jarak <= toleransi:
        st.success("Tepat pada sasaran! Misi Berjaya! 🎉")
        st.session_state.score += 100
        st.session_state.level += 1
        
        # Jana sasaran baru yang lebih susah (jauh sikit)
        st.session_state.target_x = random.randint(-12, 12)
        st.session_state.target_y = random.randint(-12, 12)
        
        st.rerun() # Refresh app untuk tunjuk sasaran baru & markah
    else:
        st.error(f"Tersasar! Jarak anda dari sasaran ialah {jarak:.2f} unit. Cuba sesuaikan nilai anda semula.")
        # Tolak sedikit markah jika mahu
        if st.session_state.score > 0:
            st.session_state.score -= 10
