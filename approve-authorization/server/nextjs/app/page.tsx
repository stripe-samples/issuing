export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8">
      <div className="w-full max-w-md">
        <h1 className="text-2xl font-bold text-center mb-8">
          Stripe Issuing - Approve Authorization
        </h1>
        <div className="bg-white p-6 rounded-lg shadow-md">
          <p className="text-center text-gray-600 mb-4">
            This sample demonstrates how to handle Issuing authorization
            requests via webhooks.
          </p>
          <p className="text-center text-sm text-gray-500">
            The webhook endpoint at <code>/api/webhook</code> will automatically
            approve incoming authorization requests.
          </p>
        </div>
      </div>
    </main>
  );
}
