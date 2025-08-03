import { Elysia } from "elysia";
import { 
  getAllVisitorRecords,
  getVisitorRecordsByVillage,
  getVisitorRecordsByResident,
  getVisitorRecordsByGuard,
  getVisitorRecordsByHouse,
  getVisitorRecordsByStatus,
  createVisitorRecord,
  updateVisitorRecordStatus,
  deleteVisitorRecord
} from "../db/visitorRecordUtils";

// Types
interface CreateVisitorRecordBody {
  visitor_name: string;
  visitor_phone: string;
  visitor_purpose: string;
  resident_id: string;
  house_id: string;
  village_key: string;
}

interface UpdateStatusBody {
  record_status: "pending" | "approved" | "rejected";
}

// Validation functions
const validateVisitorRecordData = (data: CreateVisitorRecordBody) => {
  const errors: string[] = [];
  
  if (!data.visitor_name?.trim()) {
    errors.push("Visitor name is required");
  }
  
  if (!data.visitor_phone?.trim()) {
    errors.push("Visitor phone is required");
  }
  
  if (!data.visitor_purpose?.trim()) {
    errors.push("Visitor purpose is required");
  }
  
  if (!data.resident_id?.trim()) {
    errors.push("Resident ID is required");
  }
  
  if (!data.house_id?.trim()) {
    errors.push("House ID is required");
  }
  
  if (!data.village_key?.trim()) {
    errors.push("Village key is required");
  }
  
  return errors;
};

const validateStatus = (status: string): status is "pending" | "approved" | "rejected" => {
  return ["pending", "approved", "rejected"].includes(status);
};

export const visitorRecordRoutes = new Elysia({ prefix: "/api" })
  // Get all visitor records
  .get("/visitor-records", async () => {
    try {
      const result = await getAllVisitorRecords();
      return { 
        success: true, 
        data: result,
        total: result.length
      };
    } catch (error) {
      console.error("Error fetching visitor records:", error);
      return { 
        success: false, 
        error: "Failed to fetch visitor records" 
      };
    }
  })
  
  // Get visitor records by village
  .get("/visitor-records/village/:village_key", async ({ params }) => {
    try {
      const { village_key } = params;
      
      if (!village_key?.trim()) {
        return { 
          success: false, 
          error: "Village key is required" 
        };
      }
      
      const result = await getVisitorRecordsByVillage(village_key);
      return { 
        success: true, 
        data: result,
        total: result.length
      };
    } catch (error) {
      console.error("Error fetching visitor records by village:", error);
      return { 
        success: false, 
        error: "Failed to fetch visitor records for village" 
      };
    }
  })
  
  // Get visitor records by resident
  .get("/visitor-records/resident/:resident_id", async ({ params }) => {
    try {
      const { resident_id } = params;
      
      if (!resident_id?.trim()) {
        return { 
          success: false, 
          error: "Resident ID is required" 
        };
      }
      
      const result = await getVisitorRecordsByResident(resident_id);
      return { 
        success: true, 
        data: result,
        total: result.length
      };
    } catch (error) {
      console.error("Error fetching visitor records by resident:", error);
      return { 
        success: false, 
        error: "Failed to fetch visitor records for resident" 
      };
    }
  })
  
  // Get visitor records by guard
  .get("/visitor-records/guard/:guard_id", async ({ params }) => {
    try {
      const { guard_id } = params;
      
      if (!guard_id?.trim()) {
        return { 
          success: false, 
          error: "Guard ID is required" 
        };
      }
      
      const result = await getVisitorRecordsByGuard(guard_id);
      return { 
        success: true, 
        data: result,
        total: result.length
      };
    } catch (error) {
      console.error("Error fetching visitor records by guard:", error);
      return { 
        success: false, 
        error: "Failed to fetch visitor records for guard" 
      };
    }
  })
  
  // Get visitor records by house
  .get("/visitor-records/house/:house_id", async ({ params }) => {
    try {
      const { house_id } = params;
      
      if (!house_id?.trim()) {
        return { 
          success: false, 
          error: "House ID is required" 
        };
      }
      
      const result = await getVisitorRecordsByHouse(house_id);
      return { 
        success: true, 
        data: result,
        total: result.length
      };
    } catch (error) {
      console.error("Error fetching visitor records by house:", error);
      return { 
        success: false, 
        error: "Failed to fetch visitor records for house" 
      };
    }
  })
  
  // Get visitor records by status
  .get("/visitor-records/status/:status", async ({ params }) => {
    try {
      const { status } = params;
      
      if (!status?.trim() || !validateStatus(status)) {
        return { 
          success: false, 
          error: "Valid status is required (pending, approved, rejected)" 
        };
      }
      
      const result = await getVisitorRecordsByStatus(status);
      return { 
        success: true, 
        data: result,
        total: result.length
      };
    } catch (error) {
      console.error("Error fetching visitor records by status:", error);
      return { 
        success: false, 
        error: "Failed to fetch visitor records by status" 
      };
    }
  })
  
  // Create visitor record
  .post("/visitor-records", async ({ body }) => {
    try {
      const recordData = body as CreateVisitorRecordBody;
      
      // Validation
      const validationErrors = validateVisitorRecordData(recordData);
      if (validationErrors.length > 0) {
        return { 
          success: false, 
          error: validationErrors.join(", ") 
        };
      }
      
      const result = await createVisitorRecord(recordData);
      return { 
        success: true, 
        message: "Visitor record created successfully!", 
        data: result 
      };
    } catch (error) {
      console.error("Error creating visitor record:", error);
      return { 
        success: false, 
        error: "Failed to create visitor record. Please try again." 
      };
    }
  })
  
  // Update visitor record status
  .put("/visitor-records/:record_id/status", async ({ params, body }) => {
    try {
      const { record_id } = params;
      const { record_status } = body as UpdateStatusBody;
      
      if (!record_id?.trim()) {
        return { 
          success: false, 
          error: "Record ID is required" 
        };
      }
      
      if (!record_status || !validateStatus(record_status)) {
        return { 
          success: false, 
          error: "Valid status is required (pending, approved, rejected)" 
        };
      }
      
      const result = await updateVisitorRecordStatus(record_id, record_status);
      return { 
        success: true, 
        message: "Visitor record status updated successfully!", 
        data: result 
      };
    } catch (error) {
      console.error("Error updating visitor record status:", error);
      return { 
        success: false, 
        error: "Failed to update visitor record status. Please try again." 
      };
    }
  })
  
  // Delete visitor record
  .delete("/visitor-records/:record_id", async ({ params }) => {
    try {
      const { record_id } = params;
      
      if (!record_id?.trim()) {
        return { 
          success: false, 
          error: "Record ID is required" 
        };
      }
      
      await deleteVisitorRecord(record_id);
      return { 
        success: true, 
        message: "Visitor record deleted successfully!" 
      };
    } catch (error) {
      console.error("Error deleting visitor record:", error);
      return { 
        success: false, 
        error: "Failed to delete visitor record. Please try again." 
      };
    }
  }); 