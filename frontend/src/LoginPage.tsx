import { useState, type FormEvent } from "react";
import SiteHeader from "./SiteHeader";
import { API_BASE_URL, saveAuth, type CurrentUser } from "./auth";

type LoginResponse = CurrentUser & {
  token: string;
};

function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    setIsSubmitting(true);

    try {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), password }),
      });

      const result = (await response.json().catch(() => ({}))) as Partial<LoginResponse> & {
        message?: string;
      };

      if (!response.ok || !result.token || !result.role) {
        setMessage(
          response.status === 401
            ? "Invalid email or password."
            : result.message ?? "Something went wrong. Please try again.",
        );
        return;
      }

      const user: CurrentUser = {
        id: result.id ?? 0,
        email: result.email ?? email.trim(),
        phone: result.phone,
        role: result.role,
      };

      saveAuth(result.token, user);
      window.location.assign(result.role === "ADMIN" ? "/admin" : "/");
    } catch {
      setMessage("Unable to connect to RailYatra. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="site-shell">
      <SiteHeader currentPage="login" />
      <main className="simple-page login-page">
        <section className="account-intro">
          <p className="section-kicker">WELCOME ABOARD</p>
          <h1>Welcome back</h1>
          <p>Sign in to continue planning your railway journeys.</p>
        </section>

        <section className="account-card" aria-labelledby="login-title">
          <h2 id="login-title">Login</h2>
          <form className="account-form" onSubmit={handleSubmit}>
            <label className="account-field">
              <span>Email</span>
              <input
                type="email"
                autoComplete="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
              />
            </label>
            <label className="account-field">
              <span>Password</span>
              <input
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
              />
            </label>
            {message && <p className="account-message" role="alert">{message}</p>}
            <button className="account-submit" type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Signing in..." : "Login"}
            </button>
          </form>
          <p className="account-switch">
            Don&apos;t have an account? <a href="/register">Register</a>
          </p>
        </section>
      </main>
      <footer className="site-footer">
        <span>RailYatra</span>
        <a href="/">Back to home</a>
      </footer>
    </div>
  );
}

export default LoginPage;