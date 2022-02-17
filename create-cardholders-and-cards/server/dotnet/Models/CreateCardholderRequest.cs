using System.Text.Json.Serialization;

public record CreateCardholderRequest(
    [property: JsonPropertyName("name")]
    string Name,
    [property: JsonPropertyName("email")]
    string Email,
    [property: JsonPropertyName("phone_number")]
    string PhoneNumber,
    [property: JsonPropertyName("line1")]
    string Line1,
    [property: JsonPropertyName("state")]
    string State,
    [property: JsonPropertyName("city")]
    string City,
    [property: JsonPropertyName("postal_code")]
    string PostalCode,
    [property: JsonPropertyName("country")]
    string Country);
