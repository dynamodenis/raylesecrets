import { useState } from 'react'
import { createFileRoute, useRouter } from '@tanstack/react-router'

import { Field, Notice, adminInput } from '#/components/admin-ui'
import { formatPhone } from '#/lib/order'
import {
  getAdminSettings,
  savePickupLocation,
  saveSettings,
} from '#/server/admin'

export const Route = createFileRoute('/admin/_auth/settings')({
  loader: () => getAdminSettings(),
  component: SettingsPage,
})

type Settings = Awaited<ReturnType<typeof getAdminSettings>>
type Pickup = Settings['pickupLocations'][number]

function SettingsPage() {
  const { payment, pickupLocations } = Route.useLoaderData()
  const [adding, setAdding] = useState(false)

  return (
    <div className="max-w-3xl">
      <h1 className="text-4xl">Settings</h1>

      <PaymentForm payment={payment} />

      <h2 className="mt-10 text-3xl">Pickup points</h2>
      <p className="mt-1 text-ink-muted">
        Customers choose one of the active pickup points at checkout. The first
        active one is shown in the shop footer.
      </p>
      <div className="mt-4 space-y-4">
        {pickupLocations.map((location) => (
          <PickupForm key={location.id} location={location} />
        ))}
        {adding ? (
          <PickupForm location={null} onDone={() => setAdding(false)} />
        ) : (
          <button
            type="button"
            className="btn btn-outline"
            onClick={() => setAdding(true)}
          >
            Add pickup point
          </button>
        )}
      </div>
    </div>
  )
}

function PaymentForm({ payment }: { payment: Settings['payment'] }) {
  const router = useRouter()
  const [form, setForm] = useState({
    ...payment,
    whatsappNumber: payment.whatsappNumber
      ? formatPhone(payment.whatsappNumber)
      : '',
  })
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)

  const input = (key: keyof typeof form, label: string, hint?: string) => (
    <Field label={label} hint={hint} htmlFor={key}>
      <input
        id={key}
        className={adminInput}
        value={form[key]}
        onChange={(event) => {
          setSaved(false)
          setForm((current) => ({ ...current, [key]: event.target.value }))
        }}
      />
    </Field>
  )

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault()
    setError(null)
    setSaved(false)
    setBusy(true)
    try {
      const result = await saveSettings({ data: form })
      if (!result.ok) return setError(result.message)
      await router.invalidate()
      setSaved(true)
    } catch {
      setError(
        'Could not save. Check the WhatsApp number is a Kenyan mobile number, for example 0712 345 678.',
      )
    } finally {
      setBusy(false)
    }
  }

  return (
    <form
      onSubmit={onSubmit}
      noValidate
      className="mt-6 space-y-5 border border-lilac-line bg-white p-5"
    >
      <h2 className="text-3xl">Payment and contact</h2>
      <p className="text-ink-muted">
        Fill in only the M-PESA options you have. Customers are offered the ones
        that are filled in.
      </p>
      <div className="grid gap-5 sm:grid-cols-2">
        {input('paybillNumber', 'Paybill business number')}
        {input('tillNumber', 'Till number (Buy Goods)')}
        {input('pochiNumber', 'Pochi la Biashara phone number')}
        {input(
          'registeredName',
          'Registered name',
          'The name customers see when they pay.',
        )}
        {input(
          'whatsappNumber',
          'WhatsApp number',
          'Used for every WhatsApp button in the shop.',
        )}
      </div>
      <Notice kind="error">{error}</Notice>
      <Notice kind="success">{saved ? 'Saved.' : null}</Notice>
      <button
        type="submit"
        className="btn btn-primary disabled:opacity-60"
        disabled={busy}
      >
        {busy ? 'Saving…' : 'Save'}
      </button>
    </form>
  )
}

function PickupForm({
  location,
  onDone,
}: {
  location: Pickup | null
  onDone?: () => void
}) {
  const router = useRouter()
  const [form, setForm] = useState({
    name: location?.name ?? '',
    address: location?.address ?? '',
    hours: location?.hours ?? '',
    isActive: location?.isActive ?? true,
  })
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)
  const prefix = `pickup-${location?.id ?? 'new'}`

  const input = (key: 'name' | 'address' | 'hours', label: string) => (
    <Field label={label} htmlFor={`${prefix}-${key}`}>
      <input
        id={`${prefix}-${key}`}
        className={adminInput}
        value={form[key]}
        onChange={(event) => {
          setSaved(false)
          setForm((current) => ({ ...current, [key]: event.target.value }))
        }}
      />
    </Field>
  )

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault()
    setError(null)
    setSaved(false)
    if (form.name.trim().length < 2 || form.address.trim().length < 2) {
      return setError('Please enter a name and an address.')
    }
    setBusy(true)
    try {
      const result = await savePickupLocation({
        data: { id: location?.id ?? null, ...form },
      })
      if (!result.ok) return setError(result.message)
      await router.invalidate()
      if (location) setSaved(true)
      else onDone?.()
    } catch {
      setError('Could not save. Please try again.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <form
      onSubmit={onSubmit}
      noValidate
      className="space-y-4 border border-lilac-line bg-white p-5"
    >
      <div className="grid gap-4 sm:grid-cols-2">
        {input('name', 'Name')}
        {input('hours', 'Opening hours')}
      </div>
      {input('address', 'Address')}
      <label className="flex items-center gap-3">
        <input
          type="checkbox"
          className="size-5 accent-plum"
          checked={form.isActive}
          onChange={(event) => {
            setSaved(false)
            setForm((current) => ({
              ...current,
              isActive: event.target.checked,
            }))
          }}
        />
        <span className="font-medium">Active</span>
      </label>
      <Notice kind="error">{error}</Notice>
      <Notice kind="success">{saved ? 'Saved.' : null}</Notice>
      <div className="flex gap-3">
        <button
          type="submit"
          className="btn btn-primary disabled:opacity-60"
          disabled={busy}
        >
          {busy ? 'Saving…' : location ? 'Save' : 'Add'}
        </button>
        {!location && (
          <button type="button" className="btn btn-outline" onClick={onDone}>
            Cancel
          </button>
        )}
      </div>
    </form>
  )
}
