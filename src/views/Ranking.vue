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
import { collection, query, orderBy, where, onSnapshot } from 'firebase/firestore'

export default {
  name: 'RankingView',
  data() {
    return {
      selectedClassFilter: '',
      availableLevels: [],
      studentRankings: [],
      unsubscribeRankings: null,
      unsubscribeLevels: null
    }
  },
  mounted() {
    // 1. Fetch Daftar Kelas / Levels untuk Dropdown Filter
    const qLevels = query(collection(db, 'levels'), orderBy('createdAt', 'asc'))
    this.unsubscribeLevels = onSnapshot(qLevels, (snapshot) => {
      this.availableLevels = snapshot.docs.map(doc => doc.data().name || doc.id)
    })

    // 2. Fetch Data Ranking
    this.fetchRankings()
  },
  unmounted() {
    if (this.unsubscribeRankings) this.unsubscribeRankings()
    if (this.unsubscribeLevels) this.unsubscribeLevels()
  },
  methods: {
    fetchRankings() {
      if (this.unsubscribeRankings) this.unsubscribeRankings()

      let rankingsQuery

      // Query real-time berdasarkan filter kelas
      if (this.selectedClassFilter) {
        rankingsQuery = query(
          collection(db, 'rankings'), // Atau gunakan 'logs' sesuai koleksi milikmu
          where('targetLevel', '==', this.selectedClassFilter),
          orderBy('accuracy', 'desc'),
          orderBy('avgResponseTime', 'asc')
        )
      } else {
        rankingsQuery = query(
          collection(db, 'rankings'),
          orderBy('accuracy', 'desc'),
          orderBy('avgResponseTime', 'asc')
        )
      }

      this.unsubscribeRankings = onSnapshot(rankingsQuery, (snapshot) => {
        this.studentRankings = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }))
      }, (error) => {
        console.error('Error fetching rankings:', error)
      })
    },

    getScoreClass(score) {
      if (score >= 85) return 'badge-success'
      if (score >= 70) return 'badge-warning'
      return 'badge-danger'
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