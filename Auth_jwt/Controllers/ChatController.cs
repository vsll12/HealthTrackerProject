using Auth_jwt.Models;
using Microsoft.AspNetCore.Mvc;
using Newtonsoft.Json;
using System.Text;

[ApiController]
[Route("api/chat")]
public class ChatController : ControllerBase
{
	private readonly HttpClient _httpClient;

	public ChatController(HttpClient httpClient)
	{
		_httpClient = httpClient;
	}

	[HttpPost]
	public async Task<IActionResult> GetAIResponse([FromBody] ChatRequest request)
	{
		if (string.IsNullOrEmpty(request.Message))
		{
			return BadRequest("Message is required");
		}

		// Call your AI service (OpenAI, or another model)
		var aiResponse = await CallAIService(request.Message);

		return Ok(new { reply = aiResponse });
	}

	private async Task<string> CallAIService(string message)
	{
		// Example for OpenAI API - replace with your actual implementation
		var apiKey = "your-api-key";
		var url = "https://api.openai.com/v1/completions";
		var data = new
		{
			model = "gpt-4",
			prompt = message,
			max_tokens = 100
		};

		var requestBody = new StringContent(JsonConvert.SerializeObject(data), Encoding.UTF8, "application/json");
		requestBody.Headers.Add("Authorization", $"Bearer {apiKey}");

		var response = await _httpClient.PostAsync(url, requestBody);
		var responseContent = await response.Content.ReadAsStringAsync();

		var aiResult = JsonConvert.DeserializeObject<AIResponse>(responseContent);
		return aiResult.Choices[0].Text;
	}
}