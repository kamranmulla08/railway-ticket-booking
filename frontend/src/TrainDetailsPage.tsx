import { useEffect, useState } from "react";
import SiteHeader from "./SiteHeader";
import { authenticatedFetch, clearAuth, getToken } from "./auth";

type Train = { id: number; trainNumber: string; name: string };
type Route = {
  trainId: number;
  departureTime: string;
  arrivalTime: string;
  sourceStation: { name: string };
  destinationStation: { name: string };
};

function TrainDetailsPage() {
  const trainId = window.location.pathname.split("/")[2];
  const query = new URLSearchParams(window.location.search);
  const [train, setTrain] = useState<Train | null>(null);
  const [route, setRoute] = useState<Route | null>(null);
  const [message, setMessage] = useState("Loading train details...");

  useEffect(() => {
    let isMounted = true;
    if (!getToken()) {
      window.location.replace("/login");
      return () => { isMounted = false; };
    }

    async function loadDetails() {
      try {
        const [trainResponse, routesResponse] = await Promise.all([
          authenticatedFetch(`/trains/${trainId}`),
          authenticatedFetch("/routes"),
        ]);
        if (trainResponse.status === 401 || routesResponse.status === 401) {
          clearAuth();
          window.location.replace("/login");
          return;
        }
        if (!trainResponse.ok || !routesResponse.ok) throw new Error("Could not load train details");

        const trainResult = (await trainResponse.json()) as { train: Train };
        const routesResult = (await routesResponse.json()) as { routes: Route[] };
        if (!isMounted) return;
        setTrain(trainResult.train);
        setRoute(routesResult.routes.find((item) => item.trainId === trainResult.train.id) ?? null);
        setMessage("");
      } catch {
        if (isMounted) setMessage("Unable to load train details.");
      }
    }

    void loadDetails();
    return () => { isMounted = false; };
  }, [trainId]);

  return (
    <div className="site-shell">
      <SiteHeader />
      <main className="simple-page">
        {message && <p className="page-message" role="status">{message}</p>}
        {train && (
          <article className="booking-card">
            <p className="section-kicker">TRAIN DETAILS</p>
            <h1>{train.name}</h1>
            <p className="booking-train-number">Train {train.trainNumber}</p>
            {route ? (
              <div className="booking-details">
                <div><span className="booking-label">From</span><strong>{route.sourceStation.name}</strong><span>{new Date(route.departureTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", timeZone: "UTC" })}</span></div>
                <div><span className="booking-label">To</span><strong>{route.destinationStation.name}</strong><span>{new Date(route.arrivalTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", timeZone: "UTC" })}</span></div>
              </div>
            ) : <p className="page-message">No route is configured for this train.</p>}
            <a className="account-submit details-action" href={`/trains/${train.id}/seats?journeyDate=${query.get("journeyDate") ?? ""}`}>
              Check seats
            </a>
          </article>
        )}
      </main>
      <footer className="site-footer"><span>RailYatra</span><a href="/">Back to home</a></footer>
    </div>
  );
}

export default TrainDetailsPage;