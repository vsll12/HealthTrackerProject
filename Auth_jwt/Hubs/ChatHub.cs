using Auth_jwt.Data;
using Auth_jwt.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;
using System;
using System.Collections.Concurrent;
using System.Threading.Tasks;

namespace Auth_jwt.Hubs
{
	[Authorize]
	public class ChatHub : Hub
	{
		private readonly ApplicationDbContext _context;
		private static readonly ConcurrentDictionary<string, string> _userConnections = new();

		public ChatHub(ApplicationDbContext context)
		{
			_context = context;
		}

		public override async Task OnConnectedAsync()
		{
			string userId = Context.UserIdentifier;
			if (!string.IsNullOrEmpty(userId))
			{
				_userConnections[userId] = Context.ConnectionId;
				await Groups.AddToGroupAsync(Context.ConnectionId, "Forum");
				await Groups.AddToGroupAsync(Context.ConnectionId, $"User_{userId}"); // For todos
			}
			await base.OnConnectedAsync();
		}

		public override async Task OnDisconnectedAsync(Exception? exception)
		{
			string userId = Context.UserIdentifier;
			if (!string.IsNullOrEmpty(userId))
			{
				_userConnections.TryRemove(userId, out _);
				await Groups.RemoveFromGroupAsync(Context.ConnectionId, "Forum");
				await Groups.RemoveFromGroupAsync(Context.ConnectionId, $"User_{userId}");
			}
			await base.OnDisconnectedAsync(exception);
		}

		public async Task SendForumPost(string userId, string content, string fileUrl)
		{
			try
			{
				if (string.IsNullOrEmpty(content) && string.IsNullOrEmpty(fileUrl))
				{
					throw new HubException("Post must have content or a file.");
				}

				if (userId != Context.UserIdentifier)
				{
					throw new HubException("Unauthorized: User ID does not match authenticated user.");
				}

				var post = new ForumPost
				{
					UserId = userId,
					Content = content ?? "",
					FileUrl = fileUrl,
					Timestamp = DateTime.UtcNow
				};

				_context.ForumPosts.Add(post);
				await _context.SaveChangesAsync();

				var user = await _context.Users.FindAsync(userId);
				var fullFileUrl = fileUrl != null
					? $"https://localhost:7094/Uploads/{fileUrl}"
					: null;
				var response = new
				{
					post.Id,
					UserId = post.UserId,
					UserName = user?.UserName ?? "Unknown",
					post.Content,
					FileUrl = fullFileUrl,
					Timestamp = post.Timestamp.ToString("o")
				};

				Console.WriteLine($"Broadcasting post: Id={post.Id}, Content={post.Content}, FileUrl={fullFileUrl ?? "null"}");
				await Clients.Group("Forum").SendAsync("ReceiveForumPost", response);
			}
			catch (Exception ex)
			{
				Console.WriteLine($"Error in SendForumPost: {ex.Message}");
				if (ex.Message.Contains("database"))
				{
					throw new HubException("Database error: Ensure JwtAuthDb is attached and accessible.");
				}
				throw new HubException($"Failed to send forum post: {ex.Message}");
			}
		}

		public async Task UpdateForumPost(int postId, string content, string fileUrl)
		{
			try
			{
				var post = await _context.ForumPosts.FindAsync(postId);
				if (post == null)
				{
					throw new HubException("Post not found.");
				}
				if (post.UserId != Context.UserIdentifier)
				{
					throw new HubException("Unauthorized: You can only edit your own posts.");
				}

				post.Content = content ?? post.Content;
				post.FileUrl = fileUrl;
				post.Timestamp = DateTime.UtcNow;

				await _context.SaveChangesAsync();

				var user = await _context.Users.FindAsync(post.UserId);
				var fullFileUrl = fileUrl != null
					? $"https://localhost:7094/Uploads/{fileUrl}"
					: null;
				var response = new
				{
					post.Id,
					UserId = post.UserId,
					UserName = user?.UserName ?? "Unknown",
					post.Content,
					FileUrl = fullFileUrl,
					Timestamp = post.Timestamp.ToString("o")
				};

				Console.WriteLine($"Broadcasting updated post: Id={post.Id}, Content={post.Content}, FileUrl={fullFileUrl ?? "null"}");
				await Clients.Group("Forum").SendAsync("UpdateForumPost", response);
			}
			catch (Exception ex)
			{
				Console.WriteLine($"Error in UpdateForumPost: {ex.Message}");
				if (ex.Message.Contains("database"))
				{
					throw new HubException("Database error: Ensure JwtAuthDb is attached and accessible.");
				}
				throw new HubException($"Failed to update forum post: {ex.Message}");
			}
		}

		public async Task DeleteForumPost(int postId)
		{
			try
			{
				var post = await _context.ForumPosts.FindAsync(postId);
				if (post == null)
				{
					throw new HubException("Post not found.");
				}
				if (post.UserId != Context.UserIdentifier)
				{
					throw new HubException("Unauthorized: You can only delete your own posts.");
				}

				_context.ForumPosts.Remove(post);
				await _context.SaveChangesAsync();

				Console.WriteLine($"Broadcasting deleted post: Id={postId}");
				await Clients.Group("Forum").SendAsync("DeleteForumPost", postId);
			}
			catch (Exception ex)
			{
				Console.WriteLine($"Error in DeleteForumPost: {ex.Message}");
				if (ex.Message.Contains("database"))
				{
					throw new HubException("Database error: Ensure JwtAuthDb is attached and accessible.");
				}
				throw new HubException($"Failed to delete forum post: {ex.Message}");
			}
		}

		public async Task SendTodo(string userId, string task, DateTime date, bool isCompleted)
		{
			try
			{
				if (string.IsNullOrEmpty(task))
				{
					throw new HubException("Task cannot be empty.");
				}

				if (userId != Context.UserIdentifier)
				{
					throw new HubException("Unauthorized: User ID does not match authenticated user.");
				}

				var todo = new Todo
				{
					UserId = userId,
					Date = date.Date,
					Task = task,
					IsCompleted = isCompleted,
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

				Console.WriteLine($"Broadcasting todo: Id={todo.Id}, Task={todo.Task}, Date={todo.Date}");
				await Clients.Group($"User_{userId}").SendAsync("ReceiveTodo", response);
			}
			catch (Exception ex)
			{
				Console.WriteLine($"Error in SendTodo: {ex.Message}");
				if (ex.Message.Contains("database"))
				{
					throw new HubException("Database error: Ensure JwtAuthDb is attached and accessible.");
				}
				throw new HubException($"Failed to send todo: {ex.Message}");
			}
		}

		public async Task UpdateTodo(int todoId, string task, DateTime date, bool isCompleted)
		{
			try
			{
				var todo = await _context.Todos.FindAsync(todoId);
				if (todo == null)
				{
					throw new HubException("Todo not found.");
				}
				if (todo.UserId != Context.UserIdentifier)
				{
					throw new HubException("Unauthorized: You can only edit your own todos.");
				}

				todo.Task = task;
				todo.Date = date.Date;
				todo.IsCompleted = isCompleted;

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

				Console.WriteLine($"Broadcasting updated todo: Id={todo.Id}, Task={todo.Task}, Date={todo.Date}");
				await Clients.Group($"User_{todo.UserId}").SendAsync("UpdateTodo", response);
			}
			catch (Exception ex)
			{
				Console.WriteLine($"Error in UpdateTodo: {ex.Message}");
				if (ex.Message.Contains("database"))
				{
					throw new HubException("Database error: Ensure JwtAuthDb is attached and accessible.");
				}
				throw new HubException($"Failed to update todo: {ex.Message}");
			}
		}

		public async Task DeleteTodo(int todoId)
		{
			try
			{
				var todo = await _context.Todos.FindAsync(todoId);
				if (todo == null)
				{
					throw new HubException("Todo not found.");
				}
				if (todo.UserId != Context.UserIdentifier)
				{
					throw new HubException("Unauthorized: You can only delete your own todos.");
				}

				_context.Todos.Remove(todo);
				await _context.SaveChangesAsync();

				Console.WriteLine($"Broadcasting deleted todo: Id={todoId}");
				await Clients.Group($"User_{todo.UserId}").SendAsync("DeleteTodo", todoId);
			}
			catch (Exception ex)
			{
				Console.WriteLine($"Error in DeleteTodo: {ex.Message}");
				if (ex.Message.Contains("database"))
				{
					throw new HubException("Database error: Ensure JwtAuthDb is attached and accessible.");
				}
				throw new HubException($"Failed to delete todo: {ex.Message}");
			}
		}

		public async Task SendMessage(string senderId, string receiverId, string message)
		{
			try
			{
				if (string.IsNullOrEmpty(message))
				{
					throw new HubException("Message content cannot be empty.");
				}

				if (senderId != Context.UserIdentifier)
				{
					throw new HubException("Unauthorized: Sender ID does not match authenticated user.");
				}

				var timestamp = DateTime.UtcNow.ToString("o");
				var dbMessage = new Message
				{
					SenderId = senderId,
					ReceiverId = receiverId,
					Content = message,
					Timestamp = DateTime.Parse(timestamp),
					Status = "sent"
				};

				_context.Messages.Add(dbMessage);
				await _context.SaveChangesAsync();

				var response = new
				{
					SenderId = dbMessage.SenderId,
					Message = dbMessage.Content,
					Timestamp = timestamp,
					Status = dbMessage.Status,
					Id = dbMessage.Id
				};

				if (_userConnections.TryGetValue(receiverId, out var receiverConnectionId))
				{
					await Clients.Client(receiverConnectionId).SendAsync("ReceiveMessage", response.SenderId, response.Message, response.Timestamp, "delivered", response.Id);
				}
				await Clients.Caller.SendAsync("ReceiveMessage", response.SenderId, response.Message, response.Timestamp, response.Status, response.Id);
			}
			catch (Exception ex)
			{
				Console.WriteLine($"Error in SendMessage: {ex.Message}");
				throw new HubException($"Failed to send message: {ex.Message}");
			}
		}

		public async Task UpdateMessage(int messageId, string newContent)
		{
			try
			{
				if (string.IsNullOrEmpty(newContent))
				{
					throw new HubException("New content cannot be empty.");
				}

				var message = await _context.Messages.FindAsync(messageId);
				if (message == null || message.SenderId != Context.UserIdentifier)
				{
					throw new HubException("Message not found or you don’t have permission to update it.");
				}

				message.Content = newContent;
				message.Timestamp = DateTime.UtcNow;
				await _context.SaveChangesAsync();

				var timestamp = message.Timestamp.ToString("o");
				if (_userConnections.TryGetValue(message.ReceiverId, out var receiverConnectionId))
				{
					await Clients.Client(receiverConnectionId).SendAsync("MessageUpdated", messageId, newContent, timestamp);
				}
				await Clients.Caller.SendAsync("MessageUpdated", messageId, newContent, timestamp);
			}
			catch (Exception ex)
			{
				Console.WriteLine($"Error in UpdateMessage: {ex.Message}");
				throw new HubException($"Failed to update message: {ex.Message}");
			}
		}

		public async Task DeleteMessage(int messageId)
		{
			try
			{
				var message = await _context.Messages.FindAsync(messageId);
				if (message == null || message.SenderId != Context.UserIdentifier)
				{
					throw new HubException("Message not found or you don’t have permission to delete it.");
				}

				_context.Messages.Remove(message);
				await _context.SaveChangesAsync();

				if (_userConnections.TryGetValue(message.ReceiverId, out var receiverConnectionId))
				{
					await Clients.Client(receiverConnectionId).SendAsync("MessageDeleted", messageId);
				}
				await Clients.Caller.SendAsync("MessageDeleted", messageId);
			}
			catch (Exception ex)
			{
				Console.WriteLine($"Error in DeleteMessage: {ex.Message}");
				throw new HubException($"Failed to delete message: {ex.Message}");
			}
		}

		public async Task NotifyTyping(string senderId, string receiverId)
		{
			try
			{
				if (senderId != Context.UserIdentifier)
				{
					throw new HubException("Unauthorized: Sender ID does not match authenticated user.");
				}

				if (_userConnections.TryGetValue(receiverId, out var receiverConnectionId))
				{
					await Clients.Client(receiverConnectionId).SendAsync("UserTyping", senderId);
				}
			}
			catch (Exception ex)
			{
				Console.WriteLine($"Error in NotifyTyping: {ex.Message}");
				throw new HubException($"Failed to notify typing: {ex.Message}");
			}
		}

		public async Task JoinChat(string userId, string friendId)
		{
			try
			{
				if (userId != Context.UserIdentifier)
				{
					throw new HubException("Unauthorized: User ID does not match authenticated user.");
				}

				string groupName = GetGroupName(userId, friendId);
				await Groups.AddToGroupAsync(Context.ConnectionId, groupName);
				Console.WriteLine($"User {userId} joined chat group: {groupName}");
			}
			catch (Exception ex)
			{
				Console.WriteLine($"Error in JoinChat: {ex.Message}");
				throw new HubException($"Failed to join chat: {ex.Message}");
			}
		}

		public async Task LeaveChat(string userId, string friendId)
		{
			try
			{
				if (userId != Context.UserIdentifier)
				{
					throw new HubException("Unauthorized: User ID does not match authenticated user.");
				}

				string groupName = GetGroupName(userId, friendId);
				await Groups.RemoveFromGroupAsync(Context.ConnectionId, groupName);
				Console.WriteLine($"User {userId} left chat group: {groupName}");
			}
			catch (Exception ex)
			{
				Console.WriteLine($"Error in LeaveChat: {ex.Message}");
				throw new HubException($"Failed to leave chat: {ex.Message}");
			}
		}

		private static string GetGroupName(string user1, string user2)
		{
			return string.Compare(user1, user2, StringComparison.Ordinal) < 0
				? $"{user1}_{user2}"
				: $"{user2}_{user1}";
		}
	}
}
