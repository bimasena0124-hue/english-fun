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
                  @change="handleFileUpload"
                  class="file-input-hidden"
                />
                <label for="file-upload" class="file-input-label">
                  <span class="btn-browse">Browse...</span>
                  <span class="file-name">{{ selectedFileName || 'No file selected.' }}</span>
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
              {{ isUploading ? 'Uploading & Saving...' : 'Save New Topic & Level' }}
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

    <!-- 2. SECTION: STUDENT RANKINGS BY SPEED -->
    <div class="card card-section">
      <div class="leaderboard-title">
        <span class="trophy-icon">🏆</span>
        <h3>STUDENT RANKINGS (ALL RESPONSES)</h3>
        <span class="class-tag" v-if="selectedClassFilter">Class: {{ selectedClassFilter }}</span>
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
              <td>{{ item.rank }}</td>
              <td>{{ item.studentName }}</td>
              <td><span class="level-badge">{{ item.targetLevel }}</span></td>
              <td>{{ item.topic }}</td>
              <td>{{ item.responseTime }}</td>
              <td>{{ item.spokenAnswer }}</td>
              <td>{{ item.fluency }}</td>
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
        <h3 class="log-title">Interaction Log:</h3>
        <span class="class-tag" v-if="selectedClassFilter">Class: {{ selectedClassFilter }}</span>
      </div>
      <div class="log-container">
        <div v-for="(log, idx) in logs" :key="idx" class="log-bubble">
          {{ log }}
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
import { collection, addDoc, deleteDoc, doc, onSnapshot, query, orderBy, where, serverTimestamp, setDoc } from 'firebase/firestore'
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
        expectedAnswers: '', // State untuk menyimpan input jawaban dari guru
        selectedFile: null
      },
      topicsList: [],
      studentRankings: [],
      logs: [],
      unsubscribeLogs: null,
      unsubscribeRankings: null
    }
  },
  mounted() {
    // 1. Fetch Topics & Extract Available Levels for Filter
    const qTopics = query(collection(db, 'topics'), orderBy('createdAt', 'desc'))
    onSnapshot(qTopics, (snapshot) => {
      this.topicsList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }))
    })

    // Fetch daftar level/kelas dari Firestore
    const qLevels = query(collection(db, 'levels'), orderBy('name', 'asc'))
    onSnapshot(qLevels, (snapshot) => {
      this.availableLevels = snapshot.docs.map(doc => doc.data().name || doc.id)
    })

    // 2. Setup Realtime Listeners untuk Logs & Rankings
    this.setupRealtimeListeners()
  },
  beforeUnmount() {
    if (this.unsubscribeLogs) this.unsubscribeLogs()
    if (this.unsubscribeRankings) this.unsubscribeRankings()
  },
  methods: {
    setupRealtimeListeners() {
      if (this.unsubscribeLogs) this.unsubscribeLogs()
      if (this.unsubscribeRankings) this.unsubscribeRankings()

      // --- 1. Listener Interaction Logs ---
      let logsRef = collection(db, 'logs')
      let qLogs

      if (this.selectedClassFilter) {
        qLogs = query(
          logsRef,
          where('targetLevel', '==', this.selectedClassFilter),
          orderBy('createdAt', 'desc')
        )
      } else {
        qLogs = query(logsRef, orderBy('createdAt', 'desc'))
      }

      this.unsubscribeLogs = onSnapshot(qLogs, (snapshot) => {
        if (!snapshot.empty) {
          this.logs = snapshot.docs.map(doc => {
            const data = doc.data()
            return data.message || `[${data.targetLevel || 'No Class'}] [${data.studentName || 'Unknown'}] Q: "${data.question || '-'}" -> Answer: "${data.spokenAnswer || '-'}" (${data.responseTime || '0s'})`
          })
        } else {
          this.logs = []
        }
      })

      // --- 2. Listener Rankings ---
      let qRankings

      if (this.selectedClassFilter) {
        qRankings = query(
          logsRef,
          where('targetLevel', '==', this.selectedClassFilter),
          orderBy('responseTimeNum', 'asc')
        )
      } else {
        qRankings = query(logsRef, orderBy('responseTimeNum', 'asc'))
      }

      this.unsubscribeRankings = onSnapshot(qRankings, (snapshot) => {
        if (!snapshot.empty) {
          this.studentRankings = snapshot.docs.map((doc, index) => {
            const data = doc.data()
            return {
              rank: index + 1,
              studentName: data.studentName || '-',
              targetLevel: data.targetLevel || '-',
              topic: data.topic || '-',
              responseTime: data.responseTime || '-',
              spokenAnswer: data.spokenAnswer || '-',
              fluency: `Score: ${data.spellingScore || 0}%`
            }
          })
        } else {
          this.studentRankings = []
        }
      })
    },

    async logout() {
      try {
        await signOut(auth)
        this.$router.push('/login')
      } catch (err) {
        console.error('Logout error:', err)
      }
    },

    handleFileUpload(event) {
      const file = event.target.files[0]
      this.selectedFileName = file ? file.name : ''
      this.formData.selectedFile = file || null
    },

    convertFileToBase64(file) {
      return new Promise((resolve, reject) => {
        const reader = new FileReader()
        reader.readAsDataURL(file)
        reader.onload = () => resolve(reader.result)
        reader.onerror = (error) => reject(error)
      })
    },

    async saveTopic() {
      if (!this.formData.targetLevel.trim()) {
        alert('Isi Target Level Name terlebih dahulu!')
        return
      }

      if (!this.formData.topicTitle.trim()) {
        alert('Isi Topic Title terlebih dahulu!')
        return
      }

      this.isUploading = true

      try {
        let imageUrl = ''
        if (this.formData.selectedFile) {
          imageUrl = await this.convertFileToBase64(this.formData.selectedFile)
        }

        // Split pertanyaan berdasarkan ';'
        const questionsArray = this.formData.questions
          .split(';')
          .map(q => q.trim())
          .filter(q => q !== '')

        // Split jawaban guru berdasarkan ';'
        const expectedAnswersArray = this.formData.expectedAnswers
          .split(';')
          .map(a => a.trim())
          .filter(a => a !== '')

        const levelName = this.formData.targetLevel.trim()

        // 1. Simpan/Update Level di Firestore
        await setDoc(doc(db, 'levels', levelName), {
          name: levelName,
          createdAt: serverTimestamp()
        }, { merge: true })

        // 2. Simpan Topik beserta Questions dan Expected Answers
        await addDoc(collection(db, 'topics'), {
          title: this.formData.topicTitle,
          questions: questionsArray,
          expectedAnswers: expectedAnswersArray,
          targetLevel: levelName,
          startDateTime: this.formData.startDateTime,
          dueDateTime: this.formData.dueDateTime,
          aiVoice: this.formData.aiVoice,
          imageUrl: imageUrl,
          createdAt: serverTimestamp()
        })

        alert(`Topik "${this.formData.topicTitle}" dan kunci jawaban berhasil tersimpan!`)
        this.clearForm()
      } catch (err) {
        console.error('Error menyimpan topik:', err)
        alert('Gagal menyimpan data ke Firestore.')
      } finally {
        this.isUploading = false
      }
    },

    async deleteTopic(id, title) {
      if (confirm(`Hapus topik "${title}"?`)) {
        try {
          await deleteDoc(doc(db, 'topics', id))
        } catch (err) {
          console.error(err)
          alert('Gagal menghapus topik.')
        }
      }
    },

    clearForm() {
      this.formData.topicTitle = ''
      this.formData.questions = ''
      this.formData.expectedAnswers = ''
      this.selectedFileName = ''
      this.formData.selectedFile = null
    },

    speakText(text) {
      if ('speechSynthesis' in window && text) {
        window.speechSynthesis.cancel()
        const utterance = new SpeechSynthesisUtterance(text)
        utterance.lang = this.formData.aiVoice || 'en-US'
        utterance.rate = 0.9
        window.speechSynthesis.speak(utterance)
      } else {
        alert('Fitur pemutar suara tidak didukung browser ini.')
      }
    },

    speakAllQuestions(questionsArray) {
      if (!questionsArray || questionsArray.length === 0) return
      const fullText = questionsArray.join('. ')
      this.speakText(fullText)
    }
  }
}
</script>

<style scoped>
.teacher-container {
  width: 100%;
  max-width: 1100px;
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
  background-color: #ffffff;
  padding: 12px 20px;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.05);
}

.auth-status { font-size: 14px; font-weight: 600; color: #166534; }

.btn-logout {
  background-color: #ef4444; color: #ffffff; border: none;
  padding: 8px 16px; border-radius: 6px; font-weight: 600;
  cursor: pointer; transition: background 0.2s;
}
.btn-logout:hover { background-color: #dc2626; }

.card {
  background-color: #ffffff; border-radius: 12px;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.04); overflow: hidden;
}
.card-setup { border-left: 6px solid #d97706; }
.card-section { padding: 20px 24px; }

.card-header {
  display: flex; align-items: center; padding: 18px 24px;
  cursor: pointer; user-select: none; background-color: #ffffff;
}
.accordion-arrow { color: #d97706; font-size: 12px; margin-right: 8px; }
.header-icon { font-size: 18px; margin-right: 8px; }
.header-title { margin: 0; font-size: 18px; font-weight: 700; color: #c2410c; }

.card-body { padding: 0 24px 24px 24px; }
.form-group { margin-bottom: 16px; }
.form-row { display: flex; gap: 20px; }
.col { flex: 1; }

.mt-10 { margin-top: 10px; }
.mt-15 { margin-top: 15px; }
.mt-20 { margin-top: 20px; }

.form-label { display: block; font-size: 15px; font-weight: 700; color: #034078; margin-bottom: 8px; }
.sub-label { display: block; font-size: 13px; font-weight: 600; color: #475569; margin-bottom: 4px; }

.form-input, .form-select {
  width: 100%; height: 42px; padding: 8px 14px; font-size: 14px;
  color: #1f2937; background-color: #ffffff; border: 1px solid #d1d5db;
  border-radius: 8px; box-sizing: border-box; outline: none;
}
.form-select { background-color: #f3f4f6; }
.input-answer { border-color: #86efac; background-color: #f0fdf4; }

.filter-card {
  background-color: #ffffff; padding: 14px 20px; border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.04); border-left: 4px solid #0077b6;
}
.filter-group { display: flex; align-items: center; gap: 12px; }
.filter-label { font-weight: 700; color: #0077b6; font-size: 14px; white-space: nowrap; }
.filter-select { max-width: 300px; background-color: #ffffff; border-color: #0077b6; }

.file-input-wrapper { width: 100%; }
.file-input-hidden { display: none; }
.file-input-label {
  display: flex; align-items: center; height: 42px; padding: 0 10px;
  border: 1px solid #d1d5db; border-radius: 8px; background-color: #ffffff;
  cursor: pointer; box-sizing: border-box;
}
.btn-browse {
  background-color: #f3f4f6; border: 1px solid #d1d5db; padding: 4px 10px;
  border-radius: 4px; font-size: 13px; color: #1f2937; margin-right: 10px;
}
.file-name { font-size: 14px; color: #374151; }

.divider { border-bottom: 1px dashed #fcd34d; margin: 20px 0; }

.btn {
  display: inline-flex; align-items: center; justify-content: center;
  height: 46px; padding: 0 20px; font-size: 15px; font-weight: 700;
  color: #ffffff; border: none; border-radius: 8px; cursor: pointer;
}
.btn-icon { margin-right: 8px; font-size: 16px; }
.btn-warning { background-color: #d97706; }

.preview-section {
  background-color: #f8fafc; border: 1px solid #e2e8f0;
  border-radius: 10px; padding: 16px;
}
.preview-title { margin: 0 0 12px 0; font-size: 15px; font-weight: 700; color: #034078; }
.empty-preview { font-size: 13px; color: #64748b; font-style: italic; }

.topic-list { display: flex; flex-direction: column; gap: 12px; }
.topic-card { background-color: #ffffff; border: 1px solid #cbd5e1; border-radius: 8px; padding: 12px 16px; }
.topic-header {
  display: flex; justify-content: space-between; align-items: center;
  margin-bottom: 8px; padding-bottom: 8px; border-bottom: 1px solid #f1f5f9;
}
.topic-info { display: flex; align-items: center; gap: 10px; }
.action-buttons { display: flex; gap: 8px; }

.topic-badge { font-weight: 700; font-size: 15px; color: #0077b6; }
.level-badge {
  font-size: 11px; background-color: #fe2e0e1a; color: #c2410c;
  padding: 2px 8px; border-radius: 12px; font-weight: 600;
}

.btn-voice-small {
  background-color: #e0f2fe; color: #0284c7; border: 1px solid #7dd3fc;
  padding: 4px 10px; border-radius: 6px; font-size: 12px; font-weight: 600; cursor: pointer;
}
.btn-voice-small:hover { background-color: #0284c7; color: #ffffff; }

.btn-delete-small {
  background-color: #fee2e2; color: #dc2626; border: 1px solid #fca5a5;
  padding: 4px 10px; border-radius: 6px; font-size: 12px; font-weight: 600; cursor: pointer;
}
.btn-delete-small:hover { background-color: #dc2626; color: #ffffff; }

.question-label { margin: 0 0 4px 0; font-size: 12px; font-weight: 600; color: #64748b; }
.question-ol { margin: 0; padding-left: 20px; font-size: 13px; color: #334155; }
.question-item { margin-bottom: 8px; }

.q-and-a { display: flex; flex-direction: column; gap: 2px; }
.q-text { color: #1e293b; }
.a-text { font-size: 12px; color: #15803d; margin-top: 2px; }

.btn-speak-single {
  background: transparent; border: none; cursor: pointer; font-size: 13px;
  margin-left: 6px; padding: 2px 4px; border-radius: 4px;
}
.btn-speak-single:hover { background-color: #e2e8f0; }

.leaderboard-title { display: flex; align-items: center; gap: 8px; margin-bottom: 16px; }
.leaderboard-title h3 { margin: 0; font-size: 16px; font-weight: 800; color: #003049; }
.class-tag { background-color: #e0f2fe; color: #0369a1; padding: 4px 10px; border-radius: 6px; font-size: 12px; font-weight: 700; }

.table-responsive { width: 100%; overflow-x: auto; }
.leaderboard-table { width: 100%; border-collapse: collapse; }
.leaderboard-table th {
  background-color: #0077b6; color: #ffffff; font-size: 14px;
  font-weight: 700; padding: 12px 16px; text-align: left;
}
.leaderboard-table td { padding: 12px 16px; font-size: 14px; border-bottom: 1px solid #f0f0f0; }
.empty-table { text-align: center; color: #9ca3af; padding: 20px !important; }

.log-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px; }
.log-title { margin: 0; font-size: 16px; font-weight: 800; color: #003049; }
.log-container {
  background-color: #f8fafc; border-radius: 8px; padding: 16px;
  display: flex; flex-direction: column; gap: 10px; max-height: 350px; overflow-y: auto;
}
.log-bubble { background-color: #e0e7ff; color: #1e3a8a; padding: 12px 18px; border-radius: 8px; font-size: 14px; }
.empty-log { background-color: #f1f5f9; color: #64748b; font-style: italic; text-align: center; }

@media (max-width: 768px) {
  .form-row { flex-direction: column; gap: 12px; }
  .filter-group { flex-direction: column; align-items: flex-start; }
  .filter-select { max-width: 100%; }
}
</style>