import { Link } from 'react-router-dom';
import { useSEO } from '../site.jsx';

export default function NotFound() {
  useSEO('Page not found');
  return <div className="center-msg" style={{ textAlign: 'center' }}><div><h1>Page not found</h1><p>The page you are looking for does not exist.</p><Link className="btn primary" to="/">Back to home</Link></div></div>;
}
