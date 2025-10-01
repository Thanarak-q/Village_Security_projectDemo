import { Elysia } from "elysia";
import {
  getAllVisitorRecords,
  getVisitorRecordsByVillage,
  getVisitorRecordsByResident,
  getVisitorRecordsByGuard,
  getVisitorRecordsByHouse,
  getVisitorRecordsByStatus,
  getVisitorRecordsByLineId,
  createVisitorRecord,
  updateVisitorRecordStatus,
  deleteVisitorRecord,
} from "../db/visitorRecordUtils";
import { requireLiffAuth } from "../hooks/requireLiffAuth";

/**
 * Interface for the create visitor record request body.
 * @interface
 */
interface CreateVisitorRecordBody {
  visitor_id?: string;
  resident_id?: string;
  guard_id: string;
  house_id: string;
  picture_key?: string;
  license_plate?: string;
  visit_purpose?: string;
}

/**
 * Interface for the update status request body.
 * @interface
 */
interface UpdateStatusBody {
  record_status: "pending" | "approved" | "rejected";
}

/**
 * Validates the visitor record data.
 * @param {CreateVisitorRecordBody} data - The data to validate.
 * @returns {string[]} An array of validation errors.
 */
const validateVisitorRecordData = (data: CreateVisitorRecordBody) => {
  const errors: string[] = [];

  // resident_id is now optional, so we don't validate it
  // if (!data.resident_id?.trim()) {
  //   errors.push("Resident ID is required");
  // }

  if (!data.guard_id?.trim()) {
    errors.push("Guard ID is required");
  }

  if (!data.house_id?.trim()) {
    errors.push("House ID is required");
  }

  return errors;
};

/**
 * Validates the status value.
 * @param {string} status - The status to validate.
 * @returns {boolean} True if the status is valid, false otherwise.
 */
const validateStatus = (
  status: string
): status is "pending" | "approved" | "rejected" => {
  return ["pending", "approved", "rejected"].includes(status);
};

/**
 * The visitor record routes.
 * @type {Elysia}
 */
export const visitorRecordRoutes = new Elysia({ prefix: "/api" })
  /**
   * Get all visitor records.
   * @returns {Promise<Object>} A promise that resolves to an object containing the visitor records.
   */
  .get("/visitor-records", async () => {
    try {
      const result = await getAllVisitorRecords();
      return {
        success: true,
        data: result,
        total: result.length,
      };
    } catch (error) {
      console.error("Error fetching visitor records:", error);
      return {
        success: false,
        error: "Failed to fetch visitor records",
      };
    }
  })

  /**
   * Get visitor records by village.
   * @param {Object} params - The parameters for the request.
   * @param {string} params.village_id - The village ID.
   * @returns {Promise<Object>} A promise that resolves to an object containing the visitor records.
   */
  .get("/visitor-records/village/:village_id", async ({ params }) => {
    try {
      const { village_id } = params;

      if (!village_id?.trim()) {
        return {
          success: false,
          error: "Village ID is required",
        };
      }

      const result = await getVisitorRecordsByVillage(village_id);
      return {
        success: true,
        data: result,
        total: result.length,
      };
    } catch (error) {
      console.error("Error fetching visitor records by village:", error);
      return {
        success: false,
        error: "Failed to fetch visitor records for village",
      };
    }
  })

  /**
   * Get visitor records by resident.
   * @param {Object} params - The parameters for the request.
   * @param {string} params.resident_id - The resident ID.
   * @returns {Promise<Object>} A promise that resolves to an object containing the visitor records.
   */
  .get("/visitor-records/resident/:resident_id", async ({ params }) => {
    try {
      const { resident_id } = params;

      if (!resident_id?.trim()) {
        return {
          success: false,
          error: "Resident ID is required",
        };
      }

      const result = await getVisitorRecordsByResident(resident_id);
      return {
        success: true,
        data: result,
        total: result.length,
      };
    } catch (error) {
      console.error("Error fetching visitor records by resident:", error);
      return {
        success: false,
        error: "Failed to fetch visitor records for resident",
      };
    }
  })

  /**
   * Get visitor records by guard.
   * @param {Object} params - The parameters for the request.
   * @param {string} params.guard_id - The guard ID.
   * @returns {Promise<Object>} A promise that resolves to an object containing the visitor records.
   */
  .get("/visitor-records/guard/:guard_id", async ({ params }) => {
    try {
      const { guard_id } = params;

      if (!guard_id?.trim()) {
        return {
          success: false,
          error: "Guard ID is required",
        };
      }

      const result = await getVisitorRecordsByGuard(guard_id);
      return {
        success: true,
        data: result,
        total: result.length,
      };
    } catch (error) {
      console.error("Error fetching visitor records by guard:", error);
      return {
        success: false,
        error: "Failed to fetch visitor records for guard",
      };
    }
  })

  /**
   * Get visitor records by house.
   * @param {Object} params - The parameters for the request.
   * @param {string} params.house_id - The house ID.
   * @returns {Promise<Object>} A promise that resolves to an object containing the visitor records.
   */
  .get("/visitor-records/house/:house_id", async ({ params }) => {
    try {
      const { house_id } = params;

      if (!house_id?.trim()) {
        return {
          success: false,
          error: "House ID is required",
        };
      }

      const result = await getVisitorRecordsByHouse(house_id);
      return {
        success: true,
        data: result,
        total: result.length,
      };
    } catch (error) {
      console.error("Error fetching visitor records by house:", error);
      return {
        success: false,
        error: "Failed to fetch visitor records for house",
      };
    }
  })

  /**
   * Get visitor records by status.
   * @param {Object} params - The parameters for the request.
   * @param {string} params.status - The status.
   * @returns {Promise<Object>} A promise that resolves to an object containing the visitor records.
   */
  .get("/visitor-records/status/:status", async ({ params }) => {
    try {
      const { status } = params;

      if (!status?.trim() || !validateStatus(status)) {
        return {
          success: false,
          error: "Valid status is required (pending, approved, rejected)",
        };
      }

      const result = await getVisitorRecordsByStatus(status);
      return {
        success: true,
        data: result,
        total: result.length,
      };
    } catch (error) {
      console.error("Error fetching visitor records by status:", error);
      return {
        success: false,
        error: "Failed to fetch visitor records by status",
      };
    }
  })

  /**
   * Create a visitor record.
   * @param {Object} body - The body of the request.
   * @returns {Promise<Object>} A promise that resolves to an object containing the new visitor record.
   */
  .post("/visitor-records", async ({ body }) => {
    try {
      const recordData = body as CreateVisitorRecordBody;

      // Validation
      const validationErrors = validateVisitorRecordData(recordData);
      if (validationErrors.length > 0) {
        return {
          success: false,
          error: validationErrors.join(", "),
        };
      }

      const result = await createVisitorRecord(recordData);
      return {
        success: true,
        message: "Visitor record created successfully!",
        data: result,
      };
    } catch (error) {
      console.error("Error creating visitor record:", error);
      return {
        success: false,
        error: "Failed to create visitor record. Please try again.",
      };
    }
  })

  /**
   * Update a visitor record's status.
   * @param {Object} params - The parameters for the request.
   * @param {string} params.record_id - The record ID.
   * @param {Object} body - The body of the request.
   * @returns {Promise<Object>} A promise that resolves to an object containing the updated visitor record.
   */
  .put("/visitor-records/:record_id/status", async ({ params, body }) => {
    try {
      const { record_id } = params;
      const { record_status } = body as UpdateStatusBody;

      if (!record_id?.trim()) {
        return {
          success: false,
          error: "Record ID is required",
        };
      }

      if (!record_status || !validateStatus(record_status)) {
        return {
          success: false,
          error: "Valid status is required (pending, approved, rejected)",
        };
      }

      const result = await updateVisitorRecordStatus(record_id, record_status);
      return {
        success: true,
        message: "Visitor record status updated successfully!",
        data: result,
      };
    } catch (error) {
      console.error("Error updating visitor record status:", error);
      return {
        success: false,
        error: "Failed to update visitor record status. Please try again.",
      };
    }
  })

  /**
   * Delete a visitor record.
   * @param {Object} params - The parameters for the request.
   * @param {string} params.record_id - The record ID.
   * @returns {Promise<Object>} A promise that resolves to an object containing a success message.
   */
  .delete("/visitor-records/:record_id", async ({ params }) => {
    try {
      const { record_id } = params;

      if (!record_id?.trim()) {
        return {
          success: false,
          error: "Record ID is required",
        };
      }

      await deleteVisitorRecord(record_id);
      return {
        success: true,
        message: "Visitor record deleted successfully!",
      };
    } catch (error) {
      console.error("Error deleting visitor record:", error);
      return {
        success: false,
        error: "Failed to delete visitor record. Please try again.",
      };
    }
  })

  /**
   * Get pending visitor requests for a specific resident.
   * @param {Object} params - The parameters for the request.
   * @param {string} params.resident_id - The resident ID.
   * @returns {Promise<Object>} A promise that resolves to pending visitor requests.
   */
  .get("/visitor-requests/pending/:resident_id", async ({ params }) => {
    try {
      const { resident_id } = params;

      if (!resident_id?.trim()) {
        return {
          success: false,
          error: "Resident ID is required",
        };
      }

      const result = await getVisitorRecordsByResident(resident_id);
      // Filter only pending requests
      const pendingRequests = result.filter(record => record.record_status === 'pending');
      
      return {
        success: true,
        data: pendingRequests,
        total: pendingRequests.length,
      };
    } catch (error) {
      console.error("Error fetching pending visitor requests:", error);
      return {
        success: false,
        error: "Failed to fetch pending visitor requests",
      };
    }
  })

  /**
   * Approve a visitor request.
   * @param {Object} params - The parameters for the request.
   * @param {string} params.record_id - The record ID.
   * @returns {Promise<Object>} A promise that resolves to the updated record.
   */
  .post("/visitor-requests/:record_id/approve", async ({ params }) => {
    try {
      const { record_id } = params;

      if (!record_id?.trim()) {
        return {
          success: false,
          error: "Record ID is required",
        };
      }

      const result = await updateVisitorRecordStatus(record_id, "approved");
      return {
        success: true,
        message: "Visitor request approved successfully!",
        data: result,
      };
    } catch (error) {
      console.error("Error approving visitor request:", error);
      return {
        success: false,
        error: "Failed to approve visitor request",
      };
    }
  })

  /**
   * Deny a visitor request.
   * @param {Object} params - The parameters for the request.
   * @param {string} params.record_id - The record ID.
   * @returns {Promise<Object>} A promise that resolves to the updated record.
   */
  .post("/visitor-requests/:record_id/deny", async ({ params }) => {
    try {
      const { record_id } = params;

      if (!record_id?.trim()) {
        return {
          success: false,
          error: "Record ID is required",
        };
      }

      const result = await updateVisitorRecordStatus(record_id, "rejected");
      return {
        success: true,
        message: "Visitor request denied successfully!",
        data: result,
      };
    } catch (error) {
      console.error("Error denying visitor request:", error);
      return {
        success: false,
        error: "Failed to deny visitor request",
      };
    }
  })

  /**
   * Get visitor request history for a specific resident.
   * @param {Object} params - The parameters for the request.
   * @param {string} params.resident_id - The resident ID.
   * @returns {Promise<Object>} A promise that resolves to visitor request history.
   */
  .get("/visitor-requests/history/:resident_id", async ({ params }) => {
    try {
      const { resident_id } = params;

      if (!resident_id?.trim()) {
        return {
          success: false,
          error: "Resident ID is required",
        };
      }

      const result = await getVisitorRecordsByResident(resident_id);
      // Filter only approved and rejected requests
      const history = result.filter(record => 
        record.record_status === 'approved' || record.record_status === 'rejected'
      );
      
      return {
        success: true,
        data: history,
        total: history.length,
      };
    } catch (error) {
      console.error("Error fetching visitor request history:", error);
      return {
        success: false,
        error: "Failed to fetch visitor request history",
      };
    }
  })

  /**
   * Get pending visitor requests by LINE ID.
   * @param {Object} params - The parameters for the request.
   * @param {string} params.line_user_id - The LINE user ID.
   * @returns {Promise<Object>} A promise that resolves to pending visitor requests.
   */
  .onBeforeHandle(requireLiffAuth(["resident"]))
  .get("/visitor-requests/pending/line/:line_user_id", async ({ params, currentUser }: any) => {
    try {
      const { line_user_id } = params;

      if (!line_user_id?.trim()) {
        return {
          success: false,
          error: "LINE user ID is required",
        };
      }

      // Verify that the authenticated resident is accessing their own data
      if (currentUser.line_user_id !== line_user_id) {
        return {
          success: false,
          error: "Access denied: You can only access your own visitor requests",
        };
      }

      const result = await getVisitorRecordsByLineId(line_user_id);
      // Filter only pending requests
      const pendingRequests = result.filter(record => record.record_status === 'pending');
      
      return {
        success: true,
        data: pendingRequests,
        total: pendingRequests.length,
      };
    } catch (error) {
      console.error("Error fetching pending visitor requests by LINE ID:", error);
      return {
        success: false,
        error: "Failed to fetch pending visitor requests",
      };
    }
  })

  /**
   * Get visitor request history by LINE ID.
   * @param {Object} params - The parameters for the request.
   * @param {string} params.line_user_id - The LINE user ID.
   * @returns {Promise<Object>} A promise that resolves to visitor request history.
   */
  .onBeforeHandle(requireLiffAuth(["resident"]))
  .get("/visitor-requests/history/line/:line_user_id", async ({ params, currentUser }: any) => {
    try {
      const { line_user_id } = params;

      if (!line_user_id?.trim()) {
        return {
          success: false,
          error: "LINE user ID is required",
        };
      }

      // Verify that the authenticated resident is accessing their own data
      if (currentUser.line_user_id !== line_user_id) {
        return {
          success: false,
          error: "Access denied: You can only access your own visitor history",
        };
      }

      console.log(`🔍 Fetching visitor records for LINE user ID: ${line_user_id}`);
      const result = await getVisitorRecordsByLineId(line_user_id);
      console.log(`📊 Total records found: ${result.length}`);
      console.log(`📋 Record statuses:`, result.map(r => r.record_status));
      
      // Filter only approved and rejected requests
      const history = result.filter(record => 
        record.record_status === 'approved' || record.record_status === 'rejected'
      );
      
      console.log(`✅ History records after filtering: ${history.length}`);
      
      return {
        success: true,
        data: history,
        total: history.length,
      };
    } catch (error) {
      console.error("Error fetching visitor request history by LINE ID:", error);
      return {
        success: false,
        error: "Failed to fetch visitor request history",
      };
    }
  }); 