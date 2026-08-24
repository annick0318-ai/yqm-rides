"use client";

import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

const DRIVER_OPTIONS = ["Annick", "Bianca"];

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
  const [editingRideId, setEditingRideId] = useState(null);

  const [pricingType, setPricingType] = useState("per_person");
  const [returnPricingType, setReturnPricingType] =
    useState("per_person");

  const [formData, setFormData] = useState(emptyForm);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loggedIn, setLoggedIn] = useState(false);

  const [rides, setRides] = useState([]);
  const [loadingRides, setLoadingRides] = useState(false);

  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);

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
      setMessage("Could not load rides: " + error.message);
      setLoadingRides(false);
      return;
    }

    setRides(data || []);
    setLoadingRides(false);
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
    setMessage("");
    await loadRides();
  }

  async function handleLogout() {
    await supabase.auth.signOut();

    setLoggedIn(false);
    setRides([]);
    setMessage("");
  }

  function resetForm() {
    setEditingRideId(null);
    setFormData(emptyForm);
    setPricingType("per_person");
    setReturnPricingType("per_person");
    setShowForm(false);
  }

  function openNewRide() {
    setEditingRideId(null);
    setFormData(emptyForm);
    setPricingType("per_person");
    setReturnPricingType("per_person");
    setShowForm(true);

    setTimeout(() => {
      document
        .getElementById("booking-form")
        ?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
    }, 100);
  }

  function openEditRide(ride) {
    setEditingRideId(ride.id);

    setFormData({
      client_name: ride.client_name || "",
      phone: ride.phone || "",
      group_size: ride.group_size || "",
      event_date: ride.event_date || "",
      pickup_time: ride.pickup_time || "",
      pickup_location: ride.pickup_location || "",
      driver: ride.to_driver || "",
      to_price: ride.to_price ?? "",
      to_paid: Boolean(ride.to_paid),
      return_requested: Boolean(ride.return_requested),
      return_location: ride.return_location || "",
      return_driver: ride.return_driver || "",
      return_price: ride.return_price ?? "",
      return_paid: Boolean(ride.return_paid),
      notes: ride.notes || "",
    });

    setPricingType(ride.to_price_type || "per_person");
    setReturnPricingType(
      ride.return_price_type || "per_person"
    );

    setShowForm(true);

    setTimeout(() => {
      document
        .getElementById("booking-form")
        ?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
    }, 100);
  }

  function firstName(name) {
    if (!name) return "";
    return name.trim().split(" ")[0];
  }

  function openTextMessage(phone, text) {
    if (!phone) {
      setMessage(
        "No phone number is saved for this client."
      );
      return;
    }

    const cleanPhone = phone.replace(/[^\d+]/g, "");

    if (!cleanPhone) {
      setMessage(
        "This client does not have a valid phone number."
      );
      return;
    }

    const encodedMessage = encodeURIComponent(text);

    window.location.href =
      `sms:${cleanPhone}&body=${encodedMessage}`;
  }

  function textToOnMyWay(ride) {
    const name = firstName(ride.client_name);
    const driver =
      ride.to_driver || "Your YQM Rides driver";

    const location = ride.pickup_location
      ? ` at ${ride.pickup_location}`
      : "";

    openTextMessage(
      ride.phone,
      `Hi ${name}! ${driver} from YQM Rides here 🚗 I’m on my way to pick you up now${location}. See you shortly!`
    );
  }

  function textToImHere(ride) {
    const name = firstName(ride.client_name);
    const driver =
      ride.to_driver || "Your YQM Rides driver";

    openTextMessage(
      ride.phone,
      `Hi ${name}! ${driver} from YQM Rides here 😊 I’m at your pickup location now!`
    );
  }

  function textReturnOnMyWay(ride) {
    const name = firstName(ride.client_name);
    const driver =
      ride.return_driver || "Your YQM Rides driver";

    openTextMessage(
      ride.phone,
      `Hi ${name}! ${driver} from YQM Rides here 🚗 I’m heading back to YQM now for your return ride. I’ll see you shortly!`
    );
  }

  function textReturnImHere(ride) {
    const name = firstName(ride.client_name);
    const driver =
      ride.return_driver || "Your YQM Rides driver";

    openTextMessage(
      ride.phone,
      `Hi ${name}! ${driver} from YQM Rides here 🚗 I’m back at YQM and ready for your return pickup!`
    );
  }

  async function handleSaveRide() {
    if (!formData.client_name.trim()) {
      setMessage(
        "Please enter the client / group name."
      );
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

    setMessage(
      editingRideId
        ? "Updating booking..."
        : "Saving ride..."
    );

    const booking = {
      client_name: formData.client_name.trim(),
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
        formData.return_requested &&
        formData.return_price !== ""
          ? Number(formData.return_price)
          : null,

      return_paid: formData.return_requested
        ? formData.return_paid
        : false,

      notes: formData.notes || null,
      event_name: "YQM Country Fest",
    };

    let error;

    if (editingRideId) {
      const result = await supabase
        .from("Bookings")
        .update(booking)
        .eq("id", editingRideId);

      error = result.error;
    } else {
      const result = await supabase
        .from("Bookings")
        .insert([
          {
            ...booking,
            to_status: "upcoming",
            return_status:
              formData.return_requested
                ? "waiting"
                : null,
            return_queue_position: null,
            cancelled: false,
          },
        ]);

      error = result.error;
    }

    if (error) {
      setMessage(
        "Could not save ride: " + error.message
      );
      setSaving(false);
      return;
    }

    setMessage(
      editingRideId
        ? "Booking updated successfully! ✅"
        : "Ride saved successfully! 🚗✅"
    );

    await loadRides();

    resetForm();
    setSaving(false);
  }

  async function updateRideStatus(
    rideId,
    newStatus
  ) {
    const { error } = await supabase
      .from("Bookings")
      .update({ to_status: newStatus })
      .eq("id", rideId);

    if (error) {
      setMessage(
        "Could not update TO status: " +
          error.message
      );
      return;
    }

    await loadRides();
  }

  async function updateReturnStatus(
    rideId,
    newStatus
  ) {
    const { error } = await supabase
      .from("Bookings")
      .update({ return_status: newStatus })
      .eq("id", rideId);

    if (error) {
      setMessage(
        "Could not update return status: " +
          error.message
      );
      return;
    }

    await loadRides();
  }

  async function toggleCancelled(ride) {
    const { error } = await supabase
      .from("Bookings")
      .update({
        cancelled: !ride.cancelled,
      })
      .eq("id", ride.id);

    if (error) {
      setMessage(
        "Could not update booking: " +
          error.message
      );
      return;
    }

    await loadRides();
  }

  function getToTotal(ride) {
    if (ride.to_price_type === "per_person") {
      return (
        Number(ride.to_price || 0) *
        Number(ride.group_size || 0)
      );
    }

    return Number(ride.to_price || 0);
  }

  function getReturnTotal(ride) {
    if (!ride.return_requested) return 0;

    if (
      ride.return_price_type === "per_person"
    ) {
      return (
        Number(ride.return_price || 0) *
        Number(ride.group_size || 0)
      );
    }

    return Number(ride.return_price || 0);
  }

  function formatTime(time) {
    if (!time) return "No time";

    const [hourString, minute] =
      time.split(":");

    const hour = Number(hourString);
    const suffix = hour >= 12 ? "PM" : "AM";
    const normalHour = hour % 12 || 12;

    return `${normalHour}:${minute} ${suffix}`;
  }

  function formatDate(date) {
    if (!date) return "No date";

    return new Date(
      `${date}T12:00:00`
    ).toLocaleDateString("en-CA", {
      weekday: "long",
      month: "long",
      day: "numeric",
    });
  }

  function toStatusText(status) {
    if (status === "on_my_way")
      return "On my way 🚗";

    if (status === "picked_up")
      return "Picked up 👥";

    if (status === "completed")
      return "Dropped off ✅";

    return "Upcoming 🕐";
  }

  function returnStatusText(status) {
    if (status === "on_my_way")
      return "On my way 🚗";

    if (status === "picked_up")
      return "Picked up 👥";

    if (status === "completed")
      return "Returned home ✅";

    return "Waiting ⏳";
  }

  function scheduleReturnText(ride) {
    if (!ride.return_requested) {
      return "—";
    }

    if (ride.return_status === "completed") {
      return "✅ Return complete";
    }

    if (ride.return_status === "picked_up") {
      return "🔁 Picked up 👥";
    }

    if (ride.return_status === "on_my_way") {
      return "🔁 On my way 🚗";
    }

    return "🔁 Return waiting";
  }

  const validRides = rides.filter(
    (ride) => !ride.cancelled
  );

  const activeToRides = validRides.filter(
    (ride) => ride.to_status !== "completed"
  );

  const returnQueue = validRides.filter(
    (ride) =>
      ride.return_requested &&
      ride.return_status !== "completed"
  );

  const scheduleDates = [
    ...new Set(
      rides
        .map((ride) => ride.event_date)
        .filter(Boolean)
    ),
  ].sort();

  const expectedTotal = validRides.reduce(
    (sum, ride) =>
      sum +
      getToTotal(ride) +
      getReturnTotal(ride),
    0
  );

  return (
    <main style={pageStyle}>
      <header style={headerStyle}>
        <div>
          <h1 style={{ margin: 0 }}>
            YQM Rides
          </h1>

          <p style={headerSubtitleStyle}>
            Ride Dispatch
          </p>
        </div>

        {loggedIn && (
          <button
            type="button"
            onClick={handleLogout}
            style={logoutButtonStyle}
          >
            Log out
          </button>
        )}
      </header>

      <div style={contentStyle}>
        {!loggedIn && (
          <div style={formCardStyle}>
            <h2 style={{ marginTop: 0 }}>
              Driver Login 🔐
            </h2>

            <p>
              Sign in with your YQM Rides
              driver account.
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
            <div style={welcomeRowStyle}>
              <div>
                <h2
                  style={{
                    marginBottom: "4px",
                  }}
                >
                  Welcome 👋
                </h2>

                <p style={{ marginTop: 0 }}>
                  Your shared ride schedule and
                  dispatch board.
                </p>
              </div>

              <button
                type="button"
                onClick={openNewRide}
                style={newRideButtonStyle}
              >
                + Add New Ride
              </button>
            </div>

            <div style={summaryGridStyle}>
              <SummaryBox
                value={activeToRides.length}
                label="Active TO"
                icon="🚗"
              />

              <SummaryBox
                value={returnQueue.length}
                label="Return Queue"
                icon="🔁"
              />

              <SummaryBox
                value={validRides.length}
                label="Bookings"
                icon="📅"
              />

              <SummaryBox
                value={`$${expectedTotal.toFixed(2)}`}
                label="Expected"
                icon="💰"
              />
            </div>

            <section style={sectionStyle}>
              <h2 style={sectionTitleStyle}>
                📅 Full Schedule
              </h2>

              {loadingRides && (
                <p>Loading schedule...</p>
              )}

              {!loadingRides &&
                scheduleDates.length === 0 && (
                  <p>
                    No rides scheduled yet.
                  </p>
                )}

              {!loadingRides &&
                scheduleDates.map((date) => {
                  const dayRides = rides
                    .filter(
                      (ride) =>
                        ride.event_date === date
                    )
                    .sort((a, b) =>
                      (
                        a.pickup_time || ""
                      ).localeCompare(
                        b.pickup_time || ""
                      )
                    );

                  return (
                    <details
                      key={date}
                      open
                      style={daySectionStyle}
                    >
                      <summary
                        style={daySummaryStyle}
                      >
                        {formatDate(date)} —{" "}
                        {dayRides.length} booking
                        {dayRides.length !== 1
                          ? "s"
                          : ""}
                      </summary>

                      <div
                        style={
                          scheduleListStyle
                        }
                      >
                        {dayRides.map(
                          (ride) => (
                            <div
                              key={`schedule-${ride.id}`}
                              style={{
                                ...scheduleRowStyle,
                                opacity:
                                  ride.cancelled
                                    ? 0.55
                                    : 1,
                              }}
                            >
                              <div
                                style={
                                  scheduleMainStyle
                                }
                              >
                                <div>
                                  <strong>
                                    {formatTime(
                                      ride.pickup_time
                                    )}
                                  </strong>
                                </div>

                                <div>
                                  <strong>
                                    {
                                      ride.client_name
                                    }
                                  </strong>{" "}
                                  <span
                                    style={
                                      mutedTextStyle
                                    }
                                  >
                                    ×{" "}
                                    {
                                      ride.group_size
                                    }
                                  </span>
                                </div>

                                <div>
                                  🚗{" "}
                                  {ride.to_driver ||
                                    "Unassigned"}
                                </div>

                                <div>
                                  💰 $
                                  {getToTotal(
                                    ride
                                  ).toFixed(2)}{" "}
                                  {ride.to_paid
                                    ? "✅"
                                    : "❌"}
                                </div>

                                <div>
                                  {ride.cancelled
                                    ? "🚫 Cancelled"
                                    : toStatusText(
                                        ride.to_status
                                      )}
                                </div>

                                <div>
                                  {scheduleReturnText(
                                    ride
                                  )}
                                </div>
                              </div>

                              <div
                                style={
                                  scheduleActionsStyle
                                }
                              >
                                <button
                                  type="button"
                                  onClick={() =>
                                    openEditRide(
                                      ride
                                    )
                                  }
                                  style={
                                    smallActionButtonStyle
                                  }
                                >
                                  ✏️ Edit
                                </button>

                                <button
                                  type="button"
                                  onClick={() =>
                                    toggleCancelled(
                                      ride
                                    )
                                  }
                                  style={
                                    smallActionButtonStyle
                                  }
                                >
                                  {ride.cancelled
                                    ? "↩ Restore"
                                    : "🚫 Cancel"}
                                </button>
                              </div>
                            </div>
                          )
                        )}
                      </div>
                    </details>
                  );
                })}
            </section>

            <section style={sectionStyle}>
              <h2 style={sectionTitleStyle}>
                🚗 Active TO Rides
              </h2>

              {activeToRides.length === 0 && (
                <p>No active TO rides.</p>
              )}

              {activeToRides.map((ride) => (
                <div
                  key={ride.id}
                  style={rideCardStyle}
                >
                  <div
                    style={rideCardHeaderStyle}
                  >
                    <div>
                      <strong>
                        {ride.client_name}
                      </strong>

                      <span
                        style={mutedTextStyle}
                      >
                        {" "}
                        · {ride.group_size}{" "}
                        passengers
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() =>
                        openEditRide(ride)
                      }
                      style={
                        smallActionButtonStyle
                      }
                    >
                      ✏️ Edit
                    </button>
                  </div>

                  <div>
                    🕐{" "}
                    {formatTime(
                      ride.pickup_time
                    )}
                  </div>

                  <div>
                    📍{" "}
                    {ride.pickup_location ||
                      "No pickup location"}
                  </div>

                  <div>
                    🚗 Driver:{" "}
                    {ride.to_driver ||
                      "Not assigned"}
                  </div>

                  <div>
                    📋 Status:{" "}
                    <strong>
                      {toStatusText(
                        ride.to_status
                      )}
                    </strong>
                  </div>

                  <div style={actionRowStyle}>
                    {(!ride.to_status ||
                      ride.to_status ===
                        "upcoming") && (
                      <button
                        type="button"
                        onClick={() =>
                          updateRideStatus(
                            ride.id,
                            "on_my_way"
                          )
                        }
                        style={
                          statusButtonStyle
                        }
                      >
                        🚗 On my way
                      </button>
                    )}

                    {ride.to_status ===
                      "on_my_way" && (
                      <button
                        type="button"
                        onClick={() =>
                          updateRideStatus(
                            ride.id,
                            "picked_up"
                          )
                        }
                        style={
                          statusButtonStyle
                        }
                      >
                        👥 Picked up
                      </button>
                    )}

                    {ride.to_status ===
                      "picked_up" && (
                      <button
                        type="button"
                        onClick={() =>
                          updateRideStatus(
                            ride.id,
                            "completed"
                          )
                        }
                        style={
                          statusButtonStyle
                        }
                      >
                        ✅ Dropped off
                      </button>
                    )}
                  </div>

                  <div
                    style={messageButtonRowStyle}
                  >
                    <button
                      type="button"
                      onClick={() =>
                        textToOnMyWay(ride)
                      }
                      style={
                        textMessageButtonStyle
                      }
                    >
                      📱 Text: On my way
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        textToImHere(ride)
                      }
                      style={
                        textMessageButtonStyle
                      }
                    >
                      📍 Text: I’m here
                    </button>
                  </div>

                  <div
                    style={{
                      marginTop: "10px",
                    }}
                  >
                    💰 TO YQM:{" "}
                    <strong>
                      $
                      {getToTotal(
                        ride
                      ).toFixed(2)}
                    </strong>
                    {" — "}
                    {ride.to_paid
                      ? "Paid ✅"
                      : "Unpaid ❌"}
                  </div>

                  {ride.return_requested && (
                    <div>
                      🔁 Return:{" "}
                      <strong>
                        $
                        {getReturnTotal(
                          ride
                        ).toFixed(2)}
                      </strong>
                      {" — "}
                      {ride.return_paid
                        ? "Paid ✅"
                        : "Unpaid ❌"}
                    </div>
                  )}

                  <div
                    style={bookingTotalStyle}
                  >
                    Booking Total: $
                    {(
                      getToTotal(ride) +
                      getReturnTotal(ride)
                    ).toFixed(2)}
                  </div>
                </div>
              ))}
            </section>

            <section style={sectionStyle}>
              <h2 style={sectionTitleStyle}>
                🔁 Return Queue
              </h2>

              {returnQueue.length === 0 && (
                <p>
                  No return rides waiting.
                </p>
              )}

              {returnQueue.map((ride) => (
                <div
                  key={`return-${ride.id}`}
                  style={rideCardStyle}
                >
                  <div
                    style={rideCardHeaderStyle}
                  >
                    <div>
                      <strong>
                        {ride.client_name}
                      </strong>

                      <span
                       
