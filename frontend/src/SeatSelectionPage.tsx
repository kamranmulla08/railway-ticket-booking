import { useEffect, useState } from "react";
import SiteHeader from "./SiteHeader";
import { authenticatedFetch, clearAuth, getToken } from "./auth";

type Availability = {
  id: number;
  availableSeats: number;
  coach: {
    id: number;
    coachNumber: string;
    coachType: string;
    totalSeats: number;
    fare: string | number | null;
  };
};

function SeatSelectionPage() {
  const trainId = window.location.pathname.split("/")[2];
  const journeyDate = new URLSearchParams(window.location.search).get("journeyDate") ?? "";
  const [availability, setAvailability] = useState<Availability[]>([]);
  const [message, setMessage] = useState("Loading seat availability...");

  useEffect(() => {
    let isMounted = true;
    const token = getToken();
    if (!token) {
      window.location.replace("/login");
      return () => { isMounted = false; };
    }
    if (!journeyDate) {
      setMessage("Choose a journey date from train search first.");
      return () => { isMounted = false; };
    }

    async function loadAvailability() {
      try {
        const response = await authenticatedFetch(
          `/seat-availability?trainId=${trainId}&travelDate=${journeyDate}`,
        );
        if (response.status === 401) {
          clearAuth();
          window.location.replace("/login");
          return;
        }
        if (!response.ok) throw new Error("Could not load availability");
        const result = (await response.json()) as { availability: Availability[] };
        if (!isMounted) return;
        setAvailability(result.availability);
        setMessage(result.availability.length ? "" : "No seats are listed for this date.");
      } catch {
        if (isMounted) setMessage("Unable to load seats. Please try again.");
      }
    }

    void loadAvailability();
    return () => { isMounted = false; };
  }, [trainId, journeyDate]);

  return (
    <div className="site-shell">
      <SiteHeader />
      <main className="simple-page">
        <div className="page-heading-row">
          <div><p className="section-kicker">SEAT AVAILABILITY</p><h1>Choose a coach</h1><p className="admin-welcome">Travel date: {journeyDate || "Not selected"}</p></div>
          <a className="secondary-link" href="/">Back to search</a>
        </div>
        {message && <p className="page-message" role="status">{message}</p>}
        <div className="availability-list">
          {availability.map((item) => (
            <article className="availability-card" key={item.id}>
              <div><span className="booking-label">Class</span><h2>{item.coach.coachType}</h2></div>
              <div><span className="booking-label">Coach</span><strong>{item.coach.coachNumber}</strong></div>
              <div><span className="booking-label">Available seats</span><strong>{item.availableSeats}</strong></div>
              <div><span className="booking-label">Fare per passenger</span><strong>{item.coach.fare === null ? "Fare not set" : `₹${Number(item.coach.fare).toFixed(2)}`}</strong></div>
              {item.availableSeats > 0 && item.coach.fare !== null ? (
                <a
                  className="account-submit"
                  href={`/booking/${trainId}?coachId=${item.coach.id}&journeyDate=${journeyDate}`}
                >Continue</a>
              ) : <span className="unavailable-label">Not available</span>}
            </article>
          ))}
        </div>
      </main>
      <footer className="site-footer"><span>RailYatra</span><a href="/">Back to home</a></footer>
    </div>
  );
}

export default SeatSelectionPage;