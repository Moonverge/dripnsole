import { Icon } from '@iconify/react'

export default function Suspended() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-white px-4">
      <div className="w-full max-w-md text-center">
        <div className="mb-6 inline-flex h-20 w-20 items-center justify-center rounded-full bg-accent-red/10">
          <Icon icon="mdi:account-off-outline" width={48} className="text-accent-red" />
        </div>
        <h1 className="mb-3 font-goblin text-3xl font-bold">Account Suspended</h1>
        <p className="mb-6 font-martian text-sm leading-relaxed text-text-secondary">
          Your DripNSole account has been suspended. If you believe this is a mistake, please
          contact our support team.
        </p>
        <a
          href="mailto:support@dripnsole.ph"
          className="inline-flex items-center gap-2 rounded-full bg-black px-6 py-3 font-martian text-sm font-medium text-white no-underline transition-colors hover:bg-brand"
        >
          <Icon icon="mdi:email-outline" width={18} />
          support@dripnsole.ph
        </a>
      </div>
    </div>
  )
}
