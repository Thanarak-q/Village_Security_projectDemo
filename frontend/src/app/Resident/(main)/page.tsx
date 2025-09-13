"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useState, useRef, useLayoutEffect } from "react";
import { Car, Home, Clock, ChevronLeft, ChevronRight } from "lucide-react";
import NotificationComponent from "./notification";
import gsap from "gsap";


interface VisitorRequest {
  id: string;
  plateNumber: string;
  visitorName: string;
  destination: string;
  time: string;
  carImage: string;
  status?: "approved" | "denied";
}

// Stack Cards Component
interface StackCardsProps {
  items: VisitorRequest[];
  onApprove: (id: string) => void;
  onDeny: (id: string) => void;
}

const StackCards: React.FC<StackCardsProps> = ({ items, onApprove, onDeny }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  // Sort by id ascending (smallest id on top)
  const sortedPending = [...items].sort((a, b) => Number(a.id) - Number(b.id));

  const nextCard = () => {
    if (currentIndex < sortedPending.length - 1 && !isAnimating && cardRef.current) {
      setIsAnimating(true);

      // Animate current card out to the left
      gsap.to(cardRef.current, {
        x: -100,
        opacity: 0,
        duration: 0.3,
        ease: "power2.in",
        onComplete: () => {
          setCurrentIndex(currentIndex + 1);
          // Reset position and animate in from right
          gsap.set(cardRef.current, { x: 100, opacity: 0 });
          gsap.to(cardRef.current, {
            x: 0,
            opacity: 1,
            duration: 0.3,
            ease: "power2.out",
            onComplete: () => setIsAnimating(false)
          });
        }
      });
    }
  };

  const prevCard = () => {
    if (currentIndex > 0 && !isAnimating && cardRef.current) {
      setIsAnimating(true);

      // Animate current card out to the right
      gsap.to(cardRef.current, {
        x: 100,
        opacity: 0,
        duration: 0.3,
        ease: "power2.in",
        onComplete: () => {
          setCurrentIndex(currentIndex - 1);
          // Reset position and animate in from left
          gsap.set(cardRef.current, { x: -100, opacity: 0 });
          gsap.to(cardRef.current, {
            x: 0,
            opacity: 1,
            duration: 0.3,
            ease: "power2.out",
            onComplete: () => setIsAnimating(false)
          });
        }
      });
    }
  };

  // Initialize card position
  useLayoutEffect(() => {
    if (cardRef.current) {
      gsap.set(cardRef.current, { x: 0, opacity: 1 });
    }
  }, []);

  return (
    <div className="px-4 py-4 bg-white">
      {/* Header with request count and navigation */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <h3 className="text-lg font-semibold text-gray-800">คำขออนุมัติ</h3>
          <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
            {sortedPending.length} รายการ
          </span>
        </div>

        {sortedPending.length > 1 && (
          <div className="flex items-center gap-2">
            <Button
              onClick={prevCard}
              disabled={currentIndex === 0 || isAnimating}
              variant="outline"
              size="sm"
              className="h-8 w-8 p-0"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>

            <span className="text-sm text-gray-500 min-w-[3rem] text-center">
              {currentIndex + 1}/{sortedPending.length}
            </span>

            <Button
              onClick={nextCard}
              disabled={currentIndex === sortedPending.length - 1 || isAnimating}
              variant="outline"
              size="sm"
              className="h-8 w-8 p-0"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>

      {/* Card Container with GSAP Animation */}
      <div className="min-h-[400px] relative overflow-hidden">
        {sortedPending.length > 0 && (
          <div ref={cardRef}>
            <Card className="shadow-md max-w-sm mx-auto">
              <CardContent className="p-3">
                <div className="flex items-start gap-2 mb-2">
                  <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                    <Car className="w-4 h-4 text-gray-500" />
                  </div>
                  <div className="flex-1">
                    <div className="font-semibold text-base">
                      {sortedPending[currentIndex].plateNumber}
                    </div>
                    <div className="text-gray-600 text-xs">
                      {sortedPending[currentIndex].visitorName} • {sortedPending[currentIndex].destination}
                    </div>
                    <div className="text-gray-500 text-xs flex items-center gap-1 mt-1">
                      <Clock className="w-3 h-3" />
                      <span>{sortedPending[currentIndex].time}</span>
                    </div>
                  </div>
                </div>

                <div className="mb-3">
                  <div className="w-full h-32 bg-gray-200 rounded-lg flex items-center justify-center overflow-hidden">
                    {sortedPending[currentIndex].carImage ? (
                      <img
                        src={`/${sortedPending[currentIndex].carImage}`}
                        alt={`Car ${sortedPending[currentIndex].plateNumber}`}
                        className="object-cover w-full h-full"
                      />
                    ) : (
                      <Car className="w-12 h-12 text-gray-400" />
                    )}
                  </div>
                </div>

                <div className="flex justify-center gap-2">
                  <Button
                    onClick={() => onDeny(sortedPending[currentIndex].id)}
                    disabled={isAnimating}
                    className="bg-red-600 text-white border-red-600 
                      px-4 py-2 text-xs
                      rounded-lg flex-1 hover:bg-red-700 disabled:opacity-50"
                  >
                    ปฏิเสธ
                  </Button>
                  <Button
                    onClick={() => onApprove(sortedPending[currentIndex].id)}
                    disabled={isAnimating}
                    className="bg-green-600 text-white border-green-600 
                      px-4 py-2 text-xs
                      rounded-lg flex-1 hover:bg-green-700 disabled:opacity-50"
                  >
                    อนุมัติ
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};
const ResidentPage = () => {
  const [pendingRequests, setPendingRequests] = useState<VisitorRequest[]>([
    {
      id: "1",
      plateNumber: "กข 1234",
      visitorName: "ส่งของ",
      destination: "รปภ. สมชาย",
      time: "09:12",
      carImage: "car1.jpg",
    },
    {
      id: "2",
      plateNumber: "ขก 5678",
      visitorName: "เยี่ยม",
      destination: "รปภ. วิทยา",
      time: "09:45",
      carImage: "car2.jpg",
    },
    {
      id: "3",
      plateNumber: "ยน 9999",
      visitorName: "เยี่ยม",
      destination: "รปภ. วิทยา",
      time: "10:45",
      carImage: "",
    },
    {
      id: "4",
      plateNumber: "มน 7777",
      visitorName: "ติดตั้ง",
      destination: "รปภ. สมชาย",
      time: "11:30",
      carImage: "car1.jpg",
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
        console.log("Approved for :", request.plateNumber);
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
        console.log("Denied for :", request.plateNumber);
      }
    }
  };

  return (
    <div className="min-h-screen bg-muted flex items-center justify-center p-4">
      <div className="w-full max-w-[420px]">
        <div className="rounded-2xl bg-white shadow-lg border">
          {/* Header */}
          <div className="px-4 py-4 flex items-center justify-between">
            <h1 className="flex items-center text-2xl gap-2 font-semibold text-gray-800">
              <Home className="w-7 h-7" /> หมู่บ้านร่มรื่น
            </h1>
            <div className="relative">
              <NotificationComponent />
            </div>
          </div>

          <div className="px-4 py-3">
            <p className="text-md text-gray-600">สวัสดี คุณลูกบ้าน 👋</p>
          </div>

          {/* Stack Cards Section - ภายในการ์ดหลัก */}
          <StackCards
            items={pendingRequests}
            onApprove={handleApprove}
            onDeny={handleDeny}
          />

          {/* History Section - ภายในการ์ดหลัก */}
          <div className="px-4 py-4 bg-white">
            <div className="mt-6">
              <h2 className="text-lg font-semibold text-gray-800 mb-3">
                ประวัติล่าสุด
              </h2>
              {history.length === 0 ? (
                <p className="text-gray-500 text-center py-4">ยังไม่มีประวัติ</p>
              ) : (
                history.map((item) => (
                  <Card
                    key={item.id}
                    className={`mb-3 ${item.status === "approved"
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
                          className={`px-3 py-1 rounded-full text-sm font-medium ${item.status === "approved"
                            ? "bg-green-100 text-green-700"
                            : "bg-red-100 text-red-700"
                            }`}
                        >
                          {item.status === "approved" ? "Approved" : "Denied"}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </div>
        </div>
      </div>


    </div>
  );
};

export default ResidentPage;
