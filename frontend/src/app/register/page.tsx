"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState, type FormEvent } from "react"
import { AuthShell } from "@/components/AuthShell"
import { Alert } from "@/components/ui/Alert"
import { Button } from "@/components/ui/Button"
import { Field, Input, PasswordInput } from "@/components/ui/Field"
import { api } from "@/lib/api"
import { PATTERNS, PASSWORD_HINT, isStrongPassword } from "@/lib/validation"

const RegisterPage = () => {
  const router = useRouter()
  const [error, setError] = useState("")
  const [pending, setPending] = useState(false)

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    const password = String(form.get("password") ?? "")
    setError("")

    if (!isStrongPassword(password)) {
      setError(PASSWORD_HINT)
      return
    }

    setPending(true)

    try {
      await api("/auth/register", {
        method: "POST",
        body: JSON.stringify({
          name: form.get("name"),
          email: form.get("email"),
          password,
          organizationName: form.get("organizationName"),
        }),
      })
      router.push("/dashboard")
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : "Could not create account",
      )
      setPending(false)
    }
  }

  return (
    <AuthShell
      title="Open your status page"
      subtitle="Creating an account also creates your organisation and its public page."
      footer={
        <>
          Already using Beacon?{" "}
          <Link href="/login" className="text-brand-2 hover:underline">
            Sign in
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <Field label="Your name" htmlFor="name">
          <Input
            id="name"
            name="name"
            required
            pattern={PATTERNS.name}
            title="Letters, spaces, apostrophes, and hyphens only"
            maxLength={80}
            placeholder="Ada Okonkwo"
          />
        </Field>

        <Field
          label="Organisation"
          htmlFor="organizationName"
          hint="This becomes your public page URL, for example /s/acme-cloud"
        >
          <Input
            id="organizationName"
            name="organizationName"
            required
            pattern={PATTERNS.organization}
            title="Start with a letter or number"
            maxLength={80}
            placeholder="Acme Cloud"
          />
        </Field>

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

        <Field label="Password" htmlFor="password" hint={PASSWORD_HINT}>
          <PasswordInput
            id="password"
            name="password"
            autoComplete="new-password"
            minLength={8}
            maxLength={128}
            required
            placeholder="••••••••"
          />
        </Field>

        <Alert message={error} />

        <Button type="submit" disabled={pending} className="w-full">
          {pending ? "Creating account…" : "Create account"}
        </Button>
      </form>
    </AuthShell>
  )
}

export default RegisterPage
