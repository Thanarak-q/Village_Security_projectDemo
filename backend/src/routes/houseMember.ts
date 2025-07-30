import { Elysia } from "elysia";
import db from "../db/drizzle";
import { house_members, houses, residents } from "../db/schema";
import { eq } from "drizzle-orm";
import { 
  getAllHouseMembers, 
  getHouseMembersByVillage, 
  getHouseMembersByHouse, 
  getHouseMembersByResident,
  createHouseMember,
  deleteHouseMember
} from "../db/houseMemberUtils";

export const houseMemberRoutes = new Elysia({ prefix: "/api" })
