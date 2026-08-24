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
                    📍 Return to:{" "}
                    {ride.return_location ||
                      "No return location"}
                  </div>

                  <div>
                    🚗 Return Driver:{" "}
                    {ride.return_driver ||
                      "Not assigned"}
                  </div>

                  <div>
                    📋 Return Status:{" "}
                    <strong>
                      {returnStatusText(
                        ride.return_status
                      )}
                    </strong>
                  </div>

                  <div style={actionRowStyle}>
                    {(!ride.return_status ||
                      ride.return_status ===
                        "waiting") && (
                      <button
                        type="button"
                        onClick={() =>
                          updateReturnStatus(
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

                    {ride.return_status ===
                      "on_my_way" && (
                      <button
                        type="button"
                        onClick={() =>
                          updateReturnStatus(
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

                    {ride.return_status ===
                      "picked_up" && (
                      <button
                        type="button"
                        onClick={() =>
                          updateReturnStatus(
                            ride.id,
                            "completed"
                          )
                        }
                        style={
                          statusButtonStyle
                        }
                      >
                        ✅ Returned home
                      </button>
                    )}
                  </div>

                  <div
                    style={messageButtonRowStyle}
                  >
                    <button
                      type="button"
                      onClick={() =>
                        textReturnOnMyWay(
                          ride
                        )
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
                        textReturnImHere(ride)
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
                    💰 Return:{" "}
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
                </div>
              ))}
            </section>

            {showForm && (
              <section
                id="booking-form"
                style={formCardStyle}
              >
                <div
                  style={formHeaderStyle}
                >
                  <h2 style={{ margin: 0 }}>
                    {editingRideId
                      ? "✏️ Edit Booking"
                      : "➕ New Ride"}
                  </h2>

                  <button
                    type="button"
                    onClick={resetForm}
                    style={closeButtonStyle}
                  >
                    ✕
                  </button>
                </div>

                <div style={gridStyle}>
                  <Field label="Client / Group Name">
                    <input
                      style={inputStyle}
                      type="text"
                      value={
                        formData.client_name
                      }
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
                      value={
                        formData.group_size
                      }
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
                      value={
                        formData.event_date
                      }
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
                      value={
                        formData.pickup_time
                      }
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

                  <Field label="TO Driver">
                    <select
                      style={inputStyle}
                      value={formData.driver}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          driver:
                            e.target.value,
                        })
                      }
                    >
                      <option value="">
                        Select driver
                      </option>

                      {DRIVER_OPTIONS.map(
                        (driver) => (
                          <option
                            key={driver}
                            value={driver}
                          >
                            {driver}
                          </option>
                        )
                      )}
                    </select>
                  </Field>
                </div>

                <h3
                  style={formSectionTitleStyle}
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
                  style={formSectionTitleStyle}
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

                          {DRIVER_OPTIONS.map(
                            (driver) => (
                              <option
                                key={`return-${driver}`}
                                value={driver}
                              >
                                {driver}
                              </option>
                            )
                          )}
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
                          notes:
                            e.target.value,
                        })
                      }
                    />
                  </Field>
                </div>

                <div
                  style={formActionRowStyle}
                >
                  <button
                    type="button"
                    onClick={resetForm}
                    style={cancelButtonStyle}
                  >
                    Cancel
                  </button>

                  <button
                    type="button"
                    onClick={handleSaveRide}
                    disabled={saving}
                    style={{
                      ...saveButtonStyle,
                      opacity:
                        saving ? 0.6 : 1,
                    }}
                  >
                    {saving
                      ? "Saving..."
                      : editingRideId
                      ? "Update Booking"
                      : "Save Ride"}
                  </button>
                </div>
              </section>
            )}
          </>
        )}

        {message && (
          <div style={messageStyle}>
            {message}
          </div>
        )}
      </div>
    </main>
  );
}

function SummaryBox({
  icon,
  value,
  label,
}) {
  return (
    <div style={summaryBoxStyle}>
      <div style={{ fontSize: "24px" }}>
        {icon}
      </div>

      <strong
        style={{
          fontSize: "22px",
        }}
      >
        {value}
      </strong>

      <span style={mutedTextStyle}>
        {label}
      </span>
    </div>
  );
}

function Field({
  label,
  children,
}) {
  return (
    <label style={fieldStyle}>
      <span
        style={{
          fontWeight: "bold",
        }}
      >
        {label}
      </span>

      {children}
    </label>
  );
}

const pageStyle = {
  minHeight: "100vh",
  background: "#f5f7fa",
  fontFamily: "Arial, sans-serif",
  color: "#172033",
};

const headerStyle = {
  background: "#172033",
  color: "white",
  padding: "18px 22px",
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: "15px",
};

const headerSubtitleStyle = {
  margin: "6px 0 0",
  opacity: 0.8,
};

const contentStyle = {
  padding: "20px",
  maxWidth: "1050px",
  margin: "auto",
};

const welcomeRowStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: "15px",
  flexWrap: "wrap",
};

const summaryGridStyle = {
  display: "grid",
  gridTemplateColumns:
    "repeat(auto-fit, minmax(140px, 1fr))",
  gap: "12px",
  marginTop: "20px",
};

const summaryBoxStyle = {
  background: "white",
  padding: "15px",
  borderRadius: "12px",
  boxShadow:
    "0 2px 8px rgba(0,0,0,0.06)",
  display: "flex",
  flexDirection: "column",
  gap: "4px",
};

const sectionStyle = {
  marginTop: "25px",
  background: "white",
  padding: "20px",
  borderRadius: "12px",
  boxShadow:
    "0 2px 8px rgba(0,0,0,0.08)",
};

const sectionTitleStyle = {
  marginTop: 0,
};

const daySectionStyle = {
  marginTop: "14px",
  border:
    "1px solid #e5e7eb",
  borderRadius: "10px",
  overflow: "hidden",
};

const daySummaryStyle = {
  padding: "14px",
  fontWeight: "bold",
  cursor: "pointer",
  background: "#f8fafc",
};

const scheduleListStyle = {
  padding: "0 14px",
};

const scheduleRowStyle = {
  padding: "12px 0",
  borderBottom:
    "1px solid #e5e7eb",
};

const scheduleMainStyle = {
  display: "grid",
  gridTemplateColumns:
    "90px minmax(130px, 1fr) 120px 120px 130px minmax(140px, 1fr)",
  gap: "8px",
  alignItems: "center",
  overflowX: "auto",
  fontSize: "14px",
};

const scheduleActionsStyle = {
  display: "flex",
  gap: "8px",
  flexWrap: "wrap",
  marginTop: "8px",
};

const rideCardStyle = {
  padding: "16px 0",
  borderBottom:
    "1px solid #e5e7eb",
  lineHeight: 1.7,
};

const rideCardHeaderStyle = {
  display: "flex",
  justifyContent:
    "space-between",
  alignItems: "center",
  gap: "10px",
  flexWrap: "wrap",
};

const actionRowStyle = {
  display: "flex",
  gap: "8px",
  flexWrap: "wrap",
  marginTop: "10px",
};

const messageButtonRowStyle = {
  display: "flex",
  gap: "8px",
  flexWrap: "wrap",
  marginTop: "10px",
};

const bookingTotalStyle = {
  fontWeight: "bold",
  marginTop: "5px",
};

const formCardStyle = {
  background: "white",
  padding: "20px",
  marginTop: "25px",
  borderRadius: "12px",
  boxShadow:
    "0 2px 8px rgba(0,0,0,0.08)",
};

const formHeaderStyle = {
  display: "flex",
  justifyContent:
    "space-between",
  alignItems: "center",
  gap: "10px",
  marginBottom: "20px",
};

const formSectionTitleStyle = {
  marginTop: "30px",
};

const gridStyle = {
  display: "grid",
  gridTemplateColumns:
    "repeat(auto-fit, minmax(220px, 1fr))",
  gap: "15px",
};

const fieldStyle = {
  display: "flex",
  flexDirection: "column",
  gap: "7px",
};

const inputStyle = {
  padding: "12px",
  borderRadius: "8px",
  border:
    "1px solid #cbd5e1",
  fontSize: "16px",
  background: "white",
};

const buttonStyle = {
  width: "100%",
  padding: "16px",
  marginTop: "20px",
  background: "#172033",
  color: "white",
  border: "none",
  borderRadius: "10px",
  fontSize: "16px",
  fontWeight: "bold",
  cursor: "pointer",
};

const newRideButtonStyle = {
  padding: "12px 18px",
  background: "#172033",
  color: "white",
  border: "none",
  borderRadius: "10px",
  fontSize: "15px",
  fontWeight: "bold",
  cursor: "pointer",
};

const saveButtonStyle = {
  padding: "14px 18px",
  background: "#1f7a4d",
  color: "white",
  border: "none",
  borderRadius: "10px",
  fontSize: "16px",
  fontWeight: "bold",
  cursor: "pointer",
  flex: 1,
};

const cancelButtonStyle = {
  padding: "14px 18px",
  background: "white",
  color: "#172033",
  border:
    "1px solid #cbd5e1",
  borderRadius: "10px",
  fontSize: "16px",
  fontWeight: "bold",
  cursor: "pointer",
};

const formActionRowStyle = {
  display: "flex",
  gap: "10px",
  marginTop: "20px",
};

const statusButtonStyle = {
  padding: "10px 12px",
  borderRadius: "8px",
  border:
    "1px solid #cbd5e1",
  background: "white",
  fontSize: "14px",
  fontWeight: "bold",
  cursor: "pointer",
};

const textMessageButtonStyle = {
  padding: "10px 12px",
  borderRadius: "8px",
  border:
    "1px solid #94a3b8",
  background: "#f8fafc",
  fontSize: "14px",
  fontWeight: "bold",
  cursor: "pointer",
};

const smallActionButtonStyle = {
  padding: "7px 10px",
  borderRadius: "7px",
  border:
    "1px solid #cbd5e1",
  background: "white",
  fontSize: "13px",
  fontWeight: "bold",
  cursor: "pointer",
};

const closeButtonStyle = {
  border: "none",
  background: "transparent",
  fontSize: "22px",
  cursor: "pointer",
};

const logoutButtonStyle = {
  padding: "8px 12px",
  borderRadius: "8px",
  border:
    "1px solid rgba(255,255,255,0.35)",
  background: "transparent",
  color: "white",
  cursor: "pointer",
};

const messageStyle = {
  marginTop: "20px",
  padding: "15px",
  background: "white",
  borderRadius: "10px",
  border:
    "1px solid #cbd5e1",
};

const mutedTextStyle = {
  color: "#667085",
};
