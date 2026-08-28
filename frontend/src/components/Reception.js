import React, { useState } from "react";

export default function Reception() {
  const [patient, setPatient] = useState("");
  const [reason, setReason] = useState("");

  const generateQueue = () => {
    const queue = "Q" + Math.floor(100 + Math.random() * 900);

    alert(
      `Patient Checked In Successfully!\n\nQueue Number: ${queue}`
    );

    setPatient("");
    setReason("");
  };

  return (
    <div className="min-h-screen bg-slate-100 p-10">

      <div className="bg-white rounded-xl shadow-lg p-8">

        <h1 className="text-4xl font-bold text-teal-700">
          🏥 Digital Reception
        </h1>

        <p className="text-gray-600 mt-2">
          Replace paper sign-in registers with secure digital patient check-in.
        </p>

      </div>

      <div className="grid md:grid-cols-2 gap-8 mt-10">

        <div className="bg-white rounded-xl shadow p-8">

          <h2 className="text-2xl font-bold mb-6">
            Patient Check-In
          </h2>

          <input
            className="border rounded-lg w-full p-3 mb-4"
            placeholder="Patient ID or Full Name"
            value={patient}
            onChange={(e)=>setPatient(e.target.value)}
          />

          <textarea
            className="border rounded-lg w-full p-3 mb-4"
            placeholder="Reason for Visit"
            rows="4"
            value={reason}
            onChange={(e)=>setReason(e.target.value)}
          />

          <button
            onClick={generateQueue}
            className="bg-teal-600 hover:bg-teal-700 text-white px-6 py-3 rounded-lg w-full"
          >
            Generate Queue Number
          </button>

        </div>

        <div className="bg-white rounded-xl shadow p-8">

          <h2 className="text-2xl font-bold mb-6">
            Reception Services
          </h2>

          <div className="space-y-4">

            <button className="w-full bg-blue-600 text-white p-3 rounded-lg">
              Register New Patient
            </button>

            <button className="w-full bg-green-600 text-white p-3 rounded-lg">
              Search Existing Patient
            </button>

            <button className="w-full bg-purple-600 text-white p-3 rounded-lg">
              Visitor Registration
            </button>

            <button className="w-full bg-orange-500 text-white p-3 rounded-lg">
              Today's Queue
            </button>

          </div>

        </div>

      </div>

    </div>
  );
}