"use client";

import { useState, FormEvent, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export default function CreateCard() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cardholderId, setCardholderId] = useState("");

  useEffect(() => {
    const id = searchParams.get("cardholder_id");
    if (id) {
      setCardholderId(id);
    }
  }, [searchParams]);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const data: Record<string, string | boolean> = {};

    formData.forEach((value, key) => {
      if (key === "status") {
        data[key] = value === "true";
      } else {
        data[key] = value as string;
      }
    });

    try {
      const response = await fetch("/api/create-card", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      const card = await response.json();

      if (card.id) {
        router.push(`/success?card_id=${card.id}`);
      } else {
        setError(card.error?.message || "An error occurred");
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
          <h2 className="text-2xl font-bold mb-6">Create card</h2>

          {error && (
            <div className="mb-4 p-3 bg-red-100 text-red-700 rounded">
              {error}
            </div>
          )}

          <div className="mb-4">
            <label htmlFor="cardholder" className="block text-sm font-medium mb-1">
              Cardholder
            </label>
            <input
              type="text"
              name="cardholder"
              id="cardholder"
              placeholder="ich_123"
              value={cardholderId}
              onChange={(e) => setCardholderId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-stripe-purple"
              required
            />
          </div>

          <div className="mb-4">
            <label htmlFor="currency" className="block text-sm font-medium mb-1">
              Currency
            </label>
            <input
              type="text"
              name="currency"
              id="currency"
              placeholder="usd"
              defaultValue="usd"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-stripe-purple"
              required
            />
          </div>

          <div className="mb-4 flex items-center">
            <input
              type="checkbox"
              name="status"
              id="status"
              value="true"
              className="h-4 w-4 text-stripe-purple focus:ring-stripe-purple border-gray-300 rounded"
            />
            <label htmlFor="status" className="ml-2 block text-sm font-medium">
              Activate?
            </label>
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
