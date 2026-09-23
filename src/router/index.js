import { createRouter, createWebHistory } from 'vue-router'
import { auth } from '@/firebase'
import { onAuthStateChanged } from 'firebase/auth'

import Student from '@/views/Student.vue'
import Teacher from '@/views/Teacher.vue'
import Login from '@/views/Login.vue'
import Ranking from '@/views/Ranking.vue'

const routes = [
  { path: '/', redirect: '/student' },
  { path: '/student', name: 'Student', component: Student },
  { path: '/login', name: 'Login', component: Login },
  { path: '/ranking', name: 'Ranking', component: Ranking },
  { 
    path: '/teacher', 
    name: 'Teacher', 
    component: Teacher,
    // Tandai rute ini butuh autentikasi
    meta: { requiresAuth: true }
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

// Fungsi bantu untuk memastikan Firebase Auth selesai memeriksa status sesi
const getCurrentUser = () => {
  return new Promise((resolve, reject) => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      unsubscribe()
      resolve(user)
    }, reject)
  })
}

// Navigation Guard (Satpam Rute)
router.beforeEach(async (to, from, next) => {
  const requiresAuth = to.matched.some(record => record.meta.requiresAuth)
  const currentUser = await getCurrentUser()

  if (requiresAuth && !currentUser) {
    // Jika butuh login tapi belum login, tendang ke /login
    next('/login')
  } else if (to.path === '/login' && currentUser) {
    // Jika sudah login tapi buka /login, lempar langsung ke /teacher
    next('/teacher')
  } else {
    // Izinkan jalan terus
    next()
  }
})

export default router