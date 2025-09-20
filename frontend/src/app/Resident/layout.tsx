// import Navbar from "./navbar"; // Unused import
import { LiffProvider } from "@/components/LiffProvider";

export default function ResidentLayout({ children }: { children: React.ReactNode }) {
  return (
    <LiffProvider>
      <div className="relative min-h-screen bg-gray-50">
        {children}
      </div>
    </LiffProvider>
  );
}