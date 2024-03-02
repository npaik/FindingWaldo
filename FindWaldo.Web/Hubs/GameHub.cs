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
    public async Task UpdateUserPosition(string username, double x, double y)
    {
        await Clients.Others.SendAsync("ReceivePositionUpdate", username, x, y);
    }

    public async Task UpdateUserScore(string username, int newScore)
    {
    await Clients.All.SendAsync("ReceiveScoreUpdate", username, newScore);
    }


}
