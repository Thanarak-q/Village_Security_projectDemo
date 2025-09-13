"use client"
import { Home, Settings } from "lucide-react";

const navbar = () => {
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-3">
          <div className="flex justify-around">
            <button className="flex flex-col items-center gap-1">
              <Home className="w-6 h-6 text-gray-400" />
            </button>
            <button className="flex flex-col items-center gap-1">
              <Settings className="w-6 h-6 text-gray-400" />
            </button>
          </div>
        </div>
  )
}
export default navbar