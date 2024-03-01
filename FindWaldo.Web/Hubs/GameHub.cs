using Microsoft.AspNetCore.SignalR;
using System;
using System.Threading.Tasks;

namespace FindWaldo.Web.Hubs;

public class GameHub : Hub
{
    public override Task OnConnectedAsync()
    {
        Console.WriteLine("A Client Connected: " + Context.ConnectionId);
        return base.OnConnectedAsync();
    }

    public override Task OnDisconnectedAsync(Exception exception)
    {
        Console.WriteLine("A client disconnected: " + Context.ConnectionId);
        return base.OnDisconnectedAsync(exception);
    }
    public async Task SendClickPosition(double x, double y, bool isCorrect, string username)
    {
        await Clients.All.SendAsync("ReceiveClickPosition", x, y, isCorrect, username);
    }

}
