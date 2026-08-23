"use client";

import { useState } from "react";

export default function Home() {
  const [activeTab, setActiveTab] = useState("rides");

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
        <p style={{ margin: "6px 0 0", opacity: 0.8 }}>
          Ride Dispatch
        </p>
      </header>

      <div style={{ padding: "20px", maxWidth: "900px", margin: "auto" }}>
        <h2>Welcome 👋</h2>
        <p>Manage your YQM Country Fest rides from one place.</p>

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
          onClick={() => setActiveTab("add")}
          style={{
            width: "100%",
            padding: "16px",
            marginTop: "25px",
            background: "#172033",
            color: "white",
            border: "none",
            borderRadius: "12px",
            fontSize: "17px",
            fontWeight: "bold",
          }}
        >
          + Add New Ride
        </button>

        {activeTab === "add" && (
          <div
            style={{
              background: "white",
              padding: "20px",
              marginTop: "20px",
              borderRadius: "12px",
            }}
          >
            <h3>New Ride</h3>
            <p>Our booking form will go here next. 🚗</p>
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
