using System.Text.Json;
using System.Text.Json.Serialization;
using Microsoft.Extensions.FileProviders;

using Stripe;
using Stripe.Issuing;

var builder = WebApplication.CreateBuilder(args);
var app = builder.Build();

app.UseStaticFiles(new StaticFileOptions()
{
    FileProvider = new PhysicalFileProvider(
        Path.Combine(Directory.GetCurrentDirectory(), @"../../client")
    ),
    RequestPath = new PathString("")
});

DotNetEnv.Env.Load();

StripeConfiguration.ApiKey = Environment.GetEnvironmentVariable("STRIPE_SECRET_KEY");

// For sample support and debugging, not required for production:
StripeConfiguration.AppInfo = new AppInfo
  {
      Name = "stripe-samples/issuing/create-cardholder-and-card",
      Url = "https://github.com/stripe-samples",
      Version = "0.0.1",
  };

app.MapGet("/", () => Results.Redirect("/index.html"));


app.MapPost("/create-cardholder", async (HttpContext ctx) =>
{
  using var requestBodyStream = new StreamReader(ctx.Request.Body);
  var payload = await requestBodyStream.ReadToEndAsync();
  var req = JsonSerializer.Deserialize<CreateCardholderRequest>(payload);

  try
  {
    var options = new CardholderCreateOptions
    {
        Type = "individual",
        Name = req.Name,
        Email = req.Email,
        PhoneNumber = req.PhoneNumber,
        Billing = new CardholderBillingOptions
        {
            Address = new AddressOptions
            {
                Line1 = req.Line1,
                City = req.City,
                State = req.State,
                Country = req.Country,
                PostalCode = req.PostalCode,
            },
        },
    };
    var service = new CardholderService();
    var cardholder = await service.CreateAsync(options);
    return Results.Ok(cardholder);
  }
  catch(StripeException e)
  {
    Console.WriteLine("API Call to Stripe failed.");
    return Results.BadRequest(e);
  }
  catch(System.NotSupportedException e)
  {
    Console.WriteLine("There was an unhandled exception.");
    return Results.BadRequest(e);
  }
  catch(Exception e)
  {
    Console.WriteLine("There was an unhandled exception.");
    return Results.BadRequest(e);
  }
});

app.MapPost("/create-card", async (HttpContext ctx) =>
{
  using var requestBodyStream = new StreamReader(ctx.Request.Body);
  var payload = await requestBodyStream.ReadToEndAsync();
  var req = JsonSerializer.Deserialize<CreateCardRequest>(payload);

  try
  {
    var options = new Stripe.Issuing.CardCreateOptions
    {
      Cardholder = req.Cardholder,
      Currency = req.Currency,
      Type = "virtual",
      Status = req.Status ? "active" : "inactive",
    };
    var service = new Stripe.Issuing.CardService();
    var card = await service.CreateAsync(options);
    return Results.Ok(card);
  }
  catch(StripeException e)
  {
    Console.WriteLine(e);
    return Results.BadRequest(e);
  }
  catch(Exception e)
  {
    Console.WriteLine(e);
    return Results.BadRequest(e);
  }
});

app.MapGet("/cards/{id}", async (string id, HttpRequest request) =>
{
  try
  {
    var service = new Stripe.Issuing.CardService();
    var card = await service.GetAsync(id);
    return Results.Ok(card);
  }
  catch(Exception e)
  {
    Console.WriteLine(e);
    return Results.BadRequest(e);
  }
});

app.MapPost("/webhook", async (HttpRequest request) =>
{
    var json = await new StreamReader(request.Body).ReadToEndAsync();
    var signingSecret = Environment.GetEnvironmentVariable("STRIPE_WEBHOOK_SECRET");
    try
    {
        var stripeEvent = EventUtility.ConstructEvent(
            json,
            request.Headers["Stripe-Signature"],
            signingSecret
        );

        // Handle the event
        if (stripeEvent.Type == Events.IssuingCardholderCreated)
        {
            Console.WriteLine("Cardholder created!");
        }
        else if (stripeEvent.Type == Events.IssuingCardCreated)
        {
            Console.WriteLine("Card created!");
        }
        else
        {
            Console.WriteLine("Unhandled event type: {0}", stripeEvent.Type);
        }
        return Results.Ok(new { Message = "success" });
    }
    catch (StripeException e)
    {
        Console.WriteLine($"{e}");
        return Results.BadRequest(new { Error = e.Message });
    }
    catch (Exception e)
    {
        Console.WriteLine($"{e}");
        return Results.BadRequest(new { Error = $"{e}" });
    }
});

app.Run("http://localhost:4242");
