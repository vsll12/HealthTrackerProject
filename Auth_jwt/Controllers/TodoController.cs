using Auth_jwt.Data;
using Auth_jwt.Dtos;
using Auth_jwt.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System;
using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;

namespace Auth_jwt.Controllers
{
	[Route("api/todos")]
	[ApiController]
	[Authorize]
	public class TodoController : ControllerBase
	{
		private readonly ApplicationDbContext _context;

		public TodoController(ApplicationDbContext context)
		{
			_context = context;
		}

		[HttpGet("user/{userId}")]
		public async Task<IActionResult> GetTodos(string userId, [FromQuery] DateTime? date)
		{
			try
			{
				var currentUserId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
				if (currentUserId != userId)
				{
					return Unauthorized("User ID does not match authenticated user.");
				}

				var query = _context.Todos
					.Where(t => t.UserId == userId)
					.Select(t => new
					{
						t.Id,
						t.UserId,
						t.Date,
						t.Task,
						t.IsCompleted,
						t.CreatedAt
					});

				if (date.HasValue)
				{
					var startDate = date.Value.Date;
					var endDate = startDate.AddDays(1);
					query = query.Where(t => t.Date >= startDate && t.Date < endDate);
				}

				var todos = await query.OrderBy(t => t.CreatedAt).ToListAsync();
				return Ok(todos);
			}
			catch (Exception ex)
			{
				Console.WriteLine($"Error in GetTodos: {ex.Message}");
				return StatusCode(500, "Failed to retrieve todos.");
			}
		}

		[HttpPost]
		public async Task<IActionResult> CreateTodo([FromBody] TodoDto dto)
		{
			try
			{
				var currentUserId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
				if (currentUserId != dto.UserId)
				{
					return Unauthorized("User ID does not match authenticated user.");
				}

				var todo = new Todo
				{
					UserId = dto.UserId,
					Date = dto.Date.Date,
					Task = dto.Task,
					IsCompleted = dto.IsCompleted,
					CreatedAt = DateTime.UtcNow
				};

				_context.Todos.Add(todo);
				await _context.SaveChangesAsync();

				var response = new
				{
					todo.Id,
					todo.UserId,
					todo.Date,
					todo.Task,
					todo.IsCompleted,
					todo.CreatedAt
				};

				return Ok(response);
			}
			catch (Exception ex)
			{
				Console.WriteLine($"Error in CreateTodo: {ex.Message}");
				return StatusCode(500, $"Failed to create todo: {ex.Message}");
			}
		}

		[HttpPut("{id}")]
		public async Task<IActionResult> UpdateTodo(int id, [FromBody] TodoDto dto)
		{
			try
			{
				var currentUserId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
				var todo = await _context.Todos.FindAsync(id);
				if (todo == null)
				{
					return NotFound("Todo not found.");
				}
				if (todo.UserId != currentUserId)
				{
					return Unauthorized("You can only edit your own todos.");
				}

				todo.Task = dto.Task;
				todo.IsCompleted = dto.IsCompleted;
				todo.Date = dto.Date.Date;

				await _context.SaveChangesAsync();

				var response = new
				{
					todo.Id,
					todo.UserId,
					todo.Date,
					todo.Task,
					todo.IsCompleted,
					todo.CreatedAt
				};

				return Ok(response);
			}
			catch (Exception ex)
			{
				Console.WriteLine($"Error in UpdateTodo: {ex.Message}");
				return StatusCode(500, $"Failed to update todo: {ex.Message}");
			}
		}

		[HttpDelete("{id}")]
		public async Task<IActionResult> DeleteTodo(int id)
		{
			try
			{
				var currentUserId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
				var todo = await _context.Todos.FindAsync(id);
				if (todo == null)
				{
					return NotFound("Todo not found.");
				}
				if (todo.UserId != currentUserId)
				{
					return Unauthorized("You can only delete your own todos.");
				}

				_context.Todos.Remove(todo);
				await _context.SaveChangesAsync();

				return Ok(new { Id = id });
			}
			catch (Exception ex)
			{
				Console.WriteLine($"Error in DeleteTodo: {ex.Message}");
				return StatusCode(500, $"Failed to delete todo: {ex.Message}");
			}
		}
	}
}