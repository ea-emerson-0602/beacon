"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState, type FormEvent } from "react"
import { AuthShell } from "@/components/AuthShell"
import { Alert } from "@/components/ui/Alert"
import { Button, ButtonLink } from "@/components/ui/Button"
import { Field, Input, PasswordInput } from "@/components/ui/Field"
import { api } from "@/lib/api"

const LoginPage = () => {
  const router = useRouter()
  const [error, setError] = useState("")
  const [pending, setPending] = useState(false)

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    setError("")
    setPending(true)

    try {
      await api("/auth/login", {
        method: "POST",
        body: JSON.stringify({
          email: form.get("email"),
          password: form.get("password"),
        }),
      })
      router.push("/dashboard")
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not sign in")
      setPending(false)
    }
  }

  return (
    <AuthShell
      title="Sign in"
      subtitle="Use the account you created for your organisation."
      footer={
        <>
          No account yet?{" "}
          <Link href="/register" className="text-brand-2 hover:underline">
            Create one
          </Link>
          <span className="mx-2 text-line-strong">·</span>
          <Link href="/demo" className="text-brand-2 hover:underline">
            Run the demo
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <Field label="Email" htmlFor="email">
          <Input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            maxLength={254}
            placeholder="you@company.com"
          />
        </Field>

        <Field label="Password" htmlFor="password">
          <PasswordInput
            id="password"
            name="password"
            autoComplete="current-password"
            minLength={8}
            maxLength={128}
            required
            placeholder="••••••••"
          />
        </Field>

        <div className="flex justify-end">
          <Link
            href="/forgot-password"
            className="text-xs text-brand-2 hover:underline"
          >
            Forgot password?
          </Link>
        </div>

        <Alert message={error} />

        <Button type="submit" disabled={pending} className="w-full">
          {pending ? "Signing in…" : "Sign in"}
        </Button>

        <ButtonLink href="/demo" variant="secondary" className="w-full">
          Run the demo instead
        </ButtonLink>
      </form>
    </AuthShell>
  )
}

export default LoginPage
