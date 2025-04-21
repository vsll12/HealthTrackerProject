using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Configuration;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Auth_jwt.Models;
using OpenAI;
using OpenAI.ObjectModels;
using OpenAI.Managers;
using OpenAI.ObjectModels.RequestModels;
using OpenAI.ObjectModels;


namespace Auth_jwt.Controllers
{
	[ApiController]
	[Route("api/[controller]")]
	public class HealthAdviceController : ControllerBase
	{
		private readonly OpenAIService _openAIService;

		public HealthAdviceController(IConfiguration configuration)
		{
			_openAIService = new OpenAIService(new OpenAiOptions
			{
				ApiKey = configuration["OpenAI:ApiKey"]
			});
		}

		[HttpPost("chat")]
		public async Task<IActionResult> GetHealthAdvice([FromBody] Auth_jwt.Models.ChatMessage chatMessage)
		{
			try
			{
				var chatRequest = new ChatCompletionCreateRequest
				{
					Model = OpenAI.ObjectModels.Models.ChatGpt3_5Turbo,
					Messages = new List<OpenAI.ObjectModels.RequestModels.ChatMessage>
	{
		new OpenAI.ObjectModels.RequestModels.ChatMessage
		{
			Role = StaticValues.ChatMessageRoles.User,
			Content = chatMessage.Message
		}
	},
					MaxTokens = 100
				};

				var result = await _openAIService.ChatCompletion.CreateCompletion(chatRequest);

				if (result.Successful && result.Choices.Count > 0)
				{
					return Ok(new ChatResponse
					{
						Response = result.Choices[0].Message.Content
					});
				}

				return StatusCode(500, "Failed to generate response.");
			}
			catch (Exception ex)
			{
				Console.WriteLine($"Error: {ex.Message}");
				return StatusCode(500, "An internal error occurred.");
			}
		}
	}
}
