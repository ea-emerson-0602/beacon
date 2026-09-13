"use client"

import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { Suspense, useState, type FormEvent } from "react"
import { AuthShell } from "@/components/AuthShell"
import { Alert } from "@/components/ui/Alert"
import { Button } from "@/components/ui/Button"
import { Field, PasswordInput } from "@/components/ui/Field"
import { api } from "@/lib/api"
import { PASSWORD_HINT, isStrongPassword } from "@/lib/validation"

const ResetPasswordForm = () => {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get("token") ?? ""
  const [error, setError] = useState(
    token ? "" : "This reset link is missing a token.",
  )
  const [pending, setPending] = useState(false)

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    const password = String(form.get("password") ?? "")
    const confirm = String(form.get("confirm") ?? "")
    setError("")

    if (!isStrongPassword(password)) {
      setError(PASSWORD_HINT)
      return
    }
    if (password !== confirm) {
      setError("The two passwords do not match")
      return
    }

    setPending(true)

    try {
      await api("/auth/reset-password", {
        method: "POST",
        body: JSON.stringify({ token, password }),
      })
      router.push("/login")
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : "Could not reset password",
      )
      setPending(false)
    }
  }

  return (
    <AuthShell
      title="Choose a new password"
      subtitle="The link is single-use and expires after one hour."
      footer={
        <>
          Back to{" "}
          <Link href="/login" className="text-brand-2 hover:underline">
            sign in
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <Field label="New password" htmlFor="password" hint={PASSWORD_HINT}>
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

        <Field label="Confirm password" htmlFor="confirm">
          <PasswordInput
            id="confirm"
            name="confirm"
            autoComplete="new-password"
            minLength={8}
            maxLength={128}
            required
            placeholder="••••••••"
          />
        </Field>

        <Alert message={error} />

        <Button type="submit" disabled={pending || !token} className="w-full">
          {pending ? "Saving…" : "Update password"}
        </Button>
      </form>
    </AuthShell>
  )
}

const ResetPasswordPage = () => (
  <Suspense
    fallback={
      <main className="grid min-h-screen place-items-center text-sm text-muted">
        Loading reset form…
      </main>
    }
  >
    <ResetPasswordForm />
  </Suspense>
)

export default ResetPasswordPage
