import { notFound } from "next/navigation";
import { getCityConfig } from "@/config/cities";
import TimPhongClient from "./TimPhongClient";

interface Props {
  params: Promise<{ city: string }>;
}

export default async function TimPhongPage({ params }: Props) {
  const { city: citySlug } = await params;
  const city = getCityConfig(citySlug);
  if (!city || !city.available) notFound();

  return <TimPhongClient citySlug={citySlug} city={city} />;
}
