<template>
  <div class="student-container">
    <!-- Header Station -->
    <div class="card header-card">
      <div class="user-info">
        <label for="student-name-input">Student Name:</label>
        <input 
          id="student-name-input"
          v-model="studentName" 
          type="text" 
          placeholder="Enter your name..." 
          class="name-input"
          :disabled="isFinished"
        />
      </div>
    </div>

    <!-- Completion Screen (Tanda Pengerjaan Selesai) -->
    <div class="card completion-card" v-if="isFinished">
      <div class="completion-icon">🏆</div>
      <h2>Awesome Job, {{ studentName }}!</h2>
      <p class="completion-subtitle">You have completed all questions in this topic.</p>
      
      <div class="score-box">
        <div class="score-title">Average Pronunciation Score</div>
        <div class="score-value">{{ averagePronunciationScore }}%</div>
        <div class="score-detail">Completed: {{ Object.keys(answersLog).length }} / {{ currentTopic?.questions?.length || 0 }} Questions</div>
      </div>

      <button class="btn btn-primary mt-20" @click="restartPractice">
        🔄 Try Again
      </button>
    </div>

    <!-- Active Topic & Question Card -->
    <div class="card main-card" v-else-if="currentTopic">
      <!-- Active Topic Header dengan Dropdown Level & Topic -->
      <div class="topic-header">
        <!-- 1. Dropdown Pilih Target Level -->
        <div class="select-group">
          <label for="level-select">🎯 Class:</label>
          <select 
            id="level-select" 
            v-model="selectedLevel" 
            @change="onLevelChange"
            class="dropdown-select"
          >
            <option v-for="lvl in availableLevels" :key="lvl.id || lvl" :value="lvl.name || lvl">
              {{ lvl.name || lvl }}
            </option>
          </select>
        </div>

        <!-- 2. Dropdown Pilih Topik (Filtered by Level) -->
        <div class="select-group" v-if="filteredTopics.length > 0">
          <label for="topic-select">📌 Topic:</label>
          <select 
            id="topic-select" 
            v-model="selectedTopicId" 
            @change="onTopicChange"
            class="dropdown-select"
          >
            <option v-for="topic in filteredTopics" :key="topic.id" :value="topic.id">
              {{ topic.title }}
            </option>
          </select>
        </div>
      </div>

      <!-- Display Image if Available -->
      <div v-if="currentTopic.imageUrl" class="image-wrapper">
        <img :src="currentTopic.imageUrl" alt="Topic Image" class="topic-image" />
      </div>

      <!-- Current Question Box -->
      <div class="question-box">
        <h3>Question {{ currentQuestionIndex + 1 }} of {{ currentTopic.questions.length }}:</h3>
        <p class="question-text">"{{ currentQuestion }}"</p>
        
        <button class="btn-replay" @click="speakQuestion(currentQuestion)">
          🔊 Listen Again
        </button>
      </div>

      <!-- Recording / Answering Section -->
      <div class="answer-section">
        <button 
          :class="['btn-mic', isListening ? 'recording' : '']" 
          @click="toggleListening"
          :disabled="!studentName.trim()"
        >
          <span class="mic-icon">{{ isListening ? '⏹️' : '🎙️' }}</span>
          {{ isListening ? 'Listening... (Click to Stop)' : 'Click to Answer (Speak)' }}
        </button>
        <p v-if="!studentName.trim()" class="warning-text">⚠️ Please enter your name first to answer.</p>

        <!-- Live Preview Transcribed Text & Pronunciation Evaluation -->
        <div class="transcript-box mt-15">
          <label>Your Spoken Answer (Live Preview):</label>
          <p class="transcript-text">{{ spokenText || 'Your speech will appear here...' }}</p>
          
          <!-- Indikator Skor Ejaan & Pengucapan -->
          <div v-if="evaluationResult" :class="['eval-badge', getScoreClass(evaluationResult.score)]">
            <div class="score-header">
              <span>Pronunciation / Spelling Score: <strong>{{ evaluationResult.score }}%</strong></span>
              <span class="status-tag">{{ getScoreStatus(evaluationResult.score) }}</span>
            </div>
            <small v-if="expectedAnswer">Target Text: "{{ expectedAnswer }}"</small>
          </div>
        </div>

        <!-- Navigation & Finish Buttons -->
        <div class="action-row mt-20">
          <button 
            class="btn btn-secondary" 
            @click="prevQuestion" 
            :disabled="currentQuestionIndex === 0"
          >
            ◀ Previous
          </button>
          
          <button 
            v-if="isLastQuestion"
            class="btn btn-success" 
            @click="finishSession"
            :disabled="!hasAnsweredCurrent"
          >
            Finish 🎉
          </button>
          <button 
            v-else
            class="btn btn-primary" 
            @click="nextQuestion"
          >
            Next ▶
          </button>
        </div>
      </div>
    </div>

    <!-- Empty State jika belum ada topik pada level terpilih -->
    <div v-else class="card empty-card">
      <div class="select-group-empty">
        <label for="level-select-empty">🎯 Select Class:</label>
        <select 
          id="level-select-empty" 
          v-model="selectedLevel" 
          @change="onLevelChange"
          class="dropdown-select"
        >
          <option v-for="lvl in availableLevels" :key="lvl.id || lvl" :value="lvl.name || lvl">
            {{ lvl.name || lvl }}
          </option>
        </select>
      </div>
      <p class="empty-text">⏳ No topics available for level: <strong>{{ selectedLevel }}</strong></p>
    </div>
  </div>
</template>

<script>
import { db } from '@/firebase'
import { collection, addDoc, onSnapshot, query, orderBy, serverTimestamp } from 'firebase/firestore'

export default {
  name: 'Student',
  data() {
    return {
      studentName: '',
      topicsList: [],
      availableLevels: [],
      selectedLevel: '',
      currentTopic: null,
      selectedTopicId: '',
      currentQuestionIndex: 0,
      spokenText: '',
      isListening: false,
      recognition: null,
      startTime: null,
      
      evaluationResult: null,
      answersLog: {},
      isFinished: false
    }
  },
  computed: {
    // Memfilter topik berdasarkan targetLevel yang sedang dipilih siswa
    filteredTopics() {
      return this.topicsList.filter(t => t.targetLevel === this.selectedLevel)
    },
    currentQuestion() {
      if (!this.currentTopic || !this.currentTopic.questions) return ''
      return this.currentTopic.questions[this.currentQuestionIndex] || ''
    },
    expectedAnswer() {
      if (!this.currentTopic || !this.currentTopic.answerKeys) return ''
      return this.currentTopic.answerKeys[this.currentQuestionIndex] || ''
    },
    isLastQuestion() {
      if (!this.currentTopic || !this.currentTopic.questions) return false
      return this.currentQuestionIndex === this.currentTopic.questions.length - 1
    },
    hasAnsweredCurrent() {
      return !!this.answersLog[this.currentQuestionIndex]
    },
    averagePronunciationScore() {
      const logs = Object.values(this.answersLog)
      if (logs.length === 0) return 0
      const total = logs.reduce((acc, item) => acc + item.score, 0)
      return Math.round(total / logs.length)
    }
  },
  mounted() {
    this.fetchLevels()
    this.fetchTopics()
    this.initSpeechRecognition()
  },
  methods: {
    // 1. Fetch Level dari Firestore secara Realtime
    fetchLevels() {
      const q = query(collection(db, 'levels'), orderBy('createdAt', 'asc'))
      onSnapshot(q, (snapshot) => {
        if (!snapshot.empty) {
          this.availableLevels = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
          if (!this.selectedLevel && this.availableLevels.length > 0) {
            this.selectedLevel = this.availableLevels[0].name
          }
        }
      })
    },

    // 2. Fetch Topik dari Firestore secara Realtime
    fetchTopics() {
      const q = query(collection(db, 'topics'), orderBy('createdAt', 'desc'))
      onSnapshot(q, (snapshot) => {
        if (!snapshot.empty) {
          this.topicsList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
          this.updateTopicSelection()
        }
      })
    },

    onLevelChange() {
      this.updateTopicSelection()
    },

    onTopicChange() {
      const foundTopic = this.filteredTopics.find(t => t.id === this.selectedTopicId)
      if (foundTopic) {
        this.currentTopic = foundTopic
        this.resetState()
        this.$nextTick(() => {
          if (this.currentQuestion) {
            this.speakQuestion(this.currentQuestion)
          }
        })
      }
    },

    updateTopicSelection() {
      if (this.filteredTopics.length > 0) {
        this.currentTopic = this.filteredTopics[0]
        this.selectedTopicId = this.currentTopic.id
        this.resetState()
        
        this.$nextTick(() => {
          if (this.currentQuestion) {
            this.speakQuestion(this.currentQuestion)
          }
        })
      } else {
        this.currentTopic = null
        this.selectedTopicId = ''
      }
    },

    speakQuestion(text) {
      if ('speechSynthesis' in window && text) {
        window.speechSynthesis.cancel()
        const utterance = new SpeechSynthesisUtterance(text)
        utterance.lang = this.currentTopic?.aiVoice || 'en-US'
        utterance.rate = 0.85
        window.speechSynthesis.speak(utterance)
      }
    },

    initSpeechRecognition() {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
      if (SpeechRecognition) {
        this.recognition = new SpeechRecognition()
        this.recognition.continuous = true
        this.recognition.interimResults = true
        this.recognition.lang = 'en-US'

        this.recognition.onresult = (event) => {
          let transcript = ''
          for (let i = event.resultIndex; i < event.results.length; i++) {
            transcript += event.results[i][0].transcript
          }
          this.spokenText = transcript
        }

        this.recognition.onerror = (event) => {
          if (event.error === 'no-speech') {
            console.warn('Tidak ada suara terdeteksi.')
          } else {
            console.error('Speech recognition error:', event.error)
          }
          this.isListening = false
        }

        this.recognition.onend = () => {
          if (this.isListening) {
            this.isListening = false
            this.evaluateAndSaveAnswer()
          }
        }
      }
    },

    toggleListening() {
      if (!this.recognition) {
        alert('Browser kamu belum mendukung Speech Recognition gunakan browser lain')
        return
      }

      if (this.isListening) {
        this.recognition.stop()
        this.isListening = false
        this.evaluateAndSaveAnswer()
      } else {
        this.spokenText = ''
        this.evaluationResult = null
        this.startTime = Date.now()
        this.recognition.start()
        this.isListening = true
      }
    },

    getLevenshteinDistance(a, b) {
      const matrix = Array.from({ length: a.length + 1 }, () => [])
      for (let i = 0; i <= a.length; i++) matrix[i][0] = i
      for (let j = 0; j <= b.length; j++) matrix[0][j] = j

      for (let i = 1; i <= a.length; i++) {
        for (let j = 1; j <= b.length; j++) {
          const cost = a[i - 1] === b[j - 1] ? 0 : 1
          matrix[i][j] = Math.min(
            matrix[i - 1][j] + 1,      
            matrix[i][j - 1] + 1,      
            matrix[i - 1][j - 1] + cost 
          )
        }
      }
      return matrix[a.length][b.length]
    },

    calculateSpellingScore(spoken, target) {
      if (!target || !spoken) return 100

      const cleanSpoken = spoken.toLowerCase().replace(/[^a-z0-9 ]/g, '').trim()
      const cleanTarget = target.toLowerCase().replace(/[^a-z0-9 ]/g, '').trim()

      if (cleanSpoken === cleanTarget) return 100

      const distance = this.getLevenshteinDistance(cleanSpoken, cleanTarget)
      const maxLength = Math.max(cleanSpoken.length, cleanTarget.length)

      const similarityRatio = (1 - distance / maxLength) * 100
      return Math.max(0, Math.round(similarityRatio))
    },

    async evaluateAndSaveAnswer() {
      if (!this.spokenText.trim() || !this.studentName.trim()) return

      const numericDuration = parseFloat(((Date.now() - this.startTime) / 1000).toFixed(1))
      const responseTimeFormatted = `${numericDuration}s`
      
      const targetForEval = this.expectedAnswer || this.currentQuestion
      const score = this.calculateSpellingScore(this.spokenText, targetForEval)
      const isCorrect = score >= 75
      
      this.evaluationResult = { score, isCorrect }

      this.answersLog[this.currentQuestionIndex] = {
        question: this.currentQuestion,
        spokenAnswer: this.spokenText,
        score: score,
        isCorrect: isCorrect,
        duration: numericDuration
      }

      const logMessage = `[${this.studentName}] Level: "${this.selectedLevel}" | Topic: "${this.currentTopic.title}" | Q: "${this.currentQuestion}" -> Answer: "${this.spokenText}" (${responseTimeFormatted})`

      try {
        await addDoc(collection(db, 'logs'), {
          message: logMessage,
          studentName: this.studentName,
          targetLevel: this.selectedLevel,
          topic: this.currentTopic.title,
          question: this.currentQuestion,
          spokenAnswer: this.spokenText,
          expectedAnswer: this.expectedAnswer || '-',
          spellingScore: score,
          isCorrect: isCorrect,
          responseTime: responseTimeFormatted,
          responseTimeNum: numericDuration,
          createdAt: serverTimestamp()
        })
      } catch (err) {
        console.error('Gagal mengirim log:', err)
      }
    },

    getScoreClass(score) {
      if (score >= 85) return 'score-excellent'
      if (score >= 70) return 'score-good'
      return 'score-poor'
    },

    getScoreStatus(score) {
      if (score >= 85) return '🌟 Excellent Pronunciation!'
      if (score >= 70) return '👍 Good Pronunciation'
      return '❌ Needs Practice'
    },

    nextQuestion() {
      if (!this.isLastQuestion) {
        this.currentQuestionIndex++
        this.loadSavedQuestionState()
      }
    },

    prevQuestion() {
      if (this.currentQuestionIndex > 0) {
        this.currentQuestionIndex--
        this.loadSavedQuestionState()
      }
    },

    loadSavedQuestionState() {
      const saved = this.answersLog[this.currentQuestionIndex]
      if (saved) {
        this.spokenText = saved.spokenAnswer
        this.evaluationResult = { score: saved.score, isCorrect: saved.isCorrect }
      } else {
        this.spokenText = ''
        this.evaluationResult = null
      }
      this.speakQuestion(this.currentQuestion)
    },

    finishSession() {
      this.isFinished = true
    },

    restartPractice() {
      this.resetState()
      if (this.currentQuestion) {
        this.speakQuestion(this.currentQuestion)
      }
    },

    resetState() {
      this.currentQuestionIndex = 0
      this.spokenText = ''
      this.evaluationResult = null
      this.answersLog = {}
      this.isFinished = false
    }
  }
}
</script>

<style scoped>
.student-container {
  width: 100%;
  max-width: 800px;
  margin: 20px auto;
  padding: 0 15px;
  box-sizing: border-box;
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.card {
  background-color: #ffffff;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.05);
}

.header-card { background-color: #0077b6; color: white; }
.user-info { display: flex; align-items: center; gap: 12px; }
.user-info label { font-weight: bold; }
.name-input {
  flex: 1; height: 40px; padding: 0 12px;
  border-radius: 6px; border: none; outline: none; font-size: 14px;
}

.topic-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  flex-wrap: wrap;
  gap: 12px;
  background-color: #f0f9ff;
  padding: 12px 16px;
  border-radius: 8px;
}

.select-group, .select-group-empty {
  display: flex;
  align-items: center;
  gap: 8px;
}

.select-group label, .select-group-empty label {
  font-weight: 700;
  font-size: 14px;
  color: #0369a1;
  white-space: nowrap;
}

.dropdown-select {
  padding: 8px 12px;
  border-radius: 8px;
  border: 2px solid #e0f2fe;
  background-color: #ffffff;
  font-size: 14px;
  font-weight: 600;
  color: #0f172a;
  outline: none;
  cursor: pointer;
  transition: all 0.2s ease;
}

.dropdown-select:focus {
  border-color: #0077b6;
}

.image-wrapper { text-align: center; margin-bottom: 16px; }
.topic-image { max-width: 100%; max-height: 250px; border-radius: 8px; object-fit: cover; }

.question-box {
  background-color: #f8fafc; border-left: 5px solid #0077b6;
  padding: 16px; border-radius: 6px; margin-bottom: 20px;
}
.question-box h3 { margin: 0 0 8px 0; color: #64748b; font-size: 14px; }
.question-text { margin: 0 0 12px 0; font-size: 18px; font-weight: 700; color: #0f172a; }

.btn-replay {
  background-color: #e2e8f0; border: none; padding: 6px 12px;
  border-radius: 6px; cursor: pointer; font-weight: 600; font-size: 13px; color: #334155;
}
.btn-replay:hover { background-color: #cbd5e1; }

.answer-section { display: flex; flex-direction: column; align-items: center; }

.btn-mic {
  width: 100%; height: 54px; background-color: #10b981; color: white;
  border: none; border-radius: 8px; font-size: 16px; font-weight: 700;
  cursor: pointer; display: flex; align-items: center; justify-content: center;
  gap: 10px; transition: background 0.2s;
}
.btn-mic.recording { background-color: #ef4444; animation: pulse 1.5s infinite; }
.btn-mic:disabled { background-color: #9ca3af; cursor: not-allowed; }

.warning-text { color: #dc2626; font-size: 12px; margin-top: 6px; }

.transcript-box {
  width: 100%; background-color: #f1f5f9; padding: 12px;
  border-radius: 8px; box-sizing: border-box;
}
.transcript-box label { font-size: 12px; font-weight: bold; color: #64748b; }
.transcript-text { margin: 4px 0 0 0; font-size: 15px; color: #1e293b; font-style: italic; }

.eval-badge {
  margin-top: 10px; padding: 10px 14px; border-radius: 8px;
  display: flex; flex-direction: column; gap: 4px; font-size: 13px;
}
.score-header { display: flex; justify-content: space-between; align-items: center; font-weight: bold; }

.score-excellent { background-color: #dcfce7; color: #15803d; border: 1px solid #86efac; }
.score-good { background-color: #fef9c3; color: #a16207; border: 1px solid #fde047; }
.score-poor { background-color: #fee2e2; color: #b91c1c; border: 1px solid #fca5a5; }

.action-row { display: flex; justify-content: space-between; width: 100%; }

.btn { padding: 10px 20px; border-radius: 6px; border: none; font-weight: bold; cursor: pointer; }
.btn-primary { background-color: #0077b6; color: white; }
.btn-secondary { background-color: #94a3b8; color: white; }
.btn-success { background-color: #16a34a; color: white; }
.btn:disabled { opacity: 0.5; cursor: not-allowed; }

.completion-card { text-align: center; padding: 40px 24px; }
.completion-icon { font-size: 50px; margin-bottom: 10px; }
.completion-card h2 { margin: 0; color: #0f172a; }
.completion-subtitle { color: #64748b; margin-top: 4px; }

.score-box {
  margin-top: 24px; background-color: #f8fafc; padding: 20px;
  border-radius: 12px; border: 1px solid #e2e8f0; display: inline-block; min-width: 220px;
}
.score-title { font-size: 12px; font-weight: bold; color: #64748b; text-transform: uppercase; }
.score-value { font-size: 42px; font-weight: 800; color: #0077b6; margin: 4px 0; }
.score-detail { font-size: 13px; font-weight: 600; color: #64748b; }

.empty-card { text-align: center; color: #64748b; display: flex; flex-direction: column; align-items: center; gap: 12px; }
.empty-text { font-size: 15px; margin: 0; }

.mt-15 { margin-top: 15px; }
.mt-20 { margin-top: 20px; }

@keyframes pulse {
  0% { opacity: 1; }
  50% { opacity: 0.7; }
  100% { opacity: 1; }
}
</style>