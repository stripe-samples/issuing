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
    options.DemoCardId = builder.Configuration["DEMO_CARD_ID"];
});
builder.Services.AddSingleton<IStripeClient>(new StripeClient(builder.Configuration["STRIPE_SECRET_KEY"]));
builder.Services.AddSingleton<EphemeralKeyService>();

var app = builder.Build();

StripeConfiguration.AppInfo = new AppInfo
{
    Name = "stripe-samples/issuing/issuing-elements",
    Url = "https://github.com/stripe-samples",
    Version = "0.0.1",
};

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

app.MapGet("config", (string sessionId, IOptions<StripeOptions> options) =>
{

    // You'll likely store the IDs of issued cards in your
    // database in this demo the ID of the card is set in the
    // .env file.
    return Results.Ok(new {
        cardId = options.Value.DemoCardId,
        publishableKey = options.Value.PublishableKey
    });
});

app.MapPost("create-card-key", async (CreateCardKeyRequest req, EphemeralKeyService service) =>
{
    var options = new EphemeralKeyCreateOptions
    {
        IssuingCard = req.cardId,
        StripeVersion = req.apiVersion,
    };
    options.AddExtraParam("nonce", req.nonce);

    var ephemeralKey = await service.CreateAsync(options);
    return Results.Ok(new { ephemeralKey = ephemeralKey });
});

app.Run();

public record CreateCardKeyRequest(string cardId, string nonce, string apiVersion);
