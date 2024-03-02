import { useState, useEffect } from "react";
import { createFileRoute } from "@tanstack/react-router";
import axios from "axios";
import useSignalR from "../useSignalR";

type User = {
  id: number;
  username: string;
  score: number;
  x: number;
  y: number;
};

type Position = {
  x: number;
  y: number;
};

const WaldoGame = () => {
  const [correctPositions, setCorrectPositions] = useState<Position[]>([]);
  const [latestIncorrectPosition, setLatestIncorrectPosition] = useState<
    Position[]
  >([]);
  const [score, setScore] = useState<number>(0);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [otherUserPositions, setOtherUserPositions] = useState<{
    [username: string]: Position;
  }>({});
  const [currentMapIndex, setCurrentMapIndex] = useState(0);
  const [timer, setTimer] = useState(30);

  const maps = [
    {
      filename: "waldo-1.jpg",
      coordinates: [
        { x: 27.638, y: 35.066 },
        { x: 88.221, y: 66.178 },
        { x: 95.521, y: 80.018 },
        { x: 9.513, y: 65.782 },
      ],
    },
    {
      filename: "waldo-2.jpg",
      coordinates: [{ x: 26.473682395143488, y: 30.65557134158717 }],
    },
  ];

  const { connection } = useSignalR("/r/gameHub");

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentMapIndex((prevIndex) => (prevIndex + 1) % maps.length);
      setTimer(30);
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (timer > 0) {
      const countdown = setInterval(() => {
        setTimer((prevTimer) => prevTimer - 1);
      }, 1000);

      return () => clearInterval(countdown);
    }
  }, [timer]);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const { data } = await axios.get<User[]>("/api/Users");
        setAllUsers(data);

        const currentUserUsername = localStorage.getItem("username");
        const currentUserData = data.find(
          (user: User) => user.username === currentUserUsername
        );
        setCurrentUser(currentUserData || null);
      } catch (error) {
        console.error("Failed to fetch users", error);
      }
    };

    fetchUsers();
  }, []);

  useEffect(() => {
    const fetchAndUpdateUserPositions = async () => {
      const updatedPositions: { [username: string]: Position } = {};

      const usernames = allUsers.map((user) => user.username);
      for (const username of usernames) {
        try {
          const { data } = await axios.get<User>(
            `/api/Users/byUsername/${username}`
          );

          if (data.x !== undefined && data.y !== undefined) {
            updatedPositions[username] = { x: data.x, y: data.y };
          }
        } catch (error) {
          console.error(`Failed to fetch position for ${username}`, error);
        }
      }

      setOtherUserPositions(updatedPositions);
    };

    if (allUsers.length > 0) {
      fetchAndUpdateUserPositions();
    }
  }, [allUsers]);

  useEffect(() => {
    if (connection) {
      connection.on("UserFoundWaldo", (user: User) => {
        const temp = [...allUsers];
        const userIndex = temp.findIndex((u) => u.username === user.username);
        if (userIndex !== -1) {
          temp[userIndex] = user;
        }

        console.log("User found Waldo", user);
        setAllUsers(temp);

        if (currentUser && user.username === currentUser.username) {
          setCurrentUser(user);
        }
      });
    }
  }, [connection, allUsers, currentUser]);

  const updateScoreInDatabase = async (username: string, newScore: number) => {
    try {
      await axios.put(`/api/Users/${username}`, { username, score: newScore });
      console.log("Score updated successfully.");

      if (connection && connection.state === "Connected") {
        await connection.invoke("BroadcastScoreUpdate", username, newScore);
      }
    } catch (error) {
      console.error("Failed to update score", error);
    }
  };

  const updatePositionInDatabase = async (
    username: string,
    x: number,
    y: number
  ) => {
    try {
      const currentScore = currentUser?.score || 0;
      await axios.put(`/api/Users/${username}`, {
        username,
        x,
        y,
        score: currentScore,
      });
      console.log("Position updated successfully.");

      const { data } = await axios.get("/api/Users");
      setAllUsers(data);
    } catch (error) {
      console.error("Failed to update position", error);
    }
  };

  const handleImageClick = (
    event: React.MouseEvent<HTMLImageElement, MouseEvent>
  ) => {
    const img = event.currentTarget;
    const bounds = img.getBoundingClientRect();
    const circleDiameter = 18;
    const x =
      ((event.clientX - bounds.left) / bounds.width) * 100 -
      (circleDiameter / 2 / bounds.width) * 100;
    const y =
      ((event.clientY - bounds.top) / bounds.height) * 100 -
      (circleDiameter / 2 / bounds.height) * 100;

    let found = false;
    const currentCoordinates = maps[currentMapIndex].coordinates;
    currentCoordinates.forEach((waldoPos) => {
      if (!found && isCloseEnough(x, y, waldoPos)) {
        if (
          !correctPositions.some((pos) => isCloseEnough(pos.x, pos.y, waldoPos))
        ) {
          setCorrectPositions([...correctPositions, { x, y }]);
          const updatedScore = score + 10;
          setScore(updatedScore);

          updateScoreInDatabase(currentUser?.username || "", updatedScore);

          updatePositionInDatabase(currentUser?.username || "", x, y);
        }
        found = true;
      }
    });

    if (!found) {
      setLatestIncorrectPosition([{ x, y }]);
      if (currentUser) {
        updatePositionInDatabase(currentUser.username, x, y);
      }
    }
  };

  const isCloseEnough = (
    clickX: number,
    clickY: number,
    waldoPos: Position
  ) => {
    const tolerance = 1.5;
    return (
      Math.abs(clickX - waldoPos.x) <= tolerance &&
      Math.abs(clickY - waldoPos.y) <= tolerance
    );
  };

  return (
    <div className="flex justify-center w-full">
      <div className="relative w-3/4">
        <img
          src={maps[currentMapIndex].filename}
          alt={`Where's Waldo Map ${currentMapIndex + 1}`}
          className="w-full h-auto border-4 border-black"
          onClick={handleImageClick}
        />
        {correctPositions.map((pos, index) => (
          <div
            key={`correct-${index}`}
            className="absolute w-10 h-10 border-4 border-green-500 rounded-full"
            style={{
              left: `calc(${pos.x}% - 9px)`,
              top: `calc(${pos.y}% - 9px)`,
            }}
          />
        ))}
        {latestIncorrectPosition.length > 0 && (
          <div
            className="absolute w-10 h-10 border-4 border-red-500 rounded-full"
            style={{
              left: `calc(${latestIncorrectPosition[latestIncorrectPosition.length - 1].x}% - 9px)`,
              top: `calc(${latestIncorrectPosition[latestIncorrectPosition.length - 1].y}% - 9px)`,
            }}
          />
        )}

        {Object.entries(otherUserPositions)
          .filter(([username]) => currentUser?.username !== username)
          .map(([username, position]) => (
            <div
              key={username}
              className="absolute"
              style={{
                left: `calc(${position.x}% - 9px)`,
                top: `calc(${position.y}% - 9px)`,
              }}
            >
              <div className="w-10 h-10 border-4 border-blue-800 rounded-full"></div>
              <div
                className="absolute text-white font-bold"
                style={{
                  left: "12px",
                  top: "0px",
                  whiteSpace: "nowrap",
                  textShadow: `
            -1px -1px 0 #000,  
             1px -1px 0 #000,
            -1px  1px 0 #000,
             1px  1px 0 #000`,
                }}
              >
                {username}
              </div>
            </div>
          ))}
      </div>
      <div className="m-4">
        <div className="mb-10 text-center">
          <span className="text-xl font-semibold">
            Next map in: {timer} seconds
          </span>
        </div>
        <h2 className="text-lg font-bold mb-2">Find Waldo and His Friends</h2>
        <img
          src="findlist.jpg"
          alt="Items to Find"
          className="w-44 pt-4 ml-6 h-auto"
        />
        <div>
          <div className="">
            <h4 className="text-lg font-bold mt-10 mb-2">Players</h4>
            <ul>
              {allUsers
                .filter((user) =>
                  currentUser ? user.username !== currentUser.username : true
                )
                .map((user, index) => (
                  <li key={index}>
                    {user.username} - Score: {user.score}
                  </li>
                ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export const Route = createFileRoute("/")({
  component: WaldoGame,
});

export default WaldoGame;
