import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useNavigate } from 'react-router-dom'
import { api } from '../api'
import { useAuth } from '../store'

const schema = z.object({
  email: z.string().email('Enter a valid email'),
  password: z.string().min(1, 'Enter the password'),
})

const DEMO = [
  { label: 'Meera', role: 'Team lead', email: 'meera@demo.test' },
  { label: 'Aarav', role: 'Leaving member', email: 'aarav@demo.test' },
  { label: 'Kiran', role: 'New joiner', email: 'kiran@demo.test' },
]

export default function Login() {
  const navigate = useNavigate()
  const login = useAuth((s) => s.login)
  const [error, setError] = useState('')
  const {
    register, handleSubmit, setValue,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { email: '', password: 'Demo@1234' },
  })

  const onSubmit = async (values) => {
    setError('')
    try {
      const data = await api('/auth/login', { method: 'POST', body: values })
      login(data.token, data.user)
      navigate('/')
    } catch (e) {
      setError(e.message)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow">
        <h1 className="text-2xl font-bold text-slate-900">Evidence-Linked Handover</h1>
        <p className="mt-1 text-sm text-slate-500">
          Reconstruct a project, verify every claim, and hand it over safely.
        </p>

        <p className="mt-6 text-xs font-semibold uppercase tracking-wide text-slate-400">
          Demo logins (synthetic data)
        </p>
        <div className="mt-2 grid grid-cols-3 gap-2">
          {DEMO.map((d) => (
            <button
              key={d.email}
              type="button"
              onClick={() => setValue('email', d.email)}
              className="rounded-lg border border-slate-200 px-2 py-2 text-left hover:border-teal-600 hover:bg-teal-50"
            >
              <div className="text-sm font-semibold text-slate-800">{d.label}</div>
              <div className="text-xs text-slate-500">{d.role}</div>
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="mt-5 space-y-3">
          <div>
            <label className="text-sm font-medium text-slate-700">Email</label>
            <input
              {...register('email')}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
              placeholder="Click a demo login above"
            />
            {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>}
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700">Password</label>
            <input
              type="password"
              {...register('password')}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
            />
            {errors.password && <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>}
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button
            disabled={isSubmitting}
            className="w-full rounded-lg bg-teal-700 py-2 font-semibold text-white hover:bg-teal-800 disabled:opacity-60"
          >
            {isSubmitting ? 'Signing in...' : 'Sign in'}
          </button>
        </form>
      </div>
    </div>
  )
}