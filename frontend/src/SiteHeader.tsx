import { clearAuth, getStoredUser } from "./auth";
import BrandLogo from "./BrandLogo";

type SiteHeaderProps = {
  currentPage?: "home" | "register" | "login" | "bookings" | "admin" | "pnr";
};

function SiteHeader({ currentPage }: SiteHeaderProps) {
  const user = getStoredUser();

  function handleLogout() {
    clearAuth();
    window.location.assign("/");
  }

  return (
    <header className="site-header">
      <a className="brand" href="/" aria-label="RailYatra home">
        <BrandLogo />
      </a>

      <nav className="site-nav" aria-label="Main navigation">
        {user?.role === "ADMIN" ? (
          <>
            <a className="nav-link" href="/">Home</a>
            <a
              className={`nav-link ${currentPage === "admin" ? "active" : ""}`}
              href="/admin"
            >
              Admin Dashboard
            </a>
            <a className={`nav-link ${currentPage === "pnr" ? "active" : ""}`} href="/pnr">PNR Status</a>
            <a className="nav-link" href="/my-bookings">My Bookings</a>
            <button className="nav-link nav-logout" type="button" onClick={handleLogout}>
              Logout
            </button>
          </>
        ) : user ? (
          <>
            <a className="nav-link" href="/">Home</a>
            <a className="nav-link" href="/#search">Search Trains</a>
            <a className={`nav-link ${currentPage === "pnr" ? "active" : ""}`} href="/pnr">PNR Status</a>
            <a
              className={`nav-link ${currentPage === "bookings" ? "active" : ""}`}
              href="/my-bookings"
            >
              My Bookings
            </a>
            <button className="nav-link nav-logout" type="button" onClick={handleLogout}>
              Logout
            </button>
          </>
        ) : (
          <>
            <a className={`nav-link ${currentPage === "home" ? "active" : ""}`} href="/">
              Home
            </a>
            <a className={`nav-link ${currentPage === "pnr" ? "active" : ""}`} href="/pnr">PNR Status</a>
            <a className="nav-link" href="/my-bookings">My Bookings</a>
            <a className={`nav-link ${currentPage === "login" ? "active" : ""}`} href="/login">
              Login
            </a>
            <a className="nav-register" href="/register">Register</a>
          </>
        )}
      </nav>
    </header>
  );
}

export default SiteHeader;