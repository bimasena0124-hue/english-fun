<template>
  <div class="admin-layout">
    <!-- SIDEBAR / NAVIGASI ADMIN -->
    <aside class="admin-sidebar" :class="{ 'sidebar-open': mobileMenuOpen }">
      <div class="brand">
        <div class="brand-icon">EF</div>
        <div>
          <h2>English Fun</h2>
          <span>Admin Dashboard</span>
        </div>
      </div>

      <nav class="admin-nav">
        <button :class="['nav-item', activeSection === 'dashboard' ? 'active' : '']"
                @click="setSection('dashboard')">
          <span>📊</span><span>Dashboard</span>
        </button>
        <button :class="['nav-item', activeSection === 'topics' ? 'active' : '']"
                @click="setSection('topics')">
          <span>📚</span><span>Kelola Topik</span>
        </button>
        <button :class="['nav-item', activeSection === 'logs' ? 'active' : '']"
                @click="setSection('logs')">
          <span>📝</span><span>Aktivitas Siswa</span>
        </button>
        <button :class="['nav-item', activeSection === 'ranking' ? 'active' : '']"
                @click="setSection('ranking')">
          <span>🏆</span><span>Ranking Siswa</span>
        </button>
        <button class="nav-item" @click="$router.push('/student')">
          <span>🎓</span><span>Area Siswa</span>
        </button>
      </nav>

      <div class="sidebar-bottom">
        <div class="admin-user">
          <div class="user-avatar">A</div>
          <div>
            <strong>Administrator</strong>
            <small>Teacher Access</small>
          </div>
        </div>
        <button @click="logout" class="logout-side">🚪 Logout</button>
      </div>
    </aside>

    <!-- AREA UTAMA -->
    <main class="admin-main">
      <div class="mobile-header">
        <button class="menu-button" @click="mobileMenuOpen = !mobileMenuOpen">☰</button>
        <strong>English Fun</strong>
        <button class="mobile-logout" @click="logout">🚪</button>
      </div>

      <header class="page-header">
        <div>
          <p class="eyebrow">ADMIN PANEL</p>
          <h1>{{ sectionTitle }}</h1>
          <p class="page-subtitle">{{ sectionSubtitle }}</p>
        </div>
        <div class="header-actions">
          <button class="header-btn" @click="setSection('ranking')">🏆 Ranking</button>
          <button class="header-btn primary" @click="setSection('topics')">+ Tambah Topik</button>
        </div>
      </header>

      <!-- DASHBOARD -->
      <section v-if="activeSection === 'dashboard'" class="section-content">
        <div class="stats-grid">
          <div class="stat-card">
            <div class="stat-icon">📚</div>
            <div><span class="stat-value">{{ topicsList.length }}</span><span class="stat-label">Total Topik</span></div>
          </div>
          <div class="stat-card">
            <div class="stat-icon">🏫</div>
            <div><span class="stat-value">{{ availableLevels.length }}</span><span class="stat-label">Kelas Aktif</span></div>
          </div>
          <div class="stat-card">
            <div class="stat-icon">👥</div>
            <div><span class="stat-value">{{ uniqueStudentCount }}</span><span class="stat-label">Siswa Aktif</span></div>
          </div>
          <div class="stat-card">
            <div class="stat-icon">💬</div>
            <div><span class="stat-value">{{ logs.length }}</span><span class="stat-label">Aktivitas Terekam</span></div>
          </div>
        </div>

        <div class="dashboard-grid">
          <div class="panel quick-panel">
            <div class="panel-heading">
              <div><h2>Akses Cepat</h2><p>Kelola aplikasi tanpa membuka banyak halaman.</p></div>
            </div>
            <div class="quick-actions">
              <button @click="setSection('topics')" class="quick-action">
                <span class="quick-icon blue">📚</span>
                <span><strong>Kelola Topik</strong><small>Tambah, lihat, dan hapus materi latihan.</small></span>
                <b>›</b>
              </button>
              <button @click="setSection('logs')" class="quick-action">
                <span class="quick-icon green">📝</span>
                <span><strong>Aktivitas Siswa</strong><small>Pantau interaksi siswa secara realtime.</small></span>
                <b>›</b>
              </button>
              <button @click="setSection('ranking')" class="quick-action">
                <span class="quick-icon orange">🏆</span>
                <span><strong>Ranking Siswa</strong><small>Lihat hasil dan peringkat berdasarkan kelas.</small></span>
                <b>›</b>
              </button>
              <button @click="$router.push('/student')" class="quick-action">
                <span class="quick-icon purple">🎓</span>
                <span><strong>Preview Area Siswa</strong><small>Cek tampilan belajar dari sisi siswa.</small></span>
                <b>›</b>
              </button>
            </div>
          </div>

          <div class="panel summary-panel">
            <div class="panel-heading">
              <div><h2>Ringkasan Kelas</h2><p>Kelas yang tersedia di sistem.</p></div>
            </div>
            <div v-if="availableLevels.length" class="class-list">
              <div v-for="level in availableLevels" :key="level" class="class-row">
                <span class="class-dot"></span>
                <span>{{ level }}</span>
                <small>Aktif</small>
              </div>
            </div>
            <div v-else class="empty-state">Belum ada kelas.</div>
          </div>
        </div>

        <div class="panel recent-panel">
          <div class="panel-heading">
            <div><h2>Informasi Sistem</h2><p>Data diperbarui otomatis dari Firebase.</p></div>
            <span class="live-badge">● REALTIME</span>
          </div>
          <div class="info-grid">
            <div><strong>{{ topicsList.length }}</strong><span>Topik tersimpan</span></div>
            <div><strong>{{ availableLevels.length }}</strong><span>Kelas tersedia</span></div>
            <div><strong>{{ logs.length }}</strong><span>Aktivitas terbaru</span></div>
          </div>
        </div>
      </section>

      <!-- KELOLA TOPIK -->
      <section v-if="activeSection === 'topics'" class="section-content">
        <div class="panel">
          <div class="panel-heading">
            <div>
              <h2>Tambah Topik Baru</h2>
              <p>Masukkan kelas, waktu, pertanyaan, dan jawaban target.</p>
            </div>
            <button class="collapse-btn" @click="isExpanded = !isExpanded">
              {{ isExpanded ? 'Sembunyikan Form' : 'Tampilkan Form' }}
            </button>
          </div>

          <div v-show="isExpanded" class="topic-form">
            <div class="form-grid">
              <div class="form-group">
                <label>Class Name</label>
                <input v-model="formData.targetLevel" type="text" class="form-input" placeholder="e.g. Grade 1 Elementary" />
              </div>
              <div class="form-group">
                <label>AI Voice</label>
                <select v-model="formData.aiVoice" class="form-select">
                  <option value="en-US">English (United States)</option>
                  <option value="en-GB">English (United Kingdom)</option>
                </select>
              </div>
              <div class="form-group">
                <label>Start Date & Time</label>
                <input v-model="formData.startDateTime" type="datetime-local" class="form-input" />
              </div>
              <div class="form-group">
                <label>Due Date & Time</label>
                <input v-model="formData.dueDateTime" type="datetime-local" class="form-input" />
              </div>
              <div class="form-group full">
                <label>Topic Title</label>
                <input v-model="formData.topicTitle" type="text" class="form-input" placeholder="e.g. Dolphin" />
              </div>
              <div class="form-group full">
                <label>Image</label>
                <div class="file-input-wrapper">
                  <input type="file" id="file-upload-admin" accept="image/*" @change="handleFileUpload" class="file-input-hidden" />
                  <label for="file-upload-admin" class="file-input-label">
                    <span class="btn-browse">Browse</span>
                    <span class="file-name">{{ selectedFileName || 'No file selected (Max 1MB).' }}</span>
                  </label>
                </div>
              </div>
              <div class="form-group full">
                <label>Questions <small>(pisahkan dengan ;)</small></label>
                <textarea v-model="formData.questions" class="form-input textarea" placeholder="What animal is this?; Where does it live?"></textarea>
              </div>
              <div class="form-group full">
                <label>Expected Answers <small>(pisahkan dengan ;)</small></label>
                <textarea v-model="formData.expectedAnswers" class="form-input textarea" placeholder="It is a dolphin; It lives in the ocean"></textarea>
              </div>
            </div>
            <button class="save-btn" :disabled="isUploading" @click="saveTopic">
              {{ isUploading ? 'Menyimpan...' : '＋ Simpan Topik & Kelas' }}
            </button>
          </div>
        </div>

        <div class="panel">
          <div class="panel-heading">
            <div><h2>Daftar Topik</h2><p>{{ topicsList.length }} topik tersimpan.</p></div>
          </div>
          <div v-if="topicsList.length === 0" class="empty-state">Belum ada topik tersimpan di database.</div>
          <div v-else class="topic-list">
            <div v-for="topic in topicsList" :key="topic.id" class="topic-card">
              <div class="topic-card-top">
                <div>
                  <h3>{{ topic.title }}</h3>
                  <span class="level-badge">{{ topic.targetLevel }}</span>
                </div>
                <div class="topic-actions">
                  <button class="small-btn voice" @click="speakAllQuestions(topic.questions)">🔊 Baca</button>
                  <button class="small-btn danger" @click="deleteTopic(topic.id, topic.title)">🗑 Hapus</button>
                </div>
              </div>
              <div v-if="topic.imageUrl" class="topic-image-preview">
                <img :src="topic.imageUrl" alt="Topic Image Preview" />
              </div>
              <details class="question-details">
                <summary>Lihat {{ topic.questions?.length || 0 }} pertanyaan & jawaban</summary>
                <ol>
                  <li v-for="(q, index) in topic.questions" :key="index">
                    <div class="q-text"><strong>Q:</strong> "{{ q }}"
                      <button class="mini-speak" @click.prevent="speakText(q)">🔊</button>
                    </div>
                    <div v-if="topic.expectedAnswers && topic.expectedAnswers[index]" class="a-text">
                      <strong>Answer:</strong> "{{ topic.expectedAnswers[index] }}"
                    </div>
                  </li>
                </ol>
              </details>
            </div>
          </div>
        </div>
      </section>

      <!-- RANKING SISWA -->
      <section v-if="activeSection === 'ranking'" class="section-content">
        <div class="panel ranking-panel">
          <div class="panel-heading">
            <div>
              <h2>Ranking Siswa</h2>
              <p>Peringkat siswa berdasarkan hasil latihan yang tersimpan di Firebase.</p>
            </div>
          </div>
          <Ranking :embedded="true" />
        </div>
      </section>

      <!-- MONITORING -->
      <section v-if="activeSection === 'logs'" class="section-content">
        <div class="panel filter-panel">
          <div class="filter-left">
            <label>Filter Kelas</label>
            <select v-model="selectedClassFilter" @change="setupRealtimeListeners" class="form-select">
              <option value="">Semua Kelas</option>
              <option v-for="lvl in availableLevels" :key="lvl" :value="lvl">{{ lvl }}</option>
            </select>
          </div>
          <button class="danger-btn" @click="clearLogsData" :disabled="logs.length === 0">🗑 Hapus Log</button>
        </div>

        <div class="panel">
          <div class="panel-heading">
            <div><h2>Aktivitas Siswa</h2><p>Monitoring aktivitas siswa secara realtime.</p></div>
            <span class="live-badge">● REALTIME</span>
          </div>
          <div class="log-list">
            <div v-for="(log, idx) in logs" :key="idx" class="log-item">
              <div class="log-avatar">👤</div>
              <div class="log-content">
                <strong>{{ log.studentName || 'Student' }}</strong>
                <span>{{ log.message || log }}</span>
              </div>
              <small>{{ log.targetLevel || '-' }}</small>
            </div>
            <div v-if="logs.length === 0" class="empty-state">Belum ada aktivitas interaksi dari siswa di kelas ini.</div>
          </div>
        </div>
      </section>
    </main>
  </div>
</template>

<script>
import { db, auth } from '@/firebase'
import { 
  collection, 
  addDoc, 
  deleteDoc, 
  doc, 
  onSnapshot, 
  query, 
  orderBy, 
  where, 
  serverTimestamp, 
  setDoc, 
  getDocs 
} from 'firebase/firestore'
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'
import { signOut } from 'firebase/auth'

import Ranking from './Ranking.vue'

export default {
  name: 'AdminDashboard',
  components: {
    Ranking
  },
  data() {
    return {
      activeSection: 'dashboard',
      mobileMenuOpen: false,
      isExpanded: true,
      selectedFileName: '',
      isUploading: false,
      selectedClassFilter: '',
      availableLevels: [],
      formData: {
        targetLevel: 'Grade 1 Elementary',
        startDateTime: '',
        dueDateTime: '',
        aiVoice: 'en-US',
        topicTitle: '',
        questions: '',
        expectedAnswers: '',
        imageBase64: ''
      },
      topicsList: [],
      logs: [],
      unsubscribeLogs: null,
    }
  },
  computed: {
    uniqueStudentCount() {
      const names = this.logs
        .map(log => log && log.studentName)
        .filter(Boolean)
      return new Set(names).size
    }
  },
  mounted() {
    // 1. Fetch Topics
    const qTopics = query(collection(db, 'topics'), orderBy('createdAt', 'desc'))
    onSnapshot(qTopics, (snapshot) => {
      this.topicsList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }))
    })

    // 2. Fetch Levels
    const qLevels = query(collection(db, 'levels'), orderBy('createdAt', 'asc'))
    onSnapshot(qLevels, (snapshot) => {
      this.availableLevels = snapshot.docs.map(doc => doc.data().name || doc.id)
    })

    // 3. Setup realtime log & ranking listener
    this.setupRealtimeListeners()
  },
  unmounted() {
    if (this.unsubscribeLogs) this.unsubscribeLogs()
  },
  methods: {
    setSection(section) {
      this.activeSection = section
      this.mobileMenuOpen = false
      window.scrollTo({ top: 0, behavior: 'smooth' })
    },
    handleFileUpload(event) {
      const file = event.target.files[0]
      if (file) {
        if (file.size > 1024 * 1024) {
          alert('File gambar terlalu besar! Maksimal ukuran file adalah 1MB.')
          event.target.value = ''
          this.formData.imageBase64 = ''
          this.selectedFileName = ''
          return
        }

        const reader = new FileReader()
        reader.onload = (e) => {
          this.formData.imageBase64 = e.target.result
          this.selectedFileName = file.name
        }
        reader.readAsDataURL(file)
      }
    },

    async saveTopic() {
      if (!this.formData.topicTitle || !this.formData.questions) {
        alert('Please complete the Topic Title and Questions fields.')
        return
      }

      try {
        this.isUploading = true

        const questionsArray = this.formData.questions
          .split(';')
          .map(q => q.trim())
          .filter(q => q !== '')

        const expectedAnswersArray = this.formData.expectedAnswers
          .split(';')
          .map(a => a.trim())
          .filter(a => a !== '')

        await addDoc(collection(db, 'topics'), {
          targetLevel: this.formData.targetLevel,
          title: this.formData.topicTitle,
          aiVoice: this.formData.aiVoice,
          startDateTime: this.formData.startDateTime,
          dueDateTime: this.formData.dueDateTime,
          questions: questionsArray,
          expectedAnswers: expectedAnswersArray,
          imageUrl: this.formData.imageBase64 || '',
          createdAt: serverTimestamp()
        })

        await setDoc(doc(db, 'levels', this.formData.targetLevel), {
          name: this.formData.targetLevel,
          createdAt: serverTimestamp()
        }, { merge: true })

        alert('Topic and Level successfully saved!')

        this.formData.topicTitle = ''
        this.formData.questions = ''
        this.formData.expectedAnswers = ''
        this.formData.imageBase64 = ''
        this.selectedFileName = ''
      } catch (error) {
        console.error('Error saving topic:', error)
        alert('Failed to save topic: ' + error.message)
      } finally {
        this.isUploading = false
      }
    },

    async deleteTopic(id, title) {
      const topicToDelete = this.topicsList.find(t => t.id === id)
      if (!topicToDelete) return

      const targetLevel = topicToDelete.targetLevel

      if (confirm(`Are you sure you want to delete topic "${title}"?`)) {
        try {
          await deleteDoc(doc(db, 'topics', id))

          const q = query(collection(db, 'topics'), where('targetLevel', '==', targetLevel))
          const remainingTopics = await getDocs(q)

          if (remainingTopics.empty) {
            await deleteDoc(doc(db, 'levels', targetLevel))
          }
        } catch (err) {
          console.error('Failed to delete topic & level:', err)
        }
      }
    },

    async clearLogsData() {
      const targetText = this.selectedClassFilter 
        ? `kelas "${this.selectedClassFilter}"` 
        : 'SEMUA KELAS'

      if (!confirm(`Apakah Anda yakin ingin menghapus semua data ranking & log untuk ${targetText}? Data yang dihapus tidak bisa dikembalikan.`)) {
        return
      }

      try {
        let logsQuery

        if (this.selectedClassFilter) {
          logsQuery = query(
            collection(db, 'logs'), 
            where('targetLevel', '==', this.selectedClassFilter)
          )
        } else {
          logsQuery = query(collection(db, 'logs'))
        }

        const snapshot = await getDocs(logsQuery)

        if (snapshot.empty) {
          alert('Tidak ada data log yang bisa dihapus.')
          return
        }

        const deletePromises = snapshot.docs.map(document => 
          deleteDoc(doc(db, 'logs', document.id))
        )

        await Promise.all(deletePromises)

        alert(`Berhasil mereset data ranking dan log untuk ${targetText}!`)
      } catch (error) {
        console.error('Error clearing logs:', error)
        alert('Gagal menghapus data log: ' + error.message)
      }
    },

    speakText(text) {
      if ('speechSynthesis' in window && text) {
        window.speechSynthesis.cancel()
        const utterance = new SpeechSynthesisUtterance(text)
        utterance.lang = this.formData.aiVoice || 'en-US'
        window.speechSynthesis.speak(utterance)
      }
    },

    speakAllQuestions(questions) {
      if (!questions || !questions.length) return
      const text = questions.join('. ')
      this.speakText(text)
    },

    setupRealtimeListeners() {
      if (this.unsubscribeLogs) this.unsubscribeLogs()

      let logsQuery

      if (this.selectedClassFilter) {
        logsQuery = query(
          collection(db, 'logs'),
          where('targetLevel', '==', this.selectedClassFilter),
          orderBy('createdAt', 'desc')
        )
      } else {
        logsQuery = query(collection(db, 'logs'), orderBy('createdAt', 'desc'))
      }

      this.unsubscribeLogs = onSnapshot(logsQuery, (snapshot) => {
        this.logs = snapshot.docs.map(doc => doc.data())
      })

    },


    async logout() {
      try {
        await signOut(auth)
        this.$router.push('/login')
      } catch (err) {
        console.error('Logout error:', err)
      }
    }
  }
}
</script>
