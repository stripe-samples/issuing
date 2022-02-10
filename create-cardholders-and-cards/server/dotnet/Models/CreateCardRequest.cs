using Newtonsoft.Json;

public class CreateCardRequest
{
    [JsonProperty("cardholder")]
    public string Cardholder { get; set; }

    [JsonProperty("status")]
    public bool Status { get; set; }

    [JsonProperty("currency")]
    public string Currency { get; set; }
}
