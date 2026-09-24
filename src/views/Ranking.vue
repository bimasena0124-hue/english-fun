<template>
  <div class="ranking-container" :class="{ embedded: embedded }">
    <!-- Header hanya tampil saat Ranking dibuka sebagai halaman mandiri -->
  

    <!-- Filter berdasarkan Class / Level -->
    <div class="card filter-card">
      <div class="filter-group">
        <label class="filter-label">🎯 Filter Class:</label>
        <select v-model="selectedClassFilter" @change="fetchRankings" class="form-select filter-select">
          <option value="">-- All Classes --</option>
          <option v-for="lvl in availableLevels" :key="lvl" :value="lvl">
            {{ lvl }}
          </option>
        </select>
      </div>
    </div>

    <!-- Table Leaderboard -->
    <div class="card card-section">
      <div class="leaderboard-title">
        <h3>TOP PERFORMANCE</h3>
        <span class="class-tag" v-if="selectedClassFilter">Class: {{ selectedClassFilter }}</span>
      </div>

      <div class="table-responsive">
        <table class="leaderboard-table">
          <thead>
            <tr>
              <th class="text-center">Rank</th>
              <th>Student Name</th>
              <th>Class / Level</th>
              <th>Topic</th>
              <th class="text-center">Accuracy Score</th>
              <th class="text-center">Avg. Response Time</th>
            </tr>
          </thead>
          <tbody>
            <tr 
              v-for="(item, index) in studentRankings" 
              :key="item.id"
              :class="{ 'top-three': index < 3 }"
            >
              <td class="text-center rank-badge">
                <span v-if="index === 0">🥇 1</span>
                <span v-else-if="index === 1">🥈 2</span>
                <span v-else-if="index === 2">🥉 3</span>
                <span v-else>{{ index + 1 }}</span>
              </td>
              <td><strong>{{ item.studentName || item.nama }}</strong></td>
              <td><span class="level-badge">{{ item.targetLevel }}</span></td>
              <td>{{ item.topic || '-' }}</td>
              <td class="text-center">
                <span :class="['score-badge', getScoreClass(item.spellingScore || item.accuracy)]">
                  {{ item.spellingScore || item.accuracy }}%
                </span>
              </td>
              <td class="text-center">⚡ {{ item.responseTime || item.avgResponseTime }}s</td>
            </tr>
            <tr v-if="studentRankings.length === 0">
              <td colspan="6" class="empty-table">Belum ada data ranking untuk kelas ini.</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script>
import { db } from '@/firebase'
import { collection, query, onSnapshot } from 'firebase/firestore'

export default {
  name: 'RankingView',
  data() {
    return {
      studentRankings: [],
      availableLevels: [],
      selectedClassFilter: '',
      unsubscribeRankings: null
    }
  },
  mounted() {
    this.fetchLevels()
    this.fetchRankings()
  },
  beforeUnmount() {
    if (this.unsubscribeRankings) this.unsubscribeRankings()
  },
  methods: {
    fetchLevels() {
      const q = query(collection(db, 'levels'))
      onSnapshot(q, (snapshot) => {
        if (!snapshot.empty) {
          this.availableLevels = snapshot.docs.map(doc => {
            const data = doc.data()
            return String(data.name || data.targetLevel || doc.id).trim()
          })
        } else {
          this.fetchLevelsFromTopics()
        }
      }, () => {
        this.fetchLevelsFromTopics()
      })
    },

    fetchLevelsFromTopics() {
      const q = query(collection(db, 'topics'))
      onSnapshot(q, (snapshot) => {
        if (!snapshot.empty) {
          const levelsSet = new Set()
          snapshot.docs.forEach(doc => {
            const data = doc.data()
            const lvl = data.targetLevel || data.targetlevel || data.level
            if (lvl) levelsSet.add(String(lvl).trim())
          })
          this.availableLevels = Array.from(levelsSet)
        }
      })
    },

    fetchRankings() {
      if (this.unsubscribeRankings) this.unsubscribeRankings()

      // Ambil seluruh data dari koleksi 'logs'
      const q = query(collection(db, 'logs'))

      this.unsubscribeRankings = onSnapshot(q, (snapshot) => {
        const rawLogs = snapshot.docs.map(doc => doc.data())

        // 1. DOKUMEN LOG AKAN DIKELOMPOKKAN DENGAN 'groupedData'
        const groupedData = {}

        rawLogs.forEach(log => {
          // Buat format nama, topik, dan level yang rapi
          const name = String(log.studentName || 'Anonymous').trim()
          const topic = String(log.topic || '-').trim()
          const level = String(log.targetLevel || log.level || '-').trim()

          // Key Unik: Kombinasi Nama + Topik + Level (menggunakan lowercase agar tidak sensitif huruf besar/kecil)
          const key = `${name.toLowerCase()}_${topic.toLowerCase()}_${level.toLowerCase()}`

          // Jika siswa + topik ini belum ada di groupedData, buat objek awal
          if (!groupedData[key]) {
            groupedData[key] = {
              id: key,
              studentName: name,
              targetLevel: level,
              topic: topic,
              totalScore: 0,
              totalTime: 0,
              questionCount: 0
            }
          }

          // Ambil nilai score pengucapan dari log (spellingScore)
          const rawScore = Number(log.spellingScore ?? log.score ?? 0)
          const score = isNaN(rawScore) ? 0 : rawScore

          // Ambil nilai waktu respon dari log (responseTimeNum atau responseTime)
          let rawTime = log.responseTimeNum ?? log.responseTime ?? 0
          if (typeof rawTime === 'string') {
            // Jika nilai berupa string seperti "3.5s", ambil angkanya saja
            rawTime = parseFloat(rawTime.replace(/[^0-9.]/g, ''))
          }
          const time = isNaN(rawTime) ? 0 : rawTime

          // Akumulasikan total skor, total waktu, dan jumlah soal yang dijawab
          groupedData[key].totalScore += score
          groupedData[key].totalTime += time
          groupedData[key].questionCount += 1
        })

        // 2. HITUNG RATA-RATA AKURASI DAN RATA-RATA WAKTU RESPON
        let list = Object.values(groupedData).map(item => {
          const totalQuestions = item.questionCount > 0 ? item.questionCount : 1

          // Rata-rata Skor Akurasi (%)
          const avgAccuracy = Math.round(item.totalScore / totalQuestions)

          // Rata-rata Waktu Respon (Detik) - dibulatkan 1 angka di belakang koma
          const avgResponseTime = parseFloat((item.totalTime / totalQuestions).toFixed(1))

          return {
            id: item.id,
            studentName: item.studentName,
            targetLevel: item.targetLevel,
            topic: item.topic,
            accuracy: avgAccuracy,
            avgResponseTime: avgResponseTime,
            totalQuestionsAnswered: totalQuestions
          }
        })

        // 3. FILTER BERDASARKAN KELAS / LEVEL (JIKA DIPILIH PADA DROPDOWN)
        if (this.selectedClassFilter) {
          const targetFilter = this.selectedClassFilter.trim().toLowerCase()
          list = list.filter(item => {
            return item.targetLevel.toLowerCase() === targetFilter
          })
        }

        // 4. URUTKAN (SORTING) LEADERBOARD:
        //    - Prioritas 1: Rata-rata Akurasi tertinggi di atas
        //    - Prioritas 2: Rata-rata Waktu Respon tercepat di atas (jika akurasi sama)
        this.studentRankings = list.sort((a, b) => {
          if (b.accuracy !== a.accuracy) {
            return b.accuracy - a.accuracy
          }
          return a.avgResponseTime - b.avgResponseTime
        })
      }, (error) => {
        console.error('Error membaca data logs untuk ranking:', error)
      })
    },

    getScoreClass(score) {
      if (score >= 85) return 'badge-success'
      if (score >= 70) return 'badge-warning'
      return 'badge-danger'
    },

    formatResponseTime(time) {
      if (time === undefined || time === null || time === Infinity || isNaN(time)) return '0s'
      return `${time}s`
    }
  }
}
</script>

<style scoped>
.ranking-container {
  width: 100%;
  max-width: 900px;
  margin: 20px auto;
  padding: 0 15px;
  box-sizing: border-box;
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.ranking-container.embedded {
  max-width: none;
  margin: 0;
  padding: 0;
}

.top-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background-color: #0f172a;
  color: white;
  padding: 12px 20px;
  border-radius: 8px;
}
.top-bar h2 { margin: 0; font-size: 18px; }
.btn-back {
  background-color: #334155;
  color: white;
  border: none;
  padding: 6px 12px;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 600;
}

.card {
  background-color: #ffffff;
  border-radius: 12px;
  padding: 20px 24px;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.05);
}

.filter-card { background-color: #f8fafc; }
.filter-group { display: flex; align-items: center; gap: 12px; }
.filter-label { font-weight: 700; font-size: 14px; color: #334155; }
.form-select {
  height: 38px;
  padding: 0 12px;
  border-radius: 6px;
  border: 1px solid #cbd5e1;
  outline: none;
  background-color: white;
}

.leaderboard-title { display: flex; align-items: center; gap: 10px; margin-bottom: 16px; }
.leaderboard-title h3 { margin: 0; font-size: 16px; color: #0f172a; }
.class-tag { font-size: 12px; font-weight: 700; background-color: #e0f2fe; color: #0369a1; padding: 2px 8px; border-radius: 4px; }

.table-responsive { overflow-x: auto; }
.leaderboard-table { width: 100%; border-collapse: collapse; font-size: 13px; }
.leaderboard-table th { background-color: #f1f5f9; text-align: left; padding: 10px; color: #475569; border-bottom: 2px solid #e2e8f0; }
.leaderboard-table td { padding: 10px; border-bottom: 1px solid #e2e8f0; color: #334155; }

.top-three { background-color: #f0fdf4; }
.rank-badge { font-weight: 800; font-size: 15px; }
.text-center { text-align: center; }

.score-badge { padding: 4px 8px; border-radius: 6px; font-weight: 700; font-size: 12px; }
.badge-success { background-color: #dcfce7; color: #15803d; }
.badge-warning { background-color: #fef9c3; color: #a16207; }
.badge-danger { background-color: #fee2e2; color: #b91c1c; }
.level-badge { background-color: #e0f2fe; color: #0369a1; padding: 2px 8px; border-radius: 12px; font-size: 11px; font-weight: 700; }

.empty-table { text-align: center; color: #94a3b8; padding: 24px !important; }
</style>