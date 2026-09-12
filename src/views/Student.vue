<template>
  <div class="student-container">
    <!-- Header Station -->
    <div class="card header-card">
      <div class="user-info">
        <label>Student Name:</label>
        <input 
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
        <div class="score-title">Your Final Score</div>
        <div class="score-value">{{ finalScore }}%</div>
        <div class="score-detail">Correct: {{ correctCount }} / {{ currentTopic.questions.length }}</div>
      </div>

      <button class="btn btn-primary mt-20" @click="restartPractice">
        🔄 Try Again
      </button>
    </div>

    <!-- Active Topic & Question Card -->
    <div class="card main-card" v-else-if="currentTopic">
      <div class="topic-badge">📌 {{ currentTopic.title }} ({{ currentTopic.targetLevel }})</div>
      
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

        <!-- Live Preview Transcribed Text & Evaluation -->
        <div class="transcript-box mt-15">
          <label>Your Spoken Answer (Live Preview):</label>
          <p class="transcript-text">{{ spokenText || 'Your speech will appear here...' }}</p>
          
          <!-- Indikator Hasil Pengecekan Speaking -->
          <div v-if="evaluationResult !== null" :class="['eval-badge', evaluationResult ? 'correct' : 'incorrect']">
            <span>{{ evaluationResult ? '✅ Great Pronunciation! (Correct)' : '❌ Needs Practice (Keep Trying)' }}</span>
            <small v-if="expectedAnswer">Target: "{{ expectedAnswer }}"</small>
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

    <!-- Empty State -->
    <div v-else class="card empty-card">
      <p>⏳ Waiting for teacher to select or upload a topic...</p>
    </div>
  </div>
</template>

<script>
import { db } from '@/firebase'
import { collection, addDoc, onSnapshot, query, orderBy, limit, serverTimestamp } from 'firebase/firestore'

export default {
  name: 'Student',
  data() {
    return {
      studentName: '',
      topicsList: [],
      currentTopic: null,
      currentQuestionIndex: 0,
      spokenText: '',
      isListening: false,
      recognition: null,
      startTime: null,
      
      // Data Tambahan untuk Evaluasi & Finish State
      evaluationResult: null,
      answersLog: {}, // Menyimpan riwayat jawaban tiap soal
      isFinished: false
    }
  },
  computed: {
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
    correctCount() {
      return Object.values(this.answersLog).filter(log => log.isCorrect).length
    },
    finalScore() {
      if (!this.currentTopic?.questions?.length) return 0
      return Math.round((this.correctCount / this.currentTopic.questions.length) * 100)
    }
  },
  mounted() {
    this.fetchTopics()
    this.initSpeechRecognition()
  },
  methods: {
    fetchTopics() {
      const q = query(collection(db, 'topics'), orderBy('createdAt', 'desc'), limit(1))
      onSnapshot(q, (snapshot) => {
        if (!snapshot.empty) {
          this.topicsList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
          this.currentTopic = this.topicsList[0]
          this.resetState()
          
          this.$nextTick(() => {
            if (this.currentQuestion) {
              this.speakQuestion(this.currentQuestion)
            }
          })
        }
      })
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
          console.error('Speech recognition error:', event.error)
          this.isListening = false
        }

        this.recognition.onend = () => {
          this.isListening = false
        }
      }
    },

    toggleListening() {
      if (!this.recognition) {
        alert('Browser kamu belum mendukung Speech Recognition. Gunakan Chrome atau Edge.')
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

    // Algoritma Sederhana Pengecekan Speaking/Akurasi
    checkAnswerAccuracy(spoken, expected) {
      if (!expected) return true // Jika guru tidak isi kunci jawaban, anggap benar
      
      const cleanSpoken = spoken.toLowerCase().replace(/[^a-z0-9 ]/g, '').trim()
      const cleanExpected = expected.toLowerCase().replace(/[^a-z0-9 ]/g, '').trim()

      return cleanSpoken.includes(cleanExpected) || cleanExpected.includes(cleanSpoken)
    },

    async evaluateAndSaveAnswer() {
      if (!this.spokenText.trim() || !this.studentName.trim()) return

      const numericDuration = parseFloat(((Date.now() - this.startTime) / 1000).toFixed(1))
      const responseTimeFormatted = `${numericDuration}s`
      
      // Jalankan Evaluasi Jawaban
      const isCorrect = this.checkAnswerAccuracy(this.spokenText, this.expectedAnswer)
      this.evaluationResult = isCorrect

      // Simpan di Local Memory Siswa
      this.answersLog[this.currentQuestionIndex] = {
        question: this.currentQuestion,
        spokenAnswer: this.spokenText,
        isCorrect: isCorrect,
        duration: numericDuration
      }

      const logMessage = `[${this.studentName}] Q: "${this.currentQuestion}" -> Answer: "${this.spokenText}" (${responseTimeFormatted}) [${isCorrect ? 'CORRECT' : 'INCORRECT'}]`

      try {
        await addDoc(collection(db, 'logs'), {
          message: logMessage,
          studentName: this.studentName,
          topic: this.currentTopic.title,
          question: this.currentQuestion,
          spokenAnswer: this.spokenText,
          expectedAnswer: this.expectedAnswer || '-',
          isCorrect: isCorrect,
          responseTime: responseTimeFormatted,
          responseTimeNum: numericDuration,
          createdAt: serverTimestamp()
        })
      } catch (err) {
        console.error('Gagal mengirim log:', err)
      }
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
        this.evaluationResult = saved.isCorrect
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

.topic-badge {
  display: inline-block; background-color: #e0f2fe; color: #0369a1;
  padding: 6px 12px; border-radius: 20px; font-weight: 700; font-size: 14px; margin-bottom: 16px;
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
  margin-top: 10px; padding: 8px 12px; border-radius: 6px;
  display: flex; flex-direction: column; gap: 4px; font-weight: bold; font-size: 13px;
}
.eval-badge.correct { background-color: #dcfce7; color: #15803d; border: 1px solid #86efac; }
.eval-badge.incorrect { background-color: #fee2e2; color: #b91c1c; border: 1px solid #fca5a5; }

.action-row { display: flex; justify-content: space-between; width: 100%; }

.btn { padding: 10px 20px; border-radius: 6px; border: none; font-weight: bold; cursor: pointer; }
.btn-primary { background-color: #0077b6; color: white; }
.btn-secondary { background-color: #94a3b8; color: white; }
.btn-success { background-color: #16a34a; color: white; }
.btn:disabled { opacity: 0.5; cursor: not-allowed; }

/* Completion Screen Styles */
.completion-card { text-align: center; padding: 40px 24px; }
.completion-icon { font-size: 50px; margin-bottom: 10px; }
.completion-card h2 { margin: 0; color: #0f172a; }
.completion-subtitle { color: #64748b; margin-top: 4px; }

.score-box {
  margin-top: 24px; background-color: #f8fafc; padding: 20px;
  border-radius: 12px; border: 1px solid #e2e8f0; display: inline-block; min-width: 200px;
}
.score-title { font-size: 12px; font-weight: bold; color: #64748b; text-transform: uppercase; }
.score-value { font-size: 42px; font-weight: 800; color: #0077b6; margin: 4px 0; }
.score-detail { font-size: 14px; font-weight: 600; color: #334155; }

.empty-card { text-align: center; color: #64748b; }
.mt-15 { margin-top: 15px; }
.mt-20 { margin-top: 20px; }

@keyframes pulse {
  0% { opacity: 1; }
  50% { opacity: 0.7; }
  100% { opacity: 1; }
}
</style>