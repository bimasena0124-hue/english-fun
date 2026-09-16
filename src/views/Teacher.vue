<template>
  <div class="teacher-container">
    <header class="header">
      <h1>Teacher Dashboard</h1>
      <button class="logout-btn" @click="handleLogout">Logout</button>
    </header>

    <main class="content">
      <!-- Section Form Input Topik -->
      <section class="card form-section">
        <h2>Add / Edit Topic</h2>
        <form @submit.prevent="saveTopic">
          <div class="form-group">
            <label>Target Level / Class</label>
            <input 
              v-model="formData.targetLevel" 
              type="text" 
              placeholder="e.g. Class 10-A" 
              required 
            />
          </div>

          <div class="form-group">
            <label>Topic Title</label>
            <input 
              v-model="formData.topicTitle" 
              type="text" 
              placeholder="e.g. Daily Routines" 
              required 
            />
          </div>

          <div class="form-row">
            <div class="form-group">
              <label>Start Date & Time</label>
              <input v-model="formData.startDateTime" type="datetime-local" required />
            </div>
            <div class="form-group">
              <label>Due Date & Time</label>
              <input v-model="formData.dueDateTime" type="datetime-local" required />
            </div>
          </div>

          <div class="form-group">
            <label>AI Voice Accent</label>
            <select v-model="formData.aiVoice">
              <option value="en-US">English (US)</option>
              <option value="en-GB">English (UK)</option>
              <option value="en-AU">English (Australia)</option>
            </select>
          </div>

          <div class="form-group">
            <label>Upload Topic Image</label>
            <input 
              type="file" 
              accept="image/*" 
              @change="handleFileUpload" 
            />
            <p v-if="selectedFileName" class="file-name">Selected: {{ selectedFileName }}</p>
          </div>

          <div class="form-group">
            <label>Questions (Separate each question with semicolons ';')</label>
            <textarea 
              v-model="formData.questions" 
              rows="3" 
              placeholder="What is your favorite food?; How often do you eat it?"
              required
            ></textarea>
          </div>

          <div class="form-group">
            <label>Expected Answers (Separate with semicolons ';')</label>
            <textarea 
              v-model="formData.expectedAnswers" 
              rows="3" 
              placeholder="My favorite food is...; I eat it every..."
            ></textarea>
          </div>

          <button type="submit" class="submit-btn" :disabled="isUploading">
            {{ isUploading ? 'Uploading & Saving...' : 'Save Topic' }}
          </button>
        </form>
      </section>

      <!-- Section Daftar Topik yang Ada -->
      <section class="card list-section">
        <h2>Existing Topics</h2>
        <div v-if="loading" class="loading">Loading topics...</div>
        <div v-else-if="topics.length === 0" class="empty">No topics created yet.</div>
        
        <div v-else class="topic-grid">
          <div v-for="topic in topics" :key="topic.id" class="topic-card">
            <div class="topic-image-container">
              <img 
                v-if="topic.imageUrl" 
                :src="topic.imageUrl" 
                :alt="topic.title" 
                class="topic-image" 
              />
              <div v-else class="no-image">No Image Available</div>
            </div>

            <div class="topic-info">
              <span class="badge">{{ topic.targetLevel }}</span>
              <h3>{{ topic.title }}</h3>
              <p><strong>Voice:</strong> {{ topic.aiVoice }}</p>
              <p><strong>Due:</strong> {{ formatDate(topic.dueDateTime) }}</p>
              <p><strong>Questions:</strong> {{ topic.questions ? topic.questions.length : 0 }} item(s)</p>
              
              <button class="delete-btn" @click="deleteTopic(topic.id)">Delete</button>
            </div>
          </div>
        </div>
      </section>
    </main>
  </div>
</template>

<script>
import { db, auth, storage } from '@/firebase'
import { signOut } from 'firebase/auth'
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'
import { 
  collection, 
  addDoc, 
  getDocs, 
  deleteDoc, 
  doc, 
  setDoc, 
  serverTimestamp, 
  query, 
  orderBy 
} from 'firebase/firestore'

export default {
  name: 'TeacherView',
  data() {
    return {
      isUploading: false,
      loading: true,
      selectedFileName: '',
      formData: {
        targetLevel: '',
        topicTitle: '',
        startDateTime: '',
        dueDateTime: '',
        aiVoice: 'en-US',
        selectedFile: null,
        questions: '',
        expectedAnswers: ''
      },
      topics: []
    }
  },
  mounted() {
    this.fetchTopics()
  },
  methods: {
    handleFileUpload(event) {
      const file = event.target.files[0]
      if (file) {
        this.formData.selectedFile = file
        this.selectedFileName = file.name
      }
    },

    async saveTopic() {
      if (!this.formData.topicTitle || !this.formData.questions) {
        alert('Please complete the Topic Title and Questions fields.')
        return
      }

      try {
        this.isUploading = true
        let uploadedImageUrl = ''

        // 1. Upload Gambar ke Firebase Storage jika ada file yang dipilih
        if (this.formData.selectedFile) {
          const file = this.formData.selectedFile
          const storageRef = ref(storage, `topics/${Date.now()}_${file.name}`)
          const snapshot = await uploadBytes(storageRef, file)
          uploadedImageUrl = await getDownloadURL(snapshot.ref)
        }

        // Parsing String ke Array
        const questionsArray = this.formData.questions
          .split(';')
          .map(q => q.trim())
          .filter(q => q !== '')

        const expectedAnswersArray = this.formData.expectedAnswers
          .split(';')
          .map(a => a.trim())
          .filter(a => a !== '')

        // 2. Simpan Dokumen Topik ke Firestore (menyimpan imageUrl)
        await addDoc(collection(db, 'topics'), {
          targetLevel: this.formData.targetLevel,
          title: this.formData.topicTitle,
          aiVoice: this.formData.aiVoice,
          startDateTime: this.formData.startDateTime,
          dueDateTime: this.formData.dueDateTime,
          imageUrl: uploadedImageUrl,
          questions: questionsArray,
          expectedAnswers: expectedAnswersArray,
          createdAt: serverTimestamp()
        })

        // 3. Simpan/Update Kelas ke Koleksi 'levels'
        await setDoc(doc(db, 'levels', this.formData.targetLevel), {
          name: this.formData.targetLevel,
          createdAt: serverTimestamp()
        }, { merge: true })

        alert('Topic and Level successfully saved!')

        // Reset Form
        this.resetForm()
        // Refresh daftar topik
        this.fetchTopics()
      } catch (error) {
        console.error('Error saving topic:', error)
        alert('Failed to save topic: ' + error.message)
      } finally {
        this.isUploading = false
      }
    },

    async fetchTopics() {
      try {
        this.loading = true
        const q = query(collection(db, 'topics'), orderBy('createdAt', 'desc'))
        const querySnapshot = await getDocs(q)
        
        this.topics = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }))
      } catch (error) {
        console.error('Error fetching topics:', error)
      } finally {
        this.loading = false
      }
    },

    async deleteTopic(id) {
      if (confirm('Are you sure you want to delete this topic?')) {
        try {
          await deleteDoc(doc(db, 'topics', id))
          this.topics = this.topics.filter(t => t.id !== id)
          alert('Topic deleted successfully.')
        } catch (error) {
          console.error('Error deleting topic:', error)
          alert('Failed to delete topic.')
        }
      }
    },

    resetForm() {
      this.formData = {
        targetLevel: '',
        topicTitle: '',
        startDateTime: '',
        dueDateTime: '',
        aiVoice: 'en-US',
        selectedFile: null,
        questions: '',
        expectedAnswers: ''
      }
      this.selectedFileName = ''
    },

    formatDate(dateTimeStr) {
      if (!dateTimeStr) return '-'
      return new Date(dateTimeStr).toLocaleString()
    },

    async handleLogout() {
      try {
        await signOut(auth)
        this.$router.push('/login')
      } catch (error) {
        console.error('Logout error:', error)
      }
    }
  }
}
</script>

<style scoped>
.teacher-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
  font-family: Arial, sans-serif;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.logout-btn {
  background-color: #dc3545;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 4px;
  cursor: pointer;
}

.card {
  background: white;
  border-radius: 8px;
  padding: 24px;
  margin-bottom: 24px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

.form-group {
  margin-bottom: 16px;
}

.form-group label {
  display: block;
  font-weight: bold;
  margin-bottom: 6px;
}

.form-group input, 
.form-group select, 
.form-group textarea {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #ccc;
  border-radius: 4px;
  box-sizing: border-box;
}

.form-row {
  display: flex;
  gap: 16px;
}

.form-row .form-group {
  flex: 1;
}

.submit-btn {
  background-color: #28a745;
  color: white;
  border: none;
  padding: 10px 20px;
  font-size: 16px;
  border-radius: 4px;
  cursor: pointer;
}

.submit-btn:disabled {
  background-color: #6c757d;
  cursor: not-allowed;
}

.topic-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 20px;
  margin-top: 16px;
}

.topic-card {
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  overflow: hidden;
  background: #fafafa;
}

.topic-image-container {
  width: 100%;
  height: 160px;
  background-color: #e9ecef;
  display: flex;
  align-items: center;
  justify-content: center;
}

.topic-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.no-image {
  color: #6c757d;
  font-size: 14px;
}

.topic-info {
  padding: 16px;
}

.badge {
  background-color: #007bff;
  color: white;
  font-size: 12px;
  padding: 4px 8px;
  border-radius: 4px;
}

.delete-btn {
  background-color: #dc3545;
  color: white;
  border: none;
  padding: 6px 12px;
  border-radius: 4px;
  cursor: pointer;
  margin-top: 8px;
}
</style>