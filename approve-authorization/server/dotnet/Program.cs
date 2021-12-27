using Stripe;
using Stripe.Issuing;

var builder = WebApplication.CreateBuilder(args);
var app = builder.Build();

app.MapPost("/webhook", async (HttpRequest request) =>
{
    var json = await new StreamReader(request.Body).ReadToEndAsync();

    // const string signingSecret = "whsec_npTtwxS9vbc0dj82NJP1EKgK013WcLUR";
    const string signingSecret = "whsec_CEnfjmYibVGzKb66XdWdlSw06T8CONsz";
    try
    {
        var stripeEvent = EventUtility.ConstructEvent(
            json,
            request.Headers["Stripe-Signature"],
            signingSecret
        );

        // Handle the event
        if (stripeEvent.Type == Events.IssuingAuthorizationRequest)
        {
            var authorization = stripeEvent.Data.Object as Authorization;
            var service = new AuthorizationService();
            Console.WriteLine("Approving issuing authorization");
            service.Approve(authorization.Id);
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
