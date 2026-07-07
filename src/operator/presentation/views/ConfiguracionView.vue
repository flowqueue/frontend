<script setup>
import { computed, ref, onMounted } from 'vue'
import AppLayout from '@/shared/components/AppLayout.vue'
import { useAuthStore } from '@/iam/application/auth.store.js'
import { useOperatorStore } from '@/operator/application/Operation.Store.js'
import { http } from '@/shared/services/http.js'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
const auth     = useAuthStore()
const operator = useOperatorStore()
const currentPassword = ref('')
const newPassword = ref('')
const confirmPassword = ref('')
const feedback = ref('')
const error = ref('')
const saving = ref(false)
const roleText = computed(() => auth.user?.isSupervisor ? t('sidebar.supervisor') : auth.user?.isOperator ? t('sidebar.operator') : t('sidebar.citizen'))

onMounted(() => {
  if (auth.user?.mostradorId) operator.loadDashboard(auth.user.mostradorId)
})

async function updatePassword() {
  error.value = ''
  feedback.value = ''
  if (!currentPassword.value || !newPassword.value || !confirmPassword.value) {
    error.value = t('settings.completePasswords')
    return
  }
  if (newPassword.value.length < 6) {
    error.value = t('settings.passwordLength')
    return
  }
  if (newPassword.value !== confirmPassword.value) {
    error.value = t('settings.passwordMismatch')
    return
  }
  saving.value = true
  try {
    await http.patch(`/usuarios/${auth.user.id}/password`, {
      currentPassword: currentPassword.value,
      newPassword: newPassword.value,
    })
    currentPassword.value = ''
    newPassword.value = ''
    confirmPassword.value = ''
    feedback.value = t('settings.passwordUpdated')
  } catch (_) {
    error.value = t('settings.wrongPassword')
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <AppLayout title="Configuración" subtitle="Perfil y preferencias de tu cuenta">
    <div class="config-grid">
      <section class="card config-card">
        <div class="config-header"><h2>{{ t('settings.userProfile') }}</h2></div>
        <div class="config-body">
          <div class="avatar-big">{{ auth.user?.nombre?.charAt(0) }}</div>
          <div class="field-group">
            <div class="field"><label>{{ t('common.name') }}</label><input type="text" :value="auth.user?.nombre" readonly /></div>
            <div class="field"><label>{{ t('settings.email') }}</label><input type="email" :value="auth.user?.email" readonly /></div>
            <div class="field"><label>{{ t('common.role') }}</label><input type="text" :value="roleText" readonly /></div>
          </div>
        </div>
      </section>

      <section class="card config-card">
        <div class="config-header"><h2>{{ t('settings.assignedCounter') }}</h2></div>
        <div class="config-body">
          <div class="window-info">
            <div class="window-num">{{ operator.mostrador?.numero ?? '--' }}</div>
            <div class="window-detail">
              <p class="window-service">{{ operator.mostrador?.servicioNombre ?? t('settings.notApplicable') }}</p>
              <p class="window-sede">{{ operator.mostrador?.sedeNombre ?? t('settings.citizenSupervisorAccount') }}</p>
              <span class="badge" :class="operator.mostrador ? 'badge-green' : 'badge-gray'">{{ operator.mostrador ? t('common.active') : t('common.unassigned') }}</span>
            </div>
          </div>
        </div>
      </section>

      <section class="card config-card">
        <div class="config-header"><h2>{{ t('settings.security') }}</h2></div>
        <div class="config-body">
          <p v-if="feedback" class="feedback">{{ feedback }}</p>
          <p v-if="error" class="error-msg">{{ error }}</p>
          <form class="field-group" @submit.prevent="updatePassword">
            <div class="field"><label>{{ t('settings.currentPassword') }}</label><input v-model="currentPassword" type="password" placeholder="••••••••" /></div>
            <div class="field"><label>{{ t('settings.newPassword') }}</label><input v-model="newPassword" type="password"  :placeholder="t('settings.min6')" /></div>
            <div class="field"><label>{{ t('settings.confirmPassword') }}</label><input v-model="confirmPassword" type="password"  :placeholder="t('settings.repeatPassword')" /></div>
            <button class="save-btn" :disabled="saving">{{ saving ? t('settings.updating') : t('settings.updatePassword') }}</button>
          </form>
        </div>
      </section>
    </div>
  </AppLayout>
</template>

<style scoped>
.config-grid { display: grid; grid-template-columns: 1fr 1fr; gap: .875rem; }
@media(max-width:900px) { .config-grid { grid-template-columns: 1fr; } }
.config-card { overflow: hidden; }.config-header { padding: .875rem 1.25rem; border-bottom: 1px solid var(--border); }.config-header h2 { font-size: .9rem; font-weight: 600; }.config-body { padding: 1.25rem; }
.avatar-big { width: 64px; height: 64px; border-radius: 50%; background: var(--primary); color: #fff; font-size: 1.5rem; font-weight: 800; display: flex; align-items: center; justify-content: center; margin: 0 auto 1.25rem; }
.field-group { display: flex; flex-direction: column; gap: .875rem; }.field { display: flex; flex-direction: column; gap: .3rem; }label { font-size: .78rem; font-weight: 600; color: var(--text-muted); text-transform: uppercase; letter-spacing: .05em; }input { padding: .55rem .875rem; border: 1.5px solid var(--border); border-radius: 8px; font-size: .875rem; color: var(--text); background: var(--bg); outline: none; }input:focus { border-color: var(--primary); background: var(--surface); }input[readonly] { cursor: default; color: var(--text-muted); }
.window-info { display: flex; align-items: center; gap: 1.25rem; }.window-num{ font-size: 3rem; font-weight: 900; color: var(--primary); line-height: 1; }.window-detail { display: flex; flex-direction: column; gap: .35rem; }.window-service { font-size: .95rem; font-weight: 600; }.window-sede{ font-size: .8rem; color: var(--text-muted); }
.save-btn { padding: .6rem 1.25rem; background: var(--primary); color: #fff; border: none; border-radius: 8px; font-size: .875rem; font-weight: 600; cursor: pointer; transition: background .15s; align-self: flex-start; }.save-btn:hover:not(:disabled) { background: var(--primary-dark); }.save-btn:disabled{opacity:.6;cursor:wait}.feedback{background:#dcfce7;color:#15803d;border:1px solid #bbf7d0;border-radius:8px;padding:.65rem .85rem;font-size:.82rem;font-weight:800}.error-msg{background:#fee2e2;color:#b91c1c;border-radius:8px;padding:.65rem .85rem;font-size:.82rem;font-weight:800}
</style>
