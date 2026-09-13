import { Logo } from "@/components/Logo"
import { ButtonLink } from "@/components/ui/Button"

const NotFound = () => (
  <main className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center px-6 text-center">
    <Logo />
    <h1 className="mt-10 text-2xl font-semibold tracking-tight">
      Page not found
    </h1>
    <p className="mt-3 text-sm text-muted">
      The page you were looking for does not exist.
    </p>
    <ButtonLink href="/" variant="secondary" className="mt-8">
      Back to Beacon
    </ButtonLink>
  </main>
)

export default NotFound
