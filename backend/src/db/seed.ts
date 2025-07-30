import db from "./drizzle";
import { villages, houses } from "./schema";

const villageData = [
  {
    village_name: "หมู่บ้านผาสุก",
    village_key: "pha-suk-village-001"
  },
  {
    village_name: "หมู่บ้านสุขสันต์",
    village_key: "suk-san-village-002"
  },
  {
    village_name: "หมู่บ้านร่มเย็น",
    village_key: "rom-yen-village-003"
  },
  {
    village_name: "หมู่บ้านสวนทอง",
    village_key: "suan-thong-village-004"
  },
  {
    village_name: "หมู่บ้านลุมพินี",
    village_key: "lumphini-village-005"
  },
  {
    village_name: "หมู่บ้านรัตนา",
    village_key: "rattana-village-006"
  },
  {
    village_name: "หมู่บ้านศรีสุข",
    village_key: "sri-suk-village-007"
  },
  {
    village_name: "หมู่บ้านธนารมย์",
    village_key: "thanarom-village-008"
  },
  {
    village_name: "หมู่บ้านสวนสวรรค์",
    village_key: "suan-sawan-village-009"
  },
  {
    village_name: "หมู่บ้านสุขุมวิท",
    village_key: "sukhumvit-village-010"
  },
  {
    village_name: "หมู่บ้านรัชดา",
    village_key: "ratchada-village-011"
  },
  {
    village_name: "หมู่บ้านลาดพร้าว",
    village_key: "ladprao-village-012"
  },
  {
    village_name: "หมู่บ้านบางนา",
    village_key: "bangna-village-013"
  },
  {
    village_name: "หมู่บ้านอโศก",
    village_key: "asoke-village-014"
  },
  {
    village_name: "หมู่บ้านทองหล่อ",
    village_key: "thonglor-village-015"
  }
];

const houseData = [
  // หมู่บ้านผาสุก
  {
    address: "123/45 หมู่บ้านผาสุก ซอย 1 ถนนสุขุมวิท แขวงคลองเตย เขตคลองเตย กรุงเทพฯ 10110",
    village_key: "pha-suk-village-001"
  },
  {
    address: "67/89 หมู่บ้านผาสุก ซอย 2 ถนนสุขุมวิท แขวงคลองเตย เขตคลองเตย กรุงเทพฯ 10110",
    village_key: "pha-suk-village-001"
  },
  {
    address: "12/34 หมู่บ้านผาสุก ซอย 3 ถนนสุขุมวิท แขวงคลองเตย เขตคลองเตย กรุงเทพฯ 10110",
    village_key: "pha-suk-village-001"
  },

  // หมู่บ้านสุขสันต์
  {
    address: "456/78 หมู่บ้านสุขสันต์ ซอยสุขสันต์ 1 ถนนลาดพร้าว แขวงจอมพล เขตจตุจักร กรุงเทพฯ 10900",
    village_key: "suk-san-village-002"
  },
  {
    address: "90/12 หมู่บ้านสุขสันต์ ซอยสุขสันต์ 2 ถนนลาดพร้าว แขวงจอมพล เขตจตุจักร กรุงเทพฯ 10900",
    village_key: "suk-san-village-002"
  },

  // หมู่บ้านร่มเย็น
  {
    address: "789/01 หมู่บ้านร่มเย็น ซอยร่มเย็น 1 ถนนรัชดาภิเษก แขวงดินแดง เขตดินแดง กรุงเทพฯ 10400",
    village_key: "rom-yen-village-003"
  },
  {
    address: "23/45 หมู่บ้านร่มเย็น ซอยร่มเย็น 2 ถนนรัชดาภิเษก แขวงดินแดง เขตดินแดง กรุงเทพฯ 10400",
    village_key: "rom-yen-village-003"
  },
  {
    address: "67/89 หมู่บ้านร่มเย็น ซอยร่มเย็น 3 ถนนรัชดาภิเษก แขวงดินแดง เขตดินแดง กรุงเทพฯ 10400",
    village_key: "rom-yen-village-003"
  },

  // หมู่บ้านสวนทอง
  {
    address: "234/56 หมู่บ้านสวนทอง ซอยสวนทอง 1 ถนนบางนา-ตราด แขวงบางนาใต้ เขตบางนา กรุงเทพฯ 10260",
    village_key: "suan-thong-village-004"
  },
  {
    address: "78/90 หมู่บ้านสวนทอง ซอยสวนทอง 2 ถนนบางนา-ตราด แขวงบางนาใต้ เขตบางนา กรุงเทพฯ 10260",
    village_key: "suan-thong-village-004"
  },

  // หมู่บ้านลุมพินี
  {
    address: "345/67 หมู่บ้านลุมพินี ซอยลุมพินี 1 ถนนวิทยุ แขวงลุมพินี เขตปทุมวัน กรุงเทพฯ 10330",
    village_key: "lumphini-village-005"
  },
  {
    address: "89/01 หมู่บ้านลุมพินี ซอยลุมพินี 2 ถนนวิทยุ แขวงลุมพินี เขตปทุมวัน กรุงเทพฯ 10330",
    village_key: "lumphini-village-005"
  },
  {
    address: "12/34 หมู่บ้านลุมพินี ซอยลุมพินี 3 ถนนวิทยุ แขวงลุมพินี เขตปทุมวัน กรุงเทพฯ 10330",
    village_key: "lumphini-village-005"
  },

  // หมู่บ้านรัตนา
  {
    address: "456/78 หมู่บ้านรัตนา ซอยรัตนา 1 ถนนพระราม 9 แขวงห้วยขวาง เขตห้วยขวาง กรุงเทพฯ 10310",
    village_key: "rattana-village-006"
  },
  {
    address: "90/12 หมู่บ้านรัตนา ซอยรัตนา 2 ถนนพระราม 9 แขวงห้วยขวาง เขตห้วยขวาง กรุงเทพฯ 10310",
    village_key: "rattana-village-006"
  },

  // หมู่บ้านศรีสุข
  {
    address: "567/89 หมู่บ้านศรีสุข ซอยศรีสุข 1 ถนนศรีนครินทร์ แขวงสวนหลวง เขตสวนหลวง กรุงเทพฯ 10250",
    village_key: "sri-suk-village-007"
  },
  {
    address: "01/23 หมู่บ้านศรีสุข ซอยศรีสุข 2 ถนนศรีนครินทร์ แขวงสวนหลวง เขตสวนหลวง กรุงเทพฯ 10250",
    village_key: "sri-suk-village-007"
  },
  {
    address: "45/67 หมู่บ้านศรีสุข ซอยศรีสุข 3 ถนนศรีนครินทร์ แขวงสวนหลวง เขตสวนหลวง กรุงเทพฯ 10250",
    village_key: "sri-suk-village-007"
  },

  // หมู่บ้านธนารมย์
  {
    address: "678/90 หมู่บ้านธนารมย์ ซอยธนารมย์ 1 ถนนอโศก-ดินแดง แขวงคลองเตย เขตคลองเตย กรุงเทพฯ 10110",
    village_key: "thanarom-village-008"
  },
  {
    address: "12/34 หมู่บ้านธนารมย์ ซอยธนารมย์ 2 ถนนอโศก-ดินแดง แขวงคลองเตย เขตคลองเตย กรุงเทพฯ 10110",
    village_key: "thanarom-village-008"
  },

  // หมู่บ้านสวนสวรรค์
  {
    address: "789/01 หมู่บ้านสวนสวรรค์ ซอยสวนสวรรค์ 1 ถนนสุขุมวิท แขวงคลองเตย เขตคลองเตย กรุงเทพฯ 10110",
    village_key: "suan-sawan-village-009"
  },
  {
    address: "23/45 หมู่บ้านสวนสวรรค์ ซอยสวนสวรรค์ 2 ถนนสุขุมวิท แขวงคลองเตย เขตคลองเตย กรุงเทพฯ 10110",
    village_key: "suan-sawan-village-009"
  },
  {
    address: "67/89 หมู่บ้านสวนสวรรค์ ซอยสวนสวรรค์ 3 ถนนสุขุมวิท แขวงคลองเตย เขตคลองเตย กรุงเทพฯ 10110",
    village_key: "suan-sawan-village-009"
  },

  // หมู่บ้านสุขุมวิท
  {
    address: "890/12 หมู่บ้านสุขุมวิท ซอยสุขุมวิท 1 ถนนสุขุมวิท แขวงคลองเตย เขตคลองเตย กรุงเทพฯ 10110",
    village_key: "sukhumvit-village-010"
  },
  {
    address: "34/56 หมู่บ้านสุขุมวิท ซอยสุขุมวิท 2 ถนนสุขุมวิท แขวงคลองเตย เขตคลองเตย กรุงเทพฯ 10110",
    village_key: "sukhumvit-village-010"
  },

  // หมู่บ้านรัชดา
  {
    address: "901/23 หมู่บ้านรัชดา ซอยรัชดา 1 ถนนรัชดาภิเษก แขวงดินแดง เขตดินแดง กรุงเทพฯ 10400",
    village_key: "ratchada-village-011"
  },
  {
    address: "45/67 หมู่บ้านรัชดา ซอยรัชดา 2 ถนนรัชดาภิเษก แขวงดินแดง เขตดินแดง กรุงเทพฯ 10400",
    village_key: "ratchada-village-011"
  },
  {
    address: "89/01 หมู่บ้านรัชดา ซอยรัชดา 3 ถนนรัชดาภิเษก แขวงดินแดง เขตดินแดง กรุงเทพฯ 10400",
    village_key: "ratchada-village-011"
  },

  // หมู่บ้านลาดพร้าว
  {
    address: "012/34 หมู่บ้านลาดพร้าว ซอยลาดพร้าว 1 ถนนลาดพร้าว แขวงจอมพล เขตจตุจักร กรุงเทพฯ 10900",
    village_key: "ladprao-village-012"
  },
  {
    address: "56/78 หมู่บ้านลาดพร้าว ซอยลาดพร้าว 2 ถนนลาดพร้าว แขวงจอมพล เขตจตุจักร กรุงเทพฯ 10900",
    village_key: "ladprao-village-012"
  },

  // หมู่บ้านบางนา
  {
    address: "123/45 หมู่บ้านบางนา ซอยบางนา 1 ถนนบางนา-ตราด แขวงบางนาใต้ เขตบางนา กรุงเทพฯ 10260",
    village_key: "bangna-village-013"
  },
  {
    address: "67/89 หมู่บ้านบางนา ซอยบางนา 2 ถนนบางนา-ตราด แขวงบางนาใต้ เขตบางนา กรุงเทพฯ 10260",
    village_key: "bangna-village-013"
  },
  {
    address: "01/23 หมู่บ้านบางนา ซอยบางนา 3 ถนนบางนา-ตราด แขวงบางนาใต้ เขตบางนา กรุงเทพฯ 10260",
    village_key: "bangna-village-013"
  },

  // หมู่บ้านอโศก
  {
    address: "234/56 หมู่บ้านอโศก ซอยอโศก 1 ถนนสุขุมวิท แขวงคลองเตย เขตคลองเตย กรุงเทพฯ 10110",
    village_key: "asoke-village-014"
  },
  {
    address: "78/90 หมู่บ้านอโศก ซอยอโศก 2 ถนนสุขุมวิท แขวงคลองเตย เขตคลองเตย กรุงเทพฯ 10110",
    village_key: "asoke-village-014"
  },

  // หมู่บ้านทองหล่อ
  {
    address: "345/67 หมู่บ้านทองหล่อ ซอยทองหล่อ 1 ถนนสุขุมวิท แขวงคลองเตย เขตคลองเตย กรุงเทพฯ 10110",
    village_key: "thonglor-village-015"
  },
  {
    address: "89/01 หมู่บ้านทองหล่อ ซอยทองหล่อ 2 ถนนสุขุมวิท แขวงคลองเตย เขตคลองเตย กรุงเทพฯ 10110",
    village_key: "thonglor-village-015"
  },
  {
    address: "12/34 หมู่บ้านทองหล่อ ซอยทองหล่อ 3 ถนนสุขุมวิท แขวงคลองเตย เขตคลองเตย กรุงเทพฯ 10110",
    village_key: "thonglor-village-015"
  }
];

export async function clearDb() {
  // Check if villages or houses exist before deleting
  const existingVillages = await db.select().from(villages).limit(1);
  if (existingVillages.length > 0) {
    await db.delete(villages);
  }
  const existingHouses = await db.select().from(houses).limit(1);
  if (existingHouses.length > 0) {
    await db.delete(houses);
  }
}

async function seed() {
  await clearDb();
  await db.insert(villages).values(villageData);
  await db.insert(houses).values(houseData);
}

// Run the seeding
seed().catch(console.error);
