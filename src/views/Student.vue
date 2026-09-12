<template>
  <div class="student-container">
    
    <!-- SECTION 1: FORM INPUT SISWA & TOPIK -->
    <div class="card card-input">
      <!-- Enter Student Name / ID -->
      <div class="form-group">
        <label class="form-label">
          <span class="label-icon">👤</span>
          Enter Student Name / ID:
        </label>
        <input
          v-model="studentName"
          type="text"
          class="form-input"
          placeholder="e.g. Student 01"
        />
      </div>

      <!-- Select Practice Topic -->
      <div class="form-group">
        <label class="form-label">
          <span class="label-icon">📚</span>
          Select Practice Topic:
        </label>
        <div class="select-wrapper">
          <select 
            v-model="selectedTopicId" 
            class="form-select"
            @change="onTopicChange"
            :disabled="topicsList.length === 0"
          >
            <option v-if="topicsList.length === 0" value="" disabled>
              Loading topics or no topics available...
            </option>
            <option 
              v-for="topic in topicsList" 
              :key="topic.id" 
              :value="topic.id"
            >
              🐬 {{ topic.title }} ({{ topic.targetLevel }})
            </option>
          </select>
        </div>
      </div>
    </div>

    <!-- SECTION 2: CARD PRACTICE / SOAL -->
    <div class="card card-practice">
      
      <!-- IMAGE BOX (Mendukung Gambar Base64 / URL) -->
      <div class="image-box">
        <img 
          v-if="currentTopic && currentTopic.imageUrl" 
          :src="currentTopic.imageUrl" 
          :alt="currentTopic.title"
          class="uploaded-image"
        />
        <span v-else class="animal-emoji">🐬</span>
      </div>

      <!-- Detail Topik & Soal Dinamis -->
      <div v-if="currentTopic" class="question-details">
        <h2 class="topic-title">{{ currentTopic.title }}</h2>
        <span class="question-step">
          Question {{ currentQuestionIndex }} / {{ totalQuestions }}
        </span>
        <h3 class="question-text">
          "{{ currentQuestionText }}"
        </h3>
      </div>
      <div v-else class="question-details">
        <h3 class="question-text">Pilih topik terlebih dahulu.</h3>
      </div>

      <!-- Navigation Buttons (Previous / Next) -->
      <div class="nav-buttons">
        <button
          class="btn btn-prev"
          :disabled="currentQuestionIndex === 1 || !currentTopic"
          @click="prevQuestion"
        >
          ⬅️ Previous
        </button>
        <button
          class="btn btn-next"
          :disabled="currentQuestionIndex === totalQuestions || !currentTopic"
          @click="nextQuestion"
        >
          Next ➡️
        </button>
      </div>

      <!-- Start Session Button -->
      <div class="action-button-wrapper">
        <button class="btn btn-session" @click="toggleSession">
          <span class="btn-icon">🎙️</span>
          {{ isSessionActive ? 'Stop Continuous Session' : 'Start Continuous Session' }}
        </button>
      </div>

    </div>

  </div>
</template>

<script>
import { db } from '@/firebase'
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore'

export default {
  name: 'Student',
  data() {
    return {
      studentName: '',
      topicsList: [],
      selectedTopicId: '',
      currentTopic: null,
      currentQuestionIndex: 1,
      isSessionActive: false
    }
  },
  computed: {
    totalQuestions() {
      return this.currentTopic && this.currentTopic.questions 
        ? this.currentTopic.questions.length 
        : 0
    },
    currentQuestionText() {
      if (this.currentTopic && this.currentTopic.questions && this.currentTopic.questions.length > 0) {
        return this.currentTopic.questions[this.currentQuestionIndex - 1]
      }
      return 'Tidak ada soal pada topik ini.'
    }
  },
  mounted() {
    // Sync data realtime dari Firestore
    const q = query(collection(db, 'topics'), orderBy('createdAt', 'desc'))
    onSnapshot(q, (snapshot) => {
      this.topicsList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }))

      if (this.topicsList.length > 0) {
        // Jika belum ada topik terpilih, pilih topik pertama secara otomatis
        if (!this.selectedTopicId) {
          this.selectedTopicId = this.topicsList[0].id
          this.currentTopic = this.topicsList[0]
        } else {
          // Jika topik terpilih sudah ada, perbarui datanya (misal ada pembaruan gambar/soal dari Teacher)
          const found = this.topicsList.find(t => t.id === this.selectedTopicId)
          if (found) {
            this.currentTopic = found
          } else {
            // Jika topik yang sedang dibuka ternyata dihapus oleh Teacher, kembalikan ke topik pertama
            this.selectedTopicId = this.topicsList[0].id
            this.currentTopic = this.topicsList[0]
            this.currentQuestionIndex = 1
          }
        }
      } else {
        // Jika semua topik terhapus di Firestore
        this.selectedTopicId = ''
        this.currentTopic = null
      }
    })
  },
  methods: {
    onTopicChange() {
      this.currentTopic = this.topicsList.find(t => t.id === this.selectedTopicId)
      this.currentQuestionIndex = 1
    },
    prevQuestion() {
      if (this.currentQuestionIndex > 1) {
        this.currentQuestionIndex--
      }
    },
    nextQuestion() {
      if (this.currentQuestionIndex < this.totalQuestions) {
        this.currentQuestionIndex++
      }
    },
    toggleSession() {
      if (!this.studentName.trim()) {
        alert('Mohon isi nama terlebih dahulu!')
        return
      }
      this.isSessionActive = !this.isSessionActive
      if (this.isSessionActive) {
        alert(`Continuous Voice Session Started for ${this.studentName}!`)
      } else {
        alert('Session Ended.')
      }
    }
  }
}
</script>

<style scoped>
.student-container {
  width: 100%;
  max-width: 1000px;
  margin: 20px auto;
  padding: 0 15px;
  box-sizing: border-box;
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.card {
  background-color: #ffffff;
  border-radius: 16px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.03);
  padding: 24px;
  box-sizing: border-box;
}

.form-group {
  margin-bottom: 18px;
}

.form-group:last-child {
  margin-bottom: 0;
}

.form-label {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 15px;
  font-weight: 700;
  color: #034078;
  margin-bottom: 10px;
}

.label-icon {
  font-size: 16px;
}

.form-input,
.form-select {
  width: 100%;
  height: 44px;
  padding: 8px 16px;
  font-size: 14px;
  color: #1f2937;
  background-color: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  box-sizing: border-box;
  outline: none;
  transition: border-color 0.2s;
}

.form-input::placeholder {
  color: #9ca3af;
}

.form-select {
  background-color: #e5e7eb;
  cursor: pointer;
  border-color: #e5e7eb;
}

.form-input:focus {
  border-color: #0077b6;
}

.card-practice {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 36px 24px;
}

.image-box {
  width: 240px;
  height: 180px;
  background-color: #e0f7fa;
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 20px;
  overflow: hidden;
}

.uploaded-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.animal-emoji {
  font-size: 80px;
}

.question-details {
  text-align: center;
  margin-bottom: 28px;
}

.topic-title {
  margin: 0 0 4px 0;
  font-size: 22px;
  font-weight: 800;
  color: #003049;
}

.question-step {
  font-size: 13px;
  font-weight: 600;
  color: #6b7280;
  display: block;
  margin-bottom: 12px;
}

.question-text {
  margin: 0;
  font-size: 20px;
  font-weight: 800;
  color: #0077b6;
}

.nav-buttons {
  display: flex;
  width: 100%;
  gap: 16px;
  margin-bottom: 16px;
}

.btn {
  height: 46px;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  transition: opacity 0.2s, transform 0.1s;
}

.btn:active {
  transform: scale(0.99);
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-prev {
  flex: 1;
  background-color: #a0aec0;
  color: #ffffff;
}

.btn-next {
  flex: 1;
  background-color: #0077b6;
  color: #ffffff;
}

.action-button-wrapper {
  width: 100%;
}

.btn-session {
  width: 100%;
  height: 48px;
  background-color: #ef4444;
  color: #ffffff;
  font-size: 15px;
}

.btn-session:hover {
  background-color: #dc2626;
}

.btn-icon {
  font-size: 16px;
}

@media (max-width: 600px) {
  .image-box {
    width: 100%;
    height: 160px;
  }

  .nav-buttons {
    flex-direction: column;
    gap: 10px;
  }

  .topic-title {
    font-size: 20px;
  }

  .question-text {
    font-size: 18px;
  }
}
</style>