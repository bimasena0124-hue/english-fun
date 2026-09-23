<template>
  <div class="ranking-container">
    <!-- Top Header Bar -->
    <div class="top-bar">
      <h2>🏆 Leaderboard & Student Rankings</h2>
      <button @click="$router.push('/')" class="btn-back">⬅️ Back to Student Area</button>
    </div>

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
                <span :class="['score-badge', getScoreClass(item.accuracy ?? item.spellingScore ?? 0)]">
                  {{ item.accuracy ?? item.spellingScore ?? 0 }}%
                </span>
              </td>
              <td class="text-center">⚡ {{ formatResponseTime(item.avgResponseTime ?? item.responseTime) }}</td>
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
import { collection, query, where, orderBy, onSnapshot } from 'firebase/firestore'

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
    // Ambil daftar kelas dari Firestore untuk populate dropdown filter
    fetchLevels() {
      const q = query(collection(db, 'levels'), orderBy('createdAt', 'asc'))
      onSnapshot(q, (snapshot) => {
        if (!snapshot.empty) {
          this.availableLevels = snapshot.docs.map(doc => {
            const data = doc.data()
            return String(data.name || data.targetLevel || doc.id).trim()
          })
        } else {
          // Fallback: Ambil dari koleksi topics jika koleksi levels belum diisi
          this.fetchLevelsFromTopics()
        }
      }, (error) => {
        console.error('Error membaca data levels:', error)
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

    // Ambil data ranking real-time dari Firestore
    fetchRankings() {
      if (this.unsubscribeRankings) this.unsubscribeRankings()

      let q
      if (this.selectedClassFilter) {
        q = query(
          collection(db, 'rankings'),
          where('targetLevel', '==', this.selectedClassFilter)
        )
      } else {
        q = query(collection(db, 'rankings'))
      }

      this.unsubscribeRankings = onSnapshot(q, (snapshot) => {
        const rawList = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }))

        // Sort secara manual: Accuracy tertinggi (descending), jika sama waktu respon tercepat (ascending)
        this.studentRankings = rawList.sort((a, b) => {
          const scoreA = Number(a.accuracy ?? a.spellingScore ?? 0)
          const scoreB = Number(b.accuracy ?? b.spellingScore ?? 0)

          if (scoreB !== scoreA) {
            return scoreB - scoreA
          }

          const timeA = parseFloat(a.avgResponseTime ?? a.responseTime ?? 0)
          const timeB = parseFloat(b.avgResponseTime ?? b.responseTime ?? 0)
          return timeA - timeB
        })
      }, (error) => {
        console.error('Error membaca data ranking:', error)
      })
    },

    getScoreClass(score) {
      if (score >= 85) return 'badge-success'
      if (score >= 70) return 'badge-warning'
      return 'badge-danger'
    },

    formatResponseTime(time) {
      if (time === undefined || time === null) return '0s'
      const strTime = String(time)
      return strTime.endsWith('s') ? strTime : `${strTime}s`
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
  transition: background-color 0.2s;
}
.btn-back:hover {
  background-color: #475569;
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
  font-weight: 600;
  color: #0f172a;
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

.score-badge { padding: 4px 8px; border-radius: 6px; font-weight: 700; font-size: 12px; display: inline-block; }
.badge-success { background-color: #dcfce7; color: #15803d; }
.badge-warning { background-color: #fef9c3; color: #a16207; }
.badge-danger { background-color: #fee2e2; color: #b91c1c; }
.level-badge { background-color: #e0f2fe; color: #0369a1; padding: 2px 8px; border-radius: 12px; font-size: 11px; font-weight: 700; }

.empty-table { text-align: center; color: #94a3b8; padding: 24px !important; }
</style>