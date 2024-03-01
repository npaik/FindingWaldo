namespace FindWaldo.Web.Models
{
  public class User
{
    public int Id { get; set; }
    public string Username { get; set; }
    public int Score { get; set; } = 0;
    public double X { get; set; } = 0;
    public double Y { get; set; } = 0;
 }
}
