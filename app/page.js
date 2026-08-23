"use client";

import { useState } from "react";

export default function Home() {
  const [showForm, setShowForm] = useState(false);
  const [pricingType, setPricingType] = useState("per_person");
  const [returnPricingType, setReturnPricingType] = useState("per_person");

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
        <p style={{ margin: "6px 0 0", opacity: 0.8 }}>Ride Dispatch</p>
      </header>

      <div style={{ padding: "20px", maxWidth: "900px", margin: "auto" }}>
        <h2>Welcome 👋</h2>
        <p>Manage your ride bookings from one place.</p>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
            gap: "15px",
            marginTop: "25px",
          }}
        >
          <Card icon="🚗" title="Rides" text="View upcoming rides" />
          <Card icon="👥" title="Passengers" text="Manage passengers" />
          <Card icon="💵" title="Payments" text="Paid & unpaid rides" />
          <Card icon="📍" title="Dispatch" text="Pickup information" />
        </div>

        <button
          onClick={() => setShowForm(!showForm)}
          style={buttonStyle}
        >
          {showForm ? "Close Form" : "+ Add New Ride"}
        </button>

        {showForm && (
          <div style={formCardStyle}>
            <h2 style={{ marginTop: 0 }}>New Ride</h2>

            <div style={gridStyle}>
              <Field label="Client / Group Name">
                <input style={inputStyle} type="text" />
              </Field>

              <Field label="Phone Number">
                <input style={inputStyle} type="tel" />
              </Field>

              <Field label="Group Size">
                <input style={inputStyle} type="number" min="1" />
              </Field>

              <Field label="Date">
                <input style={inputStyle} type="date" />
              </Field>

              <Field label="Pickup Time">
                <input style={inputStyle} type="time" />
              </Field>

              <Field label="Pickup Location">
                <input style={inputStyle} type="text" />
              </Field>

              <Field label="Driver">
                <select style={inputStyle}>
                  <option value="">Select driver</option>
                  <option value="annick">Annick</option>
                  <option value="partner">Partner</option>
                </select>
              </Field>
            </div>

            <h3>Ride TO Event</h3>

            <div style={gridStyle}>
              <Field label="Pricing Type">
                <select
                  style={inputStyle}
                  value={pricingType}
                  onChange={(e) => setPricingType(e.target.value)}
                >
                  <option value="per_person">Per person</option>
                  <option value="flat">Flat group price</option>
                </select>
              </Field>

              <Field label={pricingType === "per_person" ? "Price Per Person" : "Flat Price"}>
                <input style={inputStyle} type="number" min="0" step="0.01" />
              </Field>

              <Field label="Payment">
                <select style={inputStyle}>
                  <option value="unpaid">Unpaid</option>
                  <option value="paid">Paid</option>
                </select>
              </Field>
            </div>

            <h3>Return Ride</h3>

            <div style={gridStyle}>
              <Field label="Return Requested">
                <select style={inputStyle}>
                  <option value="no">No</option>
                  <option value="yes">Yes</option>
                </select>
              </Field>

              <Field label="Return Location">
                <input style={inputStyle} type="text" />
              </Field>

              <Field label="Return Driver">
                <select style={inputStyle}>
                  <option value="">Select driver</option>
                  <option value="annick">Annick</option>
                  <option value="partner">Partner</option>
                </select>
              </Field>

              <Field label="Return Pricing Type">
                <select
                  style={inputStyle}
                  value={returnPricingType}
                  onChange={(e) => setReturnPricingType(e.target.value)}
                >
                  <option value="per_person">Per person</option>
                  <option value="flat">Flat group price</option>
                </select>
              </Field>

              <Field
                label={
                  returnPricingType === "per_person"
                    ? "Return Price Per Person"
                    : "Return Flat Price"
                }
              >
                <input style={inputStyle} type="number" min="0" step="0.01" />
              </Field>

              <Field label="Return Payment">
                <select style={inputStyle}>
                  <option value="unpaid">Unpaid</option>
                  <option value="paid">Paid</option>
                </select>
              </Field>
            </div>

            <Field label="Notes">
              <textarea
                style={{ ...inputStyle, minHeight: "100px" }}
              />
            </Field>

            <button style={saveButtonStyle}>Save Ride</button>
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
        boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
      }}
    >
      <div style={{ fontSize: "28px" }}>{icon}</div>
      <h3>{title}</h3>
      <p style={{ color: "#667085" }}>{text}</p>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <label style={{ display: "flex", flexDirection: "column", gap: "7px" }}>
      <span style={{ fontWeight: "bold" }}>{label}</span>
      {children}
    </label>
  );
}

const gridStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
  gap: "15px",
};

const inputStyle = {
  padding: "12px",
  borderRadius: "8px",
  border: "1px solid #cbd5e1",
  fontSize: "16px",
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
  boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
};
