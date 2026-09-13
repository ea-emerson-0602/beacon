"use client"

import { useState, type FormEvent } from "react"
import { Alert } from "@/components/ui/Alert"
import { Button } from "@/components/ui/Button"
import { Card, CardBody, CardHeader } from "@/components/ui/Card"
import { Field, PasswordInput } from "@/components/ui/Field"
import { api } from "@/lib/api"
import { PASSWORD_HINT, isStrongPassword } from "@/lib/validation"
import type { Me } from "@/lib/types"

type AccountPanelProps = {
  me: Me
}

export const AccountPanel = ({ me }: AccountPanelProps) => {
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [pending, setPending] = useState(false)

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const form = event.currentTarget
    const data = new FormData(form)
    const currentPassword = String(data.get("currentPassword") ?? "")
    const newPassword = String(data.get("newPassword") ?? "")
    const confirm = String(data.get("confirm") ?? "")
    setError("")
    setSuccess("")

    if (!isStrongPassword(newPassword)) {
      setError(PASSWORD_HINT)
      return
    }
    if (newPassword !== confirm) {
      setError("The two new passwords do not match")
      return
    }

    setPending(true)

    try {
      await api("/auth/change-password", {
        method: "POST",
        body: JSON.stringify({ currentPassword, newPassword }),
      })
      form.reset()
      setSuccess("Password updated. Use the new password the next time you sign in.")
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : "Could not change password",
      )
    } finally {
      setPending(false)
    }
  }

  return (
    <Card>
      <CardHeader
        title="Account"
        description={`${me.name} · ${me.email}. Change your password here if you still know the current one. Use forgot password on the sign-in page if you do not.`}
      />
      <CardBody>
        <form onSubmit={handleSubmit} className="max-w-md space-y-4">
          <Field label="Current password" htmlFor="currentPassword">
            <PasswordInput
              id="currentPassword"
              name="currentPassword"
              autoComplete="current-password"
              minLength={8}
              maxLength={128}
              required
              placeholder="••••••••"
            />
          </Field>

          <Field
            label="New password"
            htmlFor="newPassword"
            hint={PASSWORD_HINT}
          >
            <PasswordInput
              id="newPassword"
              name="newPassword"
              autoComplete="new-password"
              minLength={8}
              maxLength={128}
              required
              placeholder="••••••••"
            />
          </Field>

          <Field label="Confirm new password" htmlFor="confirm">
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
          <Alert message={success} tone="ok" />

          <Button type="submit" disabled={pending}>
            {pending ? "Saving…" : "Update password"}
          </Button>
        </form>
      </CardBody>
    </Card>
  )
}
