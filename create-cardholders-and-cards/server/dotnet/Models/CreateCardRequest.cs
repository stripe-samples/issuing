using Newtonsoft.Json;

public class CreateCardRequest
{
  [JsonProperty("cardholder")]
  public string CardholderId { get; set; }

  [JsonProperty("currency")]
  public string Currency { get; set; }

  [JsonProperty("status")]
  public string Status { get; set; }
}
