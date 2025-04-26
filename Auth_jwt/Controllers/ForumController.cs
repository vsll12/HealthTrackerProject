using Auth_jwt.Data;
using Auth_jwt.Dtos;
using Auth_jwt.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System;
using System.IO;
using System.Linq;
using System.Threading.Tasks;

namespace Auth_jwt.Controllers
{
	[Route("api/forum")]
	[ApiController]
	[Authorize]
	public class ForumController : ControllerBase
	{
		private readonly ApplicationDbContext _context;
		private readonly IWebHostEnvironment _environment;

		public ForumController(ApplicationDbContext context, IWebHostEnvironment environment)
		{
			_context = context;
			_environment = environment;
		}

		[HttpGet("posts")]
		public async Task<IActionResult> GetPosts()
		{
			try
			{
				var posts = await _context.ForumPosts
					.Include(p => p.User)
					.OrderBy(p => p.Timestamp)
					.Select(p => new
					{
						p.Id,
						UserId = p.UserId,
						UserName = p.User.UserName,
						Content = p.Content,
						FileUrl = p.FileUrl != null ? $"{Request.Scheme}://{Request.Host}/uploads/{p.FileUrl}" : null,
						Timestamp = p.Timestamp.ToString("o")
					})
					.ToListAsync();
				return Ok(posts);
			}
			catch (Exception ex)
			{
				Console.WriteLine($"Error in GetPosts: {ex.Message}");
				return StatusCode(500, "Failed to retrieve posts.");
			}
		}

		[HttpPost("posts")]
		public async Task<IActionResult> CreatePost([FromForm] ForumPostDto dto)
		{
			try
			{
				var currentUserId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
				if (currentUserId != dto.UserId)
				{
					return Unauthorized("User ID does not match authenticated user.");
				}

				string fileUrl = null;
				if (dto.File != null)
				{
					var uploadsFolder = Path.Combine(_environment.WebRootPath, "Uploads");
					if (!Directory.Exists(uploadsFolder))
					{
						Directory.CreateDirectory(uploadsFolder);
					}

					var fileName = $"{Guid.NewGuid()}_{Path.GetFileName(dto.File.FileName)}";
					var filePath = Path.Combine(uploadsFolder, fileName);
					using (var stream = new FileStream(filePath, FileMode.Create))
					{
						await dto.File.CopyToAsync(stream);
					}
					fileUrl = fileName; // Store relative path in DB
				}

				var post = new ForumPost
				{
					UserId = dto.UserId,
					Content = dto.Content ?? "",
					FileUrl = fileUrl,
					Timestamp = DateTime.UtcNow
				};

				_context.ForumPosts.Add(post);
				await _context.SaveChangesAsync();

				var user = await _context.Users.FindAsync(dto.UserId);
				var response = new
				{
					post.Id,
					UserId = post.UserId,
					UserName = user?.UserName ?? "Unknown",
					Content = post.Content,
					FileUrl = post.FileUrl != null ? $"{Request.Scheme}://{Request.Host}/Uploads/{post.FileUrl}" : null,
					Timestamp = post.Timestamp.ToString("o")
				};

				return Ok(response);
			}
			catch (Exception ex)
			{
				Console.WriteLine($"Error in CreatePost: {ex.Message}");
				return StatusCode(500, $"Failed to process post: {ex.Message}");
			}
		}

		[HttpPut("posts/{id}")]
		public async Task<IActionResult> UpdatePost(int id, [FromForm] ForumPostDto dto)
		{
			try
			{
				var currentUserId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
				var post = await _context.ForumPosts.FindAsync(id);
				if (post == null)
				{
					return NotFound("Post not found.");
				}
				if (post.UserId != currentUserId)
				{
					return Unauthorized("You can only edit your own posts.");
				}

				string fileUrl = post.FileUrl;
				if (dto.File != null)
				{
					var uploadsFolder = Path.Combine(_environment.WebRootPath, "Uploads");
					if (!Directory.Exists(uploadsFolder))
					{
						Directory.CreateDirectory(uploadsFolder);
					}

					// Delete old file if exists
					if (!string.IsNullOrEmpty(fileUrl))
					{
						var oldFilePath = Path.Combine(uploadsFolder, fileUrl);
						if (System.IO.File.Exists(oldFilePath))
						{
							System.IO.File.Delete(oldFilePath);
						}
					}

					var fileName = $"{Guid.NewGuid()}_{Path.GetFileName(dto.File.FileName)}";
					var filePath = Path.Combine(uploadsFolder, fileName);
					using (var stream = new FileStream(filePath, FileMode.Create))
					{
						await dto.File.CopyToAsync(stream);
					}
					fileUrl = fileName;
				}

				post.Content = dto.Content ?? post.Content;
				post.FileUrl = fileUrl;
				post.Timestamp = DateTime.UtcNow;

				await _context.SaveChangesAsync();

				var user = await _context.Users.FindAsync(post.UserId);
				var response = new
				{
					post.Id,
					UserId = post.UserId,
					UserName = user?.UserName ?? "Unknown",
					Content = post.Content,
					FileUrl = post.FileUrl != null ? $"{Request.Scheme}://{Request.Host}/Uploads/{post.FileUrl}" : null,
					Timestamp = post.Timestamp.ToString("o")
				};

				return Ok(response);
			}
			catch (Exception ex)
			{
				Console.WriteLine($"Error in UpdatePost: {ex.Message}");
				return StatusCode(500, $"Failed to update post: {ex.Message}");
			}
		}

		[HttpDelete("posts/{id}")]
		public async Task<IActionResult> DeletePost(int id)
		{
			try
			{
				var currentUserId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
				var post = await _context.ForumPosts.FindAsync(id);
				if (post == null)
				{
					return NotFound("Post not found.");
				}
				if (post.UserId != currentUserId)
				{
					return Unauthorized("You can only delete your own posts.");
				}

				if (!string.IsNullOrEmpty(post.FileUrl))
				{
					var filePath = Path.Combine(_environment.WebRootPath, "Uploads", post.FileUrl);
					if (System.IO.File.Exists(filePath))
					{
						System.IO.File.Delete(filePath);
					}
				}

				_context.ForumPosts.Remove(post);
				await _context.SaveChangesAsync();

				return Ok(new { Id = id });
			}
			catch (Exception ex)
			{
				Console.WriteLine($"Error in DeletePost: {ex.Message}");
				return StatusCode(500, $"Failed to delete post: {ex.Message}");
			}
		}
	}
}
