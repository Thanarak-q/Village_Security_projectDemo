import db from "./drizzle";
import { villages, houses, residents, guards, admins, house_members, visitor_records } from "./schema";
import { eq, sql } from "drizzle-orm";

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

const residentData = [
  // หมู่บ้านผาสุก
  {
    email: "somchai.pha@email.com",
    fname: "สมชาย",
    lname: "ผาสุก",
    username: "somchai_pha",
    password_hash: "password123",
    phone: "0812345678",
    village_key: "pha-suk-village-001",
    status: "verified"
  },
  {
    email: "somying.pha@email.com",
    fname: "สมหญิง",
    lname: "ผาสุก",
    username: "somying_pha",
    password_hash: "password123",
    phone: "0812345678",
    village_key: "pha-suk-village-001",
    status: "verified"
  },
  // หมู่บ้านรัตนา
  {
    email: "arisa.rat@email.com",
    fname: "อริสา",
    lname: "รัตนา",
    username: "arisa_rat",
    password_hash: "password123",
    phone: "0823456789",
    village_key: "rattana-village-006",
    status: "verified"
  },
  {
    email: "kittipong.rat@email.com",
    fname: "กิตติพงษ์",
    lname: "รัตนา",
    username: "kittipong_rat",
    password_hash: "password123",
    phone: "0834567890",
    village_key: "rattana-village-006",
    status: "verified"
  },

  // หมู่บ้านศรีสุข
  {
    email: "nattapong.sri@email.com",
    fname: "ณัฐพงศ์",
    lname: "ศรีสุข",
    username: "nattapong_sri",
    password_hash: "password123",
    phone: "0845678901",
    village_key: "sri-suk-village-007",
    status: "verified"
  },
  {
    email: "pimchanok.sri@email.com",
    fname: "พิมพ์ชนก",
    lname: "ศรีสุข",
    username: "pimchanok_sri",
    password_hash: "password123",
    phone: "0856789012",
    village_key: "sri-suk-village-007",
    status: "verified"
  },

  // หมู่บ้านธนารมย์
  {
    email: "surasak.thana@email.com",
    fname: "สุรศักดิ์",
    lname: "ธนารมย์",
    username: "surasak_thana",
    password_hash: "password123",
    phone: "0867890123",
    village_key: "thanarom-village-008",
    status: "verified"
  },
  {
    email: "kanokwan.thana@email.com",
    fname: "กนกวรรณ",
    lname: "ธนารมย์",
    username: "kanokwan_thana",
    password_hash: "password123",
    phone: "0878901234",
    village_key: "thanarom-village-008",
    status: "verified"
  },

  // หมู่บ้านสวนสวรรค์
  {
    email: "jirawat.suan@email.com",
    fname: "จิรวัฒน์",
    lname: "สวนสวรรค์",
    username: "jirawat_suan",
    password_hash: "password123",
    phone: "0889012345",
    village_key: "suan-sawan-village-009",
    status: "verified"
  },
  {
    email: "supaporn.suan@email.com",
    fname: "สุภาภรณ์",
    lname: "สวนสวรรค์",
    username: "supaporn_suan",
    password_hash: "password123",
    phone: "0890123456",
    village_key: "suan-sawan-village-009",
    status: "verified"
  },

  // หมู่บ้านสุขุมวิท
  {
    email: "anucha.suk@email.com",
    fname: "อนุชา",
    lname: "สุขุมวิท",
    username: "anucha_suk",
    password_hash: "password123",
    phone: "0801234567",
    village_key: "sukhumvit-village-010",
    status: "verified"
  },
  {
    email: "benjawan.suk@email.com",
    fname: "เบญจวรรณ",
    lname: "สุขุมวิท",
    username: "benjawan_suk",
    password_hash: "password123",
    phone: "0812345679",
    village_key: "sukhumvit-village-010",
    status: "verified"
  },

  // หมู่บ้านรัชดา
  {
    email: "prasert.ratc@email.com",
    fname: "ประเสริฐ",
    lname: "รัชดา",
    username: "prasert_ratc",
    password_hash: "password123",
    phone: "0823456790",
    village_key: "ratchada-village-011",
    status: "verified"
  },
  {
    email: "sirilak.ratc@email.com",
    fname: "ศิริลักษณ์",
    lname: "รัชดา",
    username: "sirilak_ratc",
    password_hash: "password123",
    phone: "0834567901",
    village_key: "ratchada-village-011",
    status: "verified"
  },

  // หมู่บ้านลาดพร้าว
  {
    email: "pongsak.lad@email.com",
    fname: "พงศักดิ์",
    lname: "ลาดพร้าว",
    username: "pongsak_lad",
    password_hash: "password123",
    phone: "0845679012",
    village_key: "ladprao-village-012",
    status: "verified"
  },

  // หมู่บ้านบางนา
  {
    email: "nattaya.bang@email.com",
    fname: "ณัฐยา",
    lname: "บางนา",
    username: "nattaya_bang",
    password_hash: "password123",
    phone: "0856790123",
    village_key: "bangna-village-013",
    status: "verified"
  },

  // หมู่บ้านทองหล่อ
  {
    email: "wirote.thong@email.com",
    fname: "วิโรจน์",
    lname: "ทองหล่อ",
    username: "wirote_thong",
    password_hash: "password123",
    phone: "0867901234",
    village_key: "thonglor-village-015",
    status: "verified"
  }
];

const guardData = [
  // หมู่บ้านผาสุก
  {
    email: "prasit.pha@email.com",
    fname: "ประสิทธิ์",
    lname: "ผาสุก",
    username: "prasit_pha",
    password_hash: "password123",
    phone: "0891234567",
    village_key: "pha-suk-village-001",
    status: "verified"
  },
  // หมู่บ้านรัตนา
  {
    email: "kanokwan.rat@email.com",
    fname: "กนกวรรณ",
    lname: "รัตนา",
    username: "kanokwan_rat",
    password_hash: "password123",
    phone: "0892345678",
    village_key: "rattana-village-006",
    status: "verified"
  },
  // หมู่บ้านทองหล่อ
  {
    email: "santi.thong@email.com",
    fname: "สันติ",
    lname: "ทองหล่อ",
    username: "santi_thong",
    password_hash: "password123",
    phone: "0893456789",
    village_key: "thonglor-village-015",
    status: "verified"
  }

];

const adminData = [
  // หมู่บ้านผาสุก
  {
    email: "admin.pha@email.com",
    username: "admin_pha",
    password_hash: "password123",
    phone: "0891234567",
    village_key: "pha-suk-village-001",
    status: "verified"
  },
  // หมู่บ้านสุขสันต์
  {
    email: "admin.suk@email.com",
    username: "admin_suk",
    password_hash: "password123",
    phone: "0891234568",
    village_key: "suk-san-village-002",
    status: "verified"
  },
  // หมู่บ้านร่มเย็น
  {
    email: "admin.rom@email.com",
    username: "admin_rom",
    password_hash: "password123",
    phone: "0891234569",
    village_key: "rom-yen-village-003",
    status: "verified"
  },
  // หมู่บ้านสวนทอง
  {
    email: "admin.suan@email.com",
    username: "admin_suan",
    password_hash: "password123",
    phone: "0891234570",
    village_key: "suan-thong-village-004",
    status: "verified"
  },
  // หมู่บ้านลุมพินี
  {
    email: "admin.lum@email.com",
    username: "admin_lum",
    password_hash: "password123",
    phone: "0891234571",
    village_key: "lumphini-village-005",
    status: "verified"
  },
  // หมู่บ้านรัตนา
  {
    email: "admin.rat@email.com",
    username: "admin_rat",
    password_hash: "password123",
    phone: "0891234572",
    village_key: "rattana-village-006",
    status: "verified"
  },
  // หมู่บ้านศรีสุข
  {
    email: "admin.sri@email.com",
    username: "admin_sri",
    password_hash: "password123",
    phone: "0891234573",
    village_key: "sri-suk-village-007",
    status: "verified"
  },
  // หมู่บ้านธนารมย์
  {
    email: "admin.thana@email.com",
    username: "admin_thana",
    password_hash: "password123",
    phone: "0891234574",
    village_key: "thanarom-village-008",
    status: "verified"
  },
  // หมู่บ้านสวนสวรรค์
  {
    email: "admin.sawan@email.com",
    username: "admin_sawan",
    password_hash: "password123",
    phone: "0891234575",
    village_key: "suan-sawan-village-009",
    status: "verified"
  },
  // หมู่บ้านสุขุมวิท
  {
    email: "admin.sukhumvit@email.com",
    username: "admin_sukhumvit",
    password_hash: "password123",
    phone: "0891234576",
    village_key: "sukhumvit-village-010",
    status: "verified"
  },
  // หมู่บ้านรัชดา
  {
    email: "admin.ratchada@email.com",
    username: "admin_ratchada",
    password_hash: "password123",
    phone: "0891234577",
    village_key: "ratchada-village-011",
    status: "verified"
  },
  // หมู่บ้านลาดพร้าว
  {
    email: "admin.lad@email.com",
    username: "admin_lad",
    password_hash: "password123",
    phone: "0891234578",
    village_key: "ladprao-village-012",
    status: "verified"
  },
  // หมู่บ้านบางนา
  {
    email: "admin.bang@email.com",
    username: "admin_bang",
    password_hash: "password123",
    phone: "0891234579",
    village_key: "bangna-village-013",
    status: "pending"
  },
  // หมู่บ้านอโศก
  {
    email: "admin.asoke@email.com",
    username: "admin_asoke",
    password_hash: "password123",
    phone: "0891234580",
    village_key: "asoke-village-014",
    status: "pending"
  },
  // หมู่บ้านทองหล่อ
  {
    email: "admin.thong@email.com",
    username: "admin_thong",
    password_hash: "password123",
    phone: "0891234581",
    village_key: "thonglor-village-015",
    status: "pending"
  }
];





export async function clearDb() {
  // Check if villages or houses exist before deleting
  console.log("Clearing database");

  console.log("Clearing visitor_records");
  const existingVisitorRecords = await db.select().from(visitor_records).limit(1);
  if (existingVisitorRecords.length > 0) {
    await db.delete(visitor_records);
  }

  console.log("Clearing house_members");
  const existingHouseMembers = await db.select().from(house_members).limit(1);
  if (existingHouseMembers.length > 0) {
    await db.delete(house_members);
  }

  console.log("Clearing admins");
  const existingAdmins = await db.select().from(admins).limit(1);
  if (existingAdmins.length > 0) {
    await db.delete(admins);
  }

  console.log("Clearing guards");
  const existingGuards = await db.select().from(guards).limit(1);
  if (existingGuards.length > 0) {
    await db.delete(guards);
  }

  console.log("Clearing residents");
  const existingResidents = await db.select().from(residents).limit(1);
  if (existingResidents.length > 0) {
    await db.delete(residents);
  }

  console.log("Clearing houses");
  const existingHouses = await db.select().from(houses).limit(1);
  if (existingHouses.length > 0) {
    await db.delete(houses);
  }
  
  console.log("Clearing villages");
  const existingVillages = await db.select().from(villages).limit(1);
  if (existingVillages.length > 0) {
    await db.delete(villages);
  }
}

// Function to create house_members data by fetching existing houses and residents
async function createHouseMembersData() {
  console.log("Creating house_members data...");
  
  // Fetch all houses and residents from database
  const allHouses = await db.select().from(houses);
  const allResidents = await db.select().from(residents);
  
  const houseMembersData: Array<{ house_id: string; resident_id: string }> = [];
  
  // Group residents by village
  const residentsByVillage: Record<string, typeof allResidents> = {};
  for (const resident of allResidents) {
    if (resident.village_key && !residentsByVillage[resident.village_key]) {
      residentsByVillage[resident.village_key] = [];
    }
    if (resident.village_key) {
      residentsByVillage[resident.village_key].push(resident);
    }
  }
  
  // Group houses by village
  const housesByVillage: Record<string, typeof allHouses> = {};
  for (const house of allHouses) {
    if (house.village_key && !housesByVillage[house.village_key]) {
      housesByVillage[house.village_key] = [];
    }
    if (house.village_key) {
      housesByVillage[house.village_key].push(house);
    }
  }
  
  // Assign residents to houses in their village
  for (const villageKey in residentsByVillage) {
    const villageResidents = residentsByVillage[villageKey];
    const villageHouses = housesByVillage[villageKey] || [];
    
    if (villageHouses.length === 0) {
      console.log(`No houses found for village: ${villageKey}`);
      continue;
    }
    
    // Distribute residents across houses in the village
    for (let i = 0; i < villageResidents.length; i++) {
      const resident = villageResidents[i];
      const houseIndex = i % villageHouses.length; // Round-robin distribution
      const assignedHouse = villageHouses[houseIndex];
      
      houseMembersData.push({
        house_id: assignedHouse.house_id,
        resident_id: resident.resident_id,
      });
    }
  }
  
  console.log(`Created ${houseMembersData.length} house_members records`);
  return houseMembersData;
}

// Function to create visitor_records data by fetching existing data
async function createVisitorRecordsData() {
  console.log("Creating visitor_records data...");
  
  // Fetch all required data from database
  const allResidents = await db.select().from(residents);
  const allGuards = await db.select().from(guards);
  const allHouses = await db.select().from(houses);
  
  const visitorRecordsData: Array<{
    resident_id: string;
    guard_id: string;
    house_id: string;
    picture_key?: string;
    license_plate?: string;
    record_status: "approved" | "pending" | "rejected";
    visit_purpose?: string;
  }> = [];
  
  // Sample data for non-ID fields
  const samplePictureKeys = [
    "visitor_photo_001.jpg",
    "visitor_photo_002.jpg", 
    "visitor_photo_003.jpg",
    "visitor_photo_004.jpg",
    "visitor_photo_005.jpg",
    null
  ];
  
  const sampleLicensePlates = [
    "กข-1234",
    "คง-5678", 
    "จฉ-9012",
    "ชซ-3456",
    "ญฎ-7890",
    "ฏฐ-1234",
    "ฑฒ-5678",
    "ณด-9012",
    "ตถ-3456",
    "ทธ-7890",
    null
  ];
  
  const sampleVisitPurposes = [
    "เยี่ยมญาติ",
    "ส่งของ",
    "ซ่อมแซม",
    "ทำความสะอาด",
    "ตรวจสอบ",
    "ประชุม",
    "ติดตั้งอุปกรณ์",
    "ตรวจสอบระบบ",
    "เยี่ยมเพื่อน",
    "ธุรกิจ"
  ];
  
  const recordStatuses: Array<"approved" | "pending" | "rejected"> = ["approved", "pending", "rejected"];
  
  // Create visitor records for each resident
  for (const resident of allResidents) {
    // Find guards in the same village as the resident
    const guardsInSameVillage = allGuards.filter(
      guard => guard.village_key === resident.village_key
    );
    
    // Find houses in the same village as the resident
    const housesInSameVillage = allHouses.filter(
      house => house.village_key === resident.village_key
    );
    
    if (guardsInSameVillage.length > 0 && housesInSameVillage.length > 0) {
      // Create 1-3 visitor records per resident
      const numRecords = Math.floor(Math.random() * 3) + 1;
      
      for (let i = 0; i < numRecords; i++) {
        const randomGuard = guardsInSameVillage[Math.floor(Math.random() * guardsInSameVillage.length)];
        const randomHouse = housesInSameVillage[Math.floor(Math.random() * housesInSameVillage.length)];
        const randomPictureKey = samplePictureKeys[Math.floor(Math.random() * samplePictureKeys.length)];
        const randomLicensePlate = sampleLicensePlates[Math.floor(Math.random() * sampleLicensePlates.length)];
        const randomVisitPurpose = sampleVisitPurposes[Math.floor(Math.random() * sampleVisitPurposes.length)];
        const randomStatus = recordStatuses[Math.floor(Math.random() * recordStatuses.length)];
        
        visitorRecordsData.push({
          resident_id: resident.resident_id,
          guard_id: randomGuard.guard_id,
          house_id: randomHouse.house_id,
          picture_key: randomPictureKey || undefined,
          license_plate: randomLicensePlate || undefined,
          record_status: randomStatus,
          visit_purpose: randomVisitPurpose,
        });
      }
    }
  }
  
  console.log(`Created ${visitorRecordsData.length} visitor_records`);
  return visitorRecordsData;
}



async function seed() {
  await clearDb();
  console.log("Cleared database");
  console.log("Inserting villages");
  await db.insert(villages).values(villageData);
  console.log("Completed inserting villages");

  console.log("Inserting houses");
  await db.insert(houses).values(houseData);
  console.log("Completed inserting houses");

  console.log("Inserting residents");
  await db.insert(residents).values(residentData as any);
  console.log("Completed inserting residents");

  console.log("Inserting guards");
  await db.insert(guards).values(guardData as any);
  console.log("Completed inserting guards");

  console.log("Inserting admins");
  await db.insert(admins).values(adminData as any);
  console.log("Completed inserting admins");

  console.log("Creating and inserting house_members");
  const houseMembersData = await createHouseMembersData();
  if (houseMembersData.length > 0) {
    await db.insert(house_members).values(houseMembersData);
    console.log("Completed inserting house_members");
  } else {
    console.log("No house_members data to insert");
  }

  console.log("Creating and inserting visitor_records");
  const visitorRecordsData = await createVisitorRecordsData();
  if (visitorRecordsData.length > 0) {
    await db.insert(visitor_records).values(visitorRecordsData);
    console.log("Completed inserting visitor_records");
  } else {
    console.log("No visitor_records data to insert");
  }
}



// Run the seeding
seed().catch(console.error);
