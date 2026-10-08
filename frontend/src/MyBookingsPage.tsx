import { useEffect, useState } from "react";
import SiteHeader from "./SiteHeader";
import { API_BASE_URL, clearAuth, getToken } from "./auth";

type Booking = {
  id: number;
  pnr: string;
  journeyDate: string;
  status: string;
  totalAmount: number | string;
  coach: { coachNumber: string; coachType: string };
  train: { trainNumber: string; name: string };
  passengers: Array<{ id: number; name: string; age: number; seatNumber: string }>;
};

function MyBookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [message, setMessage] = useState("Loading your bookings...");
  const [isLoading, setIsLoading] = useState(true);
  const [cancellingId, setCancellingId] = useState<number | null>(null);

  async function cancelBooking(bookingId: number) {
    const token = getToken();
    if (!token) {
      clearAuth();
      window.location.replace("/login");
      return;
    }

    if (!window.confirm("Cancel this booking?")) return;
    setCancellingId(bookingId);

    try {
      const response = await fetch(`${API_BASE_URL}/bookings/${bookingId}/cancel`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      const result = (await response.json().catch(() => ({}))) as { message?: string };

      if (response.status === 401) {
        clearAuth();
        window.location.replace("/login");
        return;
      }
      if (!response.ok) throw new Error(result.message ?? "Could not cancel booking");

      setBookings((current) => current.map((booking) =>
        booking.id === bookingId ? { ...booking, status: "CANCELLED" } : booking,
      ));
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not cancel booking");
    } finally {
      setCancellingId(null);
    }
  }

  useEffect(() => {
    let isMounted = true;
    const token = getToken();

    if (!token) {
      window.location.replace("/login");
      return () => {
        isMounted = false;
      };
    }

    async function loadBookings() {
      try {
        const response = await fetch(`${API_BASE_URL}/bookings/history`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (response.status === 401) {
          clearAuth();
          window.location.replace("/login");
          return;
        }

        if (!response.ok) {
          throw new Error("Unable to load bookings");
        }

        const result = (await response.json()) as { bookings: Booking[] };
        if (isMounted) {
          setBookings(result.bookings);
          setMessage(result.bookings.length ? "" : "No bookings found.");
        }
      } catch {
        if (isMounted) setMessage("Unable to load bookings. Please try again.");
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    void loadBookings();

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <div className="site-shell">
      <SiteHeader currentPage="bookings" />
      <main className="simple-page bookings-page">
        <div className="page-heading-row">
          <div>
            <p className="section-kicker">YOUR TRAVEL</p>
            <h1>My Bookings</h1>
          </div>
          <a className="secondary-link" href="/#search">Search trains</a>
        </div>

        {message && <p className="page-message" role="status">{message}</p>}

        {!isLoading && bookings.length > 0 && (
          <div className="booking-list">
            {bookings.map((booking) => (
              <article className="booking-card" key={booking.id}>
                <div className="booking-card-top">
                  <div>
                    <span className="booking-label">PNR</span>
                    <strong>{booking.pnr}</strong>
                  </div>
                  <span className={`booking-status status-${booking.status.toLowerCase()}`}>
                    {booking.status}
                  </span>
                </div>
                <h2>{booking.train.name}</h2>
                <p className="booking-train-number">Train {booking.train.trainNumber}</p>
                <p className="booking-train-number">
                  Coach {booking.coach.coachNumber} · {booking.coach.coachType}
                </p>
                <div className="booking-details">
                  <div>
                    <span className="booking-label">Journey date</span>
                    <strong>{new Date(booking.journeyDate).toLocaleDateString()}</strong>
                  </div>
                  <div>
                    <span className="booking-label">Total amount</span>
                    <strong>₹{Number(booking.totalAmount).toFixed(2)}</strong>
                  </div>
                </div>
                <div className="booking-passengers">
                  <span className="booking-label">Passengers</span>
                  {booking.passengers.map((passenger) => (
                    <p key={passenger.id}>
                      {passenger.name}, {passenger.age} · Seat {passenger.seatNumber}
                    </p>
                  ))}
                </div>
                {booking.status === "CONFIRMED" && (
                  <button
                    className="cancel-booking-button"
                    type="button"
                    disabled={cancellingId === booking.id}
                    onClick={() => void cancelBooking(booking.id)}
                  >
                    {cancellingId === booking.id ? "Cancelling..." : "Cancel booking"}
                  </button>
                )}
              </article>
            ))}
          </div>
        )}
      </main>
      <footer className="site-footer">
        <span>RailYatra</span>
        <a href="/">Back to home</a>
      </footer>
    </div>
  );
}

export default MyBookingsPage;