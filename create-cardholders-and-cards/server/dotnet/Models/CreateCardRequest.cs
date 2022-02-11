using System.Text.Json;
using System.Text.Json.Serialization;

public class CreateCardRequest
{
    [JsonPropertyName("cardholder")]
    public string Cardholder { get; set; }

    [JsonPropertyName("status")]
    public string _Status { get; set; }

    public string Status
    {
        get { return _Status == "true" ? "active" : "inactive"; }
    }

    [JsonPropertyName("currency")]
    public string Currency { get; set; }
}
