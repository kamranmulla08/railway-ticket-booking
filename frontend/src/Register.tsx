import { useState, type FormEvent } from 'react'
import BrandLogo from './BrandLogo'
import SiteHeader from './SiteHeader'

type RegistrationFields = {
  name: string
  email: string
  phone: string
  password: string
  confirmPassword: string
}

type RegistrationErrors = Partial<Record<keyof RegistrationFields, string>>

type RegistrationResponse = {
  message?: string
  errors?: Record<string, string[]>
}

const emptyFields: RegistrationFields = {
  name: '',
  email: '',
  phone: '',
  password: '',
  confirmPassword: '',
}

function Register() {
  const [fields, setFields] = useState(emptyFields)
  const [errors, setErrors] = useState<RegistrationErrors>({})
  const [formMessage, setFormMessage] = useState('')
  const [isSuccess, setIsSuccess] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  function updateField(field: keyof RegistrationFields, value: string) {
    setFields((currentFields) => ({ ...currentFields, [field]: value }))
    setErrors((currentErrors) => ({ ...currentErrors, [field]: undefined }))
    setFormMessage('')
  }

  function validateFields(): RegistrationErrors {
    const nextErrors: RegistrationErrors = {}

    if (!fields.name.trim()) nextErrors.name = 'Enter your name.'
    if (!fields.email.trim()) {
      nextErrors.email = 'Enter your email address.'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(fields.email.trim())) {
      nextErrors.email = 'Enter a valid email address.'
    }
    if (!fields.phone.trim()) nextErrors.phone = 'Enter your phone number.'
    if (fields.password.length < 8) {
      nextErrors.password = 'Use at least 8 characters.'
    }
    if (!fields.confirmPassword) {
      nextErrors.confirmPassword = 'Confirm your password.'
    } else if (fields.password !== fields.confirmPassword) {
      nextErrors.confirmPassword = 'Passwords do not match.'
    }

    return nextErrors
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const nextErrors = validateFields()
    setErrors(nextErrors)
    setFormMessage('')

    if (Object.keys(nextErrors).length > 0) return

    setIsSubmitting(true)

    try {
      const response = await fetch('http://localhost:5000/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: fields.name.trim(),
          email: fields.email.trim(),
          phone: fields.phone.trim(),
          password: fields.password,
          role: 'CLIENT',
        }),
      })

      const result = (await response.json().catch(() => ({}))) as RegistrationResponse

      if (!response.ok) {
        const backendErrors = result.errors

        if (backendErrors) {
          const nextBackendErrors: RegistrationErrors = {}
          for (const field of Object.keys(backendErrors) as Array<keyof RegistrationFields>) {
            const messages = backendErrors[field]
            if (messages?.[0]) nextBackendErrors[field] = messages[0]
          }
          setErrors(nextBackendErrors)
        }

        setFormMessage(result.message ?? 'Registration failed. Please try again.')
        return
      }

      setIsSuccess(true)
      setFormMessage('Your account has been created successfully.')
    } catch {
      setFormMessage('Could not reach the server. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="register-page">
      <SiteHeader currentPage="register" />

      <main className="register-main">
        <section className="register-intro">
          <p className="section-kicker">YOUR NEXT JOURNEY STARTS HERE</p>
          <h1>Create your account</h1>
          <p>Save your details once, then make more room for the journey.</p>
        </section>

        <section className="register-card" aria-labelledby="register-title">
          {isSuccess ? (
            <div className="register-success" role="status">
              <span className="success-mark" aria-hidden="true">✓</span>
              <h2 id="register-title">You're all set.</h2>
              <p>{formMessage}</p>
              <a className="register-submit" href="/login">Continue to login</a>
            </div>
          ) : (
            <>
              <div className="register-card-heading">
                <h2 id="register-title">Register</h2>
                <p>All fields are required.</p>
              </div>

              <form className="register-form" onSubmit={handleSubmit} noValidate>
                <label className="register-field">
                  <span>Name</span>
                  <input
                    autoComplete="name"
                    value={fields.name}
                    onChange={(event) => updateField('name', event.target.value)}
                    aria-invalid={Boolean(errors.name)}
                    aria-describedby={errors.name ? 'register-name-error' : undefined}
                  />
                  {errors.name && <small id="register-name-error">{errors.name}</small>}
                </label>

                <label className="register-field">
                  <span>Email</span>
                  <input
                    type="email"
                    autoComplete="email"
                    value={fields.email}
                    onChange={(event) => updateField('email', event.target.value)}
                    aria-invalid={Boolean(errors.email)}
                    aria-describedby={errors.email ? 'register-email-error' : undefined}
                  />
                  {errors.email && <small id="register-email-error">{errors.email}</small>}
                </label>

                <label className="register-field">
                  <span>Phone</span>
                  <input
                    type="tel"
                    autoComplete="tel"
                    value={fields.phone}
                    onChange={(event) => updateField('phone', event.target.value)}
                    aria-invalid={Boolean(errors.phone)}
                    aria-describedby={errors.phone ? 'register-phone-error' : undefined}
                  />
                  {errors.phone && <small id="register-phone-error">{errors.phone}</small>}
                </label>

                <label className="register-field">
                  <span>Password</span>
                  <input
                    type="password"
                    autoComplete="new-password"
                    value={fields.password}
                    onChange={(event) => updateField('password', event.target.value)}
                    aria-invalid={Boolean(errors.password)}
                    aria-describedby={errors.password ? 'register-password-error' : undefined}
                  />
                  {errors.password && <small id="register-password-error">{errors.password}</small>}
                </label>

                <label className="register-field">
                  <span>Confirm Password</span>
                  <input
                    type="password"
                    autoComplete="new-password"
                    value={fields.confirmPassword}
                    onChange={(event) => updateField('confirmPassword', event.target.value)}
                    aria-invalid={Boolean(errors.confirmPassword)}
                    aria-describedby={errors.confirmPassword ? 'register-confirm-error' : undefined}
                  />
                  {errors.confirmPassword && (
                    <small id="register-confirm-error">{errors.confirmPassword}</small>
                  )}
                </label>

                {formMessage && <p className="register-message" role="alert">{formMessage}</p>}

                <button className="register-submit" type="submit" disabled={isSubmitting}>
                  {isSubmitting ? 'Creating account...' : 'Create account'}
                  {!isSubmitting && <span aria-hidden="true">→</span>}
                </button>
              </form>

              <p className="register-login-prompt">
                Already have an account? <a href="/login">Log in</a>
              </p>
            </>
          )}
        </section>
      </main>

      <footer className="register-footer">
        <a className="brand footer-brand" href="/" aria-label="RailYatra home">
          <BrandLogo />
        </a>
        <a href="/">Back to home</a>
      </footer>
    </div>
  )
}

export default Register