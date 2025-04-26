using Auth_jwt.Data;
using System;

namespace Auth_jwt.Models
{
	public class Todo
	{
		public int Id { get; set; }
		public string UserId { get; set; }
		public DateTime Date { get; set; }
		public string Task { get; set; }
		public bool IsCompleted { get; set; }
		public DateTime CreatedAt { get; set; }

		public ApplicationUser User { get; set; }
	}
}