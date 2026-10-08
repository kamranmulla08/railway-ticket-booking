import { useEffect, useState } from "react";
import SiteHeader from "./SiteHeader";
import { authenticatedFetch, clearAuth, getToken } from "./auth";

type Booking = {
  pnr: string;
  journeyDate: string;
  status: string;
  totalAmount: string | number;
  train: { trainNumber: string; name: string };
  coach: { coachNumber: string; coachType: string };
  passengers: Array<{ id: number; name: string; age: number; seatNumber: string }>;
};

function BookingConfirmationPage() {
  const pnr = decodeURIComponent(window.location.pathname.split("/").pop() ?? "");
  const [booking, setBooking] = useState<Booking | null>(null);
  const [message, setMessage] = useState("Loading booking confirmation...");

  useEffect(() => {
    let isMounted = true;
    if (!getToken()) {
      window.location.replace("/login");
      return () => { isMounted = false; };
    }

    async function loadBooking() {
      try {
        const response = await authenticatedFetch(`/bookings/pnr/${encodeURIComponent(pnr)}`);
        if (response.status === 401) {
          clearAuth();
          window.location.replace("/login");
          return;
        }
        const result = (await response.json().catch(() => ({}))) as { booking?: Booking; message?: string };
        if (!response.ok || !result.booking) throw new Error(result.message ?? "Booking not found");
        if (isMounted) {
          setBooking(result.booking);
          setMessage("");
        }
      } catch (error) {
        if (isMounted) setMessage(error instanceof Error ? error.message : "Unable to load booking");
      }
    }

    void loadBooking();
    return () => { isMounted = false; };
  }, [pnr]);

  return (
    <div className="site-shell">
      <SiteHeader />
      <main className="simple-page">
        {message && <p className="page-message" role="status">{message}</p>}
        {booking && (
          <article className="booking-card confirmation-card">
            <p className="section-kicker">BOOKING CONFIRMED</p>
            <h1 className="page-title">Your journey is reserved</h1>
            <div className="booking-confirmation-pnr"><span className="booking-label">PNR</span><strong>{booking.pnr}</strong></div>
            <h2>{booking.train.name}</h2>
            <p className="booking-train-number">Train {booking.train.trainNumber} · Coach {booking.coach.coachNumber} ({booking.coach.coachType})</p>
            <div className="booking-details">
              <div><span className="booking-label">Journey date</span><strong>{new Date(booking.journeyDate).toLocaleDateString()}</strong></div>
              <div><span className="booking-label">Status</span><strong>{booking.status}</strong></div>
              <div><span className="booking-label">Total</span><strong>₹{Number(booking.totalAmount).toFixed(2)}</strong></div>
            </div>
            <div className="booking-passengers">
              <span className="booking-label">Passengers and seats</span>
              {booking.passengers.map((passenger) => <p key={passenger.id}>{passenger.name} · Seat {passenger.seatNumber}</p>)}
            </div>
            <a className="account-submit" href="/my-bookings">View My Bookings</a>
          </article>
        )}
      </main>
      <footer className="site-footer"><span>RailYatra</span><a href="/">Back to home</a></footer>
    </div>
  );
}

export default BookingConfirmationPage;