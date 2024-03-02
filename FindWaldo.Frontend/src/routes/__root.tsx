import { Outlet, Link } from "@tanstack/react-router";
import { createRootRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import axios from "axios";

export const Route = createRootRoute({
  component: RootLayout,
});

function RootLayout() {
  const [username, setUsername] = useState("");
  const [score, setScore] = useState(0);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  useEffect(() => {
    const storedUsername = localStorage.getItem("username");
    const storedScore = localStorage.getItem("score");

    if (storedUsername) {
      setUsername(storedUsername);
      setScore(parseInt(storedScore || "0", 10));
    } else {
      setIsLoggingIn(true);
    }
  }, []);

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const inputUsername = (
      form.elements.namedItem("username") as HTMLInputElement
    ).value;

    if (!inputUsername) return;

    try {
      const response = await axios.get(
        `/api/Users/byUsername/${encodeURIComponent(inputUsername)}`
      );
      setUsername(response.data.username);
      setScore(response.data.score);
      localStorage.setItem("username", response.data.username);
      localStorage.setItem("score", response.data.score.toString());
      setIsLoggingIn(false);
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 404) {
        try {
          const createUserResponse = await axios.post("/api/Users", {
            username: inputUsername,
          });
          setUsername(createUserResponse.data.username);
          setScore(createUserResponse.data.score);
          localStorage.setItem("username", createUserResponse.data.username);
          localStorage.setItem(
            "score",
            createUserResponse.data.score.toString()
          );
          setIsLoggingIn(false);
        } catch (creationError) {
          console.error("Error creating user:", creationError);
        }
      } else {
        console.error("Error fetching user:", error);
      }
    }
  };

  if (isLoggingIn) {
    return (
      <div className="flex justify-center items-center h-screen bg-gray-100">
        <form
          onSubmit={handleLogin}
          className="flex flex-col gap-6 bg-white p-10 rounded-lg shadow-lg"
        >
          <h2 className="text-2xl font-bold text-center text-gray-800 mb-4">
            Welcome!
          </h2>
          <input
            type="text"
            name="username"
            placeholder="Enter your username"
            className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
          <button
            type="submit"
            className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
          >
            Sign Up / Log In
          </button>
        </form>
      </div>
    );
  }

  const handleLogout = () => {
    localStorage.removeItem("username");
    localStorage.removeItem("score");

    setUsername("");
    setScore(0);
    setIsLoggingIn(true);
  };

  return (
    <>
      <div className="py-2 flex mx-auto justify-between items-center w-full pb-4 px-4 lg:px-10">
        <Link to="/" className="text-2xl">
          Home
        </Link>
        {username && (
          <>
            <div className="text-2xl text-bold text-center">
              Welcome {username}
            </div>
            <button onClick={handleLogout} className="btn logout-button">
              Logout
            </button>
          </>
        )}
        <div className="flex gap-x-4">
          <Link
            to="/chat"
            className="[&.active]:text-foreground text-muted-foreground hover:text-foreground transition-colors"
          >
            Chat
          </Link>
        </div>
      </div>
      <hr />
      <div className="bg-background text-foreground flex flex-col gap-y-10 w-full px-4 lg:px-10">
        <Outlet />
      </div>
    </>
  );
}
