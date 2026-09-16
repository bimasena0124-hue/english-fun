<template>
  <div class="teacher-container">
    <!-- Tombol Logout & Header Status -->
    <div class="top-bar">
      <span class="auth-status">🟢 Logged in as Teacher</span>
      <button @click="logout" class="btn-logout">🚪 Logout</button>
    </div>

    <!-- 1. SECTION: TEACHER SETUP -->
    <div class="card card-setup">
      <!-- Header Accordion -->
      <div class="card-header" @click="isExpanded = !isExpanded">
        <span class="accordion-arrow">{{ isExpanded ? '▼' : '▶' }}</span>
        <span class="header-icon">⚙️</span>
        <h2 class="header-title">Teacher Setup & Topic Generator</h2>
      </div>

      <!-- Content / Form -->
      <div v-show="isExpanded" class="card-body">
        <!-- Target Level Name -->
        <div class="form-group">
          <label class="form-label">1. Class Name (Primary Key / Group):</label>
          <input
            v-model="formData.targetLevel"
            type="text"
            class="form-input"
            placeholder="e.g. Grade 1 Elementary / Beginner"
          />
        </div>

        <!-- Start Date & Due Date -->
        <div class="form-row">
          <div class="form-group col">
            <label class="form-label">2. Start Date & Time:</label>
            <input
              v-model="formData.startDateTime"
              type="datetime-local"
              class="form-input"
            />
          </div>
          <div class="form-group col">
            <label class="form-label">3. Due Date & Time:</label>
            <input
              v-model="formData.dueDateTime"
              type="datetime-local"
              class="form-input"
            />
          </div>
        </div>

        <!-- Select AI Voice -->
        <div class="form-group">
          <label class="form-label">4. Select AI Voice:</label>
          <select v-model="formData.aiVoice" class="form-select">
            <option value="en-US">English (United States) - Standard</option>
            <option value="en-GB">English (United Kingdom) - Standard</option>
          </select>
        </div>

        <div class="divider"></div>

        <!-- Manage Topics -->
        <div class="form-group">
          <label class="form-label">5. Manage Topics & Expected Answers:</label>
          
          <div class="form-row">
            <div class="col">
              <input
                v-model="formData.topicTitle"
                type="text"
                class="form-input"
                placeholder="Topic Title (e.g. Dolphin)"
              />
            </div>
            <div class="col">
              <div class="file-input-wrapper">
                <input
                  type="file"
                  id="file-upload"
                  accept="image/*"
                  @change="handleFileUpload"
                  class="file-input-hidden"
                />
                <label for="file-upload" class="file-input-label">
                  <span class="btn-browse">Browse...</span>
                  <span class="file-name">{{ selectedFileName || 'No file selected (Max 1MB).' }}</span>
                </label>
              </div>
            </div>
          </div>

          <!-- Input Pertanyaan -->
          <div class="form-group mt-10">
            <label class="sub-label">Questions (separated by semicolon ';'):</label>
            <input
              v-model="formData.questions"
              type="text"
              class="form-input"
              placeholder="e.g. What animal is this?; Where does it live?"
            />
          </div>

          <!-- Input Kunci Jawaban / Expected Answers dari Guru -->
          <div class="form-group mt-10">
            <label class="sub-label">Expected Answers / Target Answers (separated by semicolon ';'):</label>
            <input
              v-model="formData.expectedAnswers"
              type="text"
              class="form-input input-answer"
              placeholder="e.g. It is a dolphin; It lives in the ocean"
            />
          </div>

          <!-- Action Buttons -->
          <div class="form-row mt-15">
            <button 
              class="btn btn-warning col" 
              :disabled="isUploading" 
              @click="saveTopic"
            >
              <span class="btn-icon">+</span> 
              {{ isUploading ? 'Saving Topic...' : 'Save New Topic & Level' }}
            </button>
          </div>
        </div>

        <!-- AREA PREVIEW & HAPUS SOAL -->
        <div class="preview-section mt-20">
          <h3 class="preview-title">📋 Student Questions & Expected Answers Preview</h3>
          
          <div v-if="topicsList.length === 0" class="empty-preview">
            Belum ada topik tersimpan di database.
          </div>

          <div v-else class="topic-list">
            <div v-for="topic in topicsList" :key="topic.id" class="topic-card">
              <div class="topic-header">
                <div class="topic-info">
                  <span class="topic-badge">🐬 {{ topic.title }}</span>
                  <span class="level-badge">{{ topic.targetLevel }}</span>
                </div>
                <div class="action-buttons">
                  <button class="btn-voice-small" @click="speakAllQuestions(topic.questions)">
                    🔊 Read All Questions
                  </button>
                  <button class="btn-delete-small" @click="deleteTopic(topic.id, topic.title)">
                    🗑️ Delete Topic
                  </button>
                </div>
              </div>

              <!-- Preview Gambar (Base64 / URL) -->
              <div v-if="topic.imageUrl" class="topic-image-preview">
                <img :src="topic.imageUrl" alt="Topic Image Preview" />
              </div>

              <div class="topic-questions">
                <p class="question-label">Questions & Answer Key Preview:</p>
                <ol class="question-ol">
                  <li v-for="(q, index) in topic.questions" :key="index" class="question-item">
                    <div class="q-and-a">
                      <div class="q-text">
                        <strong>Q:</strong> "{{ q }}"
                        <button class="btn-speak-single" @click="speakText(q)" title="Play question audio">
                          🔊
                        </button>
                      </div>
                      <div class="a-text" v-if="topic.expectedAnswers && topic.expectedAnswers[index]">
                        <strong>Expected Answer:</strong> <em>"{{ topic.expectedAnswers[index] }}"</em>
                      </div>
                    </div>
                  </li>
                </ol>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>

    <!-- FILTER BAR UNTUK MONITORING KELAS -->
    <div class="filter-card">
      <div class="filter-group">
        <label class="filter-label">🎯 Filter by Class Name:</label>
        <select v-model="selectedClassFilter" @change="setupRealtimeListeners" class="form-select filter-select">
          <option value="">-- All Classes --</option>
          <option v-for="lvl in availableLevels" :key="lvl" :value="lvl">
            {{ lvl }}
          </option>
        </select>
      </div>
    </div>

    <!-- 2. SECTION: STUDENT RANKINGS -->
    <div class="card card-section">
      <div class="leaderboard-title">
        <div class="title-left">
          <span class="trophy-icon">🏆</span>
          <h3>STUDENT RANKINGS (ALL RESPONSES)</h3>
          <span class="class-tag" v-if="selectedClassFilter">Class: {{ selectedClassFilter }}</span>
        </div>
        <!-- Tombol Reset Rankings & Logs -->
        <button 
          class="btn-delete-small" 
          @click="clearLogsData" 
          :disabled="studentRankings.length === 0"
        >
          🗑️ Reset Rankings & Logs
        </button>
      </div>
      
      <div class="table-responsive">
        <table class="leaderboard-table">
          <thead>
            <tr>
              <th>Rank</th>
              <th>Student Name</th>
              <th>Class / Level</th>
              <th>Topic</th>
              <th>Response Time</th>
              <th>Spoken Answer</th>
              <th>Fluency & Evaluation</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(item, index) in studentRankings" :key="index">
              <td>{{ index + 1 }}</td>
              <td>{{ item.studentName }}</td>
              <td><span class="level-badge">{{ item.targetLevel }}</span></td>
              <td>{{ item.topic }}</td>
              <td>{{ item.responseTime }}</td>
              <td>{{ item.spokenAnswer }}</td>
              <td>
                <span :class="['score-badge', getScoreClass(item.spellingScore)]">
                  {{ item.spellingScore }}% Accuracy
                </span>
              </td>
            </tr>
            <tr v-if="studentRankings.length === 0">
              <td colspan="7" class="empty-table">No data available for this class.</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- 3. SECTION: INTERACTION LOG -->
    <div class="card card-section">
      <div class="log-header">
        <div class="title-left">
          <h3 class="log-title">Interaction Log:</h3>
          <span class="class-tag" v-if="selectedClassFilter">Class: {{ selectedClassFilter }}</span>
        </div>
        <!-- Tombol Reset Log -->
        <button 
          class="btn-delete-small" 
          @click="clearLogsData" 
          :disabled="logs.length === 0"
        >
          🗑️ Clear Logs
        </button>
      </div>
      <div class="log-container">
        <div v-for="(log, idx) in logs" :key="idx" class="log-bubble">
          {{ log.message || log }}
        </div>
        <div v-if="logs.length === 0" class="log-bubble empty-log">
          Belum ada aktivitas interaksi dari siswa di kelas ini.
        </div>
      </div>
    </div>

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

export default {
  name: 'Teacher',
  data() {
    return {
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
      studentRankings: [],
      logs: [],
      unsubscribeLogs: null,
      unsubscribeRankings: null
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
    if (this.unsubscribeRankings) this.unsubscribeRankings()
  },
  methods: {
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
      if (this.unsubscribeRankings) this.unsubscribeRankings()

      let logsQuery
      let rankingsQuery

      if (this.selectedClassFilter) {
        logsQuery = query(
          collection(db, 'logs'),
          where('targetLevel', '==', this.selectedClassFilter),
          orderBy('createdAt', 'desc')
        )
        rankingsQuery = query(
          collection(db, 'logs'),
          where('targetLevel', '==', this.selectedClassFilter),
          orderBy('responseTimeNum', 'asc')
        )
      } else {
        logsQuery = query(collection(db, 'logs'), orderBy('createdAt', 'desc'))
        rankingsQuery = query(collection(db, 'logs'), orderBy('responseTimeNum', 'asc'))
      }

      this.unsubscribeLogs = onSnapshot(logsQuery, (snapshot) => {
        this.logs = snapshot.docs.map(doc => doc.data())
      })

      this.unsubscribeRankings = onSnapshot(rankingsQuery, (snapshot) => {
        this.studentRankings = snapshot.docs.map(doc => doc.data())
      })
    },

    getScoreClass(score) {
      if (score >= 85) return 'badge-success'
      if (score >= 70) return 'badge-warning'
      return 'badge-danger'
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

<style scoped>
.teacher-container {
  width: 100%;
  max-width: 900px;
  margin: 20px auto;
  padding: 0 15px;
  box-sizing: border-box;
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.top-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background-color: #1e293b;
  color: white;
  padding: 12px 20px;
  border-radius: 8px;
}
.auth-status { font-weight: 600; font-size: 14px; }
.btn-logout {
  background-color: #ef4444; color: white; border: none;
  padding: 6px 12px; border-radius: 6px; cursor: pointer; font-weight: bold;
}

.card {
  background-color: #ffffff;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.05);
}

.card-header {
  display: flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
  user-select: none;
}
.accordion-arrow { color: #64748b; font-size: 14px; }
.header-icon { font-size: 20px; }
.header-title { margin: 0; font-size: 18px; color: #0f172a; flex: 1; }

.card-body { margin-top: 20px; }
.form-group { margin-bottom: 16px; }
.form-label { display: block; font-weight: 700; font-size: 14px; color: #334155; margin-bottom: 6px; }
.sub-label { display: block; font-weight: 600; font-size: 13px; color: #64748b; margin-bottom: 4px; }

.form-input, .form-select {
  width: 100%; height: 40px; padding: 0 12px;
  border-radius: 6px; border: 1px solid #cbd5e1; outline: none; box-sizing: border-box;
}
.form-input:focus, .form-select:focus { border-color: #0077b6; }
.input-answer { border-color: #86efac; background-color: #f0fdf4; }

.form-row { display: flex; gap: 12px; flex-wrap: wrap; }
.col { flex: 1; min-width: 200px; }

.file-input-wrapper { position: relative; }
.file-input-hidden { display: none; }
.file-input-label {
  display: flex; align-items: center; border: 1px solid #cbd5e1;
  border-radius: 6px; height: 40px; cursor: pointer; overflow: hidden;
}
.btn-browse {
  background-color: #e2e8f0; padding: 0 12px; height: 100%;
  display: flex; align-items: center; font-size: 13px; font-weight: 600; color: #334155;
}
.file-name { padding: 0 12px; font-size: 13px; color: #64748b; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

.divider { height: 1px; background-color: #e2e8f0; margin: 20px 0; }

.btn {
  height: 42px; border: none; border-radius: 6px; font-weight: bold;
  cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 8px;
}
.btn-warning { background-color: #f59e0b; color: white; }
.btn-warning:hover { background-color: #d97706; }
.btn:disabled { opacity: 0.6; cursor: not-allowed; }

.preview-section { background-color: #f8fafc; padding: 16px; border-radius: 8px; border: 1px solid #e2e8f0; }
.preview-title { margin: 0 0 12px 0; font-size: 15px; color: #334155; }
.empty-preview { font-size: 13px; color: #94a3b8; font-style: italic; }

.topic-list { display: flex; flex-direction: column; gap: 12px; }
.topic-card { background-color: #ffffff; border: 1px solid #cbd5e1; border-radius: 8px; padding: 12px 16px; }
.topic-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; }
.topic-badge { font-weight: 700; color: #0077b6; }
.level-badge { background-color: #e0f2fe; color: #0369a1; padding: 2px 8px; border-radius: 12px; font-size: 11px; font-weight: 700; }

.topic-image-preview { margin: 10px 0; }
.topic-image-preview img { max-width: 150px; max-height: 120px; object-fit: cover; border-radius: 6px; border: 1px solid #cbd5e1; }

.action-buttons { display: flex; gap: 6px; }
.btn-voice-small, .btn-delete-small, .btn-speak-single {
  border: none; padding: 4px 8px; border-radius: 4px; font-size: 12px; cursor: pointer; font-weight: 600;
}
.btn-voice-small { background-color: #e0f2fe; color: #0369a1; }
.btn-delete-small { background-color: #fee2e2; color: #991b1b; }
.btn-delete-small:disabled { opacity: 0.5; cursor: not-allowed; }
.btn-speak-single { background-color: transparent; font-size: 14px; }

.question-label { font-size: 12px; font-weight: 700; color: #64748b; margin: 0 0 6px 0; }
.question-ol { margin: 0; padding-left: 20px; font-size: 13px; color: #334155; }
.question-item { margin-bottom: 6px; }
.q-and-a { display: flex; flex-direction: column; gap: 2px; }
.a-text { color: #15803d; font-size: 12px; }

.filter-card { background-color: #f1f5f9; padding: 12px 16px; border-radius: 8px; }
.filter-group { display: flex; align-items: center; gap: 12px; }
.filter-label { font-weight: 700; font-size: 14px; color: #334155; white-space: nowrap; }
.filter-select { max-width: 250px; background-color: white; }

.leaderboard-title, .log-header { 
  display: flex; 
  justify-content: space-between; 
  align-items: center; 
  margin-bottom: 16px; 
}
.title-left { display: flex; align-items: center; gap: 8px; }
.leaderboard-title h3, .log-title { margin: 0; font-size: 16px; color: #0f172a; }
.class-tag { font-size: 12px; font-weight: 700; background-color: #f1f5f9; padding: 2px 8px; border-radius: 4px; color: #475569; }

.table-responsive { overflow-x: auto; }
.leaderboard-table { width: 100%; border-collapse: collapse; font-size: 13px; }
.leaderboard-table th { background-color: #f8fafc; text-align: left; padding: 10px; color: #475569; border-bottom: 2px solid #e2e8f0; }
.leaderboard-table td { padding: 10px; border-bottom: 1px solid #e2e8f0; color: #334155; }
.empty-table { text-align: center; color: #94a3b8; padding: 20px !important; }

.score-badge { padding: 2px 8px; border-radius: 4px; font-weight: 700; font-size: 11px; }
.badge-success { background-color: #dcfce7; color: #15803d; }
.badge-warning { background-color: #fef9c3; color: #a16207; }
.badge-danger { background-color: #fee2e2; color: #b91c1c; }

.log-container { background-color: #0f172a; border-radius: 8px; padding: 16px; max-height: 250px; overflow-y: auto; display: flex; flex-direction: column; gap: 8px; }
.log-bubble { font-family: monospace; font-size: 12px; color: #38bdf8; line-height: 1.4; }
.empty-log { color: #64748b; font-style: italic; }

.mt-10 { margin-top: 10px; }
.mt-15 { margin-top: 15px; }
.mt-20 { margin-top: 20px; }
</style>