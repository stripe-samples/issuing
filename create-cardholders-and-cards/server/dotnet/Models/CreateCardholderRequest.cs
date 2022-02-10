using Newtonsoft.Json;

public class CreateCardholderRequest
{
    [JsonProperty("name")]
    public string Name { get; set; }

    [JsonProperty("email")]
    public string Email { get; set; }

    [JsonProperty("phone_number")]
    public string PhoneNumber { get; set; }

    [JsonProperty("line1")]
    public string Line1 { get; set; }

    [JsonProperty("state")]
    public string State { get; set; }

    [JsonProperty("city")]
    public string City { get; set; }

    [JsonProperty("postal_code")]
    public string PostalCode { get; set; }

    [JsonProperty("country")]
    public string Country { get; set; }
}
