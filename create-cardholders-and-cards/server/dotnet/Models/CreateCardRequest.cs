using System.Text.Json.Serialization;

public record CreateCardRequest(
    [property: JsonPropertyName("cardholder")]
    string Cardholder,

    [property: JsonPropertyName("status")]
    string Status,

    [property: JsonPropertyName("currency")]
    string Currency
)
{
  public string StatusValue => Status == "true" ? "active" : "inactive";
}
