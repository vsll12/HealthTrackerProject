using System;

namespace Auth_jwt.Dtos
{
	public class TodoDto
	{
		public string UserId { get; set; }
		public DateTime Date { get; set; }
		public string Task { get; set; }
		public bool IsCompleted { get; set; }
	}
}