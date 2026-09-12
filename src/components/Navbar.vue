<template>
  <nav class="navbar">

    <!-- KIRI : LOGO -->
    <div class="navbar-logo">
      <div class="logo-circle">
        🌊
      </div>
    </div>

    <!-- TENGAH : NAMA APLIKASI -->
    <div class="navbar-title">
      <h1>AI Ocean English Station</h1>
    </div>

    <!-- KANAN : TOMBOL IKON 3 TITIK / GARIS (Khusus HP) -->
    <button class="mobile-menu-icon" @click="isMenuOpen = !isMenuOpen" aria-label="Menu Toggle">
      <!-- Opsi A: Ikon 3 Titik (Vertikal) -->
      <span class="dots-icon">&#8942;</span>
      
      <!-- Opsi B: Jika ingin 3 garis biasa, hapus baris di atas dan aktifkan baris di bawah ini: -->
      <!-- <span class="lines-icon">&#9776;</span> -->
    </button>

    <!-- KANAN : MENU -->
    <div class="navbar-menu" :class="{ 'is-active': isMenuOpen }">
      <router-link to="/student" @click="isMenuOpen = false">
        Student
      </router-link>

      <router-link to="/teacher" @click="isMenuOpen = false">
        Teacher
      </router-link>
    </div>

  </nav>
</template>

<script>
export default {
  name: 'Navbar',
  data() {
    return {
      isMenuOpen: false // Menyimbal status buka/tutup menu di HP
    }
  }
}
</script>

<style scoped>
/* =========================
   GAYA DASAR (DESKTOP)
========================= */
.navbar {
  width: 100%;
  height: 70px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  position: relative;
  padding: 0 30px;
  background: #0A3641;
  box-sizing: border-box;
}

.navbar-logo {
  display: flex;
  align-items: center;
  justify-content: flex-start;
  z-index: 1002;
}

.logo-circle {
  width: 45px;
  height: 45px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background: #00B4D8;
  font-size: 24px;
}

.navbar-title {
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1001;
}

.navbar-title h1 {
  margin: 0;
  color: white;
  font-size: 22px;
  font-weight: 600;
  text-align: center;
}

/* Tombol Ikon 3 Titik/Garis (Sembunyi di Laptop/Desktop) */
.mobile-menu-icon {
  display: none;
  background: transparent;
  border: none;
  color: white;
  font-size: 28px;
  cursor: pointer;
  padding: 0 5px;
  line-height: 1;
  z-index: 1002;
}

/* Menu Navigasi (Desktop) */
.navbar-menu {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: 20px;
  z-index: 1002;
}

.navbar-menu a {
  padding: 8px 14px;
  color: white;
  text-decoration: none;
  border-radius: 6px;
  font-size: 15px;
  transition: 0.2s;
}

.navbar-menu a:hover {
  background: #0077B6;
}

.navbar-menu a.router-link-active {
  background: #00B4D8;
  color: white;
}

/* =========================
   RESPONSIVE (HP / MOBILE)
========================= */
@media (max-width: 768px) {
  .navbar {
    height: 60px;
    padding: 0 15px;
  }

  /* Penyesuaian ukuran judul di HP agar tidak melimpah */
  .navbar-title h1 {
    font-size: 14px;
  }

  .logo-circle {
    width: 36px;
    height: 36px;
    font-size: 18px;
  }

  /* Tampilkan Tombol 3 Titik di HP */
  .mobile-menu-icon {
    display: block;
  }

  /* Ubah Menu Menjadi Dropdown saat Layar HP */
  .navbar-menu {
    position: absolute;
    top: 60px; /* Tepat di bawah navbar */
    left: 0;
    width: 100%;
    background: #0A3641;
    flex-direction: column;
    align-items: stretch;
    gap: 0;
    padding: 10px 0;
    border-top: 1px solid rgba(255, 255, 255, 0.1);
    box-shadow: 0 8px 16px rgba(0, 0, 0, 0.3);
    
    /* Sembunyikan menu secara default */
    display: none;
  }

  /* Tampilkan Menu saat Tombol 3 Titik Diklik */
  .navbar-menu.is-active {
    display: flex;
  }

  .navbar-menu a {
    padding: 14px 20px;
    border-radius: 0;
    font-size: 16px;
    text-align: center;
    min-height: 48px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  }
}
</style>