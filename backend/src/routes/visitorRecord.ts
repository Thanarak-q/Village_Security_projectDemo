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

export const visitorRecordRoutes = new Elysia({ prefix: "/api" })
  // Get all visitor records
  .get("/visitor-records", async () => {
    try {
      const result = await getAllVisitorRecords();
      return { success: true, data: result };
    } catch (error) {
      console.error("Error fetching visitor records:", error);
      return { success: false, error: "Failed to fetch visitor records" };
    }
  })
  
  // Get visitor records by village
  .get("/visitor-records/village/:village_key", async ({ params }) => {
    try {
      const { village_key } = params;
      
      if (!village_key || village_key.trim().length === 0) {
        return { 
          success: false, 
          error: "Village key is required" 
        };
      }
      
      const result = await getVisitorRecordsByVillage(village_key);
      return { success: true, data: result };
    } catch (error) {
      console.error("Error fetching visitor records by village:", error);
      return { success: false, error: "Failed to fetch visitor records for village" };
    }
  })
  
  // Get visitor records by resident
  .get("/visitor-records/resident/:resident_id", async ({ params }) => {
    try {
      const { resident_id } = params;
      
      if (!resident_id || resident_id.trim().length === 0) {
        return { 
          success: false, 
          error: "Resident ID is required" 
        };
      }
      
      const result = await getVisitorRecordsByResident(resident_id);
      return { success: true, data: result };
    } catch (error) {
      console.error("Error fetching visitor records by resident:", error);
      return { success: false, error: "Failed to fetch visitor records for resident" };
    }
  })
  
  // Get visitor records by guard
  .get("/visitor-records/guard/:guard_id", async ({ params }) => {
    try {
      const { guard_id } = params;
      
      if (!guard_id || guard_id.trim().length === 0) {
        return { 
          success: false, 
          error: "Guard ID is required" 
        };
      }
      
      const result = await getVisitorRecordsByGuard(guard_id);
      return { success: true, data: result };
    } catch (error) {
      console.error("Error fetching visitor records by guard:", error);
      return { success: false, error: "Failed to fetch visitor records for guard" };
    }
  })
  
  // Get visitor records by house
  .get("/visitor-records/house/:house_id", async ({ params }) => {
    try {
      const { house_id } = params;
      
      if (!house_id || house_id.trim().length === 0) {
        return { 
          success: false, 
          error: "House ID is required" 
        };
      }
      
      const result = await getVisitorRecordsByHouse(house_id);
      return { success: true, data: result };
    } catch (error) {
      console.error("Error fetching visitor records by house:", error);
      return { success: false, error: "Failed to fetch visitor records for house" };
    }
  })
  
  // Get visitor records by status
  .get("/visitor-records/status/:status", async ({ params }) => {
    try {
      const { status } = params;
      
      if (!status || !["approved", "pending", "rejected"].includes(status)) {
        return { 
          success: false, 
          error: "Valid status is required (approved, pending, or rejected)" 
        };
      }
      
      const result = await getVisitorRecordsByStatus(status as "approved" | "pending" | "rejected");
      return { success: true, data: result };
    } catch (error) {
      console.error("Error fetching visitor records by status:", error);
      return { success: false, error: "Failed to fetch visitor records by status" };
    }
  })
  
  // Get single visitor record by ID
  .get("/visitor-records/:visitor_record_id", async ({ params }) => {
    try {
      const { visitor_record_id } = params;
      
      if (!visitor_record_id || visitor_record_id.trim().length === 0) {
        return { 
          success: false, 
          error: "Visitor record ID is required" 
        };
      }
      
      const result = await getAllVisitorRecords();
      const record = result.find(r => r.visitor_record_id === visitor_record_id);
      
      if (!record) {
        return { success: false, error: "Visitor record not found" };
      }
      
      return { success: true, data: record };
    } catch (error) {
      console.error("Error fetching visitor record:", error);
      return { success: false, error: "Failed to fetch visitor record" };
    }
  })
  
  // Create new visitor record
  .post("/visitor-records", async ({ body }) => {
    try {
      const { resident_id, guard_id, house_id, picture_key, license_plate, record_status, visit_purpose } = body as {
        resident_id: string;
        guard_id: string;
        house_id: string;
        picture_key?: string;
        license_plate?: string;
        record_status?: "approved" | "pending" | "rejected";
        visit_purpose?: string;
      };

      // Validation
      if (!resident_id || !guard_id || !house_id) {
        return { 
          success: false, 
          error: "Missing required fields! resident_id, guard_id, and house_id are required." 
        };
      }

      if (resident_id.trim().length === 0) {
        return { 
          success: false, 
          error: "Resident ID cannot be empty!" 
        };
      }

      if (guard_id.trim().length === 0) {
        return { 
          success: false, 
          error: "Guard ID cannot be empty!" 
        };
      }

      if (house_id.trim().length === 0) {
        return { 
          success: false, 
          error: "House ID cannot be empty!" 
        };
      }

      // Create new visitor record
      const newVisitorRecord = await createVisitorRecord({
        resident_id: resident_id.trim(),
        guard_id: guard_id.trim(),
        house_id: house_id.trim(),
        picture_key,
        license_plate,
        record_status,
        visit_purpose
      });

      return { 
        success: true, 
        message: "Visitor record created successfully!", 
        data: newVisitorRecord 
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
  .patch("/visitor-records/:visitor_record_id/status", async ({ params, body }) => {
    try {
      const { visitor_record_id } = params;
      const { status } = body as { status: "approved" | "pending" | "rejected" };

      if (!visitor_record_id || visitor_record_id.trim().length === 0) {
        return { 
          success: false, 
          error: "Visitor record ID is required" 
        };
      }

      if (!status || !["approved", "pending", "rejected"].includes(status)) {
        return { 
          success: false, 
          error: "Valid status is required (approved, pending, or rejected)" 
        };
      }

      // Update visitor record status
      const updatedVisitorRecord = await updateVisitorRecordStatus(visitor_record_id, status);

      return { 
        success: true, 
        message: "Visitor record status updated successfully!",
        data: updatedVisitorRecord
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
  .delete("/visitor-records/:visitor_record_id", async ({ params }) => {
    try {
      const { visitor_record_id } = params;

      if (!visitor_record_id || visitor_record_id.trim().length === 0) {
        return { 
          success: false, 
          error: "Visitor record ID is required" 
        };
      }

      // Delete visitor record
      const deletedVisitorRecord = await deleteVisitorRecord(visitor_record_id);

      return { 
        success: true, 
        message: "Visitor record deleted successfully!",
        data: deletedVisitorRecord
      };
    } catch (error) {
      console.error("Error deleting visitor record:", error);
      return { 
        success: false, 
        error: "Failed to delete visitor record. Please try again." 
      };
    }
  }); 