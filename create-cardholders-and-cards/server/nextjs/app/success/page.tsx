"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

interface CardData {
  id: string;
  cardholder: {
    id: string;
    name: string;
  };
  status: string;
  exp_month: number;
  exp_year: number;
  last4: string;
}

export default function Success() {
  const searchParams = useSearchParams();
  const [card, setCard] = useState<CardData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const cardId = searchParams.get("card_id");
    if (!cardId) {
      setError("No card ID provided");
      setLoading(false);
      return;
    }

    fetch(`/api/cards/${cardId}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.error) {
          setError(data.error.message);
        } else {
          setCard(data);
        }
      })
      .catch(() => {
        setError("Failed to fetch card details");
      })
      .finally(() => {
        setLoading(false);
      });
  }, [searchParams]);

  if (loading) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center p-8">
        <div className="text-lg">Loading...</div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center p-8">
        <div className="bg-red-100 text-red-700 p-4 rounded-lg">{error}</div>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8">
      <div className="w-full max-w-md">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h1 className="text-2xl font-bold mb-6">Card</h1>

          {card && (
            <div className="space-y-3">
              <div>
                <span className="font-semibold">ID:</span> {card.id}
              </div>
              <div>
                <span className="font-semibold">Cardholder ID:</span>{" "}
                {card.cardholder.id}
              </div>
              <div>
                <span className="font-semibold">Cardholder name:</span>{" "}
                {card.cardholder.name}
              </div>
              <div>
                <span className="font-semibold">Status:</span> {card.status}
              </div>
              <div>
                <span className="font-semibold">Expiry:</span> {card.exp_month}/
                {card.exp_year}
              </div>
              <div>
                <span className="font-semibold">Number:</span> **** **** ****{" "}
                {card.last4}
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
