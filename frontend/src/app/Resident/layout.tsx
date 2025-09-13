import Navbar from "./navbar";

export default function ResidentLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative min-h-screen bg-gray-50">
      {children}
      
    </div>
  );
}