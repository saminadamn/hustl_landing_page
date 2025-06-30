import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { auth } from "../lib/firebase";

const Dashboard = () => {
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await auth.signOut();
      navigate("/");
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  // This is a placeholder for the existing Dashboard component
  // In a real implementation, you would import and use the actual Dashboard component
  return (
    <div>
      <h1>Dashboard</h1>
      <button onClick={handleLogout}>Logout</button>
    </div>
  );
};

export default Dashboard;