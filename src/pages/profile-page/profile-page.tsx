import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  UserCircle2, LogOut, Plus, Shield,
  ChevronRight, Users, Bell,
} from 'lucide-react'
import { getTeam, addMember } from '@/api/team'
import { Modal } from '@/components/modal'
import { useAuth } from '@/store/auth'
import { useToast } from '@/store/toast'
import { usePushNotifications } from '@/hooks/usePushNotifications'
import { cn } from '@/lib/cn'
import type { TeamMember } from '@/types'
import type { InitialAvatarProps, AddMemberForm } from './profile-page.type'

const styles = {
  root: 'flex flex-col h-full bg-bg overflow-y-auto',
  inner: 'px-4 pt-12 pb-6 md:pt-8 w-full max-w-2xl mx-auto',
  profileCard: 'flex items-center gap-4 bg-surface border border-border rounded-2xl p-5 mb-6',
  label: 'text-xs font-semibold text-text-sub uppercase tracking-wider block mb-1.5',
  input: 'w-full bg-surface-high border border-border rounded-xl px-4 py-3 text-text-primary placeholder-text-muted text-sm outline-none focus:border-border-focus',
} as const

const EMPTY_FORM: AddMemberForm = { name: '', password: '', role: 'worker' }

function InitialAvatar({ name, role }: InitialAvatarProps) {
  const initials = name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)

  return (
    <div
      className={cn(
        'w-10 h-10 rounded-full border flex items-center justify-center text-sm font-bold',
        role === 'manager'
          ? 'bg-accent-bg border-accent/30 text-accent'
          : 'bg-success-bg border-success/30 text-success',
      )}
      aria-label={`${name} — ${role}`}
    >
      {initials}
    </div>
  )
}

export function ProfilePage() {
  const { user, signOut } = useAuth()
  const toast = useToast()
  const qc = useQueryClient()
  const { subscribe, supported, subscribed } = usePushNotifications()

  const [addModal, setAddModal] = useState(false)
  const [form, setForm] = useState<AddMemberForm>(EMPTY_FORM)

  const { data: team = [] } = useQuery({
    queryKey: ['team'],
    queryFn: getTeam,
    enabled: user?.role === 'manager',
  })

  const addMut = useMutation({
    mutationFn: () => addMember({ name: form.name, password: form.password, role: form.role }),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ['team'] })
      const newMember = res.data
      toast(`Added ${newMember.name} (login: ${newMember.userName})`, 'success')
      setAddModal(false)
      setForm(EMPTY_FORM)
    },
    onError: (e: unknown) => {
      const axiosErr = e as { response?: { data?: { message?: string } } }
      toast(axiosErr.response?.data?.message ?? 'Failed to add member', 'error')
    },
  })

  const isIOS = /iphone|ipad/i.test(navigator.userAgent)
  const isStandalone = window.matchMedia('(display-mode: standalone)').matches
  const showIOSHint = isIOS && !isStandalone && supported

  const handleSubscribe = async (): Promise<void> => {
    try {
      await subscribe()
      toast('Push notifications enabled', 'success')
    } catch {
      toast('Permission denied — allow notifications in browser settings', 'error')
    }
  }

  const closeAddModal = (): void => {
    setAddModal(false)
    setForm(EMPTY_FORM)
  }

  return (
    <div className={styles.root}>
      <div className={styles.inner}>
        {/* Profile card */}
        <div className={styles.profileCard}>
          <div className="w-14 h-14 rounded-2xl bg-accent-bg border border-accent/20 flex items-center justify-center shrink-0">
            <UserCircle2 size={28} className="text-accent" aria-hidden="true" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-text-primary font-semibold truncate">{user?.name}</p>
            <p className="text-text-sub text-sm truncate font-mono">@{user?.userName}</p>
            {user?.email && (
              <p className="text-text-muted text-xs truncate">{user.email}</p>
            )}
            <span className={cn(
              'inline-flex items-center gap-1 mt-1.5 text-xs font-semibold px-2 py-0.5 rounded-lg',
              user?.role === 'manager' ? 'bg-accent-bg text-accent' : 'bg-success-bg text-success',
            )}>
              <Shield size={11} aria-hidden="true" />
              {user?.role === 'manager' ? 'Manager' : 'Worker'}
            </span>
          </div>
        </div>

        {/* iOS PWA hint */}
        {showIOSHint && (
          <div className="bg-warning-bg border border-warning/30 rounded-2xl px-4 py-3 mb-4" role="note">
            <p className="text-warning text-sm font-medium">Enable push notifications on iOS</p>
            <p className="text-text-sub text-xs mt-1">
              Tap <span className="text-text-primary font-medium">Share</span> → "Add to Home Screen" → open from home screen, then return here.
            </p>
          </div>
        )}

        {/* Push notification toggle */}
        {supported && !showIOSHint && !subscribed && (
          <button
            type="button"
            onClick={handleSubscribe}
            className="w-full flex items-center justify-between bg-surface border border-border rounded-2xl px-4 py-3.5 mb-4 hover:border-border-focus transition-colors"
            aria-label="Enable push notifications"
          >
            <div className="flex items-center gap-3">
              <Bell size={18} className="text-text-sub" aria-hidden="true" />
              <span className="text-text-primary text-sm font-medium">Enable push notifications</span>
            </div>
            <ChevronRight size={18} className="text-text-muted" aria-hidden="true" />
          </button>
        )}

        {subscribed && (
          <div
            className="w-full flex items-center gap-3 bg-success-bg border border-success/30 rounded-2xl px-4 py-3.5 mb-4"
            role="status"
            aria-live="polite"
          >
            <Bell size={18} className="text-success" aria-hidden="true" />
            <span className="text-success text-sm font-medium">Push notifications enabled</span>
          </div>
        )}

        {/* Team section — managers only */}
        {user?.role === 'manager' && (
          <section className="mb-6" aria-labelledby="team-heading">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Users size={16} className="text-text-sub" aria-hidden="true" />
                <h2 id="team-heading" className="text-text-primary font-semibold text-sm">Team</h2>
                <span className="text-xs text-text-muted bg-surface-high px-2 py-0.5 rounded-full">{team.length}</span>
              </div>
              <button
                type="button"
                onClick={() => setAddModal(true)}
                className="flex items-center gap-1.5 text-accent text-xs font-semibold bg-accent-bg border border-accent/30 px-3 py-1.5 rounded-lg hover:bg-accent/20 transition-colors"
                aria-label="Add team member"
              >
                <Plus size={14} aria-hidden="true" />
                Add
              </button>
            </div>

            <div
              className="grid grid-cols-1 md:grid-cols-2 gap-2"
              role="list"
              aria-label="Team members"
            >
              {team.length === 0 ? (
                <div className="md:col-span-2 bg-surface border border-border rounded-2xl p-6 text-center">
                  <Users size={28} className="text-text-muted mx-auto mb-2" aria-hidden="true" />
                  <p className="text-text-sub text-sm">No team members yet</p>
                  <p className="text-text-muted text-xs mt-1">Add workers so they can scan and update stock</p>
                </div>
              ) : (
                team.map((m: TeamMember) => (
                  <div
                    key={m.id}
                    role="listitem"
                    className="flex items-center gap-3 bg-surface border border-border rounded-xl px-4 py-3"
                  >
                    <InitialAvatar name={m.name} role={m.role} />
                    <div className="flex-1 min-w-0">
                      <p className="text-text-primary text-sm font-medium truncate">{m.name}</p>
                      <p className="text-text-muted text-xs truncate font-mono">@{m.userName}</p>
                    </div>
                    <span className={cn(
                      'text-xs font-medium px-2 py-0.5 rounded-lg',
                      m.role === 'manager' ? 'bg-accent-bg text-accent' : 'bg-success-bg text-success',
                    )}>
                      {m.role}
                    </span>
                  </div>
                ))
              )}
            </div>
          </section>
        )}

        {/* Sign out */}
        <button
          type="button"
          onClick={signOut}
          className="w-full flex items-center justify-between bg-surface border border-border rounded-2xl px-4 py-4 hover:border-danger/40 hover:bg-danger-bg transition-colors"
          aria-label="Sign out"
        >
          <span className="text-danger font-medium text-sm">Sign out</span>
          <LogOut size={18} className="text-danger" aria-hidden="true" />
        </button>

        <p className="text-text-muted text-xs text-center mt-6">LazyTracker v1.0.0</p>
      </div>

      {/* Add member modal */}
      <Modal open={addModal} onClose={closeAddModal} title="Add Team Member">
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label htmlFor="member-name" className={styles.label}>Full name</label>
              <input
                id="member-name"
                type="text"
                placeholder="Jane Doe"
                value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                className={styles.input}
                required
                aria-required="true"
              />
            </div>

            <div className="md:col-span-2">
              <label htmlFor="member-password" className={styles.label}>Password</label>
              <input
                id="member-password"
                type="password"
                placeholder="Min. 8 characters"
                value={form.password}
                onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                className={styles.input}
                required
                aria-required="true"
              />
            </div>
          </div>

          <div>
            <span className={styles.label} id="role-label">Role</span>
            <div className="grid grid-cols-2 gap-2" role="radiogroup" aria-labelledby="role-label">
              {(['worker', 'manager'] as const).map(r => (
                <button
                  key={r}
                  type="button"
                  role="radio"
                  aria-checked={form.role === r}
                  onClick={() => setForm(f => ({ ...f, role: r }))}
                  className={cn(
                    'py-3 rounded-xl text-sm font-medium border transition-colors',
                    form.role === r
                      ? 'bg-accent-bg border-accent text-accent'
                      : 'border-border text-text-sub hover:border-border-focus',
                  )}
                >
                  {r === 'worker' ? '⚙️ Worker' : '👑 Manager'}
                </button>
              ))}
            </div>
            <p className="text-text-muted text-xs mt-2">
              {form.role === 'manager'
                ? 'Can manage products, set thresholds, and view the whole team'
                : 'Can scan products and update stock quantities'}
            </p>
          </div>

          <div className="bg-surface-high rounded-xl px-4 py-3">
            <p className="text-text-muted text-xs">
              A login name will be generated automatically from the full name.
              Share it with the worker so they can sign in.
            </p>
          </div>

          <button
            type="button"
            onClick={() => addMut.mutate()}
            disabled={addMut.isPending || !form.name || form.password.length < 8}
            className="w-full bg-accent hover:bg-accent-light disabled:opacity-50 text-white font-semibold py-3 rounded-xl text-sm transition-colors"
          >
            {addMut.isPending ? 'Adding…' : 'Add Member'}
          </button>
        </div>
      </Modal>
    </div>
  )
}
