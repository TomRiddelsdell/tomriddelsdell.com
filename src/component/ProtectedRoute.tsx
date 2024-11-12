import { Navigate } from "react-router-dom";
import { useAuth } from "../Auth";

function ProtectedRoute({ element }: { element: JSX.Element })  {
  const { user } = useAuth();
  return user ? element : <Navigate to="/login" />;
}

export default ProtectedRoute;