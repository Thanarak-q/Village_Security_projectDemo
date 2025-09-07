"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useState, useEffect } from "react";
import { Bell, Car, Home, Settings } from "lucide-react";

const ResidentPage = () => {
 
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white px-4 py-4 flex items-center justify-between shadow-sm">
        <h1 className="text-xl font-semibold text-gray-800">หมู่บ้านร่มรื่น</h1>
        <div className="relative">
          <Bell className="w-6 h-6 text-gray-600" />
          <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full"></div>
        </div>
      </div>

      <div className="px-4 py-3 bg-white">
        <p className="text-gray-600">สวัสดี คุณลูกบ้าน 👋</p>
      </div>

      <div className="px-4 py-4 space-y-4">
          <Card className="shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-start gap-3 mb-3">
                <Car className="w-5 h-5 text-gray-500 mt-1" />
                <div className="flex-1">
                  <div className="font-semibold text-lg"></div>
                  <div className="text-gray-600 text-sm"></div>
                  <div className="text-gray-500 text-xs flex items-center gap-1 mt-1">
                    <span>🕐</span>
                    <span></span>
                  </div>
                </div>
              </div>

              <div className="mb-4">
                <div className="w-full h-32 bg-gray-200 rounded-lg flex items-center justify-center">
                  <Car className="w-8 h-8 text-gray-400" />
                  <span className="ml-2 text-gray-500 text-sm"></span>
                </div>
              </div>

              <div className="flex gap-3">
                <Button
                  className="flex-1 bg-red-500 hover:bg-red-600 text-white py-3 rounded-lg font-medium"
                >
                  ปฏิเสธ
                </Button>
                <Button
                  className="flex-1 bg-green-500 hover:bg-green-600 text-white py-3 rounded-lg font-medium"
                >
                  อนุมัติ
                </Button>
              </div>
            </CardContent>
          </Card>

        <div className="mt-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-3">ประวัติล่าสุด</h2>
        </div>
      </div>
      {/*Nav bar*/}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-3">
        <div className="flex justify-around">
          <button className="flex flex-col items-center gap-1">
            <Home className="w-6 h-6 text-blue-500" />
          </button>
          <button className="flex flex-col items-center gap-1">
            <Settings className="w-6 h-6 text-gray-400" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ResidentPage;