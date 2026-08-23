"use client";

import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

const emptyForm = {
  client_name: "",
  phone: "",
  group_size: "",
  event_date: "",
  pickup_time: "",
  pickup_location: "",
  driver: "",
  to_price: "",
  to_paid: false,
  return_requested: false,
  return_location: "",
  return_driver: "",
  return_price: "",
  return_paid: false,
  notes: "",
};

export default function Home() {
  const [showForm, setShowForm] = useState(false);

  const [pricingType, setPricingType] = useState("per_person");
  const [returnPricingType, setReturnPricingType] =
    useState("per_person");

  const [formData, setFormData] = useState(emptyForm);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loggedIn, setLoggedIn] = useState(false);

  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);
const [rides, setRides] = useState([]);
const [loadingRides, setLoadingRides] = useState(false);
useEffect(() => {
  async function restoreSession() {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (session) {
      setLoggedIn(true);
      await loadRides();
    }
  }

  restoreSession();
}, []);
  
  async function loadRides() {
  setLoadingRides(true);

  const { data, error } = await supabase
    .from("Bookings")
    .select("*")
    .order("event_date", { ascending: true })
    .order("pickup_time", { ascending: true });

  if (error) {
    console.error(error);
    setMessage("Could not load rides: " + error.message);
    setLoadingRides(false);
    return;
  }

  setRides(data || []);
  setLoadingRides(false);
}
  async function updateRideStatus(rideId, newStatus) {
  const { error } = await supabase
    .from("Bookings")
    .update({ to_status: newStatus })
    .eq("id", rideId);

  if (error) {
    setMessage("Could not update status: " + error.message);
    return;
  }
    await loadRides();
  }

    async function updateReturnStatus(rideId, newStatus) {
  const { error } = await supabase
    .from("Bookings")
    .update({ return_status: newStatus })
    .eq("id", rideId);

  if (error) {
    setMessage("Could not update return status: " + error.message);
    return;
  }

  await loadRides();
}
  async function handleLogin() {
    setMessage("Signing in...");

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setMessage("Login failed: " + error.message);
      return;
    }

    setLoggedIn(true);
    setMessage("Signed in successfully ✅");
await loadRides();
  }

  async function handleSaveRide() {
    if (!formData.client_name) {
      setMessage("Please enter the client / group name.");
      return;
    }

    if (!formData.group_size) {
      setMessage("Please enter the group size.");
      return;
    }

    if (!formData.event_date) {
      setMessage("Please choose a date.");
      return;
    }

    setSaving(true);
    setMessage("Saving ride...");

    const booking = {
  client_name: formData.client_name,
  phone: formData.phone || null,
  group_size: Number(formData.group_size),
  event_date: formData.event_date,
  pickup_time: formData.pickup_time || null,
  pickup_location: formData.pickup_location || null,

  to_driver: formData.driver || null,
  to_price_type: pricingType,
  to_price:
    formData.to_price === ""
      ? null
      : Number(formData.to_price),
  to_paid: formData.to_paid,

  return_requested: formData.return_requested,
  return_location: formData.return_requested
    ? formData.return_location || null
    : null,
  return_driver: formData.return_requested
    ? formData.return_driver || null
    : null,
  return_price_type: formData.return_requested
    ? returnPricingType
    : null,
  return_price:
    formData.return_requested && formData.return_price !== ""
      ? Number(formData.return_price)
      : null,
  return_paid: formData.return_requested
    ? formData.return_paid
    : false,

  notes: formData.notes || null,

  event_name: "YQM Country Fest",
  to_status: "upcoming",
  return_status: formData.return_requested ? "waiting" : null,
  return_queue_position: null,
  cancelled: false,
};

    const { error } = await supabase
      .from("Bookings")
      .insert([booking]);

    if (error) {
      console.error(error);
      setMessage("Could not save ride: " + error.message);
      setSaving(false);
      return;
    }

    setMessage("Ride saved successfully! 🚗✅");
await loadRides();
    
    setFormData(emptyForm);
    setPricingType("per_person");
    setReturnPricingType("per_person");

    setSaving(false);
    setShowForm(false);
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#f5f7fa",
        fontFamily: "Arial, sans-serif",
        color: "#172033",
      }}
    >
      <header
        style={{
          background: "#172033",
          color: "white",
          padding: "22px",
        }}
      >
        <h1 style={{ margin: 0 }}>YQM Rides</h1>

        <p
          style={{
            margin: "6px 0 0",
            opacity: 0.8,
          }}
        >
          Ride Dispatch
        </p>
      </header>

      <div
        style={{
          padding: "20px",
          maxWidth: "900px",
          margin: "auto",
        }}
      >
        {!loggedIn && (
          <div style={formCardStyle}>
            <h2 style={{ marginTop: 0 }}>
              Driver Login 🔐
            </h2>

            <p>
              Sign in with one of the YQM Rides accounts.
            </p>

            <div style={gridStyle}>
              <Field label="Email">
                <input
                  style={inputStyle}
                  type="email"
                  value={email}
                  onChange={(e) =>
                    setEmail(e.target.value)
                  }
                />
              </Field>

              <Field label="Password">
                <input
                  style={inputStyle}
                  type="password"
                  value={password}
                  onChange={(e) =>
                    setPassword(e.target.value)
                  }
                />
              </Field>
            </div>

            <button
              type="button"
              style={buttonStyle}
              onClick={handleLogin}
            >
              Sign In
            </button>
          </div>
        )}

        {loggedIn && (
          <>
            <h2>Welcome 👋</h2>

            <p>
              Manage your ride bookings from one place.
            </p>
<div
  style={{
    marginTop: "25px",
    background: "white",
    padding: "20px",
    borderRadius: "12px",
    boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
  }}
>
<h2 style={{ marginTop: 0 }}>Active TO Rides 🚗</h2>

  {loadingRides && <p>Loading rides...</p>}

  {!loadingRides && rides.length === 0 && (
    <p>No rides saved yet.</p>
  )}

{!loadingRides &&
  rides
    .filter((ride) => ride.to_status !== "completed")
    .map((ride) => (
      <div
        key={ride.id}
        style={{
          padding: "15px 0",
          borderBottom: "1px solid #e5e7eb",
        }}
      >
        <strong>{ride.client_name}</strong>

        <div>
          {ride.event_date} • {ride.pickup_time || "No time"}
        </div>

        <div>
          👥 {ride.group_size} passengers
        </div>

        <div>
          📍 {ride.pickup_location || "No pickup location"}
        </div>

        <div>
          🚗 Driver: {ride.to_driver || "Not assigned"}
        </div>
<div style={{ marginTop: "6px" }}>
  📋 Status:{" "}
  <strong>
    {ride.to_status === "upcoming"
      ? "Upcoming 🕐"
      : ride.to_status === "on_my_way"
      ? "On my way 🚗"
      : ride.to_status === "picked_up"
      ? "Picked up 👥"
      : ride.to_status === "completed"
      ? "Dropped off ✅"
      : ride.to_status || "Upcoming 🕐"}
  </strong>
</div>
 <div
  style={{
    display: "flex",
    gap: "8px",
    flexWrap: "wrap",
    marginTop: "10px",
  }}
>
  {ride.to_status === "upcoming" && (
    <button
      type="button"
      onClick={() => updateRideStatus(ride.id, "on_my_way")}
      style={statusButtonStyle}
    >
      🚗 On my way
    </button>
  )}

  {ride.to_status === "on_my_way" && (
    <button
      type="button"
      onClick={() => updateRideStatus(ride.id, "picked_up")}
      style={statusButtonStyle}
    >
      👥 Picked up
    </button>
  )}

  {ride.to_status === "picked_up" && (
    <button
      type="button"
      onClick={() => updateRideStatus(ride.id, "completed")}
      style={statusButtonStyle}
    >
      ✅ Dropped off
    </button>
  )}
</div>

<div style={{ marginTop: "8px" }}>
  💰 TO YQM:{" "}
  <strong>
    $
    {ride.to_price_type === "per_person"
      ? Number(ride.to_price || 0) * Number(ride.group_size || 0)
      : Number(ride.to_price || 0)}
  </strong>{" "}
  — {ride.to_paid ? "Paid ✅" : "Unpaid ❌"}
</div>

{ride.return_requested && (
  <div>
    🔁 Return:{" "}
    <strong>
      $
      {ride.return_price_type === "per_person"
        ? Number(ride.return_price || 0) * Number(ride.group_size || 0)
        : Number(ride.return_price || 0)}
    </strong>{" "}
    — {ride.return_paid ? "Paid ✅" : "Unpaid ❌"}
  </div>
)}

<div style={{ fontWeight: "bold", marginTop: "4px" }}>
  Booking Total: $
  {(
    (ride.to_price_type === "per_person"
      ? Number(ride.to_price || 0) * Number(ride.group_size || 0)
      : Number(ride.to_price || 0)) +
    (ride.return_requested
      ? ride.return_price_type === "per_person"
        ? Number(ride.return_price || 0) * Number(ride.group_size || 0)
        : Number(ride.return_price || 0)
      : 0)
  ).toFixed(2)}
</div>
      </div>
    ))}
</div>
           <div
  style={{
    marginTop: "25px",
    background: "white",
    padding: "20px",
    borderRadius: "12px",
    boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
  }}
>
  <h2 style={{ marginTop: 0 }}>Return Queue 🔁</h2>

  {!loadingRides &&
    rides.filter(
      (ride) =>
        ride.return_requested &&
        ride.return_status !== "completed"
    ).length === 0 && (
      <p>No return rides waiting.</p>
    )}

  {!loadingRides &&
    rides
      .filter(
        (ride) =>
          ride.return_requested &&
          ride.return_status !== "completed"
      )
      .map((ride) => (
        <div
          key={`return-${ride.id}`}
          style={{
            padding: "15px 0",
            borderBottom: "1px solid #e5e7eb",
          }}
        >
          <strong>{ride.client_name}</strong>

          <div>👥 {ride.group_size} passengers</div>

          <div>
            📍 Return to:{" "}
            {ride.return_location || "No return location"}
          </div>

          <div>
            🚗 Return Driver:{" "}
            {ride.return_driver || "Not assigned"}
          </div>

          <div>
            📋 Return Status:{" "}
            <strong>
              {ride.return_status === "waiting"
                ? "Waiting ⏳"
                : ride.return_status === "on_my_way"
                ? "On my way 🚗"
                : ride.return_status === "picked_up"
                ? "Picked up 👥"
                : ride.return_status === "completed"
                ? "Returned home ✅"
                : ride.return_status || "Waiting ⏳"}
            </strong>
          </div>
<div
  style={{
    display: "flex",
    gap: "8px",
    flexWrap: "wrap",
    marginTop: "10px",
  }}
>
  {(ride.return_status === "waiting" || !ride.return_status) && (
    <button
      type="button"
      onClick={() => updateReturnStatus(ride.id, "on_my_way")}
      style={statusButtonStyle}
    >
      🚗 On my way
    </button>
  )}

  {ride.return_status === "on_my_way" && (
    <button
      type="button"
      onClick={() => updateReturnStatus(ride.id, "picked_up")}
      style={statusButtonStyle}
    >
      👥 Picked up
    </button>
  )}

  {ride.return_status === "picked_up" && (
    <button
      type="button"
      onClick={() => updateReturnStatus(ride.id, "completed")}
      style={statusButtonStyle}
    >
      ✅ Returned home
    </button>
  )}
</div>
          <div>
            💰 Return:{" "}
            <strong>
              $
              {ride.return_price_type === "per_person"
                ? Number(ride.return_price || 0) *
                  Number(ride.group_size || 0)
                : Number(ride.return_price || 0)}
            </strong>{" "}
            — {ride.return_paid ? "Paid ✅" : "Unpaid ❌"}
          </div>
        </div>
      ))}
</div>
            <div
  style={{
    marginTop: "25px",
    background: "white",
                display: "grid",
                gridTemplateColumns:
                  "repeat(auto-fit, minmax(180px, 1fr))",
                gap: "15px",
                marginTop: "25px",
              }}
            >
              <Card
                icon="🚗"
                title="Rides"
                text="View upcoming rides"
              />

              <Card
                icon="👥"
                title="Passengers"
                text="Manage passengers"
              />

              <Card
                icon="💵"
                title="Payments"
                text="Paid & unpaid rides"
              />

              <Card
                icon="📍"
                title="Dispatch"
                text="Pickup information"
              />
            </div>

            <button
              type="button"
              onClick={() =>
                setShowForm(!showForm)
              }
              style={buttonStyle}
            >
              {showForm
                ? "Close Form"
                : "+ Add New Ride"}
            </button>

            {showForm && (
              <div style={formCardStyle}>
                <h2 style={{ marginTop: 0 }}>
                  New Ride
                </h2>

                <div style={gridStyle}>
                  <Field label="Client / Group Name">
                    <input
                      style={inputStyle}
                      type="text"
                      value={formData.client_name}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          client_name:
                            e.target.value,
                        })
                      }
                    />
                  </Field>

                  <Field label="Phone Number">
                    <input
                      style={inputStyle}
                      type="tel"
                      value={formData.phone}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          phone: e.target.value,
                        })
                      }
                    />
                  </Field>

                  <Field label="Group Size">
                    <input
                      style={inputStyle}
                      type="number"
                      min="1"
                      value={formData.group_size}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          group_size:
                            e.target.value,
                        })
                      }
                    />
                  </Field>

                  <Field label="Date">
                    <input
                      style={inputStyle}
                      type="date"
                      value={formData.event_date}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          event_date:
                            e.target.value,
                        })
                      }
                    />
                  </Field>

                  <Field label="Pickup Time">
                    <input
                      style={inputStyle}
                      type="time"
                      value={formData.pickup_time}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          pickup_time:
                            e.target.value,
                        })
                      }
                    />
                  </Field>

                  <Field label="Pickup Location">
                    <input
                      style={inputStyle}
                      type="text"
                      value={
                        formData.pickup_location
                      }
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          pickup_location:
                            e.target.value,
                        })
                      }
                    />
                  </Field>

                  <Field label="Driver">
                    <select
                      style={inputStyle}
                      value={formData.driver}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          driver: e.target.value,
                        })
                      }
                    >
                      <option value="">
                        Select driver
                      </option>

                      <option value="Annick">
                        Annick
                      </option>

                      <option value="Partner">
                        Partner
                      </option>
                    </select>
                  </Field>
                </div>

                <h3
                  style={{
                    marginTop: "30px",
                  }}
                >
                  🚗 Ride TO Event
                </h3>

                <div style={gridStyle}>
                  <Field label="Pricing Type">
                    <select
                      style={inputStyle}
                      value={pricingType}
                      onChange={(e) =>
                        setPricingType(
                          e.target.value
                        )
                      }
                    >
                      <option value="per_person">
                        Per person
                      </option>

                      <option value="flat">
                        Flat group price
                      </option>
                    </select>
                  </Field>

                  <Field
                    label={
                      pricingType ===
                      "per_person"
                        ? "Price Per Person"
                        : "Flat Group Price"
                    }
                  >
                    <input
                      style={inputStyle}
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.to_price}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          to_price:
                            e.target.value,
                        })
                      }
                    />
                  </Field>

                  <Field label="Payment">
                    <select
                      style={inputStyle}
                      value={
                        formData.to_paid
                          ? "paid"
                          : "unpaid"
                      }
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          to_paid:
                            e.target.value ===
                            "paid",
                        })
                      }
                    >
                      <option value="unpaid">
                        Unpaid
                      </option>

                      <option value="paid">
                        Paid
                      </option>
                    </select>
                  </Field>
                </div>

                <h3
                  style={{
                    marginTop: "30px",
                  }}
                >
                  🔁 Return Ride
                </h3>

                <div style={gridStyle}>
                  <Field label="Return Requested">
                    <select
                      style={inputStyle}
                      value={
                        formData.return_requested
                          ? "yes"
                          : "no"
                      }
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          return_requested:
                            e.target.value ===
                            "yes",
                        })
                      }
                    >
                      <option value="no">
                        No
                      </option>

                      <option value="yes">
                        Yes
                      </option>
                    </select>
                  </Field>

                  {formData.return_requested && (
                    <>
                      <Field label="Return Location">
                        <input
                          style={inputStyle}
                          type="text"
                          value={
                            formData.return_location
                          }
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              return_location:
                                e.target.value,
                            })
                          }
                        />
                      </Field>

                      <Field label="Return Driver">
                        <select
                          style={inputStyle}
                          value={
                            formData.return_driver
                          }
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              return_driver:
                                e.target.value,
                            })
                          }
                        >
                          <option value="">
                            Select driver
                          </option>

                          <option value="Annick">
                            Annick
                          </option>

                          <option value="Partner">
                            Partner
                          </option>
                        </select>
                      </Field>

                      <Field label="Return Pricing Type">
                        <select
                          style={inputStyle}
                          value={
                            returnPricingType
                          }
                          onChange={(e) =>
                            setReturnPricingType(
                              e.target.value
                            )
                          }
                        >
                          <option value="per_person">
                            Per person
                          </option>

                          <option value="flat">
                            Flat group price
                          </option>
                        </select>
                      </Field>

                      <Field
                        label={
                          returnPricingType ===
                          "per_person"
                            ? "Return Price Per Person"
                            : "Return Flat Group Price"
                        }
                      >
                        <input
                          style={inputStyle}
                          type="number"
                          min="0"
                          step="0.01"
                          value={
                            formData.return_price
                          }
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              return_price:
                                e.target.value,
                            })
                          }
                        />
                      </Field>

                      <Field label="Return Payment">
                        <select
                          style={inputStyle}
                          value={
                            formData.return_paid
                              ? "paid"
                              : "unpaid"
                          }
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              return_paid:
                                e.target.value ===
                                "paid",
                            })
                          }
                        >
                          <option value="unpaid">
                            Unpaid
                          </option>

                          <option value="paid">
                            Paid
                          </option>
                        </select>
                      </Field>
                    </>
                  )}
                </div>

                <div
                  style={{
                    marginTop: "20px",
                  }}
                >
                  <Field label="Notes">
                    <textarea
                      style={{
                        ...inputStyle,
                        minHeight: "100px",
                      }}
                      value={formData.notes}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          notes: e.target.value,
                        })
                      }
                    />
                  </Field>
                </div>

                <button
                  type="button"
                  style={{
                    ...saveButtonStyle,
                    opacity: saving ? 0.6 : 1,
                  }}
                  onClick={handleSaveRide}
                  disabled={saving}
                >
                  {saving
                    ? "Saving..."
                    : "Save Ride"}
                </button>
              </div>
            )}
          </>
        )}

        {message && (
          <div
            style={{
              marginTop: "20px",
              padding: "15px",
              background: "white",
              borderRadius: "10px",
              border:
                "1px solid #cbd5e1",
            }}
          >
            {message}
          </div>
        )}
      </div>
    </main>
  );
}

function Card({ icon, title, text }) {
  return (
    <div
      style={{
        background: "white",
        padding: "20px",
        borderRadius: "12px",
        boxShadow:
          "0 2px 8px rgba(0,0,0,0.08)",
      }}
    >
      <div style={{ fontSize: "28px" }}>
        {icon}
      </div>

      <h3>{title}</h3>

      <p style={{ color: "#667085" }}>
        {text}
      </p>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <label
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "7px",
      }}
    >
      <span style={{ fontWeight: "bold" }}>
        {label}
      </span>

      {children}
    </label>
  );
}

const gridStyle = {
  display: "grid",
  gridTemplateColumns:
    "repeat(auto-fit, minmax(220px, 1fr))",
  gap: "15px",
};

const inputStyle = {
  padding: "12px",
  borderRadius: "8px",
  border: "1px solid #cbd5e1",
  fontSize: "16px",
  background: "white",
};

const buttonStyle = {
  width: "100%",
  padding: "16px",
  marginTop: "25px",
  background: "#172033",
  color: "white",
  border: "none",
  borderRadius: "12px",
  fontSize: "17px",
  fontWeight: "bold",
  cursor: "pointer",
};

const saveButtonStyle = {
  ...buttonStyle,
  background: "#1f7a4d",
};

const formCardStyle = {
  background: "white",
  padding: "20px",
  marginTop: "20px",
  borderRadius: "12px",
  boxShadow:
    "0 2px 8px rgba(0,0,0,0.08)",
};


const statusButtonStyle = {
  padding: "10px 12px",
  borderRadius: "8px",
  border: "1px solid #cbd5e1",
  background: "white",
  fontSize: "14px",
  fontWeight: "bold",
  cursor: "pointer",
};
