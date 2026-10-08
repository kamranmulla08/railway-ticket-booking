import { useEffect, useState, type FormEvent } from "react";
import SiteHeader from "./SiteHeader";
import { API_BASE_URL, clearAuth, getToken } from "./auth";

type PassengerForm = { name: string; age: string; gender: "MALE" | "FEMALE" | "OTHER" };
type CoachFare = { id: number; fare: number | string | null; coachNumber: string; coachType: string };

function PassengerBookingPage() {
  const trainId = Number(window.location.pathname.split("/")[2]);
  const query = new URLSearchParams(window.location.search);
  const coachId = Number(query.get("coachId"));
  const journeyDate = query.get("journeyDate") ?? "";
  const [fare, setFare] = useState<CoachFare | null>(null);
  const [passengers, setPassengers] = useState<PassengerForm[]>([{ name: "", age: "", gender: "OTHER" }]);
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const token = getToken();
    if (!token) {
      window.location.replace("/login");
      return () => { isMounted = false; };
    }

    async function loadFare() {
      try {
        const response = await fetch(
          `${API_BASE_URL}/seat-availability?trainId=${trainId}&travelDate=${journeyDate}`,
          { headers: { Authorization: `Bearer ${token}` } },
        );
        if (response.status === 401) {
          clearAuth();
          window.location.replace("/login");
          return;
        }
        if (!response.ok) throw new Error("Unable to load coach fare");
        const result = (await response.json()) as {
          availability: Array<{ coach: CoachFare }>;
        };
        const selectedCoach = result.availability.find((item) => item.coach.id === coachId)?.coach;
        if (isMounted) setFare(selectedCoach ?? null);
      } catch {
        if (isMounted) setMessage("Unable to load coach fare. Please go back and select a coach again.");
      }
    }

    if (trainId && coachId && journeyDate) void loadFare();
    else setMessage("Train, coach, or journey date is missing.");

    return () => { isMounted = false; };
  }, [trainId, coachId, journeyDate]);

  function updatePassenger(index: number, field: keyof PassengerForm, value: string) {
    setPassengers((current) => current.map((passenger, passengerIndex) =>
      passengerIndex === index ? { ...passenger, [field]: value } : passenger,
    ));
  }

  function addPassenger() {
    if (passengers.length < 12) {
      setPassengers((current) => [...current, { name: "", age: "", gender: "OTHER" }]);
    }
  }

  function removePassenger(index: number) {
    setPassengers((current) => current.filter((_passenger, passengerIndex) => passengerIndex !== index));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    const token = getToken();
    if (!token) {
      window.location.replace("/login");
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch(`${API_BASE_URL}/bookings`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          trainId,
          coachId,
          journeyDate,
          passengers: passengers.map((passenger) => ({
            name: passenger.name.trim(),
            age: Number(passenger.age),
            gender: passenger.gender,
          })),
        }),
      });
      const result = (await response.json().catch(() => ({}))) as {
        booking?: { pnr: string };
        message?: string;
      };

      if (response.status === 401) {
        clearAuth();
        window.location.replace("/login");
        return;
      }
      if (!response.ok || !result.booking?.pnr) {
        setMessage(result.message ?? "Booking failed. Please check passenger details and availability.");
        return;
      }

      window.location.assign(`/booking/confirmation/${result.booking.pnr}`);
    } catch {
      setMessage("Unable to contact the booking service. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  const estimatedAmount = fare?.fare === null || fare?.fare === undefined
    ? null
    : Number(fare.fare) * passengers.length;

  return (
    <div className="site-shell">
      <SiteHeader />
      <main className="simple-page">
        <p className="section-kicker">PASSENGER DETAILS</p>
        <h1 className="page-title">Complete your booking</h1>
        {fare && <p className="admin-welcome">{fare.coachNumber} · {fare.coachType} · {journeyDate}</p>}
        <form className="passenger-form" onSubmit={handleSubmit}>
          {passengers.map((passenger, index) => (
            <fieldset className="passenger-fieldset" key={index}>
              <legend>Passenger {index + 1}</legend>
              <label className="account-field">
                <span>Name</span>
                <input value={passenger.name} onChange={(event) => updatePassenger(index, "name", event.target.value)} required />
              </label>
              <label className="account-field">
                <span>Age</span>
                <input type="number" min="1" max="120" value={passenger.age} onChange={(event) => updatePassenger(index, "age", event.target.value)} required />
              </label>
              <label className="account-field">
                <span>Gender</span>
                <select value={passenger.gender} onChange={(event) => updatePassenger(index, "gender", event.target.value as PassengerForm["gender"])}>
                  <option value="FEMALE">Female</option>
                  <option value="MALE">Male</option>
                  <option value="OTHER">Other</option>
                </select>
              </label>
              {passengers.length > 1 && (
                <button className="text-button" type="button" onClick={() => removePassenger(index)}>Remove passenger</button>
              )}
            </fieldset>
          ))}
          {passengers.length < 12 && <button className="secondary-link" type="button" onClick={addPassenger}>Add passenger</button>}
          {estimatedAmount !== null && <p className="fare-estimate">Estimated total: ₹{estimatedAmount.toFixed(2)}. Final amount is calculated by the server.</p>}
          {message && <p className="account-message" role="alert">{message}</p>}
          <button className="account-submit" type="submit" disabled={isSubmitting || !fare?.fare}>
            {isSubmitting ? "Confirming..." : "Confirm booking"}
          </button>
        </form>
      </main>
      <footer className="site-footer"><span>RailYatra</span><a href="/">Back to home</a></footer>
    </div>
  );
}

export default PassengerBookingPage;