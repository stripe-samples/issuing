using System;
using System.Collections.Generic;
using System.IO;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Options;
using Stripe;
using Stripe.Issuing;

namespace server.Controllers
{
    public class PaymentsController : Controller
    {
        public readonly IOptions<StripeOptions> options;
        private readonly IStripeClient client;

        public PaymentsController(IOptions<StripeOptions> options)
        {
            this.options = options;
            this.client = new StripeClient(this.options.Value.SecretKey);
        }

        [HttpPost("create-cardholder")]
        public async Task<IActionResult> CreateCardholder([FromBody] CreateCardholderRequest req)
        {

            // Create a Cardholder.
            //
            // See the documentation [0] for the full list of supported parameters.
            //
            // [0] https://stripe.com/docs/api/issuing/cardholders/create
            var options = new CardholderCreateOptions
            {
                Status = "active",
                Type = "individual",
                Name = req.Name,
                Email = req.Email,
                PhoneNumber = req.PhoneNumber,
                Billing = new CardholderBillingOptions {
                    Address = new AddressOptions {
                        Line1 = req.Line1,
                        City = req.City,
                        State = req.State,
                        PostalCode = req.PostalCode,
                        Country = req.Country,
                    },
                },
            };

            var service = new CardholderService(this.client);

            try
            {
                var cardholder = await service.CreateAsync(options);
                return Ok(cardholder);
            }
            catch (StripeException e)
            {
                return BadRequest(new { error = new { message = e.StripeError.Message}});
            }
            catch (System.Exception)
            {
                return BadRequest(new { error = new { message = "unknown failure: 500"}});
            }
        }

        [HttpPost("webhook")]
        public async Task<IActionResult> Webhook()
        {
            var json = await new StreamReader(HttpContext.Request.Body).ReadToEndAsync();
            Event stripeEvent;
            try
            {
                stripeEvent = EventUtility.ConstructEvent(
                        json,
                        Request.Headers["Stripe-Signature"],
                        this.options.Value.WebhookSecret
                        );
                Console.WriteLine($"Webhook notification with type: {stripeEvent.Type} found for {stripeEvent.Id}");
            }
            catch (Exception e)
            {
                Console.WriteLine($"Something failed {e}");
                return BadRequest();
            }

            if (stripeEvent.Type == "checkout.session.completed")
            {
                var session = stripeEvent.Data.Object as Stripe.Checkout.Session;
                Console.WriteLine($"Session ID: {session.Id}");
                // Take some action based on session.
            }

            return Ok();
        }
    }
}
