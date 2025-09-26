"use client";

import { Card, CardContent } from "@/components/ui/card";
import { VisitorRequest } from "../types/visitor";

interface VisitorHistoryProps {
  history: VisitorRequest[];
}

export const VisitorHistory: React.FC<VisitorHistoryProps> = ({ history }) => {
  return (
    <div className="px-4 py-4">
      <h2 className="text-lg font-semibold text-foreground mb-4">ประวัติล่าสุด</h2>
      {history.length === 0 ? (
        <p className="text-muted-foreground text-center py-6">ยังไม่มีประวัติ</p>
      ) : (
        <div className="space-y-3 max-h-[300px] overflow-y-auto">
          {history.map((item) => (
            <Card
              key={item.id}
              className={`border ${
                item.status === "approved"
                  ? "bg-green-300 border-green-200 text-white dark:bg-green-950/20 dark:border-green-800"
                  : "bg-red-300 border-red-200 dark:bg-red-950/20 dark:border-red-800"
              }`}
            >
              <CardContent className="py-0">
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-foreground truncate dark:text-white">
                      {item.plateNumber}
                    </div>
                    <div className="text-sm text-black truncate dark:text-white">
                      {item.visitorName}
                    </div>
                    <div className="text-xs text-black truncate dark:text-white">
                      {item.destination} • {item.time}
                    </div>
                  </div>
                  <div
                    className={`px-2 py-1 rounded-full text-xs font-medium ml-2 flex-shrink-0 ${
                      item.status === "approved"
                        ? "bg-green-600 hover:bg-green-700 text-white dark:bg-green-900/30 dark:text-green-400"
                        : "bg-red-600 hover:bg-red-700 text-white dark:bg-red-900/30 dark:text-red-400"
                    }`}
                  >
                    {item.status === "approved" ? "อนุมัติแล้ว" : "ปฏิเสธ"}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
