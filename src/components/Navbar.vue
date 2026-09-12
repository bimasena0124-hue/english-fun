```vue
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

    <!-- KANAN : MENU -->
    <div class="navbar-menu">
      <router-link to="/student">
        Student
      </router-link>

      <router-link to="/teacher">
        Teacher
      </router-link>
    </div>

  </nav>
</template>

<script>
export default {
  name: 'Navbar'
}
</script>

<style scoped>
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

.navbar-title {
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  justify-content: center;
  align-items: center;
}

/* Untuk tampilan mobile di media query */


/* =========================
   LOGO
========================= */

.navbar-logo {
  display: flex;
  align-items: center;
  justify-content: flex-start;
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

/* =========================
   TITLE
========================= */


.navbar-title h1 {
  margin: 0;

  color: white;

  font-size: 22px;
  font-weight: 600;

  text-align: center;
}

/* =========================
   MENU
========================= */

.navbar-menu {
  display: flex;
  justify-content: flex-end;
  align-items: center;

  gap: 20px;
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
   RESPONSIVE
========================= */

@media (max-width: 700px) {
  .navbar {
    height: 60px;
    padding: 0 15px;
  }

  /* Jika di mobile judul terlalu panjang, kembalikan ke flex normal */
  .navbar-title {
    position: static;
    transform: none;
  }
}
</style>
```
