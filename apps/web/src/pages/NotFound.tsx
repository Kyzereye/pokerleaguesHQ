import { Link } from "react-router-dom";

export default function NotFound() {
  return (
    <div className="page">
      <h1>Page not found</h1>
      <p className="muted">The page you’re looking for doesn’t exist or has been moved.</p>
      <p>
        <Link to="/" className="btn btn-primary">
          Go to Dashboard
        </Link>
      </p>
    </div>
  );
}
