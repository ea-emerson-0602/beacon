"use client"

import Link from "next/link"
import { useState, type FormEvent } from "react"
import { AuthShell } from "@/components/AuthShell"
import { Alert } from "@/components/ui/Alert"
import { Button, ButtonLink } from "@/components/ui/Button"
import { Field, Input } from "@/components/ui/Field"
import { api } from "@/lib/api"

type ForgotResponse = {
  ok: boolean
  devResetUrl?: string
}

const ForgotPasswordPage = () => {
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [devResetUrl, setDevResetUrl] = useState("")
  const [pending, setPending] = useState(false)

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    setError("")
    setSuccess("")
    setDevResetUrl("")
    setPending(true)

    try {
      const result = await api<ForgotResponse>("/auth/forgot-password", {
        method: "POST",
        body: JSON.stringify({ email: form.get("email") }),
      })
      setSuccess(
        "If that email is registered, we sent a reset link. It expires in one hour.",
      )
      if (result.devResetUrl) {
        setDevResetUrl(result.devResetUrl)
      }
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : "Could not start a reset",
      )
    } finally {
      setPending(false)
    }
  }

  return (
    <AuthShell
      title="Reset your password"
      subtitle="Enter the email on the account. We will send a one-hour reset link if it exists."
      footer={
        <>
          Remembered it?{" "}
          <Link href="/login" className="text-brand-2 hover:underline">
            Sign in
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

        <Alert message={error} />
        <Alert message={success} tone="ok" />

        {devResetUrl ? (
          <div className="rounded-xl border border-line bg-surface-2 px-3.5 py-3 text-sm text-muted">
            <p>No mailer is configured locally, so here is the reset link:</p>
            <ButtonLink href={devResetUrl} variant="secondary" className="mt-3 w-full">
              Continue to reset
            </ButtonLink>
          </div>
        ) : null}

        <Button type="submit" disabled={pending} className="w-full">
          {pending ? "Sending…" : "Send reset link"}
        </Button>
      </form>
    </AuthShell>
  )
}

export default ForgotPasswordPage
