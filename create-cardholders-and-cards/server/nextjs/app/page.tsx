"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const data = Object.fromEntries(formData.entries());

    try {
      const response = await fetch("/api/create-cardholder", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      const cardholder = await response.json();

      if (cardholder.id) {
        router.push(`/create-card?cardholder_id=${cardholder.id}`);
      } else {
        setError(cardholder.error?.message || "An error occurred");
      }
    } catch {
      setError("An error occurred");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8">
      <div className="w-full max-w-md">
        <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-2xl font-bold mb-6">Create cardholder</h2>

          {error && (
            <div className="mb-4 p-3 bg-red-100 text-red-700 rounded">
              {error}
            </div>
          )}

          <div className="mb-4">
            <label htmlFor="name" className="block text-sm font-medium mb-1">
              Name
            </label>
            <input
              type="text"
              name="name"
              id="name"
              placeholder="Jenny Rosen"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-stripe-purple"
              required
            />
          </div>

          <div className="mb-4">
            <label htmlFor="email" className="block text-sm font-medium mb-1">
              Email
            </label>
            <input
              type="email"
              name="email"
              id="email"
              placeholder="jenny.rosen@example.com"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-stripe-purple"
              required
            />
          </div>

          <div className="mb-4">
            <label htmlFor="phone_number" className="block text-sm font-medium mb-1">
              Phone number
            </label>
            <input
              type="tel"
              name="phone_number"
              id="phone_number"
              placeholder="18008675309"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-stripe-purple"
              required
            />
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">Address</label>
            <input
              type="text"
              name="line1"
              id="line1"
              placeholder="123 Main Street"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-stripe-purple mb-2"
              required
            />
            <input
              type="text"
              name="city"
              id="city"
              placeholder="San Francisco"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-stripe-purple mb-2"
              required
            />
            <input
              type="text"
              name="state"
              id="state"
              placeholder="CA"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-stripe-purple mb-2"
              required
            />
            <input
              type="text"
              name="postal_code"
              id="postal_code"
              placeholder="94111"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-stripe-purple mb-2"
              required
            />
            <input
              type="text"
              name="country"
              id="country"
              placeholder="US"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-stripe-purple"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-stripe-purple text-white py-2 px-4 rounded-md hover:opacity-90 disabled:opacity-50 transition-opacity"
          >
            {loading ? "Creating..." : "Create"}
          </button>
        </form>
      </div>
    </main>
  );
}
