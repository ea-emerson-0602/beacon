"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { Logo } from "@/components/Logo"
import { ThemeToggle } from "@/components/ThemeToggle"
import { Alert } from "@/components/ui/Alert"
import { ButtonLink } from "@/components/ui/Button"
import { api } from "@/lib/api"
import { DEMO_EMAIL, DEMO_PASSWORD } from "@/lib/validation"

const DemoPage = () => {
  const router = useRouter()
  const [error, setError] = useState("")

  useEffect(() => {
    const runDemo = async () => {
      try {
        await api("/auth/login", {
          method: "POST",
          body: JSON.stringify({
            email: DEMO_EMAIL,
            password: DEMO_PASSWORD,
          }),
        })
        router.replace("/dashboard")
      } catch (caught) {
        setError(
          caught instanceof Error
            ? caught.message
            : "Could not open the demo console",
        )
      }
    }

    runDemo()
  }, [router])

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center px-6 text-center">
      <div className="absolute right-6 top-6">
        <ThemeToggle />
      </div>
      <Logo />
      <h1 className="mt-10 text-2xl font-semibold tracking-tight">
        Opening the demo console
      </h1>
      {error ? (
        <div className="mt-6 w-full text-left">
          <Alert message={error} />
          <p className="mt-3 text-sm text-muted">
            The seeded account is {DEMO_EMAIL}. Run{" "}
            <span className="font-[family-name:var(--font-mono)]">
              npm run seed
            </span>{" "}
            from the backend folder if it is missing.
          </p>
          <div className="mt-6 flex justify-center gap-3">
            <ButtonLink href="/s/acme" variant="secondary">
              View the public demo
            </ButtonLink>
            <ButtonLink href="/login">Sign in</ButtonLink>
          </div>
        </div>
      ) : (
        <p className="mt-3 text-sm text-muted">
          Signing in to the seeded Acme organisation…
        </p>
      )}
      <p className="mt-8 text-xs text-faint">
        Want your own organisation?{" "}
        <Link href="/register" className="text-brand-2 hover:underline">
          Create an account
        </Link>
      </p>
    </main>
  )
}

export default DemoPage
