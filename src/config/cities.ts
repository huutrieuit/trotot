export interface CityConfig {
  slug: string;
  name: string;
  shortName: string;
  description: string;
  districts: string[];
  universities: string[];
  center: { lat: number; lng: number };
  zoom: number;
  available: boolean;
}

const CITIES: CityConfig[] = [
  {
    slug: "da-nang",
    name: "Đà Nẵng",
    shortName: "Đà Nẵng",
    description: "Thành phố đáng sống nhất Việt Nam – phòng trọ gần biển, gần trường ĐH",
    // Cấu trúc hành chính mới sau sáp nhập Quảng Nam (hiệu lực 01/07/2025):
    // Bỏ cấp quận/huyện, tổ chức lại thành 23 phường, 70 xã và 1 đặc khu Hoàng Sa
    districts: [
      // ── Phường (đô thị) ──
      "Phường Hải Châu",
      "Phường Hòa Cường",
      "Phường Thanh Khê",
      "Phường An Khê",
      "Phường An Hải",
      "Phường Sơn Trà",
      "Phường Ngũ Hành Sơn",
      "Phường Hòa Khánh",
      "Phường Liên Chiểu",
      "Phường Hải Vân",
      "Phường Cẩm Lệ",
      "Phường Hòa Xuân",
      "Phường Điện Bàn",
      "Phường Điện Bàn Bắc",
      "Phường Điện Bàn Đông",
      "Phường An Thắng",
      "Phường Hội An",
      "Phường Hội An Đông",
      "Phường Hội An Tây",
      "Phường Tam Kỳ",
      "Phường Quảng Phú",
      "Phường Hương Trà",
      "Phường Bàn Thạch",
      // ── Xã (gần đô thị, có nhu cầu thuê trọ) ──
      "Xã Hòa Vang",
      "Xã Hòa Tiến",
      "Xã Bà Nà",
      // ── Đặc khu ──
      "Đặc khu Hoàng Sa",
    ],
    universities: [
      "ĐH Duy Tân",
      "ĐH Đà Nẵng",
      "ĐH Đông Á",
      "ĐH Kiến trúc Đà Nẵng",
    ],
    center: { lat: 16.068, lng: 108.212 },
    zoom: 12,
    available: true,
  },
  {
    slug: "ho-chi-minh",
    name: "Hồ Chí Minh",
    shortName: "HCM",
    description: "Trung tâm kinh tế lớn nhất – hàng nghìn phòng trọ trung tâm và ngoại ô",
    districts: [
      "Quận 1",
      "Quận 3",
      "Quận 4",
      "Quận 5",
      "Quận 7",
      "Quận 10",
      "Bình Thạnh",
      "Gò Vấp",
      "Tân Bình",
      "Thủ Đức",
    ],
    universities: [
      "ĐH Bách Khoa HCM",
      "ĐH KHTN HCM",
      "ĐH Kinh tế HCM",
      "ĐH Sư phạm HCM",
    ],
    center: { lat: 10.762, lng: 106.66 },
    zoom: 12,
    available: false,
  },
  {
    slug: "ha-noi",
    name: "Hà Nội",
    shortName: "Hà Nội",
    description: "Thủ đô ngàn năm văn hiến – phòng trọ gần các trường top và khu công nghệ",
    districts: [
      "Hoàn Kiếm",
      "Đống Đa",
      "Ba Đình",
      "Cầu Giấy",
      "Thanh Xuân",
      "Hà Đông",
      "Long Biên",
      "Hoàng Mai",
    ],
    universities: [
      "ĐH Bách Khoa HN",
      "ĐH Quốc gia HN",
      "ĐH Kinh tế Quốc dân",
      "Học viện Công nghệ Bưu chính Viễn thông",
    ],
    center: { lat: 21.028, lng: 105.834 },
    zoom: 12,
    available: false,
  },
];

export function getCityConfig(slug: string): CityConfig | undefined {
  return CITIES.find((c) => c.slug === slug);
}

export function getAvailableCities(): CityConfig[] {
  return CITIES.filter((c) => c.available);
}

export function getAllCities(): CityConfig[] {
  return CITIES;
}

export default CITIES;
