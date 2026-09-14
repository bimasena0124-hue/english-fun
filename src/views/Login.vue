<template>
  <div class="login-wrapper">
    <div class="login-card">
      <h2>{{ isRegisterMode ? 'Teacher Register' : 'Teacher Access' }}</h2>

      <form @submit.prevent="handleSubmit">
        <!-- Input Username -->
        <div class="form-group">
          <label>Username</label>
          <input 
            v-model="fullName" 
            type="text" 
            placeholder="Masukkan username (tanpa spasi)" 
            required 
          />
        </div>

        <!-- Input Password -->
        <div class="form-group">
          <label>Password</label>
          <input 
            v-model="password" 
            type="password" 
            placeholder="Masukkan 6 karakter atau lebih" 
            required 
          />
        </div>

        <!-- Input Kode Verifikasi (Hanya Tampil Saat Mode Register) -->
        <div class="form-group" v-if="isRegisterMode">
          <label>Teacher Verification Code</label>
          <input 
            v-model="verificationCode" 
            type="text" 
            placeholder="Masukkan 6 digit kode guru" 
            required 
          />
        </div>

        <!-- Tombol Submit -->
        <button type="submit" :disabled="isLoading">
          {{ isLoading ? 'Processing...' : (isRegisterMode ? 'Register' : 'Login') }}
        </button>
      </form>

      <!-- Toggle Switch Mode Login / Register -->
      <div class="toggle-mode">
        <span v-if="!isRegisterMode">
          Belum punya akun? 
          <a @click.prevent="toggleMode(true)" href="#">Daftar di sini</a>
        </span>
        <span v-else>
          Sudah punya akun? 
          <a @click.prevent="toggleMode(false)" href="#">Login di sini</a>
        </span>
      </div>
    </div>
  </div>
</template>

<script>
import { auth, db } from '@/firebase'
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, updateProfile } from 'firebase/auth'
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore'

export default {
  name: 'Login',
  data() {
    return {
      fullName: '',
      password: '',
      verificationCode: '',
      isRegisterMode: false,
      isLoading: false
    }
  },
  methods: {
    generateDummyEmail(name) {
      const cleanName = name.trim().toLowerCase()
      return `${cleanName}@teacher.local`
    },

    toggleMode(isRegister) {
      this.isRegisterMode = isRegister
      this.verificationCode = ''
    },

    async handleSubmit() {
      // 1. Validasi Input Kosong & Spasi
      if (!this.fullName.trim()) {
        alert('Silakan masukkan username!')
        return
      }

      if (/\s/.test(this.fullName)) {
        alert('Username tidak boleh menggunakan spasi!')
        return
      }

      this.isLoading = true
      const generatedEmail = this.generateDummyEmail(this.fullName)

      try {
        if (this.isRegisterMode) {
          // 2. VALIDASI KODE VERIFIKASI DARI FIRESTORE
          const codeDocRef = doc(db, 'app_config', 'teacher_passcode')
          const codeDocSnap = await getDoc(codeDocRef)

          if (!codeDocSnap.exists()) {
            alert('Sistem belum dikonfigurasi. Kode verifikasi tidak ditemukan di Firestore!')
            this.isLoading = false
            return
          }

          const validCode = codeDocSnap.data().code

          if (this.verificationCode.trim() !== String(validCode)) {
            alert('Kode verifikasi guru salah! Akses registrasi ditolak.')
            this.isLoading = false
            return
          }

          // 3. PROSES REGISTRASI
          const userCredential = await createUserWithEmailAndPassword(auth, generatedEmail, this.password)
          const user = userCredential.user

          await updateProfile(user, {
            displayName: this.fullName
          })

          await setDoc(doc(db, 'teachers', user.uid), {
            uid: user.uid,
            name: this.fullName,
            internalEmail: generatedEmail,
            createdAt: serverTimestamp()
          })

          alert('Registrasi berhasil!')
        } else {
          // PROSES LOGIN
          await signInWithEmailAndPassword(auth, generatedEmail, this.password)
        }

        this.$router.push('/teacher')

      } catch (err) {
        if (err.code === 'auth/email-already-in-use') {
          alert('Username ini sudah terdaftar. Silakan login atau gunakan username lain.')
        } else if (err.code === 'auth/invalid-credential' || err.code === 'auth/user-not-found') {
          alert('Username atau Password salah!')
        } else {
          alert('Gagal: ' + err.message)
        }
      } finally {
        this.isLoading = false
      }
    }
  }
}
</script>

<style scoped>
.login-wrapper {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 70vh;
}
.login-card {
  width: 100%;
  max-width: 360px;
  padding: 30px;
  background: #ffffff;
  border-radius: 12px;
  box-shadow: 0 4px 15px rgba(0,0,0,0.1);
}
.login-card h2 {
  margin-top: 0;
  margin-bottom: 20px;
  color: #034078;
  text-align: center;
}
.form-group {
  margin-bottom: 15px;
}
.form-group label {
  display: block;
  font-weight: bold;
  margin-bottom: 5px;
  font-size: 14px;
}
.form-group input {
  width: 100%;
  padding: 10px;
  border: 1px solid #ccc;
  border-radius: 6px;
  box-sizing: border-box;
}
button {
  width: 100%;
  padding: 12px;
  background-color: #0284c7;
  color: white;
  border: none;
  border-radius: 6px;
  font-weight: bold;
  cursor: pointer;
  margin-top: 10px;
}
button:hover {
  background-color: #0369a1;
}
button:disabled {
  background-color: #94a3b8;
  cursor: not-allowed;
}
.toggle-mode {
  margin-top: 20px;
  text-align: center;
  font-size: 13px;
  color: #64748b;
}
.toggle-mode a {
  color: #0284c7;
  font-weight: bold;
  text-decoration: none;
}
.toggle-mode a:hover {
  text-decoration: underline;
}
</style>