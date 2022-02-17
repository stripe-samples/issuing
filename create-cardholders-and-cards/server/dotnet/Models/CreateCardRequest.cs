using System.Text.Json.Serialization;

public record CreateCardRequest(
    [property: JsonPropertyName("cardholder")]
    string Cardholder,
    [property: JsonPropertyName("status")]
    string StatusValue,
    [property: JsonPropertyName("currency")]
    string Currency
    )
{
    public string Status => StatusValue == "true" ? "active" : "inactive";
}
