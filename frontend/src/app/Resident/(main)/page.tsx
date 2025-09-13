"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useState } from "react";
import { Car, Clock } from "lucide-react";
import NotificationComponent from "./notification";

interface VisitorRequest {
  id: string;
  plateNumber: string;
  visitorName: string;
  destination: string;
  time: string;
  carImage: string;
  status?: "approved" | "denied";
}

const ResidentPage = () => {
  const [pendingRequests, setPendingRequests] = useState<VisitorRequest[]>([
    {
      id: "1",
      plateNumber: "กข 1234",
      visitorName: "ส่งของ",
      destination: "รปภ. สมชาย",
      time: "09:12",
      carImage: "",
    },
    {
      id: "2",
      plateNumber: "ขก 5678",
      visitorName: "เยี่ยม",
      destination: "รปภ. วิทยา",
      time: "09:45",
      carImage: "",
    },
  ]);

  const [history, setHistory] = useState<VisitorRequest[]>([]);

  const handleApprove = (id: string) => {
    const request = pendingRequests.find((req) => req.id === id);
    if (request) {
      const confirmed = window.confirm(
        `คุณแน่ใจหรือว่าต้องการอนุมัติคำขอสำหรับ ${request.plateNumber}?`
      );
      if (confirmed) {
        setHistory([{ ...request, status: "approved" }, ...history]);
        setPendingRequests(pendingRequests.filter((req) => req.id !== id));
      }
    }
  };

  const handleDeny = (id: string) => {
    const request = pendingRequests.find((req) => req.id === id);
    if (request) {
      const confirmed = window.confirm(
        `คุณแน่ใจหรือว่าต้องการปฏิเสธคำขอสำหรับ ${request.plateNumber}?`
      );
      if (confirmed) {
        setHistory([{ ...request, status: "denied" }, ...history]);
        setPendingRequests(pendingRequests.filter((req) => req.id !== id));
      }
    }
  };

  return (
    <div className="min-h-screen bg-white-50">
      <div className="bg-white px-4 py-4 flex items-center justify-between">
        <h1 className="text-xl font-semibold text-gray-800">หมู่บ้านร่มรื่น</h1>
        <div className="relative">
          <NotificationComponent />
        </div>
      </div>

      <div className="px-4 py-3 bg-white">
        <p className="text-gray-600">สวัสดี คุณลูกบ้าน 👋</p>
      </div>

      <div className="px-4 py-4 space-y-4 bg-white">
        {pendingRequests.map((request) => (
          <Card key={request.id} className="shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-start gap-3 mb-3">
                <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                  <Car className="w-5 h-5 text-gray-500 mt-1" />
                </div>

                <div className="flex-1">
                  <div className="font-semibold text-lg">
                    {request.plateNumber}
                  </div>
                  <div className="text-gray-600 text-sm">
                    {request.visitorName} • {request.destination}
                  </div>
                  <div className="text-gray-500 text-xs flex items-center gap-1 mt-1">
                    <Clock className="w-3 h-3" />
                    <span>{request.time}</span>
                  </div>
                </div>
              </div>

              <div className="mb-4">
                <div className="w-full h-32 bg-gray-200 rounded-lg flex items-center justify-center">
                  <Car className="w-8 h-8 text-gray-400" />
                  <span className="ml-2 text-gray-500 text-sm"></span>
                </div>
              </div>

              <div className="flex justify-center gap-3 flex-wrap">
                <Button
                  onClick={() => handleDeny(request.id)}
                  className="bg-red-600 text-white border-red-600 
               px-6 py-3 text-sm
               sm:px-8 sm:py-4 sm:text-base
               md:px-12 md:py-5 md:text-lg
               rounded-xl w-full sm:w-auto"
                >
                  ปฏิเสธ
                </Button>
                <Button
                  onClick={() => handleApprove(request.id)}
                  className="bg-green-600 text-white border-green-600 
               px-6 py-3 text-sm
               sm:px-8 sm:py-4 sm:text-base
               md:px-12 md:py-5 md:text-lg
               rounded-xl w-full sm:w-auto"
                >
                  อนุมัติ
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}

        <div className="mt-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-3">
            ประวัติล่าสุด
          </h2>

          {history.map((item) => (
            <Card
              key={item.id}
              className={`mb-3 ${
                item.status === "approved"
                  ? "bg-green-50 border-green-200"
                  : "bg-red-50 border-red-200"
              }`}
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-semibold">{item.plateNumber}</div>
                    <div className="text-sm text-gray-600">
                      {item.visitorName}
                    </div>
                    <div className="text-xs text-gray-500">
                      {item.destination} • {item.time}
                    </div>
                  </div>
                  <div
                    className={`px-3 py-1 rounded-full text-sm font-medium ${
                      item.status === "approved"
                        ? "bg-green-100 text-green-700"
                        : "bg-red-100 text-red-700"
                    }`}
                  >
                    {item.status === "approved" ? "Approved" : "Denied"}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ResidentPage;
