using Microsoft.AspNetCore.StaticFiles.Infrastructure;
using Microsoft.Extensions.FileProviders;
using Microsoft.Extensions.Options;
using Stripe;
using Stripe.Checkout;

DotNetEnv.Env.Load();

var builder = WebApplication.CreateBuilder(args);
builder.Configuration.AddEnvironmentVariables();
builder.Services.Configure<StripeOptions>(options =>
{
    options.PublishableKey = builder.Configuration["STRIPE_PUBLISHABLE_KEY"];
    options.SecretKey = builder.Configuration["STRIPE_SECRET_KEY"];
    options.WebhookSecret = builder.Configuration["STRIPE_WEBHOOK_SECRET"];
    options.Domain = builder.Configuration["DOMAIN"];
});
builder.Services.AddSingleton<IStripeClient>(new StripeClient(builder.Configuration["STRIPE_SECRET_KEY"]));
builder.Services.AddSingleton<PaymentIntentService>();

var app = builder.Build();

StripeConfiguration.AppInfo = new AppInfo
{
    Name = "stripe-samples/<your-sample-name>/<integration>",
    Url = "https://github.com/stripe-samples",
    Version = "0.0.1",
};


// Check any required non key .env values.
// var price = Environment.GetEnvironmentVariable("PRICE");
// if (price == "price_12345" || price == "" || price == null)
// {
//     app.Logger.LogError("You must set a Price ID in .env. Please see the README.");
//     Environment.Exit(1);
// }

if (app.Environment.IsDevelopment())
{
    app.UseDeveloperExceptionPage();
}

var staticFileOptions = new SharedOptions
{
    FileProvider = new PhysicalFileProvider(
        Path.Combine(Directory.GetCurrentDirectory(), builder.Configuration["STATIC_DIR"])
    ),
};
app.UseDefaultFiles(new DefaultFilesOptions(staticFileOptions));
app.UseStaticFiles(new StaticFileOptions(staticFileOptions));

app.MapGet("config", async (string sessionId, IOptions<StripeOptions> options) =>
{
    return Results.Ok(new { publishableKey = options.Value.PublishableKey });
});

app.MapPost("create-payment-intent", async (PaymentIntentService service, IOptions<StripeOptions> options) =>
{
    var options = new PaymentIntentCreateOptions
    {
        Amount = 2000,
        Currency = "usd",
        AutomaticPaymentMethods = new()
        {
            Enabled = true,
        },
    };
    var paymentIntent = await service.CreateAsync(options);
    return Results.Ok(new { paymentIntent.ClientSecret });
});

app.MapPost("webhook", async (HttpRequest req, IOptions<StripeOptions> options, ILogger<Program> logger) =>
{
    var json = await new StreamReader(req.Body).ReadToEndAsync();
    Event stripeEvent;
    try
    {
        stripeEvent = EventUtility.ConstructEvent(
            json,
            req.Headers["Stripe-Signature"],
            options.Value.WebhookSecret
        );
        logger.LogInformation($"Webhook notification with type: {stripeEvent.Type} found for {stripeEvent.Id}");
    }
    catch (Exception e)
    {
        logger.LogError(e, $"Something failed => {e.Message}");
        return Results.BadRequest();
    }

    if (stripeEvent.Type == Events.CheckoutSessionCompleted)
    {
        var session = stripeEvent.Data.Object as Stripe.Checkout.Session;
        logger.LogInformation($"Session ID: {session.Id}");
        // Take some action based on session.
        // Note: If you need access to the line items, for instance to
        // automate fullfillment based on the the ID of the Price, you'll
        // need to refetch the Checkout Session here, and expand the line items:
        //
        //var options = new SessionGetOptions();
        // options.AddExpand("line_items");
        //
        // var service = new SessionService();
        // Session session = service.Get(session.Id, options);
        //
        // StripeList<LineItem> lineItems = session.LineItems;
        //
        // Read more about expand here: https://stripe.com/docs/expand
    }

    return Results.Ok();
});

app.Run();
