import { useEffect, useState } from "react";
import SiteHeader from "./SiteHeader";
import { authenticatedFetch, clearAuth, getToken } from "./auth";

type Station = {
  id: number;
  name: string;
  code: string;
  city: string;
};

type CoachAvailability = {
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

type RouteResult = {
  id: number;
  departureTime: string;
  arrivalTime: string;
  train: {
    id: number;
    trainNumber: string;
    name: string;
  };
  sourceStation: Station;
  destinationStation: Station;
  availability: CoachAvailability[];
};

function formatTime(value: string) {
  if (!value) {
    return "--";
  }

  const normalizedValue =
    value.length <= 8
      ? `1970-01-01T${value}Z`
      : value;

  const date = new Date(normalizedValue);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "UTC",
  });
}

function formatDate(value: string | null) {
  if (!value) {
    return "Not selected";
  }

  const date = new Date(`${value}T00:00:00`);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleDateString([], {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function TrainSearchResults() {
  const query = new URLSearchParams(
    window.location.search,
  );

  const sourceStationId = query.get(
    "sourceStationId",
  );

  const destinationStationId = query.get(
    "destinationStationId",
  );

  const journeyDate = query.get("journeyDate");

  const [routes, setRoutes] = useState<RouteResult[]>([]);
  const [message, setMessage] = useState(
    "Loading trains...",
  );
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const token = getToken();

    if (!token) {
      window.location.replace("/login");

      return () => {
        isMounted = false;
      };
    }

    if (
      !sourceStationId ||
      !destinationStationId ||
      !journeyDate
    ) {
      setMessage(
        "Source, destination, or journey date is missing.",
      );
      setLoading(false);

      return () => {
        isMounted = false;
      };
    }

    async function searchTrains() {
      try {
        const routeParams = new URLSearchParams({
          sourceStationId,
          destinationStationId,
        });

        const response = await authenticatedFetch(
          `/routes/search?${routeParams.toString()}`,
        );

        if (response.status === 401) {
          clearAuth();
          window.location.replace("/login");
          return;
        }

        if (!response.ok) {
          throw new Error(
            "Could not search trains.",
          );
        }

        const result = (await response.json()) as {
          routes: Omit<
            RouteResult,
            "availability"
          >[];
        };

        const trainIds = [
          ...new Set(
            result.routes.map(
              (route) => route.train.id,
            ),
          ),
        ];

        const availabilityByTrain = new Map<
          number,
          CoachAvailability[]
        >();

        await Promise.all(
          trainIds.map(async (trainId) => {
            const availabilityParams =
              new URLSearchParams();

            availabilityParams.append(
              "trainId",
              String(trainId),
            );

            availabilityParams.append(
              "travelDate",
              journeyDate || "",
            );

            const availabilityResponse =
              await authenticatedFetch(
                `/seat-availability?${availabilityParams.toString()}`,
              );

            if (
              availabilityResponse.status === 401
            ) {
              clearAuth();
              window.location.replace("/login");
              return;
            }

            if (!availabilityResponse.ok) {
              return;
            }

            const availabilityResult =
              (await availabilityResponse.json()) as {
                availability: CoachAvailability[];
              };

            availabilityByTrain.set(
              trainId,
              availabilityResult.availability ?? [],
            );
          }),
        );

        if (!isMounted) {
          return;
        }

        const searchResults: RouteResult[] =
          result.routes.map((route) => ({
            ...route,
            availability:
              availabilityByTrain.get(
                route.train.id,
              ) ?? [],
          }));

        setRoutes(searchResults);

        if (searchResults.length === 0) {
          setMessage(
            "No trains found for this route.",
          );
        } else {
          setMessage("");
        }

        setLoading(false);
      } catch (error) {
        console.error(error);

        if (isMounted) {
          setMessage(
            "Unable to search trains. Please try again.",
          );
          setLoading(false);
        }
      }
    }

    void searchTrains();

    return () => {
      isMounted = false;
    };
  }, [
    sourceStationId,
    destinationStationId,
    journeyDate,
  ]);

  return (
    <div className="site-shell">
      <SiteHeader />

      <main className="simple-page">
        <div className="page-heading-row">
          <div>
            <p className="section-kicker">
              TRAIN SEARCH
            </p>

            <h1>Available trains</h1>

            <p className="admin-welcome">
              Journey date:{" "}
              {formatDate(journeyDate)}
            </p>
          </div>

          <a
            className="secondary-link"
            href="/#search"
          >
            Change search
          </a>
        </div>

        {loading && (
          <p className="page-message">
            Loading trains...
          </p>
        )}

        {!loading && message && (
          <p
            className="page-message"
            role="status"
          >
            {message}
          </p>
        )}

        <div className="booking-list">
          {routes.map((route) => (
            <article
              className="booking-card"
              key={route.id}
            >
              <div className="booking-card-top">
                <div>
                  <span className="booking-label">
                    Train{" "}
                    {route.train.trainNumber}
                  </span>

                  <h2>{route.train.name}</h2>
                </div>

                <a
                  className="secondary-link"
                  href={`/trains/${route.train.id}?journeyDate=${journeyDate}&sourceStationId=${sourceStationId}&destinationStationId=${destinationStationId}`}
                >
                  Train details
                </a>
              </div>

              <div className="booking-details">
                <div>
                  <span className="booking-label">
                    From
                  </span>

                  <strong>
                    {route.sourceStation.name} (
                    {route.sourceStation.code}) ·{" "}
                    {formatTime(
                      route.departureTime,
                    )}
                  </strong>
                </div>

                <div>
                  <span className="booking-label">
                    To
                  </span>

                  <strong>
                    {route.destinationStation.name} (
                    {route.destinationStation.code}) ·{" "}
                    {formatTime(
                      route.arrivalTime,
                    )}
                  </strong>
                </div>
              </div>

              <div className="availability-list">
                {route.availability.length > 0 ? (
                  route.availability.map((item) => (
                    <div
                      className="availability-row"
                      key={item.id}
                    >
                      <span>
                        {item.coach.coachType} ·{" "}
                        {item.coach.coachNumber}
                      </span>

                      <span>
                        {item.availableSeats} seats
                      </span>

                      <span>
                        {item.coach.fare === null
                          ? "Fare not set"
                          : `₹${Number(
                              item.coach.fare,
                            ).toFixed(
                              2,
                            )} / passenger`}
                      </span>

                      <a
                        className="secondary-link"
                        href={`/trains/${route.train.id}/seats?journeyDate=${journeyDate}&coachId=${item.coach.id}`}
                      >
                        View seats
                      </a>
                    </div>
                  ))
                ) : (
                  <p className="page-message">
                    No availability is listed for this
                    date.
                  </p>
                )}
              </div>
            </article>
          ))}
        </div>
      </main>

      <footer className="site-footer">
        <span>RailYatra</span>

        <a href="/">
          Back to home
        </a>
      </footer>
    </div>
  );
}

export default TrainSearchResults;