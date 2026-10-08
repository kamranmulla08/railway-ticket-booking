import { useState, type FormEvent } from "react";
import SiteHeader from "./SiteHeader";
import { authenticatedFetch, clearAuth, getToken } from "./auth";

type PnrBooking = {
  pnr: string;
  journeyDate: string;
  status: string;
  train: { trainNumber: string; name: string };
  coach: { coachNumber: string; coachType: string };
};

function PnrStatusPage() {
  const [pnr, setPnr] = useState("");
  const [booking, setBooking] = useState<PnrBooking | null>(null);
  const [message, setMessage] = useState("");
  const [isSearching, setIsSearching] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBooking(null);
    setMessage("");
    const token = getToken();
    if (!token) {
      window.location.assign("/login");
      return;
    }

    setIsSearching(true);
    try {
      const response = await authenticatedFetch(`/bookings/pnr/${encodeURIComponent(pnr.trim())}`);
      if (response.status === 401) {
        clearAuth();
        window.location.assign("/login");
        return;
      }
      const result = (await response.json().catch(() => ({}))) as { booking?: PnrBooking; message?: string };
      if (!response.ok || !result.booking) {
        setMessage(response.status === 404 ? "Invalid PNR." : result.message ?? "Unable to check this PNR.");
        return;
      }
      setBooking(result.booking);
    } catch {
      setMessage("Unable to contact the PNR service. Please try again.");
    } finally {
      setIsSearching(false);
    }
  }

  return (
    <div className="site-shell">
      <SiteHeader />
      <main className="simple-page login-page">
        <section className="account-intro"><p className="section-kicker">BOOKING STATUS</p><h1>Check your PNR</h1><p>Use your booking reference to see the latest status.</p></section>
        <section className="account-card">
          <h2>PNR Status</h2>
          <form className="account-form" onSubmit={handleSubmit}>
            <label className="account-field"><span>PNR Number</span><input value={pnr} onChange={(event) => setPnr(event.target.value.toUpperCase())} required /></label>
            {message && <p className="account-message" role="alert">{message}</p>}
            <button className="account-submit" type="submit" disabled={isSearching}>{isSearching ? "Checking..." : "Check status"}</button>
          </form>
          {booking && <div className="pnr-result">
            <p><span className="booking-label">PNR</span><strong>{booking.pnr}</strong></p>
            <p><span className="booking-label">Train</span><strong>{booking.train.trainNumber} · {booking.train.name}</strong></p>
            <p><span className="booking-label">Journey date</span><strong>{new Date(booking.journeyDate).toLocaleDateString()}</strong></p>
            <p><span className="booking-label">Coach</span><strong>{booking.coach.coachNumber} · {booking.coach.coachType}</strong></p>
            <p><span className="booking-label">Status</span><strong>{booking.status}</strong></p>
          </div>}
        </section>
      </main>
      <footer className="site-footer"><span>RailYatra</span><a href="/">Back to home</a></footer>
    </div>
  );
}

export default PnrStatusPage;