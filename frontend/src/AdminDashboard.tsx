import { useEffect, useState } from "react";
import SiteHeader from "./SiteHeader";
import { API_BASE_URL, clearAuth, getToken, type CurrentUser } from "./auth";

const adminSections = [
  { name: "Stations", path: "/admin/stations", available: true },
  { name: "Trains", path: "/admin/trains", available: true },
  { name: "Routes & Schedules", path: "/admin/routes", available: true },
  { name: "Coaches & Fares", path: "/admin/coaches", available: true },
  { name: "Users", path: "", available: false },
  { name: "Bookings", path: "", available: false },
  { name: "Reports", path: "", available: false },
];

function AdminDashboard() {
  const [status, setStatus] = useState<"loading" | "admin" | "denied" | "error">("loading");
  const [admin, setAdmin] = useState<CurrentUser | null>(null);

  useEffect(() => {
    let isMounted = true;
    const token = getToken();

    if (!token) {
      window.location.replace("/login");
      return () => {
        isMounted = false;
      };
    }

    async function checkAdminRole() {
      try {
        const response = await fetch(`${API_BASE_URL}/users/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (response.status === 401) {
          clearAuth();
          window.location.replace("/login");
          return;
        }

        if (!response.ok) throw new Error("Unable to verify account");

        const user = (await response.json()) as CurrentUser;
        if (!isMounted) return;

        if (user.role !== "ADMIN") {
          setStatus("denied");
          return;
        }

        setAdmin(user);
        setStatus("admin");
      } catch {
        if (isMounted) setStatus("error");
      }
    }

    void checkAdminRole();

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <div className="site-shell">
      <SiteHeader currentPage="admin" />
      <main className="simple-page admin-page">
        {status === "loading" && <p className="page-message">Checking your account...</p>}
        {status === "denied" && (
          <section className="access-message" role="alert">
            <h1>Access denied</h1>
            <p>You do not have permission to access this page. Admin access is required.</p>
            <a className="secondary-link" href="/">Return home</a>
          </section>
        )}
        {status === "error" && (
          <p className="page-message" role="alert">
            Unable to verify your account. Please try again.
          </p>
        )}
        {status === "admin" && (
          <>
            <div className="page-heading-row">
              <div>
                <p className="section-kicker">RAILYATRA MANAGEMENT</p>
                <h1>Admin Dashboard</h1>
                <p className="admin-welcome">Signed in as {admin?.email}</p>
              </div>
            </div>
            <div className="admin-grid">
              {adminSections.map((section) => (
                <article className="admin-section" key={section.name}>
                  <h2>{section.name}</h2>
                  {section.available ? (
                    <a className="admin-card-link" href={section.path}>Manage {section.name.toLowerCase()}</a>
                  ) : (
                    <p>Admin API not available yet. This section does not show sample data.</p>
                  )}
                </article>
              ))}
            </div>
          </>
        )}
      </main>
      <footer className="site-footer">
        <span>RailYatra</span>
        <a href="/">Back to home</a>
      </footer>
    </div>
  );
}

export default AdminDashboard;