using System.Text.Json;
using System.Text.Json.Serialization;

public class CreateCardRequest
{
    [JsonPropertyName("cardholder")]
    public string Cardholder { get; set; }

    [JsonPropertyName("status")]
    public bool Status { get; set; }

    [JsonPropertyName("currency")]
    public string Currency { get; set; }
}
