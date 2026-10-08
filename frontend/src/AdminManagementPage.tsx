import { useEffect, useState, type FormEvent } from "react";
import SiteHeader from "./SiteHeader";
import { authenticatedFetch, clearAuth, getToken, type CurrentUser } from "./auth";

type Resource = "stations" | "trains" | "routes" | "coaches";
type AdminRow = { id: number; [key: string]: unknown };
type FormField = {
  name: string;
  label: string;
  type?: "text" | "number" | "time" | "select";
  options?: string[];
};

const fields: Record<Resource, FormField[]> = {
  stations: [
    { name: "name", label: "Station name" },
    { name: "code", label: "Station code" },
    { name: "city", label: "City" },
    { name: "state", label: "State" },
  ],
  trains: [
    { name: "trainNumber", label: "Train number" },
    { name: "name", label: "Train name" },
  ],
  routes: [
    { name: "trainId", label: "Train ID", type: "number" },
    { name: "sourceStationId", label: "Source station ID", type: "number" },
    { name: "destinationStationId", label: "Destination station ID", type: "number" },
    { name: "departureTime", label: "Departure time", type: "time" },
    { name: "arrivalTime", label: "Arrival time", type: "time" },
  ],
  coaches: [
    { name: "trainId", label: "Train ID", type: "number" },
    { name: "coachNumber", label: "Coach number" },
    { name: "coachType", label: "Coach type", type: "select", options: ["GENERAL", "SLEEPER", "AC", "CHAIR_CAR"] },
    { name: "totalSeats", label: "Total seats", type: "number" },
    { name: "fare", label: "Fare per passenger", type: "number" },
  ],
};

const labels: Record<Resource, string> = {
  stations: "Stations",
  trains: "Trains",
  routes: "Routes & Schedules",
  coaches: "Coaches & Fares",
};

function getFieldValue(row: AdminRow, field: FormField): string {
  const value = row[field.name];
  if (value === undefined || value === null) return "";
  if (field.type === "time" && typeof value === "string") {
    return new Date(value).toISOString().slice(11, 16);
  }
  return String(value);
}

function AdminManagementPage() {
  const resourceName = window.location.pathname.split("/")[2] as Resource;
  const resource = fields[resourceName] ? resourceName : null;
  const [records, setRecords] = useState<AdminRow[]>([]);
  const [formValues, setFormValues] = useState<Record<string, string>>({});
  const [editingId, setEditingId] = useState<number | null>(null);
  const [message, setMessage] = useState("Loading...");
  const [isSaving, setIsSaving] = useState(false);

  async function loadRecords() {
    if (!resource) return;
    const response = await authenticatedFetch(`/${resource}`);
    if (response.status === 401) {
      clearAuth();
      window.location.replace("/login");
      return;
    }
    if (response.status === 403) throw new Error("Admin access is required.");
    if (!response.ok) throw new Error(`Unable to load ${labels[resource].toLowerCase()}.`);
    const result = (await response.json()) as Record<string, AdminRow[]>;
    setRecords(result[resource] ?? []);
    setMessage("");
  }

  useEffect(() => {
    let isMounted = true;
    const token = getToken();
    if (!token) {
      window.location.replace("/login");
      return () => { isMounted = false; };
    }
    if (!resource) {
      setMessage("This management page is not available.");
      return () => { isMounted = false; };
    }

    async function verifyAndLoad() {
      try {
        const response = await authenticatedFetch("/users/me");
        if (response.status === 401) {
          clearAuth();
          window.location.replace("/login");
          return;
        }
        if (!response.ok) throw new Error("Unable to verify your account.");
        const user = (await response.json()) as CurrentUser;
        if (user.role !== "ADMIN") {
          if (isMounted) setMessage("Access denied. Admin access is required.");
          return;
        }
        await loadRecords();
      } catch (error) {
        if (isMounted) setMessage(error instanceof Error ? error.message : "Unable to load data.");
      }
    }

    void verifyAndLoad();
    return () => { isMounted = false; };
  }, [resource]);

  function startEditing(record: AdminRow) {
    if (!resource) return;
    setEditingId(record.id);
    setFormValues(Object.fromEntries(fields[resource].map((field) => [field.name, getFieldValue(record, field)])));
    setMessage("");
  }

  function clearForm() {
    setEditingId(null);
    setFormValues({});
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!resource) return;
    setIsSaving(true);
    setMessage("");

    const numberFields = new Set(["trainId", "sourceStationId", "destinationStationId", "totalSeats", "fare"]);
    const data = Object.fromEntries(Object.entries(formValues).map(([key, value]) => [
      key,
      numberFields.has(key) ? Number(value) : value,
    ]));

    try {
      const response = await authenticatedFetch(
        `/${resource}${editingId === null ? "" : `/${editingId}`}`,
        {
          method: editingId === null ? "POST" : "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        },
      );
      const result = (await response.json().catch(() => ({}))) as { message?: string };
      if (response.status === 401) {
        clearAuth();
        window.location.replace("/login");
        return;
      }
      if (!response.ok) throw new Error(result.message ?? "Could not save this item.");
      clearForm();
      await loadRecords();
      setMessage(editingId === null ? "Item created." : "Item updated.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not save this item.");
    } finally {
      setIsSaving(false);
    }
  }

  async function deleteRecord(id: number) {
    if (!resource || !window.confirm("Delete this item?")) return;
    try {
      const response = await authenticatedFetch(`/${resource}/${id}`, { method: "DELETE" });
      if (response.status === 401) {
        clearAuth();
        window.location.replace("/login");
        return;
      }
      if (!response.ok) {
        const result = (await response.json().catch(() => ({}))) as { message?: string };
        throw new Error(result.message ?? "Could not delete this item.");
      }
      await loadRecords();
      setMessage("Item deleted.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not delete this item.");
    }
  }

  return (
    <div className="site-shell">
      <SiteHeader currentPage="admin" />
      <main className="simple-page">
        <div className="page-heading-row">
          <div><p className="section-kicker">ADMIN MANAGEMENT</p><h1>{resource ? labels[resource] : "Not found"}</h1></div>
          <a className="secondary-link" href="/admin">Dashboard</a>
        </div>
        {message && <p className="page-message" role="status">{message}</p>}
        {resource && (
          <>
            <section className="account-card admin-edit-card">
              <h2>{editingId === null ? `Add ${labels[resource]}` : `Edit item ${editingId}`}</h2>
              <form className="admin-edit-form" onSubmit={handleSubmit}>
                {fields[resource].map((field) => (
                  <label className="account-field" key={field.name}>
                    <span>{field.label}</span>
                    {field.type === "select" ? (
                      <select required value={formValues[field.name] ?? ""} onChange={(event) => setFormValues((current) => ({ ...current, [field.name]: event.target.value }))}>
                        <option value="">Choose type</option>
                        {field.options?.map((option) => <option key={option} value={option}>{option}</option>)}
                      </select>
                    ) : (
                      <input required type={field.type ?? "text"} step={field.name === "fare" ? "0.01" : undefined} value={formValues[field.name] ?? ""} onChange={(event) => setFormValues((current) => ({ ...current, [field.name]: event.target.value }))} />
                    )}
                  </label>
                ))}
                <div className="admin-form-actions">
                  <button className="account-submit" type="submit" disabled={isSaving}>{isSaving ? "Saving..." : editingId === null ? "Create" : "Save changes"}</button>
                  {editingId !== null && <button className="text-button" type="button" onClick={clearForm}>Cancel edit</button>}
                </div>
              </form>
            </section>
            <section className="admin-records">
              {records.map((record) => (
                <article className="admin-record" key={record.id}>
                  <div>
                    <span className="booking-label">ID {record.id}</span>
                    <strong>{String(record.name ?? record.trainNumber ?? record.coachNumber ?? `Route ${record.id}`)}</strong>
                    <p>{resource === "coaches" ? `${String(record.coachType)} · ${record.totalSeats} seats · ${record.fare === null ? "Fare not configured" : `₹${record.fare}`}` : resource === "stations" ? `${String(record.code)} · ${String(record.city)}, ${String(record.state)}` : resource === "routes" ? `Train ${String(record.trainId)} · Stations ${String(record.sourceStationId)} → ${String(record.destinationStationId)}` : ""}</p>
                  </div>
                  <div className="admin-record-actions">
                    <button className="text-button" type="button" onClick={() => startEditing(record)}>Edit</button>
                    <button className="text-button danger-text" type="button" onClick={() => void deleteRecord(record.id)}>Delete</button>
                  </div>
                </article>
              ))}
              {!records.length && !message && <p className="page-message">No records found.</p>}
            </section>
          </>
        )}
      </main>
      <footer className="site-footer"><span>RailYatra</span><a href="/">Back to home</a></footer>
    </div>
  );
}

export default AdminManagementPage;